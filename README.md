# octabridge-poc

## Descripción general
OctaBridge es una PoC para calificación automática de leads usando IBM Watson NLP y notificaciones a Slack. El sistema está compuesto por microservicios (skills) y un flujo principal de orquestación.

## Estructura del proyecto
- `skill-nlpclassify/`: Skill para clasificación de texto (NLP)
- `skill-notifyslack/`: Skill para notificaciones a Slack
- `flows/flow-orchestratecore/`: Flujo principal que orquesta los skills
- `tests/`: Pruebas automáticas para skills y flujo
- `docs/`: Documentación técnica y diagramas
- `backups/`: Exportaciones y respaldos diarios

## Dependencias principales
- Python 3.9+
- Flask
- requests
- ibm-watson
- Node.js (para el flujo principal)
- Docker (opcional para despliegue)

## Guía rápida
1. Instala las dependencias:
   ```bash
   pip install -r requirements.txt
   ```
2. Ejecuta cada skill:
   ```bash
   cd skill-nlpclassify && python app.py
   cd skill-notifyslack && python app.py
   ```
3. Ejecuta el flujo principal:
   ```bash
   cd flows/flow-orchestratecore && node main-flow.js
   ```
4. Corre las pruebas:
   ```bash
   pytest
   ```

## Notas para desarrolladores
- Revisa los README de cada skill y del flujo para detalles de endpoints y configuración.
- Usa `.env.example` como plantilla para tus variables de entorno.