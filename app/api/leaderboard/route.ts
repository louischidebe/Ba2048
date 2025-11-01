import { NextRequest, NextResponse } from "next/server";
import { JsonRpcProvider, Interface } from "ethers";
import fs from "fs";
import path from "path";

const CACHE_DIR = process.platform === "win32" ? "C:\\tmp" : "/tmp";
const CACHE_FILE = path.join(CACHE_DIR, "leaderboard.json");

// 🧩 Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;
const ABI = [
  "event ScoreSubmitted(uint256 indexed gameId, address indexed player, bytes32 finalBoardHash, uint32 finalScore)"
];

const BASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC!;
const DEPLOY_BLOCK = 37603623;
const BLOCK_STEP = 20000;
const CACHE_TTL = 60_000 * 5; // 5 minutes

// Helper to read cache from file
function readCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const { timestamp, data } = JSON.parse(fs.readFileSync(CACHE_FILE, "utf8"));
      if (Date.now() - timestamp < CACHE_TTL) return data;
    }
  } catch (err) {
    console.warn("⚠️ Failed to read cache:", err);
  }
  return null;
}

// Helper to write cache
function writeCache(data: any) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ timestamp: Date.now(), data }));
  } catch (err) {
    console.warn("⚠️ Failed to write cache:", err);
  }
}

export async function GET(req: NextRequest) {
  try {
    // ✅ Step 1: Try returning cached data
    const cached = readCache();
    if (cached) {
      return NextResponse.json(cached);
    }

    // ✅ Step 2: Otherwise fetch fresh from chain
    const provider = new JsonRpcProvider(BASE_RPC);
    const iface = new Interface(ABI);
    const eventTopic = iface.getEvent("ScoreSubmitted").topicHash;
    const latestBlock = await provider.getBlockNumber();

    const allEvents: any[] = [];

    for (let from = DEPLOY_BLOCK; from <= latestBlock; from += BLOCK_STEP) {
      const to = Math.min(from + BLOCK_STEP - 1, latestBlock);
      try {
        const logs = await provider.getLogs({
          address: CONTRACT_ADDRESS,
          fromBlock: from,
          toBlock: to,
          topics: [eventTopic],
        });
        const parsed = logs.map((log) => iface.parseLog(log));
        allEvents.push(...parsed);
        await new Promise((res) => setTimeout(res, 150));
      } catch (err) {
        console.warn(`⚠️ Failed ${from}-${to}:`, (err as Error).message);
      }
    }

    // ✅ Step 3: Build leaderboard
    const leaderboardMap = new Map<string, number>();
    for (const ev of allEvents) {
      const player = ev.args.player.toLowerCase();
      const score = Number(ev.args.finalScore);
      const prev = leaderboardMap.get(player) || 0;
      if (score > prev) leaderboardMap.set(player, score);
    }

    const leaderboard = Array.from(leaderboardMap.entries())
      .map(([player, score]) => ({ player, score }))
      .sort((a, b) => b.score - a.score);

    // ✅ Step 4: Cache it to disk
    writeCache(leaderboard);

    return NextResponse.json(leaderboard);
  } catch (err) {
    console.error("❌ Error fetching leaderboard:", err);
    return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 });
  }
}
