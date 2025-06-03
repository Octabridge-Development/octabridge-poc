// flows/flow-orchestratecore/error-handling.js
// Manejo centralizado de errores para OctaBridge Flow

/**
 * Tipos de errores del sistema
 */
const ERROR_TYPES = {
  SKILL_UNAVAILABLE: 'SKILL_UNAVAILABLE',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  DATA_PROCESSING_ERROR: 'DATA_PROCESSING_ERROR',
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
};

/**
 * Configuración de reintentos por tipo de error
 */
const RETRY_CONFIG = {
  [ERROR_TYPES.NETWORK_ERROR]: { maxRetries: 3, delay: 1000, backoff: 2 },
  [ERROR_TYPES.TIMEOUT_ERROR]: { maxRetries: 2, delay: 2000, backoff: 1.5 },
  [ERROR_TYPES.EXTERNAL_API_ERROR]: { maxRetries: 2, delay: 1500, backoff: 2 },
  [ERROR_TYPES.SKILL_UNAVAILABLE]: { maxRetries: 1, delay: 500, backoff: 1 },
  [ERROR_TYPES.VALIDATION_ERROR]: { maxRetries: 0, delay: 0, backoff: 1 },
  [ERROR_TYPES.DATA_PROCESSING_ERROR]: { maxRetries: 1, delay: 1000, backoff: 1 }
};

/**
 * Clasifica el tipo de error basado en el error original
 */
function classifyError(error, context = {}) {
  if (!error) return ERROR_TYPES.UNKNOWN_ERROR;

  const errorMessage = error.message || error.toString();
  const errorCode = error.code || error.status || error.response?.status;

  // Errores de red y timeout
  if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND' || errorCode === 'ECONNRESET') {
    return ERROR_TYPES.NETWORK_ERROR;
  }

  if (errorCode === 'ETIMEDOUT' || errorMessage.includes('timeout')) {
    return ERROR_TYPES.TIMEOUT_ERROR;
  }

  // Errores HTTP
  if (errorCode >= 500 && errorCode < 600) {
    return ERROR_TYPES.EXTERNAL_API_ERROR;
  }

  if (errorCode >= 400 && errorCode < 500) {
    return ERROR_TYPES.VALIDATION_ERROR;
  }

  // Errores específicos de skills
  if (errorMessage.includes('skill') || context.skillName) {
    return ERROR_TYPES.SKILL_UNAVAILABLE;
  }

  // Errores de procesamiento de datos
  if (errorMessage.includes('data') || errorMessage.includes('parsing') || errorMessage.includes('validation')) {
    return ERROR_TYPES.DATA_PROCESSING_ERROR;
  }

  return ERROR_TYPES.UNKNOWN_ERROR;
}

/**
 * Crea un error estructurado para el flow
 */
function createFlowError(originalError, context = {}) {
  const errorType = classifyError(originalError, context);
  const timestamp = new Date().toISOString();

  return {
    type: errorType,
    message: originalError.message || 'Error desconocido',
    original_error: originalError.toString(),
    context: context,
    timestamp: timestamp,
    retryable: RETRY_CONFIG[errorType]?.maxRetries > 0,
    retry_config: RETRY_CONFIG[errorType],
    correlation_id: context.correlationId || generateCorrelationId()
  };
}

/**
 * Ejecuta una función con reintentos automáticos
 */
async function executeWithRetry(fn, context = {}) {
  let lastError = null;
  const errorType = context.expectedErrorType || ERROR_TYPES.UNKNOWN_ERROR;
  const retryConfig = RETRY_CONFIG[errorType] || { maxRetries: 0, delay: 0, backoff: 1 };

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      const result = await fn();

      // Si llegamos aquí, la función fue exitosa
      if (attempt > 0) {
        console.log(`✅ Función exitosa después de ${attempt} reintentos`);
      }

      return result;
    } catch (error) {
      lastError = error;
      const classifiedError = createFlowError(error, {
        ...context,
        attempt: attempt + 1,
        maxAttempts: retryConfig.maxRetries + 1
      });

      console.warn(`⚠️ Intento ${attempt + 1}/${retryConfig.maxRetries + 1} falló:`, classifiedError.message);

      // Si es el último intento o el error no es reintentable, lanzar error
      if (attempt >= retryConfig.maxRetries || !classifiedError.retryable) {
        throw classifiedError;
      }

      // Esperar antes del siguiente intento
      const delay = retryConfig.delay * Math.pow(retryConfig.backoff, attempt);
      console.log(`⏱️ Esperando ${delay}ms antes del siguiente intento...`);
      await sleep(delay);
    }
  }

  // Esto no debería ejecutarse nunca, pero por seguridad
  throw createFlowError(lastError || new Error('Todos los reintentos fallaron'), context);
}

