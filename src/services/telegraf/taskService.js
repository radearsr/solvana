const logger = require("../../utils/winstonUtils");
const {
  askToCategories,
  askToGenerateJson,
} = require("../groq/conversationService");
const {
  solvanaService,
  requestDownloadFile,
} = require("../axios/solvanaServices");
const {
  parseCurrentContext,
  matchesChatTitle,
} = require("../../utils/telegrafUtils");
const fileUtils = require("../../utils/fileUtils");

async function handleSendFileFromResponse(files, ctx) {
  files.forEach((groupVouchers) => {
    groupVouchers.files.forEach(async (voucher) => {
      const downloadedFile = await requestDownloadFile(voucher);
      const fileDetail = fileUtils.getDetailsFromFile(voucher, downloadedFile);
      await ctx.replyWithDocument(
        {
          source: fileDetail.source,
          filename: fileDetail.filename,
        },
        {
          caption: `File Voucher ${fileDetail.filename}`,
          reply_to_message_id: ctx.message.message_id,
        },
      );
      fileUtils.deleteFile(downloadedFile);
    });
  });
}

async function handleMessageGeneralTask(ctx, textMessage) {
  try {
    const { botUsername, chatType, fullname, message, chatTitle } =
      parseCurrentContext(ctx, textMessage);
    const isPrivateChat = chatType === "private";
    const isBotSummoned = textMessage.includes(botUsername);
    if (!isPrivateChat && !isBotSummoned) {
      logger.warn("Chat is not private and bot is not summoned");
      return;
    }
    await ctx.sendChatAction("typing");
    const chatGroup = matchesChatTitle(chatTitle);
    const askTemplate = `Dari ${fullname}, Group: ${chatGroup}, Pesan: ${message}`;
    const category = await askToCategories(askTemplate);
    logger.warn(JSON.stringify({ category }));
    ctx.reply(category.resultMessage, {
      reply_to_message_id: ctx.message.message_id,
    });
    await ctx.sendChatAction("typing");
    if (category.categoryName.includes("COMMON_CHAT")) {
      const responseRag = await solvanaService(category.endpoint, {
        query: message,
      });
      return ctx.reply(responseRag.answer, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
    const bodyJson = await askToGenerateJson(
      message,
      category.body,
      category.description,
    );
    const resSolvanaApi = await solvanaService(category.endpoint, bodyJson);
    if (category.responseType === "file") {
      await handleSendFileFromResponse(resSolvanaApi.data.createdFiles, ctx);
    }
    const resultAnalize =
      await askToCategories(`Permintaan dari: ${fullname}, Service yang dijalankan yaitu hit api ${category.endpoint}, coba simpulkan hasil dari response API ini jika ada kendala coba CC tag @radea_surya
    ${JSON.stringify(resSolvanaApi)}| tidak usah jawab dengan format`);
    ctx.reply(resultAnalize.resultMessage, {
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (error) {
    logger.error(error);
  }
}

module.exports = { handleMessageGeneralTask };
