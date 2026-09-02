import { GoogleGenAI, Type } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "AQ.Ab8RN6Jez2kr1PNIYfxKTu2ExKZxBTwXdYnlRKov2BKRIGvWiA" });
async function run() {
  try {
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          question: { type: Type.STRING },
          answer: { type: Type.NUMBER }
        },
        required: ["title", "question", "answer"]
      };

      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: "Test",
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
      console.log(response.text);
  } catch(e) {
      console.error(e);
  }
}
run();
