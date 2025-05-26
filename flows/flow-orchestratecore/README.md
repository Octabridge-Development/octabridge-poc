# Flow Orchestrate Core

## Descripción
Este flujo principal orquesta los componentes del proyecto OctaBridge, incluyendo:
- Clasificación de texto usando el skill `nlpclassify`.
- Notificaciones a Slack usando el skill `notifyslack`.

## Lógica del flujo
1. Recibe un objeto con el campo `text`.
2. Llama al endpoint `/classify` del skill-nlpclassify para obtener la categoría.
3. Llama al endpoint `/notify` del skill-notifyslack para enviar la notificación a Slack.
4. Devuelve un objeto con la categoría y el estado de la notificación.

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

## Notas para desarrolladores
- El flujo depende de que ambos skills estén corriendo y accesibles por HTTP.
- El código está documentado para facilitar la revisión y el mantenimiento.