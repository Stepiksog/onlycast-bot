const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;
const PORT = Number(process.env.PORT || 8080);

console.log("BOT_TOKEN exists:", !!BOT_TOKEN);
console.log("ADMIN_CHAT_ID:", ADMIN_CHAT_ID);
console.log("RAILWAY_PUBLIC_DOMAIN:", RAILWAY_PUBLIC_DOMAIN);

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set");
if (!ADMIN_CHAT_ID) throw new Error("ADMIN_CHAT_ID is not set");
if (!RAILWAY_PUBLIC_DOMAIN) throw new Error("RAILWAY_PUBLIC_DOMAIN is not set");

const bot = new Telegraf(BOT_TOKEN);

bot.use(async (ctx, next) => {
  console.log("UPDATE TYPE:", ctx.updateType);
  console.log("UPDATE RAW:", JSON.stringify(ctx.update, null, 2));
  return next();
});

bot.catch((err) => {
  console.error("BOT ERROR:", err);
});

bot.start(async (ctx) => {
  await ctx.reply(
    "Бот запущен. Открой Mini App через кнопку меню бота.",
    Markup.removeKeyboard()
  );
});

bot.command("test", async (ctx) => {
  await ctx.reply("Бот работает.", Markup.removeKeyboard());
});

bot.command("chatid", async (ctx) => {
  await ctx.reply(`chat_id: ${ctx.chat.id}`, Markup.removeKeyboard());
});

bot.command("hide", async (ctx) => {
  await ctx.reply("Клавиатура скрыта.", Markup.removeKeyboard());
});

bot.on("message", async (ctx, next) => {
  console.log("NEW MESSAGE:", JSON.stringify(ctx.message, null, 2));

  const raw = ctx.message?.web_app_data?.data;

  if (!raw) {
    console.log("MESSAGE WITHOUT web_app_data");
    return next();
  }

  try {
    console.log("WEB_APP_DATA RAW:", raw);

    const data = JSON.parse(raw);

    const service = data.serviceTitle || "Не указано";
    const date = data.shootDate || "Не указана";
    const slots =
      Array.isArray(data.selectedSlots) && data.selectedSlots.length
        ? data.selectedSlots.join(", ")
        : "Не выбраны";
    const editing = data.needEditing ? "Да" : "Нет";
    const total = Number(data.estimate?.total ?? 0);
    const name = data.lead?.name || "Не указано";
    const telegram = data.lead?.telegramContact || "Не указано";
    const comment = data.lead?.comment || "—";

    const text =
      `🎙 Новая заявка OnlyCast\n\n` +
      `Услуга: ${service}\n` +
      `Дата: ${date}\n` +
      `Время: ${slots}\n` +
      `Монтаж: ${editing}\n` +
      `Итого: ${total.toLocaleString("ru-RU")} ₽\n\n` +
      `Имя: ${name}\n` +
      `Telegram: ${telegram}\n` +
      `Комментарий: ${comment}`;

    await ctx.reply("Заявка получена ботом.", Markup.removeKeyboard());
    console.log("TRY SEND TO GROUP:", ADMIN_CHAT_ID);

    const sent = await ctx.telegram.sendMessage(ADMIN_CHAT_ID, text);
    console.log("SENT TO GROUP OK:", sent.message_id);
  } catch (error) {
    console.error("FAILED TO PROCESS OR SEND:", error);
    await ctx.reply("Ошибка при обработке заявки.", Markup.removeKeyboard());
  }
});

const webhookPath = "/telegram-webhook";
const webhookUrl = `https://${RAILWAY_PUBLIC_DOMAIN}${webhookPath}`;

async function start() {
  try {
    await bot.telegram.deleteWebhook({ drop_pending_updates: true });
    console.log("OLD WEBHOOK DELETED");

    await bot.telegram.setWebhook(webhookUrl);
    console.log("WEBHOOK SET:", webhookUrl);

    bot.startWebhook(webhookPath, null, PORT);
    console.log(`OnlyCast bot started via webhook on port ${PORT}`);
  } catch (error) {
    console.error("WEBHOOK START ERROR:", error);
    process.exit(1);
  }
}

start();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
