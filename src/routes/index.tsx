import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { Pause, Play, Search, ShoppingBag, Truck, Shield, Package, X, Menu, Send } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import products from "@/data/products.json";

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
type OrderDetails = { name: string; address: string; telegram: string };
type OrderStage = "cart" | "details" | "assigning" | "pay";

const ACCESS_KEY = "joat-vault-access-2026";
const PRODUCT_OPTION_KEY = "joat-product-options";

const readProductOptionMemory = (productId: string) => {
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_OPTION_KEY) ?? "{}") as Record<
      string,
      { color?: string; size?: string }
    >;
    return saved[productId] ?? {};
  } catch {
    return {};
  }
};

const writeProductOptionMemory = (productId: string, color: string, size: string) => {
  try {
    const saved = JSON.parse(localStorage.getItem(PRODUCT_OPTION_KEY) ?? "{}") as Record<
      string,
      { color?: string; size?: string }
    >;
    localStorage.setItem(
      PRODUCT_OPTION_KEY,
      JSON.stringify({ ...saved, [productId]: { color, size } }),
    );
  } catch {
    localStorage.setItem(PRODUCT_OPTION_KEY, JSON.stringify({ [productId]: { color, size } }));
  }
};

const productSections = [
  "Bape Tees",
  "Sp5der Hoodies",
  "Essentials Shorts",
  "Hellstar Tees",
  "Fragrance",
] as const;

