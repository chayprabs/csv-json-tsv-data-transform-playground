import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Mill",
  description:
    "Mill is a browser-based workspace for Miller (mlr) command-driven data transformation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          className="skip-link"
          href="#main-content"
        >
          Skip to workspace
        </a>
        {children}
      </body>
    </html>
  );
}
