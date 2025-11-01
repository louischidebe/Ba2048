"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAccount, useBalance } from "wagmi";
import WalletBubble from "@/components/WalletBubble";
import SettingsModal from "@/components/SettingsModal";
import { fetchLeaderboard } from "@/lib/submitScore";

export default function Leaderboard() {
  const { address, isConnected } = useAccount();
  const { data: balanceData } = useBalance({
    address,
    chainId: 8453,
    watch: true,
  });

  const balance = parseFloat(balanceData?.formatted || "0");
  const [entries, setEntries] = useState<{ player: string; score: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLeaderboard();
        setEntries(data);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-50 flex flex-col relative">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pt-12 pb-8 px-6 text-center">
        <motion.h1
          className="text-4xl font-bold mb-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Leaderboard
        </motion.h1>
        <motion.p
          className="text-sm opacity-90"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          Top players on Base
        </motion.p>
      </div>

      {/* Wallet bubble */}
      {isConnected && address && (
        <div className="absolute top-4 right-4">
          <WalletBubble
            address={address}
            balance={balance}
            onClick={() => setShowSettings(true)}
          />
        </div>
      )}

      {/* Leaderboard list */}
      <div className="flex-1 px-6 py-8">
        {loading ? (
          <div className="text-center text-gray-600 py-12">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-gray-600 py-12">
            <p>No scores yet. Play a game to get on the leaderboard!</p>
          </div>
        ) : (
          <motion.div
            className="space-y-3 max-w-md mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {entries.map((entry, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg p-4 flex justify-between items-center shadow hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-blue-600 w-8">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-gray-900">
                      {entry.player.slice(0, 6)}...{entry.player.slice(-4)}
                      {address?.toLowerCase() === entry.player.toLowerCase() && (
                        <span className="ml-2 text-green-600 font-bold">(You)</span>
                      )}
                    </p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">{entry.score}</p>
              </div>
            ))}
          </motion.div>
        )}
      </div>

      <button
        onClick={() => (window.location.href = "/")}
        className="mx-auto mb-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Back
      </button>

      {showSettings && (
        <SettingsModal
          address={address}
          balance={balance}
          onClose={() => setShowSettings(false)}
          onLogout={() => window.location.reload()}
        />
      )}
    </div>
  );
}
