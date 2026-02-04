'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import ImageUpload from '@/components/ImageUpload'
import Header from '@/components/Header'
import RecipeCard from '@/components/RecipeCard'
import MealPlanCard from '@/components/MealPlanCard'
import { motion } from 'framer-motion'
import { ChefHat, UtensilsCrossed } from 'lucide-react'

// 배경 컴포넌트를 동적으로 로드 (SSR 방지)
const Background3D = dynamic(() => import('@/components/Background3D'), {
  ssr: false,
  loading: () => (
      <div className="w-full h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100"></div>
  ),
})

// 예시 레시피 데이터
const exampleRecipes = [
  {
    id: '1',
    title: '시금치 두부 된장국',
    description: '신선한 시금치와 부드러운 두부가 만나 담백하고 구수한 된장국의 맛을 낸다',
    cookingTime: '15분',
    difficulty: '초' as const,
    ingredients: [
      { name: '시금치', amount: '2~3줌', gram: 200 },
      { name: '두부', amount: '1/2모', gram: 200 },
      { name: '된장', amount: '2큰술', gram: 40 },
      { name: '다진마늘', amount: '0.5큰술', gram: 5 },
      { name: '대파', amount: '1대', gram: 50 },
      { name: '다시마', amount: '5×5cm 1장', gram: 5 },
      { name: '멸치', amount: '13~15마리', gram: 15 },
      { name: '물', amount: '800ml', gram: 800 },
    ],
    calories: 120,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop&q=80',
    steps: [
      {
        step: 1,
        description: '시금치를 깨끗이 씻고 두부는 2cm x 2cm 크기로 썹습니다',
        duration: '3분',
        tip: '시금치는 뿌리 부분을 잘 제거하고 흐르는 물에 여러 번 헹궈주세요',
      },
      {
        step: 2,
        description: '냄비에 물을 넣고 된장을 체에 걸러 풀어 끓입니다',
        duration: '5분',
        tip: '된장을 체에 걸러 넣으면 덩어리 없이 깔끔하게 풀립니다',
      },
      {
        step: 3,
        description: '두부를 넣고 2분간 끓입니다',
        duration: '2분',
        tip: '두부는 너무 오래 끓이면 부서지므로 적당히만 끓여주세요',
      },
      {
        step: 4,
        description: '시금치와 대파를 넣고 한 번 더 끓인 후 마늘을 넣어 마무리합니다',
        duration: '2분',
        tip: '시금치는 마지막에 넣어야 아삭한 식감을 유지할 수 있습니다',
      },
    ],
    sauces: [
      {
        name: '된장국 기본 양념',
        ingredients: [
          { name: '된장', amount: '2큰술', gram: 40 },
          { name: '다진마늘', amount: '0.5큰술', gram: 5 },
          { name: '국간장', amount: '1작은술', gram: 5 },
        ],
        steps: [
          '된장을 체에 걸러 덩어리를 제거합니다',
          '다진마늘과 국간장을 넣고 고루 섞어줍니다',
          '사용하기 전에 미리 준비해두면 편리합니다',
        ],
        tip: '된장은 체에 걸러 사용하면 더 부드러운 맛이 납니다',
      },
    ],
    tips: [
      '다시마와 멸치로 육수를 내면 시판 육수보다 훨씬 깊고 구수한 맛이 납니다',
      '시금치는 마지막에 넣어야 아삭한 식감과 초록색을 유지할 수 있습니다',
      '된장은 체에 걸러 넣으면 덩어리 없이 깔끔하게 풀립니다',
      '두부는 너무 오래 끓이면 부서지므로 적당히만 끓여주세요',
      '대파는 흰 부분과 초록 부분을 모두 사용하면 더욱 구수한 맛이 납니다',
    ],
    recommendedVideos: [
      {
        id: 'dummy-video-1',
        title: '시금치 된장국 만들기 - 백종원의 요리비책',
        channel: '백종원의 요리비책',
        thumbnailUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80',
      },
      {
        id: 'dummy-video-2',
        title: '두부 된장국 레시피 - 만개의레시피',
        channel: '만개의레시피',
        thumbnailUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80',
      },
    ],
  },
  {
    id: '2',
    title: '당근 카레',
    description: '달콤한 당근이 들어간 부드러운 카레. 영양만점이고 아이들도 좋아하는 메뉴',
    cookingTime: '30분',
    difficulty: '중' as const,
    ingredients: [
      { name: '닭고기', amount: '400g', gram: 400 },
      { name: '당근', amount: '1/2개', gram: 75 },
      { name: '양파', amount: '1개', gram: 200 },
      { name: '감자', amount: '2개', gram: 300 },
      { name: '카레가루', amount: '100g', gram: 100 },
      { name: '물', amount: '600ml', gram: 600 },
      { name: '식용유', amount: '2큰술', gram: 20 },
    ],
    calories: 350,
    image: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=600&fit=crop&q=80',
    steps: [
      {
        step: 1,
        description: '닭고기를 한 입 크기로 썰고 당근과 양파, 감자도 2cm 크기로 썹니다',
        duration: '5분',
        tip: '당근과 감자는 크기를 비슷하게 맞추면 익는 시간이 같아 더 좋습니다',
      },
      {
        step: 2,
        description: '팬에 기름을 두르고 닭고기를 볶습니다',
        duration: '5분',
        tip: '닭고기는 겉면이 하얗게 익을 때까지 충분히 볶아야 비린내가 없습니다',
      },
      {
        step: 3,
        description: '양파를 먼저 넣고 볶다가 당근과 감자를 넣고 볶습니다',
        duration: '5분',
        tip: '양파를 먼저 볶으면 단맛이 나고, 당근과 감자를 나중에 넣으면 식감이 좋습니다',
      },
      {
        step: 4,
        description: '물을 넣고 끓인 후 감자가 익을 때까지 끓입니다',
        duration: '10분',
        tip: '감자가 포크로 찔렀을 때 부드럽게 들어가면 익은 것입니다',
      },
      {
        step: 5,
        description: '불을 끈 후 카레가루를 넣고 저어가며 끓여 완성합니다',
        duration: '5분',
        tip: '카레가루는 불을 끈 후에 넣고 저어주면 덩어리가 생기지 않습니다',
      },
    ],
    sauces: [
      {
        name: '카레 기본 양념',
        ingredients: [
          { name: '카레가루', amount: '100g', gram: 100 },
          { name: '고춧가루', amount: '1작은술', gram: 3 },
          { name: '후추', amount: '약간', gram: 1 },
        ],
        steps: [
          '카레가루에 고춧가루와 후추를 섞어줍니다',
          '사용하기 직전에 준비하는 것이 좋습니다',
        ],
        tip: '카레가루는 볶아서 사용하면 더욱 진한 맛이 납니다',
      },
    ],
    tips: [
      '당근은 껍질을 벗기지 않고 깨끗이 씻어 사용하면 영양소 손실이 적습니다',
      '카레는 끓인 후 10분 정도 두었다가 다시 한 번 끓이면 더욱 진한 맛이 납니다',
      '감자는 너무 작게 썰면 으깨지므로 적당한 크기로 썰어주세요',
      '카레가루는 불을 끈 후에 넣어야 덩어리가 생기지 않습니다',
      '카레가 너무 걸쭉하면 물을 조금 더 넣어 조절하세요',
    ],
    recommendedVideos: [
      {
        id: 'dummy-video-3',
        title: '당근 카레 만들기 - 백종원의 요리비책',
        channel: '백종원의 요리비책',
        thumbnailUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=450&fit=crop&q=80',
      },
      {
        id: 'dummy-video-4',
        title: '카레 만들기 레시피 - 만개의레시피',
        channel: '만개의레시피',
        thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=450&fit=crop&q=80',
      },
    ],
  },
  {
    id: '3',
    title: '브로콜리 볶음밥',
    description: '영양 가득한 브로콜리와 계란을 넣은 한 그릇 볶음밥. 간단하지만 든든한 한 끼',
    cookingTime: '20분',
    difficulty: '초' as const,
    ingredients: [
      { name: '브로콜리', amount: '1개', gram: 260 },
      { name: '계란', amount: '2개', gram: 100 },
      { name: '밥', amount: '1.5공기', gram: 300 },
      { name: '양파', amount: '1/2개', gram: 100 },
      { name: '당근', amount: '1/3개', gram: 50 },
      { name: '베이컨', amount: '2줄', gram: 30 },
      { name: '다진마늘', amount: '1큰술', gram: 10 },
      { name: '굴소스', amount: '1큰술', gram: 15 },
      { name: '식용유', amount: '2큰술', gram: 20 },
    ],
    calories: 280,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop&q=80',
    steps: [
      {
        step: 1,
        description: '브로콜리는 작은 송이로 나누고 20초 정도 데칩니다',
        duration: '3분',
        tip: '브로콜리를 너무 오래 데치면 식감이 없어지므로 20초 정도만 데치세요',
      },
      {
        step: 2,
        description: '양파와 당근은 잘게 썰고 베이컨은 한 입 크기로 썹니다',
        duration: '3분',
        tip: '채소는 크기를 비슷하게 맞추면 볶을 때 골고루 익습니다',
      },
      {
        step: 3,
        description: '팬에 기름을 두르고 다진마늘과 베이컨을 볶습니다',
        duration: '2분',
        tip: '베이컨을 먼저 볶으면 기름이 나와 향이 좋습니다',
      },
      {
        step: 4,
        description: '계란을 스크램블하고 브로콜리와 채소를 넣고 볶습니다',
        duration: '5분',
        tip: '계란은 너무 오래 볶지 말고 부드럽게 스크램블하세요',
      },
      {
        step: 5,
        description: '밥을 넣고 볶아가며 굴소스와 소금으로 간을 맞춥니다',
        duration: '5분',
        tip: '밥은 차가운 밥을 사용하면 덩어리가 잘 풀립니다',
      },
    ],
    recommendedVideos: [
      {
        id: 'dummy-video-5',
        title: '브로콜리 볶음밥 만들기 - 백종원의 요리비책',
        channel: '백종원의 요리비책',
        thumbnailUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80',
      },
      {
        id: 'dummy-video-6',
        title: '볶음밥 레시피 - 만개의레시피',
        channel: '만개의레시피',
        thumbnailUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80',
      },
    ],
  },
  {
    id: '4',
    title: '토마토 파스타',
    description: '신선한 토마토와 바질이 만나 이탈리아의 맛을 선사하는 클래식한 파스타',
    cookingTime: '25분',
    difficulty: '중' as const,
    ingredients: [
      { name: '파스타면', amount: '200g', gram: 200 },
      { name: '토마토소스', amount: '5~6큰술', gram: 100 },
      { name: '양파', amount: '1/2개', gram: 100 },
      { name: '다진마늘', amount: '1큰술', gram: 10 },
      { name: '케첩', amount: '5~6큰술', gram: 80 },
      { name: '버터', amount: '1큰술', gram: 15 },
      { name: '바질', amount: '적당량', gram: 5 },
      { name: '올리브오일', amount: '2큰술', gram: 20 },
    ],
    calories: 420,
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=600&fit=crop&q=80',
    steps: [
      {
        step: 1,
        description: '끓는 소금물에 파스타를 넣고 포장지에 표시된 시간보다 1분 적게 삶습니다',
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
        description: '양파를 넣고 볶다가 토마토소스와 케첩을 넣고 끓입니다',
        duration: '5분',
        tip: '토마토소스와 케첩을 함께 사용하면 더 깊은 맛이 납니다',
      },
      {
        step: 4,
        description: '삶은 파스타와 소스를 섞고 버터를 넣어 마무리합니다',
        duration: '3분',
        tip: '버터를 넣으면 소스가 더 부드럽고 크리미한 맛이 납니다',
      },
      {
        step: 5,
        description: '그릇에 담고 바질을 올려 완성합니다',
        duration: '1분',
        tip: '바질은 마지막에 올려야 향이 살아있습니다',
      },
    ],
    recommendedVideos: [
      {
        id: 'dummy-video-7',
        title: '토마토 파스타 만들기 - 백종원의 요리비책',
        channel: '백종원의 요리비책',
        thumbnailUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=450&fit=crop&q=80',
      },
      {
        id: 'dummy-video-8',
        title: '파스타 레시피 - 만개의레시피',
        channel: '만개의레시피',
        thumbnailUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=450&fit=crop&q=80',
      },
    ],
  },
  {
    id: '5',
    title: '양파 스프',
    description: '구운 양파의 깊은 맛이 살아있는 부드러운 크림 스프. 따뜻한 한 그릇',
    cookingTime: '40분',
    difficulty: '중' as const,
    ingredients: [
      { name: '양파', amount: '4개', gram: 650 },
      { name: '버터', amount: '40g', gram: 40 },
      { name: '생크림', amount: '100ml', gram: 100 },
      { name: '모짜렐라치즈', amount: '20g', gram: 20 },
      { name: '물', amount: '800ml', gram: 800 },
      { name: '소금', amount: '1/2작은술', gram: 3 },
      { name: '후추', amount: '약간', gram: 1 },
      { name: '바게트', amount: '1조각', gram: 30 },
    ],
    calories: 250,
    image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=600&fit=crop&q=80',
    steps: [
      {
        step: 1,
        description: '양파를 얇게 썰어 준비합니다',
        duration: '5분',
        tip: '양파는 얇게 썰수록 카라멜라이즈가 빨리 됩니다',
      },
      {
        step: 2,
        description: '팬에 버터를 녹이고 양파를 넣어 천천히 볶습니다',
        duration: '30분',
        tip: '양파가 갈색이 될 때까지 천천히 볶으면 깊은 단맛이 납니다',
      },
      {
        step: 3,
        description: '물을 넣고 끓인 후 믹서로 갈아줍니다',
        duration: '5분',
        tip: '믹서로 갈 때 뜨거운 상태에서 하면 더 부드러워집니다',
      },
      {
        step: 4,
        description: '생크림을 넣고 끓여 소금과 후추로 간을 맞춥니다',
        duration: '3분',
        tip: '생크림은 끓기 직전에 불을 끄면 품질이 좋습니다',
      },
      {
        step: 5,
        description: '그릇에 담고 치즈와 바게트를 올려 완성합니다',
        duration: '2분',
        tip: '치즈는 오븐에 살짝 구워 올리면 더 맛있습니다',
      },
    ],
    recommendedVideos: [
      {
        id: 'dummy-video-9',
        title: '양파 스프 만들기 - 백종원의 요리비책',
        channel: '백종원의 요리비책',
        thumbnailUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=450&fit=crop&q=80',
      },
      {
        id: 'dummy-video-10',
        title: '스프 레시피 - 만개의레시피',
        channel: '만개의레시피',
        thumbnailUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=450&fit=crop&q=80',
      },
    ],
  },
  {
    id: '6',
    title: '고추장 불고기',
    description: '달콤하고 매콤한 고추장 양념에 재운 고기의 깊은 맛. 밥도둑 그 자체',
    cookingTime: '30분',
    difficulty: '중' as const,
    ingredients: [
      { name: '돼지고기(불고기용)', amount: '300g', gram: 300 },
      { name: '고추장', amount: '2큰술', gram: 40 },
      { name: '고춧가루', amount: '2큰술', gram: 20 },
      { name: '진간장', amount: '2큰술', gram: 30 },
      { name: '설탕', amount: '2큰술', gram: 25 },
      { name: '올리고당', amount: '2큰술', gram: 30 },
      { name: '맛술', amount: '2큰술', gram: 25 },
      { name: '다진마늘', amount: '2큰술', gram: 20 },
      { name: '참기름', amount: '2큰술', gram: 20 },
      { name: '양파', amount: '1/2개', gram: 100 },
      { name: '대파', amount: '1대', gram: 50 },
    ],
    calories: 380,
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=600&fit=crop&q=80',
    steps: [
      {
        step: 1,
        description: '고추장, 고춧가루, 진간장, 설탕, 올리고당, 맛술, 다진마늘을 섞어 양념장을 만듭니다',
        duration: '5분',
        tip: '양념 비율을 1:1:1로 맞추면 실패율이 낮습니다',
      },
      {
        step: 2,
        description: '돼지고기를 얇게 썰어 양념장에 재웁니다',
        duration: '10분',
        tip: '최소 10분 이상 재워야 양념이 잘 배어듭니다',
      },
      {
        step: 3,
        description: '양파는 채썰고 대파는 어슷썰어 준비합니다',
        duration: '3분',
        tip: '양파는 얇게 채썰면 볶을 때 더 잘 익습니다',
      },
      {
        step: 4,
        description: '팬에 기름을 두르고 고기를 넣어 볶습니다',
        duration: '5분',
        tip: '고기는 센 불에 빠르게 볶으면 부드러운 식감이 유지됩니다',
      },
      {
        step: 5,
        description: '양파를 넣고 볶다가 대파와 참기름을 넣어 마무리합니다',
        duration: '5분',
        tip: '대파는 마지막에 넣어야 아삭한 식감을 유지할 수 있습니다',
      },
    ],
    sauces: [
      {
        name: '고추장 불고기 양념장',
        ingredients: [
          { name: '고추장', amount: '2큰술', gram: 40 },
          { name: '고춧가루', amount: '2큰술', gram: 20 },
          { name: '진간장', amount: '2큰술', gram: 30 },
          { name: '설탕', amount: '2큰술', gram: 25 },
          { name: '올리고당', amount: '2큰술', gram: 30 },
          { name: '맛술', amount: '2큰술', gram: 25 },
          { name: '다진마늘', amount: '2큰술', gram: 20 },
          { name: '참기름', amount: '2큰술', gram: 20 },
        ],
        steps: [
          '모든 양념 재료를 한 그릇에 넣고 고루 섞어줍니다',
          '양념 비율을 1:1:1로 맞추면 실패율이 낮습니다',
          '고기에 재우기 전에 미리 준비해두면 편리합니다',
        ],
        tip: '양념 비율만 잘 맞추면 실패율이 낮은 요리입니다',
      },
    ],
    tips: [
      '고기는 불고기용으로 얇게 썬 돼지 앞다리살을 주로 사용합니다',
      '양념에 최소 10분 이상 재워야 양념이 잘 배어듭니다',
      '고기는 센 불에 빠르게 볶으면 부드러운 식감이 유지됩니다',
      '대파는 마지막에 넣어야 아삭한 식감을 유지할 수 있습니다',
      '참기름을 마지막에 넣으면 향이 좋습니다',
    ],
    recommendedVideos: [
      {
        id: 'dummy-video-11',
        title: '고추장 불고기 만들기 - 백종원의 요리비책',
        channel: '백종원의 요리비책',
        thumbnailUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=450&fit=crop&q=80',
      },
      {
        id: 'dummy-video-12',
        title: '불고기 레시피 - 만개의레시피',
        channel: '만개의레시피',
        thumbnailUrl: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800&h=450&fit=crop&q=80',
      },
    ],
  },
]