/**
 * Maneja errores de skills individuales
 */
function handleSkillError(error, skillName, stepName) {
  const flowError = createFlowError(error, {
    skillName,
    stepName,
    correlationId: generateCorrelationId()
  });

  console.error(`❌ Error en skill ${skillName} (step: ${stepName}):`, flowError);

  // Determinar si el error es crítico o se puede continuar
  const criticalErrors = [ERROR_TYPES.VALIDATION_ERROR];
  const isCritical = criticalErrors.includes(flowError.type);

  return {
    ...flowError,
    is_critical: isCritical,
    fallback_available: !isCritical,
    recovery_suggestions: getRecoverySuggestions(flowError.type, skillName)
  };
}

/**
 * Proporciona sugerencias de recuperación basadas en el tipo de error
 */
function getRecoverySuggestions(errorType, skillName) {
  const suggestions = {
    [ERROR_TYPES.SKILL_UNAVAILABLE]: [
      `Verificar que el skill ${skillName} esté ejecutándose`,
      'Revisar configuración de endpoints',
      'Implementar skill mock para continuar'
    ],
    [ERROR_TYPES.NETWORK_ERROR]: [
      'Verificar conectividad de red',
      'Revisar configuración de firewall',
      'Validar URLs de endpoints'
    ],
    [ERROR_TYPES.TIMEOUT_ERROR]: [
      'Incrementar timeout de conexión',
      'Verificar rendimiento del skill',
      'Implementar procesamiento asíncrono'
    ],
    [ERROR_TYPES.VALIDATION_ERROR]: [
      'Revisar estructura de datos de entrada',
      'Validar campos requeridos',
      'Verificar tipos de datos'
    ],
    [ERROR_TYPES.DATA_PROCESSING_ERROR]: [
      'Revisar formato de datos',
      'Verificar reglas de negocio',
      'Implementar validación adicional'
    ]
  };

  return suggestions[errorType] || ['Revisar logs para más detalles', 'Contactar soporte técnico'];
}

/**
 * Crea un resultado de fallback para skills que fallan
 */
function createFallbackResult(skillName, originalError) {
  const fallbacks = {
    'skill-nlpclassify': { category: 'general', confidence: 0.1 },
    'skill-notifyslack': { status: 'skipped', reason: 'notification_unavailable' },
    'skill-datasetloader': { status: 'cached_locally', location: 'temp_storage' }
  };

  return {
    fallback: true,
    skill: skillName,
    result: fallbacks[skillName] || { status: 'unavailable' },
    original_error: originalError.message,
    timestamp: new Date().toISOString()
  };
}

/**
 * Genera un ID de correlación único para rastrear errores
 */
