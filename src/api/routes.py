"""API 라우트"""

from fastapi import APIRouter, UploadFile, File, HTTPException, Body, Form
from fastapi.responses import JSONResponse
import os
import tempfile
import logging
from typing import Optional, List, Dict, Any

from ..agents.orchestrator import run_orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["fridge"])


@router.post("/analyze")
async def analyze_fridge_image(
    file: UploadFile = File(...),
    servings: int = Form(2),
    diet_type: str = Form("general"),
):
    """냉장고 이미지 분석 (인분, 식단 타입 포함)"""
    try:
        # 파일 검증
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=400, detail="이미지 파일만 업로드 가능합니다"
            )

        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=os.path.splitext(file.filename)[1]
        ) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name

        try:
            # 오케스트레이터 실행
            result = await run_orchestrator(
                image_path=tmp_file_path, servings=servings, diet_type=diet_type
            )

            return JSONResponse(content=result)

        finally:
            # 임시 파일 삭제
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)

    except Exception as e:
        logger.error(f"이미지 분석 오류: {e}")
        raise HTTPException(
            status_code=500, detail=f"분석 중 오류가 발생했습니다: {str(e)}"
        )


@router.get("/recipes")
async def get_recipes():
    """레시피 목록 조회 (테스트용)"""
    from ..rag.vector_store import DEFAULT_RECIPES

    return {"recipes": DEFAULT_RECIPES}


