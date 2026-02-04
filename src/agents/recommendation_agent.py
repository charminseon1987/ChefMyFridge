"""Recommendation Agent - 최종 추천 생성"""
from typing import Dict, Any, List
from datetime import datetime, timedelta
import logging
from ..core.state import FridgeState

logger = logging.getLogger(__name__)


def recommendation_agent_node(state: FridgeState) -> FridgeState:
    """Recommendation Agent 노드 - 최종 추천 생성 (5성급 호텔 셰프 관점)"""
    try:
        logger.info("Recommendation Agent 시작 - 5성급 호텔 셰프 관점으로 최종 추천")
        
        detected_items = state.get("detected_items", [])
        expiry_data = state.get("expiry_data", [])
        inventory_status = state.get("inventory_status", {})
        recipe_suggestions = state.get("recipe_suggestions", [])
        
        # 요약 정보 생성
        total_items = len(detected_items)
        urgent_count = len([item for item in expiry_data if item.get("urgency") == "즉시소비"])
        three_days_count = len([item for item in expiry_data if item.get("urgency") == "3일이내"])
        safe_count = len([item for item in expiry_data if item.get("urgency") == "안전"])
        
        summary = {
            "총 식재료": total_items,
            "긴급 소비 필요": urgent_count,
            "3일 내 소비": three_days_count,
            "안전 재고": safe_count
        }
        
        # 우선 소비 순서 결정
        priority_actions = []
        for item in expiry_data:
            urgency = item.get("urgency", "")
            item_name = item.get("item", "")
            
            if urgency == "즉시소비":
                # 해당 재료를 사용하는 레시피 찾기
                matching_recipe = None
                for recipe in recipe_suggestions:
                    if item_name in recipe.get("ingredients_needed", []):
                        matching_recipe = recipe
                        break
                
                if matching_recipe:
                    priority_actions.append(
                        f"⭐ 셰프 추천: {item_name} → '{matching_recipe['title']}' (5성급 호텔 수준의 요리)"
                    )
                else:
                    priority_actions.append(f"🚨 오늘 꼭 소비: {item_name}")
            
            elif urgency == "3일이내":
                matching_recipe = None
                for recipe in recipe_suggestions:
                    if item_name in recipe.get("ingredients_needed", []):
                        matching_recipe = recipe
                        break
                
                if matching_recipe:
                    priority_actions.append(
                        f"⭐ 셰프 추천: {item_name} → '{matching_recipe['title']}' (고급 요리로 변신 가능)"
                    )
        
        # 최종 레시피 2개 선정 (최고의 요리)
        recommended_recipes = recipe_suggestions[:2]
        
        # 장보기 추천 리스트
        shopping_list = {
            "부족 품목": [],
            "다음 구매 권장일": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        }
        
        # 팁 생성
        tips = []
        for item in expiry_data:
            item_name = item.get("item", "")
            urgency = item.get("urgency", "")
            storage_tip = item.get("storage_tip", "")
            
            if urgency == "즉시소비":
                tips.append(f"⭐ 셰프 팁: {item_name}는 오늘 최고급 요리로 변신시키거나 냉동 보관 권장")
            elif storage_tip:
                tips.append(f"💡 {item_name}: {storage_tip}")
        
        # 비용 절감 계산 (간단한 추정)
        cost_saving = {
            "이번 주 폐기 방지 금액": f"약 {urgent_count * 5000:,}원",
            "월간 예상 절감": f"약 {urgent_count * 20000:,}원"
        }
        
        # 최종 추천 결과 (5성급 호텔 셰프 관점)
        final_recommendation = {
            "summary": summary,
            "priority_actions": priority_actions,
            "recommended_recipes": recommended_recipes,
            "shopping_list": shopping_list,
            "tips": tips,
            "cost_saving": cost_saving,
            "chef_message": "⭐ 세계 최고의 5성급 호텔 셰프가 냉장고 재료만으로 선정한 최고의 요리입니다. 미식가들이 감탄할 만한 품격 있는 요리를 즐기세요!",
            "generated_at": datetime.now().isoformat()
        }
        
        # State 업데이트
        state["final_recommendation"] = final_recommendation
        state["current_step"] = "recommendation_completed"
        state["end_time"] = datetime.now()
        
        logger.info("Recommendation Agent 완료")
        
        return state
        
    except Exception as e:
        logger.error(f"Recommendation Agent 오류: {e}")
        state["errors"].append(f"Recommendation Agent 오류: {str(e)}")
        state["final_recommendation"] = None
        state["current_step"] = "recommendation_error"
        return state
