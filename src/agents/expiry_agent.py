"""Expiry Agent - 유통기한 관리"""
from datetime import datetime, timedelta
from typing import Dict, Any, List
import logging
from ..core.state import FridgeState
from ..utils.date_calculator import calculate_days_left, get_urgency_level, adjust_expiry_for_opened

logger = logging.getLogger(__name__)

# 유통기한 데이터베이스 (간단한 딕셔너리 형태)
EXPIRY_DB = {
    "당근": {"base_days": 14, "storage": "냉장"},
    "양파": {"base_days": 30, "storage": "실온"},
    "감자": {"base_days": 30, "storage": "실온"},
    "시금치": {"base_days": 5, "storage": "냉장"},
    "상추": {"base_days": 5, "storage": "냉장"},
    "배추": {"base_days": 7, "storage": "냉장"},
    "우유": {"base_days": 7, "storage": "냉장"},
    "두부": {"base_days": 3, "storage": "냉장"},
    "계란": {"base_days": 21, "storage": "냉장"},
    "닭고기": {"base_days": 2, "storage": "냉장"},
    "돼지고기": {"base_days": 3, "storage": "냉장"},
    "소고기": {"base_days": 3, "storage": "냉장"},
    "생선": {"base_days": 2, "storage": "냉장"},
    "사과": {"base_days": 14, "storage": "냉장"},
    "바나나": {"base_days": 5, "storage": "실온"},
    "토마토": {"base_days": 7, "storage": "실온"},
    "고추": {"base_days": 7, "storage": "냉장"},
    "마늘": {"base_days": 60, "storage": "실온"},
    "생강": {"base_days": 14, "storage": "냉장"},
    "대파": {"base_days": 7, "storage": "냉장"},
}


def get_expiry_info(item_name: str) -> Dict[str, Any]:
    """식재료별 유통기한 정보 조회"""
    # 정확한 매칭 시도
    if item_name in EXPIRY_DB:
        return EXPIRY_DB[item_name]
    
    # 부분 매칭 시도
    for key, value in EXPIRY_DB.items():
        if key in item_name or item_name in key:
            return value
    
    # 기본값 반환
    return {"base_days": 7, "storage": "냉장"}


def expiry_agent_node(state: FridgeState) -> FridgeState:
    """Expiry Agent 노드 - 유통기한 계산 및 경고 생성"""
    try:
        logger.info("Expiry Agent 시작")
        
        detected_items = state.get("detected_items", [])
        if not detected_items:
            logger.warning("인식된 식재료가 없습니다")
            state["expiry_data"] = []
            state["expiry_alerts"] = []
            state["current_step"] = "expiry_completed"
            return state
        
        current_date = datetime.now()
        expiry_data = []
        alerts = []
        
        for item in detected_items:
            item_name = item.get("name", "알 수 없음")
            expiry_info = get_expiry_info(item_name)
            
            # 기본 유통기한 일수
            base_days = expiry_info.get("base_days", 7)
            
            # 개봉 여부에 따른 조정
            adjusted_days = adjust_expiry_for_opened(item, base_days)
            
            # 유통기한 날짜 계산 (구매일을 오늘로 가정)
            purchase_date = current_date.strftime("%Y-%m-%d")
            expiry_date = (current_date + timedelta(days=adjusted_days)).strftime("%Y-%m-%d")
            
            # 남은 일수 계산
            days_left = calculate_days_left(expiry_date, current_date)
            
            # 긴급도 레벨
            urgency = get_urgency_level(days_left)
            
            expiry_item = {
                "item": item_name,
                "purchase_date": purchase_date,
                "expiry_date": expiry_date,
                "days_left": days_left,
                "urgency": urgency,
                "storage_tip": f"{expiry_info.get('storage', '냉장')} 보관 필수",
                "category": item.get("category", "기타"),
                "quantity": item.get("quantity", 1)
            }
            
            expiry_data.append(expiry_item)
            
            # 경고 생성
            if urgency == "즉시소비":
                alerts.append(f"🚨 오늘 소비 권장: {item_name}")
            elif urgency == "3일이내":
                alerts.append(f"⚠️ 3일 이내 소비: {item_name}")
            elif urgency == "1주이내":
                alerts.append(f"📅 1주일 이내 소비: {item_name}")
        
        # State 업데이트
        state["expiry_data"] = expiry_data
        state["expiry_alerts"] = alerts
        state["current_step"] = "expiry_completed"
        
        logger.info(f"Expiry Agent 완료: {len(expiry_data)}개 항목 처리")
        
        return state
        
    except Exception as e:
        logger.error(f"Expiry Agent 오류: {e}")
        state["errors"].append(f"Expiry Agent 오류: {str(e)}")
        state["expiry_data"] = []
        state["expiry_alerts"] = []
        state["current_step"] = "expiry_error"
        return state
