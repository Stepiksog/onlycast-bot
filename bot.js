const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is not set");
if (!ADMIN_CHAT_ID) throw new Error("ADMIN_CHAT_ID is not set");

const bot = new Telegraf(BOT_TOKEN);

bot.command("test", async (ctx) => {
  await ctx.reply("Бот работает.");
});

bot.on("message", async (ctx, next) => {
  const raw = ctx.message?.web_app_data?.data;

  if (!raw) {
    return next();
  }

  try {
    const data = JSON.parse(raw);

    const service = data.serviceTitle || "Не указано";
    const date = data.shootDate || "Не указана";
    const slots =
      Array.isArray(data.selectedSlots) && data.selectedSlots.length
        ? data.selectedSlots.join(", ")
        : "Не выбраны";
    const editing = data.needEditing ? "Да" : "Нет";
    const total = data.estimate?.total ?? 0;
    const name = data.lead?.name || "Не указано";
    const telegram = data.lead?.telegramContact || "Не указано";
    const comment = data.lead?.comment || "—";

    const text =
      `🎙 Новая заявка OnlyCast\n\n` +
      `Услуга: ${service}\n` +
      `Дата: ${date}\n` +
      `Время: ${slots}\n` +
      `Монтаж: ${editing}\n` +
      `Итого: ${Number(total).toLocaleString("ru-RU")} ₽\n\n` +
      `Имя: ${name}\n` +
      `Telegram: ${telegram}\n` +
      `Комментарий: ${comment}`;

    await ctx.telegram.sendMessage(ADMIN_CHAT_ID, text);
    await ctx.reply("Заявка отправлена. Мы свяжемся с Вами для подтверждения.");
  } catch (error) {
    console.error("Failed to process web_app_data:", error);
    await ctx.reply("Не удалось обработать заявку. Попробуйте ещё раз.");
  }
});

bot.launch();
console.log("OnlyCast bot started");
