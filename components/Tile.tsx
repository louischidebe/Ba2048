"use client"

import { motion } from "framer-motion"

interface TileProps {
  value: number
  position?: { row: number; col: number }
}

const getTileClass = (value: number): string => {
  const tileClasses: { [key: number]: string } = {
    0: "bg-gray-100",
    2: "tile-2",
    4: "tile-4",
    8: "tile-8",
    16: "tile-16",
    32: "tile-32",
    64: "tile-64",
    128: "tile-128",
    256: "tile-256",
    512: "tile-512",
    1024: "tile-1024",
    2048: "tile-2048",
  }
  return tileClasses[value] || "tile-2048"
}

const getTileTextColor = (value: number): string => {
  return value > 4 ? "text-white" : "text-base-text"
}

export default function Tile({ value, position }: TileProps) {
  return (
    <motion.div
      className={`${getTileClass(value)} ${getTileTextColor(value)} rounded-xl flex items-center justify-center font-bold text-2xl font-sans`}
      initial={value > 0 ? { scale: 0.7, opacity: 0 } : { scale: 1, opacity: 0 }}
      animate={value > 0 ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 20,
        duration: 0.15,
      }}
      layout
    >
      {value > 0 && value}
    </motion.div>
  )
}
