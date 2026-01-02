import React from 'react';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthSelectorProps {
  currentDate: Date;
  onPrev: () => void;
  onNext: () => void;
}

const MonthSelector: React.FC<MonthSelectorProps> = ({ currentDate, onPrev, onNext }) => {
  const formattedDate = currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });

  return (
    <div className="flex items-center justify-between bg-gray-50 p-2 rounded-2xl mb-6 mx-4 border border-gray-100">
      <button 
        onClick={onPrev}
        className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-xl transition-all"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="flex items-center gap-2 font-bold text-gray-800">
        <Calendar className="w-4 h-4 text-gray-400" />
        <span>{formattedDate}</span>
      </div>

      <button 
        onClick={onNext}
        className="p-2 text-gray-400 hover:text-black hover:bg-white rounded-xl transition-all"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
};

export default MonthSelector;