// 추천 식단 데이터
const mealPlans = [
  {
    id: 'korean-1',
    type: 'korean' as const,
    title: '한식 추천 메뉴',
    description: '전통 한식의 깊은 맛과 영양을 담은 추천 메뉴',
    meals: ['된장찌개 + 밥 + 나물', '불고기 + 밥 + 계란찜', '김치찌개 + 밥 + 두부'],
    calories: 650,
    duration: '1인분',
  },
  {
    id: 'western-1',
    type: 'western' as const,
    title: '양식 추천 메뉴',
    description: '서양 요리의 정석을 담은 추천 메뉴',
    meals: ['파스타 + 샐러드 + 빵', '스테이크 + 감자 + 야채', '피자 + 샐러드'],
    calories: 750,
    duration: '1인분',
  },
  {
    id: 'chinese-1',
    type: 'chinese' as const,
    title: '중식 추천 메뉴',
    description: '중화요리의 풍부한 맛을 느낄 수 있는 추천 메뉴',
    meals: ['짜장면 + 탕수육', '짬뽕 + 볶음밥', '마파두부 + 볶음밥'],
    calories: 800,
    duration: '1인분',
  },
  {
    id: 'special-1',
    type: 'special' as const,
    title: '특별한 날 추천 메뉴',
    description: '기념일이나 특별한 날을 위한 특별한 메뉴',
    meals: ['한우 스테이크 + 와인', '연어 스시 세트', '로브스터 + 샐러드'],
    calories: 900,
    duration: '1인분',
  },
  {
    id: 'party-1',
    type: 'party' as const,
    title: '집들이 추천 메뉴',
    description: '손님을 위한 풍성하고 맛있는 집들이 메뉴',
    meals: ['치킨 + 감자튀김 + 샐러드', '파스타 + 피자 + 샐러드', '한정식 코스'],
    calories: 1200,
    duration: '1인분',
  },
]

