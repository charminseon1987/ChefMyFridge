"""Recipe Agent - 레시피 추천"""

from typing import Dict, Any, List, Optional
import logging
import os
import json
from openai import OpenAI
from ..core.state import FridgeState
from ..rag.vector_store import get_vector_store

logger = logging.getLogger(__name__)


def calculate_match_rate(
    recipe_ingredients: List[str], available_ingredients: List[str]
) -> float:
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


def generate_recipes_with_gpt(
    available_ingredients: List[str],
    urgent_items: List[str],
    diet_type: str | None = None,
) -> List[Dict[str, Any]]:
    """GPT-4o-mini로 보유 재료 기반 레시피 동적 생성"""
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

    urgent_note = ""
    if urgent_items:
        urgent_note = (
            f"\n⚠️ 유통기한 임박 재료 (반드시 우선 활용): {', '.join(urgent_items)}"
        )

    # 식단 타입에 따른 프롬프트 조정
    diet_instruction = ""
    if diet_type == "diet":
        diet_instruction = "\n🥗 다이어트 식단을 위해 칼로리가 낮고 건강함을 유지하는 요리로 구성하세요. 기름이나 당분이 많은 요리는 피하고, 샐러드, 구운 요리, 저칼로리 메뉴를 포함하세요."
    elif diet_type == "health":
        diet_instruction = "\n💚 건강식을 위해 영양 균형이 잡힌 요리로 구성하세요. 신선한 채소와 과일, 잡곡, проте인이 풍부한 요리를 포함하세요."
    elif diet_type == "patient":
        diet_instruction = "\n🏥 환자식/병식 için 부드럽고 소화가 잘되는 요리로 구성하세요. 매운 음식, 짠 음식, 기름진 요리는 피하고 죽, 스프, 부드러운 요리를 포함하세요."
    elif diet_type == "general":
        diet_instruction = "\n🍽️ 일반 식단으로 다양하고 맛있는 요리로 구성하세요."

    prompt = f"""냉장고에 다음 식재료가 있습니다:
{", ".join(available_ingredients)}
{urgent_note}
{diet_instruction}

위 재료를 최대한 활용하여 만들 수 있는 한국 요리 20가지를 추천해주세요.
유통기한 임박 재료가 있다면 그 재료를 사용하는 레시피를 우선 포함하세요.

각 레시피는 반드시 아래 JSON 형식으로 반환하세요:
{{
  "recipes": [
    {{
      "title": "레시피 이름",
      "description": "한 줄 설명",
      "ingredients": ["재료1", "재료2", ...],
      "missing_ingredients": ["보유하지 않은 추가 재료"],
      "cooking_time": "20분",
      "difficulty": "하/중/상",
      "calories": 300,
      "uses_urgent": true
    }}
  ]
}}

규칙:
- 보유 재료를 최대한 활용하는 현실적인 레시피
- 20가지 모두 서로 다른 요리 (국, 찌개, 볶음, 무침, 구이, 샐러드, 죽, 스프, pasta, rice dish 등 다양하게)
- 매번 다른 창의적인 조합 추천
- JSON만 반환"""

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "당신은 한국 요리 전문 셰프입니다. 주어진 재료로 만들 수 있는 창의적이고 맛있는 레시피를 추천합니다.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.9,
        )
        result = json.loads(response.choices[0].message.content or "{}")
        recipes = result.get("recipes", [])
        logger.info(f"✅ GPT-4o-mini 레시피 생성 완료: {len(recipes)}개")
        return recipes
    except Exception as e:
        logger.error(f"GPT-4o 레시피 생성 오류: {e}")
        return []


