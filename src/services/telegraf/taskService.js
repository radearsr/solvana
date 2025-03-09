const logger = require("../../utils/winstonUtils");
const {
  askToCategories,
  askToAnalizeResponse,
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
    const chatGroup = chatMessageTitleMap[chatTitle];
    const resultCategory = await askToCategories(
      `Dari ${fullname}, Group: ${chatGroup}, Pesan: ${message}`,
    );
    logger.warn(JSON.stringify(JSON.stringify({ resultCategory })));
    if (!resultCategory.endpoint) {
      return ctx.reply(resultCategory.resultMessage, {
        reply_to_message_id: ctx.message.message_id,
      });
    }
    ctx.reply(resultCategory.resultMessage, {
      reply_to_message_id: ctx.message.message_id,
    });
    const { endpoint, body } = resultCategory;
    const response = await requestToSolvanaServices(endpoint, body);
    console.log({ response });
    const resultAnalize =
      await askToCategories(`Permintaan dari: ${fullname}, Service yang dijalankan yaitu hit api ${endpoint}, coba simpulkan hasil dari response API ini jika ada kendala coba CC tag @radea_surya
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
