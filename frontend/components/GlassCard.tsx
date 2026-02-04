'use client'

import { ReactNode } from 'react'
import { motion } from 'framer-motion'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function GlassCard({ children, className = '', hover = true }: GlassCardProps) {
  return (
    <motion.div
      className={`glass-emerald rounded-2xl shadow-3d-emerald perspective-3d transform-3d ${hover ? 'card-3d' : ''} ${className}`}
      whileHover={hover ? { 
        scale: 1.02,
        rotateY: 5,
        rotateX: 2,
        z: 20,
        transition: { duration: 0.3 }
      } : {}}
    >
      {children}
    </motion.div>
  )
}
