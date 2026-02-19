# FridgeAI 배포 가이드 (Railway)

이 프로젝트는 백엔드(FastAPI + YOLO)를 **Railway**에 배포하여 "No space left on device" 문제를 해결하고, 안정적인 서비스를 제공하도록 설정되었습니다.

## 1. 깃허브에 코드 올리기 (필수)
먼저, 제가 수정한 코드를 깃허브 저장소에 올려야 합니다.

```bash
git add .
git commit -m "Railway 배포를 위한 설정 추가 (Dockerfile, railway.json)"
git push origin main
```

## 2. Railway 프로젝트 생성
1. [Railway.app](https://railway.app/)에 접속하여 로그인합니다.
2. 대시보드에서 **"New Project"** 클릭 -> **"Deploy from GitHub repo"** 선택.
3. `FridgeAI` 저장소를 선택합니다.
4. **"Deploy Now"**를 클릭합니다.

## 3. 환경 변수 설정 (중요!)
배포가 시작되지만, API 키가 없어서 실패할 수 있습니다. 바로 설정을 추가해줍니다.

1. Railway 대시보드에서 생성된 프로젝트 클릭.
2. **"Variables"** 탭 클릭.
3. 다음 변수를 추가합니다:
   - `OPENAI_API_KEY`: `sk-...` (사용 중인 OpenAI 키)
   - `PORT`: `8000` (이미 Dockerfile에 설정되어 있지만, 명시적으로 추가하면 안전합니다)

## 4. 배포 확인 및 URL 복사
1. **"Settings"** 탭 -> **"Networking"** 섹션으로 이동.
2. **"Generate Domain"**을 클릭하여 공용 URL을 생성합니다. (예: `https://fridgeai-production.up.railway.app`)
3. 이 URL이 백엔드 API 주소입니다. 복사해두세요.
4. 브라우저에서 `https://YOUR_RAILWAY_URL/docs` 로 접속해서 API 문서가 뜨는지 확인합니다.

## 5. 프론트엔드 연결 (로컬 실행 시)
로컬에서 프론트엔드를 실행할 때, 방금 배포한 Railway 백엔드를 사용하려면:

1. `frontend/.env.local` 파일을 엽니다.
2. `NEXT_PUBLIC_API_URL` 값을 변경합니다.
   ```
   NEXT_PUBLIC_API_URL=https://YOUR_RAILWAY_URL
   ```
3. 프론트엔드 서버 재시작:
   ```bash
   ./dev.sh
   ```

이제 로컬 프론트엔드 -> Railway 백엔드(YOLO/AI) 구조로 동작하여, 내 컴퓨터의 디스크 용량 문제 없이 AI 기능을 사용할 수 있습니다!
