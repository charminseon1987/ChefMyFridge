"""Inventory Agent - 재고 관리"""
from typing import Dict, Any, List
from datetime import datetime
import logging
from ..core.state import FridgeState

logger = logging.getLogger(__name__)

# 간단한 인메모리 재고 저장소 (실제로는 DB 사용)
_inventory_store: Dict[str, Dict[str, Any]] = {}


def inventory_agent_node(state: FridgeState) -> FridgeState:
    """Inventory Agent 노드 - 재고 업데이트 및 분석"""
    try:
        logger.info("Inventory Agent 시작")
        
        detected_items = state.get("detected_items", [])
        if not detected_items:
            logger.warning("인식된 식재료가 없습니다")
            state["inventory_status"] = {
                "총 품목 수": 0,
                "냉장": 0,
                "냉동": 0,
                "실온": 0
            }
            state["inventory_changes"] = {"새로 추가": [], "소진됨": []}
            state["inventory_warnings"] = []
            state["current_step"] = "inventory_completed"
            return state
        
        # 카테고리별 분류
        categories = {"냉장": 0, "냉동": 0, "실온": 0}
        new_items = []
        updated_items = []
        
        for item in detected_items:
            item_name = item.get("name", "알 수 없음")
            category = item.get("category", "기타")
            quantity = item.get("quantity", 1)
            
            # 보관 위치 결정 (카테고리 기반)
            storage_location = "냉장"
            if category in ["육류", "생선", "유제품"]:
                storage_location = "냉장"
            elif "냉동" in item.get("packaging", ""):
                storage_location = "냉동"
            elif category in ["과일", "채소"]:
                # 일부는 실온 보관
                if item_name in ["양파", "마늘", "감자", "바나나"]:
                    storage_location = "실온"
                else:
                    storage_location = "냉장"
            
            categories[storage_location] = categories.get(storage_location, 0) + 1
            
            # 재고 업데이트
            if item_name not in _inventory_store:
                _inventory_store[item_name] = {
                    "name": item_name,
                    "category": category,
                    "quantity": quantity,
                    "unit": item.get("unit", "개"),
                    "added_date": datetime.now().isoformat(),
                    "last_updated": datetime.now().isoformat(),
                    "location": storage_location
                }
                new_items.append(item_name)
            else:
                _inventory_store[item_name]["quantity"] = quantity
                _inventory_store[item_name]["last_updated"] = datetime.now().isoformat()
                updated_items.append(item_name)
        
        # 경고 생성
        warnings = []
        for item_name, item_data in _inventory_store.items():
            quantity = item_data.get("quantity", 0)
            if quantity > 10:
                warnings.append(f"🟡 과다: {item_name} ({quantity}개, 권장 3개)")
        
        # 현재 재고 상태
        inventory_status = {
            "총 품목 수": len(_inventory_store),
            "냉장": categories.get("냉장", 0),
            "냉동": categories.get("냉동", 0),
            "실온": categories.get("실온", 0)
        }
        
        # 변화 추적
        inventory_changes = {
            "새로 추가": new_items,
            "소진됨": []  # 실제로는 이전 재고와 비교 필요
        }
        
        # State 업데이트
        state["inventory_status"] = inventory_status
        state["inventory_changes"] = inventory_changes
        state["inventory_warnings"] = warnings
        state["current_step"] = "inventory_completed"
        
        logger.info(f"Inventory Agent 완료: {len(detected_items)}개 항목 처리")
        
        return state
        
    except Exception as e:
        logger.error(f"Inventory Agent 오류: {e}")
        state["errors"].append(f"Inventory Agent 오류: {str(e)}")
        state["inventory_status"] = {}
        state["inventory_changes"] = {}
        state["inventory_warnings"] = []
        state["current_step"] = "inventory_error"
        return state
