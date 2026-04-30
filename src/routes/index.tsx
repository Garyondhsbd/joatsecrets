import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Copy, Pause, Play, Plus, Send, ShoppingBag, Truck, Shield, Package, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import products from "@/data/products.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JOAT Secrets Vault" },
      { name: "description", content: "Restricted logistics vault for JOAT Secrets drops." },
      { property: "og:title", content: "JOAT Secrets Vault" },
      { property: "og:description", content: "Restricted logistics vault for JOAT Secrets drops." },
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
const cashApp = "$joatz_plug";
const zelle = "payments@joatsecrets.com";
const usdt = "TQ9xJOATvaultUSDTmanualdrop93";

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

const lockIn = {
  hidden: { opacity: 0, y: 36, rotateX: -18, filter: "contrast(240%) brightness(1.8)" },
  show: { opacity: 1, y: 0, rotateX: 0, filter: "contrast(100%) brightness(1)" },
};

const productSections = [
  "Bape Tees",
  "Sp5der Hoodies",
  "Essentials Shorts",
  "Hellstar Tees",
  "Fragrance",
];

function Index() {
  const [unlocked, setUnlocked] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selectingProduct, setSelectingProduct] = useState<Product | null>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [stage, setStage] = useState<OrderStage>("cart");
  const [orderId, setOrderId] = useState("");
  const [details, setDetails] = useState<OrderDetails>({ name: "", address: "", telegram: "" });

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
      <AnimatePresence mode="wait">
        {!unlocked ? (
          <RestrictedGateway key="gate" onUnlock={() => setUnlocked(true)} />
        ) : (
          <VaultHub
            key="vault"
            cart={cart}
            total={total}
            openProductDetail={setViewingProduct}
            openCart={() => setCartOpen(true)}
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
        onAdd={(product: Product, selectedColor: string, selectedSize: string) => {
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

function RestrictedGateway({ onUnlock }: { onUnlock: () => void }) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, -90]);

  const enterVault = () => {
    localStorage.setItem(ACCESS_KEY, "granted");
    onUnlock();
  };

  return (
    <motion.section
      exit={{ opacity: 0, scale: 1.14, rotate: 1.5, filter: "blur(10px)" }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      className="relative grid min-h-screen place-items-center px-5"
    >
      <motion.div style={{ y }} className="absolute inset-0 opacity-50 vault-concrete" />
      <motion.div className="vault-motion-field absolute inset-0" />
      <motion.div className="relative z-10 flex w-full max-w-xl flex-col items-center text-center">
        <motion.button
          type="button"
          onClick={enterVault}
          animate={{
            rotateY: [0, -8, 8, 0],
            boxShadow: [
              "0 0 20px var(--vault-crimson)",
              "0 0 80px var(--vault-joker-purple)",
              "0 0 20px var(--vault-crimson)",
            ],
          }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
          className="joker-card mb-8 grid h-32 w-24 place-items-center border border-vault-crimson bg-vault-crimson font-display text-5xl text-primary-foreground"
          aria-label="Unlock vault"
        >
          🃏
        </motion.button>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.3, 1] }}
          transition={{ duration: 0.3 }}
          className="glitch-text font-display text-6xl uppercase leading-none sm:text-8xl"
          data-text="RESTRICTED ACCESS"
        >
          RESTRICTED ACCESS
        </motion.h1>
        <div className="mt-8 flex w-full border border-border bg-vault-concrete p-1 shadow-vault-glow">
          <Button
            variant="vault"
            size="vault"
            onClick={enterVault}
            className="joker-card-button w-full text-2xl"
          >
            <span className="glitch-text" data-text="ENTER THE VAULT">
              ENTER THE VAULT
            </span>
          </Button>
        </div>
        <a
          href="https://t.me/joatz"
          className="mt-4 font-mono text-xs uppercase text-vault-quiet hover:text-vault-wire"
        >
          NO PASSWORD // DIRECT ACCESS // @JOATZ
        </a>
      </motion.div>
    </motion.section>
  );
}

