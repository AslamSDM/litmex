"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Home, User, Sparkle } from "lucide-react";
import { Dock, DockIcon } from "@/components/magicui/dock";
import { useEffect, useState, useMemo } from "react";

// Custom hook to detect iOS devices
const useIsIOS = () => {
  const [isIOS, setIsIOS] = useState<boolean>(false);

  useEffect(() => {
    // Only run once on client side
    if (typeof window !== "undefined") {
      // Check specifically for iOS devices
      const isiOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      setIsIOS(isiOS);
    }
  }, []); // Empty dependency array ensures this only runs once

  return isIOS;
};

export function FluxDock() {
  const pathname = usePathname();
  const isIOS = useIsIOS();

  // Memoize the dock links to prevent unnecessary re-renders
  const dockLinks = useMemo(() => {
    return (
      <>
        <Link href="/" className="block cursor-pointer">
          <DockIcon
            className={`flex flex-col items-center justify-center transition-all duration-300 p-3 cursor-pointer ${
              pathname === "/" ? "text-primary" : "hover:text-primary"
            }`}
          >
            <div className="flex flex-col items-center justify-center p-2">
              <Home size={28} strokeWidth={1.5} />
            </div>
          </DockIcon>
        </Link>
        <Link
          href={isIOS ? "/presale-ios" : "/presale"}
          className="block cursor-pointer"
        >
          <DockIcon
            className={`flex flex-col items-center justify-center transition-all duration-300 p-3 cursor-pointer ${
              pathname === "/presale" || pathname === "/presale-ios"
                ? "text-primary"
                : "hover:text-primary"
            }`}
          >
            <div className="flex flex-col items-center justify-center p-2">
              <Sparkle size={28} strokeWidth={1.5} />
            </div>
          </DockIcon>
        </Link>

        <Link
          href={isIOS ? "/profile-ios" : "/profile"}
          className="block cursor-pointer"
        >
          <DockIcon
            className={`flex flex-col items-center justify-center transition-all duration-300 p-3 cursor-pointer ${
              pathname === "/profile" ? "text-primary" : "hover:text-primary"
            }`}
          >
            <div className="flex flex-col items-center justify-center p-2">
              <User size={28} strokeWidth={1.5} />
            </div>
          </DockIcon>
        </Link>
      </>
    );
  }, [pathname, isIOS]); // Only re-calculate when pathname or isIOS changes

  return (
    <Dock
      className="fixed bottom-8 w-auto left-1/2 transform -translate-x-1/2 z-50 shadow-xl rounded-full bgb/90 backdrop-blur-md px-8 py-3 border border-border/40 flex gap-6"
      iconSize={56}
      iconMagnification={80}
      iconDistance={160}
      direction="middle"
    >
      {dockLinks}
    </Dock>
  );
}
