def test_health_has_exact_fields(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "ai-service", "model": "gpt-4o-mini"}
