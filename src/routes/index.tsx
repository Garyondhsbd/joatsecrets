import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Pause, Play, Search, ShoppingBag, Truck, Shield, Package, X, Menu, Send,
  MessageCircle, Loader2, Check, ChevronRight, ChevronLeft,
  CreditCard, Smartphone, DollarSign,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import products from "@/data/products.json";
import jokerCard from "@/assets/joker-card.png";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "J.O.A.T — Source Vault" },
      { name: "description", content: "J.O.A.T sourcing vault — designer, streetwear & fragrance drops." },
      { property: "og:title", content: "J.O.A.T — Source Vault" },
      { property: "og:description", content: "Designer, streetwear & fragrance — sourced direct." },
    ],
  }),
  component: Index,
});

type Product = (typeof products)[number];
type CartItem = Product & { selectedColor: string; selectedSize: string };

interface AddressData {
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal: string;
  country: string;
}
type PaymentMethod = "card" | "apple_pay" | "cash_app";
interface CheckoutData {
  fullName: string;
  email: string;
  phone: string;
  shipping: AddressData;
  billing: AddressData;
  sameAsBilling: boolean;
  notes: string;
  paymentMethod: PaymentMethod;
  cardNumber: string;
  cardExp: string;
  cardCvc: string;
  cardName: string;
  cashTag: string;
  paymentConfirmed: boolean;
}

const ACCESS_KEY = "joat-vault-access-2026";
const TOS_KEY = "joat-tos-accepted-v1";
const PRODUCT_OPTION_KEY = "joat-product-options";

const emptyAddress: AddressData = { line1: "", line2: "", city: "", region: "", postal: "", country: "" };
const emptyCheckout: CheckoutData = {
  fullName: "", email: "", phone: "",
  shipping: { ...emptyAddress }, billing: { ...emptyAddress },
  sameAsBilling: true, notes: "",
  paymentMethod: "card",
  cardNumber: "", cardExp: "", cardCvc: "", cardName: "",
  cashTag: "",
  paymentConfirmed: false,
};

const productSections = [
  "Bape Tees", "Sp5der Hoodies", "Denim Tears", "Chrome Hearts",
  "Essentials Shorts", "Hellstar Tees", "Alo", "Fragrance",
] as const;

const readProductOptionMemory = (productId: string) => {
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_OPTION_KEY) ?? "{}") as Record<string, { color?: string; size?: string }>;
    return saved[productId] ?? {};
  } catch { return {}; }
};
const writeProductOptionMemory = (productId: string, color: string, size: string) => {
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_OPTION_KEY) ?? "{}") as Record<string, { color?: string; size?: string }>;
    localStorage.setItem(PRODUCT_OPTION_KEY, JSON.stringify({ ...saved, [productId]: { color, size } }));
  } catch {
    localStorage.setItem(PRODUCT_OPTION_KEY, JSON.stringify({ [productId]: { color, size } }));
  }
};

function Index() {
  const [unlocked, setUnlocked] = useState(false);
  const [tosAccepted, setTosAccepted] = useState(false);
  const [tosOpen, setTosOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    setUnlocked(localStorage.getItem(ACCESS_KEY) === "granted");
    const accepted = localStorage.getItem(TOS_KEY) === "yes";
    setTosAccepted(accepted);
    if (!accepted) setTosOpen(true);
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const addToDrop = (product: Product, selectedColor: string, selectedSize: string) => {
    setCart((items) => [...items, { ...product, selectedColor, selectedSize }]);
    setCartOpen(true);
  };

  const removeFromCart = (idx: number) => setCart((items) => items.filter((_, i) => i !== idx));

  const acceptTos = () => {
    try { localStorage.setItem(TOS_KEY, "yes"); } catch {}
    setTosAccepted(true);
    setTosOpen(false);
  };

  const beginCheckout = () => {
    if (!tosAccepted) { setTosOpen(true); return; }
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SpaceBackdrop />
      <CinematicThunder />
      <AnimatePresence mode="wait">
        {!unlocked ? (
          <RestrictedGateway key="gate" onUnlock={() => setUnlocked(true)} />
        ) : (
          <VaultHub
            key="vault"
            cart={cart}
            openProductDetail={setViewingProduct}
            openCart={() => setCartOpen(true)}
            query={query}
            setQuery={setQuery}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        )}
      </AnimatePresence>

      <ProductDetailDialog
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
        onAdd={(product, selectedColor, selectedSize) => {
          writeProductOptionMemory(product.id, selectedColor, selectedSize);
          addToDrop(product, selectedColor, selectedSize);
          setViewingProduct(null);
        }}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        total={total}
        onRemove={removeFromCart}
        onClose={() => setCartOpen(false)}
        onCheckout={beginCheckout}
      />

      <CheckoutDialog
        open={checkoutOpen}
        cart={cart}
        total={total}
        onClose={() => setCheckoutOpen(false)}
        onComplete={() => setCart([])}
      />

      <TosModal open={tosOpen} onAccept={acceptTos} dismissible={tosAccepted} onDismiss={() => setTosOpen(false)} />

      {unlocked && <MaskWidget />}
    </main>
  );
}

/* ---------- Backdrop with parallax ---------- */
function SpaceBackdrop() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (ref.current) {
          ref.current.style.setProperty("--py-slow", `${y * 0.15}px`);
          ref.current.style.setProperty("--py-fast", `${y * 0.35}px`);
        }
        raf = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 deep-space-gradient" />
      <div className="absolute inset-0 starfield parallax-slow" />
      <div className="absolute inset-0 nebula-drift parallax-fast" />
      <div className="absolute inset-0 jester-watermark" />
    </div>
  );
}

/* ---------- Cinematic red thunder backdrop ---------- */
function CinematicThunder() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden mix-blend-screen">
      <div className="thunder-vignette absolute inset-0" />
      <div className="thunder-flash thunder-flash-1 absolute inset-0" />
      <div className="thunder-flash thunder-flash-2 absolute inset-0" />
      <svg className="thunder-bolt thunder-bolt-1 absolute" viewBox="0 0 100 400" preserveAspectRatio="none">
        <path d="M55 0 L40 140 L60 150 L30 280 L52 290 L20 400" fill="none" stroke="url(#tg1)" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="round" />
        <defs>
          <linearGradient id="tg1" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff3b5c" stopOpacity="1" />
            <stop offset="60%" stopColor="#c8102e" stopOpacity="1" />
            <stop offset="100%" stopColor="#7a0a1f" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <svg className="thunder-bolt thunder-bolt-2 absolute" viewBox="0 0 100 400" preserveAspectRatio="none">
        <path d="M50 0 L65 130 L40 145 L70 270 L45 285 L75 400" fill="none" stroke="url(#tg2)" strokeWidth="2" strokeLinejoin="miter" strokeLinecap="round" />
        <defs>
          <linearGradient id="tg2" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#ff5570" stopOpacity="1" />
            <stop offset="60%" stopColor="#c8102e" stopOpacity="1" />
            <stop offset="100%" stopColor="#7a0a1f" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}


