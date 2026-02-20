'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Clock, ChefHat, Utensils, Youtube, ShoppingCart, CheckCircle2, Percent } from 'lucide-react'

export interface Ingredient {
  name: string
  amount?: string // 예: "200g", "1개", "2큰술"
  gram?: number // 그램 수 (선택사항)
}

export interface RecipeStep {
  step: number
  description: string
  duration?: string // 예: "5분", "2-3분"
  tip?: string // 팁 (선택사항)
}

export interface SauceRecipe {
  name: string
  ingredients: Ingredient[]
  steps: string[]
  tip?: string
}

export interface NutritionalInfo {
  calories: number
  protein?: string
  carbs?: string
  fat?: string
}

export interface Recipe {
  id: string
  title: string
  description: string
  cookingTime: string
  difficulty: '초' | '중' | '고'
  servings?: string
  ingredients: string[] | Ingredient[]
  calories?: number
  image?: string
  steps?: string[] | RecipeStep[]
  youtubeId?: string
  recommendedVideos?: Array<{
    id: string
    title: string
    channel: string
    thumbnailUrl?: string
  }>
  sauce?: SauceRecipe
  sauces?: SauceRecipe[]
  tips?: string[]
  missing_ingredients?: string[]
  match_rate?: number
  nutritional_info?: NutritionalInfo
  storage?: string
  pairing?: string[]
}

interface RecipeDetailProps {
  recipe: Recipe
  onClose: () => void
}

