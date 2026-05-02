// Receives validated order from frontend, persists to DB, attempts email relay to owner.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const OWNER_EMAIL = "GQHarris10202011@gmail.com";

interface OrderPayload {
  fullName: string;
  email: string;
  phone: string;
  shippingAddress: { line1: string; line2?: string; city: string; region: string; postal: string; country: string };
  billingAddress: { line1: string; line2?: string; city: string; region: string; postal: string; country: string };
  items: Array<{ id: string; name: string; brand: string; size: string; color: string; price: number }>;
  totalCents: number;
  notes?: string;
}

function bad(msg: string) {
  return new Response(JSON.stringify({ error: msg }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function validate(p: any): p is OrderPayload {
  if (!p || typeof p !== "object") return false;
  if (typeof p.fullName !== "string" || p.fullName.trim().length < 2 || p.fullName.length > 200) return false;
  if (typeof p.email !== "string" || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.email) || p.email.length > 320) return false;
  if (typeof p.phone !== "string" || p.phone.length < 7 || p.phone.length > 40) return false;
  for (const addr of [p.shippingAddress, p.billingAddress]) {
    if (!addr || typeof addr !== "object") return false;
    for (const f of ["line1", "city", "region", "postal", "country"]) {
      if (typeof addr[f] !== "string" || addr[f].trim().length === 0 || addr[f].length > 200) return false;
    }
  }
  if (!Array.isArray(p.items) || p.items.length === 0 || p.items.length > 50) return false;
  if (typeof p.totalCents !== "number" || p.totalCents < 0 || p.totalCents > 100000000) return false;
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return bad("method");
  try {
    const payload = await req.json();
    if (!validate(payload)) return bad("invalid order data");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("orders")
      .insert({
        full_name: payload.fullName,
        email: payload.email,
        phone: payload.phone,
        shipping_address: payload.shippingAddress,
        billing_address: payload.billingAddress,
        items: payload.items,
        total_cents: payload.totalCents,
        notes: payload.notes ?? null,
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("insert order failed", error);
      return new Response(JSON.stringify({ error: "could not save order" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Format invoice JSON for owner relay (logged + ready for email when domain is set)
    const invoice = {
      orderId: data.id,
      placedAt: data.created_at,
      relayTo: OWNER_EMAIL,
      buyer: { fullName: payload.fullName, email: payload.email, phone: payload.phone },
      shipping: payload.shippingAddress,
      billing: payload.billingAddress,
      items: payload.items,
      totalUSD: (payload.totalCents / 100).toFixed(2),
      notes: payload.notes ?? "",
    };
    console.log("[ORDER INVOICE READY]", JSON.stringify(invoice));

    return new Response(JSON.stringify({ ok: true, orderId: data.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("submit-order error", e);
    return new Response(JSON.stringify({ error: "server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
