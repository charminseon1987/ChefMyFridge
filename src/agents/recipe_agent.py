"""Recipe Agent - 레시피 추천"""
from typing import Dict, Any, List, Optional
import logging
from ..core.state import FridgeState
from ..rag.vector_store import get_vector_store

logger = logging.getLogger(__name__)


def calculate_match_rate(recipe_ingredients: List[str], available_ingredients: List[str]) -> float:
    """레시피 재료와 보유 재료의 매칭률 계산"""
    if not recipe_ingredients:
        return 0.0
    
    matched = 0
    for ingredient in recipe_ingredients:
        # 부분 매칭 허용
        for available in available_ingredients:
            if ingredient in available or available in ingredient:
                matched += 1
                break
    
    return matched / len(recipe_ingredients)


def recipe_agent_node(state: FridgeState) -> FridgeState:
    """Recipe Agent 노드 - 레시피 검색 및 추천"""
    try:
        logger.info("Recipe Agent 시작")
        
        detected_items = state.get("detected_items", [])
        user_confirmed_items = state.get("user_confirmed_items", [])
        expiry_data = state.get("expiry_data", [])
        
        # 보유 재료 목록 추출 (인식된 재료 + 사용자 확인 재료)
        all_items = detected_items + user_confirmed_items
        
        if not all_items:
            logger.warning("인식된 식재료가 없습니다")
            state["recipe_suggestions"] = []
            state["current_step"] = "recipe_completed"
            return state
        
        # 보유 재료 목록 추출
        available_ingredients = [item.get("name", "") for item in all_items]
        
        # 유통기한 임박 재료 우선 추출
        urgent_items = [
            item["item"] for item in expiry_data 
            if item.get("urgency") in ["즉시소비", "3일이내"]
        ]
        
        # 벡터 저장소에서 레시피 검색
        vector_store = get_vector_store()
        recipes = vector_store.search_recipes(available_ingredients, top_k=10)
        
        # 매칭률 계산 및 정렬
        recipe_suggestions = []
        for recipe in recipes:
            recipe_ingredients = recipe.get("ingredients", [])
            match_rate = calculate_match_rate(recipe_ingredients, available_ingredients)
            
            # 부족한 재료 확인
            missing_ingredients = [
                ing for ing in recipe_ingredients 
                if not any(ing in avail or avail in ing for avail in available_ingredients)
            ]
            
            # 우선순위 점수 계산 (5성급 호텔 수준 평가)
            priority_score = match_rate * 100
            
            # 유통기한 임박 재료 포함 시 보너스
            if any(item in recipe_ingredients for item in urgent_items):
                priority_score += 30
            
            # 고급 요리 보너스 (5성급 호텔 수준)
            recipe_title = recipe.get("title", "").lower()
            recipe_desc = recipe.get("description", "").lower()
            gourmet_keywords = ["프레젠테이션", "정교", "고급", "미슐랭", "스타", "레스토랑", "파인다이닝", 
                               "소스", "가니쉬", "플레이팅", "감각", "창의", "정성", "수준"]
            if any(keyword in recipe_title or keyword in recipe_desc for keyword in gourmet_keywords):
                priority_score += 25
            
            # 간단한 조리법 보너스 (하지만 너무 단순하면 감점)
            if recipe.get("difficulty") == "하":
                priority_score += 10  # 너무 단순하면 감점
            elif recipe.get("difficulty") == "상":
                priority_score += 15  # 정교한 요리는 보너스
            
            recipe_suggestion = {
                "title": recipe.get("title", ""),
                "match_rate": round(match_rate, 2),
                "ingredients_needed": recipe_ingredients,
                "missing_ingredients": missing_ingredients,
                "cooking_time": recipe.get("cooking_time", ""),
                "difficulty": recipe.get("difficulty", ""),
                "calories": recipe.get("calories", 0),
                "description": recipe.get("description", ""),
                "priority_score": priority_score,
                "priority_reason": "유통기한 임박 재료 포함" if any(item in recipe_ingredients for item in urgent_items) else ""
            }
            
            recipe_suggestions.append(recipe_suggestion)
        
        # 우선순위 점수로 정렬
        recipe_suggestions.sort(key=lambda x: x["priority_score"], reverse=True)
        
        # 상위 5개만 선택
        recipe_suggestions = recipe_suggestions[:5]
        
        # State 업데이트
        state["recipe_suggestions"] = recipe_suggestions
        state["current_step"] = "recipe_completed"
        
        logger.info(f"Recipe Agent 완료: {len(recipe_suggestions)}개 레시피 추천")
        
        return state
        
    except Exception as e:
        logger.error(f"Recipe Agent 오류: {e}")
        state["errors"].append(f"Recipe Agent 오류: {str(e)}")
        state["recipe_suggestions"] = []
        state["current_step"] = "recipe_error"
        return state


