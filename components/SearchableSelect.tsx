import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  subtext?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string, name: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "اختر...", 
  disabled = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [direction, setDirection] = useState<'down' | 'up'>('down');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = useMemo(() => (options || []).find(o => o && o.id === value), [options, value]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return (options || []);
    const s = searchTerm.toLowerCase();
    return (options || []).filter(o => 
      o && ((o.name || '').toLowerCase().includes(s) || 
      (o.subtext && o.subtext.toLowerCase().includes(s)))
    );
  }, [options, searchTerm]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 300) {
        setDirection('up');
      } else {
        setDirection('down');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div 
        className={`w-full p-3 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white flex justify-between items-center cursor-pointer ${disabled ? 'bg-slate-50 dark:bg-slate-900/50 text-slate-500 cursor-not-allowed' : 'focus:border-indigo-600'} ${isOpen ? 'border-indigo-600 shadow-md' : 'shadow-sm'}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <span className={!selectedOption ? 'text-slate-400 dark:text-slate-500' : ''}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <ChevronDown size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''} text-slate-400 dark:text-slate-500`} />
      </div>

      {isOpen && (
        <div className={`absolute z-[100] w-full bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 ${direction === 'up' ? 'bottom-full mb-2 origin-bottom' : 'top-full mt-2 origin-top'}`}>
          <div className="p-3 border-b border-slate-50 dark:border-b-slate-700 bg-slate-50 dark:bg-slate-900 bg-opacity-30">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                autoFocus
                type="text"
                className="w-full pr-10 pl-4 py-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-sm font-bold focus:outline-none focus:border-indigo-600 text-right text-slate-900 dark:text-white"
                dir="rtl"
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.id}
                  className={`p-3 cursor-pointer transition-colors flex flex-col text-right ${value === option.id ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 bg-opacity-50'}`}
                  dir="rtl"
                  onClick={() => {
                    onChange(option.id, option.name);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <span className={`font-bold ${value === option.id ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-900 dark:text-slate-200'}`}>{option.name}</span>
                  {option.subtext && <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{option.subtext}</span>}
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-slate-400 font-bold text-sm">لا توجد نتائج</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
