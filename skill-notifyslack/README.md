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

## 🐳 Containerización

### Construcción de la Imagen Docker
Para construir la imagen Docker de este skill, ejecute el siguiente comando desde el directorio del skill:

```bash
sudo docker build -t skill-notifyslack:latest .
```

### Ejecución del Contenedor
Para ejecutar el contenedor en el puerto 8001:

```bash
sudo docker run -d -p 8001:5001 --name notify-slack -e OCTABRIDGE_SLACK_WEBHOOK_URL=https://hooks.slack.com/services/test-webhook-url skill-notifyslack:latest
```

### Pruebas Locales

#### Verificar el estado del servicio
Ejecute el siguiente comando para verificar el estado del servicio:

```bash
curl http://localhost:8001/health
```

#### Enviar una notificación
Envíe un mensaje de ejemplo al endpoint `/notify`:

```bash
curl -X POST -H "Content-Type: application/json" -d '{"message": "Prueba de notificación a Slack"}' http://localhost:8001/notify
```

El servicio debería responder con un estado de éxito, por ejemplo:

```json
{"status":"success"}
```

## Notas para desarrolladores
- El webhook de Slack debe configurarse en la variable `webhook_url` en el código.
- El código está documentado y preparado para manejo de errores y extensión futura.
- Revisar los comentarios en `app.py` para entender la lógica y posibles puntos de extensión.
