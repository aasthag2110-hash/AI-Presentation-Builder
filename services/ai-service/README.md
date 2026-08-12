# AI Presentation Generation Service

Internal, stateless FastAPI service that generates complete presentation outlines and individual slides through the Gemini API. It owns no database or files, creates no presentation IDs, and should only be called by the Orchestrator.

## Setup and run

Requires Python 3.11. From `services/ai-service`:

```bash
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8082}"
```

Environment variables are `GEMINI_API_KEY` (required for generation), `LLM_MODEL` (default `gemini-2.5-flash`), and `PORT` (default `8082`). `/health` never calls Gemini.

## API contracts

- `GET /health` returns `status`, `service`, and configured `model`.
- `POST /internal/ai/generate-deck` accepts `topic`, `audience`, `tone`, `slide_count` (5–10), and `source`; it returns only `title`, `summary`, `estimated_duration_minutes`, and `slides`.
- `POST /internal/ai/generate-slide` accepts `presentation_context`, `slide_number`, optional `current_slide`, and optional `instructions`; it returns one bare Slide.

All request and response objects reject extra fields. Errors use `{"error":{"code":"...","message":"...","details":{}}}`. Invalid model output gets exactly one repair request for a complete replacement. Provider failures are not repaired and return 503.

```bash
curl http://localhost:8082/health

curl -X POST http://localhost:8082/internal/ai/generate-deck -H 'Content-Type: application/json' -d '{"topic":"Responsible AI","audience":"Executives","tone":"professional","slide_count":5,"source":"prompt"}'

curl -X POST http://localhost:8082/internal/ai/generate-slide -H 'Content-Type: application/json' -d '{"presentation_context":{"title":"Responsible AI","audience":"Executives","tone":"professional","all_slide_titles":["Why now","Approach","Next steps"]},"slide_number":2,"instructions":"Emphasize practical adoption"}'
```

Run tests without a live API key:

```bash
pytest -q
```

Docker:

```bash
docker build -t ai-service .
docker run --rm -p 8082:8082 -e GEMINI_API_KEY="$GEMINI_API_KEY" ai-service
```
