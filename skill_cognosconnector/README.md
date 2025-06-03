# Skill Cognos Connector

Este skill expone un endpoint `/cognos/report` para integrarse con IBM Cognos y generar reportes a partir de datos enviados por otros skills o flujos.

## Endpoints
- `POST /cognos/report`: Recibe un payload y lo envía a la API de Cognos para generar un reporte.
- `GET /health`: Health check del skill.

## Configuración
- Variable de entorno `COGNOS_API_URL` para definir la URL base de la API de Cognos.

## Ejemplo de uso
```bash
curl -X POST http://localhost:5002/cognos/report -H 'Content-Type: application/json' -d '{"payload": {"lead_id": 123}}'
```

## Notas
- Este skill está preparado para integración real con Cognos, pero puede simular la respuesta en desarrollo.
- El skill puede extenderse para transformar datos y generar dashboards básicos.
