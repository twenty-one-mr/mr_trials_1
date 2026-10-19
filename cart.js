// Shop grid + cart drawer. Display prices only; the checkout function holds
// the real prices. Keep CATALOG in sync with netlify/functions/checkout.mjs.
(() => {
  const CATALOG = [
    { id: "trueline-pro",   kind: "Laser level", name: "TrueLine Pro",        desc: "Self-leveling 360° red laser level", cents: 49900, art: "laser", color: "#e8590c", beam: "#ef4444" },
    { id: "trueline-pro-x", kind: "Laser level", name: "TrueLine Pro X",      desc: "Green-beam 360° laser, 200 ft range", cents: 69900, art: "laser", color: "#1d1f22", beam: "#22c55e" },
    { id: "tripod",         kind: "Attachment",  name: "Heavy-Duty Tripod",   desc: "Elevating tripod, 12 to 63 in",       cents: 8900,  art: "tripod" },
    { id: "detector",       kind: "Attachment",  name: "Laser Detector",      desc: "Picks up the beam outdoors up to 300 ft", cents: 12900, art: "detector" },
    { id: "wall-mount",     kind: "Attachment",  name: "Magnetic Wall Mount", desc: "Clamps to studs, track and ceiling grid", cents: 3900, art: "mount" },
  ];
  const MAX_QTY = 10;
  const STORE_KEY = "trueline-cart";
  const byId = Object.fromEntries(CATALOG.map((p) => [p.id, p]));
  const money = (c) => "$" + (c / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---- product art (inline SVG) ----
  function art(p) {
    if (p.art === "laser") {
      return `<svg viewBox="0 0 200 150" aria-hidden="true">
        <line x1="0" y1="55" x2="200" y2="55" stroke="${p.beam}" stroke-width="3"/>
        <line x1="100" y1="0" x2="100" y2="150" stroke="${p.beam}" stroke-width="3"/>
        <rect x="68" y="25" width="64" height="70" rx="12" fill="${p.color}"/>
        <rect x="76" y="33" width="48" height="54" rx="8" fill="#2b2f33"/>
        <circle cx="100" cy="55" r="10" fill="#111" stroke="#555" stroke-width="2"/>
        <circle cx="100" cy="55" r="3.5" fill="${p.beam}"/>
        <rect x="86" y="72" width="28" height="8" rx="4" fill="#b7f0c4"/>
        <line x1="100" y1="95" x2="78" y2="145" stroke="#3f444a" stroke-width="5" stroke-linecap="round"/>
        <line x1="100" y1="95" x2="122" y2="145" stroke="#3f444a" stroke-width="5" stroke-linecap="round"/>
      </svg>`;
    }
    if (p.art === "tripod") {
      return `<svg viewBox="0 0 200 150" aria-hidden="true">
        <rect x="88" y="14" width="24" height="12" rx="3" fill="#e8590c"/>
        <rect x="96" y="26" width="8" height="46" fill="#5b6168"/>
        <line x1="100" y1="72" x2="55" y2="142" stroke="#3f444a" stroke-width="7" stroke-linecap="round"/>
        <line x1="100" y1="72" x2="145" y2="142" stroke="#3f444a" stroke-width="7" stroke-linecap="round"/>
        <line x1="100" y1="72" x2="100" y2="145" stroke="#3f444a" stroke-width="7" stroke-linecap="round"/>
        <line x1="74" y1="112" x2="126" y2="112" stroke="#9aa0a6" stroke-width="3"/>
      </svg>`;
    }
    if (p.art === "detector") {
      return `<svg viewBox="0 0 200 150" aria-hidden="true">
        <rect x="70" y="18" width="60" height="114" rx="12" fill="#e8590c"/>
        <rect x="80" y="30" width="40" height="34" rx="5" fill="#2b2f33"/>
        <path d="M90 48 L100 38 L110 48 Z" fill="#22c55e"/>
        <rect x="80" y="74" width="40" height="8" rx="2" fill="#ef4444"/>
        <circle cx="90" cy="104" r="6" fill="#2b2f33"/><circle cx="110" cy="104" r="6" fill="#2b2f33"/>
        <line x1="20" y1="78" x2="70" y2="78" stroke="#ef4444" stroke-width="3"/>
      </svg>`;
    }
    return `<svg viewBox="0 0 200 150" aria-hidden="true">
      <rect x="50" y="30" width="20" height="90" rx="4" fill="#9aa0a6"/>
      <rect x="70" y="50" width="70" height="50" rx="8" fill="#1d1f22"/>
      <rect x="140" y="62" width="22" height="26" rx="4" fill="#e8590c"/>
      <circle cx="105" cy="75" r="10" fill="#5b6168"/>
      <rect x="44" y="40" width="8" height="70" rx="2" fill="#3f444a"/>
    </svg>`;
  }

  // ---- cart state (browser storage is a convenience; it may be unavailable) ----
  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      const clean = {};
      for (const [id, q] of Object.entries(raw)) if (byId[id] && Number.isInteger(q) && q > 0) clean[id] = Math.min(q, MAX_QTY);
      return clean;
    } catch {
      return {};
    }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch {}
  }
  let cart = load();

  const $ = (s) => document.querySelector(s);
  const drawer = $(".cart");
  const backdrop = $(".cart-backdrop");

  function setQty(id, qty) {
    if (qty <= 0) delete cart[id];
    else cart[id] = Math.min(qty, MAX_QTY);
    save();
    render();
  }
  function add(id) {
    setQty(id, (cart[id] || 0) + 1);
    open();
  }
  function open() {
    drawer.hidden = false;
    backdrop.hidden = false;
    requestAnimationFrame(() => drawer.classList.add("open"));
  }
  function close() {
    drawer.classList.remove("open");
    backdrop.hidden = true;
    setTimeout(() => { if (!drawer.classList.contains("open")) drawer.hidden = true; }, 250);
  }

  function renderShop() {
    const grid = $("#shop-grid");
    if (!grid) return;
    grid.innerHTML = CATALOG.map((p) => `
      <article class="product">
        <div class="product-art">${art(p)}</div>
        <p class="product-kind">${p.kind}</p>
        <h3>${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-foot">
          <span class="product-price">${money(p.cents)}</span>
          <button type="button" class="btn btn-small" data-add="${p.id}">Add to cart</button>
        </div>
      </article>`).join("");
  }

  function render() {
    const ids = Object.keys(cart);
    const count = ids.reduce((n, id) => n + cart[id], 0);
    const subtotal = ids.reduce((s, id) => s + byId[id].cents * cart[id], 0);
    document.querySelectorAll(".cart-count").forEach((el) => (el.textContent = count));
    $(".cart-items").innerHTML = ids.length
      ? ids.map((id) => {
          const p = byId[id];
          return `<li class="cart-item">
            <div class="cart-thumb">${art(p)}</div>
            <div class="cart-info">
              <strong>${p.name}</strong>
              <span>${money(p.cents)} each</span>
              <div class="qty">
                <button type="button" data-dec="${id}" aria-label="Remove one ${p.name}">−</button>
                <span>${cart[id]}</span>
                <button type="button" data-inc="${id}" aria-label="Add one ${p.name}" ${cart[id] >= MAX_QTY ? "disabled" : ""}>+</button>
              </div>
            </div>
            <div class="cart-line">${money(p.cents * cart[id])}<button type="button" class="link-btn" data-remove="${id}">Remove</button></div>
          </li>`;
        }).join("")
      : `<li class="cart-empty">Your cart is empty.</li>`;
    $(".cart-subtotal").textContent = money(subtotal);
    $(".cart-ship-note").textContent = subtotal >= 100000
      ? "You qualify for free standard shipping. Tax is added at checkout."
      : `Add ${money(100000 - subtotal)} more for free standard shipping. Shipping and tax are added at checkout.`;
    $(".checkout-btn").disabled = ids.length === 0;
  }

  async function checkout() {
    const btn = $(".checkout-btn");
    const err = $(".cart-error");
    err.textContent = "";
    btn.disabled = true;
    btn.textContent = "Opening secure checkout…";
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: Object.entries(cart).map(([id, qty]) => ({ id, qty })) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout is unavailable right now.");
      window.location.href = data.url;
    } catch (e) {
      err.textContent = e.message;
      btn.disabled = false;
      btn.textContent = "Checkout";
    }
  }

  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, [data-open-cart]");
    if (!t) return;
    if (t.dataset.add) add(t.dataset.add);
    else if (t.dataset.inc) setQty(t.dataset.inc, cart[t.dataset.inc] + 1);
    else if (t.dataset.dec) setQty(t.dataset.dec, cart[t.dataset.dec] - 1);
    else if (t.dataset.remove) setQty(t.dataset.remove, 0);
    else if (t.hasAttribute("data-open-cart")) open();
    else if (t.hasAttribute("data-close-cart")) close();
    else if (t.classList.contains("checkout-btn")) checkout();
  });
  backdrop.addEventListener("click", close);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !drawer.hidden) close(); });

  renderShop();
  render();
})();
