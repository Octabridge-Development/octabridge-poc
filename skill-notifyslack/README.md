# Skill Notify Slack

## Descripción
Este skill expone un endpoint REST `/notify` que envía mensajes a un canal de Slack mediante un webhook. Es útil para notificaciones automáticas desde otros sistemas.

## Validación de entrada
- El campo `message` debe ser un string no vacío.
- Si el mensaje es vacío o no es string, se devuelve un error 400.

## Instalación y ejecución
1. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
2. Ejecutar la aplicación:
   ```bash
   python app.py
   ```

## Uso del endpoint
Enviar una solicitud POST al endpoint `/notify` con un cuerpo JSON:
```json
{
  "message": "Este es un mensaje de prueba"
}
```

Respuesta esperada:
```json
{
  "status": "success"
}
```

## Notas para desarrolladores
- El webhook de Slack debe configurarse en la variable `webhook_url` en el código.
- El código está documentado y preparado para manejo de errores y extensión futura.
- Revisar los comentarios en `app.py` para entender la lógica y posibles puntos de extensión.
