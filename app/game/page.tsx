"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Grid from "@/components/Grid";
import Toast from "@/components/Toast";
import LowBalanceModal from "@/components/LowBalanceModal";
import WinModal from "@/components/WinModal";
import SettingsModal from "@/components/SettingsModal";
import { initializeBoard, move, canMove } from "@/lib/game-logic";
import { useAccount, useConnect, useDisconnect, useBalance } from "wagmi";
import { injected } from "wagmi/connectors";
import { createGameOnChain, submitFinalScoreOnChain, postScoreToLeaderboard } from "@/lib/submitScore";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";

const MOVE_COST = 0.00003;
const DEV_FEE = 0.2;
const TOTAL_MOVE_COST = MOVE_COST * (1 + DEV_FEE);
const MIN_BALANCE = TOTAL_MOVE_COST;

export default function Game() {
  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  const [gameId, setGameId] = useState<number | null>(null);
  const [playerAddress, setPlayerAddress] = useState<string | null>(null);
  const [gameSigner, setGameSigner] = useState<any>(null);


  const { data: balanceData, refetch } = useBalance({
    address,
    chainId: 8453, //
    watch: true,
  });

  const balance = parseFloat(balanceData?.formatted || "0");

  const [board, setBoard] = useState(initializeBoard());
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [toast, setToast] = useState<{ message: string; txHash?: string } | null>(null);
  const [lowBalance, setLowBalance] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const submitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🧠 Get signer from the connected wallet
  const getSigner = async () => {
    if (!window.ethereum) throw new Error("No wallet provider found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    return await provider.getSigner();
  };

  const movesLeft = Math.floor(balance / TOTAL_MOVE_COST);

  // ✅ Handle moves — local + onchain on game end
  const submitMove = useCallback(
    async (direction: "up" | "down" | "left" | "right") => {
      if (gameOver || won) return;
      if (balance < MIN_BALANCE) {
        setLowBalance(true);
        return;
      }

      const result = move(board, direction);
      if (!result.moved) return;

      const newScore = score + result.scoreDelta;
      setBoard(result.board);
      setScore(newScore);
      setMoves((m) => m + 1);

    const isWin = result.board.flat().includes(2048);
    const isGameOver = !canMove(result.board);

    // 🎉 Notify when 2048 is reached, but don’t end the game yet
    if (isWin && !won) {
      setWon(true);
      setToast({ message: "🎉 You reached 2048! Keep going!" });
      setTimeout(() => setToast(null), 3000);
    }

    if (isGameOver) {
      setGameOver(true);
      try {
    // 🧩 Use the same signer and wallet that created the game

          // 🧩 Use the same signer and wallet that created the game
          const signerToUse = gameSigner || (await getSigner());
          const signerAddress = await signerToUse.getAddress();

          if (playerAddress && signerAddress.toLowerCase() !== playerAddress.toLowerCase()) {
            console.warn("⚠️ Connected wallet does not match the game creator!");
            setToast({
              message: "You must submit the score from the same wallet that started the game.",
            });
            setTimeout(() => setToast(null), 4000);
            return;
          }

          let finalGameId = gameId;

          // If game was never registered (shouldn’t happen), create one
          if (finalGameId == null) {
            finalGameId = await createGameOnChain(signerToUse, board);
            setGameId(finalGameId);
          }

          console.log("🏁 Submitting final score:", newScore);

          const txHash = await submitFinalScoreOnChain(
            signerToUse,
            finalGameId,
            result.board,
            newScore
          );

          console.log("✅ Score submitted:", txHash);
          setToast({
            message: `Final score submitted onchain!`,
            txHash: `${txHash.slice(0, 6)}...${txHash.slice(-4)}`,
          });
          setTimeout(() => setToast(null), 4000);

          // ✅ Also post to off-chain leaderboard (optional for now)
          await postScoreToLeaderboard(signerAddress, newScore);
          console.log("🎯 Score also posted to leaderboard API!");
        } catch (err) {
          console.error("❌ Final submission failed:", err);
          setToast({ message: "Error submitting final score." });
          setTimeout(() => setToast(null), 4000);
        }
      }
    },
    [board, score, gameOver, won, gameId, balance, gameSigner, playerAddress]
  );


  // ✅ Keyboard listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        const dir = e.key.replace("Arrow", "").toLowerCase() as "up" | "down" | "left" | "right";
        submitMove(dir);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [submitMove]);

  // ✅ LOCAL-ONLY New Game (no gas cost)
  const handleNewGame = async () => {
    const newBoard = initializeBoard();
    setBoard(newBoard);
    setMoves(0);
    setScore(0);
    setGameOver(false);
    setWon(false);
    setGameId(null);

    try {
      const signer = await getSigner();
      const addr = await signer.getAddress();
      setGameSigner(signer);
      setPlayerAddress(addr);

      const newGameId = await createGameOnChain(signer, newBoard);
      setGameId(newGameId);

      setToast({ message: `New onchain game started (#${newGameId})` });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error("❌ Error creating onchain game:", err);
      setToast({ message: "Failed to create onchain game" });
      setTimeout(() => setToast(null), 3000);
    }
  };


  // 🧠 localStorage safe-access helper
  const getLocalLeaderboard = () => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("leaderboard") || "[]");
    } catch {
      return [];
    }
  };

  const setLocalLeaderboard = (data: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("leaderboard", JSON.stringify(data));
  };

  // --- UI ---
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-50 flex flex-col">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pt-6 pb-4 px-6">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => (window.location.href = "/")}
            className="text-white hover:opacity-80 transition-opacity"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold">2048</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="text-white hover:opacity-80 transition-opacity"
          >
            ⚙️
          </button>
        </div>

        <div className="flex gap-2 justify-center text-xs bg-blue-700 bg-opacity-50 rounded-lg p-2">
          {/* Wallet Address */}
          <span className="bg-white text-black px-2 py-1 rounded shadow-sm">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>

          {/* Base Mainnet Balance */}
          <span className="bg-white text-black px-2 py-1 rounded shadow-sm">
            {balance.toFixed(6)} ETH
          </span>
        </div>

      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <p className="text-sm text-blue-600">Score</p>
          <motion.p
            className="text-4xl font-bold text-blue-600"
            key={score}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {score}
          </motion.p>
        </motion.div>

        <Grid board={board} onMove={submitMove} isDisabled={gameOver || won} />

        <div className="flex gap-4 w-full max-w-xs">
          <motion.button
            onClick={handleNewGame}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            New Game
          </motion.button>
          <motion.button
            onClick={() => setShowSettings(true)}
            className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-4 rounded-xl transition-colors border-2 border-blue-600"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ⚙️
          </motion.button>
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-xs mx-auto"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <h2 className="text-3xl font-bold text-red-600 mb-2">Game Over!</h2>
                <p className="text-gray-700 mb-4">Final Score: {score}</p>

                <motion.button
                  onClick={handleNewGame}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Play Again
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Toast message={toast.message} txHash={toast.txHash} />
          </motion.div>
        )}
      </AnimatePresence>

      {lowBalance && (
        <LowBalanceModal onTopUp={() => refetch()} onCancel={() => setLowBalance(false)} />
      )}

      {won && (
        <WinModal
          score={score}
          onSaveScore={() => {
            const leaderboard = getLocalLeaderboard();
            leaderboard.push({
              name: address?.slice(0, 6) + "...",
              score,
              date: new Date().toLocaleDateString(),
            });
            leaderboard.sort((a: any, b: any) => b.score - a.score);
            setLocalLeaderboard(leaderboard.slice(0, 10));
            setWon(false);
            handleNewGame();
          }}
          onPlayAgain={() => {
            setWon(false);
            handleNewGame();
          }}
        />
      )}

      {showSettings && (
        <SettingsModal
          address={address}
          balance={balance}
          onClose={() => setShowSettings(false)}
          onLogout={() => disconnect()}
        />
      )}
    </div>
  );
}
