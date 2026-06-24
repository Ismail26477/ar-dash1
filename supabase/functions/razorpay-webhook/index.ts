// Razorpay webhook receiver. Authoritative source for payment state —
// fires even if the customer closes the browser after paying.
// Auth: NO JWT (Razorpay calls it). Verified via webhook signature.
// verify_jwt = false in config.toml.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, hmacSha256Hex, timingSafeEqual } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

const WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const signature = req.headers.get("x-razorpay-signature") ?? "";
    const raw = await req.text(); // must hash the RAW body

    if (!WEBHOOK_SECRET) return json({ error: "Webhook not configured" }, 500);

    const expected = await hmacSha256Hex(WEBHOOK_SECRET, raw);
    if (!signature || !timingSafeEqual(expected, signature)) {
      return json({ error: "Invalid signature" }, 401);
    }

    const event = JSON.parse(raw);
    const db = adminClient();
    const entity = event?.payload?.payment?.entity ?? event?.payload?.refund?.entity;
    const razorpayOrderId = entity?.order_id;

    if (!razorpayOrderId) return json({ received: true });

    const { data: order } = await db
      .from("orders")
      .select("id, payment_status")
      .eq("razorpay_order_id", razorpayOrderId)
      .single();

    if (!order) return json({ received: true });

    switch (event.event) {
      case "payment.captured":
        if (order.payment_status !== "paid") {
          await db.from("orders").update({
            payment_status: "paid",
            razorpay_payment_id: entity.id,
            order_status: "confirmed",
          }).eq("id", order.id);
        }
        break;
      case "payment.failed":
        if (order.payment_status === "pending") {
          await db.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
        }
        break;
      case "refund.processed":
      case "refund.created":
        await db.from("orders").update({
          payment_status: "refunded",
          order_status: "refunded",
        }).eq("id", order.id);
        break;
    }

    return json({ received: true });
  } catch (err) {
    console.error("razorpay-webhook error", err);
    return json({ error: "Internal error" }, 500);
  }
});
