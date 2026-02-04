"""이미지 처리 유틸리티"""
import os
from typing import Tuple, Optional
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)


def validate_image(image_path: Optional[str] = None, image_data: Optional[bytes] = None) -> Tuple[bool, str]:
    """이미지 검증 및 전처리"""
    try:
        if image_path:
            if not os.path.exists(image_path):
                return False, f"이미지 파일을 찾을 수 없습니다: {image_path}"
            
            # 파일 확장자 검증
            ext = os.path.splitext(image_path)[1].lower()
            if ext not in ['.jpg', '.jpeg', '.png', '.webp']:
                return False, f"지원하지 않는 이미지 형식입니다: {ext}"
            
            # 이미지 열기 및 검증
            try:
                img = Image.open(image_path)
                img.verify()
            except Exception as e:
                return False, f"이미지 파일이 손상되었습니다: {str(e)}"
        
        elif image_data:
            try:
                img = Image.open(io.BytesIO(image_data))
                img.verify()
            except Exception as e:
                return False, f"이미지 데이터가 손상되었습니다: {str(e)}"
        else:
            return False, "이미지 경로 또는 이미지 데이터가 필요합니다"
        
        return True, "이미지 검증 성공"
        
    except Exception as e:
        logger.error(f"이미지 검증 중 오류: {e}")
        return False, f"이미지 검증 오류: {str(e)}"


def resize_image(image_path: str, max_size: int = 2048) -> Optional[str]:
    """이미지 리사이즈 (API 제한 고려)"""
    try:
        img = Image.open(image_path)
        
        # 이미지가 max_size보다 작으면 리사이즈 불필요
        if max(img.size) <= max_size:
            return image_path
        
        # 비율 유지하며 리사이즈
        img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)
        
        # 임시 파일로 저장
        output_path = image_path.replace('.', '_resized.')
        img.save(output_path)
        
        return output_path
        
    except Exception as e:
        logger.error(f"이미지 리사이즈 중 오류: {e}")
        return image_path
