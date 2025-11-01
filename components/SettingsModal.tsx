"use client";
import { useDisconnect } from "wagmi";

interface SettingsModalProps {
  address: string | null;
  balance: number;
  onClose: () => void;
  onLogout: () => void;
}

export default function SettingsModal({
  address,
  balance,
  onClose,
  onLogout,
}: SettingsModalProps) {
  const { disconnect } = useDisconnect();

  const handleLogout = async () => {
    try {
      await disconnect(); // ✅ make sure wallet disconnect finishes cleanly
      onClose();
      onLogout();
      setTimeout(() => {
        window.location.replace("/"); // ✅ replace instead of href to avoid flicker
      }, 100);
    } catch (err) {
      console.error("Logout error:", err);
      window.location.replace("/"); // fallback
    }
  };

  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-surface rounded-2xl p-8 max-w-sm w-full shadow-xl animate-scale-in">
        <h2 className="text-2xl font-bold text-primary mb-6">Settings</h2>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-xs text-text-light mb-1">Wallet Address</p>
            <p className="font-mono text-sm bg-gray-100 p-3 rounded break-all">{address}</p>
          </div>

          <div>
            <p className="text-xs text-text-light mb-1">Balance</p>
            <p className="text-2xl font-bold text-primary">{balance.toFixed(6)} ETH</p>
          </div>

          <p className="text-xs text-text-light italic">
            Playing and updating your score on the leaderboard requires an on-chain transaction on Base. No gas is sponsored.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleLogout}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        <button onClick={onClose} className="w-full mt-4 text-text-light hover:text-text transition-colors">
          Close
        </button>
      </div>
    </div>
  );
}
