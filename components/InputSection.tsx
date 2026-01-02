import React, { useState, KeyboardEvent } from 'react';
import { Loader2, ArrowRight } from 'lucide-react';

interface InputSectionProps {
  onParse: (text: string) => Promise<void>;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onParse, isLoading }) => {
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if (!text.trim() || isLoading) return;
    onParse(text);
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="w-full px-4 md:px-0">
      <div className="relative group">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="试试: 早餐15, 昨天打车50..."
          className="w-full text-lg px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-black focus:bg-white rounded-2xl outline-none transition-all duration-300 placeholder-gray-400 shadow-sm md:bg-white md:focus:bg-white"
          disabled={isLoading}
          autoFocus
        />
        <button
          onClick={handleSubmit}
          disabled={!text.trim() || isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-0"
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