'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { X, Clock, ChefHat, Utensils, Youtube } from 'lucide-react'

interface Ingredient {
  name: string
  amount: string // 예: "200g", "1개", "2큰술"
  gram?: number // 그램 수 (선택사항)
}

interface RecipeStep {
  step: number
  description: string
  duration?: string // 예: "5분", "2-3분"
  tip?: string // 팁 (선택사항)
}

interface SauceRecipe {
  name: string
  ingredients: Ingredient[]
  steps: string[]
  tip?: string
}

interface Recipe {
  id: string
  title: string
  description: string
  cookingTime: string
  difficulty: '초' | '중' | '고'
  ingredients: string[] | Ingredient[] // 기존 형식 또는 상세 형식
  calories?: number
  image?: string
  steps?: string[] | RecipeStep[] // 기존 형식 또는 상세 형식
  youtubeId?: string
  recommendedVideos?: Array<{
    id: string
    title: string
    channel: string
    thumbnailUrl?: string
  }>
  sauces?: SauceRecipe[] // 양념/소스 비법
  tips?: string[] // 전체적인 팁들
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </div>

            {/* 재료 목록 */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <Utensils className="w-5 h-5" />
                <span>필요한 재료</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ingredients.map((ingredient, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                      <span className="text-slate-700 font-medium">{ingredient.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-600 text-sm font-semibold">{ingredient.amount}</span>
                      {ingredient.gram && (
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">
                          {ingredient.gram}g
                        </span>
                      )}
                    </div>
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

            {/* 조리 단계 */}
            <div className="glass rounded-xl p-6">
              <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center space-x-2">
                <ChefHat className="w-5 h-5" />
                <span>조리 방법</span>
              </h3>
              <ol className="space-y-4">
                {steps.map((step, index) => (
                  <motion.li
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex space-x-4"
                  >
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-white flex items-center justify-center font-bold shadow-md">
                        {step.step}
                      </div>
                      {step.duration && (
                        <div className="mt-2 text-xs text-center text-slate-500 font-semibold">
                          {step.duration}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-slate-700 leading-relaxed">{step.description}</p>
                      {step.tip && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                          <p className="text-sm text-slate-600">
                            <span className="font-semibold text-blue-700">💡 팁:</span> {step.tip}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.li>
                ))}
              </ol>
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
