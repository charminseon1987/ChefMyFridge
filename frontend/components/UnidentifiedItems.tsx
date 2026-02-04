'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, Plus, X, Check } from 'lucide-react'
import axios from 'axios'

interface UnidentifiedItemsProps {
  unidentifiedItems: any[]
  onItemsConfirmed: (confirmedItems: any[]) => void
}

export default function UnidentifiedItems({
  unidentifiedItems,
  onItemsConfirmed,
}: UnidentifiedItemsProps) {
  const [items, setItems] = useState<any[]>(
    unidentifiedItems.map((item) => ({
      ...item,
      confirmed: false,
      name: item.name || '',
    }))
  )
  const [newItemName, setNewItemName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleConfirmItem = (index: number) => {
    const updatedItems = [...items]
    updatedItems[index].confirmed = !updatedItems[index].confirmed
    setItems(updatedItems)
  }

  const handleAddNewItem = () => {
    if (newItemName.trim()) {
      setItems([
        ...items,
        {
          name: newItemName.trim(),
          category: '기타',
          quantity: 1,
          unit: '개',
          freshness: '좋음',
          confidence: 1.0,
          confirmed: true,
        },
      ])
      setNewItemName('')
    }
  }

  const handleSubmit = async () => {
    const confirmedItems = items.filter((item) => item.confirmed)
    
    if (confirmedItems.length === 0) {
      alert('최소 1개 이상의 재료를 확인해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      // API 호출
      await axios.post(
        'http://localhost:8000/api/v1/confirm-items',
        {
          confirmed_items: confirmedItems.map((item) => ({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            freshness: item.freshness,
          })),
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      // 부모 컴포넌트에 확인된 재료 전달
      onItemsConfirmed(confirmedItems)
      
      // 확인된 항목 제거
      setItems(items.filter((item) => !item.confirmed))
    } catch (error: any) {
      console.error('재료 확인 오류:', error)
      alert('재료 확인 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (items.length === 0 && unidentifiedItems.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-6 border border-yellow-300/50 shadow-3d transform-3d"
    >
      <div className="flex items-center space-x-3 mb-4">
        <AlertCircle className="w-6 h-6 text-yellow-600" />
        <h2 className="text-2xl font-bold text-slate-800">
          파악되지 않은 재료
        </h2>
        <span className="text-slate-600">({items.length}개)</span>
      </div>

      <p className="text-slate-700 mb-4">
        다음 재료들이 명확하게 인식되지 않았습니다. 확인하거나 추가해주세요.
      </p>

      {/* 미확인 재료 목록 */}
      <div className="space-y-3 mb-4">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`glass rounded-lg p-4 border transition-all ${
              item.confirmed
                ? 'border-green-300/50 bg-green-50/30'
                : 'border-slate-200/30 hover:border-slate-300'
            } shadow-3d transform-3d`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const updatedItems = [...items]
                      updatedItems[index].name = e.target.value
                      setItems(updatedItems)
                    }}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800 font-medium"
                    placeholder="재료 이름을 입력하세요"
                  />
                  <button
                    onClick={() => handleConfirmItem(index)}
                    className={`p-2 rounded-lg transition-all ${
                      item.confirmed
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                    } shadow-3d transform-3d hover:scale-110`}
                  >
                    {item.confirmed ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Plus className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <div className="text-sm text-slate-600 space-x-4">
                  <span>카테고리: {item.category || '미지정'}</span>
                  <span>수량: {item.quantity} {item.unit}</span>
                  {item.confidence && (
                    <span>신뢰도: {(item.confidence * 100).toFixed(0)}%</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 새 재료 추가 */}
      <div className="mb-4">
        <div className="flex items-center space-x-2 mb-2">
          <Plus className="w-5 h-5 text-slate-600" />
          <h3 className="font-semibold text-slate-800">재료 추가</h3>
        </div>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleAddNewItem()
              }
            }}
            placeholder="재료 이름을 입력하고 추가 버튼을 클릭하세요"
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400 text-slate-800"
          />
          <button
            onClick={handleAddNewItem}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-lg transition-all shadow-3d transform-3d hover:scale-105"
          >
            추가
          </button>
        </div>
      </div>

      {/* 확인 버튼 */}
      {items.some((item) => item.confirmed) && (
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-lg transition-all shadow-3d-emerald transform-3d hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>확인 중...</span>
            </>
          ) : (
            <>
              <Check className="w-5 h-5" />
              <span>
                {items.filter((item) => item.confirmed).length}개 재료 확인
              </span>
            </>
          )}
        </motion.button>
      )}
    </motion.div>
  )
}
