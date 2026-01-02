import React, { useState, useEffect, useRef } from 'react';
import { ParseResult, TransactionType, DEFAULT_CATEGORIES } from '../types';
import { Check, X, Calendar, Tag, FileText, DollarSign } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  initialData: ParseResult | null;
  onConfirm: (data: ParseResult) => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, initialData, onConfirm, onCancel }) => {
  const [data, setData] = useState<ParseResult | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (initialData) {
      setData({ ...initialData });
    }
  }, [initialData]);

  // Focus confirm button when opened for keyboard accessibility
  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
        setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen || !data) return null;

  const handleChange = (field: keyof ParseResult, value: any) => {
    setData((prev) => prev ? { ...prev, [field]: value } : null);
  };

  const toggleType = () => {
    handleChange('type', data.type === TransactionType.EXPENSE ? TransactionType.INCOME : TransactionType.EXPENSE);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm transition-all">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header / Amount Input */}
        <div className={`p-6 text-center ${data.type === TransactionType.EXPENSE ? 'bg-gray-50' : 'bg-green-50'}`}>
           <div className="flex items-center justify-center space-x-2 mb-2">
              <button 
                onClick={toggleType}
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider transition-colors ${
                  data.type === TransactionType.EXPENSE 
                    ? 'bg-black text-white' 
                    : 'bg-green-600 text-white'
                }`}
              >
                {data.type === TransactionType.EXPENSE ? 'Expense' : 'Income'}
              </button>
           </div>
           <div className="relative inline-block">
             <span className="absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 text-2xl text-gray-400 font-light pr-2">¥</span>
             <input
               type="number"
               value={data.amount}
               onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
               className="text-5xl font-bold bg-transparent text-center w-40 outline-none text-gray-900 placeholder-gray-300"
             />
           </div>
        </div>

        <div className="p-6 space-y-4">
          
          {/* Note */}
          <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl">
            <FileText className="w-5 h-5 text-gray-400" />
            <input 
              type="text" 
              value={data.note}
              onChange={(e) => handleChange('note', e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-800 font-medium"
              placeholder="What was this?"
            />
          </div>

          {/* Date */}
          <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-xl">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input 
              type="date" 
              value={data.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="flex-1 bg-transparent outline-none text-gray-800 font-medium"
            />
          </div>

          {/* Category Selection */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center space-x-2 text-gray-400 text-sm pl-1">
              <Tag className="w-4 h-4" />
              <span>Category</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {DEFAULT_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleChange('category', cat)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    data.category === cat 
                      ? 'bg-black text-white shadow-md transform scale-105' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            ref={confirmBtnRef}
            onClick={() => onConfirm(data)}
            className="flex-1 py-3 px-4 rounded-xl font-semibold bg-black text-white shadow-lg hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Save
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmationModal;