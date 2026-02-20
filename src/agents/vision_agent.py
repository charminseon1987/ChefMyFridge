"""Vision Agent - YOLO v8 + GPT-4o 하이브리드 식재료 인식"""

import os
import base64
import json
import re
import logging
from typing import List, Dict, Any, Optional, Tuple

from openai import OpenAI
from PIL import Image
from ..core.state import FridgeState

logger = logging.getLogger(__name__)

# YOLO 모델 싱글톤 (최초 1회만 로드)
_yolo_model = None


def _get_yolo_model():
    """YOLO v8 모델 로드 (싱글톤)"""
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO

            logger.info("YOLO v8 모델 로드 중... (최초 실행 시 자동 다운로드)")
            _yolo_model = YOLO("yolov8n.pt")
            logger.info("✅ YOLO v8 모델 로드 완료")
        except Exception as e:
            logger.error(f"YOLO 모델 로드 실패: {e}")
            _yolo_model = None
    return _yolo_model


def encode_image(image_path: str) -> str:
    """이미지를 base64로 인코딩"""
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def calculate_iou(bbox1: List[float], bbox2: List[float]) -> float:
    """두 bbox의 IoU(Intersection over Union) 계산 (0-1000 스케일)
    bbox 형식: [ymin, xmin, ymax, xmax]
    """
    y_min = max(bbox1[0], bbox2[0])
    x_min = max(bbox1[1], bbox2[1])
    y_max = min(bbox1[2], bbox2[2])
    x_max = min(bbox1[3], bbox2[3])

    intersection = max(0, y_max - y_min) * max(0, x_max - x_min)
    if intersection == 0:
        return 0.0

    area1 = (bbox1[2] - bbox1[0]) * (bbox1[3] - bbox1[1])
    area2 = (bbox2[2] - bbox2[0]) * (bbox2[3] - bbox2[1])
    union = area1 + area2 - intersection

    return intersection / union if union > 0 else 0.0


def find_best_yolo_match(
    gpt_bbox: List[float], yolo_detections: List[Dict], threshold: float = 0.1
) -> Optional[int]:
    """GPT bbox와 가장 많이 겹치는 YOLO 탐지 인덱스 반환"""
    if not gpt_bbox or not yolo_detections:
        return None

    best_iou = threshold
    best_idx = None

    for idx, detection in enumerate(yolo_detections):
        iou = calculate_iou(gpt_bbox, detection["bbox_2d"])
        if iou > best_iou:
            best_iou = iou
            best_idx = idx

    return best_idx


def detect_with_yolo(image_path: str) -> List[Dict[str, Any]]:
    """YOLO v8으로 객체 탐지 - 정확한 픽셀 bbox 반환"""
    model = _get_yolo_model()
    if model is None:
        logger.warning("YOLO 모델 없음 - GPT-4o만 사용")
        return []

    try:
        results = model(image_path, conf=0.1, iou=0.45, verbose=False)
        detections = []

        for result in results:
            h, w = result.orig_shape[0], result.orig_shape[1]

            for box in result.boxes:
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                # 픽셀 좌표 → 0-1000 스케일 변환
                bbox_2d = [
                    round(y1 / h * 1000),  # ymin
                    round(x1 / w * 1000),  # xmin
                    round(y2 / h * 1000),  # ymax
                    round(x2 / w * 1000),  # xmax
                ]

                class_name = result.names[int(box.cls[0])]
                confidence = float(box.conf[0])

                detections.append(
                    {
                        "bbox_2d": bbox_2d,
                        "yolo_class": class_name,
                        "yolo_conf": confidence,
                    }
                )

                logger.info(
                    f"  🎯 YOLO 탐지: {class_name} (conf={confidence:.2f}) → bbox{bbox_2d}"
                )

        logger.info(f"✅ YOLO 탐지 완료: {len(detections)}개 객체")
        return detections

    except Exception as e:
        logger.error(f"YOLO 탐지 오류: {e}")
        return []