function VaultHub({
  cart,
  total,
  openProductDetail,
  openCart,
}: {
  cart: CartItem[];
  total: number;
  openProductDetail: (product: Product) => void;
  openCart: () => void;
}) {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 900], [0, -160]);
  const gridY = useTransform(scrollY, [0, 1600], [0, 260]);
  const pulseY = useTransform(scrollY, [0, 1600], [0, -220]);

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.65, 1] }}
      transition={{ duration: 0.32 }}
      className="relative min-h-screen"
    >
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none fixed inset-0 vault-concrete opacity-30"
      />
      <motion.div
        style={{ y: gridY }}
        className="vault-motion-field pointer-events-none fixed inset-0"
      />
      <motion.div
        style={{ y: pulseY }}
        className="vault-scroll-pulse pointer-events-none fixed inset-0"
      />
      <VaultHeader cartCount={cart.length} openCart={openCart} />
      <BackgroundMusic />
      <LiveStockTicker />
      <section className="relative pt-24">
        <div className="overflow-hidden border-y border-border bg-vault-concrete py-10">
          <div className="marquee-track flex w-max gap-8 font-display text-[16vw] uppercase leading-none text-foreground sm:text-[11vw]">
            {Array.from({ length: 2 }).map((_, index) => (
              <span key={index}>
                JACK OF ALL TRADES. MASTER OF THE SOURCE. LOGISTICS KING. THE PLUG. JOIN THE
                TELEGRAM.
              </span>
            ))}
          </div>
        </div>
        {productSections.map((section) => {
          const sectionProducts = products.filter((product) => product.category === section);
          if (sectionProducts.length === 0) return null;

          return (
            <section key={section} className="relative border-b border-border py-8">
              <div className="mx-auto max-w-7xl px-3 sm:px-5">
                <div className="mb-4 flex items-end justify-between gap-3 border-b border-border pb-2">
                  <h2 className="font-display text-4xl uppercase leading-none text-foreground sm:text-6xl">
                    {section}
                  </h2>
                  <p className="font-mono text-xs uppercase text-vault-quiet">
                    {sectionProducts.length} items
                  </p>
                </div>
                <motion.div
                  variants={{ show: { transition: { staggerChildren: 0.05 } } }}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: "-80px" }}
                  className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
                >
                  {sectionProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onOpen={openProductDetail} />
                  ))}
                </motion.div>
              </div>
            </section>
          );
        })}
      </section>
    </motion.section>
  );
}

