// Vercel serverless function: POST /api/send  ->  Telegram bot
// Set in Vercel > Project > Settings > Environment Variables:
//   TELEGRAM_BOT_TOKEN = 123456:ABC...   (from @BotFather)
//   TELEGRAM_CHAT_ID   = 123456789       (your chat id, e.g. from @userinfobot)
export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST")
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  const body =
    typeof req.body === "string" ? safeParse(req.body) : req.body || {};
  if (body.website) return res.status(200).json({ ok: true }); // honeypot (bots)
  const name = String(body.name || "")
    .trim()
    .slice(0, 60);
  const contact = String(body.contact || "")
    .trim()
    .slice(0, 80);
  const message = String(body.message || "")
    .trim()
    .slice(0, 1200);
  if (!name || message.length < 3)
    return res
      .status(400)
      .json({ ok: false, error: "Name and message are required" });
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    return res
      .status(500)
      .json({
        ok: false,
        error:
          "Telegram bot is not configured yet (missing TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID)",
      });
  }
  const text = `📩 New message — portfolio\n\n👤 ${name}\n↩ ${contact || "—"}\n\n💬 ${message}`;
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text,
        disable_web_page_preview: true,
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok)
      return res
        .status(502)
        .json({ ok: false, error: j.description || "Telegram error" });
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "Network error" });
  }
}
function safeParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
