from copy import deepcopy
from unittest.mock import Mock

import pytest
from fastapi.testclient import TestClient
import httpx

from app.config import Settings
from app.main import app, get_ai_service
from app.services.gemini_service import GeminiService
from tests.conftest import deck, parsed_response


def test_valid_deck_is_strict_and_consecutive(client, deck_request):
    response = client.post("/internal/ai/generate-deck", json=deck_request)
    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"title", "summary", "estimated_duration_minutes", "slides"}
    assert len(body["slides"]) == 5
    assert [s["slide_number"] for s in body["slides"]] == [1, 2, 3, 4, 5]
    assert "presentation_id" not in response.text


@pytest.mark.parametrize("source", ["prompt", "document"])
def test_both_sources_are_accepted(client, deck_request, source):
    deck_request["source"] = source
    assert client.post("/internal/ai/generate-deck", json=deck_request).status_code == 200


@pytest.mark.parametrize("change", [{"tone": "loud"}, {"slide_count": 4}, {"slide_count": 11}, {"extra": True}])
def test_invalid_requests_use_envelope(client, deck_request, change):
    response = client.post("/internal/ai/generate-deck", json={**deck_request, **change})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


def service_with_responses(*responses):
    generate = Mock(side_effect=[parsed_response(item) for item in responses])
    client = Mock()
    client.models.generate_content = generate
    return GeminiService(Settings(gemini_api_key="test"), client), generate


def test_malformed_first_result_repairs_once(deck_request):
    invalid = deepcopy(deck(5))
    invalid["slides"][0]["key_points"] = ["Only one"]
    service, parse = service_with_responses(invalid, deck(5))
    app.dependency_overrides[get_ai_service] = lambda: service
    with TestClient(app) as client:
        assert client.post("/internal/ai/generate-deck", json=deck_request).status_code == 200
    app.dependency_overrides.clear()
    assert parse.call_count == 2


def test_two_invalid_results_return_422(deck_request):
    invalid = deepcopy(deck(5)); invalid["slides"] = invalid["slides"][:4]
    service, parse = service_with_responses(invalid, invalid)
    app.dependency_overrides[get_ai_service] = lambda: service
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post("/internal/ai/generate-deck", json=deck_request)
    app.dependency_overrides.clear()
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
    assert parse.call_count == 2


def test_provider_timeout_is_503_without_repair(deck_request):
    parse = Mock(side_effect=httpx.ReadTimeout("timed out", request=Mock()))
    provider = Mock(); provider.models.generate_content = parse
    service = GeminiService(Settings(gemini_api_key="test"), provider)
    app.dependency_overrides[get_ai_service] = lambda: service
    with TestClient(app, raise_server_exceptions=False) as client:
        response = client.post("/internal/ai/generate-deck", json=deck_request)
    app.dependency_overrides.clear()
    assert response.status_code == 503
    assert response.json()["error"]["code"] == "AI_FAILURE"
    assert parse.call_count == 1
