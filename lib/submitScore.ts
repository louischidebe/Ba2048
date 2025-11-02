// /lib/submitScore.ts
import { Contract, keccak256, toUtf8Bytes, Signer, type LogDescription, type Result, type BigNumberish } from "ethers";

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const ABI = [
  "function createGame(bytes32 initialBoardHash) external returns (uint256)",
  "function submitScore(uint256 gameId, bytes32 finalBoardHash, uint32 finalScore) external",
  "event GameCreated(uint256 indexed gameId, address indexed player, bytes32 boardHash)",
  "event ScoreSubmitted(uint256 indexed gameId, address indexed player, bytes32 finalBoardHash, uint32 finalScore)"
];

// -------------------------------
// Types
// -------------------------------
export type LeaderboardEntry = {
  name: string;
  score: number;
  date: string;
};

type GameCreatedEventArgs = {
  gameId: BigNumberish;
  player: string;
  boardHash: string;
};

// -------------------------------
// CREATE GAME ONCHAIN
// -------------------------------
export async function createGameOnChain(signer: Signer, board: number[][]): Promise<number> {
  const contract = new Contract(CONTRACT_ADDRESS, ABI, signer);
  const boardHash = keccak256(toUtf8Bytes(JSON.stringify(board)));

  const tx = await contract.createGame(boardHash);
  const receipt = await tx.wait();

  const ev = receipt.logs
    .map((log: any) => {
      try {
        return contract.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed: LogDescription | null): parsed is LogDescription => parsed?.name === "GameCreated");

  if (!ev) throw new Error("GameCreated event not found");

  const gameId = ev.args["gameId"];
  return Number(gameId);
}


// -------------------------------
// SUBMIT FINAL SCORE
// -------------------------------
export async function submitFinalScoreOnChain(
  signer: Signer,
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
export async function fetchLeaderboard(): Promise<LeaderboardEntry[]> {
  try {
    const res = await fetch("/api/leaderboard");
    if (!res.ok) throw new Error("Failed to fetch leaderboard");
    return (await res.json()) as LeaderboardEntry[];
  } catch (err) {
    console.error("fetchLeaderboard error:", err);
    return [];
  }
}
