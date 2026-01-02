import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ParseResult, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    amount: { type: Type.NUMBER, description: "The numeric amount of the transaction in CNY (¥)." },
    category: { type: Type.STRING, description: "The category of the transaction (e.g., Food, Transport)." },
    note: { type: Type.STRING, description: "A brief description of the item." },
    date: { type: Type.STRING, description: "The date in YYYY-MM-DD format." },
    type: { type: Type.STRING, enum: [TransactionType.EXPENSE, TransactionType.INCOME], description: "Whether it is an expense or income." },
  },
  required: ["amount", "category", "type", "date"],
};

export const parseInputWithGemini = async (input: string): Promise<ParseResult | null> => {
  try {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekday = today.toLocaleDateString('zh-CN', { weekday: 'long' });

    const prompt = `
      Current Date: ${todayStr} (${weekday}).
      
      Analyze the following user input for a personal bookkeeping entry: "${input}".
      
      Your goal is to extract structured data for a Chinese-centric bookkeeping app (Currency: CNY/¥).

      Rules:
      1. **Amount & Currency**: 
         - Extract the amount. 
         - The base currency is CNY (¥). 
         - Support Chinese slang units: "块" (kuai), "元" (yuan), "米" (mi), "w" (10,000), "k" (1,000).
         - **Auto-Conversion**: If the user inputs a foreign currency (e.g., USD, EUR, JPY, HKD), convert it to CNY using an approximate current exchange rate. 
         - If conversion occurs, append the original amount in the 'note' field (e.g., "Lunch ($10)").
      2. **Category**: Infer a standard category (e.g., "餐饮", "交通", "购物", "娱乐", "居住", "医疗", "工资", "理财", "其他").
      3. **Date**: Extract the date. Handle relative terms like "yesterday" (昨天), "last friday". Default to Current Date if not specified.
      4. **Type**: Determine if it is EXPENSE (default) or INCOME (e.g., "salary", "red packet", "refund").
      5. **Note**: Extract a short description. If the input is just numbers/category, generate a simple note.

      Return JSON only.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) return null;

    const data = JSON.parse(text) as ParseResult;
    
    // Fallback defaults
    if (!data.date) data.date = todayStr;
    if (!data.note) data.note = data.category;
    
    return data;
  } catch (error) {
    console.error("Gemini parsing error:", error);
    return null;
  }
};