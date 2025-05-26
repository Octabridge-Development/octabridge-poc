# Skill NLP Classify

## Descripción
Este skill utiliza Flask para exponer un endpoint `/classify` que clasifica texto en categorías predefinidas.

## Requisitos
- Python 3.9+
- Flask 2.1.2

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
Enviar una solicitud POST al endpoint `/classify` con un cuerpo JSON:
```json
{
  "text": "Ejemplo de texto"
}
```

Respuesta esperada:
```json
{
  "category": "soporte"
}
```
