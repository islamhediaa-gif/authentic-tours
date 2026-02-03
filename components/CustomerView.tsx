
import React, { useState, useMemo } from 'react';
import { Plus, Search, Mail, Phone, UserPlus, Trash2, Edit2, Save, X, Users, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { Customer, Supplier, User, Transaction, Currency, JournalEntry, Program } from '../types';

interface CustomerViewProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  deleteCustomer: (id: string) => void;
  suppliers: Supplier[];
  currentUser: User;
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  recordJournalEntry: (desc: string, date: string, lines: any[]) => string;
  currencies: Currency[];
  searchTerm?: string;
  formatCurrency: (amount: number) => string;
  addAuditLog: (action: any, entityType: any, entityId: string, details: string, oldV?: any, newV?: any) => void;
  settings: any;
  programs: Program[];
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
}

const CustomerView: React.FC<CustomerViewProps> = ({ 
  customers, setCustomers, deleteCustomer, suppliers, currentUser, 
  transactions, journalEntries, recordJournalEntry, currencies, 
  searchTerm: globalSearchTerm = '', formatCurrency, addAuditLog, settings,
  programs, initialEditingId, onClearInitialEdit
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', openingBalance: '0', openingBalanceCurrency: settings?.baseCurrency || 'EGP' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialEditingId) {
      const customer = (customers || []).find(c => c.id === initialEditingId);
      if (customer) {
        setHighlightedId(customer.id);
        setTimeout(() => {
          const element = document.getElementById(`customer-${customer.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 500);
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, customers, onClearInitialEdit]);

  const toggleSelectAll = () => {
    if (selectedIds.length === (filtered || []).length) {
      setSelectedIds([]);
    } else {
      setSelectedIds((filtered || []).map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} من العملاء المحددين؟`)) {
      selectedIds.forEach(id => deleteCustomer(id));
      setSelectedIds([]);
    }
  };

  const effectiveSearchTerm = globalSearchTerm || searchTerm;

  const calculatedBalances = useMemo(() => {
    const balances: Record<string, { base: number, original: number }> = {};
    (customers || []).forEach(c => {
      if (!c?.id) return;
      balances[c.id] = { 
        base: c.openingBalanceInBase || 0,
        original: c.openingBalance || 0
      };
    });

    (journalEntries || []).forEach(entry => {
      if (!entry?.lines) return;
      (entry.lines || []).forEach(line => {
        if (!line?.accountId) return;
        if (line.accountType === 'CUSTOMER' && balances[line.accountId] !== undefined) {
          balances[line.accountId].base += (line.debit || 0) - (line.credit || 0);
          
          const customer = (customers || []).find(c => c && c.id === line.accountId);
          if (customer && line.currencyCode === customer.openingBalanceCurrency) {
            const sign = (line.debit || 0) > 0 ? 1 : -1;
            balances[line.accountId].original += (line.originalAmount || 0) * sign;
          }
        }
      });
    });

    // تصحيح: تصفير الرصيد المحلي إذا كان الرصيد بالعملة الأصلية صفراً (لتجنب فروق التقييم الوهمية)
    (customers || []).forEach(c => {
      if (c.openingBalanceCurrency !== settings?.baseCurrency && Math.abs(balances[c.id]?.original || 0) < 0.01) {
        if (balances[c.id]) balances[c.id].base = 0;
      }
    });

    return balances;
  }, [customers, journalEntries, settings?.baseCurrency]);

  const stats = useMemo(() => {
    const total = (customers || []).length;
    const receivables = (customers || []).reduce((sum, c) => {
      const bal = calculatedBalances[c.id]?.base || 0;
      return sum + (bal > 0 ? bal : 0);
    }, 0);
    const payables = (customers || []).reduce((sum, c) => {
      const bal = calculatedBalances[c.id]?.base || 0;
      return sum + (bal < 0 ? Math.abs(bal) : 0);
    }, 0);
    const activeLastMonth = (customers || []).filter(c => 
      (transactions || []).some(t => t && t.relatedEntityId === c.id && t.date && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    ).length;
    return { total, receivables, payables, activeLastMonth };
  }, [customers, transactions, calculatedBalances]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const ob = parseFloat(formData.openingBalance) || 0;
    const currency = (currencies || []).find(c => c.code === formData.openingBalanceCurrency) || (currencies && currencies[0]) || { rateToMain: 1 };
    const obInBase = ob * (currency.rateToMain || 1);
    console.log('CustomerView: handleSave called', { isEditing, editingId, formData, ob, obInBase });

    if (isEditing && editingId) {
      if ((customers || []).some(c => c.id !== editingId && c.name === formData.name)) {
        alert('اسم العميل موجود مسبقاً، يرجى اختيار اسم مختلف');
        return;
      }
      if ((suppliers || []).some(s => s.company === formData.name)) {
        alert('هذا الاسم موجود كمورد، يرجى اختيار اسم مختلف أو عمل مقاصة إذا لزم الأمر');
        return;
      }
      const oldCustomer = (customers || []).find(c => c.id === editingId);
      if (!oldCustomer) return;

      setCustomers(prev => (prev || []).map(c => {
        if (c.id === editingId) {
          const updated = {
            ...c,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            openingBalance: ob,
            openingBalanceCurrency: formData.openingBalanceCurrency,
            openingBalanceInBase: obInBase
          };
          addAuditLog('UPDATE', 'CUSTOMER', editingId, `تعديل بيانات العميل: ${formData.name}`, oldCustomer, updated);
          return updated;
        }
        return c;
      }));
      const balanceDiff = obInBase - (oldCustomer.openingBalanceInBase || 0);
      const originalAmountDiff = ob - (oldCustomer.openingBalance || 0);
      if (balanceDiff !== 0 || originalAmountDiff !== 0) {
        recordJournalEntry(
          `تعديل رصيد أول المدة للعميل ${formData.name}`,
          new Date().toISOString().split('T')[0],
          [{
            accountId: editingId,
            accountType: 'CUSTOMER',
            accountName: formData.name,
            debit: balanceDiff > 0 ? balanceDiff : 0,
            credit: balanceDiff < 0 ? -balanceDiff : 0,
            originalAmount: Math.abs(originalAmountDiff),
            currencyCode: formData.openingBalanceCurrency
          }]
        );
      }
      setIsEditing(false);
      setEditingId(null);
    } else {
       if ((customers || []).some(c => c.name === formData.name)) {
         alert('اسم العميل موجود مسبقاً، يرجى اختيار اسم مختلف');
         return;
       }
       if ((suppliers || []).some(s => s.company === formData.name)) {
         alert('هذا الاسم موجود كمورد، يرجى اختيار اسم مختلف أو عمل مقاصة إذا لزم الأمر');
         return;
       }
       const newCustomer: Customer = {
         id: Date.now().toString(),
         name: formData.name,
         phone: formData.phone,
         email: formData.email,
         openingBalance: ob,
         openingBalanceCurrency: formData.openingBalanceCurrency,
         openingBalanceInBase: obInBase,
         balance: obInBase,
         currencyBalance: ob
       };
       setCustomers(prev => [...prev, newCustomer]);
       addAuditLog('CREATE', 'CUSTOMER', newCustomer.id, `إضافة عميل جديد: ${newCustomer.name}`, undefined, newCustomer);
     }

    setFormData({ name: '', phone: '', email: '', openingBalance: '0', openingBalanceCurrency: settings?.baseCurrency || 'EGP' });
    setShowAdd(false);
  };

  const startEdit = (customer: Customer) => {
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      openingBalance: (customer.openingBalance || 0).toString(),
      openingBalanceCurrency: customer.openingBalanceCurrency || 'EGP'
    });
    setEditingId(customer.id);
    setIsEditing(true);
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelAction = () => {
    setShowAdd(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', email: '', openingBalance: '0', openingBalanceCurrency: settings?.baseCurrency || 'EGP' });
  };



  const filtered = (customers || []).filter(c => {
    const s = (effectiveSearchTerm || '').toLowerCase();
    return (
      (c.name || '').toLowerCase().includes(s) || 
      (c.phone || '').toLowerCase().includes(s) ||
      (c.email && c.email.toLowerCase().includes(s))
    );
  });

  const viewTransactions = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowTransactions(true);
  };

  const customerMovements = useMemo(() => {
    if (!selectedCustomerId) return [];
    
    const movements: any[] = [];
    (journalEntries || []).forEach(entry => {
      (entry.lines || []).forEach(line => {
        if (line.accountId === selectedCustomerId && line.accountType === 'CUSTOMER') {
          movements.push({
            id: `${entry.id}-${line.id}`,
            date: entry.date,
            description: entry.description,
            refNo: entry.refNo,
            debit: line.debit,
            credit: line.credit,
            amount: line.originalAmount || (line.debit || line.credit),
            currencyCode: line.currencyCode || settings?.baseCurrency,
            programId: line.programId,
            componentId: line.componentId
          });
        }
      });
    });
    
    return movements.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [selectedCustomerId, journalEntries, settings?.baseCurrency]);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي العملاء</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">مستحقات (مدين)</p>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(stats.receivables || 0)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">مقدمات (دائن)</p>
            <p className="text-2xl font-bold text-rose-600 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(stats.payables || 0)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">نشط مؤخراً</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.activeLastMonth}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-8">
        <div className="relative flex-1 max-w-2xl group">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="بحث في سجل العملاء..." 
            className="w-full pr-14 pl-10 py-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none font-bold text-sm shadow-sm transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {!showAdd && (
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && currentUser.role === 'ADMIN' && (
              <button 
                onClick={handleBulkDelete}
                className="bg-rose-50 text-rose-600 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-rose-100 transition-all shadow-sm active:scale-95"
              >
                <Trash2 size={18} />
                حذف المحدد ({selectedIds.length})
              </button>
            )}
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-md active:scale-95"
            >
              <UserPlus size={18} />
              إضافة عميل جديد
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {isEditing ? 'تعديل بيانات العميل' : 'تسجيل عميل جديد'}
              </h3>
            </div>
            <button onClick={cancelAction} className="text-slate-400 hover:text-rose-500 transition-all bg-slate-50 hover:bg-rose-50 p-2 rounded-xl">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">الاسم بالكامل</label>
               <input 
                  required 
                  placeholder="اسم العميل..."
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
               />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">رقم الهاتف</label>
               <input 
                  placeholder="01xxxxxxxxx"
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
               />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">رصيد البداية</label>
               <div className="relative group">
                 <input
                    type="number"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-center text-slate-900 transition-all focus:bg-white"
                    value={formData.openingBalance}
                    onChange={e => setFormData({...formData, openingBalance: e.target.value})}
                 />
                 <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <select
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-[10px] outline-none focus:border-indigo-600 transition-all shadow-sm cursor-pointer"
                      value={formData.openingBalanceCurrency}
                      onChange={e => setFormData({...formData, openingBalanceCurrency: e.target.value})}
                    >
                      {(currencies || []).map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                 </div>
               </div>
            </div>
            
            <div className="lg:col-span-3 flex flex-col gap-2">
               <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">البريد الإلكتروني (اختياري)</label>
               <input 
                  type="email" 
                  placeholder="customer@example.com"
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
               />
            </div>

            <div className="lg:col-span-3 flex justify-end gap-4 mt-6 pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={cancelAction} 
                className="px-6 py-2.5 text-slate-400 font-bold text-sm hover:text-rose-600 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
              >
                {isEditing ? <Save size={18} /> : <Plus size={18} />}
                {isEditing ? 'تحديث البيانات' : 'حفظ البيانات'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {currentUser?.role === 'ADMIN' && (
                  <th className="px-6 py-4 text-center w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={(filtered || []).length > 0 && selectedIds.length === (filtered || []).length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">ملف العميل</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الرصيد الافتتاحي</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">الوضعية المالية</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(filtered || []).map(customer => (
                <tr 
                  key={customer.id} 
                  id={`customer-${customer.id}`}
                  className={`hover:bg-slate-50 bg-opacity-50 transition-all group ${highlightedId === customer.id ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/30 scale-[1.002] z-10 shadow-2xl' : selectedIds.includes(customer.id) ? 'bg-indigo-50 bg-opacity-30' : ''}`}
                >
                  {currentUser?.role === 'ADMIN' && (
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedIds.includes(customer.id)}
                        onChange={() => toggleSelect(customer.id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-bold text-sm group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                        {(customer.name || '').charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-sm text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{customer.name}</p>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mt-1">
                          {customer.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-300" /> {customer.phone}</span>}
                          {customer.email && <span className="flex items-center gap-1.5"><Mail size={12} className="text-slate-300" /> {customer.email}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-600">
                        {isHidden ? '****' : (customer.openingBalance || 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                        {(currencies || []).find(c => c && c.code === customer.openingBalanceCurrency)?.code || 'EGP'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      const bal = calculatedBalances[customer.id] || { base: 0, original: 0 };
                      const isPositive = bal.base >= 0;
                      return (
                        <div className={`inline-flex flex-col items-end px-4 py-2 rounded-2xl border ${isPositive ? 'bg-emerald-50 bg-opacity-30 border-emerald-100 text-emerald-700' : 'bg-rose-50 bg-opacity-30 border-rose-100 text-rose-700'}`}>
                          <span className="text-sm font-bold tracking-tight">
                            {isHidden ? '****' : formatCurrency(Math.abs(bal.base))}
                          </span>
                          {customer.openingBalanceCurrency !== 'EGP' && Math.abs(bal.original) > 0.01 && (
                            <span className="text-[10px] font-bold opacity-80 border-t border-current mt-1 pt-0.5">
                               {isHidden ? '****' : Math.abs(bal.original).toLocaleString()} {customer.openingBalanceCurrency}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                            <span className="text-[9px] font-bold uppercase tracking-tight opacity-70">
                              {isPositive ? 'مدين' : 'دائن'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => viewTransactions(customer.id)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="كشف حساب"
                      >
                        <Activity size={16} />
                      </button>
                      {currentUser?.role === 'ADMIN' && (
                        <>
                          <button
                            onClick={() => startEdit(customer)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                            title="تعديل"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => deleteCustomer(customer.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                            title="حذف"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-dashed border-slate-200">
              <UserPlus size={40} className="text-slate-200" />
            </div>
            <h4 className="text-lg font-bold text-slate-400 mb-1">لا توجد سجلات مطابقة</h4>
            <p className="text-slate-300 font-bold text-sm">جرّب استخدام كلمات بحث مختلفة</p>
          </div>
        )}
      </div>

      {showTransactions && selectedCustomerId && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 bg-opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg">
                   <Activity size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">كشف حساب العميل</h3>
                  <p className="text-slate-500 font-medium text-sm">{(customers || []).find(c => c.id === selectedCustomerId)?.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTransactions(false)} 
                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 p-2.5 rounded-2xl transition-all"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-8 overflow-y-auto max-h-[70vh]">
              {(customerMovements || []).length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                   <Activity size={48} className="text-slate-200 mb-4" />
                   <p className="text-slate-400 font-bold">لا توجد عمليات لهذا العميل حتى الآن</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-100">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-24">التاريخ</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-28">المرجع</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">البيان</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">المبلغ</th>
                        <th className="p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">النوع</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(customerMovements || []).slice(0, 50).map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 bg-opacity-50 transition-all group">
                          <td className="p-4 text-xs font-bold text-slate-400">{m.date}</td>
                          <td className="p-4">
                            {m.refNo && (
                              <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black border border-indigo-100">
                                {m.refNo}
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700">
                            <div>{m.description}</div>
                            {m.componentId && (
                              <div className="text-[10px] text-indigo-500 mt-1 flex items-center gap-1">
                                <Activity size={10} />
                                {(() => {
                                  const program = (programs || []).find(p => p && p.id === m.programId);
                                  const component = program?.components?.find(c => c && c.id === m.componentId);
                                  return component?.name || 'مكون غير معروف';
                                })()}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-left">
                            <span className={`font-bold ${m.credit > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatCurrency(m.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400 mr-1">{m.currencyCode}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${m.credit > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {m.credit > 0 ? 'دفع/دائن' : 'فاتورة/مدين'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerView;
