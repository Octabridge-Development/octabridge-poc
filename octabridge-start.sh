#!/bin/bash
# octabridge-start.sh - Script para levantar todo el sistema OctaBridge

echo "🚀 Iniciando OctaBridge PoC v0.3..."

# Función para verificar si un puerto está libre
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Puerto $1 ya está en uso"
        return 1
    else
        echo "✅ Puerto $1 disponible"
        return 0
    fi
}

# Verificar puertos necesarios
echo "🔍 Verificando puertos..."
check_port 3000 || exit 1
check_port 3001 || exit 1
check_port 5000 || exit 1
check_port 5001 || exit 1

# Función para levantar skill con Flask wrapper
start_skill_with_flask() {
    local skill_name=$1
    local port=$2
    local endpoint=$3
    local skill_dir=$4

    echo "🔄 Iniciando $skill_name en puerto $port..."

    cd "$skill_dir"

    # Activar entorno virtual si existe
    if [ -d "venv" ]; then
        source venv/bin/activate
    fi

    # Crear wrapper Flask temporal
    cat > flask_wrapper.py << EOF
from main import main
from flask import Flask, request, jsonify
import os

app = Flask(__name__)

@app.route('$endpoint', methods=['POST'])
def skill_endpoint():
    try:
        result = main(request.json)
        return jsonify(result)
    except Exception as e:
        return jsonify({"statusCode": 500, "body": {"status": "error", "message": str(e)}}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "skill": "$skill_name"})

if __name__ == '__main__':
    print("🎯 $skill_name corriendo en puerto $port")
    app.run(host='0.0.0.0', port=$port, debug=False)
EOF

    # Ejecutar en background
    python flask_wrapper.py &
    local pid=$!
    echo "  ✅ $skill_name iniciado (PID: $pid)"
    sleep 2

    cd - > /dev/null
}

# Configurar variables de entorno
export OCTABRIDGE_SLACK_WEBHOOK_URL="https://hooks.slack.com/triggers/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"

# Levantar skills
echo "🏗️ Levantando skills..."
start_skill_with_flask "skill-intakebasic" 3000 "/skill-intakebasic" "skill_intakebasic"
start_skill_with_flask "skill-datasetloader" 3001 "/skill-datasetloader" "skill-datasetloader"

# Levantar skills que ya tienen Flask
echo "🔄 Iniciando skill-nlpclassify en puerto 5000..."
cd skill-nlpclassify
if [ -d "venv" ]; then source venv/bin/activate; fi
python app.py &
echo "  ✅ skill-nlpclassify iniciado (PID: $!)"
cd - > /dev/null

echo "🔄 Iniciando skill-notifyslack en puerto 5001..."
cd skill-notifyslack
if [ -d "venv" ]; then source venv/bin/activate; fi
python app.py &
echo "  ✅ skill-notifyslack iniciado (PID: $!)"
cd - > /dev/null

# Esperar a que todos los skills estén listos
echo "⏳ Esperando que los skills estén listos..."
sleep 5

# Verificar que todos los skills responden
echo "🏥 Verificando health checks..."
for port in 3000 3001 5000 5001; do
    if curl -s http://localhost:$port/health > /dev/null; then
        echo "  ✅ Skill en puerto $port: OK"
    else
        echo "  ❌ Skill en puerto $port: FALLO"
    fi
done

echo ""
echo "🎉 ¡OctaBridge PoC está listo!"
echo ""
echo "📋 URLs disponibles:"
echo "  • http://localhost:3000/health (skill-intakebasic)"
echo "  • http://localhost:5000/health (skill-nlpclassify)"
echo "  • http://localhost:5001/health (skill-notifyslack)"
echo "  • http://localhost:3001/health (skill-datasetloader)"
echo ""
echo "🧪 Para probar el sistema completo:"
echo "  cd flows/flow-orchestratecore"
echo "  node test-flow.js"
echo ""
echo "🛑 Para detener todos los servicios:"
echo "  pkill -f 'python.*app.py'"
echo "  pkill -f 'python.*flask_wrapper.py'"