"""API 라우트"""
from fastapi import APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse
import os
import tempfile
import logging
from typing import Optional, List, Dict, Any

from ..agents.orchestrator import run_orchestrator

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["fridge"])


@router.post("/analyze")
async def analyze_fridge_image(file: UploadFile = File(...)):
    """냉장고 이미지 분석"""
    try:
        # 파일 검증
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="이미지 파일만 업로드 가능합니다")
        
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as tmp_file:
            content = await file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # 오케스트레이터 실행
            result = await run_orchestrator(image_path=tmp_file_path)
            
            return JSONResponse(content=result)
            
        finally:
            # 임시 파일 삭제
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
        
    except Exception as e:
        logger.error(f"이미지 분석 오류: {e}")
        raise HTTPException(status_code=500, detail=f"분석 중 오류가 발생했습니다: {str(e)}")


@router.get("/recipes")
async def get_recipes():
    """레시피 목록 조회 (테스트용)"""
    from ..rag.vector_store import DEFAULT_RECIPES
    return {"recipes": DEFAULT_RECIPES}


@router.post("/confirm-items")
async def confirm_items(
    request_data: Dict[str, Any] = Body(...)
):
    """사용자가 미확인 재료를 확인/추가하는 엔드포인트"""
    try:
        confirmed_items = request_data.get("confirmed_items", [])
        session_id = request_data.get("session_id")  # 세션 관리용 (선택사항)
        
        if not confirmed_items:
            raise HTTPException(
                status_code=400,
                detail="확인된 재료 목록이 필요합니다"
            )
        
        # 재료 형식 검증
        for item in confirmed_items:
            if not isinstance(item, dict) or "name" not in item:
                raise HTTPException(
                    status_code=400,
                    detail="각 재료는 'name' 필드를 포함해야 합니다"
                )
        
        # 여기서는 간단히 확인된 재료를 반환
        # 실제로는 세션 저장소나 DB에 저장하여 다음 분석에 사용
        return JSONResponse(content={
            "success": True,
            "confirmed_items": confirmed_items,
            "message": f"{len(confirmed_items)}개 재료가 확인되었습니다"
        })
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"재료 확인 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"재료 확인 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/recipes/by-diet-type")
async def get_recipes_by_diet_type(
    request_data: Dict[str, Any] = Body(...)
):
    """식단 타입별 레시피 추천"""
    try:
        diet_type = request_data.get("diet_type")
        detected_items = request_data.get("detected_items", [])
        
        # 식단 타입 검증
        valid_types = ['diet', 'health', 'patient']
        if diet_type not in valid_types:
            raise HTTPException(
                status_code=400,
                detail=f"유효한 식단 타입: {', '.join(valid_types)}"
            )
        
        # Recipe Agent를 통해 식단 타입과 감지된 식재료를 기반으로 레시피 추천
        from ..agents.recipe_agent import get_recipes_by_diet_type as get_recipes
        from ..agents.youtube_agent import search_youtube_videos
        
        recipes = await get_recipes(
            diet_type=diet_type,
            detected_items=detected_items
        )
        
        # 각 레시피에 대해 유튜브 영상 검색
        youtube_videos = {}
        for recipe in recipes[:5]:  # 상위 5개 레시피만
            recipe_title = recipe.get("title", "")
            if recipe_title:
                search_query = f"{recipe_title} 레시피"
                videos = search_youtube_videos(search_query, max_results=2)
                if videos:
                    youtube_videos[recipe_title] = videos
        
        return JSONResponse(content={
            "recipes": recipes,
            "youtube_videos": youtube_videos
        })

    except Exception as e:
        logger.error(f"레시피 추천 오류: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"레시피 추천 중 오류가 발생했습니다: {str(e)}"
        )


@router.post("/recipes/generate-report")
async def generate_report_endpoint(
    request_data: Dict[str, Any] = Body(...)
):
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
            status_code=500,
            detail=f"보고서 생성 중 오류가 발생했습니다: {str(e)}"
        )