@router.post("/confirm-items")
async def confirm_items(request_data: Dict[str, Any] = Body(...)):
    """사용자가 미확인 재료를 확인/추가하는 엔드포인트"""
    try:
        confirmed_items = request_data.get("confirmed_items", [])
        session_id = request_data.get("session_id")  # 세션 관리용 (선택사항)

        if not confirmed_items:
            raise HTTPException(status_code=400, detail="확인된 재료 목록이 필요합니다")

        # 재료 형식 검증
        for item in confirmed_items:
            if not isinstance(item, dict) or "name" not in item:
                raise HTTPException(
                    status_code=400, detail="각 재료는 'name' 필드를 포함해야 합니다"
                )

        # 여기서는 간단히 확인된 재료를 반환
        # 실제로는 세션 저장소나 DB에 저장하여 다음 분석에 사용
        return JSONResponse(
            content={
                "success": True,
                "confirmed_items": confirmed_items,
                "message": f"{len(confirmed_items)}개 재료가 확인되었습니다",
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"재료 확인 오류: {e}")
        raise HTTPException(
            status_code=500, detail=f"재료 확인 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/recipes/by-diet-type")
async def get_recipes_by_diet_type(request_data: Dict[str, Any] = Body(...)):
    """식단 타입별 레시피 추천"""
    try:
        diet_type = request_data.get("diet_type")
        detected_items = request_data.get("detected_items", [])

        # 식단 타입 검증
        valid_types = ["diet", "health", "patient"]
        if diet_type not in valid_types:
            raise HTTPException(
                status_code=400, detail=f"유효한 식단 타입: {', '.join(valid_types)}"
            )

        # Recipe Agent를 통해 식단 타입과 감지된 식재료를 기반으로 레시피 추천
        from ..agents.recipe_agent import get_recipes_by_diet_type as get_recipes
        from ..agents.youtube_agent import search_youtube_videos

        recipes = await get_recipes(diet_type=diet_type, detected_items=detected_items)

        # 각 레시피에 대해 유튜브 영상 검색
        youtube_videos = {}
        for recipe in recipes[:5]:  # 상위 5개 레시피만
            recipe_title = recipe.get("title", "")
            if recipe_title:
                search_query = f"{recipe_title} 레시피"
                videos = search_youtube_videos(search_query, max_results=2)
                if videos:
                    youtube_videos[recipe_title] = videos

        return JSONResponse(
            content={"recipes": recipes, "youtube_videos": youtube_videos}
        )

    except Exception as e:
        logger.error(f"레시피 추천 오류: {e}")
        raise HTTPException(
            status_code=500, detail=f"레시피 추천 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/recipes/generate-report")
async def generate_report_endpoint(request_data: Dict[str, Any] = Body(...)):
    """선택된 레시피에 대한 상세 보고서 생성"""
    try:
        recipe_title = request_data.get("recipe_title")
        ingredients = request_data.get("ingredients", [])

        if not recipe_title:
            raise HTTPException(status_code=400, detail="레시피 제목이 필요합니다")

        from ..agents.recipe_agent import generate_recipe_report

        report = await generate_recipe_report(recipe_title, ingredients)

        return JSONResponse(content=report)

    except Exception as e:
        logger.error(f"보고서 생성 오류: {e}")
        raise HTTPException(
            status_code=500, detail=f"보고서 생성 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/chat")
async def chat_with_fridge(request_data: Dict[str, Any] = Body(...)):
    """냉장고 데이터 기반 챗봇 질의응답"""
    try:
        user_message = request_data.get("message")
        if not user_message:
            raise HTTPException(status_code=400, detail="질문 내용이 필요합니다")

        from ..agents.qa_agent import answer_user_question

        reply = await answer_user_question(user_message)

        return JSONResponse(content={"reply": reply})

    except Exception as e:
        logger.error(f"채팅 오류: {e}")
        raise HTTPException(status_code=500, detail=f"챗봇 오류: {str(e)}")


@router.post("/recipes/ai-recommend")
async def ai_recommend_with_user_choice(request_data: Dict[str, Any] = Body(...)):
    """
    AI가 사용자에게 식사 종류를 물어보고, 사용자의 답변에 따라 diet_type을 결정하여
    20개 레시피와 유튜브 영상을 추천합니다.
    """
    try:
        user_answer = request_data.get("user_answer", "")
        detected_items = request_data.get("detected_items", [])

        if not user_answer:
            raise HTTPException(status_code=400, detail="사용자 답변 내용이 필요합니다")

        from openai import OpenAI
        import os
        import json

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": """당신은 식단 추천 시스템입니다. 사용자의 답변에서 식단 타입을 결정하세요.
                    
                    diet_type 결정 규칙:
                    - "다이어트", "급식", "다이어트 식단", "살 빼는", "칼로리" → "diet"
                    - "건강", "건강식", "영양", "채식", "신선한" → "health"
                    - "환자", "환자식", "병식", "소화", "부드러운" → "patient"
                    - 그 외 → "general"
                    
                    JSON으로만 반환: {"diet_type": "diet|health|patient|general", "reason": "선택 이유"}""",
                },
                {"role": "user", "content": f"사용자 답변: {user_answer}"},
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        result = json.loads(response.choices[0].message.content or "{}")
        diet_type = result.get("diet_type", "general")

        logger.info(f"AI가 판단한 diet_type: {diet_type} (사용자 답변: {user_answer})")

        from ..agents.recipe_agent import (
            generate_recipes_with_gpt,
            calculate_match_rate,
        )
        from ..agents.youtube_agent import search_youtube_videos

        available_ingredients = [
            item.get("name", "") for item in detected_items if item.get("name")
        ]

        if not available_ingredients:
            return JSONResponse(
                content={
                    "diet_type": diet_type,
                    "recipes": [],
                    "youtube_videos": {},
                    "message": "감지된 식재료가 없습니다",
                }
            )

        # GPT로 레시피 생성
        recipes = generate_recipes_with_gpt(available_ingredients, [], diet_type)

        # 각 레시피에 매칭률 계산
        for recipe in recipes:
            recipe_ingredients = recipe.get("ingredients", [])
            match_rate = calculate_match_rate(recipe_ingredients, available_ingredients)
            recipe["match_rate"] = round(match_rate * 100)  # 백분위로 변환

        # 매칭률순 정렬
        recipes.sort(key=lambda x: x.get("match_rate", 0), reverse=True)

        youtube_videos = {}
        for recipe in recipes[:10]:
            recipe_title = recipe.get("title", "")
            if recipe_title:
                videos = search_youtube_videos(f"{recipe_title} 레시피", max_results=2)
                if videos:
                    youtube_videos[recipe_title] = videos

        return JSONResponse(
            content={
                "diet_type": diet_type,
                "user_answer": user_answer,
                "recipes": recipes,
                "youtube_videos": youtube_videos,
                "message": f"'{user_answer}' 답변을 기반으로 {len(recipes)}개 레시피를 찾았습니다",
            }
        )

    except Exception as e:
        logger.error(f"AI 추천 오류: {e}")
        raise HTTPException(status_code=500, detail=f"AI 추천 오류: {str(e)}")


@router.post("/recipes/from-meal-plan")
async def get_recipe_from_meal_plan(request_data: Dict[str, Any] = Body(...)):
    """식단 계획에서 레시피 생성"""
    try:
        meal_title = request_data.get("meal_title", "")
        meals = request_data.get("meals", [])

        if not meal_title or not meals:
            raise HTTPException(
                status_code=400, detail="meal_title과 meals가 필요합니다"
            )

        from openai import OpenAI
        import os
        import json

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        prompt = f"""식단 계획 '{meal_title}'에 대한 상세 레시피를 작성해주세요.

메뉴: {", ".join(meals)}

JSON 형식으로 반환:
{{
  "main_dish": "메인 요리 이름",
  "recipe": {{
    "title": "레시피 제목",
    "description": "레시피 설명",
    "cooking_time": "조리 시간",
    "difficulty": "난이도 (하/중/상)",
    "ingredients": ["재료1", "재료2", ...],
    "missing_ingredients": ["추가로 필요한 재료"],
    "calories": 칼로리,
    "steps": ["단계1", "단계2", ...]
  }}
}}

JSON만 반환"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "당신은 한국 요리 전문 셰프입니다.",
                },
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        result = json.loads(response.choices[0].message.content or "{}")
        recipe = result.get("recipe", {})
        main_dish = result.get("main_dish", meals[0] if meals else "")

        from ..agents.youtube_agent import search_youtube_videos

        youtube_videos = {}
        if main_dish:
            videos = search_youtube_videos(f"{main_dish} 레시피", max_results=2)
            if videos:
                youtube_videos[main_dish] = videos

        return JSONResponse(
            content={
                "main_dish": main_dish,
                "recipe": recipe,
                "youtube_videos": youtube_videos,
            }
        )

    except Exception as e:
        logger.error(f"식단 계획 레시피 생성 오류: {e}")
        raise HTTPException(status_code=500, detail=f"레시피 생성 오류: {str(e)}")


