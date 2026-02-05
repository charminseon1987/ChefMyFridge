import os
import httpx
import logging
from typing import List, Dict, Any, Optional

logger = logging.getLogger(__name__)

class SupabaseManager:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseManager, cls).__new__(cls)
            cls._instance._init_client()
        return cls._instance

    def _init_client(self):
        self.url = os.getenv("SUPABASE_URL")
        self.key = os.getenv("SUPABASE_KEY")
        self.headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
        }
        
        if not self.url or not self.key:
            logger.warning("Supabase credentials not found. DB features disabled.")
            self.disabled = True
        else:
            self.disabled = False
            # Ensure URL ends correctly for REST
            self.rest_url = f"{self.url}/rest/v1"
            logger.info("Supabase client initialized (REST mode).")

    async def save_inventory_items(self, items: List[Dict[str, Any]]) -> bool:
        """
        Save inventory items using PostgREST API.
        """
        if self.disabled:
            logger.warning("Supabase disabled, skipping save.")
            return False

        if not items:
            return True

        # Prepare payload
        payload = []
        for item in items:
            payload.append({
                "name": item.get("name"),
                "quantity": item.get("quantity", 1),
                "unit": item.get("unit", "개"),
                "category": item.get("category", "기타"),
                "purchase_date": item.get("purchase_date"),
                "expiry_date": item.get("expiry_date"),
                "confidence": item.get("confidence", 0.0)
            })

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.post(
                    f"{self.rest_url}/inventory",
                    headers=self.headers,
                    json=payload
                )
                if resp.status_code in (200, 201):
                    logger.info(f"Successfully saved {len(payload)} items to Supabase.")
                    return True
                else:
                    logger.error(f"Supabase Error {resp.status_code}: {resp.text}")
                    return False
        except Exception as e:
            logger.error(f"Failed to save to Supabase: {e}")
            return False

    async def get_all_inventory(self) -> List[Dict[str, Any]]:
        """Fetch all inventory."""
        if self.disabled:
             return []
             
        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    f"{self.rest_url}/inventory?select=*",
                    headers=self.headers
                )
                if resp.status_code == 200:
                    return resp.json()
                else:
                    logger.error(f"Supabase Fetch Error: {resp.text}")
                    return []
        except Exception as e:
             logger.error(f"Failed to fetch from Supabase: {e}")
             return []
