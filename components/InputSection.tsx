import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { Loader2, ArrowRight, Bot, Zap, Mic, MicOff } from 'lucide-react';
import { AIProvider } from '../types';

interface InputSectionProps {
  onParse: (text: string, provider: AIProvider) => Promise<void>;
  isLoading: boolean;
  provider: AIProvider;
  setProvider: (p: AIProvider) => void;
}

// Add type definition for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const InputSection: React.FC<InputSectionProps> = ({ onParse, isLoading, provider, setProvider }) => {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  
  const MAX_LENGTH = 300;

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setIsSupported(true);
    }
  }, []);

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

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    // We keep track of the text before this session started to append correctly
    const initialText = text;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      
      // Simple logic: Append transcript to what we had before speaking started (if any).
      // Since we reset on every session, we can just append to the *initial* text.
      
      const spacer = (initialText && !initialText.endsWith(' ') && transcript) ? ' ' : '';
      setText(initialText + spacer + transcript);
    };

    recognitionRef.current = recognition;
    recognition.start();
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
          maxLength={MAX_LENGTH}
          placeholder={isListening ? "正在聆听..." : (provider === 'gemini' ? "Gemini: 早餐15..." : "DeepSeek: 早餐15...")}
          className={`w-full text-lg pl-6 pr-32 py-4 border-2 outline-none transition-all duration-300 shadow-sm rounded-2xl
            ${isListening 
              ? 'bg-red-50 border-red-200 placeholder-red-400 focus:border-red-300' 
              : 'bg-gray-50 border-transparent focus:border-black focus:bg-white md:bg-white'
            }
          `}
          disabled={isLoading}
          autoFocus
        />
        
        {/* Right side controls */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            
            {/* Voice Input Button */}
            {isSupported && (
              <button
                onClick={toggleListening}
                disabled={isLoading}
                className={`p-2 rounded-xl transition-all ${
                  isListening 
                    ? 'text-red-500 bg-red-100 hover:bg-red-200 animate-pulse scale-110' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }`}
                title="语音输入"
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            )}

            {/* Character Counter */}
            <span className={`text-[10px] font-medium transition-all duration-300 w-8 text-center hidden md:block ${
                text.length > MAX_LENGTH * 0.9 ? 'text-red-500' : 'text-gray-300'
            } ${text.length === 0 ? 'opacity-0' : 'opacity-100'}`}>
                {text.length}/{MAX_LENGTH}
            </span>

            {/* Submit Button */}
            <button
                onClick={handleSubmit}
                disabled={!text.trim() || isLoading}
                className={`p-2 text-white rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-0 disabled:scale-0 ${
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
    </div>
  );
};

export default InputSection;