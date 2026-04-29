import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Copy, Plus, Send, ShoppingBag, X } from "lucide-react";
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
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground vault-noise">
      <AnimatePresence mode="wait">
        {!unlocked ? (
          <RestrictedGateway key="gate" onUnlock={() => setUnlocked(true)} />
        ) : (
          <VaultHub
            key="vault"
            cart={cart}
            total={total}
            openProductSelector={setSelectingProduct}
            openCart={() => setCartOpen(true)}
          />
        )}
      </AnimatePresence>

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
  openProductSelector,
  openCart,
}: {
  cart: CartItem[];
  total: number;
  openProductSelector: (product: Product) => void;
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
      <motion.div style={{ y: gridY }} className="vault-motion-field pointer-events-none fixed inset-0" />
      <motion.div style={{ y: pulseY }} className="vault-scroll-pulse pointer-events-none fixed inset-0" />
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
                    <ProductCard key={product.id} product={product} onAdd={openProductSelector} />
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
  const audioContextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<{ stop: () => void }[]>([]);
  const [playing, setPlaying] = useState(false);

  const stopMusic = () => {
    nodesRef.current.forEach((node) => node.stop());
    nodesRef.current = [];
    setPlaying(false);
  };

  const toggleMusic = async () => {
    if (playing) {
      stopMusic();
      return;
    }

    const context = audioContextRef.current ?? new AudioContext();
    audioContextRef.current = context;
    await context.resume();

    const master = context.createGain();
    const compressor = context.createDynamicsCompressor();
    master.gain.value = 0.025;
    master.connect(compressor);
    compressor.connect(context.destination);

    const makeTone = (frequency: number, type: OscillatorType, gainValue: number) => {
      const oscillator = context.createOscillator();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.value = frequency;
      filter.type = "lowpass";
      filter.frequency.value = 420;
      gain.gain.value = gainValue;
      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      oscillator.start();
      nodesRef.current.push({
        stop: () => {
          gain.gain.setTargetAtTime(0, context.currentTime, 0.04);
          window.setTimeout(() => oscillator.stop(), 140);
        },
      });
    };

    const kick = () => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(92, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(42, context.currentTime + 0.16);
      gain.gain.setValueAtTime(0.18, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.22);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.24);
    };

    const hat = () => {
      const bufferSize = context.sampleRate * 0.035;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let index = 0; index < bufferSize; index += 1) data[index] = Math.random() * 2 - 1;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      filter.type = "highpass";
      filter.frequency.value = 7200;
      gain.gain.value = 0.035;
      source.buffer = buffer;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start();
    };

    makeTone(49, "triangle", 0.42);
    makeTone(73.42, "sine", 0.16);

    const beat = window.setInterval(() => {
      kick();
      window.setTimeout(hat, 145);
      window.setTimeout(hat, 290);
      window.setTimeout(kick, 435);
      window.setTimeout(hat, 580);
    }, 720);

    nodesRef.current.push({ stop: () => window.clearInterval(beat) });

    setPlaying(true);
  };

  useEffect(() => stopMusic, []);

  return (
    <button
      type="button"
      onClick={toggleMusic}
      className="album-disc fixed bottom-4 left-4 z-30 grid h-20 w-20 place-items-center overflow-hidden border border-vault-crimson bg-background text-primary-foreground shadow-vault-glow"
      aria-label={playing ? "Stop background music" : "Play background music"}
    >
      <span className={playing ? "album-disc-art is-spinning" : "album-disc-art"}>
        <span className="text-[10px] font-display uppercase leading-none">JOAT</span>
      </span>
      <span className="absolute bottom-1 font-mono text-[8px] uppercase tracking-[0.18em]">
        {playing ? "Playing" : "Tap"}
      </span>
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

function ProductCard({ product, onAdd }: { product: Product; onAdd: (product: Product) => void }) {
  const soldOut = product.stock === 0;

  return (
    <motion.article
      variants={lockIn}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="group relative grid overflow-hidden border border-black bg-white text-black"
    >
      <div className="relative aspect-[4/3] overflow-hidden border-b border-black bg-white">
        <img
          src={product.image}
          alt={`${product.name} sourced inventory`}
          width={1024}
          height={1024}
          loading="lazy"
          className="h-full w-full object-contain p-2 opacity-100 transition duration-300 group-hover:scale-[1.03]"
        />
        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-black/70 font-display text-4xl uppercase text-white">
            Sold Out
          </div>
        )}
      </div>
      <div className="grid gap-3 p-3 sm:p-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2 font-mono text-[10px] uppercase text-black/60">
            <span>{product.brand}</span>
            <span>{product.id}</span>
          </div>
          <h2 className="min-h-[3.4rem] font-display text-2xl uppercase leading-none text-black sm:text-3xl">
            {product.name}
          </h2>
          <p className="mt-2 font-mono text-[11px] uppercase text-black/60">
            Sizes: {product.sizes.join(" / ")}
          </p>
        </div>
        <div className="flex items-center justify-between">
          <p className="font-mono text-sm uppercase text-black">${product.price}</p>
          <Button
            variant="vault"
            size="icon"
            onClick={() => onAdd(product)}
            disabled={soldOut}
            aria-label={`Add ${product.name} to drop`}
          >
            <Plus />
          </Button>
        </div>
      </div>
    </motion.article>
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
