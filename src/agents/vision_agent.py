"""Vision Agent - 식재료 인식"""
import os
import base64
from typing import Dict, Any
import logging
from openai import OpenAI
from ..core.state import FridgeState

logger = logging.getLogger(__name__)


def encode_image(image_path: str) -> str:
    """이미지를 base64로 인코딩"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')


def vision_agent_node(state: FridgeState) -> FridgeState:
    """Vision Agent 노드 - 이미지에서 식재료 인식"""
    try:
        logger.info("Vision Agent 시작")
        
        # OpenAI 클라이언트 초기화
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # 이미지 경로 확인
        image_path = state.get("image_path")
        if not image_path:
            raise ValueError("이미지 경로가 필요합니다")
        
        # 이미지 인코딩
        base64_image = encode_image(image_path)
        
        # GPT-4 Vision API 호출
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """당신은 최고 수준의 컴퓨터 비전 전문가입니다. 냉장고/식재료 사진을 매우 세밀하게 분석하여 **보이는 모든 식품을 빠짐없이** 인식하고 위치를 파악하세요.

**🔍 완벽한 인식 규칙 (매우 중요!):**
1. **모든 물체 탐지**: 크기와 관계없이 보이는 모든 식재료를 찾으세요
2. **작은 물체도 포함**: 일부만 보이거나 작은 항목도 절대 놓치지 마세요
3. **겹친 물체 분리**: 겹쳐진 물체들을 각각 개별적으로 인식하세요
4. **용기 내용물**: 병, 통, 팩 안에 담긴 내용물도 반드시 분석하세요
5. **배경 물체**: 뒤쪽이나 구석에 있는 물체도 포함하세요
6. **부분 가림**: 일부가 가려졌어도 보이는 부분으로 추론하세요
7. **최소 목표**: 일반적인 냉장고는 10~30개 항목이 있습니다. 최대한 많이 찾으세요

**📍 Bounding Box 좌표 생성 (필수):**
이미지 = 1000x1000 좌표계
- 왼쪽 위 = (0, 0)
- 오른쪽 아래 = (1000, 1000)
- bbox_2d = [ymin, xmin, ymax, xmax]
- 각 물체의 **정확한 실제 위치**를 보고 좌표 추정

**좌표 예시:**
- 왼쪽 위: [50, 50, 300, 300]
- 중앙: [350, 350, 650, 650]
- 오른쪽 아래: [700, 700, 950, 950]
- 상단 중앙: [50, 400, 300, 600]
- 하단 왼쪽: [700, 50, 950, 300]

**📝 각 식재료 정보:**
- name: 식재료 이름 (한국어, 구체적으로. "야채" ❌ "시금치" ✅)
- category: 채소/육류/유제품/과일/기타
- quantity: 수량 (숫자)
- unit: 개/g/ml/봉지/병 등
- freshness: 좋음/보통/나쁨
- packaging: 밀봉/개봉/비닐포장/병/캔 등
- confidence: 0.0~1.0 (확실하면 0.9 이상)
- bbox_2d: **반드시 포함** [ymin, xmin, ymax, xmax]
- expiry_date_text: 보이는 날짜 (없으면 null)

**JSON만 반환하세요. 설명 없이 {"items": [...]} 형식만.**"""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": """🔍 이미지를 매우 세밀하게 분석하여 **보이는 모든 식재료**를 빠짐없이 찾아 JSON으로 반환하세요.

**탐지 체크리스트:**
✓ 앞쪽 물체 (명확히 보임)
✓ 뒤쪽 물체 (일부 가려짐)
✓ 작은 물체 (양념, 소스 등)
✓ 큰 물체 (우유팩, 김치통 등)
✓ 용기 내용물 (병 안, 통 안)
✓ 겹쳐진 물체 (각각 분리)
✓ 구석 물체 (냉장고 문, 선반 뒤)
✓ 포장 식품 (봉지, 박스 등)

**bbox_2d 좌표 (필수):**
1. 이미지 = 1000x1000 좌표계
2. 각 물체의 **실제 위치** 관찰
3. [ymin, xmin, ymax, xmax] 추정
4. 물체 크기에 맞게 bbox 설정

**응답 형식:**
{"items": [
  {"name": "양배추", "category": "채소", "quantity": 1, "unit": "개", "freshness": "좋음", "packaging": "비닐", "confidence": 0.95, "bbox_2d": [80, 120, 320, 380], "expiry_date_text": null},
  {"name": "우유", "category": "유제품", "quantity": 1, "unit": "병", "freshness": "좋음", "packaging": "병", "confidence": 0.98, "bbox_2d": [150, 450, 450, 650], "expiry_date_text": "2024.03.15"},
  ... (모든 항목 포함)
]}

