import pytest
from flask import Flask
import importlib.util
import os

# Ruta absoluta al app.py de skill-notifyslack
app_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../skill-notifyslack/app.py'))
spec = importlib.util.spec_from_file_location("notify_app_module", app_path)
notify_app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notify_app_module)
notify_app = notify_app_module.app

@pytest.fixture
def client():
    notify_app.config['TESTING'] = True
    with notify_app.test_client() as client:
        yield client

def test_notify_endpoint(client, monkeypatch):
    # Mock requests.post to evitar llamada real a Slack
    import requests
    class MockResponse:
        status_code = 200
        def json(self):
            return {"status": "success"}
    monkeypatch.setattr(requests, "post", lambda *args, **kwargs: MockResponse())
    response = client.post('/notify', json={"message": "Test message"})
    assert response.status_code == 200
    data = response.get_json()
    assert "status" in data
    assert data["status"] == "success"
