"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Grid from "@/components/Grid";
import Toast from "@/components/Toast";
import WinModal from "@/components/WinModal";
import SettingsModal from "@/components/SettingsModal";
import { initializeBoard, move, canMove } from "@/lib/game-logic";
import { useAccount, useDisconnect, useBalance } from "wagmi";
import { createGameOnChain, submitFinalScoreOnChain } from "@/lib/submitScore";
import { ethers } from "ethers";
import { useRouter } from "next/navigation";
import { sdk } from "@farcaster/miniapp-sdk";

type LeaderboardEntry = {
  name: string;
  score: number;
  date: string;
};


const MOVE_COST = 0.00003;
const DEV_FEE = 0.2;
const TOTAL_MOVE_COST = MOVE_COST * (1 + DEV_FEE);

export default function Game() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balanceData, refetch } = useBalance({ address, chainId: 8453 });

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [gameSigner, setGameSigner] = useState<ethers.Signer | null>(null);
  const [board, setBoard] = useState(initializeBoard());
  const [moves, setMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [toast, setToast] = useState<{ message: string; txHash?: string } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [gameId, setGameId] = useState<number | null>(null);
  const [isFarcaster, setIsFarcaster] = useState(false);

  const balance = parseFloat(balanceData?.formatted || "0");

  // -----------------------------
  // Detect Farcaster
  // -----------------------------
  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).farcaster) {
      setIsFarcaster(true);
    }
  }, []);

  // -----------------------------
  // Unified signer function
  // -----------------------------
  const getSigner = useCallback(async () => {
    if (isFarcaster) {
      try {
        const accounts = await sdk.wallet.ethProvider.request?.({ method: "eth_requestAccounts" }) || [];
        const addr = accounts[0];
        if (!addr) throw new Error("No Farcaster account returned");

        const provider = new ethers.BrowserProvider(sdk.wallet.ethProvider);
        const signer = await provider.getSigner();

        setWalletAddress(addr);
        setGameSigner(signer);
        return signer;
      } catch (err) {
        console.error("Failed to get Farcaster signer:", err);
        throw err;
      }
    }

    if (!window.ethereum) throw new Error("No wallet provider found");
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const addr = await signer.getAddress();

    setWalletAddress(addr);
    setGameSigner(signer);
    return signer;
  }, [isFarcaster]);

  // -----------------------------
  // Refresh balance every 10s
  // -----------------------------
  useEffect(() => {
    const interval = setInterval(() => refetch(), 10000);
    return () => clearInterval(interval);
  }, [refetch]);

  // -----------------------------
  // Submit moves
  // -----------------------------
  const submitMove = useCallback(
    async (direction: "up" | "down" | "left" | "right") => {
      if (gameOver || won) return;

      const result = move(board, direction);
      if (!result.moved) return;

      const newScore = score + result.scoreDelta;
      setBoard(result.board);
      setScore(newScore);
      setMoves((m) => m + 1);

      const isWin = result.board.flat().includes(2048);
      const isGameOver = !canMove(result.board);

      if (isWin && !won) {
        setWon(true);
        setToast({ message: "🎉 You reached 2048! Keep going!" });
        setTimeout(() => setToast(null), 3000);
      }

      if (isGameOver) {
        setGameOver(true);

        try {
          const signerToUse = gameSigner || (await getSigner());
          const signerAddress = await signerToUse.getAddress();

          if (walletAddress && signerAddress.toLowerCase() !== walletAddress.toLowerCase()) {
            setToast({
              message: "You must submit the score from the same wallet that started the game.",
            });
            setTimeout(() => setToast(null), 4000);
            return;
          }

          let finalGameId = gameId;
          if (finalGameId == null) {
            finalGameId = await createGameOnChain(signerToUse, board);
            setGameId(finalGameId);
          }

          const txHash = await submitFinalScoreOnChain(signerToUse, finalGameId, result.board, newScore);
          setToast({ message: "Final score submitted onchain!", txHash: `${txHash.slice(0,6)}...${txHash.slice(-4)}` });
          setTimeout(() => setToast(null), 4000);
        } catch (err) {
          console.error("Final submission failed:", err);
          setToast({ message: "Error submitting final score." });
          setTimeout(() => setToast(null), 4000);
        }
      }
    },
    [board, score, gameOver, won, gameId, walletAddress, gameSigner, getSigner]
  );

  // -----------------------------
  // Keyboard listener
  // -----------------------------
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

  // -----------------------------
  // New game
  // -----------------------------
  const handleNewGame = async () => {
    if (isCreatingGame) return;
    setIsCreatingGame(true);

    try {
      const signer = await getSigner();
      const addr = await signer.getAddress();
      setWalletAddress(addr);
      setGameSigner(signer);

      const newBoard = initializeBoard();
      const newGameId = await createGameOnChain(signer, newBoard);

      setBoard(newBoard);
      setMoves(0);
      setScore(0);
      setGameOver(false);
      setWon(false);
      setGameId(newGameId);

      setToast({ message: `New onchain game started (#${newGameId})` });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      if (err.code !== 4001) {
        console.error("Error creating game:", err);
        setToast({ message: "Failed to create onchain game" });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setIsCreatingGame(false);
    }
  };

  // -----------------------------
  // Redirect if not connected
  // -----------------------------
  useEffect(() => {
    if (!isConnected) router.push("/");
  }, [isConnected, router]);

  // -----------------------------
  // Local leaderboard helpers
  // -----------------------------
  const getLocalLeaderboard = () => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("leaderboard") || "[]"); } 
    catch { return []; }
  };
  const setLocalLeaderboard = (data: any) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("leaderboard", JSON.stringify(data));
  };

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-50 flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pt-6 pb-4 px-6">
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => router.push("/")} className="text-white hover:opacity-80 transition-opacity">
            ← Back
          </button>
          <h1 className="text-3xl font-bold">2048</h1>
          <button onClick={() => setShowSettings(true)} className="text-white hover:opacity-80 transition-opacity">⚙️</button>
        </div>
        <div className="flex gap-2 justify-center text-xs bg-blue-700 bg-opacity-50 rounded-lg p-2">
          <span className="bg-white text-black px-2 py-1 rounded shadow-sm">
            {walletAddress?.slice(0,6)}...{walletAddress?.slice(-4)}
          </span>
          <span className="bg-white text-black px-2 py-1 rounded shadow-sm">
            {balance.toFixed(6)} ETH
          </span>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-6">
        <motion.div className="text-center" initial={{ opacity:0 }} animate={{ opacity:1 }}>
          <p className="text-sm text-blue-600">Score</p>
          <motion.p key={score} className="text-4xl font-bold text-blue-600" initial={{ scale:0.8 }} animate={{ scale:1 }} transition={{ type:"spring", stiffness:200 }}>
            {score}
          </motion.p>
        </motion.div>

        <Grid board={board} onMove={submitMove} isDisabled={gameOver || won} />

        <div className="flex gap-4 w-full max-w-xs">
          <motion.button onClick={handleNewGame} disabled={isCreatingGame} className={`flex-1 font-bold py-3 rounded-xl transition-colors ${isCreatingGame ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`} whileHover={!isCreatingGame ? { scale:1.05 } : {}} whileTap={!isCreatingGame ? { scale:0.95 } : {}}>
            {isCreatingGame ? "Waiting for confirmation..." : "New Game"}
          </motion.button>

          <motion.button onClick={() => setShowSettings(true)} className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-4 rounded-xl transition-colors border-2 border-blue-600" whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>
            ⚙️
          </motion.button>
        </div>

        <AnimatePresence>
          {gameOver && (
            <motion.div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <motion.div className="bg-white rounded-2xl p-8 text-center shadow-lg max-w-xs mx-auto" initial={{ scale:0.8, opacity:0 }} animate={{ scale:1, opacity:1 }}>
                <h2 className="text-3xl font-bold text-red-600 mb-2">Game Over!</h2>
                <p className="text-gray-700 mb-4">Final Score: {score}</p>
                <motion.button onClick={handleNewGame} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-colors" whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}>Play Again</motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {toast && <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:20 }}><Toast message={toast.message} txHash={toast.txHash} /></motion.div>}
      </AnimatePresence>

      {won && <WinModal 
        score={score} 
        onSaveScore={() => {
          const leaderboard: LeaderboardEntry[] = getLocalLeaderboard();
          leaderboard.push({ 
            name: walletAddress?.slice(0,6)+"...", 
            score, 
            date: new Date().toLocaleDateString() 
          });
          leaderboard.sort((a, b) => b.score - a.score);
          setLocalLeaderboard(leaderboard.slice(0,10));

          setWon(false);
          handleNewGame();
        }} 
        onPlayAgain={() => { setWon(false); handleNewGame(); }} 
      />}

      {showSettings && <SettingsModal address={walletAddress} balance={balance} onClose={() => setShowSettings(false)} onLogout={() => disconnect()} />}
    </div>
  );
}
