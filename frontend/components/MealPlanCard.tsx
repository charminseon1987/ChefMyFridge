'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, Pizza, ChefHat, Sparkles, Users, X, Loader2 } from 'lucide-react'
import RecipeDetail from './RecipeDetail'
import axios from 'axios'

interface MealPlan {
  id: string
  type: 'korean' | 'western' | 'chinese' | 'special' | 'party'
  title: string
  description: string
  meals: string[]
  calories?: number
  duration?: string
  image?: string
}

interface MealPlanCardProps {
  mealPlan: MealPlan
  index: number
}

export default function MealPlanCard({ mealPlan, index }: MealPlanCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [isLoadingRecipe, setIsLoadingRecipe] = useState(false)
  const [aiRecipe, setAiRecipe] = useState<any>(null)

  // 카드 클릭 시 모달 즉시 표시 + 백그라운드에서 API 호출
  const handleClick = async () => {
    // 즉시 모달 표시 (기존 데이터로)
    setShowDetail(true)
    setIsFlipped(true)
    
    // 백그라운드에서 AI 레시피 검색
    setIsLoadingRecipe(true)
    try {
      const res = await axios.post('http://localhost:8000/api/v1/recipes/from-meal-plan', {
        meal_title: mealPlan.title,
        meals: mealPlan.meals,
      })
      
      if (res.data.recipe) {
        setAiRecipe({
          ...res.data.recipe,
          id: mealPlan.id,
          image: mealPlan.image || thumbnails[mealPlan.type],
          youtubeVideos: res.data.youtube_videos?.[res.data.main_dish] || [],
        })
      }
    } catch (error) {
      console.error('레시피 검색 오류:', error)
    } finally {
      setIsLoadingRecipe(false)
      setIsFlipped(false)
    }
  }

  const handleClose = () => {
    setShowDetail(false)
    setAiRecipe(null)
  }

  const icons = {
    korean: UtensilsCrossed,
    western: Pizza,
    chinese: ChefHat,
    special: Sparkles,
    party: Users,
  }

  const colors = {
    korean: 'from-red-500 to-orange-500',
    western: 'from-blue-500 to-indigo-500',
    chinese: 'from-yellow-500 to-amber-500',
    special: 'from-purple-500 to-pink-500',
    party: 'from-emerald-500 to-teal-500',
  }

  const bgColors = {
    korean: 'bg-red-50 border-red-200',
    western: 'bg-blue-50 border-blue-200',
    chinese: 'bg-yellow-50 border-yellow-200',
    special: 'bg-purple-50 border-purple-200',
    party: 'bg-emerald-50 border-emerald-200',
  }

  const Icon = icons[mealPlan.type]

  const getRecipeFromMealPlan = () => {
    // mealPlan.meals에서 메뉴 목록 가져오기
    const menuList = mealPlan.meals.join(', ')

    const recipeData = {
      korean: {
        title: mealPlan.title,
        description: mealPlan.description,
        cookingTime: '25분',
        difficulty: '중' as const,
        ingredients: mealPlan.meals.map(m => ({ name: m.split(' + ')[0], amount: '1인분', gram: 0 })),
        steps: mealPlan.meals.map((meal, idx) => ({
          step: idx + 1,
          description: `${meal}을(를) 조리합니다`,
          duration: '20분',
          tip: '전통 한식 레시피를 따라 조리하세요'
        })),
        tips: [
          `메뉴: ${menuList}`,
          '한식은 전통 양념법을 따라주세요'
        ],
        recommendedVideos: [
          { id: 'dummy-1', title: `${mealPlan.title} 레시피 - 백종원의 요리비책`, channel: '백종원의 요리비책' },
          { id: 'dummy-2', title: `${mealPlan.title} 레시피 - 만개의레시피`, channel: '만개의레시피' },
        ],
      },
      western: {
        title: mealPlan.title,
        description: mealPlan.description,
        cookingTime: '30분',
        difficulty: '중' as const,
        ingredients: mealPlan.meals.map(m => ({ name: m.split(' + ')[0], amount: '1인분', gram: 0 })),
        steps: mealPlan.meals.map((meal, idx) => ({
          step: idx + 1,
          description: `${meal}을(를) 조리합니다`,
          duration: '25분',
          tip: '서양 요리 레시피를 따라 조리하세요'
        })),
        tips: [
          `메뉴: ${menuList}`,
          '양식은 신선한 재료를 사용하세요'
        ],
        recommendedVideos: [
          { id: 'dummy-1', title: `${mealPlan.title} 레시피 - 백종원의 요리비책`, channel: '백종원의 요리비책' },
          { id: 'dummy-2', title: `${mealPlan.title} 레시피 - 만개의레시피`, channel: '만개의레시피' },
        ],
      },
      chinese: {
        title: mealPlan.title,
        description: mealPlan.description,
        cookingTime: '35분',
        difficulty: '중' as const,
        ingredients: mealPlan.meals.map(m => ({ name: m.split(' + ')[0], amount: '1인분', gram: 0 })),
        steps: mealPlan.meals.map((meal, idx) => ({
          step: idx + 1,
          description: `${meal}을(를) 조리합니다`,
          duration: '25분',
          tip: '중화요리 양념비를 맞추세요'
        })),
        tips: [
          `메뉴: ${menuList}`,
          '중식은 춘장과 간장을 주로 사용하세요'
        ],
        recommendedVideos: [
          { id: 'dummy-1', title: `${mealPlan.title} 레시피 - 백종원의 요리비책`, channel: '백종원의 요리비책' },
          { id: 'dummy-2', title: `${mealPlan.title} 레시피 - 만개의레시피`, channel: '만개의레시피' },
        ],
      },
      special: {
        title: mealPlan.title,
        description: mealPlan.description,
        cookingTime: '40분',
        difficulty: '고' as const,
        ingredients: mealPlan.meals.map(m => ({ name: m.split(' + ')[0], amount: '1인분', gram: 0 })),
        steps: mealPlan.meals.map((meal, idx) => ({
          step: idx + 1,
          description: `${meal}을(를) 조리합니다`,
          duration: '30분',
          tip: '특별한 날에 어울리도록 정성을 들여주세요'
        })),
        tips: [
          `메뉴: ${menuList}`,
          '최고 품질의 재료를 사용하세요'
        ],
        recommendedVideos: [
          { id: 'dummy-1', title: `${mealPlan.title} 레시피 - 백종원의 요리비책`, channel: '백종원의 요리비책' },
          { id: 'dummy-2', title: `${mealPlan.title} 레시피 - 만개의레시피`, channel: '만개의레시피' },
        ],
      },
      party: {
        title: mealPlan.title,
        description: mealPlan.description,
        cookingTime: '50분',
        difficulty: '중' as const,
        ingredients: mealPlan.meals.map(m => ({ name: m.split(' + ')[0], amount: '1인분', gram: 0 })),
        steps: mealPlan.meals.map((meal, idx) => ({
          step: idx + 1,
          description: `${meal}을(를) 조리합니다`,
          duration: '30분',
          tip: '다양한 요리를 준비하세요'
        })),
        tips: [
          `메뉴: ${menuList}`,
          '손님들과 함께 나눌 수 있는 요리를 준비하세요'
        ],
        recommendedVideos: [
          { id: 'dummy-1', title: `${mealPlan.title} 레시피 - 백종원의 요리비책`, channel: '백종원의 요리비책' },
          { id: 'dummy-2', title: `${mealPlan.title} 레시피 - 만개의레시피`, channel: '만개의레시피' },
        ],
      },
    }

    const recipe = recipeData[mealPlan.type]
    return {
      id: mealPlan.id,
      ...recipe,
      calories: mealPlan.calories,
      image: mealPlan.image || thumbnails[mealPlan.type],
    }
  }

  // 최종 표시할 레시피 (AI 레시피가 있으면 우선 사용)
  const displayRecipe = aiRecipe || getRecipeFromMealPlan()

  // 식단 타입별 썸네일 이미지
  const thumbnails = {
    korean: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400&h=300&fit=crop&q=80',
    western: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop&q=80',
    chinese: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400&h=300&fit=crop&q=80',
    special: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=80',
    party: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=400&h=300&fit=crop&q=80',
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="relative h-full"
        style={{ perspective: '1000px' }}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ transformStyle: 'preserve-3d' }}
          className="relative w-full h-full"
        >
          {/* 앞면 */}
          <motion.div
            style={{ backfaceVisibility: 'hidden' }}
            className="glass rounded-xl p-6 border border-slate-200/30 hover:scale-105 hover:shadow-3d-emerald transition-all transform-3d card-3d group cursor-pointer h-full"
            onClick={handleClick}
          >
            {/* 썸네일 이미지 */}
            <div className="relative w-full h-40 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
              <img
                src={mealPlan.image || thumbnails[mealPlan.type]}
                alt={mealPlan.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="absolute top-3 right-3">
                <div className={`p-2 bg-white/20 rounded-lg backdrop-blur-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>

            {/* 헤더 */}
            <div className={`flex items-center space-x-3 mb-4 p-3 rounded-lg bg-gradient-to-r ${colors[mealPlan.type]} shadow-md`}>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white">{mealPlan.title}</h3>
                {mealPlan.duration && (
                  <p className="text-xs text-white/80">{mealPlan.duration}</p>
                )}
              </div>
            </div>

            {/* 설명 */}
            <p className="text-sm text-slate-600 mb-4 line-clamp-2">{mealPlan.description}</p>

            {/* 식단 목록 */}
            <div className={`${bgColors[mealPlan.type]} rounded-lg p-4 border space-y-2`}>
              <p className="text-xs font-semibold text-slate-700 mb-2">추천 메뉴</p>
              <ul className="space-y-1.5">
                {mealPlan.meals.map((meal, idx) => (
                  <li key={idx} className="flex items-center space-x-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                    <span>{meal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 칼로리 정보 */}
            {mealPlan.calories && (
              <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                <span>예상 칼로리</span>
                <span className="font-semibold text-slate-700">{mealPlan.calories}kcal</span>
              </div>
            )}

            {/* 클릭 안내 */}
            <div className="mt-4 pt-3 border-t border-slate-200">
              <p className="text-xs text-center text-slate-400 italic">클릭하여 상세 레시피 보기</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 상세 레시피 모달 */}
      <AnimatePresence>
        {showDetail && (
          <>
            {isLoadingRecipe ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-2xl p-8 flex flex-col items-center">
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                  <p className="text-slate-700 font-medium">AI가 레시피를 검색 중...</p>
                </div>
              </div>
            ) : (
              <RecipeDetail 
                recipe={displayRecipe} 
                onClose={handleClose} 
              />
            )}
          </>
        )}
      </AnimatePresence>
    </>
  )
}
