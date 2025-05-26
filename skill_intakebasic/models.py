from dataclasses import dataclass, field
from typing import Optional
import uuid
import datetime

@dataclass
class ContactInfo:
    """Modelo para la información de contacto del lead."""
    email: Optional[str] = None
    telefono: Optional[str] = None

@dataclass
class LeadIntakeRequest:
    """Modelo para la estructura de la solicitud de entrada del lead."""
    # Los argumentos sin valor por defecto (obligatorios) deben ir primero
    nombre: str
    interes: str
    # Luego los argumentos con valor por defecto (opcionales)
    empresa: Optional[str] = None
    contacto: Optional[ContactInfo] = None
    fuente: Optional[str] = None

@dataclass
class ProcessedLeadData:
    """Modelo para los datos del lead después de ser procesados por el skill."""
    # Los argumentos sin valor por defecto (obligatorios) deben ir primero
    nombre_normalizado: str
    interes_normalizado: str

    # Luego los argumentos con valor por defecto
    lead_id: str = field(default_factory=lambda: str(uuid.uuid4())) # Genera UUID por defecto
    empresa_normalizada: Optional[str] = None
    email_normalizado: Optional[str] = None
    telefono_normalizado: Optional[str] = None
    fuente: Optional[str] = None
    fecha_ingreso: str = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    status: str = "error" # Puede ser "success" o "error"
    message: Optional[str] = None # Mensaje descriptivo del resultado