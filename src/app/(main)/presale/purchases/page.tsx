"use client";

import React from "react";
import PurchaseHistory from "@/components/PurchaseHistory";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PurchasesPage() {
  return (
    <div className="container mx-auto mt-24 py-12 px-4 max-w-4xl">
      <div className="mb-8">
        <Link href="/presale" passHref>
          <Button
            variant="ghost"
            className="text-primary hover:text-primary/80"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Presale
          </Button>
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-8 text-white">Your LMX Purchases</h1>

      <PurchaseHistory />

      <div className="mt-12 bg-black/40 p-4 rounded-lg border border-primary/10">
        <h3 className="text-lg font-medium text-white mb-2">Need Help?</h3>
        <p className="text-white/70">
          If you have any questions about your purchases or need assistance,
          please contact our support team at{" "}
          <a
            href="mailto:support@Litmex.com"
            className="text-primary hover:text-primary/80"
          >
            support@Litmex.com
          </a>
        </p>
      </div>
    </div>
  );
}
