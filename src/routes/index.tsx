import { createFileRoute } from "@tanstack/react-router";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { Copy, Plus, Send, ShoppingBag, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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

const PASSWORD = "JOAT_ACCESS_2026";
const ACCESS_KEY = "joat-vault-access-2026";
const cashApp = "$joatz_plug";
const zelle = "payments@joatsecrets.com";
const usdt = "TQ9xJOATvaultUSDTmanualdrop93";

const lockIn = {
  hidden: { opacity: 0, y: 36, rotateX: -18, filter: "contrast(240%) brightness(1.8)" },
  show: { opacity: 1, y: 0, rotateX: 0, filter: "contrast(100%) brightness(1)" },
};

function Index() {
  const [unlocked, setUnlocked] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
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
            addToDrop={addToDrop}
            openCart={() => setCartOpen(true)}
          />
        )}
      </AnimatePresence>

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
  const [code, setCode] = useState("");
  const [denied, setDenied] = useState(false);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, -90]);

  const attemptUnlock = () => {
    if (code.trim() === PASSWORD) {
      localStorage.setItem(ACCESS_KEY, "granted");
      onUnlock();
      return;
    }
    setDenied(true);
    window.setTimeout(() => setDenied(false), 850);
  };

  return (
    <motion.section
      exit={{ opacity: 0, scale: 1.14, rotate: 1.5, filter: "blur(10px)" }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      className="relative grid min-h-screen place-items-center px-5"
    >
      <motion.div style={{ y }} className="absolute inset-0 opacity-50 vault-concrete" />
      <motion.div
        animate={
          denied ? { x: [-14, 12, -10, 8, 0], filter: ["none", "hue-rotate(45deg)", "none"] } : {}
        }
        className="relative z-10 flex w-full max-w-xl flex-col items-center text-center"
      >
        <motion.button
          type="button"
          onClick={attemptUnlock}
          animate={{
            rotateY: denied ? [0, 180, 360] : [0, -8, 8, 0],
            boxShadow: [
              "0 0 20px var(--vault-crimson)",
              "0 0 80px var(--vault-joker-purple)",
              "0 0 20px var(--vault-crimson)",
            ],
          }}
          transition={{ duration: 1.6, repeat: denied ? 0 : Infinity, ease: "linear" }}
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
        <div className="mt-8 flex w-full border border-border bg-vault-concrete p-1 focus-within:border-vault-wire focus-within:shadow-vault-glow">
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && attemptUnlock()}
            aria-label="Vault access code"
            className="min-w-0 flex-1 bg-transparent px-4 py-4 font-mono text-foreground caret-vault-crimson outline-none placeholder:text-vault-quiet"
            placeholder="ENTER RAW ACCESS STRING"
            type="password"
          />
          <Button variant="vault" size="vault" onClick={attemptUnlock} className="joker-card-button">
            <span className="glitch-text" data-text="UNLOCK">
              UNLOCK
            </span>
          </Button>
        </div>
        <a
          href="https://t.me/joatz"
          className="mt-4 font-mono text-xs uppercase text-vault-quiet hover:text-vault-wire"
        >
          {denied ? "ACCESS DENIED. TRY AGAIN (@JOATZ)" : "CLEARANCE REQUIRED // @JOATZ"}
        </a>
      </motion.div>
    </motion.section>
  );
}

function VaultHub({
  cart,
  total,
  addToDrop,
  openCart,
}: {
  cart: CartItem[];
  total: number;
  addToDrop: (product: Product, selectedColor: string, selectedSize: string) => void;
  openCart: () => void;
}) {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 900], [0, -160]);

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
      <VaultHeader cartCount={cart.length} total={total} openCart={openCart} />
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
        <motion.div
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mx-auto grid max-w-7xl grid-cols-2 gap-3 px-3 py-10 sm:gap-5 sm:px-5 lg:grid-cols-4"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} onAdd={addToDrop} />
          ))}
        </motion.div>
      </section>
    </motion.section>
  );
}

