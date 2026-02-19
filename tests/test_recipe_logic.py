
import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Add root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.agents.recipe_agent import recipe_agent_node, generate_recipe_report
from src.core.state import FridgeState

class TestRecipePersonalization(unittest.TestCase):
    
    @patch('src.agents.recipe_agent.get_vector_store')
    def test_diet_type_filtering(self, mock_get_vector_store):
        # Setup mock vector store
        mock_store = MagicMock()
        mock_store.search_recipes.return_value = [
            {
                "id": "1", "title": "Heavy Fried Chicken", "description": "Delicious fried chicken",
                "ingredients": ["chicken", "oil", "flour"], "calories": 800, "difficulty": "중"
            },
            {
                "id": "2", "title": "Healthy Salad", "description": "Fresh vegetables",
                "ingredients": ["lettuce", "tomato", "chicken"], "calories": 200, "difficulty": "하"
            },
            {
                "id": "3", "title": "Balanced Meal", "description": "Good balance",
                "ingredients": ["rice", "vegetables", "meat"], "calories": 450, "difficulty": "중"
            }
        ]
        mock_get_vector_store.return_value = mock_store
        
        # Setup state
        state = FridgeState(
            image_path="", image_data=None, servings=2, diet_type="diet",
            detected_items=[{"name": "chicken", "category": "meat"}],
            user_confirmed_items=[],
            expiry_data=[],
            current_step="", recipe_suggestions=[], history=[], errors=[]
        )
        
        # Run agent
        new_state = recipe_agent_node(state)
        
        suggestions = new_state["recipe_suggestions"]
        self.assertTrue(len(suggestions) > 0)
        
        # Check if "Healthy Salad" is prioritized or "Heavy Fried Chicken" is penalized
        # Salad (200 cal) vs Chicken (800 cal). Diet filter max_cal is 300.
        
        # Find index of recipes
        salad_idx = -1
        chicken_idx = -1
        
        for i, s in enumerate(suggestions):
            if s["title"] == "Healthy Salad":
                salad_idx = i
            if s["title"] == "Heavy Fried Chicken":
                chicken_idx = i
                
        # Salad should be ranked higher (lower index) than Chicken
        # Or Chicken might be filtered out or have very low score
        print(f"Salad index: {salad_idx}, Chicken index: {chicken_idx}")
        
        if salad_idx != -1 and chicken_idx != -1:
             self.assertLess(salad_idx, chicken_idx, "Healthy Salad should be ranked higher than Fried Chicken for diet")
        elif salad_idx != -1:
            pass # Chicken filtered out or not top 5, which is also good
        else:
            self.fail("Healthy Salad should be suggested")

    @patch('src.agents.recipe_agent.OpenAI')
    @patch('os.getenv')
    def test_generate_report_servings(self, mock_getenv, mock_openai):
        mock_getenv.return_value = "fake_key"
        mock_client = MagicMock()
        mock_openai.return_value = mock_client
        
        # This test ensures the function runs without error and passes the prompt
        # We can't easily check the prompt content without inspecting the mock call args
        
        import asyncio
        asyncio.run(generate_recipe_report("Test Recipe", ["ing1", "ing2"], servings=4))
        
        # Check if API was called
        self.assertTrue(mock_client.chat.completions.create.called)
        
        # Inspect call args to see if "Servings: 4" is in the prompt
        args, kwargs = mock_client.chat.completions.create.call_args
        messages = kwargs['messages']
        user_prompt = messages[1]['content']
        
        self.assertIn("Servings: 4", user_prompt)
        self.assertIn("Adjust all ingredient amounts to match 4 servings", user_prompt)

if __name__ == '__main__':
    unittest.main()
