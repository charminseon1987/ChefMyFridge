'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChefHat, Flame, Percent } from 'lucide-react'
import RecipeDetail, { Recipe, Ingredient } from './RecipeDetail'



interface RecipeCardProps {
  recipe: Recipe
  index: number
}

export default function RecipeCard({ recipe, index }: RecipeCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

  const difficultyColors = {
    초: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    중: 'text-amber-600 bg-amber-50 border-amber-200',
    고: 'text-rose-600 bg-rose-50 border-rose-200',
  }

  const matchRateColor = (rate: number) => {
    if (rate >= 80) return 'bg-emerald-500'
    if (rate >= 60) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  // 재료 형식 변환 (기존 string[] 또는 Ingredient[])
  const getIngredientNames = (): string[] => {
    if (!recipe.ingredients || recipe.ingredients.length === 0) return []
    
    if (typeof recipe.ingredients[0] === 'string') {
      return recipe.ingredients as string[]
    }
    return (recipe.ingredients as Ingredient[]).map(ing => ing.name)
  }

  const ingredientNames = getIngredientNames()

  const handleClick = () => {
    setIsFlipped(true)
    setTimeout(() => {
      setShowDetail(true)
      setIsFlipped(false)
    }, 300)
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
            {/* 레시피 이미지 영역 */}
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center group/image">
              {recipe.image ? (
                <>
                  <img
                    src={recipe.image}
                    alt={recipe.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/image:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </>
              ) : (
                <ChefHat className="w-16 h-16 text-slate-400" />
              )}
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${difficultyColors[recipe.difficulty]}`}
                >
                  {recipe.difficulty}
                </span>
              </div>
              {recipe.match_rate !== undefined && (
                <div className="absolute top-3 left-3 z-10">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-1 ${matchRateColor(recipe.match_rate)}`}>
                    <Percent className="w-3 h-3" />
                    {recipe.match_rate}% 매칭
                  </div>
                </div>
              )}
            </div>

            {/* 레시피 정보 */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-slate-600 transition-colors">
                {recipe.title}
              </h3>
              <p className="text-sm text-slate-600 line-clamp-2">{recipe.description}</p>

              {/* 메타 정보 */}
              <div className="flex items-center justify-between text-sm text-slate-500">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>{recipe.cookingTime}</span>
                </div>
                {recipe.calories && (
                  <div className="flex items-center space-x-1">
                    <Flame className="w-4 h-4" />
                    <span>{recipe.calories}kcal</span>
                  </div>
                )}
              </div>

        {/* 주요 재료 */}
        <div className="pt-3 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2">주요 재료</p>
          <div className="flex flex-wrap gap-2">
            {ingredientNames.slice(0, 3).map((ingredient, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full border border-slate-200"
              >
                {ingredient}
              </span>
            ))}
            {ingredientNames.length > 3 && (
              <span className="px-2 py-1 text-xs text-slate-500">
                +{ingredientNames.length - 3}
              </span>
            )}
          </div>
        </div>

              {/* 클릭 안내 */}
              <div className="pt-3 border-t border-slate-200">
                <p className="text-xs text-center text-slate-400 italic">클릭하여 상세 레시피 보기</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* 상세 레시피 모달 */}
      <AnimatePresence>
        {showDetail && (
          <RecipeDetail recipe={recipe} onClose={() => setShowDetail(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
