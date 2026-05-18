# LearnLens

Full-stack learning companion: React frontend + FastAPI backend powered by **Gemma 4**.

## Quick start

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
# Edit .env and set GOOGLE_API_KEY from https://aistudio.google.com/apikey
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Configuration

| Variable | Description |
|----------|-------------|
| `GOOGLE_API_KEY` | Google AI Studio API key |
| `GEMMA_MODEL` | Default `gemma-4-26b-it` |
| `LLM_PROVIDER` | `google` (default) or `ollama` |
| `OLLAMA_BASE_URL` | e.g. `http://localhost:11434` |
| `OLLAMA_MODEL` | e.g. `gemma4` |

## API

`POST /api/breakdown` — `multipart/form-data` with optional fields:

| Field | Type | Description |
|-------|------|-------------|
| `concept` | string | Text prompt (optional if files provided) |
| `image` | file | JPG, PNG, WebP, GIF |
| `audio` | file | MP3, WAV, OGG, WebM, FLAC |
| `document` | file | PDF, TXT, MD, DOCX |

At least one of text or a file is required. Gemma 4 processes image, audio, and PDF natively; other documents are text-extracted first.

`POST /api/breakdown/json` — text-only JSON: `{ "concept": "your text" }`
