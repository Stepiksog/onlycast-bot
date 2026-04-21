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
  console.log("NEW MESSAGE:", JSON.stringify(ctx.message, null, 2));

  const raw = ctx.message?.web_app_data?.data;

  if (!raw) {
    return next();
  }

  try {
    console.log("WEB_APP_DATA RAW:", raw);

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

    await ctx.reply("Заявка получена ботом.");
    console.log("TRY SEND TO GROUP:", ADMIN_CHAT_ID);

    const sent = await ctx.telegram.sendMessage(ADMIN_CHAT_ID, text);
    console.log("SENT TO GROUP OK:", sent.message_id);
  } catch (error) {
    console.error("FAILED TO PROCESS OR SEND:", error);
    await ctx.reply("Ошибка при обработке заявки.");
  }
});

bot.launch();
console.log("OnlyCast bot started");
