"use client"

import type React from "react"
import { useState } from "react"
import Tile from "./Tile"

interface GridProps {
  board: number[][]
  onMove: (direction: "up" | "down" | "left" | "right") => void
  isDisabled: boolean
}

export default function Grid({ board, onMove, isDisabled }: GridProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY })
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return

    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }
    const dx = touchEnd.x - touchStart.x
    const dy = touchEnd.y - touchStart.y

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 50) onMove("right")
      else if (dx < -50) onMove("left")
    } else {
      if (dy > 50) onMove("down")
      else if (dy < -50) onMove("up")
    }

    setTouchStart(null)
  }

  return (
    <div
      className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-4 shadow-2xl relative overflow-hidden mx-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Subtle shimmer overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-shimmer pointer-events-none" />

      {/* Responsive grid */}
      <div
        className="
          relative z-10 grid grid-cols-4 grid-rows-4 gap-1.5
          w-[85vw] max-w-[18rem] aspect-square
          sm:w-[70vw] sm:max-w-[20rem]
          md:w-[60vw] md:max-w-[22rem]
          mx-auto
          transition-all duration-200
        "
      >
        {board.map((row, rowIdx) =>
          row.map((value, colIdx) => (
            <Tile key={`${rowIdx}-${colIdx}`} value={value} position={{ row: rowIdx, col: colIdx }} />
          )),
        )}
      </div>

      <p className="text-xs text-base-text-light text-center mt-3 opacity-75 relative z-10">
        Swipe or use arrow keys to move
      </p>
    </div>
  )
}
