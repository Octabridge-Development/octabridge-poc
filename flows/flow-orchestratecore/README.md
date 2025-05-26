# Flow Orchestrate Core

## Descripción
Este flujo principal orquesta los componentes del proyecto OctaBridge, incluyendo:
- Clasificación de texto usando el skill `nlpclassify`.
- Notificaciones a Slack usando el skill `notifyslack`.

## Configuración
Asegúrate de que los servicios estén corriendo en los siguientes puertos:
- `nlpclassify`: http://localhost:5000/classify
- `notifyslack`: http://localhost:5001/notify

## Ejecución
Ejecuta el flujo principal con Node.js:
```bash
node main-flow.js
```

## Ejemplo de Entrada
```json
{
  "text": "Necesito ayuda con mi pedido"
}
```

## Ejemplo de Salida
```json
{
  "classification": "soporte",
  "notificationStatus": "success"
}
```