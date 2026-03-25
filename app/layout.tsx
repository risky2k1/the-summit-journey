import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hành Trình Đỉnh Núi",
  description: "Game tu tiên dạng chữ — The Summit Journey",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="h-full mdl-js">
      <body
        className={`${jetBrainsMono.className} min-h-full flex flex-col antialiased`}
      >
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
