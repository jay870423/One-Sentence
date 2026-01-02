export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
}

export type AIProvider = 'gemini' | 'deepseek';

export interface Transaction {
  id: string;
  amount: number;
  category: string;
  note: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  createdAt: number;
}

export interface ParseResult {
  amount: number;
  category: string;
  note: string;
  date: string;
  type: TransactionType;
}

export const DEFAULT_CATEGORIES = [
  '餐饮', '交通', '购物', '娱乐', '居住', '医疗', '工资', '理财', '其他'
];