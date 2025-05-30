// flows/flow-orchestratecore/watson-integration.js
// Integración con IBM Watson Assistant y watsonx Orchestrate

const { createFlowError, ERROR_TYPES } = require('./error-handling');

/**
 * Configuración de Watson Assistant
 */
const WATSON_CONFIG = {
  assistant: {
    apikey: process.env.IBM_CLOUD_API_KEY,
    version: '2021-06-14',
    url: process.env.IBM_WATSON_ASSISTANT_URL || 'https://api.us-south.assistant.watson.cloud.ibm.com',
    assistant_id: process.env.IBM_WATSON_ASSISTANT_ID
  },
  orchestrate: {
    instance: process.env.IBM_CLOUD_WATSONX_ORCHESTRATE_INSTANCE || 'watsonx Orchestrate-10',
    resource_group: process.env.IBM_CLOUD_RESOURCE_GROUP || 'Default',
    region: process.env.IBM_CLOUD_REGION || 'us-south'
  }
};

/**
 * Cliente para Watson Assistant
 */
class WatsonAssistantClient {
  constructor() {
    this.sessionId = null;
    this.initialized = false;
  }

  /**
   * Inicializa una sesión con Watson Assistant
   */
  async initializeSession() {
    try {
      console.log('🤖 Inicializando sesión con Watson Assistant...');

      // En un entorno real, aquí usarías el SDK de Watson
      // const AssistantV2 = require('ibm-watson/assistant/v2');
      // const { IamAuthenticator } = require('ibm-watson/auth');

      // Por ahora, simulamos la inicialización
      this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      this.initialized = true;

      console.log('✅ Sesión Watson Assistant inicializada:', this.sessionId);
      return this.sessionId;
    } catch (error) {
      throw createFlowError(error, {
        service: 'watson_assistant',
        operation: 'initialize_session'
      });
    }
  }

  /**
   * Envía mensaje a Watson Assistant
   */
  async sendMessage(message, context = {}) {
    if (!this.initialized) {
      await this.initializeSession();
    }

    try {
      console.log('💬 Enviando mensaje a Watson Assistant:', message);

      // Simular respuesta de Watson Assistant
      // En producción, aquí harías la llamada real al API
      const response = {
        result: {
          output: {
            generic: [{
              response_type: 'text',
              text: this.generateContextualResponse(message, context)
            }],
            intents: this.detectIntents(message),
            entities: this.extractEntities(message)
          }
        }
      };

      console.log('✅ Respuesta de Watson Assistant recibida');
      return response.result;
    } catch (error) {
      throw createFlowError(error, {
        service: 'watson_assistant',
        operation: 'send_message',
        sessionId: this.sessionId
      });
    }
  }

  /**
   * Genera respuesta contextual basada en el lead procesado
   */
  generateContextualResponse(message, context) {
    const { leadData, classification, temperature } = context;

    const responses = {
      'CALIENTE': `¡Perfecto! He clasificado tu consulta como ${classification} con alta prioridad. Un especialista te contactará en los próximos 15 minutos.`,
      'TEMPLADO': `Gracias por tu interés en ${classification}. Te contactaremos dentro de las próximas 2 horas para ayudarte.`,
      'FRIO': `Hemos recibido tu consulta sobre ${classification}. Te enviaremos información relevante por email en las próximas 24 horas.`
    };

    return responses[temperature] || 'Gracias por contactarnos. Hemos procesado tu consulta y te responderemos pronto.';
  }

