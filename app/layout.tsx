import type { Metadata } from "next";

import { SeoIntroBar } from "@/components/SeoIntroBar";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mill — Miller (mlr) data transform playground",
  description:
    "Paste CSV, TSV, JSON, NDJSON, or DKVP. Run Miller command chains in the browser workspace. Share state by URL.",
  keywords: [
    "mill",
    "miller",
    "mlr",
    "csv",
    "tsv",
    "json",
    "ndjson",
    "data transformation",
    "playground",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a
          className="skip-link"
          href="#main-content"
        >
          Skip to workspace
        </a>
        <SiteHeader />
        <SeoIntroBar />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
