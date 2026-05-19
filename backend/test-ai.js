import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

const ai = new GoogleGenerativeAI(process.env.AI_API_KEY);
const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });

(async () => {
  try {
    const prompt = 'Retorne {"contents":["A","B"],"supportResources":["X"],"tags":["t1","t2","t3"]}';
    const result = await model.generateContent(prompt);
    console.log('response text:', result.response.text());
  } catch (e) {
    console.error('ERROR:', e);
    process.exit(1);
  }
})();