  /**
   * Detecta intenciones en el mensaje (simulado)
   */
  detectIntents(message) {
    const intentKeywords = {
      'solicitar_informacion': ['información', 'info', 'detalles', 'quiero saber'],
      'solicitar_cotizacion': ['cotización', 'precio', 'costo', 'cuánto'],
      'reportar_problema': ['problema', 'error', 'falla', 'no funciona'],
      'agendar_reunion': ['reunión', 'cita', 'meeting', 'hablar']
    };

    const detectedIntents = [];
    const messageLower = message.toLowerCase();

    for (const [intent, keywords] of Object.entries(intentKeywords)) {
      const confidence = keywords.filter(keyword =>
        messageLower.includes(keyword)
      ).length / keywords.length;

      if (confidence > 0) {
        detectedIntents.push({
          intent,
          confidence: Math.min(confidence, 1.0)
        });
      }
    }

    return detectedIntents.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Extrae entidades del mensaje (simulado)
   */
  extractEntities(message) {
    const entities = [];

    // Detectar emails
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    const emails = message.match(emailRegex);
    if (emails) {
      emails.forEach(email => {
        entities.push({
          entity: 'email',
          value: email,
          confidence: 0.95
        });
      });
    }

    // Detectar teléfonos
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = message.match(phoneRegex);
    if (phones) {
      phones.forEach(phone => {
        entities.push({
          entity: 'phone',
          value: phone,
          confidence: 0.9
        });
      });
    }

    return entities;
  }

  /**
   * Cierra la sesión
   */
  async closeSession() {
    if (this.sessionId) {
      console.log('🔚 Cerrando sesión Watson Assistant:', this.sessionId);
      this.sessionId = null;
      this.initialized = false;
    }
  }
}

/**
 * Cliente para watsonx Orchestrate
 */
class WatsonxOrchestrateClient {
  constructor() {
    this.initialized = false;
    this.flowInstances = new Map();
  }

  /**
   * Registra el flow en Orchestrate
   */
  async registerFlow(flowDefinition) {
    try {
      console.log('📋 Registrando flow en watsonx Orchestrate...');

      const flowId = `octabridge_flow_${Date.now()}`;

      // En producción, aquí registrarías el flow real en Orchestrate
      const registrationResult = {
        flow_id: flowId,
        status: 'registered',
        version: '0.3',
        skills_count: flowDefinition.skills?.length || 0,
        timestamp: new Date().toISOString()
      };

      this.flowInstances.set(flowId, {
        definition: flowDefinition,
        registration: registrationResult,
        executions: []
      });

      console.log('✅ Flow registrado en Orchestrate:', flowId);
      return registrationResult;
    } catch (error) {
      throw createFlowError(error, {
        service: 'watsonx_orchestrate',
        operation: 'register_flow'
      });
    }
  }

  /**
   * Ejecuta el flow en Orchestrate
   */
  async executeFlow(flowId, inputData) {
    try {
      console.log('⚡ Ejecutando flow en watsonx Orchestrate:', flowId);

      const flowInstance = this.flowInstances.get(flowId);
      if (!flowInstance) {
        throw new Error(`Flow ${flowId} no encontrado`);
      }

      const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

      const execution = {
        execution_id: executionId,
        flow_id: flowId,
        input_data: inputData,
        status: 'running',
        start_time: new Date().toISOString(),
        steps_completed: 0,
        total_steps: 4
      };

      flowInstance.executions.push(execution);

      console.log('✅ Flow ejecutándose en Orchestrate:', executionId);
      return execution;
    } catch (error) {
      throw createFlowError(error, {
        service: 'watsonx_orchestrate',
        operation: 'execute_flow',
        flowId
      });
    }
  }

  /**
   * Obtiene el estado de una ejecución
   */
  async getExecutionStatus(executionId) {
    try {
      // Buscar la ejecución en todas las instancias de flow
      for (const [flowId, flowInstance] of this.flowInstances) {
        const execution = flowInstance.executions.find(exec =>
          exec.execution_id === executionId
        );

        if (execution) {
          return {
            ...execution,
            flow_id: flowId,
            last_updated: new Date().toISOString()
          };
        }
      }

      throw new Error(`Ejecución ${executionId} no encontrada`);
    } catch (error) {
      throw createFlowError(error, {
        service: 'watsonx_orchestrate',
        operation: 'get_execution_status',
        executionId
      });
    }
  }

  /**
   * Lista todos los flows registrados
   */
  listFlows() {
    const flows = [];

    for (const [flowId, flowInstance] of this.flowInstances) {
      flows.push({
        flow_id: flowId,
        status: flowInstance.registration.status,
        version: flowInstance.registration.version,
        skills_count: flowInstance.registration.skills_count,
        executions_count: flowInstance.executions.length,
        last_execution: flowInstance.executions.length > 0
          ? flowInstance.executions[flowInstance.executions.length - 1].start_time
          : null
      });
    }

    return flows;
  }
}

/**
 * Manager principal para integración Watson
 */
class WatsonIntegrationManager {
  constructor() {
    this.assistantClient = new WatsonAssistantClient();
    this.orchestrateClient = new WatsonxOrchestrateClient();
    this.initialized = false;
  }

