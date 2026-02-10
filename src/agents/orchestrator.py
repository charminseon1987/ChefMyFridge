"""Orchestrator - LangGraph 실행 진입점"""
from datetime import datetime
from typing import Dict, Any, Optional
import logging
from ..core.state import FridgeState
from ..core.graph import create_fridge_graph

logger = logging.getLogger(__name__)


def initialize_state(image_path: Optional[str] = None, image_data: Optional[bytes] = None) -> FridgeState:
    """초기 State 생성"""
    return FridgeState(
        image_path=image_path,
        image_data=image_data,
        detected_items=[],
        unidentified_items=[],
        user_confirmed_items=[],
        expiry_data=[],
        expiry_alerts=[],
        inventory_status={},
        inventory_changes={},
        inventory_warnings=[],
        recipe_suggestions=[],
        discussion_result=None,
        youtube_videos={},
        final_recommendation=None,
        errors=[],
        current_step="initialized",
        start_time=datetime.now(),
        end_time=None
    )


async def run_orchestrator(image_path: Optional[str] = None, image_data: Optional[bytes] = None) -> Dict[str, Any]:
    """오케스트레이터 실행"""
    try:
        logger.info("오케스트레이터 시작")
        
        # State 초기화
        initial_state = initialize_state(image_path, image_data)
        
        # 그래프 생성 및 실행
        graph = create_fridge_graph()
        
        # 동기 실행 (LangGraph는 동기 실행 지원)
        final_state = graph.invoke(initial_state)
        
        # 결과 반환
        detected_items = final_state.get("detected_items", [])

        # 디버그: bbox_2d 확인
        logger.info(f"📦 Orchestrator - detected_items 개수: {len(detected_items)}")
        for idx, item in enumerate(detected_items):
            has_bbox = "있음" if item.get("bbox_2d") else "없음"
            logger.info(f"  항목 {idx+1}: {item.get('name')} - bbox_2d {has_bbox}: {item.get('bbox_2d')}")

        result = {
            "success": len(final_state.get("errors", [])) == 0,
            "detected_items": detected_items,
            "unidentified_items": final_state.get("unidentified_items", []),
            "user_confirmed_items": final_state.get("user_confirmed_items", []),
            "expiry_data": final_state.get("expiry_data", []),
            "expiry_alerts": final_state.get("expiry_alerts", []),
            "inventory_status": final_state.get("inventory_status", {}),
            "inventory_changes": final_state.get("inventory_changes", {}),
            "inventory_warnings": final_state.get("inventory_warnings", []),
            "recipe_suggestions": final_state.get("recipe_suggestions", []),
            "discussion_result": final_state.get("discussion_result", {}),
            "youtube_videos": final_state.get("youtube_videos", {}),
            "final_recommendation": final_state.get("final_recommendation", {}),
            "errors": final_state.get("errors", []),
            "current_step": final_state.get("current_step", "unknown"),
            "processing_time": (
                (final_state.get("end_time") or datetime.now()) -
                (final_state.get("start_time") or datetime.now())
            ).total_seconds()
        }
        
        from ..core.supabase_client import SupabaseManager
        
        # Save results to Supabase
        combined_inventory = final_state.get("expiry_data", [])
        if combined_inventory:
            logger.info(f"Saving {len(combined_inventory)} items to Supabase...")
            await SupabaseManager().save_inventory_items(combined_inventory)
            
        logger.info(f"오케스트레이터 완료: {result['current_step']}")
        
        return result
        
    except Exception as e:
        logger.error(f"오케스트레이터 실행 오류: {e}")
        return {
            "success": False,
            "errors": [str(e)],
            "current_step": "orchestrator_error"
        }
