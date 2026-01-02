import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ParseResult, TransactionType, AIProvider } from "../types";

// Initialize Gemini Client
// Note: If API_KEY is missing, this might not throw immediately until a call is made, or might throw depending on SDK version.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Gemini Schema
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

/**
 * Common Prompt Generator
 */
const getPrompt = (input: string) => {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const weekday = today.toLocaleDateString('zh-CN', { weekday: 'long' });

  return `
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
};

/**
 * Gemini Handler
 */
const parseWithGemini = async (input: string): Promise<ParseResult | null> => {
  try {
    const prompt = getPrompt(input);
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
    return JSON.parse(text) as ParseResult;
  } catch (error) {
    console.error("Gemini parsing error:", error);
    throw error;
  }
};

/**
 * DeepSeek Handler (OpenAI Compatible)
 */
const parseWithDeepSeek = async (input: string): Promise<ParseResult | null> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("未配置 DeepSeek API Key。请在 .env 文件或 Vercel 环境变量中配置 DEEPSEEK_API_KEY。");
  }

  const prompt = getPrompt(input);
  
  // We need to append the schema explicitly for DeepSeek V3/Chat models as they don't support the strict 'responseSchema' object in the same way,
  // but they are very good at following JSON instructions in the system prompt.
  const deepSeekSystemPrompt = `
    You are a helpful bookkeeping assistant. 
    You MUST respond with valid JSON only. 
    The JSON structure must be:
    {
      "amount": number,
      "category": string,
      "note": string,
      "date": "YYYY-MM-DD",
      "type": "EXPENSE" | "INCOME"
    }
  `;

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: deepSeekSystemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.1
      })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("DeepSeek API Error:", errText);
        
        let friendlyMsg = `请求失败 (${response.status})`;
        try {
            const errJson = JSON.parse(errText);
            if (errJson.error && errJson.error.message) {
                friendlyMsg += `: ${errJson.error.message}`;
            }
        } catch (e) {
            // ignore
        }
        throw new Error(friendlyMsg);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) return null;
    return JSON.parse(content) as ParseResult;

  } catch (error) {
    console.error("DeepSeek parsing error:", error);
    throw error;
  }
};

/**
 * Main Exported Function
 */
export const parseInput = async (input: string, provider: AIProvider = 'gemini'): Promise<ParseResult | null> => {
  // We removed the try-catch wrapper here so that specific errors (like missing API key)
  // bubble up to the UI component for better user feedback.
  let data: ParseResult | null = null;
  
  if (provider === 'deepseek') {
      data = await parseWithDeepSeek(input);
  } else {
      data = await parseWithGemini(input);
  }

  if (!data) return null;

  // Post-processing fallback defaults (shared)
  const todayStr = new Date().toISOString().split('T')[0];
  if (!data.date) data.date = todayStr;
  if (!data.note) data.note = data.category;
  
  return data;
};