const logger = require("./winstonUtils");

exports.parseCurrentContext = (ctx, textMessage) => {
  logger.warn(JSON.stringify(ctx.message, null, 2));
  const isReply = !!ctx.message.reply_to_message;
  const message = isReply
    ? ctx.message.reply_to_message?.text || ctx.message?.text
    : textMessage;
  const replyFullname = isReply
    ? `${ctx.message.reply_to_message.from.first_name || ""} ${ctx.message.reply_to_message.from.last_name || ""}`.trim()
    : "";
  const document = isReply
    ? ctx.message.reply_to_message?.document
    : ctx.message.document;
  const botUsername = ctx.botInfo.username;
  const chatType = ctx.chat.type;
  const defaultFullname =
    `${ctx.from.first_name || ""} ${ctx.from.last_name || ""}`.trim();
  const fullname = isReply ? replyFullname : defaultFullname;
  const chatTitle = ctx.message.chat.title || "PRIVATE";
  logger.info(
    JSON.stringify(
      {
        botUsername,
        chatType,
        fullname,
        isReply,
        message,
        chatTitle,
        replyFullname,
        document,
      },
      null,
      2,
    ),
  );
  return {
    botUsername,
    chatType,
    fullname,
    isReply,
    chatTitle,
    replyFullname,
    message,
    document,
  };
};

exports.matchesChatTitle = (chatTitle) => {
  const chatMessageTitleMap = {
    "Testing Send BOT NodeJS 2": "UNITEDPAY",
    "IT-CS UNITEDPAY": "UNITEDPAY",
    "IT-CS MURAPAY": "MURAPAY",
  };
  return chatMessageTitleMap[chatTitle]
    ? chatMessageTitleMap[chatTitle]
    : "Private Chat";
};

exports.parseInstanceUrl = (templateUrl) => {
  const envs = {
    GENERAL_API_INSTANCE: process.env.GENERAL_API_INSTANCE,
    RAG_API_INSTANCE: process.env.RAG_API_INSTANCE,
    PUPPTEER_API_ENDPOINT: process.env.PUPPTEER_API_ENDPOINT,
  };
  return templateUrl.replace(/{{(.*?)}}/g, (_, key) => envs[key] || "");
};
