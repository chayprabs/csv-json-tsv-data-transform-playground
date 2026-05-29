import type { Metadata } from "next";

import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Mill — Miller (mlr) data transform workspace",
    template: "%s | Mill",
  },
  description:
    "Paste CSV, TSV, JSON, or NDJSON and run Miller (mlr) command chains online. Filter, sort, reshape, and convert tabular data in a simple browser workspace.",
  openGraph: {
    title: "Mill — Miller (mlr) data transform workspace",
    description:
      "Paste tabular data, run Miller command chains, copy or download results.",
    type: "website",
    siteName: "Mill",
  },
  twitter: {
    card: "summary",
    title: "Mill — Miller (mlr) data transform workspace",
    description:
      "Paste tabular data, run Miller command chains, copy or download results.",
    creator: "@chayprabs",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-white">
        <a
          className="skip-link"
          href="#main-content"
        >
          Skip to workspace
        </a>
        <SiteHeader />
        <div className="flex flex-1 flex-col">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
