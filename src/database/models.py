"""Database models (SQLAlchemy) - 향후 확장용"""
# 현재는 인메모리 저장소 사용
# PostgreSQL 연동 시 SQLAlchemy 모델로 확장 가능

from datetime import datetime
from typing import Optional
# from sqlalchemy import Column, String, Integer, Float, DateTime, Text
# from sqlalchemy.ext.declarative import declarative_base
# 
# Base = declarative_base()
# 
# class Inventory(Base):
#     __tablename__ = "inventory"
#     
#     id = Column(String, primary_key=True)
#     item_name = Column(String(100), nullable=False)
#     category = Column(String(50))
#     quantity = Column(Float)
#     unit = Column(String(20))
#     added_date = Column(DateTime, default=datetime.now)
#     last_updated = Column(DateTime, default=datetime.now, onupdate=datetime.now)
#     location = Column(String(50))  # 냉장/냉동/실온
# 
# class ExpiryInfo(Base):
#     __tablename__ = "expiry_info"
#     
#     id = Column(String, primary_key=True)
#     item_name = Column(String(100), nullable=False)
#     base_days = Column(Integer)
#     storage = Column(String(50))
#     notes = Column(Text)
