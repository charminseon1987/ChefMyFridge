"""LangGraph State 정의"""
from typing import TypedDict, List, Dict, Optional, Any
from datetime import datetime


class FridgeState(TypedDict):
    """LangGraph State 정의 - 모든 에이전트 간 공유 상태"""
    
    # 입력
    image_path: Optional[str]
    image_data: Optional[bytes]
    
    # Vision Agent 결과
    detected_items: List[Dict[str, Any]]
    unidentified_items: List[Dict[str, Any]]  # 파악 안된 재료들 (confidence < 0.7)
    user_confirmed_items: List[Dict[str, Any]]  # 사용자가 확인/추가한 재료들
    
    # Expiry Agent 결과
    expiry_data: List[Dict[str, Any]]
    expiry_alerts: List[str]
    
    # Inventory Agent 결과
    inventory_status: Dict[str, Any]
    inventory_changes: Dict[str, List[str]]
    inventory_warnings: List[str]
    
    # Recipe Agent 결과
    recipe_suggestions: List[Dict[str, Any]]
    
    # Discussion Agent 결과
    discussion_result: Optional[Dict[str, Any]]  # 에이전트 간 토론 결과
    
    # YouTube Agent 결과
    youtube_videos: Dict[str, List[Dict[str, Any]]]  # 레시피 제목 -> 유튜브 영상 리스트
    
    # Recommendation Agent 최종 결과
    final_recommendation: Optional[Dict[str, Any]]
    
    # 메타데이터
    errors: List[str]
    current_step: str
    start_time: Optional[datetime]
    end_time: Optional[datetime]
