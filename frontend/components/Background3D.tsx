'use client'

import { useState, useEffect } from 'react'

export default function Background3D() {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return <FoodBackground />
  }

  return <FoodBackground />
}

function FoodBackground() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 relative overflow-hidden">
      {/* 메인 그라데이션 배경 */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/30 via-white to-blue-50/30"></div>
      
      {/* 냉장고 실루엣 패턴 */}
      <div className="absolute inset-0 opacity-[0.03]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="fridge-pattern" x="0" y="0" width="200" height="300" patternUnits="userSpaceOnUse">
              {/* 냉장고 실루엣 */}
              <rect x="20" y="20" width="160" height="260" fill="none" stroke="currentColor" strokeWidth="2" rx="8"/>
              <line x1="20" y1="150" x2="180" y2="150" stroke="currentColor" strokeWidth="2"/>
              <circle cx="100" cy="80" r="15" fill="currentColor" opacity="0.3"/>
              <rect x="30" y="170" width="140" height="100" fill="currentColor" opacity="0.1" rx="4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#fridge-pattern)" />
        </svg>
      </div>

      {/* 음식 아이콘 플로팅 애니메이션 */}
      <div className="absolute inset-0">
        {/* 당근 */}
        <div 
          className="absolute text-orange-400/20 animate-float"
          style={{
            left: '10%',
            top: '20%',
            animationDelay: '0s',
            animationDuration: '8s',
            fontSize: '4rem',
          }}
        >
          🥕
        </div>
        
        {/* 브로콜리 */}
        <div 
          className="absolute text-green-400/20 animate-float"
          style={{
            left: '80%',
            top: '30%',
            animationDelay: '2s',
            animationDuration: '10s',
            fontSize: '3rem',
          }}
        >
          🥦
        </div>
        
        {/* 토마토 */}
        <div 
          className="absolute text-red-400/20 animate-float"
          style={{
            left: '15%',
            top: '70%',
            animationDelay: '4s',
            animationDuration: '9s',
            fontSize: '3.5rem',
          }}
        >
          🍅
        </div>
        
        {/* 양파 */}
        <div 
          className="absolute text-purple-300/20 animate-float"
          style={{
            left: '75%',
            top: '65%',
            animationDelay: '1s',
            animationDuration: '11s',
            fontSize: '3rem',
          }}
        >
          🧅
        </div>
        
        {/* 고추 */}
        <div 
          className="absolute text-red-300/20 animate-float"
          style={{
            left: '50%',
            top: '15%',
            animationDelay: '3s',
            animationDuration: '7s',
            fontSize: '2.5rem',
          }}
        >
          🌶️
        </div>
        
        {/* 파프리카 */}
        <div 
          className="absolute text-yellow-400/20 animate-float"
          style={{
            left: '85%',
            top: '75%',
            animationDelay: '5s',
            animationDuration: '9s',
            fontSize: '3rem',
          }}
        >
          🫑
        </div>
      </div>

      {/* 기하학적 도형들 */}
      <div className="absolute inset-0">
        {/* 원형 도형들 */}
        <div className="absolute w-96 h-96 bg-slate-200/8 rounded-full blur-3xl -top-48 -left-48 animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute w-80 h-80 bg-blue-200/8 rounded-full blur-3xl top-1/2 -right-32 animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }}></div>
        <div className="absolute w-72 h-72 bg-slate-300/8 rounded-full blur-3xl bottom-0 left-1/4 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
      </div>

      {/* 그리드 패턴 */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* 빛 효과 */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent"></div>
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>
    </div>
  )
}