function VaultHeader({
  cartCount,
  total,
  openCart,
}: {
  cartCount: number;
  total: number;
  openCart: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <div className="font-display text-3xl uppercase leading-none text-foreground sm:text-5xl">
          JOAT SECRETS
        </div>
        <nav className="flex items-center gap-2">
          <Button
            variant="vaultGhost"
            size="icon"
            onClick={openCart}
            aria-label="Open secure drop cart"
            className="relative"
          >
            <ShoppingBag className={cartCount === 0 ? "text-vault-crimson" : "text-vault-wire"} />
            <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center bg-vault-crimson px-1 font-mono text-[10px] text-primary-foreground">
              {cartCount}
            </span>
          </Button>
          <Button variant="vaultGhost" asChild>
            <a href="https://t.me/joatz" className="px-3">
              <Send size={16} />
              <span className="hidden font-mono text-xs uppercase sm:inline">
                ${total} // Telegram
              </span>
            </a>
          </Button>
        </nav>
      </div>
    </header>
  );
}

function ProductCard({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (product: Product, selectedColor: string, selectedSize: string) => void;
}) {
  const [selectedColor, setSelectedColor] = useState(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState(product.sizes[0]);

  return (
    <motion.article
      variants={lockIn}
      transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      className="group overflow-hidden border border-border bg-vault-concrete vault-concrete distressed-card"
    >
      <div className="relative aspect-square overflow-hidden bg-background">
        <img
          src={product.image}
          alt={`${product.name} sourced inventory`}
          width={1024}
          height={1024}
          loading="lazy"
          className="h-full w-full object-cover opacity-70 contrast-125 transition duration-300 group-hover:scale-105 group-hover:opacity-100 group-hover:glitch-product"
        />
        <div className="absolute inset-0 bg-vault-concrete-light/40 mix-blend-multiply transition-opacity group-hover:opacity-0" />
      </div>
      <div className="space-y-3 p-3 sm:p-4">
        <h2 className="font-display text-2xl uppercase leading-none text-foreground sm:text-3xl">
          [{product.id}] {product.name}
        </h2>
        <p className="font-mono text-[10px] uppercase text-vault-wire">{product.category}</p>
        <div className="space-y-1 font-mono text-[11px] uppercase text-vault-quiet sm:text-xs">
          <p>TIER: {product.tier}</p>
          <p className="matrix-price text-vault-crimson">
            PRICE:{" "}
            <span className="matrix-value relative">
              <span>${product.price}</span>
            </span>
          </p>
          <p className={product.stock <= 4 ? "text-vault-crimson" : "text-vault-quiet"}>
            STOCK: {product.stock} REMAINING
          </p>
        </div>
        <div className="space-y-3 font-mono text-[10px] uppercase text-vault-quiet">
          <label className="block">
            Select Size
            <select
              value={selectedSize}
              onChange={(event) => setSelectedSize(event.target.value)}
              className="mt-1 w-full border border-border bg-background px-2 py-2 text-foreground outline-none focus:border-vault-wire"
            >
              {product.sizes.map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-1">
            {product.colors.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setSelectedColor(color)}
                className={`border px-2 py-1 ${
                  selectedColor === color
                    ? "border-vault-wire bg-vault-crimson text-primary-foreground shadow-vault-glow"
                    : "border-border bg-background text-vault-quiet"
                }`}
              >
                {color}
              </button>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            variant="vault"
            size="icon"
            onClick={() => onAdd(product, selectedColor, selectedSize)}
            aria-label={`Add ${product.name} to drop`}
          >
            <Plus />
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

function CartDrawer(props: {
  open: boolean;
  cart: Product[];
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
        `JOAT DROP HANDOFF\nOrder: ${orderId}\nTotal: $${total}\nTelegram: ${details.telegram}`,
      ),
    [details.telegram, orderId, total],
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
  cart: Product[];
  total: number;
  onSecure: () => void;
}) {
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
              {item.id} // {item.name}
            </span>
            <span className="text-vault-crimson">${item.price}</span>
          </div>
        ))
      )}
      <div className="flex justify-between font-display text-4xl uppercase">
        <span>Total</span>
        <span className="text-vault-crimson">${total}</span>
      </div>
      <Button
        variant="vault"
        size="vault"
        className="w-full"
        disabled={cart.length === 0}
        onClick={onSecure}
      >
        <span className="glitch-text" data-text="SECURE THE DROP">
          SECURE THE DROP
        </span>
      </Button>
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
