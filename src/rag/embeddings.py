"""Embeddings 설정"""
import os
from openai import OpenAI

# OpenAI Embeddings 클라이언트
_embedding_client = None


def get_embedding_client():
    """OpenAI Embeddings 클라이언트 반환"""
    global _embedding_client
    if _embedding_client is None:
        _embedding_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    return _embedding_client


def get_embeddings(text: str) -> list:
    """텍스트를 임베딩 벡터로 변환"""
    client = get_embedding_client()
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding
