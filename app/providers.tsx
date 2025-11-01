"use client";

import * as React from "react";
import {
  RainbowKitProvider,
  getDefaultConfig,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { base } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@rainbow-me/rainbowkit/styles.css";

// ✅ getDefaultConfig now returns a valid Wagmi config directly
const config = getDefaultConfig({
  appName: "2048 on Base",
  projectId: process.env.NEXT_PUBLIC_WC_PROJECT_ID!,
  chains: [base],
  ssr: true, // avoids localStorage issues on the server
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
