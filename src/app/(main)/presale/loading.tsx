// src/app/presale/loading.tsx
import React from "react";
import { DecorativeIcon } from "@/components/DecorativeElements";

export default function PresaleLoading() {
  return (
    <div className="w-full min-h-screen flex flex-col items-center justify-center bg-background relative">
      <div className="animate-pulse text-primary text-2xl font-bold mb-4 z">
        Loading Presale...
      </div>

      <div className="mt-4 h-2 w-64 bg-gray-800 rounded-full overflow-hidden">
        <div className="animate-[loading_1.5s_ease-in-out_infinite] h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 w-full"></div>
      </div>

      <div className="mt-12">
        <div className="animate-spin-slow">
          <DecorativeIcon
            icon="diamond"
            size="lg"
            className="text-primary/40"
          />
        </div>
      </div>

      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-primary/10 blur-2xl"></div>
        <div className="absolute top-2/3 right-1/4 w-48 h-48 rounded-full bg-purple-500/10 blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/3 w-24 h-24 rounded-full bg-amber-500/10 blur-xl"></div>
      </div>
    </div>
  );
}
