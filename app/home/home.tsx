"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAccount, useBalance } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import WalletBubble from "@/components/WalletBubble";
import SettingsModal from "@/components/SettingsModal";

interface HomeProps {
  onPlay: () => void;
  onLeaderboard: () => void;
}

export default function Home({ onPlay, onLeaderboard }: HomeProps) {
  const { address, isConnected } = useAccount();
  const { data: balanceData, refetch } = useBalance({
    address,
    chainId: 8453,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [refetch]);

  const balance = parseFloat(balanceData?.formatted || "0");

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (isConnected && address) setWalletAddress(address);
    else setWalletAddress(null);
  }, [isConnected, address]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-50 flex flex-col">
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
            <p className="text-lg mb-6 text-base-text">Connect your wallet to play</p>
            <div className="flex justify-center">
              <ConnectButton chainStatus="icon" showBalance={false} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="flex flex-col gap-4 w-full max-w-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <motion.button
              onClick={onPlay}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-12 rounded-2xl text-2xl transition-colors w-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              PLAY
            </motion.button>
            <motion.button
              onClick={onLeaderboard}
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-4 px-12 rounded-2xl text-2xl transition-colors w-full border-2 border-blue-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              LEADERBOARD
            </motion.button>
          </motion.div>
        )}
      </div>

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
