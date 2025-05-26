// main-flow.js
// Flujo principal de OctaBridge: orquesta la clasificación y notificación de leads
const axios = require('axios');

/**
 * mainFlow
 * Orquesta la clasificación de un lead y la notificación a Slack.
 * @param {Object} input - Objeto con el campo 'text' a clasificar.
 * @returns {Object} - Resultado con la categoría y el estado de la notificación.
 */
async function mainFlow(input) {
  try {
    // Clasificar texto usando el skill-nlpclassify
    const classifyResponse = await axios.post('http://localhost:5000/classify', {
      text: input.text
    });
    const category = classifyResponse.data.category;

    // Notificar a Slack usando el skill-notifyslack
    const notifyResponse = await axios.post('http://localhost:5001/notify', {
      message: `Nuevo lead clasificado como: ${category}`
    });

    return {
      classification: category,
      notificationStatus: notifyResponse.data.status
    };
  } catch (error) {
    // Manejo de errores global del flujo
    console.error('Error en el flujo principal:', error);
    throw error;
  }
}

module.exports = { mainFlow };