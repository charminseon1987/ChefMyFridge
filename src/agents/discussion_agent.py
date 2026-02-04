"""Discussion Agent - Recipe Agent와 Recommendation Agent 간 토론"""
from typing import Dict, Any, List
import logging
import os
from openai import OpenAI
from ..core.state import FridgeState

logger = logging.getLogger(__name__)


def discussion_agent_node(state: FridgeState) -> FridgeState:
    """Discussion Agent 노드 - Recipe Agent와 Recommendation Agent가 논의하여 최고의 요리 선택"""
    try:
        logger.info("Discussion Agent 시작 - 에이전트 간 토론")
        
        recipe_suggestions = state.get("recipe_suggestions", [])
        detected_items = state.get("detected_items", [])
        expiry_data = state.get("expiry_data", [])
        user_confirmed_items = state.get("user_confirmed_items", [])
        
        if not recipe_suggestions:
            logger.warning("토론할 레시피가 없습니다")
            state["current_step"] = "discussion_completed"
            return state
        
        # OpenAI 클라이언트 초기화
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # 보유 재료 목록
        all_items = detected_items + user_confirmed_items
        available_ingredients = [item.get("name", "") for item in all_items]
        
        # 주요 카테고리 분석 (간단한 키워드 기반)
        meat_keywords = ["고기", "쇠고기", "돼지고기", "닭고기", "소고기", "양고기", "베이컨", "햄"]
        seafood_keywords = ["생선", "고등어", "오징어", "새우", "조개", "해물", "게", "낙지"]
        veggie_keywords = ["시금치", "당근", "양파", "브로콜리", "두부", "버섯", "파", "마늘", "배추"]
        
        category_counts = {"Meat": 0, "Seafood": 0, "Veggie": 0}
        
        for item in available_ingredients:
            if any(k in item for k in meat_keywords):
                category_counts["Meat"] += 1
            elif any(k in item for k in seafood_keywords):
                category_counts["Seafood"] += 1
            elif any(k in item for k in veggie_keywords):
                category_counts["Veggie"] += 1
                
        # 가장 많은 카테고리 선정
        main_category = max(category_counts, key=category_counts.get)
        if category_counts[main_category] == 0:
            main_category = "General"
            
        logger.info(f"선정된 주요 식재료 카테고리: {main_category}")
        
        # 카테고리별 페르소나 설정
        persona_role = "세계 최고의 5성급 호텔 총괄 셰프"
        if main_category == "Meat":
            persona_role = "세계적인 육류 요리 전문 셰프이자 미트 마스터"
        elif main_category == "Seafood":
            persona_role = "미슐랭 3스타 해산물 요리 전문 셰프"
        elif main_category == "Veggie":
            persona_role = "세계 최고의 비건 및 채식 요리 전문가"
            
        # 유통기한 임박 재료
        urgent_items = [
            item["item"] for item in expiry_data 
            if item.get("urgency") in ["즉시소비", "3일이내"]
        ]
        
        # 토론 프롬프트 구성
        discussion_prompt = f"""당신은 Recipe Agent와 Recommendation Agent가 함께 논의하는 오케스트레이터입니다.
현재 주요 식재료 테마는 '{main_category}'입니다.

현재 냉장고에 있는 재료:
{', '.join(available_ingredients)}

유통기한이 임박한 재료 (우선 소비 필요):
{', '.join(urgent_items) if urgent_items else '없음'}

Recipe Agent가 추천한 레시피 후보들:
"""
        
        for idx, recipe in enumerate(recipe_suggestions[:7], 1):  # 후보를 좀 더 많이 봄
            discussion_prompt += f"""
{idx}. {recipe.get('title', '')}
   - 매칭률: {recipe.get('match_rate', 0):.2%}
   - 조리 시간: {recipe.get('cooking_time', '')}
   - 난이도: {recipe.get('difficulty', '')}
   - 칼로리: {recipe.get('calories', 0)}kcal
   - 필요한 재료: {', '.join(recipe.get('ingredients_needed', []))}
   - 부족한 재료: {', '.join(recipe.get('missing_ingredients', []))}
   - 우선순위 점수: {recipe.get('priority_score', 0)}
"""
        
        discussion_prompt += f"""
당신은 {persona_role}입니다.
"냉장고를 부탁해"라는 컨셉으로, 냉장고에 있는 재료만으로 최고급 레스토랑 수준의 요리를 만들어야 합니다.

Recipe Agent와 Recommendation Agent의 역할:
- Recipe Agent: 레시피의 실현 가능성, 재료 활용도, 조리 난이도를 중시하는 실무 셰프
- Recommendation Agent: 유통기한 관리, 영양 균형, 사용자 편의성을 중시하는 영양사 겸 소믈리에

두 에이전트가 {persona_role}의 관점에서 논의하여 다음 기준으로 최고의 요리 3개를 선택하세요:

🎯 평가 기준:
1. 유통기한 임박 재료 활용도 (35%) - 낭비 없는 효율적인 재료 사용
2. 재료 매칭률 및 실현 가능성 (30%) - 냉장고 재료만으로 완벽한 요리 가능 여부
3. 미식가 수준의 맛과 프레젠테이션 (20%) - '{main_category}' 테마에 맞는 수준 높은 요리
4. 조리 편의성 및 시간 (15%) - 가정에서도 시도해볼 만한 레시피

💡 {main_category} 전문가의 관점:
- 주요 식재료({main_category})의 특성을 가장 잘 살린 요리를 우선합니다.
- 단순한 요리가 아닌, 재료의 풍미를 극대화할 수 있는 조리법을 선호합니다.
- 3가지 요리는 서로 다른 스타일(예: 국물 요리, 볶음 요리, 특별식 등)로 구성하여 다양성을 제공하세요.

논의 과정을 보여주고, 최종적으로 선택된 3개 레시피의 제목과 선택 이유를 JSON 형식으로 반환하세요.

형식:
{{
  "discussion": "에이전트 간 논의 내용 (카테고리별 전문가 관점 포함)",
  "selected_recipes": [
    {{
      "title": "레시피 제목 1",
      "reason": "선택 이유",
      "priority_score": 점수
    }},
    {{
      "title": "레시피 제목 2",
      "reason": "선택 이유",
      "priority_score": 점수
    }},
     {{
      "title": "레시피 제목 3",
      "reason": "선택 이유",
      "priority_score": 점수
    }}
  ]
}}
"""
        
        # GPT-4를 사용하여 토론 진행
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": f"""당신은 {persona_role}입니다. 
"냉장고를 부탁해"라는 컨셉으로, 냉장고에 있는 재료만으로 최고급 레스토랑 수준의 요리를 만들어야 합니다.
Recipe Agent와 Recommendation Agent가 논의하는 과정을 이끌며, 두 에이전트의 관점을 종합하여 
미식가들이 감탄할 만한 최고의 요리 3개를 선택하세요. 단순한 요리가 아닌, 창의적이고 정교하며 
프레젠테이션까지 완벽한 5성급 호텔 수준의 요리를 추천해야 합니다."""
                },
                {
                    "role": "user",
                    "content": discussion_prompt
                }
            ],
            max_tokens=2500,
            temperature=0.7
        )
        
        # 응답 파싱
        content = response.choices[0].message.content
        
        # JSON 추출
        import json
        import re
        
        json_match = re.search(r'\{.*\}', content, re.DOTALL)
        if json_match:
            json_str = json_match.group()
            try:
                discussion_result = json.loads(json_str)
            except json.JSONDecodeError:
                 discussion_result = None
        else:
            discussion_result = None
            
        if not discussion_result:
            # JSON 파싱 실패 혹은 없음 -> 상위 3개 자동 선택
            discussion_result = {
                "discussion": "자동 선택: 상위 3개 레시피 (토론 파싱 실패)",
                "selected_recipes": []
            }
            for i in range(min(3, len(recipe_suggestions))):
                 discussion_result["selected_recipes"].append({
                        "title": recipe_suggestions[i].get("title", ""),
                        "reason": "우선순위 점수 기반 자동 선택",
                        "priority_score": recipe_suggestions[i].get("priority_score", 0)
                 })

        # 선택된 레시피의 전체 정보 가져오기
        selected_recipe_titles = [r["title"] for r in discussion_result.get("selected_recipes", [])]
        final_selected_recipes = []
        
        for recipe in recipe_suggestions:
            if recipe.get("title") in selected_recipe_titles:
                final_selected_recipes.append(recipe)
        
        # 정확히 3개가 선택되지 않으면 상위 3개 사용 (부족하면 있는 만큼)
        if len(final_selected_recipes) < min(3, len(recipe_suggestions)):
             # 이미 선택된 것 외에 추가로 채움
             existing_titles = [r["title"] for r in final_selected_recipes]
             for recipe in recipe_suggestions:
                 if recipe.get("title") not in existing_titles:
                     final_selected_recipes.append(recipe)
                     if len(final_selected_recipes) >= 3:
                         break
        
        # 최대 3개까지만
        final_selected_recipes = final_selected_recipes[:3]
        
        # State 업데이트
        state["recipe_suggestions"] = final_selected_recipes
        state["discussion_result"] = discussion_result
        state["current_step"] = "discussion_completed"
        
        logger.info(f"Discussion Agent 완료: {len(final_selected_recipes)}개 레시피 선택 ({main_category} 테마)")
        logger.info(f"토론 내용: {discussion_result.get('discussion', '')[:100]}...")
        
        return state
        
    except Exception as e:
        logger.error(f"Discussion Agent 오류: {e}")
        # 오류 발생 시 상위 3개 자동 선택
        recipe_suggestions = state.get("recipe_suggestions", [])
        top_n = recipe_suggestions[:3]
        
        selected_recipes_list = []
        for r in top_n:
             selected_recipes_list.append({
                "title": r.get("title", ""),
                "reason": "자동 선택 (오류 발생)",
                "priority_score": r.get("priority_score", 0)
            })
            
        state["recipe_suggestions"] = top_n
        state["discussion_result"] = {
            "discussion": f"토론 중 오류 발생: {str(e)}. 상위 3개 레시피 자동 선택",
            "selected_recipes": selected_recipes_list
        }
        state["current_step"] = "discussion_completed"
        return state
