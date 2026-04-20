const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set");
if (!ADMIN_CHAT_ID) throw new Error("ADMIN_CHAT_ID is not set");

const bot = new Telegraf(BOT_TOKEN);

bot.on("message", async (ctx, next) => {
  const raw = ctx.message?.web_app_data?.data;
  if (!raw) return next();

  try {
    const data = JSON.parse(raw);

    const text =
      `🎙 Новая заявка OnlyCast\n\n` +
      `Услуга: ${data.serviceTitle || "Не указано"}\n` +
      `Дата: ${data.shootDate || "Не указана"}\n` +
      `Время: ${(data.selectedSlots || []).join(", ") || "Не выбрано"}\n` +
      `Монтаж: ${data.needEditing ? "Да" : "Нет"}\n` +
      `Итого: ${(data.estimate?.total ?? 0).toLocaleString("ru-RU")} ₽\n\n` +
      `Имя: ${data.lead?.name || "-"}\n` +
      `Telegram: ${data.lead?.telegramContact || "-"}\n` +
      `Комментарий: ${data.lead?.comment || "-"}`;

    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, text);
    await ctx.reply("Заявка отправлена. Мы свяжемся с Вами для подтверждения.");
  } catch (error) {
    console.error(error);
    await ctx.reply("Не удалось обработать заявку. Попробуйте ещё раз.");
  }
});

bot.command("test", async (ctx) => {
  await ctx.reply("Бот работает.");
});

bot.launch();
console.log("OnlyCast bot started");