// 유튜브 영상 썸네일 컴포넌트
function VideoThumbnailList({ videos }: { videos: Array<{ id: string; title: string; channel: string; thumbnailUrl?: string }> }) {
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)

  return (
    <div className="mt-6 pt-6 border-t border-slate-200">
      <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center space-x-2">
        <span>추천 유튜브 레시피</span>
        <span className="text-sm font-normal text-slate-500">(최고의 레시피 2개)</span>
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {videos.map((video, index) => {
          // 썸네일 URL 결정: 직접 제공된 URL > 유튜브 ID 기반 > 더미 플레이스홀더
          let thumbnailUrl: string | null = null
          
          if (video.thumbnailUrl) {
            // 백엔드에서 받은 썸네일 URL 사용
            thumbnailUrl = video.thumbnailUrl
          } else if (!video.id.startsWith('dummy-')) {
            // 실제 유튜브 영상 ID인 경우 유튜브 썸네일 URL 생성
            thumbnailUrl = `https://img.youtube.com/vi/${video.id}/maxresdefault.jpg`
          }
          
          const isPlaying = playingIndex === index
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-lg overflow-hidden border border-slate-200 shadow-md hover:shadow-lg transition-all group cursor-pointer"
              onClick={() => {
                if (!isPlaying && !video.id.startsWith('dummy-')) {
                  setPlayingIndex(index)
                } else if (video.id.startsWith('dummy-')) {
                  // 더미 영상의 경우 유튜브 검색 페이지로 이동
                  window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(video.title)}`, '_blank')
                }
              }}
            >
              <div className="relative w-full aspect-video bg-slate-100 overflow-hidden">
                {isPlaying && !video.id.startsWith('dummy-') ? (
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
                    title={video.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                ) : thumbnailUrl ? (
                  <>
                    <img
                      src={thumbnailUrl}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        // 썸네일 로드 실패 시 대체 이미지 시도
                        const target = e.currentTarget as HTMLImageElement
                        if (video.id && !video.id.startsWith('dummy-')) {
                          // 유튜브 영상 ID가 있으면 hqdefault로 시도
                          if (thumbnailUrl?.includes('maxresdefault')) {
                            target.src = `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`
                          } else if (thumbnailUrl?.includes('hqdefault')) {
                            // hqdefault도 실패하면 플레이스홀더
                            target.style.display = 'none'
                            const placeholder = document.createElement('div')
                            placeholder.className = 'absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-600'
                            placeholder.innerHTML = `
                              <svg class="w-16 h-16 text-white mb-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                              </svg>
                              <p class="text-white text-sm font-semibold">유튜브 영상</p>
                              <p class="text-white/80 text-xs mt-1 px-4 text-center">${video.title}</p>
                            `
                            target.parentElement?.appendChild(placeholder)
                          }
                        } else {
                          // 더미 영상이면 플레이스홀더 표시
                          target.style.display = 'none'
                        }
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                      <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                      <Youtube className="w-3 h-3" />
                      <span>유튜브</span>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                      재생
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-red-600">
                    <Youtube className="w-16 h-16 text-white mb-2" />
                    <p className="text-white text-sm font-semibold">유튜브 영상</p>
                    <p className="text-white/80 text-xs mt-1 px-4 text-center line-clamp-2">{video.title}</p>
                    <p className="text-white/60 text-xs mt-2">클릭하여 검색하기</p>
                  </div>
                )}
              </div>
              <div className="p-4">
                <h5 className="font-semibold text-slate-800 mb-1 line-clamp-2 group-hover:text-red-600 transition-colors">
                  {video.title}
                </h5>
                <p className="text-xs text-slate-500 flex items-center space-x-1">
                  <Youtube className="w-3 h-3 text-red-500" />
                  <span>{video.channel}</span>
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

export default function RecipeDetail({ recipe, onClose }: RecipeDetailProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])
  // 재료 형식 변환 (기존 string[] 또는 Ingredient[])
  const getIngredients = (): Ingredient[] => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return []
    
    if (typeof recipe.ingredients[0] === 'string') {
      // 기존 형식: string[]
      return (recipe.ingredients as string[]).map(name => ({ name, amount: '적당량' }))
    }
    return recipe.ingredients as Ingredient[]
  }

  const ingredients = getIngredients()

  // 조리 단계 형식 변환
  const getSteps = (): RecipeStep[] => {
    if (!recipe.steps || recipe.steps.length === 0) {
      return [
        { step: 1, description: '재료를 준비하고 손질합니다' },
        { step: 2, description: '기본 양념을 만들어 냄비에 넣습니다' },
        { step: 3, description: '재료를 넣고 끓입니다' },
        { step: 4, description: '완성 후 그릇에 담아냅니다' },
      ]
    }

    if (typeof recipe.steps[0] === 'string') {
      // 기존 형식: string[]
      return (recipe.steps as string[]).map((desc, idx) => ({
        step: idx + 1,
        description: desc,
      }))
    }
    return recipe.steps as RecipeStep[]
  }

  const steps = getSteps()

  // 난이도 색상
  const difficultyColors = {
    초: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    중: 'bg-amber-100 text-amber-700 border-amber-300',
    고: 'bg-rose-100 text-rose-700 border-rose-300',
  }

  // 유튜브 검색 URL 생성 (레시피 이름으로 검색)
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipe.title + ' 레시피')}`

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.3, type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-y-auto max-h-[90vh]">
          {/* 헤더 이미지 */}
          {recipe.image && (
            <div className="relative h-64 w-full overflow-hidden">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-3xl font-bold text-white mb-2">{recipe.title}</h2>
                <p className="text-white/90">{recipe.description}</p>
              </div>
            </div>
          )}

          <div className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
                <Clock className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-xs text-slate-500">조리 시간</p>
                  <p className="font-semibold text-slate-800">{recipe.cookingTime}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
                <ChefHat className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="text-xs text-slate-500">난이도</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold border ${difficultyColors[recipe.difficulty]}`}>
                    {recipe.difficulty}
                  </span>
                </div>
              </div>
              {recipe.calories && (
                <div className="flex items-center space-x-3 p-4 bg-slate-50 rounded-lg">
                  <Utensils className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="text-xs text-slate-500">칼로리</p>
                    <p className="font-semibold text-slate-800">{recipe.calories}kcal</p>
                  </div>
                </div>
              )}
              {recipe.match_rate !== undefined && (
                <div className="flex items-center space-x-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                  <Percent className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-xs text-emerald-600">매칭률</p>
                    <p className="font-bold text-emerald-700">{recipe.match_rate}%</p>
                  </div>
                </div>
              )}
            </div>

            {/* 상세 영양 정보 (AI 레시피용) */}
            {recipe.nutritional_info && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 border border-orange-200">
                  <p className="text-xs text-orange-600 mb-1">열량</p>
                  <p className="text-lg font-bold text-orange-700">{recipe.nutritional_info.calories}kcal</p>
                </div>
                {recipe.nutritional_info.protein && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">단백질</p>
                    <p className="text-lg font-bold text-blue-700">{recipe.nutritional_info.protein}</p>
                  </div>
                )}
                {recipe.nutritional_info.carbs && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                    <p className="text-xs text-green-600 mb-1">탄수화물</p>
                    <p className="text-lg font-bold text-green-700">{recipe.nutritional_info.carbs}</p>
                  </div>
                )}
                {recipe.nutritional_info.fat && (
                  <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
                    <p className="text-xs text-yellow-600 mb-1">지방</p>
                    <p className="text-lg font-bold text-yellow-700">{recipe.nutritional_info.fat}</p>
                  </div>
                )}
              </div>
            )}

            {/* 보관 방법 및 페어링 */}
            {(recipe.storage || recipe.pairing) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recipe.storage && (
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                      <span className="mr-2">📦</span> 보관 방법
                    </h4>
                    <p className="text-sm text-blue-700">{recipe.storage}</p>
                  </div>
                )}
                {recipe.pairing && recipe.pairing.length > 0 && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center">
                      <span className="mr-2">🍽️</span> 추천 페어링
                    </h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      {recipe.pairing.map((item, idx) => (
                        <li key={idx} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-purple-400 rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 쇼핑 리스트 (부족한 재료) */}
            {recipe.missing_ingredients && recipe.missing_ingredients.length > 0 && (
              <div className="glass-rose rounded-xl p-6 border-2 border-rose-200">
                <h3 className="text-xl font-bold text-rose-700 mb-4 flex items-center space-x-2">
                  <ShoppingCart className="w-6 h-6" />
                  <span>쇼핑 리스트 (부족한 재료)</span>
                </h3>
                <div className="bg-white/80 rounded-lg p-4">
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recipe.missing_ingredients.map((item, idx) => (
                      <li key={idx} className="flex items-center space-x-2 text-rose-600 font-medium">
                        <div className="w-5 h-5 rounded-full border-2 border-rose-400 flex items-center justify-center">
                          <div className="w-2.5 h-2.5 rounded-full bg-rose-400 opacity-0 hover:opacity-100 transition-opacity cursor-pointer"></div>
                        </div>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-rose-400 mt-4 text-right">* 체크박스를 클릭하여 구매 완료 표시 (구현 예정)</p>
                </div>
              </div>
            )}

            {/* 재료 목록 (인포그래픽 스타일) */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <Utensils className="w-6 h-6 text-emerald-600" />
                </div>
                <span>필요한 재료</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {ingredients.map((ingredient, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-emerald-200 transition-all text-center aspect-square"
                  >
                    <div className="w-10 h-10 mb-3 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                      🥗
                    </div>
                    <span className="text-slate-700 font-bold mb-1 break-keep">{ingredient.name}</span>
                    <span className="text-slate-500 text-sm">{ingredient.amount}</span>
                    {ingredient.gram && (
                      <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full mt-1">
                        {ingredient.gram}g
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 양념/소스 비법 */}
            {recipe.sauces && recipe.sauces.length > 0 && (
              <div className="glass rounded-xl p-6 border-2 border-amber-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <span className="text-amber-600">✨</span>
                  <span>양념/소스 비법</span>
                </h3>
                <div className="space-y-4">
                  {recipe.sauces.map((sauce, sauceIndex) => (
                    <motion.div
                      key={sauceIndex}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: sauceIndex * 0.1 }}
                      className="bg-amber-50 rounded-lg p-4 border border-amber-200"
                    >
                      <h4 className="font-bold text-slate-800 mb-3 text-lg">{sauce.name}</h4>
                      
                      {/* 양념 재료 */}
                      <div className="mb-3">
                        <p className="text-sm font-semibold text-slate-700 mb-2">재료:</p>
                        <div className="flex flex-wrap gap-2">
                          {sauce.ingredients.map((ing, ingIndex) => (
                            <span
                              key={ingIndex}
                              className="px-3 py-1 bg-white rounded-full text-sm text-slate-700 border border-amber-200"
                            >
                              {ing.name} {ing.amount}
                              {ing.gram && ` (${ing.gram}g)`}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 양념 만드는 방법 */}
                      <div className="mb-2">
                        <p className="text-sm font-semibold text-slate-700 mb-2">만드는 방법:</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-slate-600">
                          {sauce.steps.map((step, stepIndex) => (
                            <li key={stepIndex}>{step}</li>
                          ))}
                        </ol>
                      </div>

                      {/* 팁 */}
                      {sauce.tip && (
                        <div className="mt-3 p-3 bg-amber-100 rounded-lg border-l-4 border-amber-400">
                          <p className="text-sm text-slate-700">
                            <span className="font-semibold">💡 팁:</span> {sauce.tip}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center space-x-2">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <ChefHat className="w-6 h-6 text-orange-600" />
                </div>
                <span>조리 방법</span>
              </h3>
              <div className="relative border-l-2 border-slate-200 ml-4 space-y-8 pb-4">
                {steps.map((step, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-8"
                  >
                    {/* 타임라인 점 */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-orange-500 border-4 border-white shadow-sm"></div>
                    
                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <span className="inline-block px-3 py-1 bg-slate-800 text-white text-xs font-bold rounded-lg mb-2 sm:mb-0">
                          STEP {step.step}
                        </span>
                        {step.duration && (
                          <div className="flex items-center text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-1 rounded-md">
                            <Clock className="w-3 h-3 mr-1" />
                            {step.duration}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-slate-700 text-lg leading-relaxed font-medium mb-3">
                        {step.description}
                      </p>
                      
                      {step.tip && (
                        <div className="flex items-start p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                          <span className="text-blue-500 mr-2 mt-0.5">💡</span>
                          <p className="text-sm text-slate-600">
                            <span className="font-semibold text-blue-700">Chef's Tip:</span> {step.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* 전체적인 팁 */}
            {recipe.tips && recipe.tips.length > 0 && (
              <div className="glass rounded-xl p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200">
                <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                  <span className="text-emerald-600">🌟</span>
                  <span>더 맛있게 만드는 팁</span>
                </h3>
                <ul className="space-y-3">
                  {recipe.tips.map((tip, index) => (
                    <motion.li
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-emerald-200"
                    >
                      <span className="text-emerald-500 font-bold text-lg">•</span>
                      <p className="text-slate-700 leading-relaxed flex-1">{tip}</p>
                    </motion.li>
                  ))}
                </ul>
              </div>
            )}

            {/* 유튜브 영상 */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <Youtube className="w-5 h-5 text-red-500" />
                <span>참고 영상</span>
              </h3>
              <div className="space-y-4">
                <p className="text-slate-600 text-sm mb-4">
                  "{recipe.title}" 레시피 관련 유튜브 영상을 확인해보세요
                </p>
                <a
                  href={youtubeSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Youtube className="w-5 h-5" />
                  <span>유튜브에서 레시피 보기</span>
                </a>

                {/* 추천 유튜브 레시피 */}
                {recipe.recommendedVideos && recipe.recommendedVideos.length > 0 && (
                  <VideoThumbnailList videos={recipe.recommendedVideos} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 cursor-pointer"
        >
          <X className="w-5 h-5 text-black font-bold" />
        </button>
      </motion.div>
    </motion.div>
  )

  if (!mounted) return null

  return createPortal(modalContent, document.body)
}
