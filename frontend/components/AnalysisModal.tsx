'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, ChevronRight, ChevronLeft, Check, 
  Calendar, ShoppingBag, ChefHat, FileText,
  Loader2, RefreshCw
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

  // Manual Annotation State
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null)
  const [currentBox, setCurrentBox] = useState<number[] | null>(null) // [ymin, xmin, ymax, xmax] 0-1000 scale
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({ name: '', purchaseDate: '', expiryDate: '' })

  useEffect(() => {
    if (data && isOpen) {
      // AI 감지 항목에 type: 'ai' 추가
      const detected = (data.detected_items || []).map((item: any) => ({ ...item, type: 'ai' }))
      setItems(detected)
      setRecipes(data.recipe_suggestions || [])
      setStep(1)
    }
  }, [data, isOpen])

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
      // 이미지 컨테이너 기준 상대 좌표 계산
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (e.clientX - rect.left) / rect.width * 1000
      const y = (e.clientY - rect.top) / rect.height * 1000
      setStartPos({ x, y })
      setIsDrawing(true)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
          type: 'manual' // 수동 추가 항목 표시
      }
      
      setItems([...items, newItemData])
      setShowAddForm(false)
      setNewItem({ name: '', purchaseDate: '', expiryDate: '' })
      setCurrentBox(null)
  }

  // Helper to split items
  const aiItems = items.filter(i => i.type !== 'manual')
  const manualItems = items.filter(i => i.type === 'manual')

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
      <div className="w-full bg-slate-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center relative select-none" style={{ minHeight: '300px' }}>
        {imageData && (
          <div className="relative inline-block">
             <div 
                className="absolute inset-0 z-20 cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={() => { if(isDrawing) { setIsDrawing(false); setStartPos(null); setCurrentBox(null); } }}
             ></div>

             <img src={imageData} alt="Fridge" className="block max-w-full max-h-[50vh] w-auto h-auto object-contain pointer-events-none" />
             
             {/* Render AI Items Boxes */}
             {aiItems.map((item, idx) => (
                item.bbox_2d && (
                  <div
                    key={`ai-${idx}`}
                    className="absolute border-2 border-red-500 bg-red-500/20 flex items-center justify-center pointer-events-none"
                    style={{
                      top: `${item.bbox_2d[0] / 10}%`,
                      left: `${item.bbox_2d[1] / 10}%`,
                      height: `${(item.bbox_2d[2] - item.bbox_2d[0]) / 10}%`,
                      width: `${(item.bbox_2d[3] - item.bbox_2d[1]) / 10}%`,
                    }}
                  >
                    <span className="bg-red-600 text-white text-xs px-1 rounded absolute -top-5 left-0 whitespace-nowrap z-10">
                      {idx + 1}. {item.name}
                    </span>
                  </div>
                )
             ))}

             {/* Render Manual Items Boxes (Blue) */}
             {manualItems.map((item, idx) => (
                item.bbox_2d && (
                  <div
                    key={`manual-${idx}`}
                    className="absolute border-2 border-blue-600 bg-blue-600/20 flex items-center justify-center pointer-events-none"
                    style={{
                      top: `${item.bbox_2d[0] / 10}%`,
                      left: `${item.bbox_2d[1] / 10}%`,
                      height: `${(item.bbox_2d[2] - item.bbox_2d[0]) / 10}%`,
                      width: `${(item.bbox_2d[3] - item.bbox_2d[1]) / 10}%`,
                    }}
                  >
                    <span className="bg-blue-600 text-white text-xs px-1 rounded absolute -top-5 left-0 whitespace-nowrap z-10">
                      {idx + 1}. {item.name}
                    </span>
                  </div>
                )
             ))}

             {currentBox && (
                 <div
                    className="absolute border-2 border-blue-500 bg-blue-500/30 pointer-events-none z-30"
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
      
      <div className="flex-1 overflow-y-auto pr-2">
        {/* Group 1: AI Detected */}
        <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 text-black border-b border-slate-200 pb-2">
                1. AI 감지 결과
            </h3>
            <ul className="space-y-2">
                {aiItems.map((item, idx) => (
                    <li key={`ai-list-${idx}`} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                        <span className="flex items-center">
                            <span className="bg-red-100 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 font-bold border border-red-200">
                                {idx + 1}
                            </span>
                            <span className="font-medium text-black">{item.name}</span>
                        </span>
                        <span className="text-sm text-slate-500 font-medium">
                            {(item.confidence * 100).toFixed(0)}%
                        </span>
                    </li>
                ))}
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
                        <li key={`manual-list-${idx}`} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                            <span className="flex items-center">
                                <span className="bg-blue-100 text-black w-6 h-6 rounded-full flex items-center justify-center text-xs mr-3 font-bold border border-blue-200">
                                    {idx + 1}
                                </span>
                                <span className="font-medium text-black">{item.name}</span>
                            </span>
                            <span className="text-sm text-blue-600 font-bold">
                                직접 추가됨
                            </span>
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

  const renderInventoryStep = () => (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 flex items-center text-black">
        <Calendar className="w-6 h-6 mr-2 text-blue-600" />
        유통기한/구매일 확인
      </h2>
      <p className="text-black mb-4">정확한 추천을 위해 날짜를 확인해주세요.</p>
      
      <div className="flex-1 overflow-y-auto space-y-3 p-1">
        {items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                <div className="font-medium text-lg text-black">{item.name}</div>
                <div className="flex items-center space-x-2">
                    {/* 채소/과일/수산물 등은 구매일 입력 권장, 나머지는 유통기한 */}
                    {['채소', '과일', '수산물', '정육', '기타'].includes(item.category) ? (
                        <div className="flex flex-col">
                             <label className="text-xs text-black font-medium">구매일</label>
                             <input 
                                type="date" 
                                className="border rounded px-2 py-1 text-sm bg-blue-50 text-black"
                                value={item.purchase_date || new Date().toISOString().split('T')[0]} // 기본값 오늘
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
        ))}
        
        {/* 아이템 추가 버튼 (Placeholder) */}
        {/* 아이템 추가 버튼 */}
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
          다음: 레시피 보기 <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </div>
  )

  // --- Step 3: Recipe Selection ---
  const handleRecipeSelect = async (recipe: any) => {
      setSelectedRecipe(recipe)
      setIsGeneratingReport(true)
      setStep(4)
      
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

  const renderRecipeStep = () => (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4 flex items-center text-black">
        <ChefHat className="w-6 h-6 mr-2 text-amber-600" />
        추천 레시피 (Top 3)
      </h2>
      <p className="text-slate-600 mb-4">만들고 싶은 요리를 선택하면 상세 보고서를 작성합니다.</p>
      
      {data?.discussion_result?.discussion && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-amber-800 flex items-center mb-2">
                <ChefHat className="w-5 h-5 mr-2" /> 셰프들의 논의
            </h3>
            <p className="text-sm text-amber-900 whitespace-pre-wrap">
                {data.discussion_result.discussion}
            </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto grid grid-cols-1 gap-4 p-1">
        {recipes.slice(0, 3).map((recipe, idx) => (
             <motion.div 
                key={idx}
                whileHover={{ scale: 1.02 }}
                onClick={() => handleRecipeSelect(recipe)}
                className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-amber-300 transition-all"
             >
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-800">{recipe.title}</h3>
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">{recipe.difficulty} / {recipe.cooking_time}</span>
                </div>
                <p className="text-sm text-slate-600 mb-3">{recipe.description}</p>
                <div className="flex justify-between items-center text-sm">
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100">
                        매칭률 {Math.round(recipe.match_rate * 100)}%
                    </span>
                    <span className="font-semibold text-amber-600 flex items-center">
                        리포트 생성 <ChevronRight className="w-4 h-4" />
                    </span>
                </div>
             </motion.div>
        ))}
      </div>
      
       <div className="mt-4 flex justify-start">
         <button onClick={() => setStep(2)} className="text-slate-500 px-4 py-2 hover:bg-slate-100 rounded">
            이전
         </button>
      </div>
    </div>
  )

  // --- Step 4: Report View ---
  const renderReportStep = () => (
      <div className="flex flex-col h-full">
         <div className="flex justify-between items-center mb-4 border-b pb-2">
             <h2 className="text-xl font-bold text-black flex items-center">
                <FileText className="w-5 h-5 mr-2 text-violet-600" />
                {selectedRecipe?.title} 쿠킹 리포트
             </h2>
             <button onClick={() => setStep(3)} className="text-sm text-slate-500 hover:text-slate-800">
                다른 레시피 선택
             </button>
         </div>

         <div className="flex-1 overflow-y-auto bg-slate-50 p-6 rounded-lg border">
             {isGeneratingReport ? (
                 <div className="flex flex-col items-center justify-center h-64">
                     <Loader2 className="w-12 h-12 text-violet-500 animate-spin mb-4" />
                     <p className="text-lg font-medium text-slate-700 animate-pulse">
                         전문가 스타일의 블로그 포스팅 작성 중...
                     </p>
                     <p className="text-sm text-slate-500 mt-2">
                         (꿀팁, 플레이팅 가이드 포함)
                     </p>
                 </div>
             ) : (
                 <div className="prose prose-slate max-w-none">
                     <ReactMarkdown>{report || ''}</ReactMarkdown>
                 </div>
             )}
         </div>
         
         <div className="mt-4 flex justify-end">
            <button 
                onClick={onClose}
                className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg"
            >
                닫기
            </button>
         </div>
      </div>
  )


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50 relative z-10">
            <div className="flex space-x-2">
                {[1, 2, 3, 4].map((s) => (
                    <div 
                        key={s} 
                        className={`w-3 h-3 rounded-full transition-colors ${
                            step === s ? 'bg-slate-800 scale-125' : 
                            step > s ? 'bg-green-500' : 'bg-slate-200'
                        }`}
                    />
                ))}
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
                <X className="w-5 h-5 text-black font-bold" />
            </button>
        </div>

        {/* Content */}
        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden relative">
             {step === 1 && renderDetectionStep()}
             {step === 2 && renderInventoryStep()}
             {step === 3 && renderRecipeStep()}
             {step === 4 && renderReportStep()}

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
  )
}
