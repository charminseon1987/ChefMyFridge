"""프로젝트 실행 진입점"""
import uvicorn
import os
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

if __name__ == "__main__":
    # OpenAI API 키 확인
    if not os.getenv("OPENAI_API_KEY"):
        print("⚠️  경고: OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
        print("   .env 파일을 생성하고 OPENAI_API_KEY를 설정해주세요.")
        print("   예: OPENAI_API_KEY=sk-your-key-here")
    
    # FastAPI 서버 실행
    import socket
    
    # 사용 가능한 포트 찾기
    def find_free_port(start_port=8000):
        for port in range(start_port, start_port + 10):
            try:
                with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                    s.bind(('', port))
                    return port
            except OSError:
                continue
        return start_port  # 기본값 반환
    
    # 포트 설정 (Railway 등 클라우드 환경 지원)
    port = int(os.getenv("PORT", 8000))
    
    # 로컬 개발 환경에서만 가용 포트 검색 (PORT가 설정되지 않았을 때)
    if not os.getenv("PORT"):
        port = find_free_port(8000)
        if port != 8000:
            print(f"⚠️  포트 8000이 사용 중입니다. 포트 {port}를 사용합니다.")
    
    uvicorn.run(
        "src.api.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
