"use client"

import { motion } from "framer-motion"

interface ToastProps {
  message: string
  txHash?: string
}

export default function Toast({ message, txHash }: ToastProps) {
  return (
    <motion.div
      className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-auto bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: "spring", stiffness: 200 }}
    >
      <p className="font-semibold">{message}</p>
      {txHash && <p className="text-xs opacity-90">tx {txHash}</p>}
    </motion.div>
  )
}
