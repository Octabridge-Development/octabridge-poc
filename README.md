# OctaBridge Flow Orchestrate Core v0.3

> **Flow principal de orquestación para el sistema de calificación de leads con IA**

## 🎯 Propósito

Este flow es el **cerebro central** de OctaBridge que orquesta todos los skills desarrollados por el equipo:
- Coordina la ejecución secuencial de skills Python
- Maneja errores y reintentos automáticamente  
- Integra con IBM Watson Assistant y watsonx Orchestrate
- Proporciona monitoring y health checks en tiempo real

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   ManyChat      │────│ Watson Assistant │────│ Flow Orchestrate│
│   WhatsApp      │    │                  │    │     Core        │
│   Web Forms     │    └──────────────────┘    └─────────┬───────┘
└─────────────────┘                                      │
                                                         │
       ┌─────────────────────────────────────────────────┼─────────────────────────────────────────────────┐
       │                                                 │                                                 │
       ▼                          ▼                      ▼                          ▼
┌──────────────┐          ┌──────────────┐        ┌──────────────┐          ┌──────────────┐
│skill-intake  │          │skill-nlp     │        │skill-dataset │          │skill-notify  │un video
│basic         │          │classify      │        │loader        │          │slack         │
│(Python)      │          │(Python)      │        │(Python)      │          │(Python)      │
│              │          │              │        │              │          │              │
│Normaliza     │          │Clasifica     │        │Almacena en   │          │Notifica a    │
│datos lead    │          │con IA        │        │watsonx.data  │          │Slack         │
└──────────────┘          └──────────────┘        └──────────────┘          └──────────────┘
```

## 🚀 Inicio Rápido

### 1. Instalación

```bash
cd flows/flow-orchestratecore
npm install
```

### 2. Configuración

```bash
# Copiar variables de entorno
cp .env.example.example .env.example

# Editar con tus credenciales IBM
nano .env.example
```

### 3. Ejecutar

```bash
# Modo desarrollo
npm run dev

# Modo producción  
npm start

# Ejecutar pruebas
npm test

# Health check
npm run health
```

## 📋 Funcionalidades Principales

### ✅ Procesamiento Completo de Lead
- **Intake & Normalización**: Limpia y estructura datos del lead
- **Clasificación IA**: Categoriza el interés usando NLP
- **Scoring Inteligente**: Calcula temperatura (FRÍO/TEMPLADO/CALIENTE)
- **Almacenamiento**: Guarda en watsonx.data para análisis
- **Notificación**: Alerta automática vía Slack

### ✅ Manejo Robusto de Errores
- **Reintentos automáticos** con backoff exponencial
- **Circuit breakers** para skills que fallan repetidamente
- **Fallbacks** para continuar aunque un skill falle
- **Logging estructurado** con correlation IDs

### ✅ Integración Watson
- **Watson Assistant**: Respuestas contextuales automáticas
- **watsonx Orchestrate**: Registro y ejecución de flows
- **Monitoring**: Observabilidad completa del proceso

### ✅ Health Monitoring
- **Health checks automáticos** cada 30 segundos
- **Alertas críticas** vía Slack
- **Métricas de performance** en tiempo real
- **Circuit breaker status** por skill

## 🔧 Configuración Avanzada

### Variables de Entorno Clave

| Variable | Descripción | Requerido |
|----------|-------------|-----------|
| `IBM_CLOUD_API_KEY` | API Key de IBM Cloud | ✅ |
| `IBM_CLOUD_REGION` | Región (us-south) | ✅ |
| `OCTABRIDGE_SLACK_WEBHOOK_URL` | Webhook Slack | ✅ |
| `NODE_ENV` | Entorno (development/production) | ❌ |

### Configuración de Skills

En `config.json`:

```json
{
  "skills": {
    "skill-intakebasic": {
      "endpoint": "http://localhost:3000/skill-intakebasic",
      "timeout": 5000,
      "retries": 2
    }
  }
}
```

## 🧪 Testing

### Ejecutar Suite Completa
```bash
npm test
```

### Tests Disponibles
- ✅ **Health Check**: Verifica que todos los skills respondan
- ✅ **Watson Integration**: Valida conexión con servicios IBM  
- ✅ **Lead Processing**: Procesa leads de prueba
- ✅ **Error Handling**: Valida manejo de errores
- ✅ **Performance**: Mide tiempos de respuesta

### Casos de Prueba
```javascript
// Lead completo (debería ser CALIENTE)
{
  "nombre": "María González",
  "empresa": "Tech Solutions",
  "interes": "Necesito urgentemente IA para ventas",
  "contacto": {
    "email": "maria@techsolutions.cl",
    "telefono": "+56912345678"
  }
}
```

## 📊 Monitoring

### Health Check Manual
```bash
npm run health
```

### Monitor Continuo
```javascript
const { systemMonitor } = require('./health-check');

