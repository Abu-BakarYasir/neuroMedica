# Environment Variables Setup

## Backend (.env file in backend/ directory)

Create a `.env` file in the `backend/` directory with the following variables:

```env
ANTHROPIC_API_KEY=your_anthropic_api_key_here
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
APP_NAME=NeuroMedica Chat API
APP_VERSION=1.0.0
DEBUG=false
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## Frontend (.env.local file in root directory)

Add the following to your `.env.local` file in the root directory:

```env
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000
```

Note: The existing Supabase variables should already be in your `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`



