'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronRight, ChevronLeft, Check, 
  Calendar, ShoppingBag, ChefHat, FileText,
  Loader2, RefreshCw, MessageCircle, Sparkles, Play,
  Trash2, Pencil, CheckCircle, XCircle
} from 'lucide-react'
import axios from 'axios'
import ReactMarkdown from 'react-markdown'

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  data: any
  imageData: string | null // base64 or url
}

export default function AnalysisModal({ isOpen, onClose, data, imageData }: AnalysisModalProps) {
  const [step, setStep] = useState(1)
  const [items, setItems] = useState<any[]>([])
  const [recipes, setRecipes] = useState<any[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null)
  const [report, setReport] = useState<string | null>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)

  // AI Recommend States
  const [userAnswer, setUserAnswer] = useState('')
  const [aiRecipes, setAiRecipes] = useState<any[]>([])
  const [aiYoutubeVideos, setAiYoutubeVideos] = useState<Record<string, any[]>>({})
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [selectedDietType, setSelectedDietType] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Manual Annotation State
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null)
  const [currentBox, setCurrentBox] = useState<number[] | null>(null) // [ymin, xmin, ymax, xmax] 0-1000 scale
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', purchaseDate: '', expiryDate: '' })

  const [draggingItemIdx, setDraggingItemIdx] = useState<number | null>(null)
  const [dragStartPos, setDragStartPos] = useState<{x: number, y: number} | null>(null)
  const [originalBbox, setOriginalBbox] = useState<number[] | null>(null)
  const [resizingItemIdx, setResizingItemIdx] = useState<number | null>(null)
  const [resizeStartPos, setResizeStartPos] = useState<{x: number, y: number} | null>(null)
  const [resizeStartBbox, setResizeStartBbox] = useState<number[] | null>(null)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)
  const [editingName, setEditingName] = useState('')
  
  const imageContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (data && isOpen) {
      const detected = (data.detected_items || []).map((item: any) => ({ ...item, type: 'ai' }))
      console.log('🔍 AnalysisModal - 받은 전체 데이터:', data)
      console.log('🔍 AnalysisModal - detected_items 개수:', detected.length)
      detected.forEach((item: any, idx: number) => {
        console.log(`  항목 ${idx + 1}: ${item.name}`)
        console.log(`    - bbox_2d:`, item.bbox_2d)
        console.log(`    - type:`, item.type)
      })

      setItems(detected)
      setRecipes(data.recipe_suggestions || [])
      setUserAnswer('')
      setAiRecipes([])
      setAiYoutubeVideos({})
      setSelectedDietType('')
      setErrorMessage('')
      setStep(1)
      
      setDraggingItemIdx(null)
      setDragStartPos(null)
      setOriginalBbox(null)
      setResizingItemIdx(null)
      setResizeStartPos(null)
      setResizeStartBbox(null)
      setEditingIdx(null)
      setIsDrawing(false)
    }
  }, [data, isOpen])

  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (draggingItemIdx === null || !dragStartPos || !originalBbox || !imageContainerRef.current) return
      
      const rect = imageContainerRef.current.getBoundingClientRect()
      const currentX = (e.clientX - rect.left) / rect.width * 1000
      const currentY = (e.clientY - rect.top) / rect.height * 1000
      
      const dx = currentX - dragStartPos.x
      const dy = currentY - dragStartPos.y
      
      const boxHeight = originalBbox[2] - originalBbox[0]
      const boxWidth = originalBbox[3] - originalBbox[1]
      
      const newBbox = [
        Math.max(0, Math.min(1000 - boxHeight, originalBbox[0] + dy)),
        Math.max(0, Math.min(1000 - boxWidth, originalBbox[1] + dx)),
        Math.max(0, Math.min(1000, originalBbox[0] + boxHeight + dy)),
        Math.max(0, Math.min(1000, originalBbox[1] + boxWidth + dx)),
      ]
      
      setItems(prev => {
        const newItems = [...prev]
        newItems[draggingItemIdx] = { ...newItems[draggingItemIdx], bbox_2d: newBbox }
        return newItems
      })
    }

    const handleGlobalMouseUp = () => {
      if (draggingItemIdx !== null) {
        setDraggingItemIdx(null)
        setDragStartPos(null)
        setOriginalBbox(null)
      }
    }

    if (draggingItemIdx !== null) {
      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [draggingItemIdx, dragStartPos, originalBbox])

  useEffect(() => {
    const handleResizeMove = (e: MouseEvent) => {
      if (resizingItemIdx === null || !resizeStartPos || !resizeStartBbox || !imageContainerRef.current) return
      
      const rect = imageContainerRef.current.getBoundingClientRect()
      const currentX = (e.clientX - rect.left) / rect.width * 1000
      const currentY = (e.clientY - rect.top) / rect.height * 1000
      
      const dx = currentX - resizeStartPos.x
      const dy = currentY - resizeStartPos.y
      
      const newBbox = [
        resizeStartBbox[0],
        resizeStartBbox[1],
        Math.max(resizeStartBbox[0] + 30, Math.min(1000, resizeStartBbox[2] + dy)),
        Math.max(resizeStartBbox[1] + 30, Math.min(1000, resizeStartBbox[3] + dx)),
      ]
      
      setItems(prev => {
        const newItems = [...prev]
        newItems[resizingItemIdx] = { ...newItems[resizingItemIdx], bbox_2d: newBbox }
        return newItems
      })
    }

    const handleResizeUp = () => {
      if (resizingItemIdx !== null) {
        setResizingItemIdx(null)
        setResizeStartPos(null)
        setResizeStartBbox(null)
      }
    }

    if (resizingItemIdx !== null) {
      document.addEventListener('mousemove', handleResizeMove)
      document.addEventListener('mouseup', handleResizeUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleResizeMove)
      document.removeEventListener('mouseup', handleResizeUp)
    }
  }, [resizingItemIdx, resizeStartPos, resizeStartBbox])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      if (draggingItemIdx !== null) return
      
      // 이미지 컨테이너 기준 상대 좌표 계산
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width * 1000
      const y = (e.clientY - rect.top) / rect.height * 1000
      setStartPos({ x, y })
      setIsDrawing(true)
  }

  const handleItemMouseDown = (e: React.MouseEvent<HTMLDivElement>, idx: number, bbox: number[]) => {
      e.stopPropagation()
      e.preventDefault()
      
      if (!imageContainerRef.current) return
      const rect = imageContainerRef.current.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width * 1000
      const y = (e.clientY - rect.top) / rect.height * 1000
      
      setDragStartPos({ x, y })
      setDraggingItemIdx(idx)
      setOriginalBbox(bbox)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (draggingItemIdx !== null && dragStartPos && originalBbox) {
          const rect = e.currentTarget.getBoundingClientRect()
          const currentX = (e.clientX - rect.left) / rect.width * 1000
          const currentY = (e.clientY - rect.top) / rect.height * 1000
          
          const dx = currentX - dragStartPos.x
          const dy = currentY - dragStartPos.y
          
          const newBbox = [
              Math.max(0, Math.min(1000 - (originalBbox[2] - originalBbox[0]), originalBbox[0] + dy)),
              Math.max(0, Math.min(1000 - (originalBbox[3] - originalBbox[1]), originalBbox[1] + dx)),
              Math.max(0, Math.min(1000, originalBbox[2] + dy)),
              Math.max(0, Math.min(1000, originalBbox[3] + dx)),
          ]
          
          const newItems = [...items]
          newItems[draggingItemIdx] = { ...newItems[draggingItemIdx], bbox_2d: newBbox }
          setItems(newItems)
          return
      }
      
      if (!isDrawing || !startPos) return
      
      const rect = e.currentTarget.getBoundingClientRect()
      const currentX = (e.clientX - rect.left) / rect.width * 1000
      const currentY = (e.clientY - rect.top) / rect.height * 1000
      
      const ymin = Math.min(startPos.y, currentY)
      const xmin = Math.min(startPos.x, currentX)
      const ymax = Math.max(startPos.y, currentY)
      const xmax = Math.max(startPos.x, currentX)
      
      setCurrentBox([ymin, xmin, ymax, xmax])
  }

  const handleMouseUp = () => {
      if (draggingItemIdx !== null) {
          setDraggingItemIdx(null)
          setDragStartPos(null)
          setOriginalBbox(null)
          return
      }
      
      if (isDrawing && currentBox) {
          // 너무 작은 박스는 무시 (가로세로 20이하)
          if ((currentBox[2] - currentBox[0]) > 20 && (currentBox[3] - currentBox[1]) > 20) {
              setShowAddForm(true)
          } else {
              setCurrentBox(null)
          }
      }
      setIsDrawing(false)
      setStartPos(null)
  }

  const handleAddItem = () => {
      if (!newItem.name) return
      
      const newItemData = {
          name: newItem.name,
          category: '기타',
          quantity: 1,
          unit: '개',
          freshness: '보통',
          confidence: 1.0,
          bbox_2d: currentBox || null,
          purchase_date: newItem.purchaseDate,
          expiry_date: newItem.expiryDate,
          type: 'manual'
      }
      
      setItems([...items, newItemData])
      setShowAddForm(false)
      setNewItem({ name: '', purchaseDate: '', expiryDate: '' })
      setCurrentBox(null)
  }

  const handleResizeStart = (e: React.MouseEvent, idx: number, bbox: number[]) => {
    e.stopPropagation()
    e.preventDefault()
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width * 1000
    const y = (e.clientY - rect.top) / rect.height * 1000
    setResizeStartPos({ x, y })
    setResizingItemIdx(idx)
    setResizeStartBbox(bbox)
  }

  const handleDeleteItem = (idx: number) => {
    const newItems = items.filter((_, i) => i !== idx)
    setItems(newItems)
  }

  const handleStartEdit = (idx: number, name: string) => {
    setEditingIdx(idx)
    setEditingName(name)
  }

  const handleSaveEdit = (idx: number) => {
    if (!editingName.trim()) return
    const newItems = [...items]
    newItems[idx] = { ...newItems[idx], name: editingName.trim() }
    setItems(newItems)
    setEditingIdx(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingIdx(null)
    setEditingName('')
  }

  // Helper to split items
  const aiItems = items.filter(i => i.type !== 'manual')
  const manualItems = items.filter(i => i.type === 'manual')

  // max_storage_days 조회 맵 (expiry_data에서 item 이름으로 룩업)
  const expiryMap: Record<string, number> = {}
  if (data?.expiry_data) {
    data.expiry_data.forEach((e: any) => {
      if (e.item && e.max_storage_days != null) {
        expiryMap[e.item] = e.max_storage_days
      }
    })
  }

  // 디버그: 렌더링 시 aiItems 확인
  if (step === 1 && aiItems.length > 0) {
    console.log('🎨 렌더링 - aiItems 개수:', aiItems.length)
    aiItems.forEach((item: any, idx: number) => {
      console.log(`  AI 항목 ${idx + 1}: ${item.name}, bbox_2d:`, item.bbox_2d, 'exists:', !!item.bbox_2d)
    })
  }

  // --- Step 1: Detection (Bounding Boxes) ---
  const renderDetectionStep = () => (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 flex items-center justify-between text-black">
        <div className="flex items-center">
             <ShoppingBag className="w-6 h-6 mr-2 text-emerald-600" />
             식재료 감지 결과
        </div>
        <span className="text-sm font-normal text-slate-500">
            * 사진을 드래그하여 빠진 재료를 추가하세요
        </span>
      </h2>
      
      {/* ... (Image Container Code remains mostly same, just checking map key/indices) ... */}
      <div className="w-full bg-slate-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center relative select-none" style={{ minHeight: '300px' }} ref={imageContainerRef}>
        {imageData && (
          <div className="relative inline-block">
              <div 
                className="absolute inset-0 z-10"
                style={{ 
                  cursor: draggingItemIdx !== null ? 'default' : 'crosshair',
                  pointerEvents: draggingItemIdx !== null ? 'none' : 'auto'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { 
                    if(isDrawing) { setIsDrawing(false); setStartPos(null); setCurrentBox(null); }
                    if(draggingItemIdx !== null) { setDraggingItemIdx(null); setDragStartPos(null); setOriginalBbox(null); }
                }}
             ></div>

             <img src={imageData} alt="Fridge" className="block max-w-full max-h-[50vh] w-auto h-auto object-contain pointer-events-none" />
             
              {/* Render AI Items Boxes */}
              {aiItems.map((item, idx) => {
                 const hasBbox = item.bbox_2d &&
                                Array.isArray(item.bbox_2d) &&
                                item.bbox_2d.length === 4 &&
                                item.bbox_2d.every((v: number) => typeof v === 'number')

                 if (!hasBbox) {
                   console.warn(`⚠️ AI 항목 "${item.name}"에 유효한 bbox_2d가 없습니다:`, item.bbox_2d)
                   return null
                 }

                 const isYoloAccurate = item.yolo_matched === true
                 const isDragging = draggingItemIdx === idx
                 const isResizing = resizingItemIdx === idx
                 const boxClassName = isYoloAccurate
                   ? `absolute border-2 border-blue-600 bg-blue-600/20 flex items-center justify-center ${isDragging ? 'cursor-grabbing shadow-lg' : 'cursor-grab'} ${isResizing ? 'ring-2 ring-blue-300' : ''}`
                   : `absolute border-2 border-dashed border-blue-400 bg-blue-400/10 flex items-center justify-center ${isDragging ? 'cursor-grabbing shadow-lg' : 'cursor-grab'} ${isResizing ? 'ring-2 ring-blue-300' : ''}`
                 const labelClassName = isYoloAccurate
                   ? "bg-blue-600 text-white text-xs px-1 rounded absolute -top-5 left-0 whitespace-nowrap z-50"
                   : "bg-blue-400 text-white text-xs px-1 rounded absolute -top-5 left-0 whitespace-nowrap z-50"

                 return (
                   <div
                     key={`ai-${idx}`}
                     className={boxClassName}
                     onMouseDown={(e) => handleItemMouseDown(e, idx, item.bbox_2d)}
                    style={{
                      top: `${item.bbox_2d[0] / 10}%`,
                      left: `${item.bbox_2d[1] / 10}%`,
                      height: `${(item.bbox_2d[2] - item.bbox_2d[0]) / 10}%`,
                      width: `${(item.bbox_2d[3] - item.bbox_2d[1]) / 10}%`,
                      zIndex: 40,
                    }}
                  >
                    <span className={labelClassName}>
                      {idx + 1}. {item.name}
                    </span>
                    <div 
                      className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
                      onMouseDown={(e) => handleResizeStart(e, idx, item.bbox_2d)}
                    >
                      <svg viewBox="0 0 24 24" className="w-3 h-3 text-blue-600 opacity-70">
                        <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" fill="currentColor"/>
                      </svg>
                    </div>
                  </div>
                )
             })}

             {/* Render Manual Items Boxes (Green) */}
             {manualItems.map((item, idx) => {
                const hasBbox = item.bbox_2d &&
                               Array.isArray(item.bbox_2d) &&
                               item.bbox_2d.length === 4 &&
                               item.bbox_2d.every((v: number) => typeof v === 'number')

                if (!hasBbox) {
                  console.warn(`⚠️ 수동 항목 "${item.name}"에 유효한 bbox_2d가 없습니다:`, item.bbox_2d)
                  return null
                }

                return (
                  <div
                    key={`manual-${idx}`}
                    className="absolute border-2 border-green-600 bg-green-600/20 flex items-center justify-center cursor-grab"
                    style={{
                      top: `${item.bbox_2d[0] / 10}%`,
                      left: `${item.bbox_2d[1] / 10}%`,
                      height: `${(item.bbox_2d[2] - item.bbox_2d[0]) / 10}%`,
                      width: `${(item.bbox_2d[3] - item.bbox_2d[1]) / 10}%`,
                      zIndex: 40,
                    }}
                    >
                      <span className="bg-green-600 text-white text-xs px-1 rounded absolute -top-5 left-0 whitespace-nowrap z-10">
                        {idx + 1}. {item.name}
                      </span>
                      <div 
                        className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
                        onMouseDown={(e) => handleResizeStart(e, aiItems.length + idx, item.bbox_2d)}
                      >
                        <svg viewBox="0 0 24 24" className="w-3 h-3 text-green-600 opacity-70">
                          <path d="M22 22H20V20H22V22ZM22 18H20V16H22V18ZM18 22H16V20H18V22ZM22 14H20V12H22V14ZM18 18H16V16H18V18ZM14 22H12V20H14V22Z" fill="currentColor"/>
                        </svg>
                      </div>
                    </div>
                  )
               })}

              {currentBox && (
                 <div
                    className="absolute border-2 border-green-500 bg-green-500/30 pointer-events-none z-30"
                    style={{
                      top: `${currentBox[0] / 10}%`,
                      left: `${currentBox[1] / 10}%`,
                      height: `${(currentBox[2] - currentBox[0]) / 10}%`,
                      width: `${(currentBox[3] - currentBox[1]) / 10}%`,
                    }}
                 ></div>
             )}
          </div>
        )}
        
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 max-h-[60vh]">
        {/* Group 1: AI Detected */}
        <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 text-black border-b border-slate-200 pb-2">
                1. AI 감지 결과
            </h3>
            <ul className="space-y-2">
                {aiItems.map((item, idx) => {
                    const maxDays = expiryMap[item.name]
                    const isEditing = editingIdx === idx
                    return (
                    <li key={`ai-list-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                        {isEditing ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input 
                              type="text" 
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="flex-1 border rounded px-2 py-1 text-sm"
                              autoFocus
                            />
                            <button onClick={() => handleSaveEdit(idx)} className="p-1 text-green-600 hover:bg-green-100 rounded">
                              <CheckCircle className="w-5 h-5" />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                              <XCircle className="w-5 h-5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="flex items-center flex-1">
                                <span className="bg-blue-100 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 font-bold border border-blue-200">
                                    {idx + 1}
                                </span>
                                <span className="font-medium text-black">{item.name}</span>
                                {!item.yolo_matched && (
                                    <span className="ml-2 text-xs text-blue-400 border border-blue-200 rounded px-1">추정</span>
                                )}
                            </span>
                            <span className="flex items-center gap-2">
                                {maxDays != null && (
                                    <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                                        최대 보관 {maxDays}일
                                    </span>
                                )}
                                <span className="text-sm text-slate-500 font-medium">
                                    {(item.confidence * 100).toFixed(0)}%
                                </span>
                                <button onClick={() => handleStartEdit(idx, item.name)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteItem(idx)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                            </span>
                          </>
                        )}
                    </li>
                    )
                })}
            </ul>
        </div>

        {/* Group 2: User Added */}
        <div>
            <h3 className="font-bold text-lg mb-3 text-black border-b border-slate-200 pb-2">
                2. 사용자 추가 항목
            </h3>
            {manualItems.length === 0 ? (
                <p className="text-slate-400 text-sm py-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    사진에서 빠진 재료가 있다면 드래그하여 추가해보세요!
                </p>
            ) : (
                <ul className="space-y-2">
                    {manualItems.map((item, idx) => (
                        <li key={`manual-list-${idx}`} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 shadow-sm">
                            <span className="flex items-center flex-1">
                                <span className="bg-green-100 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 font-bold border border-green-200">
                                    {idx + 1}
                                </span>
                                <span className="font-medium text-black">{item.name}</span>
                            </span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-green-600 font-bold">
                                    직접 추가됨
                                </span>
                                <button onClick={() => handleStartEdit(aiItems.length + idx, item.name)} className="p-1 text-blue-600 hover:bg-blue-100 rounded">
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteItem(aiItems.length + idx)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button 
          onClick={() => setStep(2)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg flex items-center"
        >
          다음: 유통기한 확인 <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  )

  // --- Step 2: Inventory (Dates) ---
  const handleDateChange = (idx: number, type: 'expiry' | 'purchase', value: string) => {
      const newItems = [...items]
      newItems[idx][type === 'expiry' ? 'expiry_date' : 'purchase_date'] = value
      setItems(newItems)
  }

  const renderInventoryStep = () => {
    const expiryData: any[] = data?.expiry_data || []
    const urgencyOrder: Record<string, number> = { '만료됨': 0, '즉시소비': 1, '3일이내': 2, '1주이내': 3 }
    const urgentItems = expiryData
      .filter((e: any) => Object.keys(urgencyOrder).includes(e.urgency))
      .sort((a: any, b: any) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])

    const urgencyStyle = (urgency: string) => {
      switch (urgency) {
        case '만료됨':   return { row: 'bg-red-50 border-red-300',    badge: 'bg-red-600 text-white',    icon: '🚨', label: '보관기한 초과' }
        case '즉시소비': return { row: 'bg-orange-50 border-orange-300', badge: 'bg-orange-500 text-white', icon: '⚠️', label: '오늘 소비 권장' }
        case '3일이내':  return { row: 'bg-amber-50 border-amber-300',  badge: 'bg-amber-500 text-white',  icon: '⚠️', label: '3일 이내 소비' }
        case '1주이내':  return { row: 'bg-yellow-50 border-yellow-300', badge: 'bg-yellow-500 text-white', icon: '📅', label: '1주일 이내 소비' }
        default:         return { row: 'bg-white border-slate-200',     badge: 'bg-green-500 text-white',  icon: '✅', label: '안전' }
      }
    }

    return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-3 flex items-center text-black">
        <Calendar className="w-6 h-6 mr-2 text-blue-600" />
        유통기한/구매일 확인
      </h2>

      {/* 긴급 알림 배너 */}
      {urgentItems.length > 0 && (
        <div className="mb-3 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-bold text-red-700 mb-2">⚠️ 주의가 필요한 식재료 ({urgentItems.length}개)</p>
          <ul className="space-y-1">
            {urgentItems.map((e: any, i: number) => {
              const s = urgencyStyle(e.urgency)
              return (
                <li key={i} className={`flex items-center justify-between px-3 py-1.5 rounded border ${s.row}`}>
                  <span className="font-medium text-sm text-slate-800">{e.icon || s.icon} {e.item}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${s.badge}`}>{s.label}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-2 p-1">
        {items.map((item, idx) => {
            const expiryEntry = expiryData.find((e: any) => e.item === item.name)
            const s = urgencyStyle(expiryEntry?.urgency || '안전')
            return (
            <div key={idx} className={`flex items-center justify-between p-3 border rounded-lg shadow-sm ${s.row}`}>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-black">{item.name}</span>
                  {expiryEntry?.urgency && expiryEntry.urgency !== '안전' && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${s.badge}`}>
                      {expiryEntry.urgency}
                    </span>
                  )}
                  {expiryEntry?.max_storage_days != null && (
                    <span className="text-xs text-slate-500">최대 {expiryEntry.max_storage_days}일</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                    {['채소', '과일', '수산물', '정육', '기타'].includes(item.category) ? (
                        <div className="flex flex-col">
                             <label className="text-xs text-black font-medium">구매일</label>
                             <input
                                type="date"
                                className="border rounded px-2 py-1 text-sm bg-blue-50 text-black"
                                value={item.purchase_date || new Date().toISOString().split('T')[0]}
                                max={new Date().toISOString().split('T')[0]}
                                onChange={(e) => handleDateChange(idx, 'purchase', e.target.value)}
                             />
                        </div>
                    ) : (
                        <div className="flex flex-col">
                             <label className="text-xs text-black font-medium">유통기한</label>
                             <input
                                type="date"
                                className="border rounded px-2 py-1 text-sm bg-red-50 text-black"
                                value={item.expiry_date || item.expiry_date_text || ''}
                                onChange={(e) => handleDateChange(idx, 'expiry', e.target.value)}
                             />
                        </div>
                    )}
                </div>
            </div>
            )
        })}

        <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors"
        >
            + 직접 재료 추가하기
        </button>
      </div>

      <div className="mt-4 flex justify-between">
          <button onClick={() => setStep(1)} className="text-slate-500 px-4 py-2 hover:bg-slate-100 rounded">
             이전
          </button>
        <button
          onClick={() => setStep(3)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center"
        >
          다음: 식단 선택 <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
    )
  }

  // --- Step 3: Recipe Selection ---
  const handleRecipeSelect = async (recipe: any) => {
      setSelectedRecipe(recipe)
      setIsGeneratingReport(true)
      setStep(5)
      
      try {
          const ingredientNames = items.map(i => i.name)
          const res = await axios.post('http://localhost:8000/api/v1/recipes/generate-report', {
              recipe_title: recipe.title,
              ingredients: ingredientNames
          })
          setReport(res.data.content)
      } catch (e) {
          console.error(e)
          setReport("보고서 생성에 실패했습니다.")
      } finally {
          setIsGeneratingReport(false)
      }
  }

  // AI 추천 요청
  const handleAIRecommend = async () => {
    if (!userAnswer.trim()) return
    
    setErrorMessage('')
    setIsLoadingAI(true)
    try {
      const detectedItemsForAPI = items.map(i => ({ name: i.name }))
      const res = await axios.post('http://localhost:8000/api/v1/recipes/ai-recommend', {
        user_answer: userAnswer,
        detected_items: detectedItemsForAPI
      })
      
      setAiRecipes(res.data.recipes || [])
      setAiYoutubeVideos(res.data.youtube_videos || {})
      setSelectedDietType(res.data.diet_type || 'general')
      setStep(4)
    } catch (e: any) {
      console.error('AI 추천 오류:', e)
      const msg = e.response?.data?.detail || '서버 연결에 실패했습니다. 백엔드가 실행 중인지 확인해주세요.'
      setErrorMessage(msg)
    } finally {
      setIsLoadingAI(false)
    }
  }

  // 빠른 선택 버튼들
  const quickAnswers = [
    '다이어트 식단이야',
    '건강하게 먹고 싶어',
    '환자식 먹어야 해',
    '일반식으로 해줘'
  ]

  // Step 3: 식단 유형 선택
  const renderDietSelectStep = () => (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 flex items-center text-black">
        <MessageCircle className="w-6 h-6 mr-2 text-violet-600" />
        오늘은 어떤 식사를 하고 싶어요?
      </h2>
      <p className="text-slate-600 mb-6">
        하고 싶은 식사 유형을 입력하거나 아래 버튼을 선택해주세요.<br/>
        AI가 상황에 맞는 레시피 20가지를 추천해줍니다!
      </p>
      
      <div className="flex-1 overflow-y-auto">
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">
            하고 싶은 식사 (예: 다이어트 식단, 건강식, 환식 등)
          </label>
          <textarea
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="오늘은 다이어트 식단을 하고 싶어..."
            className="w-full border border-slate-300 rounded-lg p-4 text-black h-24 resize-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-slate-600 mb-3">빠른 선택:</p>
          <div className="grid grid-cols-2 gap-3">
            {quickAnswers.map((answer, idx) => (
              <button
                key={idx}
                onClick={() => setUserAnswer(answer)}
                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                  userAnswer === answer
                    ? 'border-violet-500 bg-violet-50 text-violet-700'
                    : 'border-slate-200 hover:border-violet-300 text-slate-600'
                }`}
              >
                {answer}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
          <div className="flex items-center gap-2 text-violet-700 mb-2">
            <Sparkles className="w-5 h-5" />
            <span className="font-bold">AI가 추천해줍니다</span>
          </div>
          <p className="text-sm text-violet-600">
            입력하신 내용에 따라 최적의 레시피 20가지를 추천하고,<br/>
            각 레시피에 맞는 유튜브 영상도 함께 제공해드립니다!
          </p>
        </div>
      </div>

      <div className="mt-4 flex justify-between">
        <button onClick={() => setStep(2)} className="text-slate-500 px-4 py-2 hover:bg-slate-100 rounded">
           이전
        </button>
        <button
          onClick={handleAIRecommend}
          disabled={!userAnswer.trim() || isLoadingAI}
          className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoadingAI ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              AI가 레시피 찾는 중...
            </>
          ) : (
            <>
              AI 추천 받기 <Sparkles className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        {errorMessage && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm font-medium">
              {errorMessage}
            </p>
          </div>
        )}
      </div>
    </div>
  )

  // Step 4: AI 추천 레시피 (20개)
  const renderAIRecipeStep = () => (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h2 className="text-2xl font-bold flex items-center text-black">
          <ChefHat className="w-6 h-6 mr-2 text-amber-600" />
          AI 추천 레시피 (20가지)
        </h2>
        <div className="flex items-center gap-2 mt-2">
          <span className="bg-violet-100 text-violet-700 text-sm px-3 py-1 rounded-full font-medium">
            선택한 식단: {selectedDietType === 'diet' ? '다이어트' : selectedDietType === 'health' ? '건강식' : selectedDietType === 'patient' ? '환자식' : '일반'}
          </span>
          <span className="text-slate-500 text-sm">
            "{userAnswer}" 기반 추천
          </span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {aiRecipes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            추천 레시피가 없습니다.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {aiRecipes.map((recipe, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleRecipeSelect(recipe)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-amber-300 transition-all"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 text-slate-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-slate-800">{recipe.title}</h3>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                    {recipe.difficulty} · {recipe.cooking_time}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-2">{recipe.description}</p>
                
                {/* 유튜브 영상 표시 */}
                {aiYoutubeVideos[recipe.title] && aiYoutubeVideos[recipe.title].length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                      <Play className="w-3 h-3" />
                      <span>관련 유튜브 영상</span>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {aiYoutubeVideos[recipe.title].slice(0, 2).map((video: any, vIdx: number) => (
                        <a
                          key={vIdx}
                          href={`https://www.youtube.com/watch?v=${video.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg px-2 py-1.5 hover:bg-red-100 transition-colors min-w-fit"
                        >
                          <Play className="w-3 h-3 text-red-500 fill-current" />
                          <span className="text-xs text-red-600 font-medium truncate max-w-[120px]">
                            {video.title}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 text-xs">
                      매칭률 {Math.round((recipe.match_rate || 0) * 100)}%
                    </span>
                    {recipe.calories && (
                      <span className="text-xs text-slate-500">
                        {recipe.calories}kcal
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-amber-600 flex items-center text-sm">
                    레시피 보기 <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mt-4 flex justify-start">
        <button onClick={() => setStep(3)} className="text-slate-500 px-4 py-2 hover:bg-slate-100 rounded">
           다른 식단 선택
        </button>
      </div>
    </div>
  )

  // --- Step 5: Report View (Infographic) ---
  const renderReportStep = () => {
      // Helper to safely parse report content
      let content: any = report
      if (typeof report === 'string') {
          try {
              content = JSON.parse(report)
          } catch (e) {
              // Backward compatibility for plain markdown
              return (
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                         <h2 className="text-xl font-bold text-black flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-violet-600" />
                            {selectedRecipe?.title} 쿠킹 리포트
                         </h2>
                          <button onClick={() => setStep(4)} className="text-sm text-slate-500 hover:text-slate-800">
                             다른 레시피 선택
                          </button>
                     </div>
                     <div className="flex-1 overflow-y-auto bg-slate-50 p-6 rounded-lg border prose prose-slate max-w-none">
                        <ReactMarkdown>{report}</ReactMarkdown>
                     </div>
                     <div className="mt-4 flex justify-end">
                        <button onClick={onClose} className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg">닫기</button>
                     </div>
                </div>
              )
          }
      }
      
      const { title, intro, stats, ingredients, steps, chef_kick, pairing } = content || {}

      return (
          <div className="flex flex-col h-full bg-slate-50/50">
             {/* Header Section */}
             <div className="flex justify-between items-start mb-6 border-b border-slate-200 pb-4 pt-2">
                 <div>
                     <h2 className="text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
                        {title || selectedRecipe?.title}
                     </h2>
                     <p className="text-slate-600 font-medium italic text-lg leading-relaxed">
                        "{intro || '오늘의 셰프 추천 요리입니다.'}"
                     </p>
                 </div>
                 <button onClick={() => setStep(3)} className="text-sm text-slate-400 hover:text-slate-600 underline decoration-1 underline-offset-4">
                    다른 레시피
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto pr-2 pb-10">
                 {isGeneratingReport ? (
                     <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                         <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mb-6" />
                         <p className="text-2xl font-bold text-slate-800 animate-pulse mb-2">
                             셰프가 레시피를 분석 중입니다...
                         </p>
                         <p className="text-slate-500 font-medium text-lg">
                             (영양 정보, 꿀팁, 페어링 추천 생성 중)
                         </p>
                     </div>
                 ) : (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                         {/* Stats Row */}
                         {stats && (
                             <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-700">
                                 <div className="flex items-center bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
                                     <span className="bg-orange-100 p-2 rounded-full mr-3 text-orange-600"><RefreshCw className="w-5 h-5"/></span>
                                     <div>
                                         <span className="block text-xs text-slate-400 uppercase tracking-wider">조리 시간</span>
                                         {stats.time}
                                     </div>
                                 </div>
                                 <div className="flex items-center bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
                                     <span className="bg-red-100 p-2 rounded-full mr-3 text-red-600"><ShoppingBag className="w-5 h-5"/></span>
                                      <div>
                                         <span className="block text-xs text-slate-400 uppercase tracking-wider">칼로리</span>
                                         {stats.calories}
                                     </div>
                                 </div>
                                 <div className="flex items-center bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-200">
                                     <span className="bg-blue-100 p-2 rounded-full mr-3 text-blue-600"><ChefHat className="w-5 h-5"/></span>
                                      <div>
                                         <span className="block text-xs text-slate-400 uppercase tracking-wider">난이도</span>
                                         {stats.difficulty}
                                     </div>
                                 </div>
                             </div>
                         )}

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {/* Ingredients Card */}
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                                 <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center border-b pb-4">
                                     <span className="bg-emerald-100 text-emerald-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">재료</span>
                                     준비물 체크리스트
                                 </h3>
                                 <ul className="space-y-3">
                                     {ingredients?.map((ing: any, i: number) => (
                                         <li key={i} className="flex items-start">
                                             <div className="mt-1 mr-3 min-w-5 h-5 rounded border border-emerald-300 bg-emerald-50 flex items-center justify-center">
                                                 <Check className="w-3 h-3 text-emerald-600" />
                                             </div>
                                             <div>
                                                 <span className="font-bold text-slate-800">{ing.name}</span>
                                                 {ing.amount && <span className="text-slate-500 ml-2 text-sm bg-slate-100 px-2 py-0.5 rounded-full">{ing.amount}</span>}
                                                 {ing.note && <p className="text-xs text-slate-400 mt-1">{ing.note}</p>}
                                             </div>
                                         </li>
                                     ))}
                                 </ul>
                             </div>

                             {/* Steps Card */}
                             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full">
                                 <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center border-b pb-4">
                                     <span className="bg-blue-100 text-blue-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 text-sm">순서</span>
                                     조리 가이드
                                 </h3>
                                 <div className="space-y-6">
                                     {steps?.map((step: any, i: number) => (
                                         <div key={i} className="relative pl-6 border-l-2 border-blue-100 last:border-0 hover:border-blue-300 transition-colors">
                                             <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-white shadow-sm"></div>
                                             <h4 className="font-bold text-slate-800 mb-1">Step {step.step}</h4>
                                             <p className="text-slate-600 leading-relaxed mb-2">{step.action}</p>
                                             {step.tip && (
                                                 <div className="bg-blue-50 text-blue-800 text-sm p-2 rounded-lg inline-block">
                                                     💡 Tip: {step.tip}
                                                 </div>
                                             )}
                                         </div>
                                     ))}
                                 </div>
                             </div>
                         </div>

                         {/* Chef Kick & Pairing */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             {/* Chef Kick */}
                             <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-4 opacity-10">
                                     <ChefHat className="w-32 h-32" />
                                 </div>
                                 <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center z-10 relative">
                                     <span className="text-2xl mr-2">👨‍🍳</span> 셰프의 킥 (Secret Tip)
                                 </h3>
                                 <p className="text-amber-800 font-medium leading-relaxed z-10 relative">
                                     {chef_kick}
                                 </p>
                             </div>

                             {/* Pairing */}
                             <div className="bg-violet-50 p-6 rounded-2xl border border-violet-200 relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-4 opacity-10">
                                     <FileText className="w-32 h-32" />
                                 </div>
                                 <h3 className="text-lg font-bold text-violet-900 mb-3 flex items-center z-10 relative">
                                     <span className="text-2xl mr-2">🍷</span> 추천 페어링
                                 </h3>
                                 <p className="text-violet-800 font-medium leading-relaxed z-10 relative">
                                     {pairing}
                                 </p>
                             </div>
                         </div>
                     </div>
                 )}
             </div>

             <div className="mt-4 flex justify-end pt-4 border-t border-slate-200">
                <button 
                    onClick={onClose}
                    className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-slate-200/50 transition-all hover:-translate-y-0.5"
                >
                    확인 완료
                </button>
             </div>
          </div>
      )
  }


  // --- Render (Portal) ---
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 relative z-10">
                <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                        <div 
                            key={s} 
                            className={`w-3 h-3 rounded-full transition-colors ${
                                step === s ? 'bg-slate-800 scale-125' : 
                                step > s ? 'bg-green-500' : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>
                {/* 닫기 버튼 */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }} 
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                >
                    <X className="w-5 h-5 text-black font-bold" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-hidden relative">
                  {step === 1 && renderDetectionStep()}
                  {step === 2 && renderInventoryStep()}
                  {step === 3 && renderDietSelectStep()}
                  {step === 4 && renderAIRecipeStep()}
                  {step === 5 && renderReportStep()}

                 {/* Add Item Form Popover (Global) */}
                 {showAddForm && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/40" onClick={() => setShowAddForm(false)}>
                        <div className="bg-white p-6 rounded-xl shadow-xl w-80 text-black" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg mb-4 text-black">새 재료 추가</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm text-black mb-1 font-bold">재료 이름</label>
                                    <input type="text" className="w-full border rounded px-3 py-2 text-black" placeholder="예: 우유" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} autoFocus />
                                </div>
                                <div>
                                    <label className="block text-sm text-black mb-1 font-bold">구입 날짜</label>
                                    <input 
                                        type="date" 
                                        className="w-full border rounded px-3 py-2 text-black" 
                                        value={newItem.purchaseDate} 
                                        max={new Date().toISOString().split('T')[0]}
                                        onChange={e => setNewItem({...newItem, purchaseDate: e.target.value})} 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-black mb-1 font-bold">유통기한</label>
                                    <input type="date" className="w-full border rounded px-3 py-2 text-black" value={newItem.expiryDate} onChange={e => setNewItem({...newItem, expiryDate: e.target.value})} />
                                </div>
                                <div className="flex justify-end space-x-2 mt-2">
                                    <button onClick={() => { setShowAddForm(false); setCurrentBox(null); }} className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded">취소</button>
                                    <button onClick={handleAddItem} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" disabled={!newItem.name}>추가</button>
                                </div>
                            </div>
                        </div>
                    </div>
                 )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
