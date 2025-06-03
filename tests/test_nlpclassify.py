import pytest
from flask import Flask
import importlib.util
import os
import time
import logging

# Importa dinámicamente la app Flask del skill-nlpclassify
app_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../skill-nlpclassify/app.py'))
spec = importlib.util.spec_from_file_location("nlp_app_module", app_path)
nlp_app_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(nlp_app_module)
nlp_app = nlp_app_module.app

@pytest.fixture
def client():
    # Configura la app en modo testing y retorna un cliente de pruebas
    nlp_app.config['TESTING'] = True
    with nlp_app.test_client() as client:
        yield client

def test_classify_endpoint(client):
    # Envía una solicitud POST al endpoint /classify con un texto de prueba
    response = client.post('/classify', json={"text": "Necesito ayuda con mi pedido"})
    # Verifica que la respuesta sea exitosa y tenga el campo 'category'
    assert response.status_code == 200
    data = response.get_json()
    assert "category" in data
    assert data["category"] == "soporte"

def test_valid_classification(client):
    response = client.post('/classify', json={"text": "Necesito ayuda con mi pedido"})
    assert response.status_code == 200
    assert response.json['category'] == 'soporte'

def test_invalid_input(client):
    tests = [
        {"text": ""},
        {"text": "a"},
        {},
        {"text": 123},
        {"text": "A" * 501}
    ]
    for data in tests:
        response = client.post('/classify', json=data)
        assert response.status_code == 400

def test_performance(client):
    start_time = time.time()
    test_cases = 100
    for _ in range(test_cases):
        client.post('/classify', json={"text": "Consulta sobre productos disponibles"})
    duration = time.time() - start_time
    avg_time = duration / test_cases * 1000
    logging.info(f"Performance test: {test_cases} requests en {duration:.2f}s ({avg_time:.2f}ms/req)")
    assert avg_time < 50.0
