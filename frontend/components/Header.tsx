'use client'

import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import { Refrigerator, Sparkles } from 'lucide-react'
import { useState } from 'react'

export default function Header() {
  const { scrollY } = useScroll()
  const [isScrolled, setIsScrolled] = useState(false)

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 10)
  })

  return (
    <header className={`sticky top-0 z-50 w-full py-4 px-4 transition-all duration-300 ${
      isScrolled 
        ? 'bg-white/80 backdrop-blur-md border-b border-slate-200/50 shadow-sm' 
        : 'glass-emerald border-b border-slate-200/50 shadow-3d-emerald'
    }`}>
      <div className="container mx-auto flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-3"
        >
          <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl shadow-3d-emerald transform-3d hover:scale-110 transition-transform">
            <Refrigerator className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">FridgeAI</h2>
            <p className="text-xs text-slate-500">Smart Fridge Management</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center space-x-2 text-sm text-slate-700 glass-emerald px-4 py-2 rounded-full shadow-3d-emerald transform-3d hover:scale-105 transition-transform"
        >
          <Sparkles className="w-4 h-4 text-slate-600" />
          <span className="font-medium">AI Powered</span>
        </motion.div>
      </div>
    </header>
  )
}
