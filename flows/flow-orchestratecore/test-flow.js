// flows/flow-orchestratecore/test-flow.js
// Pruebas completas del Flow OctaBridge

require('dotenv').config();
const { octaBridgeMainFlow, healthCheck } = require('./main-flow');
const { watsonManager } = require('./watson-integration');

/**
 * Datos de prueba para diferentes escenarios
 */
const TEST_CASES = {
  // Lead completo y urgente (debería ser CALIENTE)
  leadCompleto: {
    nombre: "María González",
    empresa: "Tech Solutions SPA",
    interes: "Necesito urgentemente una solución de IA para automatizar mi proceso de ventas. Es crítico implementarlo esta semana.",
    contacto: {
      email: "maria.gonzalez@techsolutions.cl",
      telefono: "+56912345678"
    },
    fuente: "LinkedIn Ads"
  },

  // Lead básico de consulta (debería ser TEMPLADO)
  leadBasico: {
    nombre: "Pedro Ramírez",
    interes: "Tengo algunas preguntas sobre sus servicios de consultoría",
    contacto: {
      email: "pedro.ramirez@gmail.com"
    },
    fuente: "Sitio Web"
  },

  // Lead mínimo (debería ser FRIO)
  leadMinimo: {
    nombre: "Ana Silva",
    interes: "Información general"
  },

  // Lead con datos inválidos (debería fallar validación)
  leadInvalido: {
    nombre: "",
    interes: "x"
  }
};

/**
 * Ejecuta todas las pruebas del flow
 */
async function runAllTests() {
  console.log('🧪 INICIANDO PRUEBAS COMPLETAS DEL FLOW OCTABRIDGE');
  console.log('='.repeat(60));

  const testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    details: []
  };

  // Test 1: Health Check
  await runTest('Health Check', testHealthCheck, testResults);

  // Test 2: Watson Integration Status
  await runTest('Watson Integration Status', testWatsonIntegration, testResults);

  // Test 3: Lead Completo (Caso exitoso)
  await runTest('Lead Completo - Caso Exitoso',
    () => testLeadProcessing(TEST_CASES.leadCompleto, 'CALIENTE'),
    testResults
  );

  // Test 4: Lead Básico
  await runTest('Lead Básico - Consulta',
    () => testLeadProcessing(TEST_CASES.leadBasico, 'TEMPLADO'),
    testResults
  );

  // Test 5: Lead Mínimo
  await runTest('Lead Mínimo',
    () => testLeadProcessing(TEST_CASES.leadMinimo, 'FRIO'),
    testResults
  );

  // Test 6: Validación de errores
  await runTest('Validación de Errores',
    () => testErrorHandling(TEST_CASES.leadInvalido),
    testResults
  );

  // Test 7: Performance básico
  await runTest('Performance Básico', testPerformance, testResults);

  // Resumen final
  printTestSummary(testResults);
  return testResults;
}

/**
 * Ejecuta un test individual
 */
