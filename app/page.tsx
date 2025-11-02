"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAccount, useBalance } from "wagmi";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import WalletBubble from "@/components/WalletBubble";
import SettingsModal from "@/components/SettingsModal";
import { sdk } from "@farcaster/miniapp-sdk";
import { ethers } from "ethers";

export default function HomePage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { data: balanceData, refetch } = useBalance({
    address,
    chainId: 8453,
  });

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isFarcaster, setIsFarcaster] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const balance = parseFloat(balanceData?.formatted || "0");

  // -----------------------------
  // Detect Farcaster and mark SDK ready
  // -----------------------------
  useEffect(() => {
    try {
      sdk.actions.ready();
      if (typeof window !== "undefined" && (window as any).farcaster) {
        setIsFarcaster(true);
      }
    } catch (e) {
      console.warn("Farcaster SDK not available:", e);
    }
  }, []);

  // -----------------------------
  // Helper: fetch Farcaster wallet
  // -----------------------------
  const fetchFarcasterWallet = async (): Promise<string | null> => {
    try {
      const accounts = await sdk.wallet.ethProvider.request?.({ method: "eth_accounts" }) || [];
      const addr = accounts[0];
      if (!addr) return null;

      // Optional: create ethers signer if you need it later
      // const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider);
      // const signer = await provider.getSigner();

      return addr;
    } catch (err) {
      console.warn("Farcaster fetch error:", err);
      return null;
    }
  };

  // -----------------------------
  // Fetch connected wallet (Farcaster or RainbowKit)
  // -----------------------------
  useEffect(() => {
    const fetchWallet = async () => {
      if (isFarcaster) {
        const addr = await fetchFarcasterWallet();
        setWalletAddress(addr);
      } else if (isConnected && address) {
        setWalletAddress(address);
      } else {
        setWalletAddress(null);
      }
    };

    fetchWallet();
  }, [isFarcaster, isConnected, address]);

  // -----------------------------
  // Refresh balance every 10s
  // -----------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  // -----------------------------
  // Render UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-50 flex flex-col relative">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pt-12 pb-8 px-6 text-center">
        <motion.h1
          className="text-6xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          2048
        </motion.h1>
        <motion.p
          className="text-sm opacity-90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          on Base
        </motion.p>
      </div>

      {/* Wallet bubble */}
      {walletAddress && (
        <div className="absolute top-4 right-4">
          <WalletBubble
            address={walletAddress}
            balance={balance}
            onClick={() => setShowSettings(true)}
          />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {!walletAddress ? (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-lg mb-6 text-base-text">
              Connect your wallet to play
            </p>

            {/* RainbowKit / MetaMask / WalletConnect */}
            {!isFarcaster && (
              <motion.button
                onClick={openConnectModal}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-colors w-full max-w-xs"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Connect Wallet
              </motion.button>
            )}

            {/* Farcaster Wallet */}
            {isFarcaster && (
              <motion.button
                onClick={async () => {
                  const addr = await fetchFarcasterWallet();
                  setWalletAddress(addr);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-2xl text-lg transition-colors w-full max-w-xs"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Connect Farcaster Wallet
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col gap-4 w-full max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={() => router.push("/game")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-2xl text-2xl transition-colors w-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PLAY
            </motion.button>

            <motion.button
              onClick={() => router.push("/leaderboard")}
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-4 px-12 rounded-2xl text-2xl transition-colors w-full border-2 border-blue-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              LEADERBOARD
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          address={walletAddress}
          balance={balance}
          onClose={() => setShowSettings(false)}
          onLogout={() => window.location.reload()}
        />
      )}
    </div>
  );
}
