import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ParseResult, TransactionType, AIProvider } from "../types";

// Initialize Gemini Client
// Note: If API_KEY is missing, this might not throw immediately until a call is made, or might throw depending on SDK version.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Gemini Schema - Now an Array of Objects
const responseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      amount: { type: Type.NUMBER, description: "The numeric amount of the transaction in CNY (¥)." },
      category: { type: Type.STRING, description: "The category of the transaction (e.g., Food, Transport)." },
      note: { type: Type.STRING, description: "A brief description of the item." },
      date: { type: Type.STRING, description: "The date in YYYY-MM-DD format." },
      type: { type: Type.STRING, enum: [TransactionType.EXPENSE, TransactionType.INCOME], description: "Whether it is an expense or income." },
    },
    required: ["amount", "category", "type", "date"],
  }
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
      
      Analyze the following user input for personal bookkeeping. 
      The input MAY contain multiple transactions happening on different dates.
      Input: "${input}".
      
      Your goal is to extract a list of structured data for a Chinese-centric bookkeeping app (Currency: CNY/¥).

      Rules:
      1. **Split Multiple Items**: If the input describes multiple events (e.g. "Breakfast today 5, Lunch tomorrow 20"), split them into separate objects.
      2. **Date Handling**: Strictly calculate dates based on the Current Date provided above. 
         - "今天" = Current Date.
         - "明天" = Current Date + 1 day.
         - "后天" = Current Date + 2 days.
         - "昨天" = Current Date - 1 day.
      3. **Amount & Currency**: 
         - Extract the amount. Base currency is CNY (¥). 
         - Support units: "块", "元", "米", "w", "k".
      4. **Category**: Infer a standard category (e.g., "餐饮", "交通", "购物", "娱乐", "居住", "医疗", "工资", "理财", "其他").
      5. **Type**: Determine EXPENSE or INCOME.
      6. **Note**: Extract a short description.

      Return a JSON ARRAY.
    `;
};

/**
 * Gemini Handler
 */
const parseWithGemini = async (input: string): Promise<ParseResult[] | null> => {
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
    return JSON.parse(text) as ParseResult[];
  } catch (error) {
    console.error("Gemini parsing error:", error);
    throw error;
  }
};

/**
 * DeepSeek Handler (OpenAI Compatible)
 */
const parseWithDeepSeek = async (input: string): Promise<ParseResult[] | null> => {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  
  if (!apiKey || apiKey.trim() === '') {
    throw new Error("未配置 DeepSeek API Key。请在 .env 文件或 Vercel 环境变量中配置 DEEPSEEK_API_KEY。");
  }

  const prompt = getPrompt(input);
  
  const deepSeekSystemPrompt = `
    You are a helpful bookkeeping assistant. 
    You MUST respond with a valid JSON ARRAY only. 
    Each item in the array must follow this structure:
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
    
    // DeepSeek might wrap the array in an object key like { "transactions": [...] } or return raw array
    // We try to parse flexibly
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) return parsed as ParseResult[];
    if (parsed.transactions && Array.isArray(parsed.transactions)) return parsed.transactions as ParseResult[];
    // Fallback if it returns a single object instead of array
    return [parsed] as ParseResult[];

  } catch (error) {
    console.error("DeepSeek parsing error:", error);
    throw error;
  }
};

/**
 * Main Exported Function
 */
export const parseInput = async (input: string, provider: AIProvider = 'gemini'): Promise<ParseResult[] | null> => {
  let data: ParseResult[] | null = null;
  
  if (provider === 'deepseek') {
      data = await parseWithDeepSeek(input);
  } else {
      data = await parseWithGemini(input);
  }

  if (!data || data.length === 0) return null;

  // Post-processing
  const todayStr = new Date().toISOString().split('T')[0];
  
  return data.map(item => ({
    ...item,
    date: item.date || todayStr,
    note: item.note || item.category
  }));
};