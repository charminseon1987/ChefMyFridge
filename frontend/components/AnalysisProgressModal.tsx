'use client'

import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface AnalysisProgressModalProps {
  isOpen: boolean
  progress: number
  progressStage: string
}

export default function AnalysisProgressModal({ isOpen, progress, progressStage }: AnalysisProgressModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center"
      >
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-slate-200 rounded-full"></div>
          <div 
            className="absolute inset-0 w-24 h-24 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"
          ></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-emerald-600">{progress}%</span>
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-slate-800 mb-2 text-center">
          AI가 냉장고를 분석하고 있습니다
        </h3>
        <p className="text-slate-600 text-lg mb-8 animate-pulse text-center">
          {progressStage}...
        </p>
        
        {/* 프로그레스 바 */}
        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-4 overflow-hidden">
          <motion.div 
            className="bg-emerald-500 h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          ></motion.div>
        </div>
        <p className="text-sm text-slate-500 text-center">
          잠시만 기다려주세요. 미슐랭 셰프들이 논의 중입니다.
        </p>
      </motion.div>
    </div>
  )
}
