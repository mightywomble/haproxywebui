const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function diagnoseConfigError(errorMessage) {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an expert in HAProxy configuration. Analyze the following error message from an HAProxy configuration test and provide a diagnosis and potential solution." },
          { role: "user", content: `HAProxy configuration error: ${errorMessage}` }
        ],
      });
  
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Failed to diagnose error');
    }
  }




module.exports = { diagnoseConfigError };