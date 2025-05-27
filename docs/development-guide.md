# Guía de Desarrollo

## Convenciones de Código
- **Commits**: Usar prefijos descriptivos, por ejemplo:
  ```
  [skill-nlpclassify] Add text preprocessing
  ```
- **Pruebas**: Cobertura mínima del 70% usando `pytest`.
- **Variables de Entorno**: Usar prefijo estándar `OCTABRIDGE_`.

## Workflow Git
1. Crear rama desde `develop`:
   ```bash
   git checkout develop && git pull
   git checkout -b feature/<nombre-feature>
   ```
2. Subir cambios:
   ```bash
   git add .
   git commit -m "[<componente>] Descripción del cambio"
   git push origin feature/<nombre-feature>
   ```

## Estructura de Skills
Cada skill debe incluir:
- `app.py`: Lógica principal.
- `requirements.txt`: Dependencias.
- `Dockerfile`: Configuración para contenedores.
- `README.md`: Documentación del skill.

## Pruebas
- Ejecutar pruebas unitarias:
  ```bash
  pytest tests/ --cov=app --cov-report=term-missing
  ```
- Validar integración end-to-end antes de mergear.

## Backups
- Realizar backups diarios antes de las 18:00:
  ```bash
  ibmcloud orchestrate flow bundle-export --output backups/$(date +%Y%m%d)-<nombre-skill>.zip
  ```
