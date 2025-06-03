# Usa una imagen base de Python.
FROM python:3.9-slim-buster

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el archivo de requerimientos e instala las dependencias.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el código del skill a la carpeta de trabajo.
# Esto incluye main.py, models.py, y el archivo que inicia Flask (server.py o similar).
COPY . .

# Expone el puerto en el que la aplicación Flask escuchará.
# Tu código indica que Flask corre en el puerto 3001.
EXPOSE 3001

# Comando que se ejecutará cuando el contenedor se inicie.
# Aquí asumimos que el archivo que inicia la aplicación Flask se llama 'server.py'.
# Si el archivo que contiene `app.run(...)` se llama diferente, ajústalo aquí.
CMD ["python", "server.py"]