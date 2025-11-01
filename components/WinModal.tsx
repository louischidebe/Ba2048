"use client"

interface WinModalProps {
  score: number
  onSaveScore: () => void
  onPlayAgain: () => void
}

export default function WinModal({ score, onSaveScore, onPlayAgain }: WinModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-surface rounded-2xl p-8 max-w-sm w-full shadow-xl animate-scale-in text-center">
        <h2 className="text-4xl font-bold text-accent mb-2">🎉</h2>
        <h2 className="text-3xl font-bold text-primary mb-2">You reached 2048!</h2>
        <p className="text-2xl font-bold text-accent mb-6">{score} points</p>
        <div className="flex gap-3">
          <button
            onClick={onPlayAgain}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-text font-bold py-3 rounded-lg transition-colors"
          >
            Play Again
          </button>
          <button
            onClick={onSaveScore}
            className="flex-1 bg-accent hover:bg-orange-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Save to Leaderboard
          </button>
        </div>
      </div>
    </div>
  )
}
