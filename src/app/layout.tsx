import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Geist_Mono, Lexend } from "next/font/google";
import "./globals.css";
import { getSiteSettings } from "@/lib/site-settings";
import { SITE_URL } from "@/lib/site-url";
import { Toaster } from "@/components/ui/sonner";

// globals.css's Tailwind theme expects a `--font-sans` custom property
// (`--font-sans: var(--font-sans)` in the @theme block) — the previous Geist
// setup defined `--font-geist-sans` instead, which that self-reference never
// picked up, so the intended font was silently never applying anywhere.
// Naming this one `--font-sans` is what actually wires it up.
const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display font for the public storefront only (hero/section headings, plan
// cards, nav wordmark) — scoped via the `font-display` utility class so the
// admin dashboard's already-approved Plus Jakarta Sans is untouched.
const fontDisplay = Lexend({
  variable: "--font-display",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: settings.siteName, template: `%s | ${settings.siteName}` },
    description: settings.tagline ?? undefined,
    icons: settings.faviconUrl ? { icon: settings.faviconUrl } : undefined,
    openGraph: {
      siteName: settings.siteName,
      type: "website",
    },
  };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const settings = await getSiteSettings();

  return (
    <html
      lang="en"
      className={`${fontSans.variable} ${geistMono.variable} ${fontDisplay.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: settings.siteName,
              url: SITE_URL,
            }),
          }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