function Index() {
  const [unlocked, setUnlocked] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectingProduct, setSelectingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [stage, setStage] = useState<OrderStage>("cart");
  const [orderId, setOrderId] = useState("");
  const [details, setDetails] = useState<OrderDetails>({ name: "", address: "", telegram: "" });
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    setUnlocked(localStorage.getItem(ACCESS_KEY) === "granted");
  }, []);

  const total = cart.reduce((sum, item) => sum + item.price, 0);

  const addToDrop = (product: Product, selectedColor: string, selectedSize: string) => {
    setCart((items) => [...items, { ...product, selectedColor, selectedSize }]);
    setCartOpen(true);
  };

  const submitDetails = () => {
    setStage("assigning");
    window.setTimeout(() => {
      setOrderId(
        `JOAT-${Math.floor(500 + Math.random() * 400)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
      );
      setStage("pay");
    }, 900);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <SpaceBackdrop />
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
        onConfigure={(product) => {
          setViewingProduct(null);
          setSelectingProduct(product);
        }}
      />

      <ProductSelectionDrawer
        product={selectingProduct}
        onClose={() => setSelectingProduct(null)}
        onAdd={(product, selectedColor, selectedSize) => {
          addToDrop(product, selectedColor, selectedSize);
          setSelectingProduct(null);
        }}
      />

      <CartDrawer
        open={cartOpen}
        cart={cart}
        total={total}
        stage={stage}
        details={details}
        orderId={orderId}
        setDetails={setDetails}
        onClose={() => setCartOpen(false)}
        onStage={setStage}
        onSubmitDetails={submitDetails}
      />
    </main>
  );
}

function SpaceBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 deep-space-gradient" />
      <div className="absolute inset-0 starfield" />
      <div className="absolute inset-0 nebula-drift" />
    </div>
  );
}

function RestrictedGateway({ onUnlock }: { onUnlock: () => void }) {
  const lockedRef = useRef(false);

  const enterVault = () => {
    if (lockedRef.current) return;
    lockedRef.current = true;
    try {
      localStorage.setItem(ACCESS_KEY, "granted");
    } catch {}
    onUnlock();
  };

  return (
    <motion.section
      exit={{ opacity: 0, scale: 1.05, filter: "blur(8px)" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative z-10 grid min-h-screen place-items-center px-5"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 flex w-full max-w-xl flex-col items-center text-center"
      >
        <p className="font-mono text-[11px] uppercase tracking-[0.4em] text-vault-quiet">
          Source · Pack · Ship
        </p>
        <h1 className="mt-3 font-display text-7xl uppercase leading-none text-foreground sm:text-9xl">
          J.O.A.T
        </h1>
        <p className="mt-4 max-w-sm font-body text-sm text-vault-quiet">
          Jack of all trades. Master of the source. Designer, streetwear & fragrance — sourced
          direct.
        </p>

        <button
          type="button"
          onClick={enterVault}
          className="enter-cta group relative mt-10 inline-flex items-center justify-center overflow-hidden border border-white/20 bg-white px-12 py-5 font-display text-2xl uppercase tracking-[0.25em] text-black transition-transform duration-200 active:scale-[0.98]"
        >
          <span className="relative z-10">Enter</span>
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </button>

        <a
          href="https://t.me/joatz"
          className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-vault-quiet hover:text-foreground"
        >
          Telegram · @joatz
        </a>
      </motion.div>
    </motion.section>
  );
}

function VaultHub({
  cart,
  openProductDetail,
  openCart,
  query,
  setQuery,
  activeCategory,
  setActiveCategory,
}: {
  cart: CartItem[];
  openProductDetail: (product: Product) => void;
  openCart: () => void;
  query: string;
  setQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
}) {
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const inCat = activeCategory === "All" || p.category === activeCategory;
      if (!inCat) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCategory]);

  const sectionsToRender =
    activeCategory === "All" ? productSections : ([activeCategory] as readonly string[]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative z-10 min-h-screen"
    >
      <VaultHeader
        cartCount={cart.length}
        openCart={openCart}
        query={query}
        setQuery={setQuery}
        activeCategory={activeCategory}
        setActiveCategory={setActiveCategory}
      />
      <BackgroundMusic />

      <section className="relative pt-8">
        {query.trim() ? (
          <CatalogueGrid
            title={`Search · "${query}"`}
            count={filtered.length}
            items={filtered}
            onOpen={openProductDetail}
          />
        ) : (
          sectionsToRender.map((section) => {
            const sectionProducts = filtered.filter((p) => p.category === section);
            if (sectionProducts.length === 0) return null;
            return (
              <CatalogueGrid
                key={section}
                title={section}
                count={sectionProducts.length}
                items={sectionProducts}
                onOpen={openProductDetail}
              />
            );
          })
        )}

        {query.trim() && filtered.length === 0 && (
          <p className="mx-auto max-w-7xl px-4 py-20 text-center font-mono text-sm uppercase text-vault-quiet">
            Nothing matches "{query}"
          </p>
        )}
      </section>

      <footer className="relative border-t border-white/10 py-10 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-vault-quiet">
        J.O.A.T · Source Vault · Telegram @joatz
      </footer>
    </motion.section>
  );
}

function CatalogueGrid({
  title,
  count,
  items,
  onOpen,
}: {
  title: string;
  count: number;
  items: Product[];
  onOpen: (product: Product) => void;
}) {
  return (
    <section className="relative py-8">
      <div className="mx-auto max-w-7xl px-3 sm:px-5">
        <div className="mb-5 flex items-end justify-between gap-3 border-b border-white/10 pb-3">
          <h2 className="font-display text-4xl uppercase leading-none text-foreground sm:text-5xl">
            {title}
          </h2>
          <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-vault-quiet">
            {count} {count === 1 ? "item" : "items"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}

function VaultHeader({
  cartCount,
  openCart,
  query,
  setQuery,
  activeCategory,
  setActiveCategory,
}: {
  cartCount: number;
  openCart: () => void;
  query: string;
  setQuery: (q: string) => void;
  activeCategory: string;
  setActiveCategory: (c: string) => void;
}) {
  const [navOpen, setNavOpen] = useState(false);
  const categories = ["All", ...productSections];

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <button
          onClick={() => setNavOpen((v) => !v)}
          className="grid h-9 w-9 place-items-center text-foreground/80 hover:text-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <a href="/" className="font-display text-3xl uppercase leading-none text-foreground sm:text-4xl">
          J.O.A.T
        </a>

        <nav className="hidden flex-1 items-center justify-center gap-1 md:flex">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.2em] transition ${
                activeCategory === c
                  ? "bg-white text-black"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search drops…"
              className="w-56 border border-white/15 bg-white/5 py-2 pl-9 pr-3 font-mono text-xs text-foreground placeholder:text-foreground/40 focus:border-white/40 focus:outline-none"
            />
          </div>
          <a
            href="https://t.me/joatz"
            className="hidden h-9 w-9 place-items-center text-foreground/70 hover:text-foreground sm:grid"
            aria-label="Telegram"
          >
            <Send size={18} />
          </a>
          <button
            onClick={openCart}
            className="relative grid h-9 w-9 place-items-center text-foreground hover:text-white"
            aria-label="Open cart"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-white px-1 font-mono text-[9px] text-black">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile search + categories */}
      <div className="border-t border-white/10 px-4 py-2 md:hidden">
        <div className="relative mb-2">
          <Search
            size={14}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search drops…"
            className="w-full border border-white/15 bg-white/5 py-2 pl-9 pr-3 font-mono text-xs text-foreground placeholder:text-foreground/40 focus:border-white/40 focus:outline-none"
          />
        </div>
        <div className={`flex gap-2 overflow-x-auto pb-1 ${navOpen ? "flex-wrap" : ""}`}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`shrink-0 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] transition ${
                activeCategory === c
                  ? "bg-white text-black"
                  : "border border-white/15 text-foreground/70"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}

function BackgroundMusic() {
  const ctxRef = useRef<AudioContext | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [playing, setPlaying] = useState(false);

  const stop = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setPlaying(false);
  };

  const start = async () => {
    const ctx = ctxRef.current ?? new AudioContext();
    ctxRef.current = ctx;
    await ctx.resume();

    const master = ctx.createGain();
    master.gain.value = 0.22;
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 3800;
    master.connect(lpf);
    lpf.connect(ctx.destination);

    // 808 sub-bass — drill style sliding bass
    const play808 = (when: number, freq: number, dur: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq * 2, when);
      osc.frequency.exponentialRampToValueAtTime(freq, when + 0.05);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.5, when + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, when + dur);
      osc.connect(g);
      g.connect(master);
      osc.start(when);
      osc.stop(when + dur + 0.05);
    };

    // Punchy kick
    const playKick = (when: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, when);
      osc.frequency.exponentialRampToValueAtTime(40, when + 0.12);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.55, when + 0.005);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.28);
      osc.connect(g);
      g.connect(master);
      osc.start(when);
      osc.stop(when + 0.32);
    };

    // Crisp hi-hat
    const playHat = (when: number, open = false) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * (open ? 0.05 : 0.012)));
      const src = ctx.createBufferSource();
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 7200;
      const g = ctx.createGain();
      g.gain.value = open ? 0.1 : 0.13;
      src.buffer = buf;
      src.connect(hp);
      hp.connect(g);
      g.connect(master);
      src.start(when);
    };

    // Snare / clap on 2 & 4
    const playSnare = (when: number) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.22, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++)
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.06));
      const src = ctx.createBufferSource();
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1700;
      const g = ctx.createGain();
      g.gain.value = 0.18;
      src.buffer = buf;
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(when);
    };

    // Dark minor pad
    const playPad = (when: number, freq: number, dur: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      osc.detune.value = (Math.random() - 0.5) * 8;
      const f = ctx.createBiquadFilter();
      f.type = "lowpass";
      f.frequency.value = 700;
      f.Q.value = 4;
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.05, when + 0.6);
      g.gain.linearRampToValueAtTime(0, when + dur);
      osc.connect(f);
      f.connect(g);
      g.connect(master);
      osc.start(when);
      osc.stop(when + dur + 0.1);
    };

    // 140 BPM drill — 16th note hats, kick on 1 & 3, snare on 2 & 4, sliding 808s
    const bpm = 140;
    const beat = 60 / bpm; // ~0.428s
    const sixteenth = beat / 4;
    const barDur = beat * 4;
    // 808 pattern in C minor: C2(65.4), Eb2(77.8), G2(98.0), Bb2(116.5)
    const bassPattern = [
      [0, 65.4, beat * 1.5],
      [beat * 1.5, 77.8, beat * 1.0],
      [beat * 2.5, 98.0, beat * 1.5],
    ];
    // Pad notes per bar (cycles)
    const padCycle = [
      [130.8, 155.6, 196.0], // Cm
      [123.5, 146.8, 185.0], // Bdim-ish
      [138.6, 174.6, 207.7], // Db
      [130.8, 155.6, 196.0], // Cm
    ];

    let bar = 0;
    const schedule = () => {
      const now = ctx.currentTime + 0.05;
      // schedule 2 bars ahead
      for (let b = 0; b < 2; b++) {
        const barStart = now + b * barDur;
        // pad
        padCycle[(bar + b) % padCycle.length].forEach((f) => playPad(barStart, f, barDur));
        // kicks
        playKick(barStart);
        playKick(barStart + beat * 2);
        playKick(barStart + beat * 2 + sixteenth * 2); // syncopated
        // snares
        playSnare(barStart + beat);
        playSnare(barStart + beat * 3);
        // hats — 16th notes with occasional rolls
        for (let i = 0; i < 16; i++) {
          const t = barStart + i * sixteenth;
          if (i % 2 === 0) playHat(t);
          else if (Math.random() < 0.55) playHat(t);
          if (i === 11) {
            // triplet roll
            playHat(t + sixteenth / 3);
            playHat(t + (2 * sixteenth) / 3);
          }
          if (i === 7) playHat(t, true);
        }
        // 808 bass
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
      window.setTimeout(() => {
        try {
          master.disconnect();
          lpf.disconnect();
        } catch {}
      }, 350);
    };

    setPlaying(true);
  };

  const toggle = () => (playing ? stop() : start());

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="group fixed bottom-5 left-5 z-30 flex items-center gap-3 border border-white/15 bg-black/70 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-white shadow-2xl backdrop-blur-md transition hover:border-white/40"
      aria-label={playing ? "Pause music" : "Play music"}
    >
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full">
        <span className={`album-disc-art ${playing ? "is-spinning" : ""}`} />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-white">J.O.A.T FM</span>
        <span className="text-white/50">{playing ? "On Air" : "Tap to Play"}</span>
      </span>
      {playing ? <Pause size={14} /> : <Play size={14} />}
    </button>
  );
}

