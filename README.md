# 2048 on Base

A Farcaster miniapp-style 2048 game with Base blockchain integration placeholders.

## Features

- **Classic 2048 Gameplay**: Full implementation of the 2048 game mechanics
- **Mobile-First Design**: Optimized for mobile portrait layout (1080×2400)
- **Wallet Integration**: Smart wallet connection and balance tracking
- **Move Costs**: Simulated on-chain transaction costs per move
- **Leaderboard**: Local leaderboard with top scores
- **Placeholder Hooks**: Clear TODO comments for Base blockchain integration

## Getting Started

### Installation

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### Running Locally

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Blockchain Integration TODOs

The following functions need to be connected to Base blockchain:

1. **`connectWallet()`** - Connect to user's smart wallet (e.g., Coinbase Smart Wallet)
   - Location: `pages/Home.tsx`
   - Should return wallet address and initial balance

2. **`simulateOnChainMove(direction)`** - Submit move transaction to Base
   - Location: `pages/Game.tsx`
   - Should sign and submit transaction, return tx hash
   - Deduct move cost from balance

3. **`signTopUpTransfer()`** - Open external wallet to top up balance
   - Location: `components/SettingsModal.tsx`
   - Should redirect to wallet provider or open modal

4. **`getSmartWalletBalance()`** - Fetch current wallet balance
   - Location: `pages/Home.tsx`, `pages/Game.tsx`
   - Should query Base blockchain for ETH balance

## Game Constants

\`\`\`typescript
const MOVE_COST = 0.00003; // Base gas per move
const DEV_FEE = 0.2; // 20% developer fee
const TOTAL_MOVE_COST = MOVE_COST * (1 + DEV_FEE); // ~0.000036 ETH per move
\`\`\`

## Project Structure

\`\`\`
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── pages/
│   ├── Home.tsx
│   ├── Game.tsx
│   └── Leaderboard.tsx
├── components/
│   ├── Grid.tsx
│   ├── Tile.tsx
│   ├── WalletBubble.tsx
│   ├── Toast.tsx
│   ├── LowBalanceModal.tsx
│   ├── WinModal.tsx
│   └── SettingsModal.tsx
└── lib/
    └── game-logic.ts
\`\`\`

## Design

- **Primary Color**: Deep Blue (#1e3a8a)
- **Accent Color**: Coral/Orange (#ff6b35)
- **Background**: Sandy Beige (#e8dcc8)
- **Animations**: Smooth tile movements, scale-in effects, fade-out toasts

## License

MIT