def classify_with_gpt(
    base64_image: str, yolo_detections: List[Dict]
) -> List[Dict[str, Any]]:
    """GPT-4o로 식재료 상세 분류 - YOLO 결과를 참고하여 정확도 향상"""
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    # YOLO 탐지 결과를 GPT 프롬프트에 포함
    if yolo_detections:
        yolo_summary = "\n".join(
            [
                f"  - 위치 {d['bbox_2d']} (0-1000 스케일, [ymin,xmin,ymax,xmax]), 클래스: {d['yolo_class']}, 신뢰도: {d['yolo_conf']:.2f}"
                for d in yolo_detections
            ]
        )
        yolo_context = f"""
**YOLO v8이 다음 위치에서 객체를 탐지했습니다 (이 좌표는 매우 정확합니다):**
{yolo_summary}

위 YOLO 탐지 결과의 bbox_2d 좌표를 최우선으로 활용하여 각 위치의 식재료를 분류하세요.
YOLO가 탐지하지 못한 추가 식재료도 찾아서 bbox_2d와 함께 포함하세요.
"""
    else:
        yolo_context = "YOLO 탐지 결과 없음 - 이미지를 직접 분석하여 모든 식재료 위치를 추정하세요."

    system_prompt = f"""당신은 최고 수준의 식재료 인식 전문가입니다.

{yolo_context}

**분석 규칙:**
1. YOLO가 탐지한 위치의 식재료를 정확하게 분류 (YOLO bbox 좌표 그대로 사용)
2. YOLO가 놓친 식재료도 추가로 찾기 — 이미지에서 해당 식재료가 실제로 보이는 위치의 bbox_2d 지정
3. 작은 물체, 겹친 물체, 일부 가려진 물체도 모두 포함
4. 한국어로 구체적인 이름 (예: '야채' ❌ → '시금치' ✅)
5. ❌ 절대 포함하지 말 것: 냉장고, 선반, 서랍, 용기, 그릇, 바구니, 트레이, 랩, 비닐봉지, 박스, 가전제품, 냉동실, 냉장실 등 식재료가 아닌 물건

**bbox_2d 작성 방법 (0-1000 스케일, [ymin, xmin, ymax, xmax]):**
- 이미지 전체 너비/높이를 1000으로 봤을 때 해당 식재료가 차지하는 픽셀 범위를 비율로 표현
- bbox는 해당 식재료 객체 자체를 딱 감싸는 상자 (이미지 분할 구역이 아님)
- 예: 이미지 왼쪽 상단에 있는 작은 당근 → [50, 30, 180, 150]
- 예: 이미지 오른쪽 하단에 있는 우유팩 → [650, 700, 950, 900]
- 여러 식재료가 각자 다른 위치에 있으면 bbox도 모두 달라야 함

**각 식재료 정보:**
- name: 식재료 이름 (한국어)
- category: 채소/육류/유제품/과일/기타
- quantity: 수량 (숫자)
- unit: 개/g/ml/봉지/병/팩 등
- freshness: 좋음/보통/나쁨
- packaging: 포장 상태
- confidence: 0.0~1.0 (확실할수록 1.0에 가깝게, 불확실하면 0.5이상)
- bbox_2d: [ymin, xmin, ymax, xmax] (해당 식재료 객체를 감싸는 박스, 0-1000 스케일)
- expiry_date_text: 유통기한 텍스트 (없으면 null)

**중요: confidence는 반드시 0.3 이상으로 설정하세요. 확실하지 않은 항목도 0.3으로 설정하고 포함시키세요.**
**확실한 식재료는 0.8~1.0, 덜 확실한 것도 0.3~0.7로 설정하여 모두 포함시키세요.**

JSON만 반환하세요: {{"items": [...]}}"""

    user_prompt = """이미지의 모든 식재료를 분석하여 JSON으로 반환하세요.

**매우 중요 - 모든 식재료를 빠짐없이 감지:**
- 냉장고/냉동고에 있는 모든 식재료를 하나도 빠뜨리지 마세요
- 작고 가려진 식재료도 반드시 포함하세요
- YOLO가 탐지한 모든 위치의 식재료 포함
- 추가로 보이는 모든 식재료도 포함
- 과일, 채소, 육류, 유제품, 소스,瓶, 병 등 모든食品을 포함

**감지 규칙:**
- 보이는 식재료는 반드시 1개 이상 감지 (보이지 않으면 제외)
- 작은 것, 겹친 것, 일부만 보이는 것도 포함
- bbox_2d는 각 식재료 객체를 딱 감싸는 박스 좌표
- 각 식재료마다 bbox가 실제 위치에 따라 모두 달라야 함

**감지 목표:**
- 반드시 15개 이상 (냉장고에 있는 모든食品)
- confidence: 확실한 것은 0.8~1.0, 덜 확실해도 0.3~0.7로 설정하고 포함"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            },
                        },
                    ],
                },
            ],
            max_tokens=5000,
            temperature=0.1,
        )

        content = response.choices[0].message.content
        logger.info(f"GPT-4o 응답 (앞 300자): {content[:300]}...")

        # JSON 추출
        json_match = re.search(r"\{.*\}", content, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
            items = result.get("items", [])
            logger.info(f"✅ GPT-4o 분류 완료: {len(items)}개 항목")
            return items
        else:
            logger.warning("GPT-4o 응답에서 JSON을 찾지 못했습니다")
            return []

    except Exception as e:
        logger.error(f"GPT-4o 분류 오류: {e}")
        return []


def merge_results(
    yolo_detections: List[Dict], gpt_items: List[Dict]
) -> List[Dict[str, Any]]:
    """YOLO의 정확한 bbox와 GPT-4o의 상세 분류를 통합"""
    if not gpt_items:
        return []

    final_items = []
    used_yolo_idxs = set()

    for gpt_item in gpt_items:
        gpt_bbox = gpt_item.get("bbox_2d")

        # GPT bbox와 가장 많이 겹치는 YOLO 탐지 찾기
        if gpt_bbox and yolo_detections:
            best_idx = find_best_yolo_match(gpt_bbox, yolo_detections)

            if best_idx is not None and best_idx not in used_yolo_idxs:
                # YOLO의 정확한 픽셀 기반 bbox로 교체
                original_bbox = gpt_item.get("bbox_2d")
                gpt_item["bbox_2d"] = yolo_detections[best_idx]["bbox_2d"]
                gpt_item["yolo_matched"] = True
                used_yolo_idxs.add(best_idx)
                logger.info(
                    f"  🔗 매칭: {gpt_item.get('name')} → "
                    f"GPT bbox {original_bbox} → YOLO bbox {gpt_item['bbox_2d']}"
                )
            else:
                gpt_item["yolo_matched"] = False
                logger.info(
                    f"  📌 GPT 전용: {gpt_item.get('name')} → bbox {gpt_bbox} (YOLO 매칭 없음)"
                )
        else:
            gpt_item["yolo_matched"] = False

        final_items.append(gpt_item)

    # YOLO가 탐지했지만 GPT가 분류하지 못한 항목 (매칭되지 않은 YOLO 탐지)
    unmatched_yolo = [
        d for idx, d in enumerate(yolo_detections) if idx not in used_yolo_idxs
    ]
    if unmatched_yolo:
        logger.info(f"⚠️ GPT가 누락한 YOLO 탐지 {len(unmatched_yolo)}개 → 기타로 추가")
        for detection in unmatched_yolo:
            final_items.append(
                {
                    "name": detection["yolo_class"],
                    "category": "기타",
                    "quantity": 1,
                    "unit": "개",
                    "freshness": "보통",
                    "packaging": "없음",
                    "confidence": detection["yolo_conf"],
                    "bbox_2d": detection["bbox_2d"],
                    "expiry_date_text": None,
                    "yolo_matched": True,
                }
            )

    logger.info(f"✅ 통합 완료: 최종 {len(final_items)}개 항목")
    return final_items


def validate_bbox(bbox) -> bool:
    """bbox_2d 유효성 검증"""
    if not bbox or not isinstance(bbox, list) or len(bbox) != 4:
        return False
    try:
        if not all(isinstance(x, (int, float)) for x in bbox):
            return False
        if not all(0 <= x <= 1000 for x in bbox):
            return False
        if bbox[0] >= bbox[2] or bbox[1] >= bbox[3]:
            return False
        return True
    except Exception:
        return False


def vision_agent_node(state: FridgeState) -> FridgeState:
    """Vision Agent 노드 - YOLO v8 + GPT-4o 하이브리드 식재료 인식"""
    try:
        logger.info("🚀 Vision Agent 시작 (YOLO v8 + GPT-4o 하이브리드)")

        image_path = state.get("image_path")
        if not image_path:
            raise ValueError("이미지 경로가 필요합니다")

        # ── 1단계: YOLO v8 객체 탐지 (정확한 픽셀 bbox) ──────────────
        logger.info("1단계: YOLO v8 탐지 시작...")
        yolo_detections = detect_with_yolo(image_path)
        logger.info(f"  YOLO 탐지 결과: {len(yolo_detections)}개")

        # ── 2단계: GPT-4o 식재료 분류 ─────────────────────────────────
        logger.info("2단계: GPT-4o 분류 시작...")
        base64_image = encode_image(image_path)
        gpt_items = classify_with_gpt(base64_image, yolo_detections)
        logger.info(f"  GPT-4o 분류 결과: {len(gpt_items)}개")

        # ── 3단계: 결과 통합 (YOLO bbox 우선 적용) ────────────────────
        logger.info("3단계: YOLO bbox + GPT-4o 분류 통합...")
        merged_items = merge_results(yolo_detections, gpt_items)

        # ── 비식재료 후처리 필터 ───────────────────────────────────────
        NON_FOOD_KEYWORDS = {
            "냉장고",
            "냉동고",
            "냉동실",
            "냉장실",
            "선반",
            "서랍",
            "트레이",
            "바구니",
            "용기",
            "그릇",
            "접시",
            "컵",
            "박스",
            "상자",
            "비닐",
            "랩",
            "호일",
            "가전",
            "기기",
            "칸",
            "공간",
            "문",
            "벽",
            "바닥",
            "천장",
        }
        before_count = len(merged_items)
        merged_items = [
            item
            for item in merged_items
            if not any(kw in item.get("name", "") for kw in NON_FOOD_KEYWORDS)
        ]
        filtered_count = before_count - len(merged_items)
        if filtered_count > 0:
            logger.info(f"🚫 비식재료 {filtered_count}개 필터링됨")

        # bbox 없는 항목은 그리드 배치 없이 그대로 유지 (프론트엔드에서 박스 미표시)
        items_without_bbox = [
            item for item in merged_items if not validate_bbox(item.get("bbox_2d"))
        ]
        if items_without_bbox:
            logger.warning(
                f"⚠️ {len(items_without_bbox)}개 항목 bbox 없음 → 박스 미표시"
            )

        # ── confidence 기준으로 confirmed / unidentified 분리 ──────────
        CONFIDENCE_THRESHOLD = 0.3
        confirmed_items = []
        unidentified_items = []

        for item in merged_items:
            if item.get("confidence", 0.0) >= CONFIDENCE_THRESHOLD:
                confirmed_items.append(item)
            else:
                unidentified_items.append(item)

        logger.info(
            f"📊 최종 결과: 확정 {len(confirmed_items)}개 / "
            f"미확인 {len(unidentified_items)}개 "
            f"(신뢰도 기준: {CONFIDENCE_THRESHOLD})"
        )

        state["detected_items"] = confirmed_items
        state["unidentified_items"] = unidentified_items
        state["current_step"] = "vision_completed"

        return state

    except Exception as e:
        logger.error(f"Vision Agent 오류: {e}")
        state["errors"].append(f"Vision Agent 오류: {str(e)}")
        state["detected_items"] = []
        state["unidentified_items"] = []
        state["current_step"] = "vision_error"
        return state
