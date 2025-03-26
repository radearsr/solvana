const logger = require("./winstonUtils");

exports.parseCurrentContext = (ctx, textMessage) => {
  logger.warn(JSON.stringify(ctx));
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
      replyMessage,
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
