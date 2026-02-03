import React, { useState, useMemo } from 'react';
import { Plus, Search, Phone, Truck, MoreVertical, Building, Trash2, Edit2, Save, X, FileText, TrendingUp, TrendingDown, Activity, Package } from 'lucide-react';
import { Supplier, Customer, User, Transaction, Currency, JournalEntry, Program } from '../types';

interface SupplierViewProps {
  suppliers: Supplier[];
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  deleteSupplier: (id: string) => void;
  customers: Customer[];
  currentUser: User;
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  recordJournalEntry: (desc: string, date: string, lines: any[]) => string;
  currencies: Currency[];
  searchTerm?: string;
  formatCurrency: (amount: number) => string;
  addAuditLog: (action: any, entityType: any, entityId: string, details: string, oldV?: any, newV?: any) => void;
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
  settings: any;
  programs: Program[];
}

const SupplierView: React.FC<SupplierViewProps> = ({ 
  suppliers, setSuppliers, deleteSupplier, customers, currentUser, 
  transactions, journalEntries, recordJournalEntry, currencies, 
  searchTerm: globalSearchTerm = '', formatCurrency, addAuditLog,
  initialEditingId, onClearInitialEdit, settings, programs
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', phone: '', company: '', openingBalance: '0', openingBalanceCurrency: 'EGP', isSaudiWallet: false, visaQuota: '0' });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(s => s.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} من الموردين المحددين؟`)) {
      selectedIds.forEach(id => deleteSupplier(id));
      setSelectedIds([]);
    }
  };
  const [showSaudiWalletsOnly, setShowSaudiWalletsOnly] = useState(false);

  const effectiveSearchTerm = globalSearchTerm || searchTerm;
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialEditingId) {
      const supplier = suppliers.find(s => s.id === initialEditingId);
      if (supplier) {
        setHighlightedId(supplier.id);
        setTimeout(() => {
          const element = document.getElementById(`supplier-${supplier.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 500);
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, suppliers, onClearInitialEdit]);

  const calculatedBalances = useMemo(() => {
    const balances: Record<string, { base: number, original: number }> = {};
    (suppliers || []).forEach(s => {
      if (!s?.id) return;
      balances[s.id] = { 
        base: s.openingBalanceInBase || 0,
        original: s.openingBalance || 0
      };
    });

    (journalEntries || []).forEach(entry => {
      if (!entry?.lines) return;
      (entry.lines || []).forEach(line => {
        if (!line?.accountId) return;
        if (line.accountType === 'SUPPLIER' && balances[line.accountId] !== undefined) {
          balances[line.accountId].base += (line.credit || 0) - (line.debit || 0);
          
          const supplier = (suppliers || []).find(s => s && s.id === line.accountId);
          if (supplier && line.currencyCode === supplier.openingBalanceCurrency) {
            const sign = (line.credit || 0) > 0 ? 1 : -1;
            balances[line.accountId].original += (line.originalAmount || 0) * sign;
          }
        }
      });
    });

    (suppliers || []).forEach(s => {
      if (s?.id && s.openingBalanceCurrency !== (settings?.baseCurrency || 'EGP') && Math.abs(balances[s.id]?.original || 0) < 0.01) {
        if (balances[s.id]) balances[s.id].base = 0;
      }
    });

    return balances;
  }, [suppliers, journalEntries, settings?.baseCurrency]);

  const stats = useMemo(() => {
    const total = (suppliers || []).length;
    const payables = (suppliers || []).reduce((sum, s) => {
      const bal = (calculatedBalances[s?.id || ''] || {}).base || 0;
      return sum + (bal > 0 ? bal : 0);
    }, 0);
    const receivables = (suppliers || []).reduce((sum, s) => {
      const bal = (calculatedBalances[s?.id || ''] || {}).base || 0;
      return sum + (bal < 0 ? Math.abs(bal) : 0);
    }, 0);
    const activeLastMonth = (suppliers || []).filter(s => {
      if (!s?.id) return false;
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      return (transactions || []).some(t => {
        if (!t?.date) return false;
        const txDate = new Date(t.date).getTime();
        return (t.supplierId === s.id || t.relatedEntityId === s.id) && txDate > thirtyDaysAgo;
      });
    }).length;
    return { total, payables, receivables, activeLastMonth };
  }, [suppliers, transactions, calculatedBalances]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const ob = parseFloat(formData.openingBalance) || 0;
    const currency = (currencies || []).find(c => c?.code === formData.openingBalanceCurrency) || (currencies && currencies[0]) || { rateToMain: 1 };
    const obInBase = ob * (currency.rateToMain || 1);

    if (isEditing && editingId) {
      if ((suppliers || []).some(s => s?.id !== editingId && s?.company === formData.company)) {
        alert('اسم الشركة موجود مسبقاً، يرجى اختيار اسم مختلف');
        return;
      }
      if ((customers || []).some(c => c?.name === formData.company)) {
        alert('هذا الاسم موجود كعميل، يرجى اختيار اسم مختلف أو عمل مقاصة إذا لزم الأمر');
        return;
      }
      const oldSupplier = (suppliers || []).find(s => s?.id === editingId);
      if (!oldSupplier) return;

      setSuppliers(prev => (prev || []).map(s => {
        if (s?.id === editingId) {
          const updated = {
            ...s,
            name: formData.name,
            phone: formData.phone,
            company: formData.company,
            openingBalance: ob,
            openingBalanceCurrency: formData.openingBalanceCurrency,
            openingBalanceInBase: obInBase,
            isSaudiWallet: formData.isSaudiWallet,
            visaQuota: formData.isSaudiWallet ? (parseInt(formData.visaQuota) || 0) : undefined
          };
          addAuditLog('UPDATE', 'SUPPLIER', editingId, `تعديل بيانات المورد: ${formData.company}`, oldSupplier, updated);
          return updated;
        }
        return s;
      }));
      const balanceDiff = obInBase - (oldSupplier.openingBalanceInBase || 0);
      const originalAmountDiff = ob - (oldSupplier.openingBalance || 0);
      if (balanceDiff !== 0 || originalAmountDiff !== 0) {
        recordJournalEntry(
          `تعديل رصيد أول المدة للمورد ${formData.company}`,
          new Date().toISOString().split('T')[0],
          [{
            accountId: editingId,
            accountType: 'SUPPLIER',
            accountName: formData.company,
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
      if ((suppliers || []).some(s => s.company === formData.company)) {
        alert('اسم الشركة موجود مسبقاً، يرجى اختيار اسم مختلف');
        return;
      }
      if ((customers || []).some(c => c.name === formData.company)) {
        alert('هذا الاسم موجود كعميل، يرجى اختيار اسم مختلف أو عمل مقاصة إذا لزم الأمر');
        return;
      }
      const newSupplier: Supplier = {
        id: Date.now().toString(),
        name: formData.name,
        phone: formData.phone,
        company: formData.company,
        openingBalance: ob,
        openingBalanceCurrency: formData.openingBalanceCurrency,
        openingBalanceInBase: obInBase,
        isSaudiWallet: formData.isSaudiWallet,
        visaQuota: formData.isSaudiWallet ? parseInt(formData.visaQuota) : undefined,
        balance: obInBase,
        currencyBalance: ob
      };
      setSuppliers(prev => [...prev, newSupplier]);
      addAuditLog('CREATE', 'SUPPLIER', newSupplier.id, `إضافة مورد جديد: ${newSupplier.company}`, undefined, newSupplier);
    }

    setFormData({ name: '', phone: '', company: '', openingBalance: '0', openingBalanceCurrency: 'EGP', isSaudiWallet: false, visaQuota: '0' });
    setShowAdd(false);
  };

  const startEdit = (supplier: Supplier) => {
    setFormData({
      name: supplier.name,
      phone: supplier.phone,
      company: supplier.company,
      openingBalance: supplier.openingBalance.toString(),
      openingBalanceCurrency: supplier.openingBalanceCurrency || 'EGP',
      isSaudiWallet: !!supplier.isSaudiWallet,
      visaQuota: (supplier.visaQuota || 0).toString()
    });
    setEditingId(supplier.id);
    setIsEditing(true);
    setShowAdd(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelAction = () => {
    setShowAdd(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({ name: '', phone: '', company: '', openingBalance: '0', openingBalanceCurrency: 'EGP', isSaudiWallet: false, visaQuota: '0' });
  };

  const filtered = (suppliers || []).filter(s => {
    if (!s) return false;
    const term = (effectiveSearchTerm || '').toLowerCase();
    const matchesSearch = (
      (s.name || '').toLowerCase().includes(term) ||
      (s.company || '').toLowerCase().includes(term) ||
      (s.phone || '').toLowerCase().includes(term)
    );
    const matchesSaudiFilter = showSaudiWalletsOnly ? s.isSaudiWallet : true;
    return matchesSearch && matchesSaudiFilter;
  });

  const viewTransactions = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setShowTransactions(true);
  };

  const supplierMovements = useMemo(() => {
    if (!selectedSupplierId) return [];
    
    const movements: any[] = [];
    (journalEntries || []).forEach(entry => {
      if (entry && entry.lines) {
        (entry.lines || []).forEach(line => {
          if (line && line.accountId === selectedSupplierId && line.accountType === 'SUPPLIER') {
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
      }
    });
    
    return movements.sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (isNaN(dateA) || isNaN(dateB)) return 0;
      return dateB - dateA;
    });
  }, [selectedSupplierId, journalEntries, settings?.baseCurrency]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي الموردين</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
            <TrendingDown size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">مستحقات (دائن)</p>
            <p className="text-2xl font-bold text-rose-600 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(stats.payables || 0)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">دفعات مقدمة (مدين)</p>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(stats.receivables || 0)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
          <div className="w-14 h-14 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">نشط مؤخراً</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.activeLastMonth}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative flex-1 max-w-2xl group">
          <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="بحث في الموردين..." 
            className="w-full pr-14 pl-10 py-4 bg-white border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500 ring-opacity-5 outline-none font-bold text-sm shadow-sm transition-all placeholder:text-slate-400"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
          <button 
            onClick={() => setShowSaudiWalletsOnly(false)}
            className={`px-8 py-2.5 rounded-xl font-bold text-xs transition-all ${!showSaudiWalletsOnly ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
          >
            الكل
          </button>
          <button 
            onClick={() => setShowSaudiWalletsOnly(true)}
            className={`px-8 py-2.5 rounded-xl font-bold text-xs transition-all ${showSaudiWalletsOnly ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-indigo-600'}`}
          >
            المحافظ السعودية
          </button>
        </div>
        {!showAdd && (
          <div className="flex items-center gap-3">
            {selectedIds.length > 0 && currentUser.role === 'ADMIN' && (
              <button 
                onClick={handleBulkDelete}
                className="bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 hover:bg-rose-100 transition-all shadow-sm active:scale-95"
              >
                <Trash2 size={18} />
                حذف المحدد ({selectedIds.length})
              </button>
            )}
            <button 
              onClick={() => setShowAdd(true)}
              className="bg-slate-900 text-indigo-400 px-8 py-4 rounded-2xl font-bold text-sm flex items-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
            >
              <Plus size={18} />
              إضافة مورد جديد
            </button>
          </div>
        )}
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 bg-opacity-5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 bg-indigo-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {isEditing ? 'تعديل بيانات المورد' : 'تسجيل مورد جديد'}
              </h3>
            </div>
            <button onClick={cancelAction} className="text-slate-400 hover:text-rose-500 transition-all bg-slate-50 hover:bg-rose-50 p-2.5 rounded-xl">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative z-10">
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-slate-500 ml-1">اسم الشركة</label>
               <input 
                  type="text" 
                  placeholder="الاسم التجاري" 
                  required
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-sm text-slate-900 transition-all" 
                  value={formData.company}
                  onChange={e => setFormData({...formData, company: e.target.value})}
                />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-slate-500 ml-1">جهة الاتصال</label>
               <input 
                  type="text" 
                  placeholder="اسم المسؤول" 
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-sm text-slate-900 transition-all" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-slate-500 ml-1">رقم الهاتف</label>
               <input 
                  type="text" 
                  placeholder="أرقام التواصل" 
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-sm text-slate-900 transition-all" 
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
            </div>
            <div className="flex flex-col gap-2">
               <label className="text-xs font-bold text-slate-500 ml-1">رصيد أول المدة</label>
               <div className="relative group">
                 <input
                    type="number"
                    placeholder="0"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white outline-none font-bold text-sm text-center text-slate-900 transition-all"
                    value={formData.openingBalance}
                    onChange={e => setFormData({...formData, openingBalance: e.target.value})}
                 />
                 <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    <select
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 font-bold text-[10px] outline-none focus:border-indigo-500 transition-all shadow-sm cursor-pointer"
                      value={formData.openingBalanceCurrency}
                      onChange={e => setFormData({...formData, openingBalanceCurrency: e.target.value})}
                    >
                      {(currencies || []).map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                    </select>
                 </div>
               </div>
            </div>
            <div className="flex items-end pb-0.5">
              <label className="flex items-center gap-3 cursor-pointer group bg-slate-50 p-3 rounded-xl border border-slate-200 w-full hover:border-indigo-500 transition-all">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  checked={formData.isSaudiWallet}
                  onChange={e => setFormData({...formData, isSaudiWallet: e.target.checked})}
                />
                <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">محفظة سعودية</span>
              </label>
            </div>
            {formData.isSaudiWallet && (
              <div className="lg:col-span-5 flex flex-col gap-2 animate-in slide-in-from-left-2 duration-300">
                <label className="text-xs font-bold text-slate-500 ml-1 uppercase tracking-widest">كوتة التأشيرات</label>
                <input 
                  type="number" 
                  placeholder="0"
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white w-48"
                  value={formData.visaQuota}
                  onChange={e => setFormData({...formData, visaQuota: e.target.value})}
                />
              </div>
            )}
            <div className="lg:col-span-5 flex justify-end gap-4 mt-6 pt-6 border-t border-slate-100">
              <button 
                type="button" 
                onClick={cancelAction} 
                className="px-8 py-2.5 text-slate-400 font-bold text-sm hover:text-rose-600 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="bg-slate-900 text-indigo-400 px-10 py-3 rounded-xl font-bold text-sm shadow-xl hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95"
              >
                {isEditing ? <Save size={18} /> : <Plus size={18} />}
                {isEditing ? 'تحديث البيانات' : 'حفظ البيانات'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {currentUser?.role === 'ADMIN' && (
                  <th className="px-6 py-5 text-center w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={(filtered || []).length > 0 && selectedIds.length === (filtered || []).length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">المورد / الشركة</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">الرصيد الافتتاحي</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">كوتا التأشيرات</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">الوضعية المالية</th>
                <th className="px-6 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(filtered || []).map(supplier => (
                <tr 
                  key={supplier.id} 
                  id={`supplier-${supplier.id}`}
                  className={`hover:bg-slate-50 bg-opacity-50 transition-all group ${highlightedId === supplier.id ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/30 scale-[1.002] z-10 shadow-2xl' : selectedIds.includes(supplier.id) ? 'bg-indigo-50 bg-opacity-30' : ''}`}
                >
                  {currentUser?.role === 'ADMIN' && (
                    <td className="px-6 py-5 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedIds.includes(supplier.id)}
                        onChange={() => toggleSelect(supplier.id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-slate-900 group-hover:text-indigo-400 transition-all duration-300">
                        {(supplier.company || '').charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight">{supplier.company}</p>
                          {supplier.isSaudiWallet && (
                            <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase">محفظة</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mt-1">
                          <span className="flex items-center gap-1.5"><Building size={12} className="text-slate-300" /> {supplier.name}</span>
                          {supplier.phone && <span className="flex items-center gap-1.5"><Phone size={12} className="text-slate-300" /> {supplier.phone}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-bold text-slate-700">
                        {isHidden ? '****' : (supplier.openingBalance || 0).toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight mt-0.5">
                        {(currencies || []).find(c => c.code === supplier.openingBalanceCurrency)?.code || 'EGP'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {supplier.isSaudiWallet ? (
                      <div className="flex flex-col items-center gap-2">
                        {(() => {
                          const used = (transactions || []).filter(t => !t.isVoided && (t.supplierId === supplier.id || t.relatedEntityId === supplier.id) && (t.category === 'HAJJ' || t.category === 'UMRAH')).reduce((sum, t) => sum + (t.adultCount || 0) + (t.childCount || 0), 0);
                          const quota = supplier.visaQuota || 0;
                          const remaining = quota - used;
                          const percent = quota > 0 ? (used * (1 / quota)) * 100 : 0;
                          
                          return (
                            <>
                              <span className={`text-[10px] font-bold px-3 py-1 rounded-lg ${remaining <= 0 ? 'bg-rose-50 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {used} / {quota}
                              </span>
                              <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all duration-1000 ${percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-indigo-600'}`} 
                                  style={{ width: `${Math.min(100, percent)}%` }}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : (
                      <span className="text-slate-200 text-xs font-bold italic">---</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    {(() => {
                      const bal = calculatedBalances[supplier.id] || { base: 0, original: 0 };
                      const isPositive = bal.base > 0;
                      const isNegative = bal.base < 0;
                      
                      return (
                        <div className={`inline-flex flex-col items-end px-5 py-2.5 rounded-2xl border ${isPositive ? 'bg-rose-50 bg-opacity-50 border-rose-100 text-rose-700' : isNegative ? 'bg-emerald-50 bg-opacity-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 bg-opacity-50 border-slate-100 text-slate-400'}`}>
                          <span className="text-base font-bold tracking-tight">
                            {isHidden ? '****' : formatCurrency(Math.abs(bal.base))}
                          </span>
                          {supplier.openingBalanceCurrency !== 'EGP' && Math.abs(bal.original) > 0.01 && (
                            <span className="text-[10px] font-bold opacity-80 border-t border-current mt-1 pt-0.5">
                               {isHidden ? '****' : Math.abs(bal.original).toLocaleString()} {supplier.openingBalanceCurrency}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${isPositive ? 'bg-rose-500' : isNegative ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                            <span className="text-[9px] font-bold uppercase tracking-tight opacity-70">
                              {isPositive ? 'مستحق له' : isNegative ? 'دفعات مقدمة' : 'خالص الرصيد'}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => viewTransactions(supplier.id)}
                        className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                        title="كشف حساب"
                      >
                        <FileText size={18} />
                      </button>
                      {currentUser?.role === 'ADMIN' && (
                        <>
                          <button
                            onClick={() => startEdit(supplier)}
                            className="p-2.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                            title="تعديل"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteSupplier(supplier.id)}
                            className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="حذف"
                          >
                            <Trash2 size={18} />
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
              <Truck size={40} className="text-slate-200" />
            </div>
            <h4 className="text-lg font-bold text-slate-400 mb-1">لا توجد سجلات مطابقة</h4>
            <p className="text-slate-300 font-bold text-sm">جرّب استخدام كلمات بحث مختلفة</p>
          </div>
        )}
      </div>

      {showTransactions && selectedSupplierId && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50 bg-opacity-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg">
                   <FileText size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">كشف حساب المورد</h3>
                  <p className="text-slate-500 font-medium text-sm">{(suppliers || []).find(s => s.id === selectedSupplierId)?.company}</p>
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
              {(supplierMovements || []).length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                   <Activity size={48} className="text-slate-200 mb-4" />
                   <p className="text-slate-400 font-bold">لا توجد عمليات لهذا المورد حتى الآن</p>
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
                      {(supplierMovements || []).slice(0, 50).map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 bg-opacity-50 transition-all group">
                          <td className="p-4 text-xs font-bold text-slate-400">{m.date}</td>
                          <td className="p-4">
                            {m.refNo && (
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(m.refNo);
                                  const btn = document.getElementById(`ref-sup-${m.id}`);
                                  if (btn) {
                                    const originalText = btn.innerText;
                                    btn.innerText = 'تم النسخ';
                                    setTimeout(() => { btn.innerText = originalText; }, 1000);
                                  }
                                }}
                                id={`ref-sup-${m.id}`}
                                className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black border border-indigo-100 hover:bg-indigo-100 transition-all"
                                title="اضغط للنسخ والبحث"
                              >
                                {m.refNo}
                              </button>
                            )}
                          </td>
                          <td className="p-4 text-sm font-bold text-slate-700">
                            <div>{m.description}</div>
                            {m.componentId && (
                              <div className="text-[10px] text-indigo-500 mt-1 flex items-center gap-1">
                                <Package size={10} />
                                {(() => {
                                  const program = (programs || []).find(p => p.id === m.programId);
                                  const component = program?.components?.find(c => c.id === m.componentId);
                                  return component?.name || 'مكون غير معروف';
                                })()}
                              </div>
                            )}
                          </td>
                          <td className="p-4 font-bold text-slate-900">
                            <span className={m.credit > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                              {isHidden ? '****' : formatCurrency(m.amount)}
                            </span>
                            <span className="text-[10px] text-slate-400 mr-1">{m.currencyCode}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${m.credit > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                              {m.credit > 0 ? 'دائن' : 'مدين'}
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

export default SupplierView;
