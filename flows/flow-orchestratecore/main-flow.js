const axios = require('axios');

async function mainFlow(input) {
  try {
    // Clasificar texto
    const classifyResponse = await axios.post('http://localhost:5000/classify', {
      text: input.text
    });
    const category = classifyResponse.data.category;

    // Notificar a Slack
    const notifyResponse = await axios.post('http://localhost:5001/notify', {
      message: `Nuevo lead clasificado como: ${category}`
    });

    return {
      classification: category,
      notificationStatus: notifyResponse.data.status
    };
  } catch (error) {
    console.error('Error en el flujo principal:', error);
    throw error;
  }
}

module.exports = { mainFlow };