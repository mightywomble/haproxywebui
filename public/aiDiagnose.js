const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function aiDiagnose(errorMessage) {
    try {
      const response = await fetch('/api/ai-diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ errorMessage }),
      });
      const data = await response.json();
      return data.diagnosis;
    } catch (error) {
      console.error('Error:', error);
      return 'Error getting AI diagnosis';
    }
  }
  
  function showAIDiagnosis(diagnosis) {
    const slideIn = document.createElement('div');
    slideIn.id = 'aiDiagnosisSlideIn';
    slideIn.innerHTML = `
      <h2>AI Diagnosis</h2>
      <p>${diagnosis}</p>
      <button onclick="closeAIDiagnosis()">Back</button>
    `;
    document.body.appendChild(slideIn);
    setTimeout(() => slideIn.classList.add('active'), 10);
  }
  
  function closeAIDiagnosis() {
    const slideIn = document.getElementById('aiDiagnosisSlideIn');
    slideIn.classList.remove('active');
    setTimeout(() => slideIn.remove(), 300);
  }