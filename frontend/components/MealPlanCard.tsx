'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UtensilsCrossed, Pizza, ChefHat, Sparkles, Users, X } from 'lucide-react'
import RecipeDetail from './RecipeDetail'

interface MealPlan {
  id: string
  type: 'korean' | 'western' | 'chinese' | 'special' | 'party'
  title: string
  description: string
  meals: string[]
  calories?: number
  duration?: string
}

interface MealPlanCardProps {
  mealPlan: MealPlan
  index: number
}

export default function MealPlanCard({ mealPlan, index }: MealPlanCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [showDetail, setShowDetail] = useState(false)

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

  // 식단 타입별 기본 레시피 생성
  const getRecipeFromMealPlan = () => {
    const recipeData = {
      korean: {
        title: '된장찌개 정식',
        description: '구수한 된장찌개와 밥, 나물로 구성된 전통 한식 정식',
        cookingTime: '25분',
        difficulty: '중' as const,
        ingredients: [
          { name: '된장', amount: '2큰술', gram: 40 },
          { name: '두부', amount: '1/2모', gram: 200 },
          { name: '애호박', amount: '1/3개', gram: 100 },
          { name: '양파', amount: '1/2개', gram: 100 },
          { name: '대파', amount: '1대', gram: 50 },
          { name: '다진마늘', amount: '1큰술', gram: 10 },
          { name: '고춧가루', amount: '1작은술', gram: 3 },
          { name: '물', amount: '600ml', gram: 600 },
        ],
        steps: [
          {
            step: 1,
            description: '냄비에 물을 넣고 된장을 체에 걸러 풀어 끓입니다',
            duration: '5분',
            tip: '된장을 체에 걸러 넣으면 덩어리 없이 깔끔하게 풀립니다',
          },
          {
            step: 2,
            description: '애호박과 양파를 썰어 넣고 끓입니다',
            duration: '5분',
            tip: '채소는 먼저 넣어야 국물에 단맛이 우러납니다',
          },
          {
            step: 3,
            description: '두부를 넣고 2분간 끓입니다',
            duration: '2분',
            tip: '두부는 너무 오래 끓이면 부서지므로 적당히만 끓여주세요',
          },
          {
            step: 4,
            description: '대파와 다진마늘, 고춧가루를 넣어 마무리합니다',
            duration: '3분',
            tip: '대파는 마지막에 넣어야 아삭한 식감을 유지할 수 있습니다',
          },
        ],
        sauces: [
          {
            name: '된장찌개 양념',
            ingredients: [
              { name: '된장', amount: '2큰술', gram: 40 },
              { name: '고춧가루', amount: '1작은술', gram: 3 },
              { name: '다진마늘', amount: '1큰술', gram: 10 },
            ],
            steps: [
              '된장을 체에 걸러 덩어리를 제거합니다',
              '고춧가루와 다진마늘을 섞어줍니다',
            ],
            tip: '된장은 체에 걸러 사용하면 더 부드러운 맛이 납니다',
          },
        ],
        tips: [
          '다시마와 멸치로 육수를 내면 더욱 깊은 맛이 납니다',
          '된장은 체에 걸러 넣으면 덩어리 없이 깔끔합니다',
          '대파는 마지막에 넣어야 향이 살아있습니다',
        ],
        recommendedVideos: [
          {
            id: 'dummy-korean-1',
            title: '된장찌개 만들기 - 백종원의 요리비책',
            channel: '백종원의 요리비책',
          },
          {
            id: 'dummy-korean-2',
            title: '전통 된장찌개 레시피 - 만개의레시피',
            channel: '만개의레시피',
          },
        ],
      },
      western: {
        title: '토마토 파스타 세트',
        description: '신선한 토마토 소스 파스타와 샐러드, 빵으로 구성된 양식 세트',
        cookingTime: '30분',
        difficulty: '중' as const,
        ingredients: [
          { name: '파스타면', amount: '200g', gram: 200 },
          { name: '토마토소스', amount: '5큰술', gram: 100 },
          { name: '양파', amount: '1/2개', gram: 100 },
          { name: '다진마늘', amount: '1큰술', gram: 10 },
          { name: '올리브오일', amount: '2큰술', gram: 20 },
          { name: '바질', amount: '적당량', gram: 5 },
          { name: '파르메산 치즈', amount: '적당량', gram: 20 },
        ],
        steps: [
          {
            step: 1,
            description: '끓는 소금물에 파스타를 넣고 포장지 표시 시간보다 1분 적게 삶습니다',
            duration: '8분',
            tip: '파스타는 알덴테(살짝 씹히는 정도)로 삶으면 더 맛있습니다',
          },
          {
            step: 2,
            description: '팬에 올리브오일과 다진마늘을 넣고 약한 불에 볶습니다',
            duration: '2분',
            tip: '마늘을 너무 오래 볶으면 쓴맛이 나므로 주의하세요',
          },
          {
            step: 3,
            description: '양파를 넣고 볶다가 토마토소스를 넣고 끓입니다',
            duration: '5분',
            tip: '토마토소스는 약한 불에서 천천히 끓여야 맛이 좋습니다',
          },
          {
            step: 4,
            description: '삶은 파스타와 소스를 섞고 바질과 치즈를 올려 완성합니다',
            duration: '3분',
            tip: '파스타 삶은 물을 조금 넣으면 소스가 더 부드러워집니다',
          },
        ],
        tips: [
          '파스타는 알덴테로 삶아야 식감이 좋습니다',
          '마늘은 약한 불에서 천천히 볶아야 향이 좋습니다',
          '바질은 마지막에 올려야 향이 살아있습니다',
        ],
        recommendedVideos: [
          {
            id: 'dummy-western-1',
            title: '토마토 파스타 만들기 - 백종원의 요리비책',
            channel: '백종원의 요리비책',
          },
          {
            id: 'dummy-western-2',
            title: '파스타 레시피 - 만개의레시피',
            channel: '만개의레시피',
          },
        ],
      },
      chinese: {
        title: '짜장면 세트',
        description: '진한 춘장 소스의 짜장면과 탕수육으로 구성된 중식 세트',
        cookingTime: '35분',
        difficulty: '중' as const,
        ingredients: [
          { name: '짜장면', amount: '1인분', gram: 200 },
          { name: '춘장', amount: '3큰술', gram: 60 },
          { name: '돼지고기', amount: '100g', gram: 100 },
          { name: '양파', amount: '1개', gram: 200 },
          { name: '감자', amount: '1개', gram: 150 },
          { name: '애호박', amount: '1/2개', gram: 150 },
          { name: '식용유', amount: '3큰술', gram: 30 },
          { name: '설탕', amount: '1큰술', gram: 15 },
        ],
        steps: [
          {
            step: 1,
            description: '돼지고기와 채소를 한 입 크기로 썰어 준비합니다',
            duration: '5분',
            tip: '채소는 크기를 비슷하게 맞추면 익는 시간이 같아 좋습니다',
          },
          {
            step: 2,
            description: '팬에 기름을 두르고 춘장을 볶아 기름을 빼냅니다',
            duration: '3분',
            tip: '춘장을 먼저 볶으면 쓴맛이 줄어듭니다',
          },
          {
            step: 3,
            description: '돼지고기를 볶다가 양파, 감자, 애호박을 넣고 볶습니다',
            duration: '10분',
            tip: '고기는 센 불에서 빠르게 볶아야 부드럽습니다',
          },
          {
            step: 4,
            description: '볶은 춘장과 물을 넣고 끓인 후 설탕으로 간을 맞춥니다',
            duration: '10분',
            tip: '물전분을 넣으면 소스가 더욱 걸쭉해집니다',
          },
          {
            step: 5,
            description: '삶은 면에 소스를 얹어 완성합니다',
            duration: '2분',
            tip: '면은 찬물에 헹구면 더욱 쫄깃합니다',
          },
        ],
        tips: [
          '춘장은 먼저 볶아야 쓴맛이 줄어듭니다',
          '채소는 크기를 비슷하게 썰어야 골고루 익습니다',
          '물전분을 넣으면 소스가 더욱 윤기나고 걸쭉해집니다',
        ],
        recommendedVideos: [
          {
            id: 'dummy-chinese-1',
            title: '짜장면 만들기 - 백종원의 요리비책',
            channel: '백종원의 요리비책',
          },
          {
            id: 'dummy-chinese-2',
            title: '중화요리 레시피 - 만개의레시피',
            channel: '만개의레시피',
          },
        ],
      },
      special: {
        title: '한우 스테이크 코스',
        description: '프리미엄 한우 스테이크와 와인으로 구성된 특별한 날 코스 요리',
        cookingTime: '40분',
        difficulty: '고' as const,
        ingredients: [
          { name: '한우 등심', amount: '200g', gram: 200 },
          { name: '로즈마리', amount: '2줄기', gram: 5 },
          { name: '타임', amount: '2줄기', gram: 3 },
          { name: '마늘', amount: '3쪽', gram: 15 },
          { name: '버터', amount: '30g', gram: 30 },
          { name: '올리브오일', amount: '2큰술', gram: 20 },
          { name: '소금', amount: '적당량', gram: 5 },
          { name: '후추', amount: '적당량', gram: 2 },
        ],
        steps: [
          {
            step: 1,
            description: '스테이크를 실온에 30분 정도 두어 온도를 맞춥니다',
            duration: '30분',
            tip: '고기를 실온에 두면 속까지 골고루 익습니다',
          },
          {
            step: 2,
            description: '소금과 후추로 간을 하고 올리브오일을 바릅니다',
            duration: '2분',
            tip: '간은 조리 직전에 해야 육즙이 빠지지 않습니다',
          },
          {
            step: 3,
            description: '달군 팬에 스테이크를 올려 센 불에서 앞뒤로 굽습니다',
            duration: '6분',
            tip: '미디엄은 앞뒤 각 3분씩 구우면 됩니다',
          },
          {
            step: 4,
            description: '버터, 마늘, 허브를 넣고 스푼으로 기름을 끼얹으며 굽습니다',
            duration: '3분',
            tip: '버터로 베이스팅하면 풍미가 더욱 좋아집니다',
          },
          {
            step: 5,
            description: '알루미늄 포일로 감싸 5분간 휴지시킨 후 썰어 서빙합니다',
            duration: '5분',
            tip: '휴지 시간을 가져야 육즙이 고기 전체에 퍼집니다',
          },
        ],
        tips: [
          '고기는 반드시 실온에 두었다가 조리하세요',
          '간은 조리 직전에 해야 육즙 손실이 적습니다',
          '휴지 시간을 꼭 가져야 육즙이 고기에 고루 퍼집니다',
        ],
        recommendedVideos: [
          {
            id: 'dummy-special-1',
            title: '스테이크 굽는 법 - 백종원의 요리비책',
            channel: '백종원의 요리비책',
          },
          {
            id: 'dummy-special-2',
            title: '완벽한 스테이크 레시피 - 만개의레시피',
            channel: '만개의레시피',
          },
        ],
      },
      party: {
        title: '집들이 파티 플래터',
        description: '치킨, 감자튀김, 샐러드로 구성된 손님 접대용 파티 메뉴',
        cookingTime: '50분',
        difficulty: '중' as const,
        ingredients: [
          { name: '닭다리', amount: '6개', gram: 600 },
          { name: '감자', amount: '3개', gram: 450 },
          { name: '양상추', amount: '1통', gram: 200 },
          { name: '토마토', amount: '2개', gram: 200 },
          { name: '오이', amount: '1개', gram: 150 },
          { name: '마늘', amount: '5쪽', gram: 25 },
          { name: '간장', amount: '3큰술', gram: 45 },
          { name: '올리고당', amount: '2큰술', gram: 30 },
        ],
        steps: [
          {
            step: 1,
            description: '닭다리는 깨끗이 씻어 물기를 제거하고 밑간을 합니다',
            duration: '10분',
            tip: '밑간은 최소 30분 이상 재워야 맛이 잘 배어듭니다',
          },
          {
            step: 2,
            description: '감자는 깨끗이 씻어 채썰어 튀김 준비를 합니다',
            duration: '5분',
            tip: '감자는 물에 담가 전분을 빼면 더 바삭합니다',
          },
          {
            step: 3,
            description: '180도 기름에 닭다리를 넣고 15분간 튀깁니다',
            duration: '15분',
            tip: '중간 불에서 천천히 튀겨야 속까지 익습니다',
          },
          {
            step: 4,
            description: '감자튀김을 바삭하게 튀겨냅니다',
            duration: '10분',
            tip: '감자는 두 번 튀기면 더욱 바삭합니다',
          },
          {
            step: 5,
            description: '샐러드 채소를 씻어 물기를 빼고 예쁘게 담아냅니다',
            duration: '10분',
            tip: '채소는 찬물에 담갔다가 사용하면 더 아삭합니다',
          },
        ],
        tips: [
          '닭고기는 밑간을 충분히 해야 맛이 좋습니다',
          '감자는 두 번 튀기면 더욱 바삭합니다',
          '샐러드는 먹기 직전에 드레싱을 뿌리세요',
        ],
        recommendedVideos: [
          {
            id: 'dummy-party-1',
            title: '치킨 만들기 - 백종원의 요리비책',
            channel: '백종원의 요리비책',
          },
          {
            id: 'dummy-party-2',
            title: '파티 음식 레시피 - 만개의레시피',
            channel: '만개의레시피',
          },
        ],
      },
    }

    const recipe = recipeData[mealPlan.type]
    return {
      id: mealPlan.id,
      ...recipe,
      calories: mealPlan.calories,
      image: thumbnails[mealPlan.type],
    }
  }

  const handleClick = () => {
    setIsFlipped(true)
    setTimeout(() => {
      setShowDetail(true)
      setIsFlipped(false)
    }, 300)
  }

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
                src={thumbnails[mealPlan.type]}
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
          <RecipeDetail 
            recipe={getRecipeFromMealPlan()} 
            onClose={() => setShowDetail(false)} 
          />
        )}
      </AnimatePresence>
    </>
  )
}
