const logger = require("../../utils/winstonUtils");
const {
  askToCategories,
  askToAnalizeResponse,
} = require("../groq/conversationService");
const {
  uploadVerificationImage,
  enableUserNonActive,
} = require("../axios/unitedpayService");

const categoryHandler = {
  ENABLE_USER_NON_ACTIVE: async (title, agenCode) =>
    enableUserNonActive(title, agenCode),
  OPEN_KYC_IMAGE: async (title, agenCode) =>
    uploadVerificationImage(title, agenCode),
  COMMON_CHAT: "Action Null",
};

const chatMessageTitleMap = {
  "Testing Send BOT NodeJS 2": "UNITEDPAY",
  "IT-CS UNITEDPAY": "UNITEDPAY",
  "IT-CS MURAPAY": "MURAPAY",
};

async function handleMessageGeneralTask(ctx, textMessage) {
  try {
    const botUsername = ctx.botInfo.username;
    const chatType = ctx.chat.type;
    const fullname = ctx.from.first_name + " " + ctx.from.last_name;
    const chatTitle = ctx.message.chat.title || "PRIVATE";
    logger.info(
      JSON.stringify({
        botUsername,
        chatType,
        fullname,
        textMessage,
        chatTitle,
      }),
    );
    const isPrivateChat = chatType === "private";
    const isBotSummoned = textMessage.includes(botUsername);
    if (!isPrivateChat && !isBotSummoned) {
      logger.warn("Chat is not private and bot is not summoned");
      return;
    }
    const resultCategory = await askToCategories(textMessage);
    logger.warn(JSON.stringify(JSON.stringify({ resultCategory })));
    const [category, agenCode] = resultCategory.split("|");
    const handler = categoryHandler[category];
    const titleHandler = chatMessageTitleMap[chatTitle];
    const responseHandler = await handler(titleHandler, agenCode);
    const resultAnalize = await askToAnalizeResponse(responseHandler);
    ctx.reply(resultAnalize, {
      reply_to_message_id: ctx.message.message_id,
    });
  } catch (error) {
    logger.error(JSON.stringify({ error }));
  }
}

module.exports = { handleMessageGeneralTask };
