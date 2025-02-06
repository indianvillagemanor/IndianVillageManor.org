import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import Aspect from "@/components/aspect";

// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

const Noto = Noto_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indian Village Manor",
  description: "Indian Village Manor Condominiums in Detroit, Michigan",
};

const headerStyle = {
  width: "100%",
  height: "var(--grid-row-height)",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body
        className={`${Noto.variable} antialiased`}
      >
        <Aspect>
          <img src="/ivm_green.png" alt="ivm" style={headerStyle} />
          {children}
        </Aspect>
      </body>
    </html>
  );
}
