#!/bin/bash

# FridgeAI 실행 스크립트

echo "🚀 FridgeAI 서버 시작 중..."

# 가상환경 활성화
if [ ! -d "venv" ]; then
    echo "📦 가상환경이 없습니다. 생성 중..."
    python3 -m venv venv
fi

echo "🔌 가상환경 활성화 중..."
source venv/bin/activate

# 의존성 확인 및 설치
echo "📚 의존성 확인 중..."
if ! python -c "import langgraph" 2>/dev/null; then
    echo "📥 의존성 설치 중... (인터넷 연결 필요)"
    pip install -r requirements.txt
else
    echo "✅ 의존성 확인 완료"
fi

# .env 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사합니다..."
    cp .env.example .env
    echo "📝 .env 파일을 열어서 OPENAI_API_KEY를 설정해주세요."
fi

# 서버 실행
echo "🌐 서버 시작 중..."
echo "📍 서버 주소: http://localhost:8000"
echo "📖 API 문서: http://localhost:8000/docs"
echo ""
echo "서버를 중지하려면 Ctrl+C를 누르세요."
echo ""

python run.py
