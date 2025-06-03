from main import main
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/skill-datasetloader', methods=['POST'])
def loader():
    return main(request.json)

@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy'}

if __name__ == '__main__':
    print('🎯 skill-datasetloader corriendo en puerto 3001')
    app.run(host='0.0.0.0', port=3001, debug=True)
