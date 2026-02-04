#!/bin/bash

# 포트 8000을 사용하는 프로세스 종료 스크립트

PORT=8000

echo "🔍 포트 $PORT를 사용하는 프로세스 찾는 중..."

PID=$(lsof -ti:$PORT)

if [ -z "$PID" ]; then
    echo "✅ 포트 $PORT는 사용 중이 아닙니다."
    exit 0
fi

echo "📌 발견된 프로세스 ID: $PID"
echo "🛑 프로세스 종료 시도 중..."

# 일반 종료 시도
kill $PID 2>/dev/null

sleep 2

# 여전히 실행 중이면 강제 종료
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "⚠️  일반 종료 실패. 강제 종료 시도 중..."
    kill -9 $PID 2>/dev/null
    sleep 1
fi

# 최종 확인
if lsof -ti:$PORT > /dev/null 2>&1; then
    echo "❌ 프로세스 종료 실패. 수동으로 종료해주세요:"
    echo "   kill -9 $PID"
    echo "   또는 Activity Monitor에서 프로세스 $PID를 찾아 종료하세요."
    exit 1
else
    echo "✅ 포트 $PORT가 해제되었습니다."
    exit 0
fi
