from flask import Flask, request, jsonify
import logging
import re
from functools import lru_cache

app = Flask(__name__)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('nlpclassify')

@lru_cache(maxsize=128)
def preprocess_text(text):
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

@app.route('/classify', methods=['POST'])
def classify():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Campo 'text' requerido"}), 400
        text = data['text']
        if not isinstance(text, str):
            return jsonify({"error": "El campo 'text' debe ser string"}), 400
        if len(text.strip()) < 3:
            return jsonify({"error": "El texto es demasiado corto para clasificar."}), 400
        if len(text.strip()) > 500:
            return jsonify({"error": "El texto es demasiado largo. Máximo 500 caracteres."}), 400
        clean_text = preprocess_text(text)
        keywords_map = {
            'soporte': ['pedido', 'ayuda', 'soporte'],
            'venta': ['compra', 'venta', 'cotizacion'],
            'urgente': ['urgente', 'reclamo', 'problema'],
            'consulta': ['consulta', 'pregunta', 'duda']
        }
        category = 'general'
        for cat, keys in keywords_map.items():
            if any(key in clean_text for key in keys):
                category = cat
                break
        logger.info(f"Clasificado: '{text[:30]}...' -> {category}")
        return jsonify({"category": category})
    except Exception as e:
        logger.exception(f"Error crítico: {str(e)}")
        return jsonify({"error": "Error interno del servidor"}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "healthy",
        "service": "nlpclassify",
        "version": "1.1.0"
    })

if __name__ == "__main__":
    app.run(
        host='0.0.0.0',
        port=5000,
        threaded=True,
        debug=False
    )