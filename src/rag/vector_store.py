"""Vector Store 설정"""
import os
import json
from pathlib import Path
from typing import List, Dict, Any

# chromadb 선택적 임포트
try:
    import chromadb
    from chromadb.config import Settings
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    chromadb = None
    Settings = None

# 기본 레시피 데이터
DEFAULT_RECIPES = [
    {
        "title": "시금치 두부 된장국",
        "ingredients": ["시금치", "두부", "된장", "대파", "마늘"],
        "cooking_time": "15분",
        "difficulty": "하",
        "calories": 120,
        "description": "간단하고 건강한 된장국"
    },
    {
        "title": "당근 카레",
        "ingredients": ["당근", "양파", "카레가루", "고구마"],
        "cooking_time": "30분",
        "difficulty": "중",
        "calories": 250,
        "description": "달콤한 당근 카레"
    },
    {
        "title": "계란볶음밥",
        "ingredients": ["계란", "밥", "대파", "식용유"],
        "cooking_time": "10분",
        "difficulty": "하",
        "calories": 300,
        "description": "간단한 계란볶음밥"
    },
    {
        "title": "우유 스무디",
        "ingredients": ["우유", "바나나", "꿀"],
        "cooking_time": "5분",
        "difficulty": "하",
        "calories": 200,
        "description": "부드러운 우유 스무디"
    },
    {
        "title": "양파 볶음",
        "ingredients": ["양파", "식용유", "소금"],
        "cooking_time": "10분",
        "difficulty": "하",
        "calories": 80,
        "description": "달콤한 양파 볶음"
    },
    {
        "title": "두부 김치볶음",
        "ingredients": ["두부", "김치", "대파", "고춧가루"],
        "cooking_time": "15분",
        "difficulty": "중",
        "calories": 180,
        "description": "매콤한 두부 김치볶음"
    },
    {
        "title": "감자 샐러드",
        "ingredients": ["감자", "마요네즈", "계란", "양파"],
        "cooking_time": "20분",
        "difficulty": "중",
        "calories": 220,
        "description": "부드러운 감자 샐러드"
    },
    {
        "title": "생선구이",
        "ingredients": ["생선", "소금", "레몬", "올리브오일"],
        "cooking_time": "20분",
        "difficulty": "중",
        "calories": 200,
        "description": "고소한 생선구이"
    }
]


class RecipeVectorStore:
    """레시피 벡터 저장소"""
    
    def __init__(self, persist_directory: str = "./data/vectors"):
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)
        self.use_chromadb = CHROMADB_AVAILABLE
        
        if self.use_chromadb:
            # ChromaDB 클라이언트 초기화
            self.client = chromadb.PersistentClient(
                path=str(self.persist_directory),
                settings=Settings(anonymized_telemetry=False)
            )
            
            # 컬렉션 생성 또는 로드
            self.collection = self.client.get_or_create_collection(
                name="recipes",
                metadata={"description": "Recipe collection"}
            )
            
            # 초기 데이터 로드
            self._initialize_recipes()
        else:
            # 메모리 기반 저장소 사용
            self.recipes = DEFAULT_RECIPES.copy()
            import logging
            logging.warning("chromadb가 설치되지 않았습니다. 간단한 메모리 기반 검색을 사용합니다.")
    
    def _initialize_recipes(self):
        """기본 레시피 데이터 초기화"""
        if self.use_chromadb and self.collection.count() == 0:
            # 기본 레시피 추가
            for recipe in DEFAULT_RECIPES:
                self.add_recipe(recipe)
    
    def add_recipe(self, recipe: Dict[str, Any]):
        """레시피 추가"""
        if not self.use_chromadb:
            self.recipes.append(recipe)
            return
        
        from .embeddings import get_embeddings
        
        # 재료 리스트를 문자열로 변환
        ingredients_text = ", ".join(recipe.get("ingredients", []))
        text = f"{recipe.get('title', '')} {ingredients_text} {recipe.get('description', '')}"
        
        # 임베딩 생성
        embedding = get_embeddings(text)
        
        # ChromaDB에 추가
        self.collection.add(
            embeddings=[embedding],
            documents=[json.dumps(recipe, ensure_ascii=False)],
            ids=[f"recipe_{recipe.get('title', 'unknown')}"]
        )
    
    def search_recipes(self, ingredients: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
        """재료 기반 레시피 검색"""
        if not self.use_chromadb:
            # 간단한 키워드 기반 검색
            return self._simple_search(ingredients, top_k)
        
        from .embeddings import get_embeddings
        
        # 재료를 문자열로 변환
        query_text = ", ".join(ingredients)
        
        # 쿼리 임베딩 생성
        query_embedding = get_embeddings(query_text)
        
        # 유사도 검색
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k
        )
        
        # 결과 파싱
        recipes = []
        if results["documents"] and len(results["documents"][0]) > 0:
            for doc in results["documents"][0]:
                recipe = json.loads(doc)
                recipes.append(recipe)
        
        return recipes
    
    def _simple_search(self, ingredients: List[str], top_k: int = 5) -> List[Dict[str, Any]]:
        """간단한 키워드 기반 검색 (chromadb 없을 때 사용)"""
        scored_recipes = []
        
        for recipe in self.recipes:
            recipe_ingredients = recipe.get("ingredients", [])
            
            # 매칭 점수 계산
            match_count = 0
            for ingredient in ingredients:
                for recipe_ing in recipe_ingredients:
                    if ingredient in recipe_ing or recipe_ing in ingredient:
                        match_count += 1
                        break
            
            if match_count > 0:
                score = match_count / max(len(recipe_ingredients), 1)
                scored_recipes.append((score, recipe))
        
        # 점수로 정렬
        scored_recipes.sort(key=lambda x: x[0], reverse=True)
        
        # 상위 k개 반환
        return [recipe for _, recipe in scored_recipes[:top_k]]


# 전역 인스턴스
_vector_store = None


def get_vector_store() -> RecipeVectorStore:
    """벡터 저장소 인스턴스 반환"""
    global _vector_store
    if _vector_store is None:
        _vector_store = RecipeVectorStore()
    return _vector_store
