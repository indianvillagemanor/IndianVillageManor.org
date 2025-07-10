import type { Metadata } from "next";
import { Noto_Serif } from "next/font/google";
import "./globals.css";
import SiteMenuClient from "@/components/SiteMenuClient";
import WindowWithSize from "@/components/window_with_size";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

const Noto = Noto_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Indian Village Manor",
  description: "Indian Village Manor Condominiums in Detroit, Michigan",
};

const contentStyle: React.CSSProperties = {
  marginTop: '50px' // Add a top margin equal to the height of the header
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en">
      <body className={`${Noto.variable} antialiased`}>
        <SessionProviderWrapper>
          <SiteMenuClient />
          <main style={contentStyle}>
            <WindowWithSize>
              {children}
            </WindowWithSize>
          </main>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
