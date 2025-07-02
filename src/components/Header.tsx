"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Menu, X, LogOut, User, LogIn } from "lucide-react";
import Image from "next/image";
import { useSession, signOut, signIn } from "next-auth/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useAppKitNetwork } from "@reown/appkit/react";
import { solana, bsc } from "@reown/appkit/networks";
import { Button } from "./ui/button";
import { UnifiedWalletButton } from "./UnifiedWalletButton";

const navLinks = [
  { href: "/presale", label: "Presale" },
  // Removed profile link since we'll add it as an avatar
];

// Network Selector Component
const NetworkSelector = () => {
  const { caipNetwork, chainId, switchNetwork } = useAppKitNetwork();
  const [currentNetwork, setCurrentNetwork] = useState<"bsc" | "solana">("bsc");

  // Update local network state based on chainId
  useEffect(() => {
    if (chainId === "5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") {
      setCurrentNetwork("solana");
    } else {
      setCurrentNetwork("bsc");
    }
  }, [chainId]);

  const handleNetworkChange = (value: string) => {
    if (value === "bsc" || value === "solana") {
      switchNetwork(value === "bsc" ? bsc : solana);
      setCurrentNetwork(value as "bsc" | "solana");
    }
  };

  return (
    <Select value={currentNetwork} onValueChange={handleNetworkChange}>
      <SelectTrigger className="w-20 h-8 text-xs bg-black/50 border-white/10 backdrop-blur-sm">
        <SelectValue placeholder="Network" />
      </SelectTrigger>
      <SelectContent className="bg-black/90 backdrop-blur-md border-primary/20">
        <SelectItem value="bsc">BSC</SelectItem>
        <SelectItem value="solana">Solana</SelectItem>
      </SelectContent>
    </Select>
  );
};

export function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session } = useSession();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helper function to clear cookies
  const clearAllCookies = () => {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success("Successfully logged out");
      clearAllCookies(); // Clear all cookies on logout
      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      toast.error("Failed to log out. Please try again.");
    }
  };

  return (
    <header
      className={`fixed top-4 sm:top-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-500 backdrop-blur-lg bg-black/30 border border-white/10 rounded-xl sm:rounded-2xl ${
        scrolled
          ? "py-1.5 sm:py-2 w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] translate-y-0 shadow-lg"
          : "py-2 sm:py-3 w-[97%] sm:w-[95%] md:w-[85%] lg:w-[75%] translate-y-2 sm:translate-y-4"
      }`}
    >
      <div className="px-2 sm:px-4 md:px-8 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src={"/lit_logo.png"}
            alt="Litmex Logo"
            width={60}
            height={60}
            className="mr-2 w-[50px] min-w-[50px] h-auto sm:w-[60px] sm:min-w-[60px] md:w-[70px] md:min-w-[70px]"
            style={{ minHeight: "25px" }}
          />
          <span className="text-white font-bold text-lg md:hidden">LITMEX</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-4 lg:space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-primary relative group ${
                pathname === link.href ? "text-primary" : "text-white/80"
              }`}
            >
              {link.label}
              {pathname === link.href && (
                <motion.div
                  layoutId="navbar-indicator"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform" />
            </Link>
          ))}
          <div className="h-5 w-px bg-white/20" />
          <div className="flex items-center gap-3">
            {/* <NetworkSelector /> */}

            {session?.user ? (
              <>
                {/* Only show wallet button when logged in */}
                <UnifiedWalletButton size="sm" />

                {/* Profile avatar */}
                <Link
                  href="/profile"
                  className="relative flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 border border-primary/30 hover:border-primary transition-all"
                >
                  {session.user.image ? (
                    <Image
                      src={session.user.image || "/lit_logo.png"}
                      alt="Profile"
                      width={30}
                      height={30}
                      className="rounded-full"
                    />
                  ) : (
                    <User size={16} className="text-primary" />
                  )}
                </Link>

                {/* Logout button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span className="sr-only sm:not-sr-only sm:ml-1.5">
                    Logout
                  </span>
                </Button>
              </>
            ) : (
              <>
                {/* Login button when not logged in */}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary/40 text-primary hover:bg-primary/10"
                  onClick={() => signIn()}
                >
                  <LogIn size={16} className="mr-1.5" />
                  Sign In
                </Button>
              </>
            )}

            {pathname !== "/presale" && (
              <Link href="/presale" className="hidden lg:block">
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-none group relative overflow-hidden"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-[#8a63d2] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center justify-center gap-1">
                    Buy Now
                    <span className="inline-block group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </span>
                </Button>
              </Link>
            )}
          </div>
        </nav>

        {/* Mobile Navigation Button */}
        <div className="md:hidden flex items-center space-x-2">
          {session?.user ? (
            <>
              {/* Profile link for mobile */}
              <Link
                href="/profile"
                className="relative flex items-center justify-center w-7 h-7 rounded-full bg-primary/20 border border-primary/30"
              >
                {session.user.image ? (
                  <Image
                    src={session.user.image || "/lit_logo.png"}
                    alt="Profile"
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                ) : (
                  <User size={14} className="text-primary" />
                )}
              </Link>

              {/* Logout button */}
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 h-auto text-red-400 hover:bg-red-500/10"
                onClick={handleLogout}
              >
                <LogOut size={16} />
              </Button>

              {/* Only show wallet button when logged in */}
              <UnifiedWalletButton size="sm" variant="minimal" />
            </>
          ) : (
            <>
              {/* Login button when not logged in */}
              <Button
                variant="ghost"
                size="sm"
                className="p-1.5 h-auto text-primary hover:bg-primary/10"
                onClick={() => signIn()}
              >
                <LogIn size={16} />
              </Button>
            </>
          )}

          <button
            className="text-white focus:outline-none p-1.5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <motion.div
        className="md:hidden"
        initial="closed"
        animate={mobileMenuOpen ? "open" : "closed"}
        variants={{
          open: { opacity: 1, height: "auto", display: "block" },
          closed: {
            opacity: 0,
            height: 0,
            transitionEnd: { display: "none" },
          },
        }}
      >
        <div className="mx-2 sm:mx-4 my-2 px-3 py-3 bg-black/60 backdrop-blur-xl rounded-xl border border-white/10">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium px-3 py-1.5 transition-colors hover:bg-white/10 rounded ${
                  pathname === link.href
                    ? "text-primary border-l-2 border-primary pl-2.5"
                    : "text-white/80"
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* Always show profile link in mobile menu */}
            <Link
              href="/profile"
              className={`text-sm font-medium px-3 py-1.5 transition-colors hover:bg-white/10 rounded flex items-center ${
                pathname === "/profile"
                  ? "text-primary border-l-2 border-primary pl-2.5"
                  : "text-white/80"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <User size={14} className="mr-2" />
              Profile
            </Link>

            <div className="pt-2 border-t border-primary/10">
              {session?.user ? (
                <>
                  {/* Only show network selector when logged in */}
                  <div className="flex items-center justify-between mb-3 mt-2">
                    <span className="text-xs text-white/70">Network:</span>
                    <NetworkSelector />
                  </div>
                </>
              ) : (
                <div className="mb-3 mt-2">
                  <Button
                    className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 text-primary"
                    onClick={() => {
                      signIn();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogIn size={16} className="mr-2" />
                    Sign In
                  </Button>
                </div>
              )}

              <Link href="/presale" className="block mb-3">
                <Button
                  className="w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white border-none group relative overflow-hidden"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-[#8a63d2] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center justify-center gap-1">
                    Buy Now
                    <span className="inline-block group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </header>
  );
}
