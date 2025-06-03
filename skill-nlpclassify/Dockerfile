# Dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install gunicorn \
    && rm -rf /root/.cache/pip
COPY . .
CMD ["gunicorn", "-b", "0.0.0.0:8000", "app:app", "--workers=2", "--threads=4", "--timeout=120"]
