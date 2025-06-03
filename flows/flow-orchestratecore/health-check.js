// flows/flow-orchestratecore/health-check.js
// Health check y monitoreo para el Flow OctaBridge

require('dotenv').config();
const axios = require('axios');
const { SKILLS_ENDPOINTS } = require('./main-flow');
const { watsonManager } = require('./watson-integration');
const { circuitBreakerManager } = require('./error-handling');

/**
 * Configuración de health checks
 */
const HEALTH_CONFIG = {
  timeout: 5000, // 5 segundos timeout
  retries: 2,
  checkInterval: 30000, // 30 segundos entre checks
  alertThreshold: 3 // Alertar después de 3 fallos consecutivos
};

/**
 * Realiza health check de un skill individual
 */
async function checkSkillHealth(skillName, endpoint) {
  const startTime = Date.now();

  try {
    // Intentar endpoint de health específico primero
    let healthUrl = endpoint.replace(/\/[^\/]*$/, '/health');

    const response = await axios.get(healthUrl, {
      timeout: HEALTH_CONFIG.timeout,
      headers: {
        'User-Agent': 'OctaBridge-HealthChecker/0.3'
      }
    });

    const responseTime = Date.now() - startTime;

    return {
      skill: skillName,
      status: 'healthy',
      endpoint: healthUrl,
      response_time: responseTime,
      http_status: response.status,
      last_check: new Date().toISOString(),
      details: response.data || null
    };

  } catch (error) {
    const responseTime = Date.now() - startTime;

    // Si el endpoint de health falla, intentar el endpoint principal
    try {
      await axios.get(endpoint, {
        timeout: HEALTH_CONFIG.timeout / 2
      });

      return {
        skill: skillName,
        status: 'degraded',
        endpoint: endpoint,
        response_time: responseTime,
        http_status: 200,
        last_check: new Date().toISOString(),
        warning: 'Health endpoint no disponible, pero skill responde'
      };

    } catch (mainError) {
      return {
        skill: skillName,
        status: 'unhealthy',
        endpoint: endpoint,
        response_time: responseTime,
        error: error.message,
        error_code: error.code || error.response?.status,
        last_check: new Date().toISOString()
      };
    }
  }
}

/**
 * Realiza health check completo del sistema
 */
async function performSystemHealthCheck() {
  console.log('🏥 Iniciando health check del sistema OctaBridge...');

  const healthReport = {
    system: 'OctaBridge Flow',
    version: '0.3',
    timestamp: new Date().toISOString(),
    overall_status: 'unknown',
    components: {},
    performance: {},
    alerts: []
  };

  // 1. Check de skills individuales
  const skillChecks = [];
  for (const [skillName, endpoint] of Object.entries(SKILLS_ENDPOINTS)) {
    skillChecks.push(checkSkillHealth(skillName, endpoint));
  }

  const skillResults = await Promise.allSettled(skillChecks);

  let healthySkills = 0;
  let totalSkills = skillResults.length;

  skillResults.forEach((result, index) => {
    const skillName = Object.keys(SKILLS_ENDPOINTS)[index];

    if (result.status === 'fulfilled') {
      healthReport.components[skillName] = result.value;
      if (result.value.status === 'healthy') {
        healthySkills++;
      }
    } else {
      healthReport.components[skillName] = {
        skill: skillName,
        status: 'error',
        error: result.reason?.message || 'Health check failed',
        last_check: new Date().toISOString()
      };
    }
  });

  // 2. Check de Watson Integration
  try {
    const watsonStatus = watsonManager.getIntegrationStatus();
    healthReport.components.watson_integration = {
      status: watsonStatus.initialized ? 'healthy' : 'unhealthy',
      initialized: watsonStatus.initialized,
      assistant_session: watsonStatus.assistant?.session_id,
      orchestrate_flows: watsonStatus.orchestrate?.flows_count || 0,
      configuration: watsonStatus.configuration,
      last_check: new Date().toISOString()
    };
  } catch (error) {
    healthReport.components.watson_integration = {
      status: 'error',
      error: error.message,
      last_check: new Date().toISOString()
    };
  }

  // 3. Check de Circuit Breakers
  const circuitBreakerStatus = circuitBreakerManager.getAllStatus();
  healthReport.components.circuit_breakers = {
    status: Object.values(circuitBreakerStatus).every(cb => cb.isAvailable) ? 'healthy' : 'degraded',
    breakers: circuitBreakerStatus,
    last_check: new Date().toISOString()
  };

  // 4. Performance metrics
  healthReport.performance = {
    skills_healthy: healthySkills,
    skills_total: totalSkills,
    health_ratio: healthySkills / totalSkills,
    average_response_time: calculateAverageResponseTime(healthReport.components),
    system_load: getSystemLoad()
  };

  // 5. Determinar status general
  if (healthySkills === totalSkills && healthReport.components.watson_integration.status === 'healthy') {
    healthReport.overall_status = 'healthy';
  } else if (healthySkills >= totalSkills * 0.5) { // Al menos 50% de skills funcionando
    healthReport.overall_status = 'degraded';
    healthReport.alerts.push('Algunos componentes no están disponibles');
  } else {
    healthReport.overall_status = 'unhealthy';
    healthReport.alerts.push('Sistema crítico: múltiples componentes fallando');
  }

  // 6. Generar alertas específicas
  generateHealthAlerts(healthReport);

  console.log(`✅ Health check completado. Status: ${healthReport.overall_status}`);
  return healthReport;
}

/**
 * Calcula tiempo promedio de respuesta
 */
