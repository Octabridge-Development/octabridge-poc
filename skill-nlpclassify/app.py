from flask import Flask, request, jsonify
import logging
import re

app = Flask(__name__)

# Configuración de logging para trazabilidad
logging.basicConfig(level=logging.INFO)

# --- INTEGRACIÓN WATSON COMENTADA POR INCOMPATIBILIDAD SDK ---
# import os
# from ibm_watson import NaturalLanguageClassifierV1
# from ibm_cloud_sdk_core.authenticators import IAMAuthenticator
# IBM_API_KEY = os.getenv('IBM_CLOUD_API_KEY')
# IBM_NLC_URL = os.getenv('IBM_WATSON_NLC_URL', 'https://api.us-south.natural-language-classifier.watson.cloud.ibm.com/instances/your-instance-id')
# IBM_NLC_ID = os.getenv('IBM_WATSON_NLC_ID', 'your-classifier-id')
# if IBM_API_KEY and IBM_NLC_ID:
#     authenticator = IAMAuthenticator(IBM_API_KEY)
#     nlc = NaturalLanguageClassifierV1(authenticator=authenticator)
#     nlc.set_service_url(IBM_NLC_URL)
# else:
#     nlc = None

# Preprocesamiento básico del texto
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

@app.route('/classify', methods=['POST'])
def classify():
    """
    Endpoint principal para clasificar texto.
    Entrada: JSON con campo 'text'.
    Salida: JSON con campo 'category' o 'error'.
    """
    data = request.json
    text = data.get('text')
    # Validación de tipo y longitud mínima
    if not isinstance(text, str) or not text.strip():
        return jsonify({"error": "El campo 'text' debe ser un string no vacío."}), 400
    if len(text.strip()) < 3:
        return jsonify({"error": "El texto es demasiado corto para clasificar."}), 400
    # Validación de longitud máxima para evitar abusos
    if len(text.strip()) > 500:
        return jsonify({"error": "El texto es demasiado largo. Máximo 500 caracteres."}), 400
    logging.info(f"Texto recibido: {text}")
    clean_text = preprocess_text(text)
    logging.info(f"Texto preprocesado: {clean_text}")
    # --- SOLO LÓGICA HEURÍSTICA LOCAL ---
    if any(word in clean_text for word in ['pedido', 'ayuda', 'soporte']):
        category = 'soporte'
    elif any(word in clean_text for word in ['compra', 'venta', 'cotizacion']):
        category = 'venta'
    elif any(word in clean_text for word in ['urgente', 'reclamo', 'problema']):
        category = 'urgente'
    elif any(word in clean_text for word in ['consulta', 'pregunta', 'duda']):
        category = 'consulta'
    else:
        category = 'general'
    logging.info(f"Categoría simulada: {category} (categorías posibles: soporte, venta, urgente, consulta, general)")
    return jsonify({"category": category})

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de health check para el skill NLP Classify"""
    return jsonify({"status": "healthy", "skill": "nlpclassify"})

if __name__ == "__main__":
    # ADVERTENCIA: No usar el servidor de desarrollo de Flask en producción
    app.run(host='0.0.0.0', port=5000)