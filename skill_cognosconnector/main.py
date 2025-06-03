"""
Skill para conexión con Cognos y generación de reportes.
"""
import os
from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

COGNOS_API_URL = os.getenv('COGNOS_API_URL', 'http://cognos-server/api')

@app.route('/cognos/report', methods=['POST'])
def generate_report():
    data = request.get_json()
    # Validación básica
    if not data or 'payload' not in data:
        return jsonify({'error': 'Falta el campo payload'}), 400
    try:
        # Simulación de integración con Cognos
        response = requests.post(f"{COGNOS_API_URL}/report", json=data['payload'])
        if response.status_code == 200:
            return jsonify({'status': 'success', 'report': response.json()}), 200
        else:
            return jsonify({'status': 'failure', 'error': response.text}), response.status_code
    except Exception as e:
        return jsonify({'status': 'failure', 'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy', 'skill': 'cognosconnector'})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5002, threaded=True, debug=False)
