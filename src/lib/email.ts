import { supabase } from "@/integrations/supabase/client";

export type OrderEmailEvent = "order_placed" | "payment_success" | "shipped" | "delivered";

interface OrderEmailInput {
  event: OrderEmailEvent;
  to?: string | null;
  orderNumber: string;
  customerName?: string | null;
  total?: number;
}

/**
 * Fire-and-forget transactional email trigger. Invokes the `send-email`
 * edge function. Never throws — email must never block an order flow.
 * The edge function is a safe no-op until RESEND_API_KEY is configured.
 */
export async function notifyByEmail(input: OrderEmailInput): Promise<void> {
  if (!input.to) return;
  try {
    await supabase.functions.invoke("send-email", {
      body: {
        event: input.event,
        to: input.to,
        orderNumber: input.orderNumber,
        customerName: input.customerName ?? undefined,
        total: input.total,
        trackingUrl: `${window.location.origin}/track/${input.orderNumber}`,
      },
    });
  } catch (err) {
    // Swallow — email is best-effort.
    console.warn("notifyByEmail failed", err);
  }
}
