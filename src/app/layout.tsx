import type { Metadata } from "next";
import { Geist, Bruno_Ace, Arvo } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LoadingProvider } from "@/components/providers/loading-provider";
import { Toaster } from "sonner";
import { FluxDock } from "@/components/FluxDock";
import { Footer } from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
// const asimovian = Asimovian({
//   variable: "--font-asimovian",
//   subsets: ["latin"],
//   weight: "400",
// });
const brunoAce = Bruno_Ace({
  variable: "--font-bruno-ace",
  subsets: ["latin"],
  weight: "400",
});

const arvo = Arvo({
  variable: "--font-arvo",
  subsets: ["latin"],
  weight: "400",
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
      <body className={` ${arvo.className}  antialiased bg-black`}>
        <LoadingProvider>
          <AuthProvider>
            <Toaster />
            {children}
            <FluxDock />
            <Footer />
          </AuthProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
