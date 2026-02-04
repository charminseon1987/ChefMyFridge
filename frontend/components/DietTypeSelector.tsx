'use client'

import { motion } from 'framer-motion'
import { TrendingDown, Heart, Stethoscope } from 'lucide-react'

type DietType = 'diet' | 'health' | 'patient' | null

interface DietTypeSelectorProps {
  selectedType: DietType
  onSelect: (type: DietType) => void
  detectedItems: any[]
}

export default function DietTypeSelector({
  selectedType,
  onSelect,
  detectedItems,
}: DietTypeSelectorProps) {
  const dietTypes = [
    {
      id: 'diet' as const,
      name: '다이어트식',
      description: '칼로리 조절 및 체중 관리',
      icon: TrendingDown,
      color: 'from-emerald-500 to-teal-500',
      bgColor: 'bg-emerald-50 border-emerald-200',
      textColor: 'text-emerald-700',
    },
    {
      id: 'health' as const,
      name: '건강식',
      description: '영양 균형과 건강 증진',
      icon: Heart,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
    },
    {
      id: 'patient' as const,
      name: '환자식',
      description: '질환별 맞춤 식단',
      icon: Stethoscope,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
    },
  ]

  return (
    <div className="glass-emerald rounded-2xl p-6 shadow-3d-emerald mb-6">
      <div className="mb-4">
        <h3 className="text-xl font-bold text-slate-800 mb-2">
          식단 타입 선택
        </h3>
        <p className="text-sm text-slate-600">
          감지된 식재료를 기반으로 원하는 식단 타입을 선택하세요
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dietTypes.map((type, index) => {
          const Icon = type.icon
          const isSelected = selectedType === type.id

          return (
            <motion.button
              key={type.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(isSelected ? null : type.id)}
              className={`relative p-5 rounded-xl border-2 transition-all transform-3d ${
                isSelected
                  ? `${type.bgColor} border-${type.textColor.split('-')[1]}-400 shadow-lg scale-105`
                  : 'bg-white/50 border-slate-200 hover:border-slate-300 hover:scale-102'
              }`}
            >
              <div className="flex flex-col items-center text-center space-y-3">
                <div
                  className={`p-3 rounded-lg bg-gradient-to-r ${type.color} shadow-md ${
                    isSelected ? 'scale-110' : ''
                  } transition-transform`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className={`font-bold text-lg ${isSelected ? type.textColor : 'text-slate-800'}`}>
                    {type.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">{type.description}</p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
                  >
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
