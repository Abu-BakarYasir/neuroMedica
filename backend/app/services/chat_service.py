from groq import Groq
from typing import AsyncIterator, List, Optional
import uuid
import logging
from app.core.config import settings
from app.models.chat import Message

logger = logging.getLogger(__name__)


class ChatService:
    def __init__(self):
        self.client = Groq(api_key=settings.groq_api_key)
        self.model = "llama-3.3-70b-versatile"  # Groq model
    
    def generate_conversation_id(self) -> str:
        """Generate a unique conversation ID."""
        return str(uuid.uuid4())
    
    def format_messages_for_groq(
        self, history: List[Message], current_message: str
    ) -> List[dict]:
        """
        Format messages for Groq API.
        Groq expects messages in a specific format.
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
        Get chat response from Groq API.
        
        Returns:
            tuple: (response_message, conversation_id)
        """
        if not conversation_id:
            conversation_id = self.generate_conversation_id()
        
        history = history or []
        
        try:
            # Format messages for Groq
            formatted_messages = self.format_messages_for_groq(history, message)
            
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
            
            # Call Groq API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    *formatted_messages
                ],
                max_tokens=1024,
                temperature=0.7,
            )
            
            # Extract response text
            if not response.choices or len(response.choices) == 0:
                logger.error("Groq API returned no choices")
                raise Exception("No response from Groq API")
            
            response_text = response.choices[0].message.content
            if not response_text:
                logger.error("Groq API returned empty response")
                raise Exception("Empty response from Groq API")
            
            return response_text, conversation_id
            
        except Exception as e:
            logger.error(f"Groq API error: {str(e)}", exc_info=True)
            raise Exception(f"Groq API error: {str(e)}")


    async def stream_chat_response(
        self,
        message: str,
        conversation_id: Optional[str] = None,
        history: Optional[List[Message]] = None,
    ) -> AsyncIterator[str]:
        """Stream Groq chat response as text deltas.

        Yields plain text strings (no envelope). The endpoint wraps each in an
        SSE event. Errors propagate as exceptions for the endpoint to handle.
        """
        history = history or []
        formatted_messages = self.format_messages_for_groq(history, message)
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
        # Groq SDK is sync; calling stream=True returns a sync iterator.
        # Iterate it from async by checking each chunk inline (chunks arrive
        # quickly enough that this is acceptable here).
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                *formatted_messages,
            ],
            max_tokens=1024,
            temperature=0.7,
            stream=True,
        )
        for chunk in stream:
            try:
                delta = chunk.choices[0].delta.content
            except (IndexError, AttributeError):
                delta = None
            if delta:
                yield delta

    def generate_title(self, message: str) -> str:
        """Generate a short conversation title from the first user message."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Generate a very short title (max 6 words) for a conversation "
                            "that starts with the following message. Return ONLY the title, "
                            "no quotes, no punctuation at the end."
                        ),
                    },
                    {"role": "user", "content": message},
                ],
                max_tokens=20,
                temperature=0.5,
            )

            title = (response.choices[0].message.content or "").strip().strip('"\'')
            return title if title else message[:50]
        except Exception as e:
            logger.error(f"Title generation error: {e}")
            return message[:50] if len(message) > 50 else message


# Singleton instance
chat_service = ChatService()

