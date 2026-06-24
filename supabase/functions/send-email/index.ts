// ============================================================
// send-email — transactional email integration point.
//
// Accepts an order lifecycle event and dispatches an email via
// Resend. Until RESEND_API_KEY is configured it is a safe no-op
// (returns 200 and logs) so order flows never break.
//
// Call sites (integration points):
//   - order_placed     → after place_order (client / Checkout)
//   - payment_success  → from verify-payment / razorpay-webhook
//   - shipped          → admin sets order_status = 'shipped'
//   - delivered        → admin sets order_status = 'delivered'
// ============================================================
import { corsHeaders } from "../_shared/cors.ts";

type EmailEvent = "order_placed" | "payment_success" | "shipped" | "delivered";

interface EmailPayload {
  event: EmailEvent;
  to: string;
  orderNumber: string;
  customerName?: string;
  total?: number;
  trackingUrl?: string;
}

const SUBJECTS: Record<EmailEvent, string> = {
  order_placed: "Your AR Computers order is confirmed",
  payment_success: "Payment received — AR Computers",
  shipped: "Your AR Computers order has shipped",
  delivered: "Your AR Computers order was delivered",
};

function buildHtml(p: EmailPayload): string {
  const lines: Record<EmailEvent, string> = {
    order_placed: `We've received your order <strong>${p.orderNumber}</strong>${p.total ? ` for ₹${p.total.toLocaleString("en-IN")}` : ""}. We'll let you know when it ships.`,
    payment_success: `We've received your payment for order <strong>${p.orderNumber}</strong>. Thank you!`,
    shipped: `Good news! Your order <strong>${p.orderNumber}</strong> is on its way.`,
    delivered: `Your order <strong>${p.orderNumber}</strong> has been delivered. We hope you enjoy it!`,
  };
  return `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:auto">
      <h2>Hi ${p.customerName || "there"},</h2>
      <p>${lines[p.event]}</p>
      ${p.trackingUrl ? `<p><a href="${p.trackingUrl}">Track your order</a></p>` : ""}
      <p style="color:#666;font-size:12px">AR Computers</p>
    </div>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as EmailPayload;
    if (!payload?.event || !payload?.to || !payload?.orderNumber) {
      return new Response(JSON.stringify({ success: false, error: "Missing event/to/orderNumber" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const FROM = Deno.env.get("EMAIL_FROM") || "AR Computers <orders@arcomputers.example>";

    // Graceful no-op until an email provider is configured.
    if (!RESEND_API_KEY) {
      console.log(`[send-email] (no RESEND_API_KEY) would send '${payload.event}' to ${payload.to} for ${payload.orderNumber}`);
      return new Response(JSON.stringify({ success: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [payload.to],
        subject: SUBJECTS[payload.event],
        html: buildHtml(payload),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Resend error: ${res.status} ${text}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[send-email] error", err);
    return new Response(JSON.stringify({ success: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
