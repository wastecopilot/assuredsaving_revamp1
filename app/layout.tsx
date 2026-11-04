import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { cssVariables } from "@/lib/tokens";
import "./globals.css";

/* One geometric family for UI and display, with tabular figures for prices. */
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-body", display: "swap" });

const title = "Assured Saving | Compare internet, TV and mobile plans with all-in pricing";
const description =
  "Choose your services, enter your address and compare plans from US providers with every required fee included. Design preview with sample data.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website", siteName: "Assured Saving", locale: "en_US" },
  twitter: { card: "summary", title, description },
};

export const viewport: Viewport = { themeColor: "#0A0E2E", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jakarta.variable}>
      <head>
        <style dangerouslySetInnerHTML={{ __html: `${cssVariables()}:root{--font-heading:var(--font-body)}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