import AnalysisModal from '@/components/AnalysisModal'
import AnalysisProgressModal from '@/components/AnalysisProgressModal'

// ... (existing imports)

export default function Home() {
  const [analysisData, setAnalysisData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressStage, setProgressStage] = useState('냉장고 스캔 중')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Interval 관리를 위한 Ref 사용
  const progressIntervalRef = useRef<any>(null)

  const handleAnalysisComplete = (data: any) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    setProgress(100)
    setProgressStage('분석 완료!')
    
    // 잠시 완료 상태 보여주고 결과 모달 표시
    setTimeout(() => {
      setAnalysisData(data)
      setIsLoading(false)
      setIsModalOpen(true) // 모달 열기
    }, 800)
  }

  const handleAnalysisStart = (preview: string) => {
    setIsLoading(true)
    setAnalysisData(null)
    setImagePreview(preview) // 프리뷰 저장
    setProgress(0)
    setProgressStage('냉장고 이미지 스캔 중')
    
    // 진행 상황 시물레이션 (백엔드 처리가 약 15-20초 걸리므로 이에 맞춰 구성)
    const stages = [
      { p: 10, msg: '식재료 식별 및 분류 중 (GPT-4 Vision)' },
      { p: 30, msg: '유통기한 데이터 분석 중' },
      { p: 50, msg: 'Recipe Agent: 레시피 검색 중' },
      { p: 70, msg: '5성급 셰프들이 최적의 메뉴 논의 중' },
      { p: 90, msg: '최종 추천 보고서 작성 중' },
    ]
    
    let currentStage = 0
    
    // 기존 인터벌이 있다면 클리어
    if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
    }
    
    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 95
        
        if (currentStage < stages.length && prev >= stages[currentStage].p) {
          setProgressStage(stages[currentStage].msg)
          currentStage++
        }
        
        return prev + 1
      })
    }, 200)
  }

  // 컴포넌트 언마운트 시 인터벌 정리
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  return (
    <main className="min-h-screen relative">
      {/* 배경 */}
      <div className="fixed inset-0 z-0">
        <Background3D />
      </div>

      {/* 컨텐츠 레이어 */}
      <div className="relative z-10">
        <Header />
        
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto"
          >
            {/* 메인 타이틀 */}
            <div className="text-center mb-12">
              <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-6xl font-bold mb-4 text-slate-800 drop-shadow-lg transform-3d perspective-3d"
              >
                FridgeAI
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-xl text-slate-700 font-medium"
              >
                AI 기반 냉장고 식재료 관리 및 레시피 추천 시스템
              </motion.p>
            </div>

            {/* 이미지 업로드 섹션 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="mb-12"
            >
              <ImageUpload
                onAnalysisStart={handleAnalysisStart}
                onAnalysisComplete={handleAnalysisComplete}
                isLoading={isLoading}
              />
            </motion.div>

            {/* 추천 식단 섹션 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg shadow-3d-emerald">
                  <UtensilsCrossed className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">
                    추천 식단
                  </h2>
                  <p className="text-slate-600 text-sm">한식, 양식, 중식, 특별한 날, 집들이 추천 메뉴</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                {mealPlans.map((plan, index) => (
                  <MealPlanCard key={plan.id} mealPlan={plan} index={index} />
                ))}
              </div>
            </motion.div>

            {/* 예시 레시피 섹션 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mb-12"
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg shadow-3d-emerald">
                  <ChefHat className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">
                    추천 레시피
                  </h2>
                  <p className="text-slate-600 text-sm">냉장고 재료로 만들 수 있는 맛있는 요리들</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {exampleRecipes.map((recipe, index) => (
                  <RecipeCard key={recipe.id} recipe={recipe} index={index} />
                ))}
              </div>
            </motion.div>

            {/* 로딩 상태 & 프로그레스 바 (구현 제거됨 - 모달로 대체) */}
          </motion.div>
        </div>
      </div>
      
      {/* 분석 결과 모달 */}
      <AnalysisModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={analysisData}
        imageData={imagePreview}
      />

      {/* 분석 진행상황 모달 */}
      <AnalysisProgressModal
        isOpen={isLoading}
        progress={progress}
        progressStage={progressStage}
      />
    </main>
  )
}
