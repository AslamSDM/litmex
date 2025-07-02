import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FluxDock } from "@/components/FluxDock";
import { Footer } from "@/components/Footer";
import localFont from "next/font/local";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LoadingProvider } from "@/components/providers/loading-provider";

const blackBird = localFont({
  src: "../../public/fonts/ductile.otf",
  variable: "--font-display",
});
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://litmexpresale.com"),
  title: "Litmex | Premium Web3 Gaming Platform",
  description:
    "A luxury web3 gaming platform offering provably fair games and exclusive rewards",
  keywords: [
    "Web3 gaming",
    "Blockchain casino",
    "Litmex",
    "Crypto gambling",
    "NFT gaming",
    "Presale",
    "Crypto games",
    "Provably fair",
  ],
  icons: {
    icon: [{ url: "/lit_logo.ico", sizes: "32x32" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${blackBird.variable} antialiased bg-black`}
      >
        <LoadingProvider>
          <AuthProvider>
            {children}
            <FluxDock />
            <Footer />
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