function generateCorrelationId() {
  return `octa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Función helper para esperar
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Registra errores para monitoreo
 */
function logError(error, context = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: error.is_critical ? 'CRITICAL' : 'WARNING',
    error_type: error.type,
    message: error.message,
    context: context,
    correlation_id: error.correlation_id
  };

  // En producción, esto debería ir a un sistema de logging centralizado
  console.error('🚨 FLOW ERROR LOG:', JSON.stringify(logEntry, null, 2));

  return logEntry;
}

/**
 * Middleware para capturar errores no manejados en el flow
 */
function createErrorMiddleware() {
  return {
    // Captura errores síncronos
    catchSync: (fn) => {
      return (...args) => {
        try {
          return fn(...args);
        } catch (error) {
          const flowError = createFlowError(error, {
            function: fn.name,
            args: args.length
          });
          logError(flowError);
          throw flowError;
        }
      };
    },

    // Captura errores asíncronos
    catchAsync: (fn) => {
      return async (...args) => {
        try {
          return await fn(...args);
        } catch (error) {
          const flowError = createFlowError(error, {
            function: fn.name,
            args: args.length
          });
          logError(flowError);
          throw flowError;
        }
      };
    }
  };
}

/**
 * Validador de entrada para el flow principal
 */
function validateFlowInput(inputData) {
  const errors = [];

  // Validaciones básicas
  if (!inputData || typeof inputData !== 'object') {
    errors.push('Input debe ser un objeto válido');
  }

  if (!inputData.nombre || typeof inputData.nombre !== 'string' || inputData.nombre.trim().length < 2) {
    errors.push('Campo "nombre" es requerido y debe tener al menos 2 caracteres');
  }

  if (!inputData.interes || typeof inputData.interes !== 'string' || inputData.interes.trim().length < 5) {
    errors.push('Campo "interes" es requerido y debe tener al menos 5 caracteres');
  }

  // Validación de contacto
  if (inputData.contacto) {
    if (inputData.contacto.email && !isValidEmail(inputData.contacto.email)) {
      errors.push('Email no tiene formato válido');
    }

    if (inputData.contacto.telefono && !isValidPhone(inputData.contacto.telefono)) {
      errors.push('Teléfono no tiene formato válido');
    }
  }

  if (errors.length > 0) {
    const validationError = new Error(`Errores de validación: ${errors.join(', ')}`);
    validationError.type = ERROR_TYPES.VALIDATION_ERROR;
    validationError.errors = errors;
    throw validationError;
  }

  return true;
}

/**
 * Helpers de validación
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone) {
  // Acepta formatos: +56912345678, 912345678, +1-555-123-4567, etc.
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,15}$/;
  return phoneRegex.test(phone);
}

/**
 * Crea un resumen de errores para el resultado final del flow
 */
function createErrorSummary(errors) {
  const errorsByType = {};
  let criticalCount = 0;
  let warningCount = 0;

  errors.forEach(error => {
    const type = error.type || ERROR_TYPES.UNKNOWN_ERROR;
    if (!errorsByType[type]) {
      errorsByType[type] = [];
    }
    errorsByType[type].push(error);

    if (error.is_critical) {
      criticalCount++;
    } else {
      warningCount++;
    }
  });

  return {
    total_errors: errors.length,
    critical_errors: criticalCount,
    warnings: warningCount,
    errors_by_type: errorsByType,
    has_critical: criticalCount > 0,
    flow_can_continue: criticalCount === 0,
    timestamp: new Date().toISOString()
  };
}

/**
 * Manejo de circuit breaker para skills que fallan repetidamente
 */
class CircuitBreaker {
  constructor(skillName, options = {}) {
    this.skillName = skillName;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minuto
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  async execute(fn) {
    // Si el circuit está abierto, verificar si es tiempo de probar de nuevo
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
        console.log(`🔄 Circuit breaker para ${this.skillName} en modo HALF_OPEN`);
      } else {
        throw createFlowError(
          new Error(`Circuit breaker OPEN para ${this.skillName}`),
          { skillName: this.skillName, circuitState: this.state }
        );
      }
    }

    try {
      const result = await fn();

      // Si la función fue exitosa, resetear el circuit breaker
      if (this.state === 'HALF_OPEN') {
        this.reset();
        console.log(`✅ Circuit breaker para ${this.skillName} restablecido`);
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      console.warn(`🚨 Circuit breaker para ${this.skillName} se abrió (${this.failureCount} fallos)`);
    }
  }

  reset() {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.lastFailureTime = null;
  }

  getStatus() {
    return {
      skillName: this.skillName,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      isAvailable: this.state !== 'OPEN'
    };
  }
}

/**
 * Manager global de circuit breakers para todos los skills
 */
class CircuitBreakerManager {
  constructor() {
    this.breakers = new Map();
  }

  getBreaker(skillName) {
    if (!this.breakers.has(skillName)) {
      this.breakers.set(skillName, new CircuitBreaker(skillName));
    }
    return this.breakers.get(skillName);
  }

  executeWithBreaker(skillName, fn) {
    const breaker = this.getBreaker(skillName);
    return breaker.execute(fn);
  }

  getAllStatus() {
    const status = {};
    this.breakers.forEach((breaker, skillName) => {
      status[skillName] = breaker.getStatus();
    });
    return status;
  }

  resetAll() {
    this.breakers.forEach(breaker => breaker.reset());
    console.log('🔄 Todos los circuit breakers han sido restablecidos');
  }
}

// Instancia global del manager
const circuitBreakerManager = new CircuitBreakerManager();

module.exports = {
  ERROR_TYPES,
  RETRY_CONFIG,
  classifyError,
  createFlowError,
  executeWithRetry,
  handleSkillError,
  getRecoverySuggestions,
  createFallbackResult,
  generateCorrelationId,
  logError,
  createErrorMiddleware,
  validateFlowInput,
  createErrorSummary,
  CircuitBreaker,
  CircuitBreakerManager,
  circuitBreakerManager
};