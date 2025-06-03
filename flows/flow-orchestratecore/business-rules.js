// flows/flow-orchestratecore/business-rules.js
// Reglas de negocio para el calificador de leads OctaBridge

/**
 * Configuración de reglas de negocio para calificación de leads
 */
const BUSINESS_RULES = {
  // Mapeo de clasificaciones NLP a temperaturas de lead
  TEMPERATURE_MAPPING: {
    'urgente': { temp: 'CALIENTE', priority: 1, followUp: 'immediate' },
    'venta': { temp: 'CALIENTE', priority: 1, followUp: 'immediate' },
    'soporte': { temp: 'TEMPLADO', priority: 2, followUp: '24h' },
    'consulta': { temp: 'TEMPLADO', priority: 2, followUp: '48h' },
    'general': { temp: 'FRIO', priority: 3, followUp: '7d' }
  },

  // Scoring basado en características del lead
  SCORING_WEIGHTS: {
    classification: {
      'urgente': 25,
      'venta': 20,
      'soporte': 15,
      'consulta': 12,
      'general': 8
    },
    completeness: {
      email: 15,
      phone: 12,
      company: 10,
      source: 8
    },
    engagement: {
      repeat_visitor: 20,
      form_completion: 15,
      time_spent: 10
    }
  },

  // Umbrales para segmentación
  SCORE_THRESHOLDS: {
    HOT: 75,      // >= 75: Lead caliente
    WARM: 50,     // 50-74: Lead templado
    COLD: 0       // < 50: Lead frío
  },

  // Configuración de notificaciones
  NOTIFICATION_RULES: {
    CALIENTE: {
      channels: ['slack', 'email', 'sms'],
      urgency: 'high',
      assignee: 'sales_team',
      sla_response: '15m'
    },
    TEMPLADO: {
      channels: ['slack', 'email'],
      urgency: 'medium',
      assignee: 'marketing_team',
      sla_response: '2h'
    },
    FRIO: {
      channels: ['slack'],
      urgency: 'low',
      assignee: 'nurturing_team',
      sla_response: '24h'
    }
  }
};

/**
 * Evalúa la completitud de datos del lead
 */
function evaluateDataCompleteness(leadData) {
  const fields = {
    nombre_normalizado: !!leadData.nombre_normalizado,
    email_normalizado: !!leadData.email_normalizado,
    telefono_normalizado: !!leadData.telefono_normalizado,
    empresa_normalizada: !!leadData.empresa_normalizada,
    interes_normalizado: !!leadData.interes_normalizado,
    fuente: !!leadData.fuente
  };

  const totalFields = Object.keys(fields).length;
  const completedFields = Object.values(fields).filter(Boolean).length;

  return {
    fields,
    completeness_ratio: completedFields / totalFields,
    completeness_score: Math.round((completedFields / totalFields) * 100),
    missing_fields: Object.keys(fields).filter(key => !fields[key])
  };
}

/**
 * Calcula el score final del lead
 */
function calculateLeadScore(leadData, classification) {
  let totalScore = 0;
  const scoreBreakdown = {};

  // Score por clasificación
  const classificationScore = BUSINESS_RULES.SCORING_WEIGHTS.classification[classification] || 0;
  totalScore += classificationScore;
  scoreBreakdown.classification = classificationScore;

  // Score por completitud de datos
  const completeness = evaluateDataCompleteness(leadData);
  let completenessScore = 0;

  if (leadData.email_normalizado) completenessScore += BUSINESS_RULES.SCORING_WEIGHTS.completeness.email;
  if (leadData.telefono_normalizado) completenessScore += BUSINESS_RULES.SCORING_WEIGHTS.completeness.phone;
  if (leadData.empresa_normalizada) completenessScore += BUSINESS_RULES.SCORING_WEIGHTS.completeness.company;
  if (leadData.fuente) completenessScore += BUSINESS_RULES.SCORING_WEIGHTS.completeness.source;

  totalScore += completenessScore;
  scoreBreakdown.completeness = completenessScore;

  // Score base mínimo
  const baseScore = 20;
  totalScore += baseScore;
  scoreBreakdown.base = baseScore;

  return {
    total_score: Math.min(totalScore, 100),
    breakdown: scoreBreakdown,
    completeness
  };
}

/**
 * Determina la temperatura del lead
 */
function determineLeadTemperature(score) {
  if (score >= BUSINESS_RULES.SCORE_THRESHOLDS.HOT) {
    return 'CALIENTE';
  } else if (score >= BUSINESS_RULES.SCORE_THRESHOLDS.WARM) {
    return 'TEMPLADO';
  } else {
    return 'FRIO';
  }
}

/**
 * Obtiene reglas de notificación para una temperatura
 */
function getNotificationRules(temperature) {
  return BUSINESS_RULES.NOTIFICATION_RULES[temperature] || BUSINESS_RULES.NOTIFICATION_RULES.FRIO;
}

/**
 * Valida si un lead cumple criterios mínimos de calidad
 */
function validateLeadQuality(leadData) {
  const validations = {
    has_name: !!leadData.nombre_normalizado,
    has_interest: !!leadData.interes_normalizado,
    has_contact: !!(leadData.email_normalizado || leadData.telefono_normalizado),
    interest_length: leadData.interes_normalizado ? leadData.interes_normalizado.length >= 10 : false
  };

  const isValid = Object.values(validations).every(Boolean);

  return {
    is_valid: isValid,
    validations,
    quality_score: Object.values(validations).filter(Boolean).length / Object.keys(validations).length * 100
  };
}

/**
 * Función principal que procesa todas las reglas de negocio
 */
function processBusinessRules(leadData, classification) {
  // Validar calidad del lead
  const quality = validateLeadQuality(leadData);

  if (!quality.is_valid) {
    return {
      success: false,
      error: 'Lead no cumple criterios mínimos de calidad',
      quality
    };
  }

  // Calcular score
  const scoring = calculateLeadScore(leadData, classification);

  // Determinar temperatura
  const temperature = determineLeadTemperature(scoring.total_score);

  // Obtener reglas de notificación
  const notificationRules = getNotificationRules(temperature);

  return {
    success: true,
    lead_score: scoring.total_score,
    temperature,
    priority: BUSINESS_RULES.TEMPERATURE_MAPPING[classification]?.priority || 3,
    follow_up: BUSINESS_RULES.TEMPERATURE_MAPPING[classification]?.followUp || '7d',
    notification_rules: notificationRules,
    scoring_breakdown: scoring.breakdown,
    data_completeness: scoring.completeness,
    quality_assessment: quality
  };
}

module.exports = {
  BUSINESS_RULES,
  evaluateDataCompleteness,
  calculateLeadScore,
  determineLeadTemperature,
  getNotificationRules,
  validateLeadQuality,
  processBusinessRules
};