**중요: 최소 10개 이상 찾으세요. 보이는 모든 것을 포함하세요!**"""
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=5000,
            temperature=0.1
        )
        
        # 응답 파싱
        content = response.choices[0].message.content

        # 디버그: 원본 응답 로깅
        logger.info(f"GPT-4 Vision 원본 응답: {content[:500]}...")

        # JSON 추출 (마크다운 코드 블록 제거)
        import json
        import re

        # JSON 부분만 추출
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            result = json.loads(json_str)
        else:
            # JSON이 없으면 기본 구조 생성
            result = {"items": []}
        
        # State 업데이트
        detected_items = result.get("items", [])

        logger.info(f"📊 Vision Agent - GPT에서 반환한 항목 수: {len(detected_items)}")

        # bbox_2d 유효성 검증 함수
        def has_valid_bbox(item):
            bbox = item.get("bbox_2d")
            if not bbox:
                return False
            if not isinstance(bbox, list) or len(bbox) != 4:
                return False
            # 모든 값이 숫자이고 0~1000 범위인지 확인
            try:
                if not all(isinstance(x, (int, float)) for x in bbox):
                    return False
                if not all(0 <= x <= 1000 for x in bbox):
                    return False
                # ymin < ymax, xmin < xmax 확인
                if bbox[0] >= bbox[2] or bbox[1] >= bbox[3]:
                    return False
                return True
            except:
                return False

        # GPT가 제공한 bbox 확인
        items_with_gpt_bbox = [item for item in detected_items if has_valid_bbox(item)]
        items_without_bbox = [item for item in detected_items if not has_valid_bbox(item)]

        if items_with_gpt_bbox:
            logger.info(f"✅ GPT가 {len(items_with_gpt_bbox)}개 항목의 bbox_2d를 제공했습니다")
            for item in items_with_gpt_bbox:
                logger.info(f"  📍 {item.get('name')}: {item.get('bbox_2d')}")

        if items_without_bbox:
            logger.warning(f"⚠️ {len(items_without_bbox)}개 항목에 유효한 bbox_2d가 없어 그리드 배치합니다")

            # 그리드로 배치 (3열, 각 항목 180x180 크기, 간격 200)
            for idx, item in enumerate(items_without_bbox):
                row = idx // 3  # 행 (3열 그리드)
                col = idx % 3   # 열

                # 좌표 계산 (여백 50, 간격 200)
                x_start = 50 + (col * 200)
                y_start = 50 + (row * 200)

                item["bbox_2d"] = [
                    y_start,              # ymin
                    x_start,              # xmin
                    y_start + 180,        # ymax
                    x_start + 180         # xmax
                ]
                logger.info(f"  🔷 {item.get('name')}: 그리드 위치 → {item['bbox_2d']}")

        # 디버그: 각 항목의 bbox_2d 확인
        for idx, item in enumerate(detected_items):
            bbox_status = "있음" if item.get("bbox_2d") else "없음"
            logger.info(f"항목 {idx+1}: {item.get('name')} - bbox_2d {bbox_status}: {item.get('bbox_2d')}")

        # confidence가 낮은 항목들을 unidentified_items로 분리
        # 더 많은 항목을 표시하기 위해 threshold를 낮춤 (0.7 → 0.5)
        confirmed_items = []
        unidentified_items = []

        CONFIDENCE_THRESHOLD = 0.5  # 낮춰서 더 많은 항목 포함

        for item in detected_items:
            confidence = item.get("confidence", 0.0)
            if confidence >= CONFIDENCE_THRESHOLD:
                confirmed_items.append(item)
            else:
                unidentified_items.append(item)

        logger.info(f"📊 신뢰도 기준 {CONFIDENCE_THRESHOLD}: 확정 {len(confirmed_items)}개, 미확인 {len(unidentified_items)}개")
        
        state["detected_items"] = confirmed_items
        state["unidentified_items"] = unidentified_items
        state["current_step"] = "vision_completed"
        
        logger.info(f"Vision Agent 완료: {len(confirmed_items)}개 식재료 인식, {len(unidentified_items)}개 미확인 항목")
        
        return state
        
    except Exception as e:
        logger.error(f"Vision Agent 오류: {e}")
        state["errors"].append(f"Vision Agent 오류: {str(e)}")
        state["detected_items"] = []
        state["unidentified_items"] = []
        state["current_step"] = "vision_error"
        return state