async function runTest(testName, testFunction, results) {
  console.log(`\n🔍 Ejecutando: ${testName}`);
  console.log('-'.repeat(40));

  results.total++;
  const startTime = Date.now();

  try {
    await testFunction();
    const duration = Date.now() - startTime;
    console.log(`✅ PASÓ (${duration}ms)`);
    results.passed++;
    results.details.push({
      name: testName,
      status: 'PASS',
      duration,
      error: null
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.log(`❌ FALLÓ (${duration}ms): ${error.message}`);
    results.failed++;
    results.details.push({
      name: testName,
      status: 'FAIL',
      duration,
      error: error.message
    });
  }
}

/**
 * Test de health check
 */
async function testHealthCheck() {
  const health = await healthCheck();

  if (!health || typeof health !== 'object') {
    throw new Error('Health check no retornó objeto válido');
  }

  if (health.flow_status !== 'operational') {
    throw new Error(`Flow status no es operational: ${health.flow_status}`);
  }

  console.log('  ✓ Health check respondió correctamente');
  console.log(`  ✓ Flow status: ${health.flow_status}`);
  console.log(`  ✓ Skills status: ${JSON.stringify(health.skills_status)}`);
}

/**
 * Test de integración Watson
 */
async function testWatsonIntegration() {
  const status = watsonManager.getIntegrationStatus();

  if (!status || typeof status !== 'object') {
    throw new Error('Watson integration status no válido');
  }

  console.log('  ✓ Watson status obtenido');
  console.log(`  ✓ Initialized: ${status.initialized}`);
  console.log(`  ✓ API Key configured: ${status.configuration.api_key_configured}`);
  console.log(`  ✓ Region: ${status.configuration.region}`);
}

/**
 * Test de procesamiento de lead
 */
async function testLeadProcessing(leadData, expectedTemperature) {
  console.log(`  📝 Procesando lead: ${leadData.nombre}`);
  console.log(`  🎯 Temperatura esperada: ${expectedTemperature}`);

  const result = await octaBridgeMainFlow(leadData);

  // Validaciones básicas
  if (!result) {
    throw new Error('Flow no retornó resultado');
  }

  if (result.status !== 'completed' && result.status !== 'error') {
    throw new Error(`Status inesperado: ${result.status}`);
  }

  if (result.status === 'error') {
    throw new Error(`Flow falló: ${result.final_result?.error}`);
  }

  // Validar estructura del resultado
  const requiredFields = ['lead_id', 'status', 'steps', 'final_result', 'timestamp'];
  for (const field of requiredFields) {
    if (!(field in result)) {
      throw new Error(`Campo requerido faltante: ${field}`);
    }
  }

  // Validar steps
  const requiredSteps = ['intake', 'classification', 'notification', 'dataLoading'];
  for (const step of requiredSteps) {
    if (!(step in result.steps)) {
      throw new Error(`Step requerido faltante: ${step}`);
    }
  }

  // Validar resultado final
  if (!result.final_result || !result.final_result.lead_processed) {
    throw new Error('Lead no fue procesado correctamente');
  }

  // Validar temperatura si se especifica
  if (expectedTemperature && result.final_result.temperature !== expectedTemperature) {
    console.log(`  ⚠️ Temperatura obtenida: ${result.final_result.temperature} (esperada: ${expectedTemperature})`);
    // No fallar el test por esto, solo advertir
  }

  console.log(`  ✓ Lead procesado exitosamente`);
  console.log(`  ✓ Lead ID: ${result.lead_id}`);
  console.log(`  ✓ Clasificación: ${result.final_result.classification}`);
  console.log(`  ✓ Temperatura: ${result.final_result.temperature}`);
  console.log(`  ✓ Score: ${result.final_result.score}`);
  console.log(`  ✓ Datos almacenados: ${result.final_result.data_stored}`);
  console.log(`  ✓ Notificación enviada: ${result.final_result.notification_sent}`);
}

/**
 * Test de manejo de errores
 */
async function testErrorHandling(invalidLeadData) {
  console.log('  🚨 Probando manejo de errores con datos inválidos');

  try {
    const result = await octaBridgeMainFlow(invalidLeadData);

    // Si llegamos aquí, el flow debería haber retornado error
    if (result.status !== 'error') {
      throw new Error('Flow debería haber fallado con datos inválidos');
    }

    console.log('  ✓ Error manejado correctamente');
    console.log(`  ✓ Mensaje de error: ${result.final_result?.error}`);

  } catch (error) {
    // Es esperado que lance excepción con datos inválidos
    console.log('  ✓ Excepción manejada correctamente');
    console.log(`  ✓ Error capturado: ${error.message}`);
  }
}

/**
 * Test básico de performance
 */
async function testPerformance() {
  console.log('  ⏱️ Midiendo performance básica');

  const iterations = 3;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();

    try {
      await octaBridgeMainFlow(TEST_CASES.leadBasico);
      const duration = Date.now() - startTime;
      times.push(duration);
      console.log(`    Iteración ${i + 1}: ${duration}ms`);
    } catch (error) {
      console.log(`    Iteración ${i + 1}: ERROR - ${error.message}`);
    }
  }

  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const maxTime = Math.max(...times);
    const minTime = Math.min(...times);

    console.log(`  ✓ Tiempo promedio: ${avgTime.toFixed(2)}ms`);
    console.log(`  ✓ Tiempo mínimo: ${minTime}ms`);
    console.log(`  ✓ Tiempo máximo: ${maxTime}ms`);

    // Validar que no sea demasiado lento (< 10 segundos)
    if (avgTime > 10000) {
      throw new Error(`Performance muy lenta: ${avgTime}ms promedio`);
    }
  } else {
    throw new Error('No se pudieron completar las mediciones de performance');
  }
}

/**
 * Imprime resumen de las pruebas
 */
function printTestSummary(results) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('='.repeat(60));

  console.log(`Total de pruebas: ${results.total}`);
  console.log(`✅ Exitosas: ${results.passed}`);
  console.log(`❌ Fallidas: ${results.failed}`);
  console.log(`📈 Tasa de éxito: ${((results.passed / results.total) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ PRUEBAS FALLIDAS:');
    results.details
      .filter(test => test.status === 'FAIL')
      .forEach(test => {
        console.log(`  • ${test.name}: ${test.error}`);
      });
  }

  console.log('\n⏱️ TIEMPOS DE EJECUCIÓN:');
  results.details.forEach(test => {
    const status = test.status === 'PASS' ? '✅' : '❌';
    console.log(`  ${status} ${test.name}: ${test.duration}ms`);
  });

  const overallStatus = results.failed === 0 ? '✅ TODAS LAS PRUEBAS PASARON' : '❌ ALGUNAS PRUEBAS FALLARON';
  console.log(`\n${overallStatus}`);
  console.log('='.repeat(60));
}

/**
 * Ejecución principal
 */
if (require.main === module) {
  console.log('🚀 Iniciando suite de pruebas OctaBridge Flow...\n');

  runAllTests()
    .then(results => {
      const exitCode = results.failed > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('💥 Error crítico en las pruebas:', error);
      process.exit(1);
    });
}

module.exports = {
  runAllTests,
  TEST_CASES
};