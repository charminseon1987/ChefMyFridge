"""YouTube Agent - 유튜브 영상 검색 및 썸네일 가져오기"""
from typing import Dict, Any, List
import logging
import requests
from urllib.parse import quote_plus
from ..core.state import FridgeState

logger = logging.getLogger(__name__)


def search_youtube_videos(query: str, max_results: int = 2) -> List[Dict[str, Any]]:
    """유튜브 영상 검색 (YouTube Data API v3 사용)"""
    try:
        # YouTube Data API v3를 사용한 검색
        # 실제 API 키는 환경 변수에서 가져옴
        import os
        api_key = os.getenv("YOUTUBE_API_KEY")
        
        if not api_key:
            logger.warning("YOUTUBE_API_KEY가 설정되지 않았습니다. 더미 데이터를 반환합니다.")
            return get_dummy_videos(query, max_results)
        
        # YouTube Data API v3 검색
        search_url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": max_results,
            "key": api_key,
            "relevanceLanguage": "ko",
        }
        
        response = requests.get(search_url, params=params, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        videos = []
        
        for item in data.get("items", []):
            video_id = item["id"]["videoId"]
            snippet = item["snippet"]
            
            videos.append({
                "id": video_id,
                "title": snippet["title"],
                "channel": snippet["channelTitle"],
                "thumbnailUrl": snippet["thumbnails"].get("high", {}).get("url") or 
                               snippet["thumbnails"].get("medium", {}).get("url") or
                               snippet["thumbnails"].get("default", {}).get("url"),
                "description": snippet.get("description", ""),
            })
        
        logger.info(f"YouTube 검색 완료: {len(videos)}개 영상 발견")
        return videos
        
    except Exception as e:
        logger.error(f"YouTube API 검색 오류: {e}")
        # API 실패 시 더미 데이터 반환
        return get_dummy_videos(query, max_results)


def get_dummy_videos(query: str, max_results: int = 2) -> List[Dict[str, Any]]:
    """더미 유튜브 영상 데이터 (API 실패 시 사용)"""
    # 쿼리에 따라 적절한 썸네일 선택
    thumbnail_map = {
        "된장국": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80",
        "시금치": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80",
        "두부": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80",
        "카레": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=450&fit=crop&q=80",
        "당근": "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800&h=450&fit=crop&q=80",
        "볶음밥": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80",
        "브로콜리": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80",
        "파스타": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=450&fit=crop&q=80",
        "토마토": "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800&h=450&fit=crop&q=80",
        "스프": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=450&fit=crop&q=80",
        "양파": "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&h=450&fit=crop&q=80",
        "불고기": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80",
        "고추장": "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80",
    }
    
    # 쿼리에서 키워드 추출
    thumbnail_url = "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800&h=450&fit=crop&q=80"
    for keyword, url in thumbnail_map.items():
        if keyword in query:
            thumbnail_url = url
            break
    
    videos = []
    channels = ["백종원의 요리비책", "만개의레시피"]
    
    for i in range(min(max_results, len(channels))):
        videos.append({
            "id": f"dummy-{query.replace(' ', '-').replace('레시피', '').strip().lower()}-{i+1}",
            "title": f"{query.replace(' 레시피', '')} 만들기 - {channels[i]}",
            "channel": channels[i],
            "thumbnailUrl": thumbnail_url,
            "description": f"{query} 레시피 영상",
        })
    
    return videos


def youtube_agent_node(state: FridgeState) -> FridgeState:
    """YouTube Agent 노드 - 레시피에 맞는 유튜브 영상 검색"""
    try:
        logger.info("YouTube Agent 시작")
        
        recipe_suggestions = state.get("recipe_suggestions", [])
        detected_items = state.get("detected_items", [])
        
        # 레시피가 없으면 스킵
        if not recipe_suggestions:
            logger.warning("추천 레시피가 없어 YouTube 검색을 건너뜁니다")
            state["youtube_videos"] = {}
            state["current_step"] = "youtube_completed"
            return state
        
        # 각 레시피에 대해 유튜브 영상 검색
        youtube_videos = {}
        
        for recipe in recipe_suggestions[:5]:  # 상위 5개 레시피만
            recipe_title = recipe.get("title", "")
            if not recipe_title:
                continue
            
            # 검색 쿼리 생성
            search_query = f"{recipe_title} 레시피"
            
            # 유튜브 검색
            videos = search_youtube_videos(search_query, max_results=2)
            
            if videos:
                youtube_videos[recipe_title] = videos
                logger.info(f"'{recipe_title}'에 대한 {len(videos)}개 영상 발견")
        
        # State 업데이트
        state["youtube_videos"] = youtube_videos
        state["current_step"] = "youtube_completed"
        
        logger.info(f"YouTube Agent 완료: {len(youtube_videos)}개 레시피에 대한 영상 검색")
        
        return state
        
    except Exception as e:
        logger.error(f"YouTube Agent 오류: {e}")
        state["errors"].append(f"YouTube Agent 오류: {str(e)}")
        state["youtube_videos"] = {}
        state["current_step"] = "youtube_error"
        return state
