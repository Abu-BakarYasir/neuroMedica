# NeuroMedica Chat Backend

FastAPI backend for the NeuroMedica chatbot feature with Anthropic Claude integration.

## Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Configure environment variables:**
   - `ANTHROPIC_API_KEY`: Your Anthropic API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key

4. **Run the server:**
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

The API will be available at `http://localhost:8000`

## API Endpoints

### POST `/api/chat/message`

Send a message to the chatbot.

**Headers:**
- `Authorization: Bearer <supabase_token>`

**Request Body:**
```json
{
  "message": "What is diabetes?",
  "conversation_id": "optional-conversation-id",
  "history": [
    {
      "role": "user",
      "content": "Hello"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you?"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Diabetes is a chronic condition...",
  "conversation_id": "uuid-here",
  "timestamp": "2024-01-01T00:00:00"
}
```

## Architecture

- `app/main.py`: FastAPI application entry point
- `app/api/chat.py`: Chat API endpoints
- `app/services/chat_service.py`: Chat logic with Anthropic integration
- `app/core/config.py`: Configuration management
- `app/core/security.py`: Authentication middleware
- `app/models/chat.py`: Pydantic models for request/response validation

## Future Features

The architecture is designed to easily add:
- RAG (Retrieval Augmented Generation)
- File uploads
- X-ray image analysis
- Chat history persistence


