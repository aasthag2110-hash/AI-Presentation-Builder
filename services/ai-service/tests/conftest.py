from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient

from app.config import Settings, get_settings
from app.main import app, get_ai_service
from app.models import GenerateDeckResponse, Slide


def slide(number: int) -> dict:
    return {
        "slide_number": number,
        "title": f"Slide {number}",
        "key_points": ["First point", "Second point", "Third point"],
        "speaker_notes": "This is a conversational explanation for the audience. " * 12,
        "visual_recommendation": {
            "type": "diagram", "description": "A clear process diagram", "search_keywords": ["process", "flow"]
        },
        "audience_questions": [
            {"question": "Why does this matter?", "suggested_answer": "It improves the outcome."},
            {"question": "What happens next?", "suggested_answer": "We apply the approach."},
        ],
    }


def deck(count: int = 5) -> dict:
    return {
        "title": "A useful deck",
        "summary": "A concise presentation summary",
        "estimated_duration_minutes": 10,
        "slides": [slide(i) for i in range(1, count + 1)],
    }


class FakeService:
    def generate_deck(self, request):
        return GenerateDeckResponse.model_validate(deck(request.slide_count))

    def generate_slide(self, request):
        return Slide.model_validate(slide(request.slide_number))


@pytest.fixture
def client():
    app.dependency_overrides[get_ai_service] = lambda: FakeService()
    app.dependency_overrides[get_settings] = lambda: Settings(_env_file=None)
    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def deck_request():
    return {"topic": "Responsible AI", "audience": "Leaders", "tone": "professional", "slide_count": 5, "source": "prompt"}


@pytest.fixture
def slide_request():
    return {
        "presentation_context": {
            "title": "Responsible AI", "audience": "Leaders", "tone": "professional",
            "all_slide_titles": ["Opening", "Approach", "Action"],
        },
        "slide_number": 2,
    }


def parsed_response(value):
    return SimpleNamespace(parsed=value, text=None)