function LiveStockTicker() {
  return (
    <div className="sticky top-[65px] z-20 overflow-hidden border-b border-vault-crimson bg-vault-crimson py-2 shadow-vault-glow">
      <div className="stock-ticker flex w-max gap-8 font-display text-2xl uppercase leading-none text-primary-foreground">
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={index}>CHROME HEARTS DROP LIVE - 2 MINUTES REMAINING</span>
        ))}
      </div>
    </div>
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

    // Master with gentle filter + reverb-ish delay for warmth
    const master = ctx.createGain();
    master.gain.value = 0.18;
    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 2400;
    lpf.Q.value = 0.7;

    const delay = ctx.createDelay();
    delay.delayTime.value = 0.38;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.25;

    master.connect(lpf);
    lpf.connect(ctx.destination);
    lpf.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(ctx.destination);

    // Slow lo-fi chord progression in A minor: Am – Fmaj7 – Cmaj7 – G
    // (root, third, fifth, optional 7th) — frequencies in Hz
    const chords: number[][] = [
      [220.0, 261.63, 329.63], // Am
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [196.0, 246.94, 293.66], // G
    ];

    const playChord = (freqs: number[], when: number, dur: number) => {
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = i === 0 ? "triangle" : "sine";
        osc.frequency.value = f;
        // gentle detune for warmth
        osc.detune.value = (Math.random() - 0.5) * 6;
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.12 / freqs.length, when + 0.6);
        g.gain.linearRampToValueAtTime(0.08 / freqs.length, when + dur - 0.4);
        g.gain.linearRampToValueAtTime(0, when + dur);
        osc.connect(g);
        g.connect(master);
        osc.start(when);
        osc.stop(when + dur + 0.1);
      });
    };

    // Soft kick on beat 1 of each bar — warm, not harsh
    const playKick = (when: number) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(80, when);
      osc.frequency.exponentialRampToValueAtTime(38, when + 0.15);
      g.gain.setValueAtTime(0, when);
      g.gain.linearRampToValueAtTime(0.18, when + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.32);
      osc.connect(g);
      g.connect(master);
      osc.start(when);
      osc.stop(when + 0.35);
    };

    // Soft side-stick / snare on beat 3
    const playSnare = (when: number) => {
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
      const src = ctx.createBufferSource();
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1800;
      const g = ctx.createGain();
      g.gain.value = 0.06;
      src.buffer = buf;
      src.connect(bp);
      bp.connect(g);
      g.connect(master);
      src.start(when);
    };

    const barDur = 4.0; // 4 seconds per chord (slow, calm)
    let bar = 0;
    const schedule = () => {
      const now = ctx.currentTime;
      // schedule the next 2 bars ahead
      for (let i = 0; i < 2; i++) {
        const when = now + i * barDur + 0.05;
        const chord = chords[(bar + i) % chords.length];
        playChord(chord, when, barDur);
        playKick(when);
        playKick(when + barDur / 2);
        playSnare(when + barDur / 4);
        playSnare(when + (3 * barDur) / 4);
      }
      bar += 2;
    };
    schedule();
    const iv = window.setInterval(schedule, barDur * 2 * 1000 - 100);

    cleanupRef.current = () => {
      window.clearInterval(iv);
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      window.setTimeout(() => {
        try {
          master.disconnect();
          lpf.disconnect();
          delay.disconnect();
          feedback.disconnect();
          wet.disconnect();
        } catch {}
      }, 400);
    };

    setPlaying(true);
  };

  const toggle = () => (playing ? stop() : start());

  useEffect(() => () => cleanupRef.current?.(), []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="group fixed bottom-5 left-5 z-30 flex items-center gap-3 border border-black/20 bg-white/95 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-black shadow-lg backdrop-blur transition hover:shadow-xl"
      aria-label={playing ? "Pause music" : "Play music"}
    >
      <span className={`relative grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-black text-white ${playing ? "album-spin" : ""}`}>
        <span className="absolute inset-1 rounded-full border border-white/20" />
        <span className="absolute inset-3 rounded-full bg-white/80" />
        <span className="absolute h-1 w-1 rounded-full bg-black" />
      </span>
      <span className="flex flex-col items-start leading-tight">
        <span className="text-black">JOAT FM</span>
        <span className="text-black/50">{playing ? "Now Playing" : "Tap to Play"}</span>
      </span>
      {playing ? <Pause size={14} /> : <Play size={14} />}
    </button>
  );
}

function VaultHeader({ cartCount, openCart }: { cartCount: number; openCart: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl grid-cols-3 items-center px-4 py-3">
        <button onClick={openCart} className="relative justify-self-start" aria-label="Open cart">
          <ShoppingBag className={cartCount === 0 ? "text-vault-crimson" : "text-vault-wire"} />
          <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center bg-vault-crimson px-1 font-mono text-[10px] text-primary-foreground">
            {cartCount}
          </span>
        </button>
        <div className="justify-self-center font-display text-4xl uppercase leading-none text-foreground sm:text-5xl">
          J-KEY
        </div>
        <a
          href="https://t.me/joatz"
          className="justify-self-end text-vault-wire"
          aria-label="Telegram @joatz"
        >
          <Send size={20} />
        </a>
      </div>
    </header>
  );
}

