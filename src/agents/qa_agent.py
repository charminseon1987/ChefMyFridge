import logging
import json
from datetime import datetime
from typing import Dict, Any, List

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

from ..core.supabase_client import SupabaseManager

logger = logging.getLogger(__name__)


async def answer_user_question(question: str) -> str:
    """
    Supabase에 저장된 냉장고 재료 데이터를 기반으로 사용자 질문에 답변합니다.
    """
    try:
        # 1. Supabase에서 최신 재료 목록 가져오기
        manager = SupabaseManager()
        items = await manager.get_all_inventory()

        # 데이터 요약 (토큰 절약)
        inventory_summary = []
        for item in items:
            summary = f"- {item.get('name')} (수량: {item.get('quantity')}{item.get('unit')}, 유통기한: {item.get('expiry_date')})"
            inventory_summary.append(summary)

        inventory_text = (
            "\n".join(inventory_summary)
            if inventory_summary
            else "냉장고가 비어있습니다."
        )

        # 2. LLM 호출 준비
        llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

        prompt = ChatPromptTemplate.from_messages(
            [
                (
                    "system",
                    """당신은 냉장고 관리 AI 비서 'FridgeAI'입니다.
사용자의 냉장고 재료 목록을 확인하고, 그에 기반하여 질문에 답변하세요.
재료가 없거나 부족하면 솔직하게 말하고, 가능한 레시피나 조언을 제공하세요.

현재 냉장고 재료 목록:
{inventory}

오늘 날짜: {date}
answer in Korean.
""",
                ),
                ("human", "{question}"),
            ]
        )

        chain = prompt | llm | StrOutputParser()

        # 3. 답변 생성
        response = await chain.ainvoke(
            {
                "inventory": inventory_text,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "question": question,
            }
        )

        return response

    except Exception as e:
        logger.error(f"QA Failed: {e}")
        return "죄송합니다. 답변을 생성하는 중에 오류가 발생했습니다. (데이터베이스 연결 문제일 수 있습니다)"
