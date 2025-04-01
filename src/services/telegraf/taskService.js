const logger = require("../../utils/winstonUtils");
const {
  askToCategories,
  askToGenerateJson,
} = require("../groq/conversationService");
const { requestToSolvanaServices } = require("../axios/solvanaServices");
const { parseCurrentContext } = require("../../utils/telegrafUtils");

const chatMessageTitleMap = {
  "Testing Send BOT NodeJS 2": "MURAPAY",
  "IT-CS UNITEDPAY": "UNITEDPAY",
  "IT-CS MURAPAY": "MURAPAY",
};

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
    const chatGroup = chatMessageTitleMap[chatTitle]
      ? chatMessageTitleMap[chatTitle]
      : "Private Chat";
    const resultCategory = await askToCategories(
      `Dari ${fullname}, Group: ${chatGroup}, Pesan: ${message}`,
    );
    logger.warn(JSON.stringify({ resultCategory }));
    ctx.reply(resultCategory.resultMessage, {
      reply_to_message_id: ctx.message.message_id,
    });
    await ctx.sendChatAction("typing");
    if (resultCategory.categoryName.includes("COMMON_CHAT")) {
      const responseRag = await requestToSolvanaServices(
        resultCategory.endpoint,
        {
          query: message,
        },
      );
      return ctx.reply(responseRag.answer, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
    const bodyJson = await askToGenerateJson(
      message,
      resultCategory.body,
      resultCategory.description,
    );
    const response = await requestToSolvanaServices(
      resultCategory.endpoint,
      bodyJson,
    );
    const resultAnalize =
      await askToCategories(`Permintaan dari: ${fullname}, Service yang dijalankan yaitu hit api ${resultCategory.endpoint}, coba simpulkan hasil dari response API ini jika ada kendala coba CC tag @radea_surya
    ${JSON.stringify(response)}| tidak usah jawab dengan format`);
    ctx.reply(resultAnalize.resultMessage, {
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (error) {
    console.log(error);
    logger.error(JSON.stringify({ error }));
  }
}

module.exports = { handleMessageGeneralTask };
