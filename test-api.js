import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: "AQ.Ab8RN6Jez2kr1PNIYfxKTu2ExKZxBTwXdYnlRKov2BKRIGvWiA" });
async function run() {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'say hi'
  });
  console.log(response.text);
}
run();