function RestrictedGateway({ onUnlock }: { onUnlock: () => void }) {
  const lockedRef = useRef(false);
  const enterVault = () => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    try { localStorage.setItem(ACCESS_KEY, "granted"); } catch {}
    onUnlock();
  };
  return (
    <motion.section
      exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 grid min-h-screen place-items-center px-5"
    >
      {/* Floating joker cards */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {[
          { top: "6%",  left: "4%",  delay: 0,   rot: -12, w: "w-24 sm:w-36" },
          { top: "10%", left: "78%", delay: 0.4, rot: 14,  w: "w-20 sm:w-32" },
          { top: "66%", left: "2%",  delay: 0.8, rot: 8,   w: "w-28 sm:w-40" },
          { top: "72%", left: "80%", delay: 1.2, rot: -10, w: "w-24 sm:w-36" },
        ].map((j, i) => (
          <motion.img
            key={i}
            src={jokerCard}
            alt=""
            initial={{ opacity: 0, y: 20, rotate: j.rot }}
            animate={{ opacity: 0.85, y: [0, -10, 0], rotate: [j.rot, j.rot + 4, j.rot] }}
            transition={{ delay: j.delay, duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute ${j.w} drop-shadow-[0_0_24px_rgba(200,16,46,0.55)]`}
            style={{ top: j.top, left: j.left }}
          />
        ))}
      </div>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex w-full max-w-xl flex-col items-center text-center"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-vault-quiet">Source · Pack · Ship</p>
        <h1 className="mt-3 font-display text-7xl uppercase leading-none text-foreground sm:text-9xl">J.O.A.T</h1>
        <p className="mt-4 max-w-sm font-body text-sm text-vault-quiet">
          Jack of all trades. Master of the source. Designer, streetwear & fragrance — sourced direct.
        </p>
        <button
          type="button"
          onClick={enterVault}
          className="enter-cta group relative mt-10 inline-flex items-center justify-center overflow-hidden border border-white/20 bg-white px-12 py-5 font-display text-2xl uppercase tracking-[0.25em] text-black transition-transform duration-200 active:scale-[0.98]"
        >
          <span className="relative z-10">Enter</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>
        <a href="https://t.me/joatz" className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-vault-quiet hover:text-foreground">
          Telegram · @joatz
        </a>
      </motion.div>
    </motion.section>
  );
}

function VaultHub({
  cart, openProductDetail, openCart, query, setQuery, activeCategory, setActiveCategory,
}: {
  cart: CartItem[];
  openProductDetail: (product: Product) => void;
  openCart: () => void;
  query: string; setQuery: (q: string) => void;
  activeCategory: string; setActiveCategory: (c: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const inCat = activeCategory === "All" || p.category === activeCategory;
      if (!inCat) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });
  }, [query, activeCategory]);

  const sectionsToRender = activeCategory === "All" ? productSections : ([activeCategory] as readonly string[]);

  return (
    <motion.section
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }}
      className="relative z-10 min-h-screen"
    >
      {/* Floating joker cards */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        {[
          { top: "10%", left: "2%",  delay: 0,   rot: -10, w: "w-20 sm:w-32" },
          { top: "26%", left: "88%", delay: 0.5, rot: 14,  w: "w-16 sm:w-28" },
          { top: "54%", left: "1%",  delay: 1.0, rot: 8,   w: "w-20 sm:w-32" },
          { top: "76%", left: "86%", delay: 1.5, rot: -12, w: "w-20 sm:w-28" },
        ].map((j, i) => (
          <motion.img
            key={i}
            src={jokerCard}
            alt=""
            initial={{ opacity: 0, y: 20, rotate: j.rot }}
            animate={{ opacity: 0.5, y: [0, -12, 0], rotate: [j.rot, j.rot + 4, j.rot] }}
            transition={{ delay: j.delay, duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
            className={`absolute ${j.w} drop-shadow-[0_0_24px_rgba(200,16,46,0.55)]`}
            style={{ top: j.top, left: j.left }}
          />
        ))}
      </div>
      <MinimalTopBar />
      <BackgroundMusic />

      <section className="relative pb-32 pt-6">
        {!query.trim() && activeCategory === "All" && (
          <BentoHero onOpenProduct={openProductDetail} onJump={(c) => setActiveCategory(c)} />
        )}
        {query.trim() ? (
          <CatalogueGrid title={`Search · "${query}"`} count={filtered.length} items={filtered} onOpen={openProductDetail} />
        ) : (
          sectionsToRender.map((section) => {
            const sectionProducts = filtered.filter((p) => p.category === section);
            if (sectionProducts.length === 0) return null;
            return (
              <CatalogueGrid key={section} title={section} count={sectionProducts.length} items={sectionProducts} onOpen={openProductDetail} />
            );
          })
        )}
        {query.trim() && filtered.length === 0 && (
          <p className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-sm uppercase text-vault-quiet">
            Nothing matches "{query}"
          </p>
        )}
      </section>

      <FloatingDock
        cartCount={cart.length} openCart={openCart}
        activeCategory={activeCategory} setActiveCategory={setActiveCategory}
        query={query} setQuery={setQuery}
      />

      <footer className="relative pb-28 pt-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-vault-quiet">
        J.O.A.T · Source Vault · Telegram @joatz
      </footer>
    </motion.section>
  );
}

function MinimalTopBar() {
  return (
    <header className="relative z-20 flex items-center justify-center px-5 pt-6">
      <a href="/" className="font-display text-3xl uppercase leading-none tracking-wider text-foreground sm:text-4xl">J.O.A.T</a>
    </header>
  );
}

function BentoHero({
  onOpenProduct, onJump,
}: { onOpenProduct: (p: Product) => void; onJump: (c: string) => void }) {
  const hero = useMemo(() => products.find((p) => p.category === "Hellstar Tees") ?? products[0], []);
  const cells = useMemo(() => {
    const pick = (cat: string) => products.find((p) => p.category === cat);
    return [
      { label: "Essentials", cat: "Essentials Shorts", product: pick("Essentials Shorts") },
      { label: "Bape", cat: "Bape Tees", product: pick("Bape Tees") },
      { label: "Sp5der", cat: "Sp5der Hoodies", product: pick("Sp5der Hoodies") },
      { label: "Hellstar", cat: "Hellstar Tees", product: pick("Hellstar Tees") },
    ];
  }, []);

  return (
    <section className="relative mx-auto max-w-7xl px-3 pb-10 pt-4 sm:px-5">
      <motion.div
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } } }}
        className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
      >
        <motion.button
          variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => hero && onOpenProduct(hero)}
          className="bento-cell haptic group relative col-span-2 row-span-2 flex aspect-[16/11] flex-col justify-end p-5 text-left sm:aspect-auto sm:min-h-[440px]"
        >
          {hero && (
            <img src={hero.image} alt={hero.name}
              className="absolute inset-0 h-full w-full object-cover opacity-65 transition-transform duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="relative">
            <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-vault-wire">Hottest Drop</p>
            <h2 className="mt-2 font-display text-5xl uppercase leading-none text-foreground sm:text-7xl">{hero?.name}</h2>
            <p className="mt-2 font-mono text-xs uppercase tracking-widest text-foreground/70">{hero?.brand} · ${hero?.price}</p>
          </div>
        </motion.button>

        {cells.map((cell) => (
          <motion.button
            key={cell.label}
            variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onJump(cell.cat)}
            className="bento-cell haptic group relative flex aspect-square flex-col justify-end p-3 text-left"
          >
            {cell.product && (
              <img src={cell.product.image} alt={cell.label}
                className="absolute inset-0 h-full w-full object-cover opacity-55 transition-transform duration-700 group-hover:scale-110"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            <div className="relative">
              <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-vault-wire">Shop</p>
              <p className="font-display text-2xl uppercase leading-none text-foreground sm:text-3xl">{cell.label}</p>
            </div>
          </motion.button>
        ))}
      </motion.div>
    </section>
  );
}

function FloatingDock({
  cartCount, openCart, activeCategory, setActiveCategory, query, setQuery,
}: {
  cartCount: number; openCart: () => void;
  activeCategory: string; setActiveCategory: (c: string) => void;
  query: string; setQuery: (q: string) => void;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const categories = ["All", ...productSections];

  return (
    <>
      <AnimatePresence>
        {navOpen && (
          <motion.div
            key="nav"
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass-dock fixed bottom-24 left-1/2 z-40 w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl p-3"
          >
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => { setActiveCategory(c); setNavOpen(false); }}
                  className={`haptic rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] ${activeCategory === c ? "bg-white text-black" : "bg-white/5 text-foreground/70 hover:bg-white/10"}`}
                >{c}</button>
              ))}
            </div>
          </motion.div>
        )}
        {searchOpen && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="glass-dock fixed bottom-24 left-1/2 z-40 w-[min(92vw,520px)] -translate-x-1/2 rounded-2xl p-3"
          >
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input
                autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drops…"
                className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-9 pr-3 font-mono text-xs text-foreground placeholder:text-foreground/40 focus:border-white/40 focus:outline-none"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="glass-dock fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-1 rounded-full px-2 py-2 sm:gap-2">
        <button onClick={() => { setActiveCategory("All"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="haptic grid h-11 w-11 place-items-center rounded-full text-foreground hover:bg-white/10" aria-label="Home">
          <span className="font-display text-lg leading-none">J</span>
        </button>
        <button
          onClick={() => { setNavOpen((v) => !v); setSearchOpen(false); }}
          className={`haptic grid h-11 w-11 place-items-center rounded-full hover:bg-white/10 ${navOpen ? "bg-white text-black" : "text-foreground"}`}
          aria-label="Categories"
        >
          <Menu size={18} />
        </button>
        <button
          onClick={() => { setSearchOpen((v) => !v); setNavOpen(false); }}
          className={`haptic grid h-11 w-11 place-items-center rounded-full hover:bg-white/10 ${searchOpen ? "bg-white text-black" : "text-foreground"}`}
          aria-label="Search"
        >
          <Search size={18} />
        </button>
        <a href="https://t.me/joatz" className="haptic grid h-11 w-11 place-items-center rounded-full text-foreground hover:bg-white/10" aria-label="Telegram">
          <Send size={18} />
        </a>
        <button onClick={openCart} className="haptic relative grid h-11 w-11 place-items-center rounded-full text-foreground hover:bg-white/10" aria-label="Cart">
          <ShoppingBag size={18} />
          {cartCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 font-mono text-[9px] text-primary-foreground">{cartCount}</span>
          )}
        </button>
      </nav>
    </>
  );
}

function CatalogueGrid({
  title, count, items, onOpen,
}: { title: string; count: number; items: Product[]; onOpen: (product: Product) => void }) {
  return (
    <section className="relative py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-5">
        <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/10 pb-3">
          <h2 className="font-display text-4xl uppercase leading-none text-foreground sm:text-5xl">{title}</h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-vault-quiet">
            {count} {count === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product, idx) => (
            <ProductCard key={product.id} product={product} onOpen={onOpen} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VaultHeader({
  cartCount, openCart, query, setQuery, activeCategory, setActiveCategory,
}: {
  cartCount: number; openCart: () => void;
  query: string; setQuery: (q: string) => void;
  activeCategory: string; setActiveCategory: (c: string) => void;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const categories = ["All", ...productSections];
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button onClick={() => setNavOpen((v) => !v)} className="grid h-9 w-9 place-items-center text-foreground/80 hover:text-foreground md:hidden" aria-label="Open menu">
          <Menu size={20} />
        </button>
        <a href="/" className="font-display text-3xl uppercase leading-none text-foreground sm:text-4xl">J.O.A.T</a>
        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {categories.map((c) => (
            <button
              key={c} onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] transition ${activeCategory === c ? "bg-white text-black" : "text-foreground/60 hover:text-foreground"}`}
            >{c}</button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drops…"
              className="w-56 border border-white/15 bg-white/5 py-2 pl-9 pr-3 font-mono text-xs text-foreground placeholder:text-foreground/40 focus:border-white/40 focus:outline-none"
            />
          </div>
          <a href="https://t.me/joatz" className="hidden h-9 w-9 place-items-center text-foreground/70 hover:text-foreground sm:grid" aria-label="Telegram">
            <Send size={18} />
          </a>
          <button onClick={openCart} className="relative grid h-9 w-9 place-items-center text-foreground hover:text-white" aria-label="Open cart">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 font-mono text-[9px] text-black">{cartCount}</span>
            )}
          </button>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-2 md:hidden">
        <div className="relative mb-2">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search drops…"
            className="w-full border border-white/15 bg-white/5 py-2 pl-9 pr-3 font-mono text-xs text-foreground placeholder:text-foreground/40 focus:border-white/40 focus:outline-none"
          />
        </div>
        <div className={`flex gap-2 overflow-x-auto pb-1 ${navOpen ? "flex-wrap" : ""}`}>
          {categories.map((c) => (
            <button
              key={c} onClick={() => setActiveCategory(c)}
              className={`shrink-0 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition ${activeCategory === c ? "bg-white text-black" : "border border-white/15 text-foreground/70"}`}
            >{c}</button>
          ))}
        </div>
      </div>
    </header>
  );
}

/* ---------- Background music (unchanged engine) ---------- */
function BackgroundMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);
  const [starting, setStarting] = useState(false);

  const stop = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setPlaying(false);
    setStarting(false);
  }, []);

  const start = useCallback(async () => {
    if (playing || starting) return;
    setStarting(true);
    cleanupRef.current?.();
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    try { await ctx.resume(); } catch { setStarting(false); return; }

    const master = ctx.createGain(); master.gain.value = 0.16;
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -20; compressor.knee.value = 24; compressor.ratio.value = 6;
    compressor.attack.value = 0.008; compressor.release.value = 0.18;
    const lpf = ctx.createBiquadFilter(); lpf.type = "lowpass"; lpf.frequency.value = 5200;
    master.connect(compressor); compressor.connect(lpf); lpf.connect(ctx.destination);

    const play808 = (when: number, freq: number, dur: number) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 2, when);
      osc.frequency.exponentialRampToValueAtTime(freq, when + 0.05);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.5, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);
      osc.connect(g); g.connect(master); osc.start(when); osc.stop(when + dur + 0.05);
    };
    const playKick = (when: number) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, when);
      osc.frequency.exponentialRampToValueAtTime(40, when + 0.12);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.55, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.28);
      osc.connect(g); g.connect(master); osc.start(when); osc.stop(when + 0.32);
    };
    const playHat = (when: number, open = false) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (open ? 0.05 : 0.012)));
      const src = ctx.createBufferSource();
      const hp = ctx.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 7200;
      const g = ctx.createGain(); g.gain.value = open ? 0.1 : 0.13;
      src.buffer = buf; src.connect(hp); hp.connect(g); g.connect(master); src.start(when);
    };
    const playSnare = (when: number) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.22, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
      const src = ctx.createBufferSource();
      const bp = ctx.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 1700;
      const g = ctx.createGain(); g.gain.value = 0.18;
      src.buffer = buf; src.connect(bp); bp.connect(g); g.connect(master); src.start(when);
    };
    const playPad = (when: number, freq: number, dur: number) => {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.type = "sawtooth"; osc.frequency.value = freq; osc.detune.value = (Math.random() - 0.5) * 8;
      const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 700; f.Q.value = 4;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.05, when + 0.6);
      g.gain.linearRampToValueAtTime(0, when + dur);
      osc.connect(f); f.connect(g); g.connect(master); osc.start(when); osc.stop(when + dur + 0.1);
    };

    const bpm = 146; const beat = 60 / bpm; const sixteenth = beat / 4; const barDur = beat * 4;
    const bassPattern: Array<[number, number, number]> = [
      [0, 55.0, beat * 1.25],
      [beat * 1.5, 65.4, beat * 0.75],
      [beat * 2.25, 46.2, beat * 1.5],
    ];
    const padCycle = [
      [130.8, 155.6, 196.0], [123.5, 146.8, 185.0], [138.6, 174.6, 207.7], [130.8, 155.6, 196.0],
    ];

    let bar = 0;
    const schedule = () => {
      const now = ctx.currentTime + 0.05;
      for (let b = 0; b < 2; b++) {
        const barStart = now + b * barDur;
        padCycle[(bar + b) % padCycle.length].forEach((f) => playPad(barStart, f, barDur));
        playKick(barStart); playKick(barStart + beat * 2); playKick(barStart + beat * 2 + sixteenth * 2);
        playSnare(barStart + beat); playSnare(barStart + beat * 3);
        for (let i = 0; i < 16; i++) {
          const t = barStart + i * sixteenth;
          if (i % 2 === 0) playHat(t);
          else if (Math.random() < 0.55) playHat(t);
          if (i === 11) { playHat(t + sixteenth / 3); playHat(t + (2 * sixteenth) / 3); }
          if (i === 7) playHat(t, true);
        }
        bassPattern.forEach(([off, f, d]) => play808(barStart + off, f, d));
      }
      bar += 2;
    };
    schedule();
    const iv = window.setInterval(schedule, barDur * 2 * 1000 - 100);

    cleanupRef.current = () => {
      window.clearInterval(iv);
      try {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
      } catch {}
      window.setTimeout(() => { try { master.disconnect(); compressor.disconnect(); lpf.disconnect(); } catch {} }, 350);
    };

    setPlaying(true); setStarting(false);
  }, [playing, starting]);

  const toggle = () => (playing ? stop() : start());
  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <button
      type="button" onClick={toggle}
      className="group glass-dock haptic fixed right-5 top-5 z-30 flex items-center gap-3 rounded-full px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white"
      aria-label={playing ? "Pause music" : "Play music"} aria-pressed={playing} disabled={starting}
    >
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full">
        <span className={`album-disc-art ${playing ? "is-spinning" : ""}`} />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-white">J.O.A.T FM</span>
        <span className="text-white/50">{starting ? "Loading" : playing ? "On Air" : "Tap to Play"}</span>
      </span>
      {playing ? <Pause size={14} /> : <Play size={14} />}
    </button>
  );
}

