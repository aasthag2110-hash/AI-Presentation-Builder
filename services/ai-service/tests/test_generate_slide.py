from copy import deepcopy
from unittest.mock import Mock

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app, get_ai_service
from app.services.gemini_service import GeminiService
from tests.conftest import parsed_response, slide


def test_single_slide_is_bare_object(client, slide_request):
    response = client.post("/internal/ai/generate-slide", json=slide_request)
    assert response.status_code == 200
    assert response.json()["slide_number"] == 2
    assert "slides" not in response.json()
    assert "presentation_id" not in response.text


def test_wrong_slide_number_triggers_repair(slide_request):
    first = slide(1)
    parse = Mock(side_effect=[parsed_response(first), parsed_response(slide(2))])
    provider = Mock(); provider.models.generate_content = parse
    service = GeminiService(Settings(gemini_api_key="test"), provider)
    app.dependency_overrides[get_ai_service] = lambda: service
    with TestClient(app) as client:
        response = client.post("/internal/ai/generate-slide", json=slide_request)
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["slide_number"] == 2
    assert parse.call_count == 2


def test_slide_number_outside_titles_is_422(client, slide_request):
    invalid = deepcopy(slide_request); invalid["slide_number"] = 4
    response = client.post("/internal/ai/generate-slide", json=invalid)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
