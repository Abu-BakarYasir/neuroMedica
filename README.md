# NeuroMedica

<div align="center">

**An Explainable AI Platform for Medical Education**

Unified, explainable, and citation-backed AI tools for medical students and healthcare professionals.

[Features](#features) · [Tech Stack](#tech-stack) · [Quick Start](#quick-start) · [Project Structure](#project-structure) · [Development](#development)

</div>

---

## Overview

NeuroMedica is a comprehensive medical education platform that integrates multiple AI modules into a single unified environment. It provides visual explanations, confidence scores, and reference-grounded answers designed specifically for educational use in the medical field.

### Key Features

- 🤖 **AI-Powered Medical Chatbot** - Powered by Anthropic Claude for intelligent medical conversations
- 👨‍⚕️ **Doctor Dashboard** - Comprehensive dashboard for healthcare professionals
- 📊 **Clinical Tools** - Advanced tools for medical analysis and decision-making
- 📚 **Medical Resources** - Access to curated medical literature and resources
- 🔐 **Secure Authentication** - Password-based authentication with Supabase
- 🎨 **Modern UI** - Beautiful, responsive interface built with Tailwind CSS and shadcn/ui
- 📱 **Responsive Design** - Works seamlessly across desktop, tablet, and mobile devices

---

## Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Authentication**: [Supabase](https://supabase.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python 3.13+
- **AI Integration**: [Anthropic Claude](https://www.anthropic.com/)
- **Server**: [Uvicorn](https://www.uvicorn.org/)
- **Validation**: [Pydantic](https://docs.pydantic.dev/)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **Python** 3.13 or higher ([Download](https://www.python.org/downloads/))
- **npm** or **yarn** or **pnpm** (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))
- **Supabase Account** ([Sign up](https://supabase.com/))
- **Anthropic API Key** ([Get API Key](https://console.anthropic.com/))

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd neuroMedica
```

### 2. Frontend Setup

#### Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

#### Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local  # If .env.example exists
# Otherwise, create .env.local manually
```

Add the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_or_publishable_key

# Backend API Configuration
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000
```

**Where to find Supabase credentials:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project (or create a new one)
3. Navigate to **Settings** → **API**
4. Copy the **Project URL** and **anon/public key**

### 3. Backend Setup

#### Navigate to Backend Directory

```bash
cd backend
```

#### Create Virtual Environment (Recommended)

**Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv venv
source venv/bin/activate
```

#### Install Dependencies

```bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Application Configuration
APP_NAME=NeuroMedica Chat API
APP_VERSION=1.0.0
DEBUG=false
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Where to find credentials:**
- **Anthropic API Key**: [Anthropic Console](https://console.anthropic.com/)
- **Supabase Service Role Key**: Supabase Dashboard → Settings → API → `service_role` key (keep this secret!)

### 4. Run the Application

#### Start Backend Server

In the `backend/` directory:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend API will be available at `http://localhost:8000`

#### Start Frontend Development Server

In the root directory:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The frontend will be available at `http://localhost:3000`

### 5. Verify Installation

1. **Backend Health Check**: Visit `http://localhost:8000/health` - should return `{"status": "healthy"}`
2. **Frontend**: Visit `http://localhost:3000` - should display the landing page
3. **API Root**: Visit `http://localhost:8000/` - should return API information

---

## Project Structure

```
neuroMedica/
├── app/                          # Next.js App Router pages
│   ├── api/                      # API routes
│   │   └── chat/                 # Chat API proxy routes
│   ├── auth/                     # Authentication pages
│   │   ├── login/
│   │   ├── sign-up/
│   │   ├── forgot-password/
│   │   └── update-password/
│   ├── chat/                     # Chat page
│   ├── protected/                # Protected routes
│   │   └── doctors/              # Doctor dashboard
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── api/                  # API endpoints
│   │   │   └── chat.py           # Chat endpoints
│   │   ├── core/                 # Core configuration
│   │   │   ├── config.py         # Settings management
│   │   │   └── security.py       # Authentication middleware
│   │   ├── models/               # Pydantic models
│   │   │   └── chat.py           # Chat request/response models
│   │   ├── services/             # Business logic
│   │   │   └── chat_service.py   # Chat service with Anthropic
│   │   └── main.py               # FastAPI application entry
│   ├── requirements.txt          # Python dependencies
│   └── README.md                 # Backend-specific documentation
│
├── components/                   # React components
│   ├── auth-button.tsx           # Authentication button
│   ├── chatbot/                  # Chatbot components
│   │   ├── chatbot-widget.tsx
│   │   ├── chat-window.tsx
│   │   └── ...
│   ├── doctors/                  # Doctor dashboard components
│   │   ├── sidebar.tsx
│   │   ├── dashboard-layout.tsx
│   │   └── ...
│   ├── landing/                  # Landing page components
│   │   ├── hero-section.tsx
│   │   ├── navigation.tsx
│   │   └── ...
│   └── ui/                       # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── ...
│
├── lib/                          # Utility libraries
│   ├── chatbot/                  # Chatbot utilities
│   │   ├── api-client.ts
│   │   ├── hooks.ts
│   │   └── types.ts
│   ├── supabase/                 # Supabase client utilities
│   │   ├── client.ts             # Client-side Supabase client
│   │   ├── server.ts             # Server-side Supabase client
│   │   └── proxy.ts              # Supabase proxy
│   ├── landing-content.ts        # Landing page content
│   └── utils.ts                  # General utilities
│
├── public/                       # Static assets
│   └── assets/                   # Images, icons, etc.
│
├── Design/                       # Design documentation
│   ├── logo-guide.md
│   └── sidebar.md
│
├── .env.local                    # Frontend environment variables (create this)
├── .env.example                  # Example environment file (if exists)
├── package.json                  # Node.js dependencies
├── next.config.ts                # Next.js configuration
├── tailwind.config.ts            # Tailwind CSS configuration
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

---

## Development

### Available Scripts

#### Frontend

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

#### Backend

```bash
# Run development server with auto-reload
uvicorn app.main:app --reload --port 8000

# Run production server
uvicorn app.main:app --host 0.0.0.0 --port 8000

# Run with specific workers (production)
uvicorn app.main:app --workers 4 --host 0.0.0.0 --port 8000
```

### Code Style

- **Frontend**: ESLint configuration is included. Run `npm run lint` to check for issues.
- **Backend**: Follow PEP 8 Python style guide. Consider using `black` or `autopep8` for formatting.

### Environment Variables Reference

#### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key | Yes |
| `NEXT_PUBLIC_CHAT_API_URL` | Backend API URL (default: http://localhost:8000) | Yes |

#### Backend (backend/.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Yes |
| `SUPABASE_URL` | Your Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (keep secret!) | Yes |
| `APP_NAME` | Application name | No |
| `APP_VERSION` | Application version | No |
| `DEBUG` | Enable debug mode (true/false) | No |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed CORS origins | Yes |

---

## API Documentation

### Backend API Endpoints

#### Health Check
```
GET /health
```
Returns API health status.

**Response:**
```json
{
  "status": "healthy"
}
```

#### Chat Message
```
POST /api/chat/message
```

Send a message to the AI chatbot.

**Headers:**
```
Authorization: Bearer <supabase_token>
Content-Type: application/json
```

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

---

## Troubleshooting

### Common Issues

#### Frontend Issues

**Issue**: `NEXT_PUBLIC_SUPABASE_URL is not defined`
- **Solution**: Make sure `.env.local` exists in the root directory and contains all required variables. Restart the dev server after adding variables.

**Issue**: Cannot connect to backend API
- **Solution**: Ensure the backend server is running on port 8000 and `NEXT_PUBLIC_CHAT_API_URL` is correctly set in `.env.local`.

**Issue**: Authentication not working
- **Solution**: Verify Supabase credentials are correct. Check Supabase dashboard for project status.

#### Backend Issues

**Issue**: `ModuleNotFoundError` when running backend
- **Solution**: Ensure virtual environment is activated and dependencies are installed: `pip install -r requirements.txt`

**Issue**: CORS errors
- **Solution**: Check `ALLOWED_ORIGINS` in backend `.env` includes your frontend URL (e.g., `http://localhost:3000`).

**Issue**: Anthropic API errors
- **Solution**: Verify `ANTHROPIC_API_KEY` is correct and has sufficient credits/quota.

**Issue**: Port 8000 already in use
- **Solution**: Change the port: `uvicorn app.main:app --reload --port 8001` and update `NEXT_PUBLIC_CHAT_API_URL` accordingly.

### Getting Help

1. Check the [backend README](./backend/README.md) for backend-specific issues
2. Review environment variable setup in [backend ENV_SETUP.md](./backend/ENV_SETUP.md)
3. Ensure all prerequisites are installed and up to date
4. Check that both frontend and backend servers are running

---

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Test thoroughly (frontend and backend)
4. Commit your changes: `git commit -m 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Submit a pull request

---

## License

[Add your license information here]

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Anthropic Claude Documentation](https://docs.anthropic.com/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

## Support

For issues, questions, or contributions, please [open an issue](link-to-issues) or contact the development team.

---

<div align="center">

**Built with ❤️ for medical education**

</div>