/* ---------- Product card with 3D tilt + scroll fade ---------- */
function ProductCard({ product, onOpen, index = 0 }: { product: Product; onOpen: (product: Product) => void; index?: number }) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setShown(true); io.disconnect(); } });
    }, { rootMargin: "60px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 10).toFixed(2)}deg`);
  };
  const handleLeave = () => {
    const el = ref.current; if (!el) return;
    el.style.setProperty("--rx", `0deg`);
    el.style.setProperty("--ry", `0deg`);
  };

  const stagger = Math.min(index, 7) * 70;

  return (
    <button
      type="button" ref={ref}
      onMouseMove={handleMove} onMouseLeave={handleLeave}
      style={{ transitionDelay: shown ? `${stagger}ms` : "0ms" }}
      className={`tilt-card crimson-hover haptic group relative flex cursor-pointer flex-col overflow-hidden border border-white/10 bg-card text-left text-foreground shadow-[0_18px_50px_-18px_rgba(0,0,0,0.9)] ${shown ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"} transition-[opacity,transform] duration-700 ease-out`}
      onClick={() => onOpen(product)}
      aria-label={`View ${product.name}, ${product.brand}, $${product.price}`}
    >
      <div className="product-card-media product-glow relative aspect-[4/5] overflow-hidden">
        <img
          src={product.image} alt={product.name} loading="lazy" decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute left-2 top-2 bg-white/95 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-black">
          {product.brand}
        </div>
      </div>
      <div className="grid gap-1 border-t border-white/10 p-3">
        <h3 className="font-display text-lg uppercase leading-tight tracking-wide text-foreground line-clamp-1">{product.name}</h3>
        <div className="flex items-end justify-between gap-2">
          <p className="font-mono text-[9px] uppercase tracking-widest text-foreground/45">{product.sizes.length} sz · {product.colors.length} clr</p>
          <p className="font-display text-xl text-foreground">${product.price}</p>
        </div>
      </div>
    </button>
  );
}

