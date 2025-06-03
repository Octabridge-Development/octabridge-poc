// flows/flow-orchestratecore/main-flow.js
// OctaBridge v0.3 - Flow principal de orquestación completa
// Integra todos los skills desarrollados por el equipo

const axios = require('axios');
const config = require('./config.json');

// Configuración de endpoints de skills
const SKILLS_ENDPOINTS = {
  intakeBasic: 'http://localhost:3000/skill-intakebasic',
  nlpClassify: 'http://localhost:5000/classify',
  notifySlack: 'http://localhost:5001/notify',
  datasetLoader: 'http://localhost:3001/skill-datasetloader'
};

/**
 * Flujo principal de OctaBridge - Calificación completa de Lead
 * @param {Object} leadData - Datos del lead desde entrada (ManyChat, etc.)
 * @returns {Object} - Resultado completo del procesamiento
 */
async function octaBridgeMainFlow(leadData) {
  const flowResult = {
    lead_id: null,
    status: 'processing',
    steps: {
      intake: { status: 'pending', data: null, error: null },
      classification: { status: 'pending', data: null, error: null },
      notification: { status: 'pending', data: null, error: null },
      dataLoading: { status: 'pending', data: null, error: null }
    },
    final_result: null,
    timestamp: new Date().toISOString()
  };

  try {
    console.log('🚀 OctaBridge Flow iniciado:', leadData);

    // STEP 1: Intake y normalización de datos del lead
    try {
      console.log('📥 STEP 1: Procesando intake de lead...');
      const intakeResponse = await axios.post(SKILLS_ENDPOINTS.intakeBasic, leadData);

      if (intakeResponse.data.statusCode === 200) {
        flowResult.steps.intake.status = 'success';
        flowResult.steps.intake.data = intakeResponse.data.body;
        flowResult.lead_id = intakeResponse.data.body.lead_id;
        console.log('✅ Intake completado:', flowResult.lead_id);
      } else {
        throw new Error(`Intake falló: ${intakeResponse.data.body.message}`);
      }
    } catch (error) {
      flowResult.steps.intake.status = 'error';
      flowResult.steps.intake.error = error.message;
      throw new Error(`Intake failed: ${error.message}`);
    }

    // STEP 2: Clasificación NLP del interés del lead
    try {
      console.log('🧠 STEP 2: Clasificando interés del lead...');
      const classifyPayload = {
        text: flowResult.steps.intake.data.interes_normalizado
      };

      const classifyResponse = await axios.post(SKILLS_ENDPOINTS.nlpClassify, classifyPayload);
      flowResult.steps.classification.status = 'success';
      flowResult.steps.classification.data = classifyResponse.data;
      console.log('✅ Clasificación completada:', classifyResponse.data.category);
    } catch (error) {
      flowResult.steps.classification.status = 'error';
      flowResult.steps.classification.error = error.message;
      console.warn('⚠️ Clasificación falló, continuando con "general"');
      flowResult.steps.classification.data = { category: 'general' };
    }

    // STEP 3: Preparar datos enriquecidos para almacenamiento
    const enrichedLeadData = {
      ...flowResult.steps.intake.data,
      clasificacion_ia: flowResult.steps.classification.data.category,
      temperatura_lead: determineLeadTemperature(flowResult.steps.classification.data.category),
      score_preliminar: calculatePreliminaryScore(flowResult.steps.intake.data, flowResult.steps.classification.data.category)
    };

    // STEP 4: Cargar datos enriquecidos al almacén (watsonx.data)
    try {
      console.log('💾 STEP 4: Cargando datos enriquecidos...');
      const dataLoadResponse = await axios.post(SKILLS_ENDPOINTS.datasetLoader, enrichedLeadData);

      if (dataLoadResponse.data.statusCode === 200) {
        flowResult.steps.dataLoading.status = 'success';
        flowResult.steps.dataLoading.data = dataLoadResponse.data.body;
        console.log('✅ Datos cargados a watsonx.data');
      } else {
        throw new Error('Data loading failed');
      }
    } catch (error) {
      flowResult.steps.dataLoading.status = 'error';
      flowResult.steps.dataLoading.error = error.message;
      console.warn('⚠️ Carga de datos falló, continuando...');
    }

    // STEP 5: Notificación a Slack con resumen
    try {
      console.log('📢 STEP 5: Enviando notificación...');
      const notificationMessage = generateNotificationMessage(enrichedLeadData, flowResult);

      const notifyResponse = await axios.post(SKILLS_ENDPOINTS.notifySlack, {
        message: notificationMessage
      });

      flowResult.steps.notification.status = 'success';
      flowResult.steps.notification.data = notifyResponse.data;
      console.log('✅ Notificación enviada a Slack');
    } catch (error) {
      flowResult.steps.notification.status = 'error';
      flowResult.steps.notification.error = error.message;
      console.warn('⚠️ Notificación falló');
    }

    // Resultado final
    flowResult.status = 'completed';
    flowResult.final_result = {
      lead_processed: true,
      lead_id: flowResult.lead_id,
      classification: flowResult.steps.classification.data.category,
      temperature: enrichedLeadData.temperatura_lead,
      score: enrichedLeadData.score_preliminar,
      data_stored: flowResult.steps.dataLoading.status === 'success',
      notification_sent: flowResult.steps.notification.status === 'success'
    };

    console.log('🎉 OctaBridge Flow completado exitosamente');
    return flowResult;

  } catch (error) {
    flowResult.status = 'error';
    flowResult.final_result = {
      error: error.message,
      lead_processed: false
    };
    console.error('❌ OctaBridge Flow falló:', error.message);
    return flowResult;
  }
}

