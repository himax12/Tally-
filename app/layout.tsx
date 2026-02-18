import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wallet System API",
  description: "Production-grade wallet service with double-entry ledger",
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
