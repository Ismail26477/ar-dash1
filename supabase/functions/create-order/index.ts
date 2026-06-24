// Creates a Razorpay order for an existing (pending) DB order and
// stores the razorpay_order_id back on it.
// Auth: requires a valid Supabase user JWT (verify_jwt = true).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, json } from "../_shared/cors.ts";
import { adminClient, getUser } from "../_shared/supabase.ts";

const RAZORPAY_KEY_ID = Deno.env.get("RAZORPAY_KEY_ID")!;
const RAZORPAY_KEY_SECRET = Deno.env.get("RAZORPAY_KEY_SECRET")!;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
      return json({ error: "Razorpay is not configured" }, 500);
    }

    const user = await getUser(req);
    if (!user) return json({ error: "Unauthorized" }, 401);

    const { order_id } = await req.json();
    if (!order_id) return json({ error: "order_id is required" }, 400);

    const db = adminClient();
    const { data: order, error } = await db
      .from("orders")
      .select("id, order_number, total, user_id, payment_method, payment_status, razorpay_order_id")
      .eq("id", order_id)
      .single();

    if (error || !order) return json({ error: "Order not found" }, 404);
    if (order.user_id !== user.id) return json({ error: "Forbidden" }, 403);
    if (order.payment_method !== "razorpay") return json({ error: "Order is not a Razorpay order" }, 400);
    if (order.payment_status === "paid") return json({ error: "Order already paid" }, 409);

    const amountPaise = Math.round(Number(order.total) * 100);

    // Reuse an existing razorpay order if one was already created.
    let razorpayOrderId = order.razorpay_order_id as string | null;
    if (!razorpayOrderId) {
      const auth = btoa(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`);
      const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountPaise,
          currency: "INR",
          receipt: order.order_number,
          notes: { order_id: order.id },
        }),
      });

      const rzpData = await rzpRes.json();
      if (!rzpRes.ok) {
        console.error("Razorpay order creation failed", rzpData);
        return json({ error: rzpData?.error?.description || "Failed to create Razorpay order" }, 502);
      }
      razorpayOrderId = rzpData.id;
      await db.from("orders").update({ razorpay_order_id: razorpayOrderId }).eq("id", order.id);
    }

    return json({
      razorpay_order_id: razorpayOrderId,
      amount: amountPaise,
      currency: "INR",
      key_id: RAZORPAY_KEY_ID,
      order_number: order.order_number,
    });
  } catch (err) {
    console.error("create-order error", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});
