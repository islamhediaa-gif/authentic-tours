
import React, { useState, useMemo } from 'react';
import { LogOut, User, Bell, Search, X, ReceiptText, ZoomIn, ZoomOut, RotateCcw, Truck, FileText, Plane, Globe, History, ArrowRightLeft, BookOpenText, Hotel, RefreshCw, Contact2, Moon, Sun, AlertCircle, CloudUpload, CloudDownload } from 'lucide-react';
import { Customer, Currency, Supplier, Transaction, JournalEntry } from '../types';
import SearchableSelect from './SearchableSelect';
import { Coins } from 'lucide-react';

interface HeaderProps {
  title: string;
  companyName?: string;
  onLogout: () => void;
  onSearch?: (term: string) => void;
  customers: Customer[];
  suppliers: Supplier[];
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  employees: any[];
  onSelectClient?: (id: string) => void;
  onNavigate?: (view: string, id?: string) => void;
  currencies: Currency[];
  displayCurrency: string;
  setDisplayCurrency: (code: string) => void;
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  syncStatus?: 'connected' | 'error' | 'syncing' | 'idle';
  onManualPull?: () => void;
  onManualPush?: () => void;
  alerts?: any[];
}

const Header: React.FC<HeaderProps> = ({ 
  title, companyName, onLogout, onSearch, customers, suppliers, transactions, journalEntries, employees,
  onSelectClient, onNavigate, currencies, displayCurrency, setDisplayCurrency,
  isDarkMode, setIsDarkMode, syncStatus = 'idle', onManualPull, onManualPush, alerts = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const globalResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) return [];
    const s = searchTerm.toLowerCase();

    const results: any[] = [];

    // Search Customers
    customers.forEach(c => {
      if (c.name.toLowerCase().includes(s) || (c.phone && c.phone.includes(s))) {
        results.push({ id: c.id, type: 'CUSTOMER', title: c.name, sub: `عميل - ${c.phone || ''}`, icon: <User size={14}/> });
      }
    });

    // Search Suppliers
    suppliers.forEach(sup => {
      if (sup.company.toLowerCase().includes(s) || (sup.phone && sup.phone.includes(s))) {
        results.push({ id: sup.id, type: 'SUPPLIER', title: sup.company, sub: `مورد - ${sup.phone || ''}`, icon: <Truck size={14}/> });
      }
    });

    // Search Employees
    (employees || []).forEach(emp => {
      if (emp.name.toLowerCase().includes(s) || (emp.phone && emp.phone.includes(s))) {
        results.push({ id: emp.id, type: 'EMPLOYEE', title: emp.name, sub: `موظف - ${emp.position || ''}`, icon: <Contact2 size={14}/> });
      }
    });

    // Search Transactions
    transactions.forEach(t => {
      const amountStr = t.amount?.toString() || '';
      if ((t.refNo && t.refNo.toLowerCase().includes(s)) || (t.description && t.description.toLowerCase().includes(s)) || amountStr.includes(s)) {
        let view = 'DASHBOARD';
        let icon = <ReceiptText size={14}/>;
        
        if (['FLIGHT', 'FLIGHT_REFUND', 'FLIGHT_REISSUE'].includes(t.category)) { view = 'FLIGHTS'; icon = <Plane size={14}/>; }
        else if (['HAJJ', 'UMRAH', 'HAJJ_UMRAH', 'INDIVIDUAL_UMRAH'].includes(t.category) || t.programId) { view = 'HAJJ_UMRAH'; icon = <Globe size={14}/>; }
        else if (['EXPENSE_GEN', 'EXPENSE'].includes(t.category)) { view = 'EXPENSES'; icon = <History size={14}/>; }
        else if (t.category === 'GENERAL_SERVICE') { view = 'SERVICES'; icon = <ArrowRightLeft size={14}/>; }
        else if (['CASH', 'TRANSFER', 'RECEIPT', 'PAYMENT'].includes(t.category)) { view = 'TREASURY'; icon = <Coins size={14}/>; }
        else if (t.category === 'ACCOUNT_CLEARING') { view = 'CLEARING'; icon = <RefreshCw size={14}/>; }
        else if (['CLEARING', 'DOUBTFUL_DEBT'].includes(t.category)) { view = 'JOURNAL'; icon = <BookOpenText size={14}/>; }
        else if (t.category === 'ACCOMMODATION') { view = 'ACCOMMODATION'; icon = <Hotel size={14}/>; }
        else if (t.category === 'EMPLOYEE_ADVANCE') { view = 'EMPLOYEES'; icon = <Contact2 size={14}/>; }

        results.push({ 
          id: t.id, 
          type: 'TRANSACTION', 
          view,
          title: t.refNo || t.description, 
          sub: `${t.amount} ${t.currencyCode} - ${t.description} - ${t.date}`, 
          icon 
        });
      }
    });

    // Search Journal Entries
    journalEntries.forEach(je => {
      const totalStr = je.lines.reduce((acc, l) => acc + (l.debit || 0), 0).toString();
      if ((je.refNo && je.refNo.toLowerCase().includes(s)) || (je.description && je.description.toLowerCase().includes(s)) || totalStr.includes(s)) {
        results.push({ 
          id: je.id, 
          type: 'JOURNAL', 
          view: 'JOURNAL',
          title: je.refNo || je.description, 
          sub: `قيد محاسبي (${totalStr}) - ${je.date}`, 
          icon: <BookOpenText size={14}/> 
        });
      }
    });

    return results.slice(0, 8);
  }, [searchTerm, customers, suppliers, transactions, journalEntries]);

  const handleResultClick = (result: any) => {
    if (result.type === 'CUSTOMER') {
      onSelectClient?.(result.id);
    } else if (result.type === 'SUPPLIER') {
      onNavigate?.('SUPPLIERS', result.id);
    } else if (result.type === 'EMPLOYEE') {
      onNavigate?.('EMPLOYEES', result.id);
    } else if (result.type === 'TRANSACTION') {
      onNavigate?.(result.view, result.id);
    } else if (result.type === 'JOURNAL') {
      onNavigate?.('JOURNAL', result.id);
    }
    setSearchTerm('');
    setShowResults(false);
  };

  const handleZoomIn = () => {
    if ((window as any).require) {
      const { webFrame } = (window as any).require('electron');
      const currentZoom = webFrame.getZoomFactor();
      webFrame.setZoomFactor(currentZoom + 0.1);
    }
  };

  const handleZoomOut = () => {
    if ((window as any).require) {
      const { webFrame } = (window as any).require('electron');
      const currentZoom = webFrame.getZoomFactor();
      webFrame.setZoomFactor(Math.max(0.5, currentZoom - 0.1));
    }
  };

  const handleResetZoom = () => {
    if ((window as any).require) {
      const { webFrame } = (window as any).require('electron');
      webFrame.setZoomFactor(1);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <header className="h-20 flex items-center justify-between px-8 z-[60] border-b border-slate-200 dark:border-slate-800 no-print sticky top-0 glass-panel dark:bg-slate-900/80">
      <div className="flex items-center gap-10">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
             <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">{title}</h2>
             <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">النظام يعمل بكفاءة</p>
             </div>
          </div>
        </div>
        
        <div className="hidden lg:flex items-center gap-4 relative group">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors duration-300" size={16} />
            <input 
              id="global-search-input"
              type="text" 
              placeholder="بحث شامل (رقم مرجع، عميل، مورد)..." 
              className="bg-slate-100 dark:bg-slate-800 bg-opacity-50 dark:bg-opacity-50 pr-12 pl-10 py-2.5 rounded-xl border border-transparent focus:border-indigo-500 border-opacity-30 focus:bg-white dark:focus:bg-slate-800 focus:shadow-sm outline-none w-80 transition-all duration-300 text-xs font-bold dark:text-white"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200) /* delay to allow click */}
            />
            {searchTerm && (
              <button onClick={() => {setSearchTerm(''); setShowResults(false);}} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 transition-colors">
                 <X size={14} />
              </button>
            )}

            {showResults && globalResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                <div className="p-2 border-b border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2">نتائج البحث الشامل</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {globalResults.map((res: any, idx: number) => (
                    <button
                      key={`${res.type}-${res.id}-${idx}`}
                      onClick={() => handleResultClick(res)}
                      className="w-full text-right p-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors flex items-center gap-3 group border-b border-slate-50 dark:border-slate-700 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-400 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        {res.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-slate-900 dark:text-slate-200 truncate group-hover:text-indigo-600 transition-colors">{res.title}</p>
                        <p className="text-[9px] text-slate-400 font-bold truncate">{res.sub}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 bg-opacity-50 p-1 rounded-xl border border-indigo-100 dark:border-indigo-800 border-opacity-50">
            <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center shadow-sm">
              <ReceiptText size={16} />
            </div>
            <SearchableSelect
              options={customers.map(c => ({ id: c.id, name: c.name, subtext: `كشف حساب العميل` }))}
              value=""
              onChange={(id) => onSelectClient && onSelectClient(id)}
              placeholder="استخراج حركة عميل..."
              className="w-64 !shadow-none dark:bg-transparent dark:text-white"
            />
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
           <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
             <button 
               onClick={() => onManualPush?.()}
               disabled={syncStatus === 'syncing'}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold ${
                 syncStatus === 'syncing' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-600 hover:text-white text-indigo-600'
               }`}
               title="دفع البيانات للسحابة (Upload)"
             >
               <CloudUpload size={14} className={syncStatus === 'syncing' ? 'animate-pulse' : ''} />
               <span className="hidden sm:inline">دفع سحابي</span>
             </button>
             
             <div className="w-px h-4 bg-slate-200 dark:bg-slate-700"></div>

             <button 
               onClick={onManualPull}
               disabled={syncStatus === 'syncing'}
               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all text-[10px] font-bold ${
                 syncStatus === 'syncing' ? 'opacity-50 cursor-not-allowed' : 'hover:bg-emerald-600 hover:text-white text-emerald-600'
               }`}
               title="سحب البيانات من السحابة (Download)"
             >
               <CloudDownload size={14} className={syncStatus === 'syncing' ? 'animate-pulse' : ''} />
               <span className="hidden sm:inline">سحب سحابي</span>
             </button>
           </div>

           <button 
             onClick={() => setIsDarkMode(!isDarkMode)}
             className="text-slate-400 hover:text-indigo-600 transition-all p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-2xl group"
             title={isDarkMode ? 'الوضع المضيء' : 'الوضع الليلي'}
           >
             {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
           </button>
           
           <div className="relative">
             <button 
               onClick={() => setShowNotifications(!showNotifications)}
               className="text-slate-400 hover:text-indigo-600 transition-all p-2.5 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-2xl group relative"
               title="التنبيهات"
             >
               <Bell size={18} className={alerts.length > 0 ? "animate-swing" : "group-hover:rotate-12 transition-transform"}/>
               {alerts.length > 0 && (
                 <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
               )}
             </button>

             {showNotifications && (
               <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                 <div className="p-4 border-b border-slate-50 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">التنبيهات الذكية</h3>
                    <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{alerts.length} تنبيه</span>
                 </div>
                 <div className="max-h-96 overflow-y-auto">
                   {alerts.length === 0 ? (
                     <div className="p-8 text-center">
                        <Bell size={32} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-[11px] text-slate-400 font-bold">لا توجد تنبيهات حالياً</p>
                     </div>
                   ) : (
                     alerts.map((alert, idx) => (
                       <div key={idx} className="p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors cursor-default">
                         <div className="flex gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                             alert.type === 'danger' ? 'bg-rose-100 text-rose-600' : 
                             alert.type === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'
                           }`}>
                             <AlertCircle size={16} />
                           </div>
                           <div className="min-w-0">
                             <p className="text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-tight mb-1">{alert.msg}</p>
                             <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{alert.details}</p>
                           </div>
                         </div>
                       </div>
                     ))
                   )}
                 </div>
                 {alerts.length > 0 && (
                   <div className="p-3 text-center bg-slate-50/30 dark:bg-slate-900/30">
                      <p className="text-[9px] text-slate-400 font-bold">تنبيهات النظام التلقائية</p>
                   </div>
                 )}
               </div>
             )}
           </div>
        </div>
        
        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 bg-opacity-60"></div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 bg-opacity-50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 border-opacity-50">
          <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shadow-sm">
            <Coins size={16} />
          </div>
          <select 
            value={displayCurrency} 
            onChange={(e) => setDisplayCurrency(e.target.value)}
            className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-900 dark:text-white pr-2 pl-1 cursor-pointer"
          >
            {currencies.map(c => (
              <option key={c.code} value={c.code} className="dark:bg-slate-900">{c.code} ({c.symbol})</option>
            ))}
          </select>
        </div>
        
        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 bg-opacity-60"></div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 bg-opacity-50 p-1 rounded-xl border border-slate-200 dark:border-slate-700 border-opacity-50">
          <button 
            onClick={handleZoomIn}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all"
            title="تكبير"
          >
            <ZoomIn size={16} />
          </button>
          <button 
            onClick={handleResetZoom}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all"
            title="إعادة الضبط"
          >
            <RotateCcw size={14} />
          </button>
          <button 
            onClick={handleZoomOut}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-indigo-600 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition-all"
            title="تصغير"
          >
            <ZoomOut size={16} />
          </button>
        </div>
        
        <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 bg-opacity-60"></div>
        
        <div 
          onClick={() => onNavigate?.('PROFILE')}
          className="flex items-center gap-4 group cursor-pointer p-1.5 pr-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition-all duration-300 border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
        >
          <div className="text-right hidden sm:block">
            <p className="text-[11px] font-bold text-slate-900 dark:text-white leading-none">{companyName || 'إدارة النظام'}</p>
            <p className="text-[9px] text-indigo-600 font-bold mt-1 uppercase tracking-widest">النسخة الاحترافية</p>
          </div>
          <div className="w-10 h-10 bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 p-2 rounded-lg border border-slate-300 dark:border-slate-600 border-opacity-50 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
            <User size={18} className="text-slate-600 dark:text-slate-300" />
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="flex items-center justify-center w-10 h-10 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group border border-transparent hover:border-rose-100 dark:hover:border-rose-800"
          title="تسجيل الخروج"
        >
          <LogOut size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        </button>
      </div>
    </header>
  );
};

export default Header;
