import os
import json
import datetime
import uuid
import boto3
from botocore.exceptions import ClientError

# --- Configuración de IBM COS (Cloud Object Storage) ---
# Se recomienda usar variables de entorno para la configuración en producción
# Para pruebas locales, puedes descomentar y usar los valores directos

# Tus credenciales HMAC. Asegúrate de que estas sean las que copiaste de IBM Cloud.
COS_ACCESS_KEY_ID = os.getenv("COS_ACCESS_KEY_ID", "ef85e41b58dc4518a8e387bd6f2c7c44")
COS_SECRET_ACCESS_KEY = os.getenv("COS_SECRET_ACCESS_KEY", "b79083b77a90f97f2bd6fc3e3cb5e19a695387e51b43eb49")

# Nombre del bucket y región confirmados en IBM Cloud
COS_BUCKET_NAME = os.getenv("COS_BUCKET_NAME", "ibm-cos-bucket")
COS_REGION = os.getenv("COS_REGION", "ca-tor")
COS_ENDPOINT = os.getenv("COS_ENDPOINT", f"https://s3.{COS_REGION}.cloud-object-storage.appdomain.cloud")

# --- Inicializar cliente de COS ---
# Líneas de depuración añadidas aquí para ver qué valores se están usando
print(f"DEBUG: COS_ACCESS_KEY_ID usado: {COS_ACCESS_KEY_ID}")
print(f"DEBUG: COS_SECRET_ACCESS_KEY usado: {COS_SECRET_ACCESS_KEY[:5]}... (ocultando el resto por seguridad)")
print(f"DEBUG: COS_ENDPOINT usado: {COS_ENDPOINT}")
print(f"DEBUG: COS_BUCKET_NAME usado: {COS_BUCKET_NAME}")
print(f"DEBUG: COS_REGION usado: {COS_REGION}")

cos_client = boto3.client(
    's3',
    aws_access_key_id=COS_ACCESS_KEY_ID,
    aws_secret_access_key=COS_SECRET_ACCESS_KEY,
    endpoint_url=COS_ENDPOINT,
    region_name=COS_REGION
)

# --- Función para cargar datos a COS ---
def load_to_cos(data_to_load: dict) -> dict:
    """
    Carga un objeto JSON al bucket de IBM Cloud Object Storage.
    """
    try:
        # Generar un nombre de archivo único
        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        file_name = f"processed_data_{timestamp}_{unique_id}.json"
        
        # Convertir el diccionario a una cadena JSON
        json_data = json.dumps(data_to_load, indent=2)
        
        # Subir el objeto al bucket
        cos_client.put_object(
            Bucket=COS_BUCKET_NAME,
            Key=file_name,
            Body=json_data,
            ContentType='application/json'
        )
        
        print(f"skill-datasetloader: Datos cargados exitosamente a {COS_BUCKET_NAME}/{file_name}")
        return {
            "status": "success",
            "message": "Datos cargados a COS exitosamente.",
            "file_name": file_name,
            "bucket": COS_BUCKET_NAME
        }
    except ClientError as e:
        error_message = f"Error al interactuar con IBM COS: {e}"
        print(f"skill-datasetloader: {error_message}")
        return {
            "statusCode": 400, # Mantener statusCode aquí para compatibilidad con el retorno original
            "body": {
                "status": "error",
                "message": error_message
            }
        }
    except Exception as e:
        error_message = f"Error inesperado al cargar datos a COS: {e}"
        print(f"skill-datasetloader: {error_message}")
        return {
            "statusCode": 500, # Usar 500 para errores inesperados
            "body": {
                "status": "error",
                "message": error_message
            }
        }

# --- Función principal para Cloud Functions (o uso local) ---
def main(args: dict) -> dict:
    """
    Función principal del skill-datasetloader.
    Recibe los datos procesados y los carga a IBM COS.
    """
    print("skill-datasetloader: Invocación iniciada.")
    
    # Simular datos procesados si no se proporcionan (para pruebas)
    if not args:
        print("skill-datasetloader: No se proporcionaron argumentos. Usando datos de ejemplo para prueba.")
        sample_data = {
            "id_lead": str(uuid.uuid4()),
            "nombre_normalizado": "Maria Lopez",
            "interes_normalizado": "Software de Gestion",
            "fecha_ingreso": datetime.datetime.now().isoformat(),
            "origen": "Web",
            "estado": "Procesado"
        }
        data_to_load = sample_data
    else:
        # Asumimos que 'args' contiene los datos a cargar
        data_to_load = args

    # Cargar datos a COS
    result = load_to_cos(data_to_load)
    
    # Aquí el retorno ya incluye statusCode y body, si load_to_cos se modificó para ello
    # Si load_to_cos devuelve solo status/message, ajusta aquí:
    if "statusCode" in result and "body" in result:
        return result
    else: # Si load_to_cos solo retorna {status, message, ...}
        status_code = 200 if result["status"] == "success" else 400
        print(f"skill-datasetloader: Invocación finalizada con estado {result['status']}.")
        return {
            "statusCode": status_code,
            "body": result
        }

# --- Ejecución de prueba local (COS) ---
if __name__ == "__main__":
    print("\n--- Ejecutando prueba local de skill-datasetloader (COS) ---")
    try:
        print("Conexión a IBM COS establecida (intentando...).")
        
        # Invocar la función main para simular la carga de datos
        test_result = main({}) # Pasa un diccionario vacío para que use datos de ejemplo
        
        print(json.dumps(test_result, indent=2))
        
    except Exception as e:
        print(f"Error general durante la prueba local: {e}")
    
    print("\n--- Fin de las pruebas de skill-datasetloader ---")