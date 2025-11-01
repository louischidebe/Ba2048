"use client"

interface LowBalanceModalProps {
  onTopUp: () => void
  onCancel: () => void
}

export default function LowBalanceModal({ onTopUp, onCancel }: LowBalanceModalProps) {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-surface rounded-2xl p-8 max-w-sm w-full shadow-xl animate-scale-in">
        <h2 className="text-2xl font-bold text-primary mb-4">Low Balance</h2>
        <p className="text-text mb-6">
          Not enough Base ETH to continue.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-text font-bold py-3 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onTopUp}
            className="flex-1 bg-orange-600 hover:bg-white hover:text-orange-600 border border-orange-600 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Sign Transfer
          </button>
        </div>
      </div>
    </div>
  )
}
