# Usa una imagen base de Python.
FROM python:3.9-slim-buster

# Configura variables de entorno
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
ENV PYTHONUNBUFFERED=1

# Establece el directorio de trabajo dentro del contenedor
# Aquí es donde se copiarán los archivos y donde se ejecutará el script
WORKDIR /app

# Copia el archivo de requisitos e instala las dependencias primero.
# Ahora, 'requirements.txt' se encuentra directamente en el contexto del build (tu carpeta skill_intakebasic)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia todo el código fuente de tu skill.
# El '.' indica que se copiará todo desde la raíz del contexto de construcción (tu carpeta skill_intakebasic)
# al directorio de trabajo actual dentro del contenedor (/app).
COPY . .

# Define el comando que se ejecutará cuando el contenedor se inicie.
# Tu main.py es el punto de entrada.
CMD ["python", "main.py"]