# FridgeAI 실행 가이드

## 빠른 시작

### 1. 환경 설정

```bash
# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일을 생성하고 OpenAI API 키를 설정하세요:

```bash
cp .env.example .env
# .env 파일을 열어서 OPENAI_API_KEY를 설정하세요
```

`.env` 파일 내용:
```
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 3. 서버 실행

```bash
python run.py
```

서버가 `http://localhost:8000`에서 실행됩니다.

### 4. API 사용

#### 이미지 분석 (POST 요청)

```bash
curl -X POST "http://localhost:8000/api/v1/analyze" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@your_fridge_image.jpg"
```

#### 브라우저에서 테스트

1. `http://localhost:8000/docs` 접속 (Swagger UI)
2. `/api/v1/analyze` 엔드포인트 선택
3. "Try it out" 클릭
4. 이미지 파일 업로드
5. "Execute" 클릭

### 5. 스크립트로 테스트

```bash
python scripts/test_orchestrator.py path/to/your/image.jpg
```

## 프로젝트 구조

```
FridgeAI/
├── src/
│   ├── core/           # LangGraph State 및 그래프 정의
│   ├── agents/         # 각 에이전트 구현
│   ├── rag/            # RAG 인프라 (ChromaDB)
│   ├── api/            # FastAPI 엔드포인트
│   └── utils/          # 유틸리티 함수
├── data/               # 데이터 저장소
├── scripts/            # 실행 스크립트
├── run.py              # 메인 실행 파일
└── requirements.txt    # 의존성 목록
```

## 워크플로우

1. **이미지 업로드** → 이미지 검증
2. **Vision Agent** → 식재료 인식 (GPT-4 Vision)
3. **Expiry Agent** → 유통기한 계산
4. **Inventory Agent** → 재고 업데이트
5. **Recipe Agent** → 레시피 검색 (RAG)
6. **Recommendation Agent** → 최종 추천 생성

## 응답 형식

```json
{
  "success": true,
  "detected_items": [
    {
      "name": "당근",
      "category": "채소",
      "quantity": 3,
      "unit": "개",
      "freshness": "좋음",
      "packaging": "비닐포장",
      "confidence": 0.95
    }
  ],
  "expiry_data": [...],
  "expiry_alerts": ["🚨 오늘 소비 권장: 시금치"],
  "inventory_status": {...},
  "recipe_suggestions": [...],
  "final_recommendation": {
    "summary": {...},
    "priority_actions": [...],
    "recommended_recipes": [...],
    "shopping_list": {...},
    "tips": [...]
  }
}
```

## 문제 해결

### OpenAI API 키 오류
- `.env` 파일에 올바른 API 키가 설정되어 있는지 확인
- API 키에 충분한 크레딧이 있는지 확인

### ChromaDB 오류
- `data/vectors/` 디렉토리가 생성되어 있는지 확인
- 필요시 디렉토리 삭제 후 재생성

### 이미지 업로드 오류
- 지원 형식: JPG, JPEG, PNG, WEBP
- 파일 크기 제한 확인

## 다음 단계

- [ ] PostgreSQL 데이터베이스 연동
- [ ] Redis 캐싱 추가
- [ ] Celery를 통한 비동기 처리
- [ ] 프론트엔드 개발
- [ ] 더 많은 레시피 데이터 추가
