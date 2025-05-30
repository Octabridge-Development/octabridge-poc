from main import main
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/skill-intakebasic', methods=['POST'])
def intake():
    return main(request.json)

@app.route('/health', methods=['GET'])
def health():
    return {'status': 'healthy'}

if __name__ == '__main__':
    print('🎯 skill-intakebasic corriendo en puerto 3000')
    app.run(host='0.0.0.0', port=3000, debug=True)
