"""FastAPI 메인 애플리케이션"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .routes import router

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="FridgeAI API",
    description="냉장고 관리 AI 에이전트 시스템",
    version="0.1.0"
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(router)


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "FridgeAI API",
        "version": "0.1.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """헬스 체크"""
    return {"status": "healthy"}
