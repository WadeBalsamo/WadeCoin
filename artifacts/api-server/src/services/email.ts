import { logger } from "../lib/logger";

const RESEND_API_KEY = process.env["RESEND_API_KEY"];
// Resend free tier only allows sending to the account owner's verified address.
// Set RESEND_TO_EMAIL in secrets to override (requires a verified domain).
const TO_EMAIL = process.env["RESEND_TO_EMAIL"] ?? "wade53152@gmail.com";
const FROM_EMAIL = "WadeCoin Bookings <onboarding@resend.dev>";

export interface BookingEmailData {
  booking_id: string;
  user_name: string;
  user_email: string;
  mode: string;
  slot_id: string;
  notes?: string | null;
  payment_tx_hash?: string | null;
  package_hours?: number | null;
  user_address?: string | null;
}

function formatSlotTime(slotId: string): string {
  const ts = parseInt(slotId.replace("slot_", ""), 10);
  if (isNaN(ts)) return slotId;
  return new Date(ts).toUTCString();
}

function buildEmailHtml(b: BookingEmailData): string {
  const modeLabel = b.mode === "discovery" ? "🔍 Discovery Call (Free · 30 min)" : "💼 Consulting Project (Paid · 60 min)";
  const slotTime = formatSlotTime(b.slot_id);
  const rows = [
    ["Booking ID", b.booking_id],
    ["Mode", modeLabel],
    ["Name", b.user_name],
    ["Email", b.user_email],
    ["Slot", slotTime],
    b.notes ? ["Notes", b.notes] : null,
    b.payment_tx_hash ? ["Payment Tx", b.payment_tx_hash] : null,
    b.package_hours ? ["Package Hours", String(b.package_hours)] : null,
    b.user_address ? ["Wallet", b.user_address] : null,
  ].filter(Boolean) as [string, string][];

  const tableRows = rows
    .map(([k, v]) => `<tr><td style="color:#888;padding:4px 12px 4px 0;font-size:13px;white-space:nowrap">${k}</td><td style="color:#f0f0f0;padding:4px 0;font-size:13px">${v}</td></tr>`)
    .join("");

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background:#0f0f0f;color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:32px 24px;max-width:560px;margin:0 auto">
  <h2 style="color:#7c4dff;font-size:20px;margin:0 0 4px">New ${b.mode === "discovery" ? "Discovery Call" : "Consulting"} Booking</h2>
  <p style="color:#888;font-size:13px;margin:0 0 24px">Someone booked time on the WadeCoin calendar.</p>
  <table style="border-collapse:collapse;width:100%">
    ${tableRows}
  </table>
  <hr style="border:none;border-top:1px solid #2e2e2e;margin:24px 0">
  <p style="color:#555;font-size:11px;margin:0">WadeCoin · A futures market for Wade's time · Testnet demo</p>
</body>
</html>`;
}

export async function sendBookingNotification(b: BookingEmailData): Promise<void> {
  const subject = `[WadeCoin] ${b.mode === "discovery" ? "Discovery Call" : "Consulting"} booking — ${b.user_name}`;

  if (!RESEND_API_KEY) {
    logger.info(
      { booking_id: b.booking_id, user_email: b.user_email, mode: b.mode },
      "RESEND_API_KEY not set — booking email logged (not sent). Set RESEND_API_KEY to enable email delivery.",
    );
    return;
  }

  try {
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        subject,
        html: buildEmailHtml(b),
      }),
    });

    if (!resp.ok) {
      const body = await resp.text().catch(() => "(unreadable)");
      logger.error({ status: resp.status, body }, "Resend email delivery failed");
    } else {
      logger.info({ to: TO_EMAIL, mode: b.mode, user: b.user_name }, "Booking notification email sent");
    }
  } catch (err) {
    logger.error({ err }, "Unexpected error sending booking email");
  }
}
