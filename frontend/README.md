# FridgeAI Frontend

Next.js 기반의 FridgeAI 프론트엔드 애플리케이션입니다.

## 기술 스택

- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안정성
- **Tailwind CSS** - 유틸리티 기반 CSS 프레임워크
- **Spline 3D** - 3D 씬 렌더링
- **Framer Motion** - 애니메이션 라이브러리
- **Axios** - HTTP 클라이언트
- **Lucide React** - 아이콘 라이브러리

## 설치 및 실행

### 1. 의존성 설치

```bash
cd frontend
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

개발 서버는 `http://localhost:3000`에서 실행됩니다.

### 3. 프로덕션 빌드

```bash
npm run build
npm start
```

## 환경 설정

백엔드 API 서버가 `http://localhost:8000`에서 실행 중이어야 합니다.

API 엔드포인트를 변경하려면 `components/ImageUpload.tsx` 파일의 API URL을 수정하세요.

## 주요 기능

- 🖼️ **이미지 업로드**: 드래그 앤 드롭 또는 클릭으로 냉장고 사진 업로드
- 🤖 **AI 분석**: 업로드된 이미지를 AI가 분석하여 식재료 인식
- ⏰ **유통기한 추적**: 식재료별 유통기한 알림
- 👨‍🍳 **레시피 추천**: 보유 식재료 기반 맞춤 레시피 추천
- 📊 **대시보드**: 분석 결과를 시각적으로 표시

## 프로젝트 구조

```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 루트 레이아웃
│   ├── page.tsx           # 메인 페이지
│   └── globals.css        # 전역 스타일
├── components/             # React 컴포넌트
│   ├── Header.tsx         # 헤더 컴포넌트
│   ├── ImageUpload.tsx    # 이미지 업로드 컴포넌트
│   ├── AnalysisResults.tsx # 분석 결과 표시 컴포넌트
│   └── SplineScene.tsx    # Spline 3D 씬 컴포넌트
├── public/                 # 정적 파일
├── package.json           # 의존성 관리
├── tailwind.config.js     # Tailwind 설정
└── tsconfig.json          # TypeScript 설정
```

## Spline 3D 설정

Spline 씬을 사용하려면:

1. [Spline](https://spline.design)에서 3D 씬을 생성
2. 씬을 익스포트하여 URL을 얻음
3. `components/SplineScene.tsx`의 `scene` prop에 URL 설정

현재는 예시 URL이 설정되어 있습니다. 실제 씬 URL로 교체하세요.

## 커스터마이징

### 색상 테마 변경

`tailwind.config.js`의 `theme.extend.colors` 섹션에서 색상을 변경할 수 있습니다.

### 애니메이션 조정

`tailwind.config.js`의 `keyframes` 섹션에서 애니메이션을 커스터마이징할 수 있습니다.

## 문제 해결

### Spline 씬이 로드되지 않는 경우

- 인터넷 연결 확인
- Spline 씬 URL이 올바른지 확인
- 브라우저 콘솔에서 에러 확인

### API 연결 오류

- 백엔드 서버가 실행 중인지 확인 (`http://localhost:8000`)
- CORS 설정 확인
- 네트워크 탭에서 요청 상태 확인
