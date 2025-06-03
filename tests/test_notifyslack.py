import pytest
from flask import Flask
import importlib.util
import os
import logging

# Importa dinámicamente la app Flask del skill-notifyslack
app_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../skill-notifyslack/app.py'))
spec = importlib.util.spec_from_file_location("notify_app_module", app_path)
notify_app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notify_app_module)
notify_app = notify_app_module.app

@pytest.fixture
def client():
    # Configura la app en modo testing y retorna un cliente de pruebas
    notify_app.config['TESTING'] = True
    with notify_app.test_client() as client:
        yield client

def test_notify_endpoint(client, monkeypatch):
    # Mock de requests.post para evitar una llamada real a Slack
    import requests
    import os
    os.environ["OCTABRIDGE_SLACK_WEBHOOK_URL"] = "http://mock-url"
    class MockResponse:
        status_code = 200
        def json(self):
            return {"status": "success"}
    monkeypatch.setattr(requests, "post", lambda *args, **kwargs: MockResponse())
    # Envía una solicitud POST al endpoint /notify con un mensaje de prueba
    response = client.post('/notify', json={"message": "Test message"})
    # Verifica que la respuesta sea exitosa y tenga el campo 'status'
    assert response.status_code == 200
    data = response.get_json()
    assert "status" in data
    assert data["status"] == "success"

def test_invalid_input(client):
    # Prueba diferentes entradas inválidas
    tests = [
        {"message": ""},
        {},
        {"message": 123},
        {"message": None}
    ]
    for data in tests:
        response = client.post('/notify', json=data)
        # Verifica que la respuesta tenga un código de estado 400
        assert response.status_code == 400

def test_missing_webhook(client, monkeypatch):
    # Prueba el comportamiento cuando falta la URL del webhook
    import requests
    if "OCTABRIDGE_SLACK_WEBHOOK_URL" in os.environ:
        del os.environ["OCTABRIDGE_SLACK_WEBHOOK_URL"]
    class MockResponse:
        status_code = 200
        def json(self):
            return {"status": "success"}
    monkeypatch.setattr(requests, "post", lambda *args, **kwargs: MockResponse())
    response = client.post('/notify', json={"message": "Test message"})
    # Verifica que la respuesta tenga un código de estado 500
    assert response.status_code == 500
    data = response.get_json()
    assert data["status"] == "failure"
    assert "error" in data
