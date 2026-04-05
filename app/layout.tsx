import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Gridcraft Studio",
  description:
    "A data transformation workspace for command-driven format conversion and record shaping.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