function ProductCard({ product, onOpen }: { product: Product; onOpen: (product: Product) => void }) {
  const soldOut = product.stock === 0;

  return (
    <motion.article
      variants={lockIn}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4 }}
      className="group relative grid cursor-pointer overflow-hidden border border-black/10 bg-white text-black shadow-sm transition-shadow hover:shadow-xl"
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
      <div className="relative aspect-square overflow-hidden bg-white">
        <img
          src={product.image}
          alt={product.name}
          width={1024}
          height={1024}
          loading="lazy"
          className="h-full w-full object-contain p-4 transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-white/85 font-display text-3xl uppercase tracking-widest text-black">
            Sold Out
          </div>
        )}
        <div className="absolute left-3 top-3 bg-black px-2 py-1 font-mono text-[9px] uppercase tracking-widest text-white">
          {product.brand}
        </div>
      </div>
      <div className="grid gap-2 border-t border-black/10 p-4">
        <h3 className="font-display text-2xl uppercase leading-tight tracking-wide text-black">
          {product.name}
        </h3>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-black/50">
              {product.sizes.length} sizes · {product.colors.length} color{product.colors.length > 1 ? "s" : ""}
            </p>
            <p className="mt-1 font-display text-xl text-black">${product.price}</p>
          </div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-black/50 underline-offset-4 group-hover:underline">
            View →
          </span>
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
  Sp5der: {
    tagline: "Sp5der Worldwide — Young Thug's signature line.",
    description:
      "Plush French terry hoodie with rhinestone web detailing. Oversized fit, premium hand-feel.",
    details: ["French terry interior", "Rhinestone graphics", "Oversized streetwear fit", "Authentic Sp5der tags"],
  },
  Essentials: {
    tagline: "Fear of God Essentials — elevated minimalism.",
    description:
      "Refined silhouette in muted tones. The everyday staple from Jerry Lorenzo's diffusion line.",
    details: ["Heavyweight cotton blend", "Relaxed athletic cut", "Tonal rubberized branding", "Original packaging"],
  },
  Hellstar: {
    tagline: "Hellstar Studios — LA cult graphic apparel.",
    description:
      "Garment-dyed heavyweight tee with bold front and back graphics. Limited drops, no restocks.",
    details: ["Heavyweight 240gsm cotton", "Vintage wash treatment", "Front + back prints", "Hellstar holographic tag"],
  },
  Fragrance: {
    tagline: "Designer fragrance — sealed, batch-coded, authentic.",
    description:
      "100ml EDP unless noted. All bottles sealed in original cellophane with verified batch codes.",
    details: ["100ml Eau de Parfum", "Sealed in cellophane", "Batch code verified", "Original retail box"],
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
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-3 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 24, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="relative grid max-h-[92dvh] w-full max-w-4xl grid-cols-1 overflow-hidden bg-white text-black shadow-2xl md:grid-cols-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center bg-white/90 text-black shadow transition hover:bg-black hover:text-white"
            >
              <X size={18} />
            </button>

            <div className="relative aspect-square overflow-hidden bg-white md:aspect-auto">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-contain p-6"
              />
              <div className="absolute left-4 top-4 bg-black px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-white">
                {product.brand}
              </div>
            </div>

            <div className="flex max-h-[92dvh] flex-col overflow-y-auto p-6 md:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-black/50">
                {product.category} · {product.id}
              </p>
              <h2 className="mt-2 font-display text-4xl uppercase leading-tight tracking-wide text-black sm:text-5xl">
                {product.name}
              </h2>
              <p className="mt-3 font-display text-3xl text-black">${product.price}</p>

              <p className="mt-5 font-body text-sm leading-relaxed text-black/80">
                {productCopy[product.brand]?.tagline}
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-black/70">
                {productCopy[product.brand]?.description}
              </p>

              <div className="mt-5 grid gap-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-black/50">
                  Available
                </p>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  {product.sizes.map((s) => (
                    <span key={s} className="border border-black/20 px-2 py-1">
                      {s}
                    </span>
                  ))}
                </div>
                <div className="mt-1 flex flex-wrap gap-2 font-mono text-xs text-black/70">
                  {product.colors.map((c) => (
                    <span key={c}>· {c}</span>
                  ))}
                </div>
              </div>

              <ul className="mt-5 grid gap-2 border-t border-black/10 pt-4 font-body text-sm text-black/80">
                {(productCopy[product.brand]?.details ?? []).map((d) => (
                  <li key={d} className="flex items-start gap-2">
                    <span className="mt-2 inline-block h-1 w-1 bg-black" />
                    {d}
                  </li>
                ))}
              </ul>

              <div className="mt-5 grid grid-cols-3 gap-3 border-y border-black/10 py-4 text-center font-mono text-[9px] uppercase tracking-widest text-black/60">
                <div className="grid place-items-center gap-1"><Truck size={16} /> 48h ship</div>
                <div className="grid place-items-center gap-1"><Shield size={16} /> Authentic</div>
                <div className="grid place-items-center gap-1"><Package size={16} /> Tagged</div>
              </div>

              <button
                onClick={() => onConfigure(product)}
                disabled={product.stock === 0}
                className="mt-5 w-full bg-black py-4 font-display text-xl uppercase tracking-widest text-white transition hover:bg-black/85 disabled:opacity-40"
              >
                {product.stock === 0 ? "Sold Out" : "Add to Cart"}
              </button>
              <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-black/40">
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
          className="fixed inset-x-0 bottom-0 z-40 border-t border-vault-crimson bg-background shadow-vault-glow"
        >
          <div className="mx-auto max-w-3xl p-4 sm:p-6">
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="font-mono text-[10px] uppercase text-vault-quiet">{product.brand}</p>
                <h3 className="font-display text-4xl uppercase leading-none">{product.name}</h3>
                <p className="mt-1 font-mono text-sm uppercase text-vault-crimson">
                  ${product.price}
                </p>
              </div>
              <Button
                variant="vaultGhost"
                size="icon"
                onClick={onClose}
                aria-label="Close product options"
              >
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

            <Button
              variant="vault"
              size="vault"
              className="w-full"
              onClick={() => {
                writeProductOptionMemory(product.id, selectedColor, selectedSize);
                onAdd(product, selectedColor, selectedSize);
              }}
              disabled={!selectedColor || !selectedSize}
            >
              ADD TO CART
            </Button>
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
      <p className="mb-2 font-mono text-xs uppercase text-vault-quiet">Select {label}</p>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={`border px-3 py-3 font-mono text-xs uppercase transition ${
              value === option
                ? "border-vault-crimson bg-vault-crimson text-primary-foreground"
                : "border-border bg-vault-concrete text-foreground hover:border-vault-wire"
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
        `JOAT DROP HANDOFF\nOrder: ${orderId}\nItems:\n${cart
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
          className="fixed right-0 top-0 z-50 flex h-dvh w-full max-w-md flex-col border-l border-vault-crimson bg-vault-concrete shadow-vault-glow vault-concrete"
        >
          <div className="flex items-center justify-between border-b border-border p-4">
            <div>
              <p className="font-display text-4xl uppercase leading-none">DROP CART</p>
              <p className="font-mono text-xs uppercase text-vault-quiet">SEEKING SOURCE...</p>
            </div>
            <Button variant="vaultGhost" size="icon" onClick={onClose} aria-label="Close cart">
              <X />
            </Button>
          </div>
          <div className="h-2 bg-background">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: stage === "pay" ? "100%" : stage === "assigning" ? "72%" : "34%" }}
              className="h-full bg-vault-crimson"
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
              <div className="grid h-full place-items-center font-display text-4xl uppercase text-vault-crimson">
                ASSIGNING DEEP-SOURCE ID...
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
  const secureMessage = encodeURIComponent(
    `JOAT DROP REQUEST\n${cart
      .map((item) => `${item.id} - ${item.name} / ${item.selectedColor} / ${item.selectedSize}`)
      .join("\n")}\nTotal: $${total}`,
  );

  return (
    <div className="space-y-4">
      {cart.length === 0 ? (
        <p className="font-mono uppercase text-vault-quiet">NO DROP RESERVED.</p>
      ) : (
        cart.map((item, index) => (
          <div
            key={`${item.id}-${index}`}
            className="flex justify-between border-b border-border pb-3 font-mono text-sm uppercase"
          >
            <span>
              {item.id} // {item.name} // {item.selectedColor} // {item.selectedSize}
            </span>
            <span className="text-vault-crimson">${item.price}</span>
          </div>
        ))
      )}
      <div className="flex justify-between font-display text-4xl uppercase">
        <span>Total</span>
        <span className="text-vault-crimson">${total}</span>
      </div>
      {cart.length === 0 ? (
        <Button variant="vault" size="vault" className="w-full" disabled onClick={onSecure}>
          <span className="glitch-text" data-text="SECURE THE DROP">
            SECURE THE DROP
          </span>
        </Button>
      ) : (
        <Button variant="vault" size="vault" className="w-full" asChild>
          <a href={`https://t.me/joatz?text=${secureMessage}`}>
            <span className="glitch-text" data-text="SECURE THE DROP">
              SECURE THE DROP
            </span>
          </a>
        </Button>
      )}
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
  const valid = details.name.trim() && details.address.trim() && details.telegram.trim();
  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSubmit();
      }}
    >
      <p className="font-display text-4xl uppercase">LOGISTICS SECURED. SEND PAYMENT NOW.</p>
      {(["name", "address", "telegram"] as const).map((field) => (
        <label key={field} className="block font-mono text-xs uppercase text-vault-quiet">
          {field === "telegram" ? "Telegram Handle" : field}
          <input
            value={details[field]}
            onChange={(event) =>
              setDetails({
                ...details,
                [field]: event.target.value.slice(0, field === "address" ? 180 : 60),
              })
            }
            className="mt-2 w-full border border-border bg-background px-3 py-4 font-mono text-foreground caret-vault-crimson outline-none focus:border-vault-wire"
            required
          />
        </label>
      ))}
      <Button variant="vault" size="vault" className="w-full" type="submit" disabled={!valid}>
        <span className="glitch-text" data-text="SUBMIT DETAILS">
          SUBMIT DETAILS
        </span>
      </Button>
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
  const copy = (value: string) => navigator.clipboard?.writeText(value);
  const rows = [
    ["Order ID", orderId],
    ["Total Due", `$${total}`],
    ["CashApp", cashApp],
    ["Zelle", zelle],
    ["USDT", usdt],
  ];
  return (
    <div className="space-y-4">
      <p className="font-display text-5xl uppercase leading-none">DROP RESERVED.</p>
      {rows.map(([label, value]) => (
        <button
          key={label}
          onClick={() => copy(value)}
          className="flex w-full items-center justify-between border border-border bg-background p-3 text-left font-mono uppercase text-vault-quiet hover:border-vault-wire hover:text-foreground"
        >
          <span>
            {label}:{" "}
            <b className={label === "Total Due" ? "text-vault-crimson" : "text-foreground"}>
              {value}
            </b>
          </span>
          <Copy size={16} />
        </button>
      ))}
      <Button variant="vault" size="vault" className="w-full" asChild>
        <a href={`https://t.me/joatz?text=${telegramMessage}`}>
          <Send />{" "}
          <span className="glitch-text" data-text="MESSAGE @JOATZ">
            MESSAGE @JOATZ
          </span>
        </a>
      </Button>
    </div>
  );
}
