# Dockerfile
# Fase de construcción para dependencias
FROM python:3.9-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Fase final reducida
FROM python:3.9-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5000
CMD ["python", "app.py"]
