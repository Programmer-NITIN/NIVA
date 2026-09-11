import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NIVA — Responsible Financial Intelligence for Bharat",
  description:
    "AI-powered hyper-personalized banking copilot using RBI Account Aggregator framework. Zero-hallucination financial intelligence with responsible recommendation gates.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
