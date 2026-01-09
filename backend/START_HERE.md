# Quick Start Guide

## 1. Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Or if using a virtual environment (recommended):

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Set Up Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example .env
```

Then edit `.env` and add your actual values:
- `ANTHROPIC_API_KEY`: Get from https://console.anthropic.com/
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (from Supabase dashboard)

## 3. Run the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## 4. Test the API

Visit `http://localhost:8000/docs` for interactive API documentation.

Or test the health endpoint:
```bash
curl http://localhost:8000/health
```

## Troubleshooting

- **Port 8000 already in use**: Change the port with `--port 8001`
- **Import errors**: Make sure you're in the `backend/` directory or have installed dependencies
- **Authentication errors**: Verify your Supabase credentials are correct