  /**
   * Inicializa todos los servicios Watson
   */
  async initialize() {
    try {
      console.log('🚀 Inicializando integración Watson...');

      // Validar configuración
      this.validateConfiguration();

      // Inicializar Watson Assistant
      await this.assistantClient.initializeSession();

      // Registrar flow en Orchestrate
      const flowDefinition = this.createFlowDefinition();
      this.flowRegistration = await this.orchestrateClient.registerFlow(flowDefinition);

      this.initialized = true;
      console.log('✅ Integración Watson inicializada correctamente');

      return {
        assistant_session: this.assistantClient.sessionId,
        orchestrate_flow: this.flowRegistration.flow_id,
        status: 'initialized'
      };
    } catch (error) {
      throw createFlowError(error, {
        service: 'watson_integration',
        operation: 'initialize'
      });
    }
  }

  /**
   * Valida la configuración de Watson
   */
  validateConfiguration() {
    const requiredEnvVars = [
      'IBM_CLOUD_API_KEY',
      'IBM_CLOUD_RESOURCE_GROUP',
      'IBM_CLOUD_REGION'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
      throw new Error(`Variables de entorno faltantes: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Crea la definición del flow para Orchestrate
   */
  createFlowDefinition() {
    return {
      name: 'OctaBridge Lead Processing Flow',
      version: '0.3',
      description: 'Flow completo para procesamiento de leads con IA',
      skills: [
        {
          name: 'skill-intakebasic',
          type: 'data_processing',
          endpoint: 'http://localhost:3000/skill-intakebasic'
        },
        {
          name: 'skill-nlpclassify',
          type: 'ai_classification',
          endpoint: 'http://localhost:5000/classify'
        },
        {
          name: 'skill-datasetloader',
          type: 'data_storage',
          endpoint: 'http://localhost:3001/skill-datasetloader'
        },
        {
          name: 'skill-notifyslack',
          type: 'notification',
          endpoint: 'http://localhost:5001/notify'
        }
      ],
      flow_steps: [
        { step: 1, skill: 'skill-intakebasic', action: 'normalize_lead_data' },
        { step: 2, skill: 'skill-nlpclassify', action: 'classify_interest' },
        { step: 3, skill: 'skill-datasetloader', action: 'store_processed_data' },
        { step: 4, skill: 'skill-notifyslack', action: 'send_notification' }
      ]
    };
  }

  /**
   * Procesa un lead completo usando Watson
   */
  async processLeadWithWatson(leadData) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // 1. Ejecutar flow en Orchestrate
      const execution = await this.orchestrateClient.executeFlow(
        this.flowRegistration.flow_id,
        leadData
      );

      // 2. Generar respuesta contextual con Watson Assistant
      const assistantResponse = await this.assistantClient.sendMessage(
        leadData.interes,
        {
          leadData,
          executionId: execution.execution_id
        }
      );

      return {
        orchestrate_execution: execution,
        assistant_response: assistantResponse,
        integration_status: 'success',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw createFlowError(error, {
        service: 'watson_integration',
        operation: 'process_lead_with_watson'
      });
    }
  }

  /**
   * Obtiene el estado de la integración
   */
  getIntegrationStatus() {
    return {
      initialized: this.initialized,
      assistant: {
        session_id: this.assistantClient.sessionId,
        initialized: this.assistantClient.initialized
      },
      orchestrate: {
        flow_id: this.flowRegistration?.flow_id,
        flows_count: this.orchestrateClient.flowInstances.size
      },
      configuration: {
        api_key_configured: !!process.env.IBM_CLOUD_API_KEY,
        region: process.env.IBM_CLOUD_REGION,
        resource_group: process.env.IBM_CLOUD_RESOURCE_GROUP
      }
    };
  }

  /**
   * Limpia recursos y cierra conexiones
   */
  async cleanup() {
    try {
      await this.assistantClient.closeSession();
      this.initialized = false;
      console.log('🧹 Recursos Watson liberados');
    } catch (error) {
      console.warn('⚠️ Error al limpiar recursos Watson:', error.message);
    }
  }
}

// Instancia global del manager
const watsonManager = new WatsonIntegrationManager();

module.exports = {
  WatsonAssistantClient,
  WatsonxOrchestrateClient,
  WatsonIntegrationManager,
  watsonManager,
  WATSON_CONFIG
};