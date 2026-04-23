const { Telegraf, Markup } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const MINI_APP_URL = process.env.MINI_APP_URL;
const RAILWAY_PUBLIC_DOMAIN = process.env.RAILWAY_PUBLIC_DOMAIN;
const PORT = Number(process.env.PORT || 8080);

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set");
if (!ADMIN_CHAT_ID) throw new Error("ADMIN_CHAT_ID is not set");
if (!MINI_APP_URL) throw new Error("MINI_APP_URL is not set");
if (!RAILWAY_PUBLIC_DOMAIN) throw new Error("RAILWAY_PUBLIC_DOMAIN is not set");

const bot = new Telegraf(BOT_TOKEN);

// 🔵 ВОТ ЭТА ФУНКЦИЯ ВОЗВРАЩАЕТ БОЛЬШУЮ КНОПКУ
function mainKeyboard() {
  return Markup.keyboard([
    [Markup.button.webApp("Открыть запись в студию", MINI_APP_URL)],
  ]).resize();
}

bot.start(async (ctx) => {
  await ctx.reply(
    "Нажмите кнопку ниже, чтобы открыть запись.",
    mainKeyboard()
  );
});

bot.command("show", async (ctx) => {
  await ctx.reply("Кнопка возвращена.", mainKeyboard());
});

bot.command("test", async (ctx) => {
  await ctx.reply("Бот работает.", mainKeyboard());
});

// обработка заявок
bot.on("message", async (ctx, next) => {
  const raw = ctx.message?.web_app_data?.data;

  if (!raw) return next();

  try {
    const data = JSON.parse(raw);

    const text =
      `🎙 Новая заявка OnlyCast\n\n` +
      `Услуга: ${data.serviceTitle || "Не указано"}\n` +
      `Дата: ${data.shootDate || "Не указана"}\n` +
      `Время: ${(data.selectedSlots || []).join(", ") || "Не выбраны"}\n` +
      `Монтаж: ${data.needEditing ? "Да" : "Нет"}\n` +
      `Итого: ${Number(data.estimate?.total ?? 0).toLocaleString("ru-RU")} ₽\n\n` +
      `Имя: ${data.lead?.name || "Не указано"}\n` +
      `Telegram: ${data.lead?.telegramContact || "Не указано"}\n` +
      `Комментарий: ${data.lead?.comment || "—"}`;

    await ctx.reply("Заявка получена ботом.", mainKeyboard());
    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, text);
  } catch (error) {
    await ctx.reply("Ошибка при обработке заявки.", mainKeyboard());
  }
});

// webhook
const webhookPath = "/telegram-webhook";
const webhookUrl = `https://${RAILWAY_PUBLIC_DOMAIN}${webhookPath}`;

async function start() {
  await bot.telegram.deleteWebhook({ drop_pending_updates: true });
  await bot.telegram.setWebhook(webhookUrl);
  bot.startWebhook(webhookPath, null, PORT);
}

start();
