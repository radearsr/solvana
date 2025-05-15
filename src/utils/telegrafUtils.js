const logger = require("./winstonUtils");

exports.parseCurrentContext = (ctx, textMessage) => {
  logger.warn(JSON.stringify(ctx.message, null, 2));
  const isReply = ctx.message.hasOwnProperty("reply_to_message");
  const replyMessage = isReply ? ctx.message.reply_to_message.text : "";
  const replyFullname = isReply
    ? ctx.message.reply_to_message.from.first_name +
      " " +
      ctx.message.reply_to_message.from.last_name
    : "";
  const botUsername = ctx.botInfo.username;
  const chatType = ctx.chat.type;
  const defaultFullname = ctx.from.first_name + " " + ctx.from.last_name;
  const fullname = isReply ? replyFullname : defaultFullname;
  const message = isReply ? replyMessage : textMessage;
  const chatTitle = ctx.message.chat.title || "PRIVATE";
  logger.info(
    JSON.stringify({
      botUsername,
      chatType,
      fullname,
      isReply,
      message,
      chatTitle,
      replyFullname,
    }),
  );
  return {
    botUsername,
    chatType,
    fullname,
    isReply,
    replyMessage,
    chatTitle,
    replyFullname,
    message,
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
  };
  return templateUrl.replace(/{{(.*?)}}/g, (_, key) => envs[key] || "");
};
