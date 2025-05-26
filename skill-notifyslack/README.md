# Skill Notify Slack

## Descripción
Este skill utiliza Flask para exponer un endpoint `/notify` que envía mensajes a un canal de Slack mediante un webhook.

## Requisitos
- Python 3.9+
- Flask 2.1.2
- Requests 2.28.1

## Instalación
1. Instalar dependencias:
   ```bash
   pip install -r requirements.txt
   ```
2. Ejecutar la aplicación:
   ```bash
   python app.py
   ```

## Uso
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
