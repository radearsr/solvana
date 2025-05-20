require("dotenv").config();
const { Telegraf } = require("telegraf");
const bot = new Telegraf(process.env.BOT_TOKEN);
const logger = require("./utils/winstonUtils");

const { handleMessageToTask } = require("./services/telegraf/taskService");

bot.start((ctx) => ctx.reply("Selamat Datang saya Solvana siap membantu anda"));

bot.on("text", async (ctx) => {
  const textMessage = ctx.message.text;
  await handleMessageToTask(ctx, textMessage);
});

bot.on("photo", async (ctx) => {
  const textMessage = ctx.message.caption;
  await handleMessageToTask(ctx, textMessage);
});

bot.on("document", async (ctx) => {
  const textMessage = ctx.message.caption;
  await handleMessageToTask(ctx, textMessage);
});

bot.launch();
logger.info("Bot is running");
