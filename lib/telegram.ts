import { getSupabaseAdmin } from "@/lib/supabase";

// Telegram alerts for 3D Store payments only. Configured with two server-side env vars:
//   TELEGRAM_BOT_TOKEN  — from @BotFather
//   TELEGRAM_CHAT_ID    — the chat/user that should receive the alerts
// If either is missing the alert is skipped silently; a Telegram failure never affects checkout.

export type PaymentAlertItem = { title: string; priceUsd: number; priceKhr: number };
export type PaymentAlert = {
  orderNumber: string;
  submittedAt: Date;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: PaymentAlertItem[];
  paidToAccount: string;
  paymentReference: string;
  screenshotPath: string;
  reviewUrl: string;
};

const escapeHtml = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
}

function formatWhen(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Phnom_Penh", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true }).format(date);
}

export function buildPaymentMessage(alert: PaymentAlert) {
  const totalUsd = alert.items.reduce((sum, item) => sum + item.priceUsd, 0);
  const totalKhr = alert.items.reduce((sum, item) => sum + item.priceKhr, 0);
  const line = "━━━━━━━━━━━━━━━━━━";
  const items = alert.items.map((item, i) => `${i + 1}. ${escapeHtml(clip(item.title, 60))} — <b>$${item.priceUsd.toFixed(2)}</b>`).join("\n");
  const account = alert.paidToAccount.trim();

  return [
    "💰 <b>NEW PAYMENT RECEIVED</b>",
    line,
    `🧾 <b>Order:</b> <code>${escapeHtml(alert.orderNumber)}</code>`,
    `🕒 <b>Time:</b> ${escapeHtml(formatWhen(alert.submittedAt))}`,
    "",
    "👤 <b>CUSTOMER</b>",
    `Name: ${escapeHtml(clip(alert.customerName, 60))}`,
    `Email: ${escapeHtml(clip(alert.customerEmail, 80))}`,
    alert.customerPhone ? `Phone: ${escapeHtml(clip(alert.customerPhone, 30))}` : "",
    "",
    `🛒 <b>ITEMS (${alert.items.length})</b>`,
    items,
    line,
    `💵 <b>TOTAL: $${totalUsd.toFixed(2)}</b>${totalKhr > 0 ? `  (${totalKhr.toLocaleString("en-US")}៛)` : ""}`,
    "",
    "🏦 <b>PAID TO ACCOUNT</b>",
    account ? escapeHtml(clip(account, 220)) : "Not set in dashboard",
    "",
    `🔖 <b>Reference:</b> ${alert.paymentReference ? `<code>${escapeHtml(clip(alert.paymentReference, 60))}</code>` : "—"}`,
    alert.screenshotPath ? "📎 Payment screenshot attached" : "",
    "",
    "⏳ <i>Status: awaiting your review</i>",
  ].filter((part, i, all) => part !== "" || (all[i - 1] !== "" && i !== 0)).join("\n");
}

async function telegramCall(method: string, payload: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN!.trim();
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as { ok?: boolean; description?: string };
  if (!response.ok || !body.ok) throw new Error(body.description || `Telegram ${method} failed (${response.status})`);
}

/** Never throws. Returns true when the alert was delivered. */
export async function sendPaymentTelegramAlert(alert: PaymentAlert): Promise<boolean> {
  if (!telegramConfigured()) return false;
  const chatId = process.env.TELEGRAM_CHAT_ID!.trim();
  const text = buildPaymentMessage(alert);
  const replyMarkup = { inline_keyboard: [[{ text: "✅ Review & Approve", url: alert.reviewUrl }]] };

  try {
    // Preferred: the screenshot with the details as its caption, in one message.
    if (alert.screenshotPath && text.length <= 1000) {
      try {
        const { data } = await getSupabaseAdmin().storage.from("product-downloads").createSignedUrl(alert.screenshotPath, 600);
        if (data?.signedUrl) {
          await telegramCall("sendPhoto", { chat_id: chatId, photo: data.signedUrl, caption: text, parse_mode: "HTML", reply_markup: replyMarkup });
          return true;
        }
      } catch (error) {
        console.error("Telegram photo alert failed, falling back to text", error instanceof Error ? error.message : error);
      }
    }
    await telegramCall("sendMessage", { chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: replyMarkup });
    return true;
  } catch (error) {
    console.error("Telegram payment alert failed", error instanceof Error ? error.message : error);
    return false;
  }
}