def recipe_agent_node(state: FridgeState) -> FridgeState:
    """Recipe Agent 노드 - GPT-4o 기반 동적 레시피 추천"""
    try:
        logger.info("Recipe Agent 시작")

        detected_items = state.get("detected_items", [])
        user_confirmed_items = state.get("user_confirmed_items", [])
        expiry_data = state.get("expiry_data", [])

        all_items = detected_items + user_confirmed_items

        if not all_items:
            logger.warning("인식된 식재료가 없습니다")
            state["recipe_suggestions"] = []
            state["current_step"] = "recipe_completed"
            return state

        available_ingredients = [
            item.get("name", "") for item in all_items if item.get("name")
        ]

        urgent_items = [
            item["item"]
            for item in expiry_data
            if item.get("urgency") in ["즉시소비", "3일이내"]
        ]

        # GPT-4o-mini로 보유 재료 기반 레시피 동적 생성
        logger.info(f"GPT-4o-mini 레시피 생성 중... 재료: {available_ingredients[:10]}")
        diet_type = state.get("diet_type", "general")
        raw_recipes = generate_recipes_with_gpt(
            available_ingredients, urgent_items, diet_type
        )

        recipe_suggestions = []
        for recipe in raw_recipes:
            recipe_ingredients = recipe.get("ingredients", [])
            match_rate = calculate_match_rate(recipe_ingredients, available_ingredients)
            uses_urgent = recipe.get("uses_urgent", False) or any(
                u in recipe_ingredients for u in urgent_items
            )
            priority_score = match_rate * 100 + (30 if uses_urgent else 0)

            recipe_suggestions.append(
                {
                    "title": recipe.get("title", ""),
                    "match_rate": round(match_rate, 2),
                    "ingredients_needed": recipe_ingredients,
                    "missing_ingredients": recipe.get("missing_ingredients", []),
                    "cooking_time": recipe.get("cooking_time", ""),
                    "difficulty": recipe.get("difficulty", "중"),
                    "calories": recipe.get("calories", 0),
                    "description": recipe.get("description", ""),
                    "priority_score": priority_score,
                    "priority_reason": "유통기한 임박 재료 포함" if uses_urgent else "",
                }
            )

        recipe_suggestions.sort(key=lambda x: x["priority_score"], reverse=True)
        recipe_suggestions = recipe_suggestions[:20]

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
    diet_type: str, detected_items: List[Dict[str, Any]] | None = None
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
                "avoid": ["튀김", "기름", "당분"],
            },
            "health": {
                "max_calories": 500,
                "keywords": ["영양", "균형", "건강", "신선"],
                "prefer": ["생선", "채소", "잡곡"],
            },
            "patient": {
                "max_calories": 250,
                "keywords": ["부드러운", "소화", "영양", "죽", "스프"],
                "avoid": ["매운", "짜다", "기름진"],
            },
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
            if any(
                keyword in title or keyword in description for keyword in avoid_keywords
            ):
                continue

            # 선호 키워드 또는 일반 키워드 매칭
            prefer_keywords = filter_config.get("prefer", [])
            keywords = filter_config.get("keywords", [])

            score = 0
            if prefer_keywords:
                if any(
                    keyword in title or keyword in description
                    for keyword in prefer_keywords
                ):
                    score += 50
            if any(keyword in title or keyword in description for keyword in keywords):
                score += 30

            # 매칭률 계산
            recipe_ingredients = recipe.get("ingredients", [])
            match_rate = calculate_match_rate(recipe_ingredients, available_ingredients)

            filtered_recipes.append(
                {
                    "id": recipe.get("id", ""),
                    "title": recipe.get("title", ""),
                    "description": recipe.get("description", ""),
                    "cooking_time": recipe.get("cooking_time", ""),
                    "difficulty": recipe.get("difficulty", "중"),
                    "ingredients": recipe_ingredients,
                    "calories": calories,
                    "match_rate": round(match_rate, 2),
                    "diet_score": score + (match_rate * 100),
                }
            )

        # 점수로 정렬하고 상위 3개 반환
        filtered_recipes.sort(key=lambda x: x["diet_score"], reverse=True)
        return filtered_recipes[:3]

    except Exception as e:
        logger.error(f"식단 타입별 레시피 추천 오류: {e}")
        return []


async def generate_recipe_report(
    recipe_title: str, ingredients: List[str], servings: int = 2
) -> Dict[str, Any]:
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
        Available Ingredients: {", ".join(ingredients)}
        Servings: {servings} people
        
        Write a structured recipe report.
        - IMPORTANT: Adjust all ingredient amounts to match {servings} servings.
        - Tone: Professional yet friendly, appetizing.
        - Language: Korean (Hangul).
        """

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        content_str = response.choices[0].message.content or "{}"
        report_data = json.loads(content_str)

        return {
            "title": recipe_title,
            "content": report_data,  # JSON object
            "author": "Secret Chef Agent",
            "format": "json",
        }

    except Exception as e:
        logger.error(f"레시피 보고서 생성 오류: {e}")
        return {
            "title": recipe_title,
            "content": {"error": f"보고서 생성 실패: {str(e)}"},
            "author": "System",
            "format": "error",
        }
