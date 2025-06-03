import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from skill_cognosconnector.main import app as cognos_app
import pytest

@pytest.fixture
def client():
    cognos_app.config['TESTING'] = True
    with cognos_app.test_client() as client:
        yield client

def test_health(client):
    response = client.get('/health')
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'healthy'
    assert data['skill'] == 'cognosconnector'

def test_generate_report_success(monkeypatch, client):
    # Mock requests.post para simular respuesta exitosa de Cognos
    import requests
    class MockResponse:
        status_code = 200
        def json(self):
            return {'report_id': 1, 'status': 'ok'}
    monkeypatch.setattr(requests, "post", lambda *args, **kwargs: MockResponse())
    response = client.post('/cognos/report', json={'payload': {'lead_id': 123}})
    assert response.status_code == 200
    data = response.get_json()
    assert data['status'] == 'success'
    assert 'report' in data

def test_generate_report_failure(monkeypatch, client):
    # Mock requests.post para simular error de Cognos
    import requests
    class MockResponse:
        status_code = 500
        text = 'Internal Error'
    monkeypatch.setattr(requests, "post", lambda *args, **kwargs: MockResponse())
    response = client.post('/cognos/report', json={'payload': {'lead_id': 123}})
    assert response.status_code == 500
    data = response.get_json()
    assert data['status'] == 'failure'
    assert 'error' in data

def test_generate_report_invalid_input(client):
    response = client.post('/cognos/report', json={})
    assert response.status_code == 400
    data = response.get_json()
    assert 'error' in data