function ProductCard({
  product,
  onOpen,
}: {
  product: Product;
  onOpen: (product: Product) => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -3 }}
      className="group relative flex cursor-pointer flex-col overflow-hidden border border-white/10 bg-card text-foreground shadow-lg transition-all duration-300 hover:border-white/30 hover:shadow-[0_10px_40px_-10px_rgba(120,140,255,0.4)]"
      onClick={() => onOpen(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(product);
        }
      }}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-white/[0.04] to-white/[0.01]">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-90" />
        <div className="absolute left-2 top-2 bg-white/95 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-black">
          {product.brand}
        </div>
        <div className="absolute bottom-2 right-2 translate-y-2 bg-white px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-black opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          Quick view →
        </div>
      </div>
      <div className="grid gap-1 border-t border-white/10 p-3">
        <h3 className="font-display text-lg uppercase leading-tight tracking-wide text-foreground line-clamp-1">
          {product.name}
        </h3>
        <div className="flex items-end justify-between gap-2">
          <p className="font-mono text-[9px] uppercase tracking-widest text-foreground/45">
            {product.sizes.length} sz · {product.colors.length} clr
          </p>
          <p className="font-display text-xl text-foreground">${product.price}</p>
        </div>
      </div>
    </motion.article>
  );
}

const productCopy: Record<string, { tagline: string; description: string; details: string[] }> = {
  BAPE: {
    tagline: "A Bathing Ape — Tokyo streetwear royalty.",
    description:
      "Heavyweight cotton construction with signature BAPE branding. Sourced direct, deadstock guaranteed authentic.",
    details: ["100% premium cotton", "Boxed and tagged", "Authenticated source", "Ships within 48h"],
  },
  SP5DER: {
    tagline: "Sp5der Worldwide — signature web graphics.",
    description:
      "Plush French terry hoodie with rhinestone web detailing. Oversized fit, premium hand-feel.",
    details: ["French terry interior", "Rhinestone graphics", "Oversized streetwear fit", "Authentic Sp5der tags"],
  },
  ESSENTIALS: {
    tagline: "Fear of God Essentials — elevated minimalism.",
    description:
      "Refined silhouette in muted tones. The everyday staple from Jerry Lorenzo's diffusion line.",
    details: ["Heavyweight cotton blend", "Relaxed athletic cut", "Tonal rubberized branding", "Original packaging"],
  },
  HELLSTAR: {
    tagline: "Hellstar Studios — LA cult graphic apparel.",
    description:
      "Garment-dyed heavyweight tee with bold front and back graphics. Limited drops, no restocks.",
    details: ["Heavyweight 240gsm cotton", "Vintage wash treatment", "Front + back prints", "Hellstar holographic tag"],
  },
  "DESIGNER FRAGRANCE": {
    tagline: "Designer fragrance — sealed, batch-coded, authentic.",
    description:
      "Sealed in original cellophane with verified batch codes. Original retail packaging.",
    details: ["Eau de Parfum", "Sealed in cellophane", "Batch code verified", "Original retail box"],
  },
};

