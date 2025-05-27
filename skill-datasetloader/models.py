# models.py

from dataclasses import dataclass, field
from typing import Optional
import uuid
import datetime

@dataclass
class ProcessedLeadData:
    nombre_normalizado: str
    interes_normalizado: str
    lead_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    empresa_normalizada: Optional[str] = None
    email_normalizado: Optional[str] = None
    telefono_normalizado: Optional[str] = None
    fuente: Optional[str] = None
    fecha_ingreso: str = field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())
    status: str = "error"
    message: Optional[str] = None
