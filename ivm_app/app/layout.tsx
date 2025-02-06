import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import { useEffect } from "react";
import Aspect from "@/components/aspect";
import SiteMenu from "@/components/site_menu";

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
  height: "36px",
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
        <img src="/ivm_green.png" alt="ivm" style={headerStyle} />
        <SiteMenu />
        {children}
      </body>
    </html>
  );
}
