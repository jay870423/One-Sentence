import React, { useState, useEffect, useRef } from 'react';
import { ParseResult, TransactionType, DEFAULT_CATEGORIES } from '../types';
import { Check, Calendar, Tag, FileText, Trash2, Layers } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  initialData: ParseResult[] | null;
  onConfirm: (data: ParseResult[]) => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ isOpen, initialData, onConfirm, onCancel }) => {
  const [items, setItems] = useState<ParseResult[]>([]);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (initialData) {
      setItems(JSON.parse(JSON.stringify(initialData))); // Deep copy
    }
  }, [initialData]);

  // Focus confirm button when opened
  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
        setTimeout(() => confirmBtnRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen || items.length === 0) return null;

  const isBulk = items.length > 1;

  const handleSingleChange = (field: keyof ParseResult, value: any) => {
    setItems(prev => {
        const newItem = { ...prev[0], [field]: value };
        return [newItem];
    });
  };

  const handleBulkChange = (index: number, field: keyof ParseResult, value: any) => {
    setItems(prev => {
        const newItems = [...prev];
        newItems[index] = { ...newItems[index], [field]: value };
        return newItems;
    });
  };

  const toggleSingleType = () => {
    const currentType = items[0].type;
    handleSingleChange('type', currentType === TransactionType.EXPENSE ? TransactionType.INCOME : TransactionType.EXPENSE);
  };

  const removeBulkItem = (index: number) => {
      setItems(prev => prev.filter((_, i) => i !== index));
      if (items.length <= 1) {
          // If only 0 items left, maybe close? Or just stay empty (handled by items.length check)
          // If 1 item left, it will naturally re-render as Single mode because isBulk will be false
      }
  };

  // --- RENDER SINGLE MODE (Original Design) ---
  if (!isBulk) {
    const data = items[0];
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm transition-all">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Header / Amount Input */}
          <div className={`p-6 text-center ${data.type === TransactionType.EXPENSE ? 'bg-gray-50' : 'bg-green-50'}`}>
             <div className="flex items-center justify-center space-x-2 mb-2">
                <button 
                  onClick={toggleSingleType}
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
                 onChange={(e) => handleSingleChange('amount', parseFloat(e.target.value) || 0)}
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
                onChange={(e) => handleSingleChange('note', e.target.value)}
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
                onChange={(e) => handleSingleChange('date', e.target.value)}
                className="flex-1 bg-transparent outline-none text-gray-800 font-medium"
              />
            </div>
            {/* Category */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2 text-gray-400 text-sm pl-1">
                <Tag className="w-4 h-4" />
                <span>Category</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleSingleChange('category', cat)}
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
            <button onClick={onCancel} className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-500 hover:bg-gray-50 transition-colors">Cancel</button>
            <button 
              ref={confirmBtnRef}
              onClick={() => onConfirm(items)}
              className="flex-1 py-3 px-4 rounded-xl font-semibold bg-black text-white shadow-lg hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER BULK MODE (List) ---
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm transition-all">
        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-gray-800">Batch Add ({items.length})</h3>
                </div>
                <button onClick={onCancel} className="text-sm text-gray-400 hover:text-gray-600 px-2">
                    Cancel
                </button>
            </div>

            {/* Scrollable List */}
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
                {items.map((item, idx) => (
                    <div key={idx} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm hover:border-gray-300 transition-all group relative">
                        {/* Remove Button */}
                        <button 
                            onClick={() => removeBulkItem(idx)}
                            className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex flex-col gap-3">
                            {/* Top Row: Date & Category */}
                            <div className="flex gap-2">
                                <input 
                                    type="date"
                                    value={item.date}
                                    onChange={(e) => handleBulkChange(idx, 'date', e.target.value)}
                                    className="text-xs bg-gray-50 border-none rounded-md px-2 py-1 text-gray-600 w-auto"
                                />
                                <select 
                                    value={item.category}
                                    onChange={(e) => handleBulkChange(idx, 'category', e.target.value)}
                                    className="text-xs bg-gray-50 border-none rounded-md px-2 py-1 text-gray-600 flex-1 cursor-pointer"
                                >
                                    {DEFAULT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>

                            {/* Middle Row: Note */}
                            <input 
                                type="text" 
                                value={item.note}
                                onChange={(e) => handleBulkChange(idx, 'note', e.target.value)}
                                className="font-medium text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-300 w-full"
                                placeholder="Note"
                            />

                            {/* Bottom Row: Amount & Type */}
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-1">
                                    <span className="text-gray-400">¥</span>
                                    <input 
                                        type="number" 
                                        value={item.amount}
                                        onChange={(e) => handleBulkChange(idx, 'amount', parseFloat(e.target.value) || 0)}
                                        className={`font-bold text-lg w-24 border-none p-0 focus:ring-0 ${
                                            item.type === TransactionType.EXPENSE ? 'text-gray-900' : 'text-green-600'
                                        }`}
                                    />
                                </div>
                                <button 
                                    onClick={() => handleBulkChange(idx, 'type', item.type === TransactionType.EXPENSE ? TransactionType.INCOME : TransactionType.EXPENSE)}
                                    className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${
                                        item.type === TransactionType.EXPENSE ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'
                                    }`}
                                >
                                    {item.type === TransactionType.EXPENSE ? 'EXP' : 'INC'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <button 
                    ref={confirmBtnRef}
                    onClick={() => onConfirm(items)}
                    className="w-full py-3 px-4 rounded-xl font-semibold bg-black text-white shadow-lg hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Check className="w-5 h-5" />
                    Save All ({items.length})
                </button>
            </div>
        </div>
    </div>
  );
};

export default ConfirmationModal;