'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { Application } from '@splinetool/runtime'

// Spline 컴포넌트를 동적으로 로드 (SSR 방지 및 에러 핸들링)
const Spline = dynamic(
  () => import('@splinetool/react-spline').then((mod) => mod.default),
  {
    ssr: false,
  }
)

export default function SplineScene() {
  const splineRef = useRef<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  // Spline 씬 URL - 환경 변수 또는 기본값 사용
  const splineSceneUrl =
    typeof window !== 'undefined'
      ? process.env.NEXT_PUBLIC_SPLINE_SCENE_URL ||
        'https://prod.spline.design/6Wq1Q7YGyM-iab5p/scene.splinecode'
      : ''

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const onLoad = (spline: Application) => {
    try {
      splineRef.current = spline
      setIsLoading(false)
      setHasError(false)
      console.log('Spline scene loaded successfully')
    } catch (error) {
      console.error('Error in onLoad:', error)
      setIsLoading(false)
      setHasError(true)
    }
  }

  const onError = (e: any) => {
    console.error('Spline loading error:', e)
    setIsLoading(false)
    setHasError(true)
  }

  // 클라이언트 사이드에서만 렌더링
  if (!isMounted) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]"></div>
      </div>
    )
  }

  // 에러 발생 시 대체 배경 표시
  if (hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent)]"></div>
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      {splineSceneUrl && (
        <Spline
          scene={splineSceneUrl}
          onLoad={onLoad}
          onError={onError}
          style={{ width: '100%', height: '100%' }}
        />
      )}
    </div>
  )
}
