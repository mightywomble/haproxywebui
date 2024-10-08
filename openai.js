const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function analyzeConfig(configContent) {
  if (!configContent) {
      throw new Error('No configuration content provided');
  }
  try {
      const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [
              {role: "system", content: "You are a HAProxy expert. Analyze the given configuration file and provide feedback."},
              {role: "user", content: configContent}
          ],
      });
      return response.choices[0].message.content;
  } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
  }
}

module.exports = { analyzeConfig };