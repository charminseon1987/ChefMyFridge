"""오케스트레이터 테스트 스크립트"""
import asyncio
import sys
import os
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from src.agents.orchestrator import run_orchestrator


async def test_orchestrator(image_path: str):
    """오케스트레이터 테스트"""
    print(f"이미지 분석 시작: {image_path}")
    
    result = await run_orchestrator(image_path=image_path)
    
    print("\n=== 분석 결과 ===")
    print(f"성공: {result['success']}")
    print(f"처리 단계: {result['current_step']}")
    print(f"처리 시간: {result.get('processing_time', 0):.2f}초")
    
    if result.get('errors'):
        print(f"\n오류: {result['errors']}")
    
    if result.get('detected_items'):
        print(f"\n인식된 식재료 ({len(result['detected_items'])}개):")
        for item in result['detected_items']:
            print(f"  - {item.get('name', '알 수 없음')} ({item.get('quantity', 0)}{item.get('unit', '')})")
    
    if result.get('expiry_alerts'):
        print(f"\n유통기한 경고:")
        for alert in result['expiry_alerts']:
            print(f"  {alert}")
    
    if result.get('final_recommendation'):
        rec = result['final_recommendation']
        print(f"\n=== 최종 추천 ===")
        print(f"요약: {rec.get('summary', {})}")
        
        if rec.get('priority_actions'):
            print(f"\n우선 소비 순서:")
            for action in rec['priority_actions']:
                print(f"  {action}")
        
        if rec.get('recommended_recipes'):
            print(f"\n추천 레시피:")
            for recipe in rec['recommended_recipes']:
                print(f"  - {recipe.get('title', '알 수 없음')}")
                print(f"    매칭률: {recipe.get('match_rate', 0)*100:.0f}%")
                print(f"    조리시간: {recipe.get('cooking_time', '알 수 없음')}")
                print(f"    난이도: {recipe.get('difficulty', '알 수 없음')}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("사용법: python scripts/test_orchestrator.py <이미지_경로>")
        sys.exit(1)
    
    image_path = sys.argv[1]
    
    if not os.path.exists(image_path):
        print(f"오류: 이미지 파일을 찾을 수 없습니다: {image_path}")
        sys.exit(1)
    
    asyncio.run(test_orchestrator(image_path))
