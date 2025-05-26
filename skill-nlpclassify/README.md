# Skill NLP Classify

## Descripción
Este skill expone un endpoint REST `/classify` que recibe texto y lo clasifica en categorías de lead usando reglas heurísticas locales. Está preparado para integración futura con IBM Watson NLP.

## Categorías posibles
- soporte: Palabras clave como 'pedido', 'ayuda', 'soporte'.
- venta: Palabras clave como 'compra', 'venta', 'cotizacion'.
- urgente: Palabras clave como 'urgente', 'reclamo', 'problema'.
- consulta: Palabras clave como 'consulta', 'pregunta', 'duda'.
- general: Cualquier otro texto.

## Validación de entrada
- El campo `text` debe ser un string no vacío y de al menos 3 caracteres.
- Si el texto es muy corto o no es string, se devuelve un error 400.

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

## Ejemplo de error
```json
{
  "error": "El campo 'text' debe ser un string no vacío."
}
```

## Notas para desarrolladores
- El código está documentado y preparado para integración futura con IBM Watson NLP.
- Para pruebas locales, solo se usa la lógica heurística.
- Revisar los comentarios en `app.py` para entender la lógica y posibles puntos de extensión.
