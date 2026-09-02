import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for generating math puzzles
  app.get('/api/generate-puzzle', async (req, res) => {
    try {
      const type = req.query.type;
      
      // We use the environment variable by default, but if the user provided one specifically 
      // (like "AQ.Ab8RN6Jez2kr1PNIYfxKTu2ExKZxBTwXdYnlRKov2BKRIGvWiA") we could use it. 
      // However, best practice is relying on the secure AI Studio env injection.
      const apiKey = process.env.GEMINI_API_KEY || "AQ.Ab8RN6Jez2kr1PNIYfxKTu2ExKZxBTwXdYnlRKov2BKRIGvWiA";
      
      const ai = new GoogleGenAI({ apiKey: apiKey });

      let theme = "";
      if (type === 'expand') theme = "การซื้อหรือขยายพื้นที่ฟาร์ม (เช่น การบวกจำนวนแปลงที่ดินอย่างง่ายๆ 1 หลัก)";
      else if (type === 'water') theme = "การใช้น้ำหรือเติมน้ำในบัวรดน้ำ (เช่น การลบเลข 1 หลัก อย่างง่าย)";
      else if (type === 'harvest') theme = "การขายผลผลิตการเกษตร (เช่น การบวกเลขหรือคูณเลขง่ายๆ หลักเดียว)";
      else theme = "เรื่องทั่วไปในฟาร์ม (บวกหรือลบเลข 1 หลัก)";

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "ชื่อหัวข้อของโจทย์ เช่น 'ซื้อที่ดิน' หรือ 'ขายผัก'"
          },
          question: {
            type: Type.STRING,
            description: "คำถามคณิตศาสตร์ภาษาไทยที่อ่านเข้าใจง่าย น่ารัก เหมาะกับเด็กประถมต้น (ป.1 - ป.3) และไม่มีตัวเลขเกิน 20"
          },
          answer: {
            type: Type.NUMBER,
            description: "คำตอบที่ถูกต้องเป็นตัวเลขจำนวนเต็มเท่านั้น"
          }
        },
        required: ["title", "question", "answer"]
      };

      const prompt = `แต่งโจทย์ปัญหาคณิตศาสตร์สำหรับเด็กประถมต้น (ป.1 - ป.3) 1 ข้อ
      หัวข้อ: ${theme}
      เงื่อนไข:
      1. ต้องเป็นโจทย์ที่ง่ายมากๆ เช่น การบวก หรือลบ เลขไม่เกิน 20 
      2. เนื้อหาน่ารัก เข้าใจง่ายสำหรับเด็ก
      3. ให้คืนค่ากลับมาในรูปแบบ JSON ตาม schema ที่กำหนดอย่างเคร่งครัด
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
          temperature: 0.7,
        }
      });

      if (response.text) {
        const data = JSON.parse(response.text);
        res.json(data);
      } else {
        throw new Error("No text returned from Gemini");
      }

    } catch (error) {
      console.error("Error generating puzzle:", error);
      // Fallback for safety
      res.status(500).json({
        title: "ข้อผิดพลาดระบบ",
        question: "1 + 1 เท่ากับเท่าไหร่?",
        answer: 2
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
