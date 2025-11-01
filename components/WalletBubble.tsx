"use client"

interface WalletBubbleProps {
  address: string | null
  balance: number
  onClick: () => void
}

export default function WalletBubble({ address, balance, onClick }: WalletBubbleProps) {
  if (!address) return null

  return (
    <button
      onClick={onClick}
      className="bg-accent hover:bg-orange-600 text-black font-bold py-2 px-4 rounded-full text-sm transition-colors shadow-lg"
    >
      {address.slice(0, 6)}... {balance.toFixed(4)} ETH
    </button>
  )
}
