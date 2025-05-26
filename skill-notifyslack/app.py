from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

@app.route('/notify', methods=['POST'])
def notify():
    data = request.json
    message = data.get('message')
    webhook_url = "https://hooks.slack.com/services/..."  # Reemplaza con tu webhook de Slack
    response = requests.post(webhook_url, json={"text": message})
    if response.status_code == 200:
        return jsonify({"status": "success"}), 200
    else:
        return jsonify({"status": "failure", "error": response.text}), response.status_code

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5001)