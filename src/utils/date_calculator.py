"""날짜 계산 유틸리티"""
from datetime import datetime, timedelta
from typing import Optional, Tuple


def calculate_days_left(expiry_date: str, current_date: Optional[datetime] = None) -> int:
    """유통기한까지 남은 일수 계산"""
    if current_date is None:
        current_date = datetime.now()
    
    try:
        if isinstance(expiry_date, str):
            expiry = datetime.strptime(expiry_date, "%Y-%m-%d")
        else:
            expiry = expiry_date
        
        delta = expiry - current_date
        return delta.days
        
    except Exception as e:
        return -1


def get_urgency_level(days_left: int) -> str:
    """긴급도 레벨 반환"""
    if days_left < 0:
        return "만료됨"
    elif days_left == 0:
        return "즉시소비"
    elif days_left <= 3:
        return "3일이내"
    elif days_left <= 7:
        return "1주이내"
    else:
        return "안전"


def adjust_expiry_for_opened(item: Dict, base_expiry_days: int) -> int:
    """개봉 제품의 유통기한 조정 (50% 적용)"""
    if item.get("packaging") == "개봉":
        return max(1, base_expiry_days // 2)
    return base_expiry_days
