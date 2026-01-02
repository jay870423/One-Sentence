import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { Trash2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

const TransactionList: React.FC<TransactionListProps> = ({ transactions, onDelete }) => {
  
  // Calculate stats for the passed transactions (Parent handles filtering by month now)
  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach(t => {
      if (t.type === TransactionType.INCOME) {
        income += t.amount;
      } else {
        expense += t.amount;
      }
    });

    const balance = income - expense;

    return { income, expense, balance };
  }, [transactions]);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: Transaction[] } = {};
    transactions.forEach(t => {
      if (!groups[t.date]) groups[t.date] = [];
      groups[t.date].push(t);
    });
    // Sort dates desc
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [transactions]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return '今天'; // Localized "Today"
    
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
  };

  return (
    <div className="w-full px-4 md:px-0 pb-20 md:pb-8">
      
      {/* Monthly Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">收入 (Income)</p>
          <p className="text-lg font-bold text-green-600 truncate">+¥{stats.income.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">支出 (Expense)</p>
          <p className="text-lg font-bold text-gray-900 truncate">-¥{stats.expense.toFixed(2)}</p>
        </div>
        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col justify-between">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">结余 (Balance)</p>
          <p className={`text-lg font-bold truncate ${stats.balance >= 0 ? 'text-gray-900' : 'text-red-500'}`}>
            {stats.balance >= 0 ? '' : ''}¥{stats.balance.toFixed(2)}
          </p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-6">
        {groupedTransactions.map(([date, items]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-gray-400 mb-3 ml-1 sticky top-0 bg-white/90 backdrop-blur-sm py-2 z-10 flex justify-between items-center">
              <span>{formatDate(date)}</span>
              <span className="text-xs font-normal bg-gray-100 px-2 py-1 rounded-md text-gray-500">
                支: ¥{items.filter(i => i.type === TransactionType.EXPENSE).reduce((acc, c) => acc + c.amount, 0).toFixed(2)}
              </span>
            </h3>
            <div className="space-y-2">
              {items.map((t) => (
                <div key={t.id} className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${
                      t.type === TransactionType.EXPENSE ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'
                    }`}>
                      {t.category.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <p className="font-semibold text-gray-900 break-words whitespace-pre-wrap leading-snug">
                        {t.note}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{t.category}</p>
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center gap-3 pl-3 flex-shrink-0">
                     <span className={`font-bold tabular-nums whitespace-nowrap ${
                      t.type === TransactionType.EXPENSE ? 'text-gray-900' : 'text-green-600'
                    }`}>
                       {t.type === TransactionType.INCOME ? '+' : ''}
                       {t.amount.toFixed(2)}
                     </span>
                     <button 
                      onClick={() => onDelete(t.id)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-lg"
                      aria-label="Delete"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-12 opacity-40">
            <p className="text-gray-500 font-medium text-sm">暂无记录</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionList;