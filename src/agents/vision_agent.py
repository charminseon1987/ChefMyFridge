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
                    "content": """당신은 식재료 인식 전문가입니다. 냉장고나 식재료 사진에서 모든 식품을 정확히 인식하고 분류하세요.

중요:
1. bounding box(bbox_2d)는 물체의 외곽선에 딱 맞게(tight fit) 매우 정확하게 설정해야 합니다. 여백을 두지 마세요.
2. 겹쳐져 있는 물체나 가려진 물체도 최대한 개별적으로 식별하세요.
3. 용기나 그릇에 담긴 음식도 내용물을 기준으로 식별하세요.

각 식재료에 대해 다음 정보를 제공하세요:
- name: 식재료 이름 (한국어). 구체적으로 명시 (예: '야채' 대신 '시금치', '사과' 등)
- category: 카테고리 (채소, 육류, 유제품, 과일, 기타)
- quantity: 수량 (숫자)
- unit: 단위 (개, g, ml 등)
- freshness: 신선도 상태 (좋음, 보통, 나쁨)
- packaging: 포장 상태 (밀봉, 개봉, 비닐포장 등)
- confidence: 신뢰도 (0.0-1.0)
- bbox_2d: 위치 좌표 [ymin, xmin, ymax, xmax] (0~1000 정수 스케일). ymin=위쪽 가장자리, xmin=왼쪽 가장자리.
- expiry_date_text: 이미지에서 보이는 유통기한 텍스트 (없으면 null)

JSON 형식으로 응답하세요."""
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "이 이미지에서 모든 식재료를 인식하고 JSON 형식으로 반환하세요. 형식: {\"items\": [{\"name\": \"당근\", \"category\": \"채소\", \"quantity\": 3, \"unit\": \"개\", \"freshness\": \"좋음\", \"packaging\": \"비닐포장\", \"confidence\": 0.95, \"bbox_2d\": [100, 200, 300, 400], \"expiry_date_text\": null}]}"
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
            max_tokens=2000,
            temperature=0.3
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

        # bbox_2d가 없거나 유효하지 않은 항목에 기본 위치 할당 (그리드 형태)
        # GPT-4 Vision은 bbox를 자동 생성하지 못하므로, 임시로 그리드 배치
        def has_valid_bbox(item):
            bbox = item.get("bbox_2d")
            if not bbox:
                return False
            if not isinstance(bbox, list) or len(bbox) != 4:
                return False
            return all(isinstance(x, (int, float)) for x in bbox)

        items_without_bbox = [item for item in detected_items if not has_valid_bbox(item)]

        if items_without_bbox:
            logger.warning(f"⚠️ {len(items_without_bbox)}개 항목에 유효한 bbox_2d가 없어 자동 생성합니다")

            # 그리드로 배치 (2열, 각 항목 200x200 크기)
            for idx, item in enumerate(items_without_bbox):
                row = idx // 2  # 행
                col = idx % 2   # 열

                # 중앙에서 시작, 간격 250
                x_start = 250 + (col * 250)
                y_start = 100 + (row * 250)

                item["bbox_2d"] = [
                    y_start,              # ymin
                    x_start,              # xmin
                    y_start + 200,        # ymax
                    x_start + 200         # xmax
                ]
                logger.info(f"  ✅ {item.get('name')}: bbox_2d 자동 생성 → {item['bbox_2d']}")
        else:
            logger.info("✅ 모든 항목에 이미 유효한 bbox_2d가 있습니다")

        # 디버그: 각 항목의 bbox_2d 확인
        for idx, item in enumerate(detected_items):
            bbox_status = "있음" if item.get("bbox_2d") else "없음"
            logger.info(f"항목 {idx+1}: {item.get('name')} - bbox_2d {bbox_status}: {item.get('bbox_2d')}")

        # confidence가 낮은 항목들을 unidentified_items로 분리
        confirmed_items = []
        unidentified_items = []

        for item in detected_items:
            confidence = item.get("confidence", 0.0)
            if confidence >= 0.7:
                confirmed_items.append(item)
            else:
                unidentified_items.append(item)
        
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
