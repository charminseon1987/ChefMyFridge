#!/bin/bash

# 패키지 설치 스크립트

echo "📦 FridgeAI 의존성 설치 시작..."

# 가상환경 확인
if [ ! -d "venv" ]; then
    echo "가상환경이 없습니다. 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
source venv/bin/activate

# 인터넷 연결 확인
echo "🌐 인터넷 연결 확인 중..."
if ! ping -c 1 -W 2 pypi.org > /dev/null 2>&1; then
    echo "❌ 오류: 인터넷 연결이 없습니다."
    echo "   Wi-Fi 또는 이더넷 연결을 확인해주세요."
    exit 1
fi

echo "✅ 인터넷 연결 확인됨"

# pip 업그레이드
echo "⬆️  pip 업그레이드 중..."
pip install --upgrade pip --quiet

# 필수 패키지 설치
echo "📥 필수 패키지 설치 중..."

# 1단계: 기본 웹 서버 패키지
echo "  - 웹 서버 패키지 설치 중..."
pip install uvicorn fastapi python-multipart python-dotenv

# 2단계: LangGraph 및 LangChain
echo "  - LangGraph 패키지 설치 중..."
pip install langgraph langchain langchain-openai

# 3단계: OpenAI 및 RAG
echo "  - OpenAI 및 RAG 패키지 설치 중..."
pip install openai chromadb

# 4단계: 이미지 처리
echo "  - 이미지 처리 패키지 설치 중..."
pip install Pillow

# 5단계: 기타 유틸리티
echo "  - 유틸리티 패키지 설치 중..."
pip install pydantic

echo ""
echo "✅ 모든 패키지 설치 완료!"
echo ""
echo "설치된 패키지 확인:"
pip list | grep -E "uvicorn|fastapi|langgraph|openai|chromadb"
echo ""
echo "서버 실행: python run.py"
