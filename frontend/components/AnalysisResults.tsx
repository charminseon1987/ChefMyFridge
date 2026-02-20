'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Package,
  Clock,
  AlertTriangle,
  ChefHat,
  ShoppingCart,
  TrendingUp,
  Loader2,
} from 'lucide-react'
import axios from 'axios'
import DietTypeSelector from './DietTypeSelector'
import RecipeCard from './RecipeCard'
import UnidentifiedItems from './UnidentifiedItems'

type DietType = 'diet' | 'health' | 'patient' | null

interface AnalysisResultsProps {
  data: any
}

export default function AnalysisResults({ data }: AnalysisResultsProps) {
  const [selectedDietType, setSelectedDietType] = useState<DietType>(null)
  const [filteredRecipes, setFilteredRecipes] = useState<any[]>([])
  const [isLoadingRecipes, setIsLoadingRecipes] = useState(false)
  const [userConfirmedItems, setUserConfirmedItems] = useState<any[]>([])
  const detectedItems = data.detected_items || []
  const unidentifiedItems = data.unidentified_items || []
  const expiryAlerts = data.expiry_alerts || []
  const recipeSuggestions = data.recipe_suggestions || []
  const discussionResult = data.discussion_result || {}
  const youtubeVideos = data.youtube_videos || {} // 백엔드에서 받은 유튜브 영상 데이터
  const finalRecommendation = data.final_recommendation || {}

  // 식단 타입 선택 시 API 호출
  const handleDietTypeSelect = async (type: DietType) => {
    setSelectedDietType(type)
    
    if (!type) {
      setFilteredRecipes([])
      return
    }

    setIsLoadingRecipes(true)
    try {
      const response = await axios.post(
        'http://localhost:8000/api/v1/recipes/by-diet-type',
        {
          diet_type: type,
          detected_items: detectedItems,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
      
      // API 응답에서 유튜브 영상 데이터 가져오기
      const apiYoutubeVideos = response.data.youtube_videos || {}
      
      // API 응답을 RecipeCard 형식에 맞게 변환
      const recipes = response.data.recipes.map((recipe: any) => {
        const recipeTitle = recipe.title
        const videos = apiYoutubeVideos[recipeTitle] || []
        
        return {
          id: recipe.id || `recipe-${Math.random()}`,
          title: recipe.title,
          description: recipe.description || '',
          cookingTime: recipe.cooking_time || '20분',
          difficulty: recipe.difficulty === '하' ? '초' : recipe.difficulty === '중' ? '중' : '고',
          ingredients: recipe.ingredients || [],
          calories: recipe.calories,
          image: recipe.image,
          recommendedVideos: videos.length > 0 ? videos : undefined,
          match_rate: recipe.match_rate,
        }
      })
      
      setFilteredRecipes(recipes)
    } catch (error: any) {
      console.error('레시피 추천 오류:', error)
      // API 실패 시 예시 데이터 사용
      setFilteredRecipes(getFallbackRecipes(type))
    } finally {
      setIsLoadingRecipes(false)
    }
  }

  // API 실패 시 사용할 예시 레시피
  const getFallbackRecipes = (type: DietType): any[] => {
    if (!type) return []
    
    const fallbackRecipes = {
      diet: [
        {
          id: 'diet-1',
          title: '닭가슴살 샐러드',
          description: '고단백 저칼로리 샐러드로 다이어트에 최적',
          cookingTime: '15분',
          difficulty: '초' as const,
          ingredients: ['닭가슴살', '양상추', '토마토', '오이', '올리브오일'],
          calories: 250,
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80',
        },
        {
          id: 'diet-2',
          title: '그린 스무디 볼',
          description: '신선한 채소와 과일로 만든 영양 만점 스무디',
          cookingTime: '10분',
          difficulty: '초' as const,
          ingredients: ['시금치', '바나나', '사과', '요거트'],
          calories: 180,
          image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=800&h=600&fit=crop&q=80',
        },
        {
          id: 'diet-3',
          title: '구운 채소와 두부',
          description: '오븐에 구운 채소와 두부로 만든 저칼로리 요리',
          cookingTime: '25분',
          difficulty: '중' as const,
          ingredients: ['두부', '브로콜리', '당근', '양파', '올리브오일'],
          calories: 220,
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&q=80',
        },
      ],
      health: [
        {
          id: 'health-1',
          title: '연어와 퀴노아 샐러드',
          description: '오메가3가 풍부한 연어와 완전식품 퀴노아의 만남',
          cookingTime: '20분',
          difficulty: '중' as const,
          ingredients: ['연어', '퀴노아', '아보카도', '시금치', '견과류'],
          calories: 420,
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&q=80',
        },
        {
          id: 'health-2',
          title: '영양 밥',
          description: '잡곡과 채소가 듬뿍 들어간 영양 만점 밥',
          cookingTime: '30분',
          difficulty: '중' as const,
          ingredients: ['현미', '보리', '콩', '당근', '버섯'],
          calories: 350,
          image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop&q=80',
        },
        {
          id: 'health-3',
          title: '생선 구이와 나물',
          description: '고등어 구이와 다양한 나물로 구성된 건강식',
          cookingTime: '25분',
          difficulty: '중' as const,
          ingredients: ['고등어', '시금치', '콩나물', '미역', '고추장'],
          calories: 380,
          image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=80',
        },
      ],
      patient: [
        {
          id: 'patient-1',
          title: '무른 죽',
          description: '소화가 잘 되는 부드러운 죽. 환자 회복에 도움',
          cookingTime: '30분',
          difficulty: '초' as const,
          ingredients: ['쌀', '물', '소금'],
          calories: 150,
          image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop&q=80',
        },
        {
          id: 'patient-2',
          title: '영양 스프',
          description: '부드럽고 영양이 풍부한 스프. 환자 식단에 적합',
          cookingTime: '20분',
          difficulty: '초' as const,
          ingredients: ['닭고기', '당근', '양파', '감자'],
          calories: 200,
          image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop&q=80',
        },
        {
          id: 'patient-3',
          title: '퓌레',
          description: '채소를 갈아 만든 부드러운 퓌레. 소화가 쉬움',
          cookingTime: '15분',
          difficulty: '초' as const,
          ingredients: ['당근', '호박', '감자', '양파'],
          calories: 120,
          image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&h=600&fit=crop&q=80',
        },
      ],
    }

    return fallbackRecipes[type] || []
  }

  const handleItemsConfirmed = (confirmedItems: any[]) => {
    setUserConfirmedItems([...userConfirmedItems, ...confirmedItems])
    // 여기서 재분석을 트리거할 수도 있습니다
  }

  return (
    <div className="space-y-6">
      {/* 파악되지 않은 재료 */}
      {unidentifiedItems.length > 0 && (
        <UnidentifiedItems
          unidentifiedItems={unidentifiedItems}
          onItemsConfirmed={handleItemsConfirmed}
        />
      )}

      {/* 에이전트 간 토론 결과 */}
      {discussionResult.discussion && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-emerald rounded-2xl p-6 shadow-3d-emerald"
        >
          <div className="flex items-center space-x-3 mb-4">
            <ChefHat className="w-6 h-6 text-slate-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                ⭐ 5성급 호텔 셰프 논의 결과
              </h2>
              <p className="text-slate-600 text-sm">
                미슐랭 스타 셰프가 Recipe Agent와 Recommendation Agent와 함께 논의한 결과
              </p>
            </div>
          </div>
          <div className="glass rounded-lg p-4 mb-4 border border-slate-200/30">
            <p className="text-slate-700 whitespace-pre-wrap">
              {discussionResult.discussion}
            </p>
          </div>
          {discussionResult.selected_recipes && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 mb-2">
                최종 선택된 요리:
              </h3>
              {discussionResult.selected_recipes.map(
                (recipe: any, index: number) => (
                  <div
                    key={index}
                    className="glass rounded-lg p-3 border border-green-200/50 bg-green-50/30"
                  >
                    <div className="font-semibold text-slate-800">
                      {index + 1}. {recipe.title}
                    </div>
                    <div className="text-sm text-slate-600 mt-1">
                      {recipe.reason}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* 식단 타입 선택 */}
      {detectedItems.length > 0 && (
        <DietTypeSelector
          selectedType={selectedDietType}
          onSelect={handleDietTypeSelect}
          detectedItems={detectedItems}
        />
      )}

      {/* 선택한 식단 타입에 맞는 레시피 */}
      {selectedDietType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-emerald rounded-2xl p-6 shadow-3d-emerald"
        >
          <div className="flex items-center space-x-3 mb-6">
            <ChefHat className="w-6 h-6 text-slate-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                {selectedDietType === 'diet' && '다이어트식'}
                {selectedDietType === 'health' && '건강식'}
                {selectedDietType === 'patient' && '환자식'} 추천 레시피
              </h2>
              <p className="text-slate-600 text-sm">
                감지된 식재료를 활용한 맞춤 레시피 3가지
              </p>
            </div>
          </div>
          
          {isLoadingRecipes ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-slate-500 animate-spin mb-4" />
              <p className="text-slate-600">레시피를 추천하고 있습니다...</p>
            </div>
          ) : filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {filteredRecipes.map((recipe, index) => {
                // 백엔드에서 받은 유튜브 영상 데이터 연결
                const recipeTitle = recipe.title
                const videos = youtubeVideos[recipeTitle] || []
                const recipeWithVideos = {
                  ...recipe,
                  recommendedVideos: videos.length > 0 ? videos : recipe.recommendedVideos,
                }
                return (
                  <RecipeCard key={recipe.id} recipe={recipeWithVideos} index={index} />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>해당 식단 타입에 맞는 레시피를 찾을 수 없습니다.</p>
              <p className="text-sm mt-2">다른 식단 타입을 선택해보세요.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* 감지된 식재료 */}
      {detectedItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-emerald rounded-2xl p-6 shadow-3d-emerald perspective-3d transform-3d"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Package className="w-6 h-6 text-slate-600" />
            <h2 className="text-2xl font-bold text-slate-800">감지된 식재료</h2>
            <span className="text-slate-600">({detectedItems.length}개)</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {detectedItems.map((item: any, index: number) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-lg p-4 border border-slate-200/30 hover:bg-slate-50/70 hover:border-slate-300 transition-all transform-3d card-3d shadow-3d"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-slate-800">{item.name}</h3>
                  <span className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded-full font-medium border border-slate-200">
                    {item.category}
                  </span>
                </div>
                <div className="text-sm text-slate-700 space-y-1">
                  <p>수량: {item.quantity} {item.unit}</p>
                  <p>신선도: {item.freshness}</p>
                  <p className="text-xs text-slate-500">
                    신뢰도: {(item.confidence * 100).toFixed(0)}%
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 유통기한 알림 */}
      {expiryAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-red-300/50 shadow-3d transform-3d"
        >
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-slate-800">유통기한 알림</h2>
          </div>
          <ul className="space-y-2">
            {expiryAlerts.map((alert: string, index: number) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-slate-800 flex items-center space-x-2 glass px-3 py-2 rounded-lg shadow-3d transform-3d"
              >
                <Clock className="w-4 h-4 text-red-500" />
                <span className="font-medium">{alert}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* 레시피 추천 (기본) - 최고의 요리 2개 */}
      {recipeSuggestions.length > 0 && !selectedDietType && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-emerald rounded-2xl p-6 shadow-3d-emerald perspective-3d transform-3d"
        >
          <div className="flex items-center space-x-3 mb-4">
            <ChefHat className="w-6 h-6 text-slate-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                ⭐ 최고의 요리 추천
              </h2>
              <p className="text-slate-600 text-sm">
                5성급 호텔 셰프가 냉장고 재료만으로 선정한 미식가 수준의 요리
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recipeSuggestions.map((recipe: any, index: number) => {
              const recipeTitle = recipe.title
              const videos = youtubeVideos[recipeTitle] || []
              const recipeWithVideos = {
                id: `recipe-${index}`,
                title: recipe.title,
                description: recipe.description || '',
                cookingTime: recipe.cooking_time || '20분',
                difficulty: (recipe.difficulty === '하' ? '초' : recipe.difficulty === '중' ? '중' : '고') as '초' | '중' | '고',
                ingredients: recipe.ingredients_needed || [],
                calories: recipe.calories,
                recommendedVideos: videos.length > 0 ? videos : undefined,
                match_rate: recipe.match_rate,
              }
              return (
                <RecipeCard key={index} recipe={recipeWithVideos} index={index} />
              )
            })}
          </div>
        </motion.div>
      )}

      {/* 최종 추천 */}
      {finalRecommendation.summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-slate-50/90 to-blue-50/90 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 shadow-xl"
        >
          <div className="flex items-center space-x-3 mb-4">
            <TrendingUp className="w-6 h-6 text-slate-600" />
            <div>
              <h2 className="text-2xl font-bold text-slate-800">
                ⭐ 5성급 호텔 셰프 추천 요약
              </h2>
              <p className="text-sm text-slate-600">
                "냉장고를 부탁해" - 미슐랭 스타 셰프가 선정한 최고의 요리
              </p>
            </div>
          </div>
          
          {/* 셰프 메시지 */}
          {finalRecommendation.chef_message && (
            <div className="mb-6 glass rounded-lg p-4 border border-yellow-300/50 bg-gradient-to-r from-yellow-50/50 to-amber-50/50">
              <p className="text-slate-800 font-medium">{finalRecommendation.chef_message}</p>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-lg p-4 text-center border border-slate-200/30 shadow-3d transform-3d card-3d">
              <p className="text-3xl font-bold text-slate-800">
                {finalRecommendation.summary['총 식재료'] || 0}
              </p>
              <p className="text-slate-600 text-sm mt-1">총 식재료</p>
            </div>
            <div className="bg-red-50/70 rounded-lg p-4 text-center border border-red-200/30 shadow-sm">
              <p className="text-3xl font-bold text-red-600">
                {finalRecommendation.summary['긴급 소비 필요'] || 0}
              </p>
              <p className="text-slate-600 text-sm mt-1">긴급 소비</p>
            </div>
            <div className="glass rounded-lg p-4 text-center border border-slate-200/30 shadow-3d transform-3d card-3d">
              <p className="text-3xl font-bold text-slate-700">
                {finalRecommendation.summary['안전 재고'] || 0}
              </p>
              <p className="text-slate-600 text-sm mt-1">안전 재고</p>
            </div>
          </div>

          {finalRecommendation.priority_actions && (
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-800 mb-2">우선 액션</h3>
              {finalRecommendation.priority_actions.map(
                (action: string, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="glass rounded-lg p-3 text-slate-800 border border-slate-200/30 shadow-3d transform-3d"
                  >
                    {action}
                  </motion.div>
                )
              )}
            </div>
          )}

          {finalRecommendation.shopping_list && (
            <div className="mt-6 glass rounded-lg p-4 border border-slate-200/30 shadow-3d transform-3d">
              <div className="flex items-center space-x-2 mb-2">
                <ShoppingCart className="w-5 h-5 text-slate-600" />
                <h3 className="font-semibold text-slate-800">장보기 리스트</h3>
              </div>
              <p className="text-slate-700">
                부족 품목:{' '}
                {finalRecommendation.shopping_list['부족 품목']?.join(', ') ||
                  '없음'}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
