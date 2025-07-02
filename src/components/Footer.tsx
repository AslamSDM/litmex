"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="w-full bg-black/50 border-t border-white/10 backdrop-blur-lg z-[9999]">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and tagline */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/lit_logo.png"
                alt="Litmex Logo"
                width={50}
                height={50}
                className="mr-2"
              />
              <span className="text-xl font-bold text-white">Litmex</span>
            </Link>
            <p className="text-sm text-white/70">
              The future of decentralized prediction markets and intelligent,
              automated crypto wagering at scale.
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <Link
                href="https://x.com/Litmexprotocol"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </div>
              </Link>
              <Link
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.608 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1634-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
                  </svg>
                </div>
              </Link>
              <Link
                href="https://telegram.org"
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                  </svg>
                </div>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-white text-lg font-medium mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/"
                  className="text-white/70 hover:text-primary transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/presale"
                  className="text-white/70 hover:text-primary transition-colors"
                >
                  Presale
                </Link>
              </li>
              <li>
                <Link
                  href="/profile"
                  className="text-white/70 hover:text-primary transition-colors"
                >
                  Profile
                </Link>
              </li>
              <li>
                <Link
                  href="/referral"
                  className="text-white/70 hover:text-primary transition-colors"
                >
                  Referrals
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-white text-lg font-medium mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-primary transition-colors"
                >
                  Whitepaper
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-primary transition-colors"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-primary transition-colors"
                >
                  Tokenomics
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="text-white/70 hover:text-primary transition-colors"
                >
                  Roadmap
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-1">
            <h3 className="text-white text-lg font-medium mb-4">
              Stay Updated
            </h3>
            <p className="text-sm text-white/70 mb-4">
              Subscribe to our newsletter to receive updates about Litmex
            </p>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="px-4 py-2 bg-black/30 border border-white/10 rounded-l-md text-white w-full focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary/80 hover:bg-primary transition-colors rounded-r-md text-white"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-4 border-t border-white/10">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-white/50">
              &copy; {new Date().getFullYear()} Litmex Protocol. All rights
              reserved.
            </p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <Link
                href="#"
                className="text-xs text-white/50 hover:text-primary transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-xs text-white/50 hover:text-primary transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                href="#"
                className="text-xs text-white/50 hover:text-primary transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