const productCopy: Record<string, { tagline: string; description: string; details: string[] }> = {
  BAPE: {
    tagline: "A Bathing Ape — Tokyo streetwear royalty.",
    description: "Heavyweight cotton construction with signature BAPE branding. Sourced direct, deadstock guaranteed authentic.",
    details: ["100% premium cotton", "Boxed and tagged", "Authenticated source", "Ships within 48h"],
  },
  SP5DER: {
    tagline: "Sp5der Worldwide — signature web graphics.",
    description: "Plush French terry hoodie with rhinestone web detailing. Oversized fit, premium hand-feel.",
    details: ["French terry interior", "Rhinestone graphics", "Oversized streetwear fit", "Authentic Sp5der tags"],
  },
  "DENIM TEARS": {
    tagline: "Denim Tears — cotton wreath staples.",
    description: "Premium fleece shorts with the signature wreath layout. Clean everyday streetwear piece.",
    details: ["Fleece short", "Elastic drawstring waist", "Cotton wreath graphic", "Ships within 48h"],
  },
  "CHROME HEARTS": {
    tagline: "Chrome Hearts — statement graphic tees.",
    description: "Streetwear graphic tee with strong back-print presence and an easy everyday cut.",
    details: ["Cotton tee", "Graphic print", "Streetwear fit", "Ships within 48h"],
  },
  ESSENTIALS: {
    tagline: "Fear of God Essentials — elevated minimalism.",
    description: "Refined silhouette in muted tones. The everyday staple from Jerry Lorenzo's diffusion line.",
    details: ["Heavyweight cotton blend", "Relaxed athletic cut", "Tonal rubberized branding", "Original packaging"],
  },
  HELLSTAR: {
    tagline: "Hellstar Studios — LA cult graphic apparel.",
    description: "Garment-dyed heavyweight tee with bold front and back graphics. Limited drops, no restocks.",
    details: ["Heavyweight 240gsm cotton", "Vintage wash treatment", "Front + back prints", "Hellstar holographic tag"],
  },
  "DESIGNER FRAGRANCE": {
    tagline: "Designer fragrance — sealed, batch-coded, authentic.",
    description: "Sealed in original cellophane with verified batch codes. Original retail packaging.",
    details: ["Eau de Parfum", "Sealed in cellophane", "Batch code verified", "Original retail box"],
  },
};

