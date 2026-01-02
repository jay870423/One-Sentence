import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface CalendarProps {
  currentDate: Date;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: Date | null) => void;
  selectedDate: Date | null;
  transactions: Transaction[]; // Transactions for the current month
}

const Calendar: React.FC<CalendarProps> = ({ 
  currentDate, 
  onPrevMonth, 
  onNextMonth, 
  onSelectDate, 
  selectedDate,
  transactions 
}) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sun

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  // Pre-calculate daily totals
  const dailyStats = useMemo(() => {
    const stats: { [key: number]: number } = {};
    transactions.forEach(t => {
      const d = new Date(t.date);
      // Ensure we only process transactions for this month
      if (d.getMonth() === month && d.getFullYear() === year) {
        const day = d.getDate();
        const amount = t.type === TransactionType.EXPENSE ? -t.amount : t.amount;
        stats[day] = (stats[day] || 0) + amount;
      }
    });
    return stats;
  }, [transactions, month, year]);

  const handleDateClick = (day: number) => {
    const newDate = new Date(year, month, day);
    // If clicking same day, deselect
    if (selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year) {
      onSelectDate(null);
    } else {
      onSelectDate(newDate);
    }
  };

  const isSelected = (day: number) => {
    return selectedDate && 
           selectedDate.getDate() === day && 
           selectedDate.getMonth() === month && 
           selectedDate.getFullYear() === year;
  };
  
  const isToday = (day: number) => {
      const today = new Date();
      return today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
  };

  return (
    <div className="px-4 pb-2 mb-2 md:px-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 bg-gray-50 p-2 rounded-2xl md:bg-white md:border md:border-gray-100/50">
        <button onClick={onPrevMonth} className="p-2 hover:bg-white rounded-xl transition-all">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-2">
           <h2 className="text-base font-bold text-gray-800">
            {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
           </h2>
           {selectedDate && (
               <button onClick={() => onSelectDate(null)} className="text-[10px] bg-black text-white px-2 py-1 rounded-full hover:bg-gray-800 flex items-center gap-1 transition-all animate-in fade-in">
                   <RotateCcw className="w-3 h-3" />
                   Month
               </button>
           )}
        </div>
        <button onClick={onNextMonth} className="p-2 hover:bg-white rounded-xl transition-all">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 mb-2 text-center">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-y-3">
        {blanks.map(i => <div key={`blank-${i}`} />)}
        
        {days.map(day => {
          const total = dailyStats[day];
          const selected = isSelected(day);
          const today = isToday(day);

          return (
            <div key={day} className="flex flex-col items-center gap-1 cursor-pointer group" onClick={() => handleDateClick(day)}>
              <div className={`
                w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200
                ${selected ? 'bg-blue-600 text-white shadow-lg scale-105' : ''}
                ${!selected && today ? 'bg-blue-50 text-blue-600 font-bold ring-1 ring-blue-100' : ''}
                ${!selected && !today ? 'text-gray-700 hover:bg-gray-50' : ''}
              `}>
                {day}
              </div>
              
              {/* Dot / Amount */}
              <div className="h-3 flex items-center justify-center">
                {total !== undefined && (
                  <span className={`text-[9px] font-medium truncate max-w-[40px] leading-none ${
                    selected ? 'text-blue-600' : // Visually confusing if text is blue on white? No, the text is outside the circle.
                    total < 0 ? 'text-red-500' : 'text-green-600'
                  }`}>
                    {Math.abs(total) >= 1000 ? (total > 0 ? '+' : '') + (total/1000).toFixed(1) + 'k' : total.toFixed(0)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;