function calculateAverageResponseTime(components) {
  const responseTimes = [];

  Object.values(components).forEach(component => {
    if (component.response_time && typeof component.response_time === 'number') {
      responseTimes.push(component.response_time);
    }
  });

  if (responseTimes.length === 0) return null;

  return Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
}

/**
 * Obtiene carga del sistema (simulado)
 */
function getSystemLoad() {
  // En un entorno real, aquí obtendrías métricas reales del sistema
  return {
    cpu_usage: Math.random() * 100,
    memory_usage: Math.random() * 100,
    disk_usage: Math.random() * 100,
    network_latency: Math.random() * 1000
  };
}

/**
 * Genera alertas basadas en el estado de salud
 */
function generateHealthAlerts(healthReport) {
  // Alertas por skills no saludables
  Object.values(healthReport.components).forEach(component => {
    if (component.status === 'unhealthy') {
      healthReport.alerts.push(`Componente ${component.skill || 'desconocido'} no está disponible`);
    } else if (component.status === 'degraded') {
      healthReport.alerts.push(`Componente ${component.skill || 'desconocido'} está degradado`);
    }
  });

  // Alertas por performance
  const avgResponseTime = healthReport.performance.average_response_time;
  if (avgResponseTime && avgResponseTime > 5000) {
    healthReport.alerts.push(`Tiempo de respuesta alto: ${avgResponseTime}ms`);
  }

  // Alertas por ratio de salud
  const healthRatio = healthReport.performance.health_ratio;
  if (healthRatio < 0.8) {
    healthReport.alerts.push(`Solo ${Math.round(healthRatio * 100)}% de componentes están saludables`);
  }
}

/**
 * Envía notificación de alerta crítica
 */
async function sendCriticalAlert(healthReport) {
  if (healthReport.overall_status === 'unhealthy') {
    try {
      // Enviar notificación a Slack
      const slackWebhook = process.env.OCTABRIDGE_SLACK_WEBHOOK_URL;
      if (slackWebhook) {
        const alertMessage = `🚨 **ALERTA CRÍTICA - OctaBridge**
        
**Sistema:** ${healthReport.system}
**Status:** ${healthReport.overall_status.toUpperCase()}
**Timestamp:** ${healthReport.timestamp}

**Componentes afectados:**
${Object.entries(healthReport.components)
  .filter(([name, component]) => component.status !== 'healthy')
  .map(([name, component]) => `• ${name}: ${component.status}`)
  .join('\n')}

**Alertas:**
${healthReport.alerts.map(alert => `• ${alert}`).join('\n')}

*Revisar logs para más detalles*`;

        await axios.post(slackWebhook, {
          text: alertMessage
        });

        console.log('🚨 Alerta crítica enviada a Slack');
      }
    } catch (error) {
      console.error('❌ Error enviando alerta crítica:', error.message);
    }
  }
}

/**
 * Monitor continuo del sistema
 */
class SystemMonitor {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.healthHistory = [];
    this.consecutiveFailures = 0;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Monitor ya está ejecutándose');
      return;
    }

    console.log(`🔍 Iniciando monitor del sistema (intervalo: ${HEALTH_CONFIG.checkInterval}ms)`);
    this.isRunning = true;

    this.intervalId = setInterval(async () => {
      try {
        const healthReport = await performSystemHealthCheck();
        this.processHealthReport(healthReport);
      } catch (error) {
        console.error('❌ Error en health check automático:', error.message);
      }
    }, HEALTH_CONFIG.checkInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('🛑 Monitor del sistema detenido');
  }

  processHealthReport(healthReport) {
    // Mantener historial de health checks
    this.healthHistory.push({
      timestamp: healthReport.timestamp,
      status: healthReport.overall_status,
      alerts_count: healthReport.alerts.length
    });

    // Mantener solo los últimos 100 reportes
    if (this.healthHistory.length > 100) {
      this.healthHistory.shift();
    }

    // Manejar fallos consecutivos
    if (healthReport.overall_status === 'unhealthy') {
      this.consecutiveFailures++;

      if (this.consecutiveFailures >= HEALTH_CONFIG.alertThreshold) {
        console.log(`🚨 ${this.consecutiveFailures} fallos consecutivos detectados`);
        sendCriticalAlert(healthReport);
      }
    } else {
      this.consecutiveFailures = 0;
    }

    // Log status
    const statusEmoji = {
      'healthy': '✅',
      'degraded': '⚠️',
      'unhealthy': '❌'
    };

    console.log(`${statusEmoji[healthReport.overall_status]} System Status: ${healthReport.overall_status.toUpperCase()} (${healthReport.performance.skills_healthy}/${healthReport.performance.skills_total} skills healthy)`);
  }

  getStatus() {
    return {
      is_running: this.isRunning,
      check_interval: HEALTH_CONFIG.checkInterval,
      consecutive_failures: this.consecutiveFailures,
      history_length: this.healthHistory.length,
      last_check: this.healthHistory.length > 0 ? this.healthHistory[this.healthHistory.length - 1] : null
    };
  }
}

// Instancia global del monitor
const systemMonitor = new SystemMonitor();

/**
 * Ejecución principal para health check manual
 */
if (require.main === module) {
  console.log('🏥 Ejecutando health check manual de OctaBridge...\n');

  performSystemHealthCheck()
    .then(healthReport => {
      console.log('\n📋 REPORTE DE SALUD:');
      console.log('='.repeat(50));
      console.log(JSON.stringify(healthReport, null, 2));

      const exitCode = healthReport.overall_status === 'unhealthy' ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Error crítico en health check:', error);
      process.exit(1);
    });
}

module.exports = {
  performSystemHealthCheck,
  checkSkillHealth,
  sendCriticalAlert,
  SystemMonitor,
  systemMonitor,
  HEALTH_CONFIG
};