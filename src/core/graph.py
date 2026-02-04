"""LangGraph 그래프 구성"""
from langgraph.graph import StateGraph, END
import logging

from .state import FridgeState
from ..agents.vision_agent import vision_agent_node
from ..agents.expiry_agent import expiry_agent_node
from ..agents.inventory_agent import inventory_agent_node
from ..agents.recipe_agent import recipe_agent_node
from ..agents.discussion_agent import discussion_agent_node
from ..agents.youtube_agent import youtube_agent_node
from ..agents.recommendation_agent import recommendation_agent_node
from ..utils.image_processor import validate_image

logger = logging.getLogger(__name__)


def validate_image_node(state: FridgeState) -> FridgeState:
    """이미지 검증 노드"""
    try:
        logger.info("이미지 검증 시작")
        if not state.get("image_path") and not state.get("image_data"):
            raise ValueError("이미지 경로 또는 이미지 데이터가 필요합니다")
        
        # 이미지 검증
        is_valid, message = validate_image(
            state.get("image_path"), 
            state.get("image_data")
        )
        
        if not is_valid:
            state["errors"].append(f"이미지 검증 실패: {message}")
            state["current_step"] = "validation_failed"
            return state
        
        state["current_step"] = "image_validated"
        logger.info("이미지 검증 완료")
        return state
        
    except Exception as e:
        logger.error(f"이미지 검증 중 오류: {e}")
        state["errors"].append(f"이미지 검증 오류: {str(e)}")
        state["current_step"] = "validation_error"
        return state


def create_fridge_graph() -> StateGraph:
    """냉장고 관리 그래프 생성"""
    
    # StateGraph 생성
    workflow = StateGraph(FridgeState)
    
    # 노드 추가
    workflow.add_node("validate_image", validate_image_node)
    workflow.add_node("vision_agent", vision_agent_node)
    workflow.add_node("expiry_agent", expiry_agent_node)
    workflow.add_node("inventory_agent", inventory_agent_node)
    workflow.add_node("recipe_agent", recipe_agent_node)
    workflow.add_node("discussion_agent", discussion_agent_node)
    workflow.add_node("youtube_agent", youtube_agent_node)
    workflow.add_node("recommendation_agent", recommendation_agent_node)
    
    # 엣지 정의
    workflow.set_entry_point("validate_image")
    
    workflow.add_edge("validate_image", "vision_agent")
    workflow.add_edge("vision_agent", "expiry_agent")
    
    # 병렬 처리: Expiry, Inventory, Recipe Agent
    workflow.add_edge("expiry_agent", "inventory_agent")
    workflow.add_edge("inventory_agent", "recipe_agent")
    
    # Recipe Agent 이후 Discussion Agent 실행 (에이전트 간 토론)
    workflow.add_edge("recipe_agent", "discussion_agent")
    workflow.add_edge("discussion_agent", "youtube_agent")
    workflow.add_edge("youtube_agent", "recommendation_agent")
    
    workflow.add_edge("recommendation_agent", END)
    
    return workflow.compile()


def should_continue(state: FridgeState) -> str:
    """조건부 라우팅을 위한 함수"""
    if state.get("errors"):
        return "error_handler"
    return "continue"
