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

    // Build invoice
    const invoice = {
      orderId: data.id,
      placedAt: data.created_at,
      buyer: { fullName: payload.fullName, email: payload.email, phone: payload.phone },
      shipping: payload.shippingAddress,
      billing: payload.billingAddress,
      items: payload.items,
      totalUSD: (payload.totalCents / 100).toFixed(2),
      notes: payload.notes ?? "",
    };

    // Send invoice via Gmail connector gateway
    let emailStatus = "skipped";
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
      if (LOVABLE_API_KEY && GMAIL_KEY) {
        const itemsHtml = payload.items.map(i =>
          `<tr><td style="padding:6px 10px;border-bottom:1px solid #222">${i.brand} — ${i.name}</td><td style="padding:6px 10px;border-bottom:1px solid #222">${i.size}</td><td style="padding:6px 10px;border-bottom:1px solid #222">${i.color}</td><td style="padding:6px 10px;border-bottom:1px solid #222;text-align:right">$${i.price.toFixed(2)}</td></tr>`
        ).join("");
        const subject = `JOAT VAULT — New Order ${data.id.slice(0,8)} — $${invoice.totalUSD}`;
        const html = `<div style="font-family:Arial,sans-serif;color:#eee;background:#0a0a0a;padding:20px">
<h2 style="color:#c8102e">JOAT VAULT — New Order</h2>
<p><b>Order:</b> ${data.id}<br/><b>Placed:</b> ${data.created_at}</p>
<h3>Buyer</h3><p>${payload.fullName}<br/>${payload.email}<br/>${payload.phone}</p>
<h3>Ship To</h3><p>${payload.shippingAddress.line1}${payload.shippingAddress.line2?", "+payload.shippingAddress.line2:""}<br/>${payload.shippingAddress.city}, ${payload.shippingAddress.region} ${payload.shippingAddress.postal}<br/>${payload.shippingAddress.country}</p>
<h3>Bill To</h3><p>${payload.billingAddress.line1}${payload.billingAddress.line2?", "+payload.billingAddress.line2:""}<br/>${payload.billingAddress.city}, ${payload.billingAddress.region} ${payload.billingAddress.postal}<br/>${payload.billingAddress.country}</p>
<h3>Items</h3><table style="width:100%;border-collapse:collapse"><thead><tr><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #c8102e">Item</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #c8102e">Size</th><th style="text-align:left;padding:6px 10px;border-bottom:2px solid #c8102e">Color</th><th style="text-align:right;padding:6px 10px;border-bottom:2px solid #c8102e">Price</th></tr></thead><tbody>${itemsHtml}</tbody></table>
<h3 style="text-align:right;margin-top:20px">TOTAL: $${invoice.totalUSD}</h3>
${payload.notes?`<h3>Notes</h3><p>${payload.notes}</p>`:""}
</div>`;
        const rfc = [
          `To: ${OWNER_EMAIL}`,
          `Subject: ${subject}`,
          'MIME-Version: 1.0',
          'Content-Type: text/html; charset="UTF-8"',
          '',
          html,
        ].join('\r\n');
        const raw = btoa(unescape(encodeURIComponent(rfc))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
        const gRes = await fetch('https://connector-gateway.lovable.dev/google_mail/gmail/v1/users/me/messages/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': GMAIL_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw }),
        });
        if (gRes.ok) {
          emailStatus = "sent";
        } else {
          const errText = await gRes.text();
          console.error("gmail send failed", gRes.status, errText);
          emailStatus = `failed:${gRes.status}`;
        }
      } else {
        console.warn("missing LOVABLE_API_KEY or GOOGLE_MAIL_API_KEY");
        emailStatus = "no_credentials";
      }
    } catch (e) {
      console.error("gmail send exception", e);
      emailStatus = "exception";
    }

    await supabase.from("orders").update({ email_relay_status: emailStatus }).eq("id", data.id);

    return new Response(JSON.stringify({ ok: true, orderId: data.id, emailStatus }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("submit-order error", e);
    return new Response(JSON.stringify({ error: "server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