async def get_recipes_by_diet_type(
    diet_type: str,
    detected_items: List[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """식단 타입별 레시피 추천"""
    try:
        detected_items = detected_items or []
        available_ingredients = [item.get("name", "") for item in detected_items]
        
        # 식단 타입별 필터링 로직
        diet_filters = {
            "diet": {
                "max_calories": 300,
                "keywords": ["샐러드", "구운", "저칼로리", "단백질"],
                "avoid": ["튀김", "기름", "당분"]
            },
            "health": {
                "max_calories": 500,
                "keywords": ["영양", "균형", "건강", "신선"],
                "prefer": ["생선", "채소", "잡곡"]
            },
            "patient": {
                "max_calories": 250,
                "keywords": ["부드러운", "소화", "영양", "죽", "스프"],
                "avoid": ["매운", "짜다", "기름진"]
            }
        }
        
        filter_config = diet_filters.get(diet_type, {})
        
        # 벡터 저장소에서 레시피 검색
        vector_store = get_vector_store()
        recipes = vector_store.search_recipes(available_ingredients, top_k=20)
        
        # 식단 타입별 필터링
        filtered_recipes = []
        for recipe in recipes:
            # 칼로리 체크
            calories = recipe.get("calories", 0)
            if calories > filter_config.get("max_calories", 1000):
                continue
            
            # 키워드 매칭
            title = recipe.get("title", "").lower()
            description = recipe.get("description", "").lower()
            
            # 회피 키워드 체크
            avoid_keywords = filter_config.get("avoid", [])
            if any(keyword in title or keyword in description for keyword in avoid_keywords):
                continue
            
            # 선호 키워드 또는 일반 키워드 매칭
            prefer_keywords = filter_config.get("prefer", [])
            keywords = filter_config.get("keywords", [])
            
            score = 0
            if prefer_keywords:
                if any(keyword in title or keyword in description for keyword in prefer_keywords):
                    score += 50
            if any(keyword in title or keyword in description for keyword in keywords):
                score += 30
            
            # 매칭률 계산
            recipe_ingredients = recipe.get("ingredients", [])
            match_rate = calculate_match_rate(recipe_ingredients, available_ingredients)
            
            filtered_recipes.append({
                "id": recipe.get("id", ""),
                "title": recipe.get("title", ""),
                "description": recipe.get("description", ""),
                "cooking_time": recipe.get("cooking_time", ""),
                "difficulty": recipe.get("difficulty", "중"),
                "ingredients": recipe_ingredients,
                "calories": calories,
                "match_rate": round(match_rate, 2),
                "diet_score": score + (match_rate * 100),
            })
        
        # 점수로 정렬하고 상위 3개 반환
        filtered_recipes.sort(key=lambda x: x["diet_score"], reverse=True)
        return filtered_recipes[:3]
        
    except Exception as e:
        logger.error(f"식단 타입별 레시피 추천 오류: {e}")
        return []


async def generate_recipe_report(recipe_title: str, ingredients: List[str]) -> Dict[str, Any]:
    """선택된 레시피에 대한 상세 블로그 보고서 생성"""
    import os
    from openai import OpenAI
    
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        prompt = f"""
        당신은 인기 요리 블로거이자 푸드 칼럼니스트입니다.
        사용자가 선택한 요리: "{recipe_title}"
        
        사용자가 가진 냉장고 재료: {', '.join(ingredients)}
        
        이 요리에 대한 매력적이고 상세한 블로그 포스팅 스타일의 보고서를 작성해주세요.
        다음 내용을 반드시 포함해야 합니다:
        
        1. **요리 소개 (Intro)**: 이 요리의 매력, 유래, 맛의 특징 등을 감성적으로 서술
        2. **재료 준비 팁**: 가진 재료를 어떻게 손질하고 활용하면 좋은지 (특히 냉장고 재료 활용 팁)
        3. **상세 조리 과정 (Step-by-Step)**: 초보자도 따라 할 수 있는 구체적인 가이드
        4. **셰프의 킥 (Secret Tip)**: 맛을 한 단계 업그레이드할 수 있는 비법 (소스 비법, 불 조절 등)
        5. **플레이팅 및 페어링 추천**: 예쁘게 담는 법과 어울리는 음료 또는 반찬
        
        톤앤매너: 친근하고 전문적이며, 독자의 식욕을 자극하는 문체 사용. 이모지 적절히 활용.
        형식: 마크다운(Markdown) 형식으로 작성.
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "당신은 세계적인 요리 블로거입니다."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=2000,
            temperature=0.7
        )
        
        report_content = response.choices[0].message.content
        
        return {
            "title": recipe_title,
            "content": report_content,
            "author": "Secret Chef Agent"
        }
        
    except Exception as e:
        logger.error(f"레시피 보고서 생성 오류: {e}")
        return {
            "title": recipe_title,
            "content": f"보고서 생성 중 오류가 발생했습니다: {str(e)}",
            "author": "System"
        }
