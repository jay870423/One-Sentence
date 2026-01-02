import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { parseInput } from './services/geminiService';
import { loadTransactions, saveTransactions } from './services/storageService';
import { Transaction, ParseResult, AIProvider } from './types';
import InputSection from './components/InputSection';
import ConfirmationModal from './components/ConfirmationModal';
import TransactionList from './components/TransactionList';
import Calendar from './components/Calendar';

const App: React.FC = () => {
  // Initialize state lazily from storage to prevent overwriting with empty array on first render
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [isParsing, setIsParsing] = useState(false);
  const [provider, setProvider] = useState<AIProvider>('gemini');
  
  const [modalOpen, setModalOpen] = useState(false);
  // Change: Store an array of results instead of a single object
  const [currentParseResults, setCurrentParseResults] = useState<ParseResult[] | null>(null);

  // State for the currently viewed month
  const [viewDate, setViewDate] = useState(new Date());
  
  // State for the specifically selected date (null means show whole month)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  // 1. First, get all transactions for the current viewing MONTH to pass to Calendar (for dots/stats)
  const monthTransactions = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === year && tDate.getMonth() === month;
    });
  }, [transactions, viewDate]);

  // 2. Then, filter for the LIST view. If a specific date is selected, filter further.
  const listTransactions = useMemo(() => {
    if (!selectedDate) return monthTransactions;

    const sYear = selectedDate.getFullYear();
    const sMonth = selectedDate.getMonth();
    const sDay = selectedDate.getDate();

    return monthTransactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getFullYear() === sYear && 
             tDate.getMonth() === sMonth && 
             tDate.getDate() === sDay;
    });
  }, [monthTransactions, selectedDate]);

  const handleParse = async (input: string, selectedProvider: AIProvider) => {
    setIsParsing(true);
    try {
      const results = await parseInput(input, selectedProvider);
      
      if (results && results.length > 0) {
        setCurrentParseResults(results);
        setModalOpen(true);
      } else {
        alert(`[${selectedProvider}] 无法识别该内容，请尝试描述得更具体一些。`);
      }
    } catch (error: any) {
      console.warn(`[${selectedProvider}] Parsing failed:`, error.message);
      const providerName = selectedProvider === 'deepseek' ? 'DeepSeek' : 'Gemini';
      alert(`[${providerName}] 错误: ${error.message || '未知错误，请稍后重试'}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmTransactions = (dataList: ParseResult[]) => {
    const newTransactions: Transaction[] = dataList.map(data => ({
      id: uuidv4(),
      ...data,
      createdAt: Date.now(),
    }));
    
    setTransactions(prev => [...newTransactions, ...prev]);
    setModalOpen(false);
    setCurrentParseResults(null);
    setSelectedDate(null);
    
    // Jump to the date of the first transaction in the batch
    if (newTransactions.length > 0) {
        const transDate = new Date(newTransactions[0].date);
        if (transDate.getMonth() !== viewDate.getMonth() || transDate.getFullYear() !== viewDate.getFullYear()) {
           setViewDate(transDate);
        }
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this record?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handlePrevMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setViewDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
    setSelectedDate(null);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <header className="pt-8 pb-6 md:pt-12 md:pb-8 px-6 text-center">
        <h1 className="text-xl md:text-2xl font-bold tracking-tight">One-Sentence</h1>
      </header>

      <main className="max-w-md md:max-w-6xl mx-auto md:px-6 transition-all duration-300">
        <div className="md:grid md:grid-cols-12 md:gap-12 items-start">
            
            {/* Left Column */}
            <div className="md:col-span-5 lg:col-span-4 md:sticky md:top-8 space-y-6 md:space-y-8">
                <div className="md:bg-gray-50 md:p-8 md:rounded-3xl md:border md:border-gray-100 space-y-8">
                    <InputSection 
                        onParse={handleParse} 
                        isLoading={isParsing} 
                        provider={provider}
                        setProvider={setProvider}
                    />
                    <Calendar 
                        currentDate={viewDate} 
                        onPrevMonth={handlePrevMonth} 
                        onNextMonth={handleNextMonth} 
                        selectedDate={selectedDate}
                        onSelectDate={setSelectedDate}
                        transactions={monthTransactions}
                    />
                </div>
                <div className="hidden md:block text-xs text-center text-gray-400 leading-relaxed">
                    <p>原创微信号：yajie870423</p>
                    <p>谷歌账户：695274107@qq.com</p>
                </div>
            </div>

            {/* Right Column */}
            <div className="md:col-span-7 lg:col-span-8 mt-4 md:mt-0">
                 <TransactionList 
                    transactions={listTransactions} 
                    onDelete={handleDelete} 
                />
            </div>
        </div>
      </main>

      <ConfirmationModal 
        isOpen={modalOpen} 
        initialData={currentParseResults} 
        onConfirm={handleConfirmTransactions} 
        onCancel={() => setModalOpen(false)} 
      />
      
      <footer className="py-8 text-center text-xs text-gray-400 md:hidden">
        <p>原创微信号：yajie870423,谷歌账户：695274107@qq.com</p>
      </footer>
    </div>
  );
};

export default App;