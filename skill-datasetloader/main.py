# main.py

from models import ProcessedLeadData
from typing import Dict, Any
import json

def load_to_watsonx_data(data: Dict[str, Any]) -> Dict[str, Any]:
    try:
        # Simula la creación del objeto desde los datos recibidos
        lead = ProcessedLeadData(**data)

        # Aquí iría la lógica real de conexión a watsonx.data
        # Por ahora simulamos persistencia
        print(f"[MOCK] Persistiendo en watsonx.data: {json.dumps(lead.__dict__, indent=2)}")

        return {
            "status": "success",
            "message": f"Lead {lead.lead_id} guardado exitosamente.",
            "data": lead.__dict__
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Error al guardar el lead: {str(e)}"
        }

# Compatible con IBM Cloud Functions
def main(args: Dict[str, Any]) -> Dict[str, Any]:
    print("skill-datasetloader: Invocación iniciada.")
    result = load_to_watsonx_data(args)
    return {
        "statusCode": 200 if result["status"] == "success" else 400,
        "body": result
    }

# Pruebas locales
if __name__ == "__main__":
    print("\n--- Ejecutando prueba local de datasetloader ---")

    sample_processed_data = {
        "nombre_normalizado": "Maria Lopez",
        "interes_normalizado": "Soluciones en la nube",
        "empresa_normalizada": "Tech Solutions",
        "email_normalizado": "maria.lopez@example.com",
        "telefono_normalizado": "56912345678",
        "fuente": "Sitio Web",
        "status": "success",
        "message": "Lead procesado exitosamente."
    }

    response = main(sample_processed_data)
    print(json.dumps(response, indent=2))
