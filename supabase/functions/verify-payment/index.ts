// Verifies a Razorpay payment signature client-side handler and marks
// the order paid. Auth: requires a valid Supabase user JWT.
// Signature scheme: HMAC_SHA256(razorpay_order_id + "|" + razorpay_payment_id, key_secret)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json, hmacSha256Hex, timingSafeEqual } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/supabase.ts";

const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RAZORPAY_KEY_SECRET) return json({ error: "Razorpay is not configured" }, 500);

    const user = await getUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
    if (!order_id || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return json({ error: "Missing payment fields" }, 400);
    }

    const db = adminClient();
    const { data: order, error } = await db
      .from("orders")
      .select("id, user_id, payment_status, razorpay_order_id, order_number, total")
      .eq("id", order_id)
      .single();

    if (error || !order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (order.razorpay_order_id !== razorpay_order_id) {
      return json({ error: "Razorpay order mismatch" }, 400);
    }

    const expected = await hmacSha256Hex(
      RAZORPAY_KEY_SECRET,
      `${razorpay_order_id}|${razorpay_payment_id}`,
    );

    if (!timingSafeEqual(expected, razorpay_signature)) {
      await db.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
      return json({ error: "Signature verification failed" }, 400);
    }

    // Idempotent: only flip if not already paid.
    if (order.payment_status !== "paid") {
      await db
        .from("orders")
        .update({
          payment_status: "paid",
          razorpay_payment_id,
          order_status: "confirmed",
        })
        .eq("id", order.id);

      // Email integration point: payment success (best-effort, never blocks).
      try {
        const { data: profile } = await db
          .from("profiles")
          .select("email, full_name")
          .eq("id", order.user_id)
          .single();
        if (profile?.email) {
          await db.functions.invoke("send-email", {
            body: {
              event: "payment_success",
              to: profile.email,
              orderNumber: order.order_number,
              customerName: profile.full_name,
              total: Number(order.total),
            },
          });
        }
      } catch (emailErr) {
        console.warn("payment_success email failed", emailErr);
      }
    }

    return json({ success: true });
  } catch (err) {
    console.error("verify-payment error", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
