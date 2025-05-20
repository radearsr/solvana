const logger = require("../../utils/winstonUtils");
const {
  askToCategories,
  askToGenerateJson,
} = require("../groq/conversationService");
const {
  solvanaService,
  requestDownloadFile,
  requestDownloadFileFromUrl,
} = require("../axios/solvanaServices");
const {
  parseCurrentContext,
  matchesChatTitle,
  parseInstanceUrl,
} = require("../../utils/telegrafUtils");
const fileUtils = require("../../utils/fileUtils");

async function handleMessageToTask(ctx, textMessage) {
  try {
    logger.debug("handleMessageToTask");
    const { botUsername, chatType, fullname, message, chatTitle, document } =
      parseCurrentContext(ctx, textMessage);
    const isPrivateChat = chatType === "private";
    const isBotSummoned = textMessage.includes(botUsername);
    const isDocument =
      document !== undefined && document !== null && document !== "";
    if (!isPrivateChat && !isBotSummoned) {
      logger.warn("Chat is not private and bot is not summoned");
      return;
    }
    if (isDocument) {
      return handleTaskWithFile(ctx, {
        fullname,
        message,
        document,
      });
    }
    return handleGeneralTask(ctx, {
      chatTitle,
      fullname,
      message,
    });
  } catch (error) {
    logger.error(error);
  }
}

async function handleGeneralTask(ctx, { chatTitle, fullname, message }) {
  try {
    logger.debug("handleGeneralTask");
    const chatGroup = matchesChatTitle(chatTitle);
    const askTemplate = `Dari ${fullname}, Group: ${chatGroup}, Pesan: ${message}`;
    const category = await askToCategories(askTemplate);
    logger.warn(JSON.stringify({ category }));
    ctx.reply(category.resultMessage, {
      reply_to_message_id: ctx.message.message_id,
    });
    await ctx.sendChatAction("typing");
    if (category.categoryName.includes("COMMON_CHAT")) {
      return handleRagKnowledge(ctx, {
        chatTitle,
        fullname,
        message,
        category,
      });
    }
    const bodyJson = await askToGenerateJson(
      message,
      category.body,
      category.description,
    );
    const apiEndpoint = parseInstanceUrl(category.endpoint);
    const resSolvanaApi = await solvanaService(apiEndpoint, bodyJson);
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

async function handleTaskWithFile(ctx, { fullname, message, document }) {
  try {
    logger.debug("handleTaskWithFile");
    console.log({ fullname, message, document });
    const askTemplate = `Dari ${fullname}, Pesan: ${message}, Detail File Telegram: ${JSON.stringify(
      document,
    )}`;
    const category = await askToCategories(askTemplate);
    logger.warn(JSON.stringify({ category }));
    await ctx.sendChatAction("typing");
    ctx.reply(category.resultMessage, {
      reply_to_message_id: ctx.message.message_id,
    });
    const bodyJson = await askToGenerateJson(
      askTemplate,
      category.body,
      category.description,
    );
    const apiEndpoint = parseInstanceUrl(category.endpoint);
    const resSolvanaApi = await solvanaService(apiEndpoint, bodyJson);
    if (
      category.responseType === "file" &&
      resSolvanaApi.data?.fileDownloadUrl !== ""
    ) {
      await handleSendSingleFileFromResponse(
        resSolvanaApi.data.fileDownloadUrl,
        ctx,
      );
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

async function handleRagKnowledge(ctx, { category, message }) {
  logger.debug("handleRagKnowledge");
  const responseRag = await solvanaService(category.endpoint, {
    query: message,
  });
  return ctx.reply(responseRag.answer, {
    reply_to_message_id: ctx.message.message_id,
  });
}

async function handleSendFileFromResponse(files, ctx) {
  logger.debug("handleSendFileFromResponse");
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

async function handleSendSingleFileFromResponse(file, ctx) {
  logger.debug("handleSendSingleFileFromResponse");
  const downloadedFile = await requestDownloadFileFromUrl(file);
  logger.debug(
    `handleSendSingleFileFromResponse: ${JSON.stringify(downloadedFile)}`,
  );
  const fileDetail = fileUtils.getDetailsFromFile(
    downloadedFile,
    downloadedFile,
  );
  await ctx.replyWithDocument(
    {
      source: fileDetail.source,
      filename: fileDetail.filename,
    },
    {
      caption: `File Excel ${fileDetail.filename}`,
      reply_to_message_id: ctx.message.message_id,
    },
  );
  fileUtils.deleteFile(downloadedFile);
}

module.exports = { handleMessageToTask };