/**
 * Determina la temperatura del lead basado en clasificación
 */
function determineLeadTemperature(category) {
  const temperatureMap = {
    'urgente': 'CALIENTE',
    'venta': 'CALIENTE',
    'soporte': 'TEMPLADO',
    'consulta': 'TEMPLADO',
    'general': 'FRIO'
  };
  return temperatureMap[category] || 'FRIO';
}

/**
 * Calcula score preliminar del lead
 */
function calculatePreliminaryScore(leadData, category) {
  let baseScore = 50;

  // Puntuación por categoría
  const categoryScores = {
    'urgente': 20,
    'venta': 18,
    'soporte': 10,
    'consulta': 8,
    'general': 5
  };

  baseScore += categoryScores[category] || 0;

  // Bonificaciones por datos completos
  if (leadData.email_normalizado) baseScore += 15;
  if (leadData.telefono_normalizado) baseScore += 10;
  if (leadData.empresa_normalizada) baseScore += 8;
  if (leadData.fuente) baseScore += 5;

  return Math.min(baseScore, 100); // Máximo 100
}

/**
 * Genera mensaje de notificación para Slack
 */
function generateNotificationMessage(leadData, flowResult) {
  const emoji = {
    'CALIENTE': '🔥',
    'TEMPLADO': '🌡️',
    'FRIO': '❄️'
  };

  return `${emoji[leadData.temperatura_lead]} **Nuevo Lead Procesado** ${emoji[leadData.temperatura_lead]}
  
**Lead ID:** ${leadData.lead_id}
**Nombre:** ${leadData.nombre_normalizado}
**Empresa:** ${leadData.empresa_normalizada || 'No especificada'}
**Clasificación:** ${leadData.clasificacion_ia.toUpperCase()}
**Temperatura:** ${leadData.temperatura_lead}
**Score:** ${leadData.score_preliminar}/100
**Fuente:** ${leadData.fuente || 'Desconocida'}

**Estado del Procesamiento:**
✅ Intake: ${flowResult.steps.intake.status}
✅ Clasificación: ${flowResult.steps.classification.status}  
✅ Almacenamiento: ${flowResult.steps.dataLoading.status}

*Procesado por OctaBridge v0.3 - ${new Date().toLocaleString()}*`;
}

/**
 * Función de health check para el flow
 */
async function healthCheck() {
  const checks = {};

  for (const [skillName, endpoint] of Object.entries(SKILLS_ENDPOINTS)) {
    try {
      await axios.get(endpoint.replace(/\/[^\/]*$/, '/health'), { timeout: 2000 });
      checks[skillName] = 'healthy';
    } catch (error) {
      checks[skillName] = 'unavailable';
    }
  }

  return {
    flow_status: 'operational',
    skills_status: checks,
    timestamp: new Date().toISOString()
  };
}

// Exports para uso del módulo
module.exports = {
  octaBridgeMainFlow,
  healthCheck,
  SKILLS_ENDPOINTS
};

// Ejecución de prueba si se ejecuta directamente
if (require.main === module) {
  console.log('🧪 Ejecutando prueba del Flow OctaBridge...');

  const testLead = {
    nombre: "Maria Lopez",
    empresa: "Tech Solutions",
    interes: "Necesito urgentemente información sobre IA para automatizar mi negocio",
    contacto: {
      email: "maria.lopez@techsolutions.com",
      telefono: "+56912345678"
    },
    fuente: "Sitio Web"
  };

  octaBridgeMainFlow(testLead)
    .then(result => {
      console.log('\n📋 RESULTADO FINAL:');
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('❌ Error en prueba:', error);
    });
}