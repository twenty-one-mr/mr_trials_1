// POST /api/checkout  { items: [{ id, qty }] }  ->  { url }
// Creates a Stripe Checkout Session for the cart. Names and prices come from
// CATALOG below, never from the browser, so a visitor can't change a price.
// Keep CATALOG in sync with the one in cart.js.

const CATALOG = {
  "trueline-pro":   { name: "TrueLine Pro",        desc: "Self-leveling 360° red laser level",              cents: 49900 },
  "trueline-pro-x": { name: "TrueLine Pro X",      desc: "Green-beam 360° laser, 200 ft range",             cents: 69900 },
  "tripod":         { name: "Heavy-Duty Tripod",   desc: "Elevating tripod, 12 to 63 in",                   cents: 8900 },
  "detector":       { name: "Laser Detector",      desc: "Picks up the beam outdoors up to 300 ft",         cents: 12900 },
  "wall-mount":     { name: "Magnetic Wall Mount", desc: "Clamps to studs, track and ceiling grid",         cents: 3900 },
};

const MAX_QTY = 10;
const FREE_SHIPPING_OVER_CENTS = 100000; // free standard shipping on orders of $1,000+
const TAX_CODE_GOODS = "txcd_99999999";    // Stripe: general tangible goods
const TAX_CODE_SHIPPING = "txcd_92010001"; // Stripe: shipping

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  const key = process.env.STRIPE_SECRET_KEY || "";
  if (!key) return json({ error: "Checkout isn't connected to Stripe yet." }, 500);
  // This is a trial site: refuse live keys so no real card can be charged.
  if (!/^(sk|rk)_test_/.test(key)) return json({ error: "This trial site only works with a Stripe test key." }, 500);

  let items;
  try {
    ({ items } = await req.json());
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  if (!Array.isArray(items) || items.length === 0) return json({ error: "Your cart is empty." }, 400);

  // Merge duplicates and validate against the catalog.
  const qtyById = {};
  for (const it of items) {
    const product = CATALOG[it && it.id];
    const qty = Number(it && it.qty);
    if (!product || !Number.isInteger(qty) || qty < 1) return json({ error: "Your cart has an item we don't recognize." }, 400);
    qtyById[it.id] = Math.min(MAX_QTY, (qtyById[it.id] || 0) + qty);
  }

  const origin = new URL(req.url).origin;
  const p = new URLSearchParams();
  p.set("mode", "payment");
  p.set("success_url", `${origin}/thanks.html?session_id={CHECKOUT_SESSION_ID}`);
  p.set("cancel_url", `${origin}/#shop`);
  p.set("shipping_address_collection[allowed_countries][0]", "US");
  p.set("phone_number_collection[enabled]", "true");
  p.set("billing_address_collection", "auto");

  let subtotal = 0;
  Object.entries(qtyById).forEach(([id, qty], i) => {
    const { name, desc, cents } = CATALOG[id];
    subtotal += cents * qty;
    p.set(`line_items[${i}][quantity]`, String(qty));
    p.set(`line_items[${i}][price_data][currency]`, "usd");
    p.set(`line_items[${i}][price_data][unit_amount]`, String(cents));
    p.set(`line_items[${i}][price_data][tax_behavior]`, "exclusive");
    p.set(`line_items[${i}][price_data][product_data][name]`, name);
    p.set(`line_items[${i}][price_data][product_data][description]`, desc);
    p.set(`line_items[${i}][price_data][product_data][tax_code]`, TAX_CODE_GOODS);
    p.set(`line_items[${i}][price_data][product_data][metadata][sku]`, id);
  });

  const shipping = [
    { name: subtotal >= FREE_SHIPPING_OVER_CENTS ? "Standard (free over $1,000)" : "Standard",
      cents: subtotal >= FREE_SHIPPING_OVER_CENTS ? 0 : 2500, min: 5, max: 7 },
    { name: "Express", cents: 6000, min: 2, max: 3 },
  ];
  shipping.forEach((s, i) => {
    const k = `shipping_options[${i}][shipping_rate_data]`;
    p.set(`${k}[type]`, "fixed_amount");
    p.set(`${k}[display_name]`, s.name);
    p.set(`${k}[fixed_amount][amount]`, String(s.cents));
    p.set(`${k}[fixed_amount][currency]`, "usd");
    p.set(`${k}[tax_behavior]`, "exclusive");
    p.set(`${k}[tax_code]`, TAX_CODE_SHIPPING);
    p.set(`${k}[delivery_estimate][minimum][unit]`, "business_day");
    p.set(`${k}[delivery_estimate][minimum][value]`, String(s.min));
    p.set(`${k}[delivery_estimate][maximum][unit]`, "business_day");
    p.set(`${k}[delivery_estimate][maximum][value]`, String(s.max));
  });

  // Turn on once Stripe Tax is set up in the Stripe dashboard (Settings -> Tax).
  if (process.env.STRIPE_AUTOMATIC_TAX === "true") p.set("automatic_tax[enabled]", "true");

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: p,
  });
  const data = await res.json();
  if (!res.ok) return json({ error: (data.error && data.error.message) || "Stripe returned an error." }, 502);
  return json({ url: data.url });
};

export const config = { path: "/api/checkout" };
