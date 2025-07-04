import { Header } from "@/components/Header";
import ContextProviderAsWalletProviders from "@/components/providers/wallet-provider";
import { headers } from "next/headers";
import React from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersData = await headers();
  const cookies = headersData.get("cookie");
  return (
    <>
      <ContextProviderAsWalletProviders cookies={cookies}>
        {/* <Header /> */}

        {children}
      </ContextProviderAsWalletProviders>
    </>
  );
}
