# --- Indicador de inicio de ejecución ---
print("--- Iniciando ejecución de skill-intakebasic/main.py ---")

import re
import json
import datetime
from typing import Optional

# Importa los modelos definidos en models.py
# Asegúrate de que models.py esté en la misma carpeta o en el PYTHONPATH
try:
    from models import LeadIntakeRequest, ContactInfo, ProcessedLeadData
except ImportError:
    print("Error: No se pudo importar 'models.py'. Asegúrate de que esté en la misma carpeta.")
    # En un entorno real, aquí podrías salir o lanzar una excepción más robusta
    exit(1) # Salir si no se pueden cargar los modelos


def normalize_string(text: Optional[str]) -> Optional[str]:
    """Normaliza un texto: elimina espacios extra y convierte la primera letra de cada palabra a mayúscula."""
    if not text:
        return None
    # Primero, eliminar espacios en blanco al inicio y final
    normalized = text.strip()
    # Convertir la primera letra de cada palabra a mayúscula (formato de título)
    return normalized.title()

def normalize_email(email: Optional[str]) -> Optional[str]:
    """Normaliza un email: a minúsculas y elimina espacios extra."""
    return email.strip().lower() if email else None

def normalize_phone_number(phone_number: Optional[str]) -> Optional[str]:
    """Normaliza un número de teléfono: elimina todo lo que no sea dígito."""
    if not phone_number:
        return None
    return re.sub(r'\D', '', phone_number) # Elimina todo lo que no sea dígito

def process_lead_request(request_data: dict) -> dict:
    """
    Procesa la solicitud de un lead, valida y normaliza los datos.
    Esta función es el núcleo de la lógica del skill.
    """
    # Inicializa el objeto de datos procesados con un estado de error por defecto
    # Esto asegura que siempre haya un objeto de respuesta, incluso en caso de fallos iniciales.
    processed_data = ProcessedLeadData(
        nombre_normalizado="", # Inicializa para evitar None en la salida JSON en caso de error
        interes_normalizado="",
        status="error",
        message="Error desconocido durante el procesamiento."
    )

    try:
        # 1. Validar y parsear la entrada usando el modelo
        # Intentamos construir los objetos de modelo a partir del diccionario de entrada.
        # Esto nos ayudará a atrapar errores de formato tempranamente.
        contact_info = None
        if request_data.get('contacto'):
            contact_info = ContactInfo(
                email=request_data['contacto'].get('email'),
                telefono=request_data['contacto'].get('telefono')
            )

        # Usamos try-except para manejar casos donde 'nombre' o 'interes' pudieran faltar en la entrada
        # antes de la validación explícita, que daría un TypeError en dataclasses.
        _nombre = request_data.get('nombre')
        _interes = request_data.get('interes')

        lead_request = LeadIntakeRequest(
            nombre=_nombre if _nombre is not None else "", # Provee un string vacío si es None para el constructor
            interes=_interes if _interes is not None else "", # Provee un string vacío si es None para el constructor
            empresa=request_data.get('empresa'),
            contacto=contact_info,
            fuente=request_data.get('fuente')
        )

        # 2. Validación de campos requeridos (ahora sí, con los datos ya en el objeto LeadIntakeRequest)
        if not lead_request.nombre or not lead_request.interes:
            processed_data.message = "Datos de entrada incompletos: 'nombre' y 'interes' son campos obligatorios."
            return processed_data.__dict__ # Convierte dataclass a dict para la salida JSON

        # 3. Normalización de Datos
        processed_data.nombre_normalizado = normalize_string(lead_request.nombre)
        processed_data.empresa_normalizada = normalize_string(lead_request.empresa)
        processed_data.interes_normalizado = normalize_string(lead_request.interes)
        processed_data.fuente = normalize_string(lead_request.fuente)

        if lead_request.contacto:
            processed_data.email_normalizado = normalize_email(lead_request.contacto.email)
            processed_data.telefono_normalizado = normalize_phone_number(lead_request.contacto.telefono)

        # 4. Asignar status de éxito
        processed_data.status = "success"
        processed_data.message = "Lead procesado exitosamente."

        # Retorna el objeto de datos procesados como un diccionario
        return processed_data.__dict__

    except Exception as e:
        # Captura cualquier otra excepción durante el procesamiento
        print(f"Error inesperado en process_lead_request: {e}")
        processed_data.status = "error"
        processed_data.message = f"Error interno del skill: {str(e)}"
        return processed_data.__dict__

# --- Punto de entrada para IBM Cloud Functions (o similares plataformas serverless) ---
# Esta función es el punto de entrada principal cuando el skill se invoca como una función serverless.
# 'args' es un diccionario que contiene el payload de entrada (JSON).
def main(args):
    """
    Punto de entrada principal para IBM Cloud Functions.
    Procesa los argumentos de entrada y devuelve una respuesta estructurada.
    """
    print("skill-intakebasic (Cloud Function): Invocada con argumentos.")
    response_data = process_lead_request(args)

    # Las Cloud Functions suelen esperar un diccionario con 'statusCode' y 'body'
    status_code = 200 if response_data.get("status") == "success" else 400
    return {
        "statusCode": status_code,
        "body": response_data # El cuerpo de la respuesta es el diccionario con los datos procesados
    }

# --- Ejecución local para pruebas ---
# Este bloque solo se ejecuta cuando el script se corre directamente (ej. python main.py)
if __name__ == "__main__":
    print("\n--- Ejecutando pruebas locales de skill-intakebasic ---")

    # --- Prueba 1: Solicitud de lead válida ---
    print("\n--- Prueba 1: Solicitud de lead válida ---")
    sample_request_valid = {
        "nombre": "  Maria Lopez ",
        "empresa": "Tech Solutions  ",
        "interes": "  Quiero info sobre IA para mi negocio ",
        "contacto": {
            "email": "  maria.lopez@example.com ",
            "telefono": " +569 1234 5678 "
        },
        "fuente": "Sitio Web"
    }
    processed_output_valid = process_lead_request(sample_request_valid)
    print(json.dumps(processed_output_valid, indent=2))

    # --- Prueba 2: Solicitud con campos faltantes (error esperado) ---
    print("\n--- Prueba 2: Solicitud con campos faltantes (error esperado) ---")
    sample_request_error_missing = {
        "empresa": "Invalid Co",
        "contacto": {
            "email": "test@error.com"
        }
        # Faltan 'nombre' e 'interes' que son obligatorios
    }
    processed_output_error = process_lead_request(sample_request_error_missing)
    print(json.dumps(processed_output_error, indent=2))

    # --- Prueba 3: Solicitud mínima válida ---
    print("\n--- Prueba 3: Solicitud mínima válida ---")
    sample_request_minimal = {
        "nombre": "Pedro",
        "interes": "Consulta general"
    }
    processed_output_minimal = process_lead_request(sample_request_minimal)
    print(json.dumps(processed_output_minimal, indent=2))

    # --- Simulando invocación de Cloud Function con una solicitud válida ---
    print("\n--- Simulando invocación de Cloud Function (EXITO) ---")
    cloud_function_response_success = main(sample_request_valid)
    print(json.dumps(cloud_function_response_success, indent=2))

    # --- Simulando invocación de Cloud Function con una solicitud con error ---
    print("\n--- Simulando invocación de Cloud Function (ERROR) ---")
    cloud_function_response_error = main(sample_request_error_missing)
    print(json.dumps(cloud_function_response_error, indent=2))

    print("\n--- Fin de las pruebas de main.py ---")