function ProductDetailDialog({
  product,
  onClose,
  onConfigure,
}: {
  product: Product | null;
  onClose: () => void;
  onConfigure: (product: Product) => void;
}) {
  useEffect(() => {
    if (!product) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [product, onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-3 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative grid max-h-[92dvh] w-full max-w-4xl grid-cols-1 overflow-hidden border border-white/10 bg-card text-foreground shadow-2xl md:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center bg-white/95 text-black shadow transition hover:bg-white"
            >
              <X size={18} />
            </button>

            <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-white/[0.04] to-transparent md:aspect-auto">
              <img
                src={product.image}
                alt={product.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute left-4 top-4 bg-white/95 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-black">
                {product.brand}
              </div>
            </div>

            <div className="flex max-h-[92dvh] flex-col overflow-y-auto p-6 md:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-foreground/50">
                {product.category} · {product.id}
              </p>
              <h2 className="mt-2 font-display text-4xl uppercase leading-tight tracking-wide sm:text-5xl">
                {product.name}
              </h2>
              <p className="mt-3 font-display text-3xl">${product.price}</p>

              <p className="mt-5 font-body text-sm leading-relaxed text-foreground/80">
                {productCopy[product.brand]?.tagline}
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-foreground/65">
                {productCopy[product.brand]?.description}
              </p>

              <div className="mt-5 grid gap-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                  Available
                </p>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  {product.sizes.map((s) => (
                    <span key={s} className="border border-white/15 px-2 py-1">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 font-mono text-xs text-foreground/65">
                  {product.colors.map((c) => (
                    <span key={c}>· {c}</span>
                  ))}
                </div>
              </div>

              <ul className="mt-5 grid gap-2 border-t border-white/10 pt-4 font-body text-sm text-foreground/80">
                {(productCopy[product.brand]?.details ?? []).map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="mt-2 inline-block h-1 w-1 bg-foreground" />
                    {d}
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid grid-cols-3 gap-3 border-y border-white/10 py-4 text-center font-mono text-[9px] uppercase tracking-widest text-foreground/60">
                <div className="grid place-items-center gap-1"><Truck size={16} /> 48h ship</div>
                <div className="grid place-items-center gap-1"><Shield size={16} /> Authentic</div>
                <div className="grid place-items-center gap-1"><Package size={16} /> Tagged</div>
              </div>

              <button
                onClick={() => onConfigure(product)}
                className="mt-5 w-full bg-white py-4 font-display text-xl uppercase tracking-widest text-black transition hover:bg-white/90"
              >
                Add to Cart
              </button>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-foreground/40">
                Select size & color on next step
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ProductSelectionDrawer({
  product,
  onClose,
  onAdd,
}: {
  product: Product | null;
  onClose: () => void;
  onAdd: (product: Product, selectedColor: string, selectedSize: string) => void;
}) {
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    if (!product) return;
    const saved = readProductOptionMemory(product.id);
    setSelectedColor(
      saved.color && product.colors.includes(saved.color) ? saved.color : (product.colors[0] ?? ""),
    );
    setSelectedSize(
      saved.size && product.sizes.includes(saved.size) ? saved.size : (product.sizes[0] ?? ""),
    );
  }, [product]);

  return (
    <AnimatePresence>
      {product && (
        <motion.aside
          initial={{ y: "105%" }}
          animate={{ y: 0 }}
          exit={{ y: "105%" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/15 bg-card shadow-2xl"
        >
          <div className="mx-auto max-w-3xl p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase text-foreground/50">{product.brand}</p>
                <h3 className="font-display text-3xl uppercase leading-none">{product.name}</h3>
                <p className="mt-1 font-mono text-sm uppercase">${product.price}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X />
              </Button>
            </div>

            <div className="grid gap-5 py-5 sm:grid-cols-2">
              <OptionGroup
                label="Color"
                options={product.colors}
                value={selectedColor}
                onChange={setSelectedColor}
              />
              <OptionGroup
                label="Size"
                options={product.sizes}
                value={selectedSize}
                onChange={setSelectedSize}
              />
            </div>

            <button
              onClick={() => {
                writeProductOptionMemory(product.id, selectedColor, selectedSize);
                onAdd(product, selectedColor, selectedSize);
              }}
              disabled={!selectedColor || !selectedSize}
              className="w-full bg-white py-4 font-display text-xl uppercase tracking-widest text-black transition hover:bg-white/90 disabled:opacity-40"
            >
              Add to Cart
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function OptionGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 font-mono text-xs uppercase text-foreground/50">Select {label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`border px-3 py-3 font-mono text-xs uppercase transition ${
              value === option
                ? "border-white bg-white text-black"
                : "border-white/15 bg-white/5 text-foreground hover:border-white/40"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function CartDrawer(props: {
  open: boolean;
  cart: CartItem[];
  total: number;
  stage: OrderStage;
  details: OrderDetails;
  orderId: string;
  setDetails: (details: OrderDetails) => void;
  onClose: () => void;
  onStage: (stage: OrderStage) => void;
  onSubmitDetails: () => void;
}) {
  const {
    open,
    cart,
    total,
    stage,
    details,
    orderId,
    setDetails,
    onClose,
    onStage,
    onSubmitDetails,
  } = props;
  const telegramMessage = useMemo(
    () =>
      encodeURIComponent(
        `JOAT ORDER\nOrder: ${orderId}\nItems:\n${cart
          .map((item) => `${item.name} / ${item.selectedColor} / ${item.selectedSize}`)
          .join("\n")}\nTotal: $${total}\nTelegram: ${details.telegram}`,
      ),
    [cart, details.telegram, orderId, total],
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          initial={{ x: "105%" }}
          animate={{ x: 0 }}
          exit={{ x: "105%" }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-white/15 bg-card shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/10 p-4">
            <div>
              <p className="font-display text-3xl uppercase leading-none">Cart</p>
              <p className="font-mono text-[10px] uppercase tracking-widest text-foreground/50">
                Sourcing direct
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close cart">
              <X />
            </Button>
          </div>
          <div className="h-1 bg-background">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: stage === "pay" ? "100%" : stage === "assigning" ? "72%" : "34%" }}
              className="h-full bg-white"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {stage === "cart" && (
              <CartList cart={cart} total={total} onSecure={() => onStage("details")} />
            )}
            {stage === "details" && (
              <DetailsForm details={details} setDetails={setDetails} onSubmit={onSubmitDetails} />
            )}
            {stage === "assigning" && (
              <div className="grid h-full place-items-center font-display text-3xl uppercase text-foreground/80">
                Assigning order id…
              </div>
            )}
            {stage === "pay" && (
              <PayScreen orderId={orderId} total={total} telegramMessage={telegramMessage} />
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function CartList({
  cart,
  total,
  onSecure,
}: {
  cart: CartItem[];
  total: number;
  onSecure: () => void;
}) {
  return (
    <div className="space-y-4">
      {cart.length === 0 ? (
        <p className="font-mono uppercase text-foreground/50">Cart is empty.</p>
      ) : (
        cart.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex justify-between border-b border-white/10 pb-3 font-mono text-xs uppercase"
          >
            <span>
              {item.name} · {item.selectedColor} · {item.selectedSize}
            </span>
            <span>${item.price}</span>
          </div>
        ))
      )}
      <div className="flex justify-between font-display text-3xl uppercase">
        <span>Total</span>
        <span>${total}</span>
      </div>
      <button
        onClick={onSecure}
        disabled={cart.length === 0}
        className="w-full bg-white py-4 font-display text-xl uppercase tracking-widest text-black transition hover:bg-white/90 disabled:opacity-40"
      >
        Checkout
      </button>
    </div>
  );
}

function DetailsForm({
  details,
  setDetails,
  onSubmit,
}: {
  details: OrderDetails;
  setDetails: (details: OrderDetails) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="grid gap-4"
    >
      {(["name", "address", "telegram"] as const).map((field) => (
        <label key={field} className="grid gap-1 font-mono text-xs uppercase text-foreground/60">
          {field}
          <input
            required
            value={details[field]}
            onChange={(e) => setDetails({ ...details, [field]: e.target.value })}
            className="border border-white/15 bg-white/5 px-3 py-3 font-mono text-sm text-foreground focus:border-white/40 focus:outline-none"
          />
        </label>
      ))}
      <button
        type="submit"
        className="w-full bg-white py-4 font-display text-xl uppercase tracking-widest text-black transition hover:bg-white/90"
      >
        Submit
      </button>
    </form>
  );
}

function PayScreen({
  orderId,
  total,
  telegramMessage,
}: {
  orderId: string;
  total: number;
  telegramMessage: string;
}) {
  return (
    <div className="grid gap-4 font-mono text-xs uppercase">
      <p className="font-display text-3xl">Order {orderId}</p>
      <p>Total: ${total}</p>
      <p className="text-foreground/60">
        Send confirmation via Telegram to finalize your drop.
      </p>
      <a
        href={`https://t.me/joatz?text=${telegramMessage}`}
        className="block w-full bg-white py-4 text-center font-display text-xl uppercase tracking-widest text-black transition hover:bg-white/90"
      >
        Open Telegram
      </a>
    </div>
  );
}
