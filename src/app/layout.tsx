import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bajaj Finserv Health Graph Resolver & Cycle Compiler",
  description: "An advanced interactive visual graph compiler and loop detector. Parse node hierarchies, resolve multi-parents, compute path depths, and generate structured JSON schemas.",
  keywords: ["Graph Resolver", "Hierarchy Compiler", "Cycle Detector", "Full Stack Challenge", "Bajaj Finserv Health", "Vercel", "Next.js"],
  authors: [{ name: "Yudhveer" }],
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
