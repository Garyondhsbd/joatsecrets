import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "JOAT Secrets Vault — Luxury Streetwear & Fragrance Drops" },
      { name: "description", content: "Authenticated luxury streetwear, hoodies, and fragrance drops. Chrome Hearts, Denim Tears, Sp5der, BAPE, Hellstar, Essentials. Limited stock, all sales final." },
      { name: "theme-color", content: "#990000" },
      { name: "author", content: "JOAT Secrets" },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "JOAT Secrets Vault — Luxury Streetwear Drops" },
      { property: "og:description", content: "Restricted vault for premium streetwear & fragrance. Limited stock. All sales final." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "JOAT Secrets Vault" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "JOAT Secrets Vault" },
      { name: "twitter:description", content: "Luxury streetwear & fragrance drops. Limited stock." },
      { name: "format-detection", content: "telephone=no" },
      { httpEquiv: "X-Content-Type-Options", content: "nosniff" },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.json" },
      { rel: "icon", href: "/joat-icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/joat-icon.svg" },
      { rel: "canonical", href: "https://joat-secrets-vault.lovable.app/" },
      { rel: "preconnect", href: "https://hofurxhbkxwoylunzkyu.supabase.co" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Store",
          name: "JOAT Secrets Vault",
          description: "Luxury streetwear and fragrance resale vault.",
          paymentAccepted: "Cash, Crypto, Bank Transfer",
          priceRange: "$$$",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