// Iniciar monitoring automático
systemMonitor.start();

// Ver status
console.log(systemMonitor.getStatus());
```

### Métricas Clave
- **Response Time**: < 200ms objetivo
- **Success Rate**: > 95% objetivo  
- **Skills Health**: 4/4 skills funcionando
- **Error Rate**: < 1% objetivo

## 🔄 Flujo de Datos

### Input (Lead Crudo)
```json
{
  "nombre": "Juan Pérez",
  "interes": "Quiero información sobre IA",
  "contacto": { "email": "juan@empresa.com" }
}
```

### Output (Lead Procesado)
```json
{
  "lead_id": "uuid-generated",
  "status": "completed", 
  "final_result": {
    "lead_processed": true,
    "classification": "consulta",
    "temperature": "TEMPLADO",
    "score": 65,
    "data_stored": true,
    "notification_sent": true
  }
}
```

## 🚨 Troubleshooting

### Errores Frecuentes

**❌ Skills no responden**
```bash
# Verificar que skills estén corriendo
npm run health

# Revisar endpoints en config.json
```

**❌ Watson integration falla**
```bash
# Verificar credenciales IBM
echo $IBM_CLOUD_API_KEY

# Verificar región
echo $IBM_CLOUD_REGION
```

**❌ Notificaciones Slack fallan**
```bash
# Verificar webhook URL
echo $OCTABRIDGE_SLACK_WEBHOOK_URL
```

### Logs y Debugging

```bash
# Habilitar logs verbose
export DEBUG_MODE=true
export VERBOSE_LOGGING=true

# Ejecutar con logs
npm run dev
```

## 📈 Performance

### Benchmarks (Objetivo)
- **Latencia P95**: < 200ms
- **Throughput**: 100 leads/min
- **Error Rate**: < 1%
- **Availability**: 99.9%

### Optimizaciones
- **Connection pooling** para HTTP requests
- **Circuit breakers** para skills problemáticos
- **Retry with backoff** para fallos transitorios
- **Caching** de clasificaciones NLP frecuentes

## 🔐 Seguridad

### Desarrollo
- Logs detallados para debugging
- CORS habilitado para desarrollo local
- Health checks públicos

### Producción
- Encriptación de payloads sensibles
- Audit logging completo
- Rate limiting por IP
- Secrets en IBM Cloud Secrets Manager

## 📝 Desarrollo

### Agregar Nuevo Skill

1. **Registrar en config.json**:
```json
{
  "skills": {
    "skill-nuevo": {
      "endpoint": "http://localhost:3002/skill-nuevo",
      "timeout": 5000,
      "retries": 2
    }
  }
}
```

2. **Agregar al flow principal**:
```javascript
// En main-flow.js
const newSkillResponse = await axios.post(SKILLS_ENDPOINTS.skillNuevo, data);
```

3. **Agregar health check**:
```javascript  
// Automático - se agrega al SKILLS_ENDPOINTS
```

### Estructura de Respuesta de Skills

Todos los skills deben seguir este formato:

```json
{
  "statusCode": 200,
  "body": {
    "status": "success|error",
    "message": "Descripción del resultado",
    "data": { /* resultado específico del skill */ }
  }
}
```

## 🤝 Contribuir

### Equipo Actual
- **Julio Asillo** (Tech Lead) - Flow orchestration & architecture
- **Felipe López** (Data Engineer) - NLP & notifications skills  
- **Belfort Aburto** (Data Engineer) - Data intake & loading skills
- **Willy Hierro** (PM) - Project coordination & strategy

### Sprint Actual (Sprint 1)
- ✅ Setup inicial completado
- 🔄 Construcción PoC en progreso
- 🎯 **Entrega**: 1 junio 2025

## 📞 Soporte

- **Slack**: #octabridge-dev
- **Email**: julio.asillo@multitudine.pe  
- **Escalation**: willy.hierro@multitudine.pe

---

**OctaBridge Flow v0.3** - *Powering intelligent lead qualification with IBM Watson* 🚀