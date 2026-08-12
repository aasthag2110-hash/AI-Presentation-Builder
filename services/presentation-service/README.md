# Presentation Orchestrator (Member 4)

Internal FastAPI service that coordinates the AI Service, Document Service, and
PostgreSQL. It owns presentation persistence and the generate, retrieve, manual
edit, and single-slide regeneration workflows.

## Contract boundaries

- Called by the API Gateway only.
- Calls `POST /internal/ai/generate-deck` and
  `POST /internal/ai/generate-slide` on the AI Service.
- Calls `GET /internal/documents/{document_id}/text` on the Document Service.
- Never calls an LLM directly and never parses uploaded documents.

## Endpoints

| Method | Path | Success response |
| --- | --- | --- |
| GET | `/health` | Database connection status |
| POST | `/internal/presentations/generate` | `201` full Presentation |
| GET | `/internal/presentations/{presentation_id}` | Full Presentation |
| PATCH | `/internal/presentations/{presentation_id}/slides/{slide_number}` | Updated Slide |
| POST | `/internal/presentations/{presentation_id}/slides/{slide_number}/regenerate` | Regenerated Slide |

All errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR | NOT_FOUND | AI_FAILURE | INTERNAL_ERROR",
    "message": "Human-readable message",
    "details": {}
  }
}
```

## Environment

Copy `.env.example` to `.env`. The required variables are:

- `AI_SERVICE_URL`
- `DOCUMENT_SERVICE_URL`
- `DATABASE_URL`

Optional values are `PORT` (default `8081`), `UPSTREAM_TIMEOUT_SECONDS`
(default `60`), and `DATABASE_ECHO` (default `false`). A plan-style
`postgresql://...` URL is converted internally to SQLAlchemy's asyncpg URL.

## Local development

Requires Python 3.11 and PostgreSQL 15.

```bash
python -m venv .venv
.venv/Scripts/pip install -r requirements-dev.txt
copy .env.example .env
.venv/Scripts/alembic upgrade head
.venv/Scripts/uvicorn app.main:app --reload --port 8081
```

Run verification from this directory:

```bash
.venv/Scripts/ruff check .
.venv/Scripts/pytest
```

## Behavior notes

- The Gateway is expected to reject slide counts outside 5-10. Per the Member 4
  plan, this internal service also clamps any integer count to that range.
- Prompt generation requires a topic of at least 10 characters. Document
  generation requires a UUID `document_id` and fetches its full text from the
  Document Service.
- Generated decks are persisted in one transaction. Slide edit/regeneration
  updates the presentation's `updated_at` timestamp.
- Alembic migrations run automatically when the Docker container starts.

