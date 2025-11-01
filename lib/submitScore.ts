// /lib/submitScore.ts
import { Contract, keccak256, toUtf8Bytes, JsonRpcProvider, FetchRequest } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const ABI = [
  "function createGame(bytes32 initialBoardHash) external returns (uint256)",
  "function submitScore(uint256 gameId, bytes32 finalBoardHash, uint32 finalScore) external",
  "event GameCreated(uint256 indexed gameId, address indexed player, bytes32 boardHash)",
  "event ScoreSubmitted(uint256 indexed gameId, address indexed player, bytes32 finalBoardHash, uint32 finalScore)"
];

// ✅ Base mainnet RPC
const BASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC!;
// -------------------------------
// CREATE GAME ONCHAIN
// -------------------------------
export async function createGameOnChain(signer: any, board: number[][]): Promise<number> {
  const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  const boardHash = keccak256(toUtf8Bytes(JSON.stringify(board)));
  const tx = await contract.createGame(boardHash);
  const receipt = await tx.wait();

  const ev = receipt.logs
    .map((l: any) => {
      try {
        return contract.interface.parseLog(l);
      } catch {
        return null;
      }
    })
    .find((p: any) => p && p.name === "GameCreated");

  if (!ev) throw new Error("GameCreated event not found");
  return Number(ev.args.gameId);
}

// -------------------------------
// SUBMIT FINAL SCORE
// -------------------------------
export async function submitFinalScoreOnChain(
  signer: any,
  gameId: number,
  board: number[][],
  finalScore: number
): Promise<string> {
  const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  const finalBoardHash = keccak256(toUtf8Bytes(JSON.stringify(board)));

  const tx = await contract.submitScore(gameId, finalBoardHash, finalScore);
  const receipt = await tx.wait();
  return receipt.transactionHash || receipt.hash || "";
}

// -------------------------------
// FETCH ONCHAIN LEADERBOARD
// -------------------------------
// -------------------------------
// FETCH ONCHAIN LEADERBOARD (chunked)
// -------------------------------
export async function fetchLeaderboard() {
  try {
    const res = await fetch("/api/leaderboard");
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return await res.json();
  } catch (err) {
    console.error("fetchLeaderboard error:", err);
    return [];
  }
}



// -------------------------------
// (No longer used, kept for safety)
// -------------------------------
export async function postScoreToLeaderboard() {
  // No-op: on-chain leaderboard now
  return;
}