@router.post("/recipes/from-meal-plan")
async def get_recipes_from_meal_plan(request_data: Dict[str, Any] = Body(...)):
    """
    mealPlan(추천 식단)에서 선택한 메뉴에 대한 실제 레시피를 AI로 생성합니다.
    mealPlan의 title과 meals를 기반으로-detected_items 대신菜单 기반 레시피 생성.
    """
    try:
        meal_title = request_data.get("meal_title", "")
        meals = request_data.get(
            "meals", []
        )  # ["된장찌개 + 밥 + 나물", "불고기 + 밥 + 계란찜", ...]

        if not meal_title or not meals:
            raise HTTPException(
                status_code=400, detail="메뉴 제목과 meals 목록이 필요합니다"
            )

        # meals에서 메뉴 추출 (첫 번째 메뉴 사용)
        main_dish = meals[0].split(" + ")[0] if meals else meal_title

        from openai import OpenAI
        import os
        import json

        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

        # 메인 요리에 대한 상세 레시피 생성
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": """당신은 米其林星급 셰프이자 요리 레시피 전문가입니다. 사용자가 선택한 메뉴에 대해 아주 상세하고 전문적인 레시피를 JSON 형태로 생성하세요.

반환 형식 (모든 필드 필수):
{
    "title": "레시피 제목 (한국어)",
    "description": "레시피에 대한 상세 설명 (2-3문장, 요리의 특징, 맛, 조리 특성 포함)",
    "cooking_time": "총 조리 시간 (예: 30분)",
    "difficulty": "난이도 (상/중/하 중 하나)",
    "servings": "인분 (예: 2인분)",
    
    "ingredients": [
        {"name": "재료명", "amount": "양 (예: 200g, 1개, 2큰술)", "gram": 숫자}
    ],
    
    "steps": [
        {
            "step": 숫자,
            "description": "상세한 조리 방법 (어떤 행동을 어떤 순서로 어떤 온도로 하는지)",
            "duration": "이 단계 소요 시간",
            "tip": "이 단계에서 중요한 포인트나 노하우"
        }
    ],
    
    "sauce": {
        "name": "소스/양념 이름",
        "ingredients": [{"name": "재료명", "amount": "양"}],
        "steps": ["조리 단계"]
    },
    
    "tips": ["요리 팁 1", "요리 팁 2", "요리 팁 3"],
    
    "nutritional_info": {
        "calories": 숫자,
        "protein": "단백질 (예: 20g)",
        "carbs": "탄수화물 (예: 30g)",
        "fat": "지방 (예: 10g)"
    },
    
    "storage": "보관 방법 및 기간",
    "pairing": ["잘 어울리는 사이드 메뉴 1", "잘 어울리는 사이드 메뉴 2"]
}""",
                },
                {
                    "role": "user",
                    "content": f"""메뉴: {main_dish}
전체 메뉴: {", ".join(meals)}

이 메뉴에 대해 米其林 레스토랑 수준의 아주 상세하고 전문적인 레시피를 작성해주세요.
- 재료의 양은 정확하게 (gram 단위 포함)
- 조리 단계는 구체적으로 (온도, 시간, 방법 명시)
- 요리 노하우와 비법도 포함
-营养 정보도 포함""",
                },
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
        )

        recipe = json.loads(response.choices[0].message.content or "{}")

        # 유튜브 영상 검색
        from ..agents.youtube_agent import search_youtube_videos

        videos = search_youtube_videos(f"{main_dish} 레시피", max_results=2)
        youtube_videos = {main_dish: videos} if videos else {}

        return JSONResponse(
            content={
                "meal_title": meal_title,
                "main_dish": main_dish,
                "recipe": recipe,
                "youtube_videos": youtube_videos,
            }
        )

    except Exception as e:
        logger.error(f"mealPlan 레시피 생성 오류: {e}")
        raise HTTPException(status_code=500, detail=f"레시피 생성 오류: {str(e)}")