/* ---------- Product detail dialog with zoom-on-hover image ---------- */
function ProductDetailDialog({
  product, onClose, onAdd,
}: {
  product: Product | null; onClose: () => void;
  onAdd: (product: Product, selectedColor: string, selectedSize: string) => void;
}) {
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [zoom, setZoom] = useState({ active: false, x: 50, y: 50 });

  useEffect(() => {
    if (!product) return;
    const saved = readProductOptionMemory(product.id);
    setSelectedColor(saved.color && product.colors.includes(saved.color) ? saved.color : (product.colors[0] ?? ""));
    setSelectedSize(saved.size && product.sizes.includes(saved.size) ? saved.size : (product.sizes[0] ?? ""));
  }, [product]);

  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-50 grid items-end bg-black/80 p-3 sm:place-items-center sm:p-4"
          onClick={onClose} role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="modal-scrollbar relative grid max-h-[92dvh] w-full max-w-4xl overflow-y-auto border border-white/15 bg-card text-foreground shadow-[0_20px_80px_-20px_rgba(255,40,60,0.5)] sm:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]"
            onClick={(e) => e.stopPropagation()}
            style={{ willChange: "transform, opacity" }}
            role="dialog" aria-modal="true" aria-labelledby="product-dialog-title"
          >
            <button onClick={onClose} aria-label="Close" className="absolute right-2 top-2 z-10 grid h-8 w-8 place-items-center bg-white/95 text-black transition hover:bg-white">
              <X size={16} />
            </button>

            <div
              className="relative min-h-[320px] overflow-hidden bg-black sm:sticky sm:top-0 sm:h-[92dvh]"
              onMouseEnter={() => setZoom((z) => ({ ...z, active: true }))}
              onMouseLeave={() => setZoom({ active: false, x: 50, y: 50 })}
              onMouseMove={(e) => {
                const r = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                setZoom({ active: true, x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
              }}
            >
              <img
                src={product.image} alt={product.name} loading="eager" decoding="async"
                className="absolute inset-0 h-full w-full object-contain transition-transform duration-300 ease-out sm:object-cover"
                style={{
                  transform: zoom.active ? "scale(1.7)" : "scale(1)",
                  transformOrigin: `${zoom.x}% ${zoom.y}%`,
                }}
              />
              <div className="absolute left-3 top-3 bg-white/95 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-black">
                {product.brand}
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">{product.category}</p>
              <h2 id="product-dialog-title" className="mt-1 font-display text-4xl uppercase leading-tight tracking-wide">{product.name}</h2>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="font-display text-2xl">${product.price}</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/45">{product.sizes.length} sz · {product.colors.length} clr</p>
              </div>
              <p className="mt-3 font-body text-sm leading-relaxed text-foreground/75">{productCopy[product.brand]?.description}</p>

              <div className="mt-5 grid gap-4">
                <OptionGroup label="Color" options={product.colors} value={selectedColor} onChange={setSelectedColor} />
                <OptionGroup label="Size" options={product.sizes} value={selectedSize} onChange={setSelectedSize} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-y border-white/10 py-3 text-center font-mono text-[9px] uppercase tracking-widest text-foreground/55">
                <div className="grid place-items-center gap-1"><Truck size={14} /> 48h</div>
                <div className="grid place-items-center gap-1"><Shield size={14} /> Real</div>
                <div className="grid place-items-center gap-1"><Package size={14} /> Tagged</div>
              </div>

              <button
                onClick={() => onAdd(product, selectedColor, selectedSize)}
                disabled={!selectedColor || !selectedSize}
                className="mt-4 w-full bg-primary py-3.5 font-display text-lg uppercase tracking-widest text-primary-foreground transition hover:bg-accent disabled:opacity-40"
              >
                Add ${product.price} to Cart
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function OptionGroup({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs uppercase text-foreground/50" id={`${label}-options`}>Select {label}</p>
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-labelledby={`${label}-options`}>
        {options.map((option) => (
          <button
            key={option} type="button" onClick={() => onChange(option)} role="radio" aria-checked={value === option}
            className={`border px-3 py-3 font-mono text-xs uppercase transition ${value === option ? "border-primary bg-primary text-primary-foreground shadow-vault-glow" : "border-white/15 bg-white/5 text-foreground hover:border-primary/70 focus-visible:border-primary"}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Cart Drawer (simplified — leads to checkout) ---------- */
function CartDrawer({
  open, cart, total, onRemove, onClose, onCheckout,
}: {
  open: boolean; cart: CartItem[]; total: number;
  onRemove: (idx: number) => void; onClose: () => void; onCheckout: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "105%" }} animate={{ x: 0 }} exit={{ x: "105%" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-white/15 bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <p className="font-display text-3xl uppercase leading-none">Cart</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">Sourcing direct</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close cart"><X /></Button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="font-mono uppercase text-foreground/50">Cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {cart.map((item, index) => (
                  <div key={`${item.id}-${index}`} className="flex items-center gap-3 border border-white/10 bg-white/[0.02] p-3">
                    <img src={item.image} alt="" className="h-16 w-16 object-cover" loading="lazy" />
                    <div className="flex-1 font-mono text-[11px] uppercase">
                      <p className="text-foreground">{item.name}</p>
                      <p className="text-foreground/50">{item.selectedColor} · {item.selectedSize}</p>
                      <p className="mt-1 font-display text-base text-foreground">${item.price}</p>
                    </div>
                    <button onClick={() => onRemove(index)} aria-label="Remove" className="text-foreground/50 hover:text-foreground"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-white/10 p-4">
            <div className="mb-3 flex justify-between font-display text-2xl uppercase">
              <span>Total</span><span>${total}</span>
            </div>
            <button
              onClick={onCheckout} disabled={cart.length === 0}
              className="w-full bg-white py-4 font-display text-xl uppercase tracking-widest text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              Checkout
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

/* ---------- Multi-step checkout dialog ---------- */
type CheckoutStep = "contact" | "shipping" | "billing" | "payment" | "review" | "submitting" | "done";

function CheckoutDialog({
  open, cart, total, onClose, onComplete,
}: {
  open: boolean; cart: CartItem[]; total: number;
  onClose: () => void; onComplete: () => void;
}) {
  const [step, setStep] = useState<CheckoutStep>("contact");
  const [data, setData] = useState<CheckoutData>(emptyCheckout);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [orderId, setOrderId] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");

  useEffect(() => {
    if (open) { setStep("contact"); setErrors({}); setSubmitError(""); }
  }, [open]);

  const validateStep = (s: CheckoutStep): boolean => {
    const errs: Record<string, string> = {};
    if (s === "contact") {
      if (data.fullName.trim().length < 2) errs.fullName = "Required";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) errs.email = "Valid email required";
      if (data.phone.replace(/\D/g, "").length < 7) errs.phone = "Valid phone required";
    }
    if (s === "shipping") {
      (["line1", "city", "region", "postal", "country"] as const).forEach((f) => {
        if (!data.shipping[f].trim()) errs[`s_${f}`] = "Required";
      });
      if (data.shipping.postal.length < 3) errs.s_postal = "Invalid postal";
    }
    if (s === "billing" && !data.sameAsBilling) {
      (["line1", "city", "region", "postal", "country"] as const).forEach((f) => {
        if (!data.billing[f].trim()) errs[`b_${f}`] = "Required";
      });
    }
    if (s === "payment") {
      if (data.paymentMethod === "card") {
        const digits = data.cardNumber.replace(/\D/g, "");
        if (digits.length < 13 || digits.length > 19) errs.cardNumber = "Valid card number required";
        if (!/^\d{2}\s*\/\s*\d{2}$/.test(data.cardExp.trim())) errs.cardExp = "MM/YY";
        if (!/^\d{3,4}$/.test(data.cardCvc.trim())) errs.cardCvc = "CVC";
        if (data.cardName.trim().length < 2) errs.cardName = "Name on card";
      }
      // cash_app and apple_pay are handled via external deep links — no in-form fields to validate.
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const next = () => {
    if (!validateStep(step)) return;
    if (step === "contact") setStep("shipping");
    else if (step === "shipping") setStep("billing");
    else if (step === "billing") setStep("payment");
    else if (step === "payment") setStep("review");
  };
  const back = () => {
    if (step === "shipping") setStep("contact");
    else if (step === "billing") setStep("shipping");
    else if (step === "payment") setStep("billing");
    else if (step === "review") setStep("payment");
  };

  const submit = async () => {
    setStep("submitting"); setSubmitError("");
    const billing = data.sameAsBilling ? data.shipping : data.billing;
    const paymentLabel = data.paymentMethod === "card"
      ? `Card ending ${data.cardNumber.replace(/\D/g, "").slice(-4)} (${data.cardName.trim()}, exp ${data.cardExp.trim()})`
      : data.paymentMethod === "apple_pay"
        ? "Apple Pay → 817-475-8594 (iMessage Apple Cash)"
        : "Cash App → $thegraysonn";
    const notesWithPayment = `[Payment: ${paymentLabel}]${data.notes.trim() ? "\n" + data.notes.trim() : ""}`;
    try {
      const { data: res, error } = await supabase.functions.invoke("submit-order", {
        body: {
          fullName: data.fullName.trim(),
          email: data.email.trim(),
          phone: data.phone.trim(),
          shippingAddress: data.shipping,
          billingAddress: billing,
          items: cart.map((c) => ({ id: c.id, name: c.name, brand: c.brand, size: c.selectedSize, color: c.selectedColor, price: c.price })),
          totalCents: total * 100,
          notes: notesWithPayment,
        },
      });
      if (error) throw error;
      if (!res?.ok) throw new Error(res?.error || "Order failed");
      setOrderId(res.orderId);
      setStep("done");
      onComplete();
    } catch (e: any) {
      console.error("checkout submit failed", e);
      setSubmitError(e?.message || "Could not submit order. Please try again.");
      setStep("review");
    }
  };

  const stepIndex: number = { contact: 0, shipping: 1, billing: 2, payment: 3, review: 4, submitting: 4, done: 5 }[step];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] grid items-end bg-black/85 p-2 sm:place-items-center sm:p-4"
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="modal-scrollbar relative flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-y-auto border border-white/15 bg-card shadow-[0_20px_80px_-20px_rgba(255,40,60,0.5)]"
            role="dialog" aria-modal="true" aria-labelledby="checkout-title"
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-card/95 p-4 backdrop-blur">
              <div>
                <h2 id="checkout-title" className="font-display text-2xl uppercase tracking-wide">Secure Checkout</h2>
                <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">All sales final · Ships in 48h</p>
              </div>
              <button onClick={onClose} aria-label="Close checkout" className="grid h-8 w-8 place-items-center bg-white/95 text-black hover:bg-white">
                <X size={16} />
              </button>
            </header>

            <div className="border-b border-white/10 p-4">
              <ol className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest">
                {["Contact", "Ship", "Bill", "Pay", "Review", "Done"].map((label, i) => (
                  <li key={label} className="flex flex-1 items-center gap-2">
                    <span className={`grid h-6 w-6 place-items-center border ${i <= stepIndex ? "border-primary bg-primary text-primary-foreground" : "border-white/20 text-foreground/40"}`}>
                      {i < stepIndex ? <Check size={12} /> : i + 1}
                    </span>
                    <span className={i <= stepIndex ? "text-foreground" : "text-foreground/40"}>{label}</span>
                  </li>
                ))}
              </ol>
            </div>

            <div className="flex-1 p-5">
              {step === "contact" && (
                <div className="grid gap-4">
                  <Field label="Full Name *" value={data.fullName} onChange={(v) => setData({ ...data, fullName: v })} error={errors.fullName} autoComplete="name" />
                  <Field label="Email *" type="email" value={data.email} onChange={(v) => setData({ ...data, email: v })} error={errors.email} autoComplete="email" />
                  <Field label="Phone *" type="tel" value={data.phone} onChange={(v) => setData({ ...data, phone: v })} error={errors.phone} autoComplete="tel" />
                </div>
              )}
              {step === "shipping" && (
                <AddressFields prefix="s_" address={data.shipping} setAddress={(a) => setData({ ...data, shipping: a })} errors={errors} title="Shipping Address" />
              )}
              {step === "billing" && (
                <div className="grid gap-4">
                  <label className="flex cursor-pointer items-center gap-2 border border-white/15 bg-white/5 p-3 font-mono text-xs uppercase">
                    <input type="checkbox" checked={data.sameAsBilling} onChange={(e) => setData({ ...data, sameAsBilling: e.target.checked })} className="h-4 w-4 accent-primary" />
                    Billing same as shipping
                  </label>
                  {!data.sameAsBilling && (
                    <AddressFields prefix="b_" address={data.billing} setAddress={(a) => setData({ ...data, billing: a })} errors={errors} title="Billing Address" />
                  )}
                  <div className="grid gap-1 font-mono text-[11px] uppercase text-foreground/60">
                    Order notes (optional)
                    <textarea
                      value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value.slice(0, 2000) })}
                      rows={3}
                      className="border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm text-foreground focus:border-white/40 focus:outline-none"
                      placeholder="Anything we should know"
                    />
                  </div>
                </div>
              )}
              {step === "payment" && (
                <PaymentPanel data={data} setData={setData} errors={errors} total={total} />
              )}
              {step === "review" && (
                <ReviewPanel data={data} cart={cart} total={total} submitError={submitError} />
              )}
              {step === "submitting" && (
                <div className="grid place-items-center gap-3 py-12 font-mono text-xs uppercase text-foreground/70">
                  <Loader2 className="animate-spin" size={28} />
                  Securing your order…
                </div>
              )}
              {step === "done" && (
                <div className="grid place-items-center gap-4 py-10 text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground"><Check size={28} /></div>
                  <h3 className="font-display text-3xl uppercase">Order Confirmed</h3>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-foreground/60">ID · {orderId}</p>
                  <p className="max-w-sm font-body text-sm text-foreground/70">
                    A fulfillment invoice has been sent to the JOAT team. We'll reach out via email within 24h with tracking & next steps.
                  </p>
                  <button onClick={onClose} className="mt-2 bg-white px-8 py-3 font-display text-lg uppercase tracking-widest text-black hover:bg-white/90">
                    Close
                  </button>
                </div>
              )}
            </div>

            {step !== "submitting" && step !== "done" && (
              <footer className="sticky bottom-0 flex items-center justify-between border-t border-white/10 bg-card/95 p-4 backdrop-blur">
                <button
                  onClick={back} disabled={step === "contact"}
                  className="flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-foreground/70 disabled:opacity-30"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <p className="font-display text-xl uppercase">${total}</p>
                {step === "review" ? (
                  <button onClick={submit} className="flex items-center gap-2 bg-primary px-5 py-3 font-display text-base uppercase tracking-widest text-primary-foreground hover:bg-accent">
                    Place Order <Check size={16} />
                  </button>
                ) : (
                  <button onClick={next} className="flex items-center gap-2 bg-white px-5 py-3 font-display text-base uppercase tracking-widest text-black hover:bg-white/90">
                    Next <ChevronRight size={16} />
                  </button>
                )}
              </footer>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Field({
  label, value, onChange, type = "text", error, autoComplete,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; error?: string; autoComplete?: string;
}) {
  return (
    <label className="grid gap-1 font-mono text-[11px] uppercase tracking-widest text-foreground/60">
      {label}
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value.slice(0, 320))}
        autoComplete={autoComplete} maxLength={320}
        className={`border bg-white/5 px-3 py-3 font-mono text-sm normal-case text-foreground focus:outline-none ${error ? "border-primary" : "border-white/15 focus:border-white/40"}`}
      />
      {error && <span className="text-[10px] text-primary">{error}</span>}
    </label>
  );
}

function AddressFields({
  prefix, address, setAddress, errors, title,
}: {
  prefix: "s_" | "b_"; address: AddressData;
  setAddress: (a: AddressData) => void;
  errors: Record<string, string>; title: string;
}) {
  const upd = (k: keyof AddressData, v: string) => setAddress({ ...address, [k]: v.slice(0, 200) });
  return (
    <div className="grid gap-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">{title}</p>
      <Field label="Address Line 1 *" value={address.line1} onChange={(v) => upd("line1", v)} error={errors[`${prefix}line1`]} autoComplete="address-line1" />
      <Field label="Address Line 2" value={address.line2} onChange={(v) => upd("line2", v)} autoComplete="address-line2" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="City *" value={address.city} onChange={(v) => upd("city", v)} error={errors[`${prefix}city`]} autoComplete="address-level2" />
        <Field label="State / Region *" value={address.region} onChange={(v) => upd("region", v)} error={errors[`${prefix}region`]} autoComplete="address-level1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Postal Code *" value={address.postal} onChange={(v) => upd("postal", v)} error={errors[`${prefix}postal`]} autoComplete="postal-code" />
        <Field label="Country *" value={address.country} onChange={(v) => upd("country", v)} error={errors[`${prefix}country`]} autoComplete="country-name" />
      </div>
    </div>
  );
}

function ReviewPanel({
  data, cart, total, submitError,
}: { data: CheckoutData; cart: CartItem[]; total: number; submitError: string }) {
  const billing = data.sameAsBilling ? data.shipping : data.billing;
  return (
    <div className="grid gap-5 font-mono text-xs">
      {submitError && (
        <div className="border border-primary bg-primary/10 p-3 text-[11px] uppercase text-primary">{submitError}</div>
      )}
      <section>
        <h4 className="mb-2 font-display text-lg uppercase tracking-wide">Items</h4>
        <ul className="grid gap-2">
          {cart.map((c, i) => (
            <li key={i} className="flex items-center justify-between border-b border-white/10 py-2">
              <span className="uppercase text-foreground/80">{c.name} · {c.selectedColor} · {c.selectedSize}</span>
              <span className="text-foreground">${c.price}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex justify-between font-display text-2xl uppercase"><span>Total</span><span>${total}</span></p>
      </section>
      <section className="grid gap-3 sm:grid-cols-2">
        <div>
          <h4 className="mb-1 font-display text-base uppercase">Contact</h4>
          <p className="text-foreground/80">{data.fullName}</p>
          <p className="text-foreground/60 normal-case">{data.email}</p>
          <p className="text-foreground/60">{data.phone}</p>
        </div>
        <div>
          <h4 className="mb-1 font-display text-base uppercase">Ship To</h4>
          <AddressLine a={data.shipping} />
        </div>
        <div>
          <h4 className="mb-1 font-display text-base uppercase">Bill To</h4>
          <AddressLine a={billing} />
        </div>
        <div className="sm:col-span-2">
          <h4 className="mb-1 font-display text-base uppercase">Payment</h4>
          <p className="normal-case text-foreground/80">
            {data.paymentMethod === "card" && `Card ending •••• ${data.cardNumber.replace(/\D/g, "").slice(-4) || "----"}`}
            {data.paymentMethod === "apple_pay" && "Apple Pay → 817-475-8594"}
            {data.paymentMethod === "cash_app" && "Cash App → $thegraysonn"}
          </p>
        </div>
        {data.notes && (
          <div>
            <h4 className="mb-1 font-display text-base uppercase">Notes</h4>
            <p className="normal-case text-foreground/70">{data.notes}</p>
          </div>
        )}
      </section>
      <p className="border-t border-white/10 pt-3 text-[10px] uppercase tracking-widest text-foreground/50">
        By placing this order you reaffirm: all sales final, no refunds, returns, or exchanges.
      </p>
    </div>
  );
}

function AddressLine({ a }: { a: AddressData }) {
  return (
    <p className="normal-case text-foreground/80">
      {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
      {a.city}, {a.region} {a.postal}<br />
      {a.country}
    </p>
  );
}

/* ---------- Payment method selection ---------- */
function PaymentPanel({
  data, setData, errors, total,
}: {
  data: CheckoutData;
  setData: (d: CheckoutData) => void;
  errors: Record<string, string>;
  total: number;
}) {
  const AppleLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.02-.81.84-2.13 1.49-3.22 1.4-.14-1.11.43-2.27 1.17-3.04.82-.86 2.23-1.5 3.26-1.38zM20.5 17.27c-.55 1.27-.82 1.83-1.53 2.95-.99 1.56-2.39 3.51-4.12 3.52-1.54.02-1.93-1-4.02-.99-2.08.01-2.51 1.01-4.05.99-1.74-.02-3.06-1.77-4.05-3.33C-.04 15.97-.39 10.95 2.04 8.27c1.16-1.28 2.99-2.09 4.71-2.09 1.76 0 2.86 1 4.31 1 1.41 0 2.27-1 4.3-1 1.54 0 3.17.84 4.34 2.29-3.82 2.09-3.2 7.55.8 8.8z" />
    </svg>
  );
  const CashAppLogo = (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M15.71 8.6c.2.2.52.2.72 0l.92-.92a.51.51 0 0 0-.02-.74A6.9 6.9 0 0 0 13.9 5.4l-.32-1.43a.5.5 0 0 0-.49-.39h-1.55a.5.5 0 0 0-.49.39l-.28 1.27c-2.07.18-3.83 1.39-3.83 3.55 0 1.87 1.47 2.68 3.02 3.23l1.46.53c1 .37 1.78.71 1.78 1.5 0 .82-.8 1.32-1.97 1.32-1.07 0-2.19-.36-3.06-1.18a.51.51 0 0 0-.71.01l-1 1c-.2.2-.2.52 0 .72a6.96 6.96 0 0 0 3.27 1.77l.3 1.34a.5.5 0 0 0 .49.39h1.56a.5.5 0 0 0 .49-.4l.29-1.3c2.47-.27 4-1.74 4-3.83 0-1.7-1.06-2.71-3.16-3.49l-1.27-.46c-.94-.34-1.85-.66-1.85-1.4 0-.72.78-1.2 1.84-1.2 1.06 0 2.06.42 2.79 1.11z" />
    </svg>
  );
  const methods: Array<{ id: PaymentMethod; label: string; sub: string; render: (active: boolean) => React.ReactNode }> = [
    {
      id: "card", label: "Card", sub: "Visa · Mastercard · Amex · Discover",
      render: (a) => <CreditCard size={20} className={a ? "text-primary" : "text-foreground/70"} />,
    },
    {
      id: "apple_pay", label: "Apple Pay", sub: "Instant via iMessage Apple Cash",
      render: (a) => <AppleLogo className={`h-5 w-5 ${a ? "text-primary" : "text-foreground"}`} />,
    },
    {
      id: "cash_app", label: "Cash App", sub: "One-tap pay to $thegraysonn",
      render: (a) => <CashAppLogo className={`h-5 w-5 ${a ? "text-primary" : "text-[#00d54b]"}`} />,
    },
  ];
  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  const formatExp = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
  };

  return (
    <div className="grid gap-4">
      <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">Payment Method</p>
      <div className="grid gap-2">
        {methods.map(({ id, label, sub, render }) => {
          const active = data.paymentMethod === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setData({ ...data, paymentMethod: id })}
              className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                active
                  ? "border-primary bg-primary/10 shadow-[0_0_24px_-10px_rgba(255,40,60,0.7)]"
                  : "border-white/10 bg-white/[0.04] hover:border-white/25"
              }`}
            >
              <span className={`grid h-11 w-11 place-items-center rounded-lg border ${active ? "border-primary/60 bg-primary/10" : "border-white/15 bg-black/40"}`}>
                {render(active)}
              </span>
              <span className="flex-1">
                <span className="block font-display text-base uppercase tracking-wide">{label}</span>
                <span className="block font-mono text-[10px] uppercase tracking-widest text-foreground/50">{sub}</span>
              </span>
              <span className={`grid h-5 w-5 place-items-center rounded-full border ${active ? "border-primary bg-primary text-primary-foreground" : "border-white/30"}`}>
                {active && <Check size={12} />}
              </span>
            </button>
          );
        })}
      </div>

      {data.paymentMethod === "card" && (
        <div className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <Field
            label="Card Number *"
            value={data.cardNumber}
            onChange={(v) => setData({ ...data, cardNumber: formatCardNumber(v) })}
            error={errors.cardNumber}
            autoComplete="cc-number"
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Expiry MM/YY *"
              value={data.cardExp}
              onChange={(v) => setData({ ...data, cardExp: formatExp(v) })}
              error={errors.cardExp}
              autoComplete="cc-exp"
            />
            <Field
              label="CVC *"
              value={data.cardCvc}
              onChange={(v) => setData({ ...data, cardCvc: v.replace(/\D/g, "").slice(0, 4) })}
              error={errors.cardCvc}
              autoComplete="cc-csc"
            />
          </div>
          <Field
            label="Name on Card *"
            value={data.cardName}
            onChange={(v) => setData({ ...data, cardName: v })}
            error={errors.cardName}
            autoComplete="cc-name"
          />
        </div>
      )}

      {data.paymentMethod === "apple_pay" && (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-5">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg bg-black px-3 py-1.5 ring-1 ring-white/20">
              <AppleLogo className="h-4 w-4 text-white" />
              <span className="font-display text-sm tracking-tight text-white">Pay</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">Apple Cash · iMessage</span>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">Send</span>
            <span className="font-display text-3xl tracking-tight">${total.toFixed(2)}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">to</span>
          </div>
          <p className="mt-1 font-display text-lg tracking-wider text-vault-crimson">(817) 475-8594</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <a
              href={`sms:+18174758594?&body=${encodeURIComponent(`Apple Pay $${total.toFixed(2)} for JOAT Vault order — ${data.fullName || ""}`)}`}
              className="haptic inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-white font-display uppercase tracking-wide text-black transition hover:bg-white/90"
            >
              <AppleLogo className="h-4 w-4" /> Open Messages
            </a>
            <button
              type="button"
              onClick={() => { navigator.clipboard?.writeText("8174758594"); }}
              className="haptic inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] font-mono text-[11px] uppercase tracking-widest text-foreground/80 transition hover:border-white/30"
            >
              Copy Number
            </button>
          </div>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-foreground/50">
            In Messages, tap the Apple Pay <span className="text-foreground/80">$</span> icon → send ${total.toFixed(2)} → then place your order below.
          </p>
        </div>
      )}

      {data.paymentMethod === "cash_app" && (
        <div className="relative overflow-hidden rounded-2xl border border-[#00d54b]/25 bg-gradient-to-br from-[#00d54b]/15 via-[#00d54b]/5 to-transparent p-5">
          <div className="pointer-events-none absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-[#00d54b]/20 blur-3xl" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-lg bg-[#00d54b] px-3 py-1.5">
              <CashAppLogo className="h-4 w-4 text-black" />
              <span className="font-display text-sm tracking-tight text-black">Cash App</span>
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/60">One-tap pay</span>
          </div>
          <div className="mt-5 flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">Send</span>
            <span className="font-display text-3xl tracking-tight">${total.toFixed(2)}</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">to</span>
          </div>
          <p className="mt-1 font-display text-lg tracking-wider text-[#00d54b]">$thegraysonn</p>
          <a
            href={`https://cash.app/$thegraysonn/${total.toFixed(2)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="haptic mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#00d54b] font-display uppercase tracking-wide text-black transition hover:brightness-110"
          >
            <CashAppLogo className="h-4 w-4" /> Pay ${total.toFixed(2)} Now
          </a>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-foreground/50">
            Opens Cash App with the amount pre-filled. Complete payment → then place your order.
          </p>
        </div>
      )}
    </div>
  );
}

/* ---------- Terms of Service modal ---------- */
function TosModal({
  open, onAccept, dismissible, onDismiss,
}: { open: boolean; onAccept: () => void; dismissible: boolean; onDismiss: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] grid place-items-center bg-black/90 p-4"
          role="dialog" aria-modal="true" aria-labelledby="tos-title"
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full max-w-md border border-white/15 bg-card p-6 shadow-[0_20px_80px_-20px_rgba(255,40,60,0.55)]"
          >
            <div className="mb-3 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center bg-primary text-primary-foreground"><Shield size={16} /></span>
              <h2 id="tos-title" className="font-display text-2xl uppercase tracking-wide">Terms of Service</h2>
            </div>
            <div className="space-y-3 font-body text-sm text-foreground/80">
              <p>By proceeding, you agree to our Terms of Service.</p>
              <p className="font-display text-xl uppercase tracking-widest text-primary">All sales are 100% final.</p>
              <p>No refunds, returns, or exchanges. Items are sourced direct and authenticated. Orders ship within 48 hours of confirmation.</p>
            </div>
            <div className="mt-5 grid gap-2">
              <button onClick={onAccept} className="w-full bg-white py-3 font-display text-lg uppercase tracking-widest text-black transition hover:bg-white/90">
                I Agree
              </button>
              {dismissible && (
                <button onClick={onDismiss} className="font-mono text-[10px] uppercase tracking-widest text-foreground/40 hover:text-foreground/70">
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- MASK chat widget ---------- */
type MaskMessage = { role: "user" | "assistant"; content: string };

function MaskWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<MaskMessage[]>([
    { role: "assistant", content: "Welcome to J.O.A.T. I'm MASK — ask about shipping, sizing, TOS, or any drop." },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    if (text.length > 1500) return;
    const next: MaskMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("mask-chat", { body: { messages: next } });
      if (error) throw error;
      const reply = String(data?.reply ?? "I am MASK. I can only assist with store-related inquiries. How can I help you shop today?");
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "I'd love to help further — please email GQHarris10202011@gmail.com or DM @joatz on Telegram." }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="haptic fixed bottom-24 right-5 z-40 grid place-items-center rounded-full"
        aria-label="Open MASK support chat" aria-expanded={open}
      >
        {open ? (
          <span className="grid h-14 w-14 place-items-center rounded-full bg-card text-foreground shadow-[0_10px_40px_-10px_rgba(255,40,60,0.7)]">
            <X size={22} />
          </span>
        ) : (
          <span className="mask-orb grid place-items-center">
            <span className="font-display text-xs uppercase tracking-widest text-white/95">Mask</span>
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-44 right-5 z-40 flex h-[min(70dvh,520px)] w-[calc(100vw-2.5rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-white/15 bg-card shadow-[0_20px_80px_-20px_rgba(255,40,60,0.5)]"
            role="dialog" aria-label="MASK Support Chat"
          >
            <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 p-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground"><MessageCircle size={16} /></span>
              <div>
                <p className="font-display text-lg uppercase leading-none">MASK · Support</p>
                <p className="font-mono text-[9px] uppercase tracking-widest text-foreground/50">Online · J.O.A.T</p>
              </div>
            </div>
            <div ref={scrollRef} className="modal-scrollbar flex-1 space-y-3 overflow-y-auto p-3 font-body text-sm">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[82%] whitespace-pre-wrap px-3 py-2 ${m.role === "user" ? "bg-white text-black" : "border border-white/10 bg-white/5 text-foreground"}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="border border-white/10 bg-white/5 px-3 py-2 text-foreground/60">
                    <Loader2 className="inline animate-spin" size={14} /> typing…
                  </div>
                </div>
              )}
            </div>
            <form
              onSubmit={(e) => { e.preventDefault(); send(); }}
              className="flex items-center gap-2 border-t border-white/10 bg-black/40 p-2"
            >
              <input
                value={input} onChange={(e) => setInput(e.target.value.slice(0, 1500))}
                placeholder="Ask MASK…" maxLength={1500}
                className="flex-1 border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm text-foreground focus:border-white/40 focus:outline-none"
                aria-label="Message MASK"
              />
              <button type="submit" disabled={!input.trim() || sending} className="grid h-9 w-9 place-items-center bg-primary text-primary-foreground disabled:opacity-40" aria-label="Send">
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
