from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

@app.route('/notify', methods=['POST'])
def notify():
    """
    Endpoint para enviar notificaciones a Slack.
    Entrada: JSON con campo 'message'.
    Salida: JSON con 'status' (success/failure) y error si aplica.
    """
    data = request.json
    message = data.get('message')
    # Validación robusta de entrada
    if not isinstance(message, str) or not message.strip():
        return jsonify({"error": "El campo 'message' debe ser un string no vacío."}), 400
    # Obtener la URL del webhook de Slack de una variable de entorno
    webhook_url = os.environ.get("OCTABRIDGE_SLACK_WEBHOOK_URL")
    if not webhook_url:
        return jsonify({"status": "failure", "error": "No se ha configurado la variable de entorno OCTABRIDGE_SLACK_WEBHOOK_URL"}), 500
    try:
        response = requests.post(webhook_url, json={"text": message})
        if response.status_code == 200:
            return jsonify({"status": "success"}), 200
        else:
            return jsonify({"status": "failure", "error": response.text}), response.status_code
    except Exception as e:
        return jsonify({"status": "failure", "error": str(e)}), 500

if __name__ == "__main__":
    # Ejecutar el servidor Flask en modo desarrollo
    app.run(host='0.0.0.0', port=5001)