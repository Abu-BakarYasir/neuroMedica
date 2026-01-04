import anthropic
from typing import List, Optional
import uuid
from app.core.config import settings
from app.models.chat import Message


class ChatService:
    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-3-5-sonnet-20241022"  # Latest Claude model
    
    def generate_conversation_id(self) -> str:
        """Generate a unique conversation ID."""
        return str(uuid.uuid4())
    
    def format_messages_for_anthropic(
        self, history: List[Message], current_message: str
    ) -> List[dict]:
        """
        Format messages for Anthropic API.
        Anthropic expects messages in a specific format.
        """
        messages = []
        
        # Add history
        for msg in history:
            if msg.role in ["user", "assistant"]:
                messages.append({
                    "role": msg.role,
                    "content": msg.content,
                })
        
        # Add current user message
        messages.append({
            "role": "user",
            "content": current_message,
        })
        
        return messages
    
    def get_chat_response(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        history: Optional[List[Message]] = None,
    ) -> tuple[str, str]:
        """
        Get chat response from Anthropic Claude.
        
        Returns:
            tuple: (response_message, conversation_id)
        """
        if not conversation_id:
            conversation_id = self.generate_conversation_id()
        
        history = history or []
        
        try:
            # Format messages for Anthropic
            formatted_messages = self.format_messages_for_anthropic(history, message)
            
            # System prompt for medical assistant
            system_prompt = """You are Med Assistant, a helpful AI assistant for NeuroMedica, 
a healthcare management platform. You provide accurate, helpful medical information and assistance 
to healthcare professionals and medical students.

Guidelines:
- Provide accurate, evidence-based medical information
- Always emphasize that you are an AI assistant and users should verify critical information
- Be professional, empathetic, and clear in your responses
- If asked about specific medical conditions or treatments, provide general information but 
  always recommend consulting with qualified healthcare professionals
- Help with medical terminology, study resources, and general medical questions
- Do not provide diagnoses or treatment plans for specific individuals
"""
            
            # Call Anthropic API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=formatted_messages,
            )
            
            # Extract response text
            response_text = ""
            if response.content:
                for content_block in response.content:
                    if hasattr(content_block, "text"):
                        response_text += content_block.text
            
            return response_text, conversation_id
            
        except anthropic.APIError as e:
            raise Exception(f"Anthropic API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Failed to generate response: {str(e)}")


# Singleton instance
chat_service = ChatService()

