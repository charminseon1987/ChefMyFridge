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
    """선택된 레시피에 대한 상세 보고서 생성 (Structured JSON)"""
    import os
    import json
    from openai import OpenAI
    
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        system_prompt = """You are a world-class chef and food columnist.
        You must output a JSON object describing the recipe report.
        The JSON must follow this structure:
        {
            "title": "Recipe Name",
            "intro": "A catchy, 1-sentence emotional introduction.",
            "stats": {
                "time": "e.g. 20min",
                "difficulty": "e.g. Easy/Medium/Hard",
                "calories": "e.g. 450kcal"
            },
            "ingredients": [
                {"name": "Ingredient Name", "amount": "Quantity", "note": "Preparation note (optional)"}
            ],
            "steps": [
                {"step": 1, "action": "Clear instruction", "tip": "Helpful tip for this step"}
            ],
            "chef_kick": "A secret tip to make it taste professional",
            "pairing": "Drink or side dish recommendation"
        }
        """

        user_prompt = f"""
        Recipe: "{recipe_title}"
        Available Ingredients: {', '.join(ingredients)}
        
        Write a structured recipe report.
        - Tone: Professional yet friendly, appetizing.
        - Language: Korean (Hangul).
        """
        
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        content_str = response.choices[0].message.content
        report_data = json.loads(content_str)
        
        return {
            "title": recipe_title,
            "content": report_data, # JSON object
            "author": "Secret Chef Agent",
            "format": "json"
        }
        
    except Exception as e:
        logger.error(f"레시피 보고서 생성 오류: {e}")
        return {
            "title": recipe_title,
            "content": {"error": f"보고서 생성 실패: {str(e)}"},
            "author": "System",
            "format": "error"
        }
