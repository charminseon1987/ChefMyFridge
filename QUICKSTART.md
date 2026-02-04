# 빠른 실행 가이드

## 1단계: 가상환경 생성 및 의존성 설치

```bash
# 프로젝트 디렉토리로 이동
cd /Users/kimhyeseon/Dev/FridgeAI

# 가상환경 생성
python3 -m venv venv

# 가상환경 활성화
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

**주의**: 인터넷 연결이 필요합니다. 네트워크 문제가 있다면 해결 후 다시 시도하세요.

## 2단계: 환경 변수 설정

`.env` 파일을 생성하고 OpenAI API 키를 설정하세요:

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (텍스트 에디터로 열기)
# 또는 다음 명령어로 직접 생성:
echo "OPENAI_API_KEY=sk-your-openai-api-key-here" > .env
```

**중요**: `sk-your-openai-api-key-here` 부분을 실제 OpenAI API 키로 교체하세요.

OpenAI API 키는 https://platform.openai.com/api-keys 에서 발급받을 수 있습니다.

## 3단계: 서버 실행

```bash
# 가상환경이 활성화된 상태에서
python run.py
```

서버가 시작되면 다음과 같은 메시지가 표시됩니다:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

## 4단계: API 사용하기

### 방법 1: 브라우저에서 Swagger UI 사용

1. 브라우저에서 `http://localhost:8000/docs` 접속
2. `/api/v1/analyze` 엔드포인트 찾기
3. "Try it out" 버튼 클릭
4. "Choose File" 버튼으로 냉장고/식재료 사진 업로드
5. "Execute" 버튼 클릭
6. 결과 확인

### 방법 2: curl 명령어 사용

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/image.jpg"
```

### 방법 3: Python 스크립트 사용

```bash
python scripts/test_orchestrator.py /path/to/your/image.jpg
```

## 문제 해결

### 네트워크 연결 오류
- 인터넷 연결 확인
- 방화벽 설정 확인
- VPN 사용 중이라면 일시적으로 해제 후 시도

### OpenAI API 키 오류
- `.env` 파일에 올바른 API 키가 설정되어 있는지 확인
- API 키에 충분한 크레딧이 있는지 확인
- API 키 형식이 올바른지 확인 (sk-로 시작해야 함)

### 포트 8000이 이미 사용 중
- 다른 애플리케이션이 포트 8000을 사용 중일 수 있습니다
- `run.py` 파일에서 포트 번호를 변경하거나
- 사용 중인 프로세스를 종료하세요

### 모듈을 찾을 수 없음
- 가상환경이 활성화되어 있는지 확인 (`source venv/bin/activate`)
- 모든 의존성이 설치되었는지 확인 (`pip install -r requirements.txt`)

## 실행 확인

서버가 정상적으로 실행되면:
- `http://localhost:8000` - API 루트
- `http://localhost:8000/docs` - Swagger UI
- `http://localhost:8000/health` - 헬스 체크

헬스 체크 엔드포인트에 접속하면 `{"status": "healthy"}` 응답을 받아야 합니다.
