from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/classify', methods=['POST'])
def classify():
    text = request.json.get('text')
    # Lógica de NLP aquí
    return jsonify({"category": "soporte"})

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)