import React, { useState, KeyboardEvent } from 'react';
import { Loader2, ArrowRight, Bot, Zap } from 'lucide-react';
import { AIProvider } from '../types';

interface InputSectionProps {
  onParse: (text: string, provider: AIProvider) => Promise<void>;
  isLoading: boolean;
  provider: AIProvider;
  setProvider: (p: AIProvider) => void;
}

const InputSection: React.FC<InputSectionProps> = ({ onParse, isLoading, provider, setProvider }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onParse(text, provider);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="w-full px-4 md:px-0 space-y-3">
      {/* Model Selector */}
      <div className="flex justify-end">
        <div className="inline-flex bg-gray-100 p-1 rounded-lg">
            <button
                onClick={() => setProvider('gemini')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    provider === 'gemini' 
                    ? 'bg-white text-blue-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <Zap className="w-3 h-3" />
                Gemini
            </button>
            <button
                onClick={() => setProvider('deepseek')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    provider === 'deepseek' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
            >
                <Bot className="w-3 h-3" />
                DeepSeek
            </button>
        </div>
      </div>

      <div className="relative group">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={provider === 'gemini' ? "Gemini: 早餐15..." : "DeepSeek: 早餐15..."}
          className="w-full text-lg px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl outline-none transition-all duration-300 placeholder-gray-400 shadow-sm md:bg-white md:focus:bg-white"
          disabled={isLoading}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-0 ${
              provider === 'deepseek' ? 'bg-indigo-600' : 'bg-black'
          }`}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowRight className="w-5 h-5" />
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;