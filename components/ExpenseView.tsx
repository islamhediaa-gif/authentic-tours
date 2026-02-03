
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, BadgePercent, Wallet, Receipt, UserX, AlertTriangle, User, Edit2, Globe } from 'lucide-react';
import { Transaction, Treasury, Customer, User as UserType, Program, MasterTrip, CostCenter, JournalEntry, CompanySettings, Currency } from '../types';
import SearchableSelect from './SearchableSelect';
import { EXPENSE_CATEGORIES } from '../constants';

interface ExpenseViewProps {
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => void;
  updateTransaction: (id: string, tx: any) => void;
  deleteTransaction: (id: string) => void;
  treasuries: Treasury[];
  customers: Customer[];
  programs: Program[];
  masterTrips: MasterTrip[];
  currentUser: UserType;
  searchTerm?: string;
  formatCurrency: (amount: number) => string;
  costCenters: CostCenter[];
  enableCostCenters?: boolean;
  currencies: Currency[];
  settings: CompanySettings;
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
}

const ExpenseView: React.FC<ExpenseViewProps> = ({ 
  transactions, 
  journalEntries,
  addTransaction, 
  updateTransaction, 
  deleteTransaction, 
  treasuries, 
  customers, 
  programs,
  masterTrips,
  currentUser, 
  searchTerm = '',
  formatCurrency,
  costCenters,
  enableCostCenters,
  currencies,
  settings,
  initialEditingId,
  onClearInitialEdit
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const calculatedBalances = useMemo(() => {
    const cust: Record<string, number> = {};
    const treas: Record<string, number> = {};

    (customers || []).forEach(c => {
      if (c?.id) cust[c.id] = c.openingBalanceInBase || 0;
    });
    (treasuries || []).forEach(t => {
      if (t?.id) treas[t.id] = t.openingBalance || 0;
    });

    (journalEntries || []).forEach(entry => {
      if (!entry?.lines) return;
      (entry.lines || []).forEach(line => {
        if (!line?.accountId) return;
        if (line.accountType === 'CUSTOMER' && cust[line.accountId] !== undefined) {
          cust[line.accountId] += (line.debit || 0) - (line.credit || 0);
        } else if (line.accountType === 'TREASURY' && treas[line.accountId] !== undefined) {
          treas[line.accountId] += (line.debit || 0) - (line.credit || 0);
        }
      });
    });

    return { customers: cust, treasuries: treas };
  }, [customers, treasuries, journalEntries]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const filtered = (transactions || [])
    .filter(t => t?.category === 'EXPENSE_GEN' || t?.category === 'DOUBTFUL_DEBT')
    .filter(t => {
      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        (t?.description || '').toLowerCase().includes(s) ||
        (t?.refNo || '').toLowerCase().includes(s) ||
        (t?.expenseCategory || '').toLowerCase().includes(s)
      );
    });

  useEffect(() => {
    if (initialEditingId) {
      const tx = (transactions || []).find(t => t?.id === initialEditingId);
      if (tx) {
        setHighlightedId(tx.id);
        setTimeout(() => {
          const element = document.getElementById(`expense-${tx.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 500);
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, transactions, onClearInitialEdit]);

  const toggleSelectAll = () => {
    const currentFiltered = filtered || [];
    if (selectedIds.length === currentFiltered.length && currentFiltered.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentFiltered.map(tx => tx.id).filter(Boolean));
    }
  };

  const toggleSelect = (id: string) => {
    if (!id) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} من العمليات المحددة؟`)) {
      (selectedIds || []).forEach(id => {
        if (id) deleteTransaction(id);
      });
      setSelectedIds([]);
    }
  };
  const [isDoubtfulMode, setIsDoubtfulMode] = useState(false);
  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0] || '',
    description: '',
    amount: '',
    currencyCode: settings?.baseCurrency || 'EGP',
    exchangeRate: '1',
    treasuryId: (treasuries || [])[0]?.id || '',
    customerId: '',
    programId: '',
    masterTripId: '',
    date: new Date().toISOString().split('T')[0],
    costCenterId: ''
  });

  const selectedCustomer = (customers || []).find(c => c?.id === formData.customerId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    const rate = parseFloat(formData.exchangeRate) || 1;
    const amountInBase = amountNum * rate;

    let payload: any;
    if (isDoubtfulMode) {
      if (!selectedCustomer) return;
      const currentBalance = (calculatedBalances.customers || {})[selectedCustomer.id] || 0;
      if (amountInBase > currentBalance && !editingId) {
        if (!confirm('تنبيه: المبلغ المدخل أكبر من مديونية العميل الحالية. هل تريد الاستمرار؟')) return;
      }
      
      payload = {
        description: `إعدام دين مشكوك فيه: للعميل ${selectedCustomer.name || 'غير معروف'}`,
        amount: amountNum,
        amountInBase: amountInBase,
        currencyCode: formData.currencyCode || settings?.baseCurrency || 'EGP',
        exchangeRate: rate,
        type: 'EXPENSE',
        category: 'DOUBTFUL_DEBT',
        date: formData.date || new Date().toISOString().split('T')[0],
        relatedEntityId: formData.customerId,
        relatedEntityType: 'CUSTOMER'
      };
    } else {
      payload = {
        description: (formData.description || '').includes(': ') ? formData.description : `${formData.category}: ${formData.description}`,
        amount: amountNum,
        amountInBase: amountInBase,
        currencyCode: formData.currencyCode || settings?.baseCurrency || 'EGP',
        exchangeRate: rate,
        type: 'EXPENSE',
        category: 'EXPENSE_GEN',
        expenseCategory: formData.category,
        date: formData.date || new Date().toISOString().split('T')[0],
        treasuryId: formData.treasuryId,
        programId: formData.programId || undefined,
        masterTripId: formData.masterTripId || undefined,
        costCenterId: formData.costCenterId || undefined
      };
    }

    if (editingId) {
      updateTransaction(editingId, payload);
    } else {
      addTransaction(payload);
    }

    setFormData({ ...formData, description: '', amount: '', customerId: '', programId: '', masterTripId: '', costCenterId: '' });
    setShowAdd(false);
    setEditingId(null);
  };

  const startEdit = (tx: Transaction) => {
    if (!tx) return;
    setEditingId(tx.id);
    setIsDoubtfulMode(tx.category === 'DOUBTFUL_DEBT');
    setFormData({
      category: tx.expenseCategory || EXPENSE_CATEGORIES[0] || '',
      description: (tx.description || '').includes(': ') ? tx.description.split(': ')[1] : (tx.description || ''),
      amount: (tx.amount || 0).toString(),
      currencyCode: tx.currencyCode || settings?.baseCurrency || 'EGP',
      exchangeRate: tx.exchangeRate?.toString() || '1',
      treasuryId: tx.treasuryId || (treasuries || [])[0]?.id || '',
      customerId: tx.relatedEntityId || '',
      programId: tx.programId || '',
      masterTripId: tx.masterTripId || '',
      costCenterId: tx.costCenterId || '',
      date: tx.date || new Date().toISOString().split('T')[0]
    });
    setShowAdd(true);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 transition-transform duration-500">
             <BadgePercent size={24} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">المصروفات والديون</h2>
            <p className="text-indigo-600 text-opacity-70 font-bold text-xs mt-1 uppercase tracking-widest">إدارة التكاليف والالتزامات المالية</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {selectedIds.length > 0 && currentUser.role === 'ADMIN' && (
            <button 
              onClick={handleBulkDelete}
              className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-sm hover:bg-rose-100 transition-all duration-300 transform active:scale-95"
            >
              <Trash2 size={20} />
              <div className="text-right">
                <span className="block text-[10px] opacity-70">إجراء جماعي</span>
                <span className="text-sm">حذف المحدد ({selectedIds.length})</span>
              </div>
            </button>
          )}
          <button 
            onClick={() => { setIsDoubtfulMode(true); setShowAdd(true); }}
            className="group bg-rose-900 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-sm hover:bg-rose-800 transition-all duration-300 transform active:scale-95"
          >
            <UserX size={20} className="text-rose-200" />
            <div className="text-right">
              <span className="block text-[10px] opacity-70 uppercase tracking-widest font-black">ديون معدومة</span>
              <span className="text-sm">إعدام دين</span>
            </div>
          </button>
          <button 
            onClick={() => { setIsDoubtfulMode(false); setShowAdd(true); }}
            className="group bg-rose-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 shadow-sm hover:bg-rose-700 transition-all duration-300 transform active:scale-95"
          >
            <Plus size={20} />
            <div className="text-right">
              <span className="block text-[10px] opacity-70 uppercase tracking-widest font-black">تسجيل مالي</span>
              <span className="text-sm">إضافة مصروف</span>
            </div>
          </button>
        </div>
      </div>

      {showAdd && (
        <div className={`bg-white p-8 rounded-3xl border-b-8 ${isDoubtfulMode ? 'border-rose-900' : 'border-rose-600'} shadow-xl animate-in fade-in zoom-in duration-300`}>
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${isDoubtfulMode ? 'bg-rose-900 text-rose-200' : 'bg-rose-600 text-white'}`}>
                {isDoubtfulMode ? <AlertTriangle size={20} /> : <Receipt size={20} />}
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {isDoubtfulMode ? 'معالجة دين مشكوك في تحصيله' : 'تسجيل مصروف تشغيلي جديد'}
              </h3>
            </div>
            <button 
              onClick={() => setShowAdd(false)} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-rose-600 hover:text-white transition-all duration-300"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {!isDoubtfulMode ? (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 px-1">بند المصروف</label>
                <select 
                  className="p-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 ring-opacity-20 border border-slate-200 focus:border-rose-500 transition-all"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value})}
                >
                  {(EXPENSE_CATEGORIES || []).map(c => <option key={c} value={c} className="text-slate-900 bg-white font-bold">{c}</option>)}
                </select>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 px-1">العميل المتعثر</label>
                <select 
                  required
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 ring-opacity-20 focus:border-slate-900 transition-all"
                  value={formData.customerId}
                  onChange={e => setFormData({...formData, customerId: e.target.value})}
                >
                  <option value="" className="text-slate-400 bg-white">-- اختر العميل --</option>
                  {(customers || []).filter(c => c && (calculatedBalances.customers[c.id] || 0) > 0).map(c => (
                    <option key={c.id} value={c.id} className="text-slate-900 bg-white font-bold">{c.name} (مديونية: {isHidden ? '****' : formatCurrency(calculatedBalances.customers[c.id] || 0)})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 px-1">العملة</label>
              <select 
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 ring-opacity-20 focus:border-rose-500 transition-all"
                value={formData.currencyCode}
                onChange={e => {
                  const code = e.target.value;
                  const rate = (currencies || []).find(c => c?.code === code)?.rateToMain || 1;
                  setFormData({...formData, currencyCode: code, exchangeRate: rate.toString()});
                }}
              >
                {(currencies || []).map(c => <option key={c.code} value={c.code} className="font-bold">{c.name} ({c.code})</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 px-1">سعر الصرف</label>
              <input 
                type="number" step="any"
                disabled={formData.currencyCode === (settings?.baseCurrency || 'EGP')}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-center text-slate-900 disabled:opacity-50 transition-all outline-none focus:ring-2 focus:ring-rose-500 ring-opacity-20 focus:border-rose-500"
                value={formData.currencyCode === (settings?.baseCurrency || 'EGP') ? '1' : formData.exchangeRate}
                onChange={e => setFormData({...formData, exchangeRate: e.target.value})}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 px-1">المبلغ بالعملة المختارة</label>
              <div className="relative">
                <input 
                  type="number" required 
                  placeholder={isDoubtfulMode && selectedCustomer ? `الحد الأقصى: ${isHidden ? '****' : formatCurrency(calculatedBalances.customers[selectedCustomer.id] || 0)}` : "0"}
                  className="w-full p-3 bg-slate-50 rounded-xl font-bold text-lg text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 ring-opacity-20 border border-slate-200 focus:border-rose-500 transition-all placeholder:text-slate-300"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-[10px] uppercase tracking-tighter">{formData.currencyCode}</div>
              </div>
              {formData.currencyCode !== (settings?.baseCurrency || 'EGP') && (
                <p className="text-[10px] font-bold text-indigo-600 px-3 mt-1">
                  المبلغ المعادل: {formatCurrency((parseFloat(formData.amount) || 0) * (parseFloat(formData.exchangeRate) || 1))}
                </p>
              )}
              {isDoubtfulMode && selectedCustomer && (
                <p className="text-[10px] font-bold text-amber-600 px-3 flex items-center gap-2 bg-amber-50 py-1.5 rounded-lg mt-1 w-fit"><User size={12}/> رصيد العميل المفتوح: {isHidden ? '****' : formatCurrency(calculatedBalances.customers[selectedCustomer.id] || 0)}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-500 px-1">تاريخ القيد</label>
              <input 
                type="date" required 
                className="p-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 ring-opacity-20 border border-slate-200 focus:border-rose-500 transition-all"
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
              />
            </div>

            {!isDoubtfulMode && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 px-1">مصدر السيولة (الخزينة)</label>
                  <select 
                    className="p-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-rose-500 ring-opacity-20 border border-slate-200 focus:border-rose-500 transition-all"
                    value={formData.treasuryId}
                    onChange={e => setFormData({...formData, treasuryId: e.target.value})}
                  >
                    {(treasuries || []).map(t => (
                      <option key={t.id} value={t.id} className="text-slate-900 bg-white font-bold">
                        {t.type === 'CUSTODY' ? '📦 ' : t.type === 'BANK' ? '🏦 ' : '💰 '}
                        {t.name} ({t.type === 'CUSTODY' ? 'عهدة' : t.type === 'BANK' ? 'بنك' : 'خزينة'}) - {shouldMaskAggregate ? '****' : formatCurrency(calculatedBalances.treasuries[t.id] || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 px-1 flex items-center gap-2"><Globe size={14} className="text-slate-400"/> الارتباط ببرنامج سياحي</label>
                  <SearchableSelect 
                    options={(programs || []).map(p => ({ id: p.id, name: p.name, subtext: p.type }))}
                    value={formData.programId}
                    onChange={(id) => {
                      const prog = (programs || []).find(p => p.id === id);
                      setFormData({
                        ...formData,
                        programId: id,
                        masterTripId: prog?.masterTripId || formData.masterTripId
                      });
                    }}
                    placeholder="اختر البرنامج المستهدف..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-slate-500 px-1 flex items-center gap-2"><Globe size={14} className="text-slate-400"/> الارتباط برحلة كبرى</label>
                  <SearchableSelect 
                    options={(masterTrips || []).map(t => ({ id: t.id, name: t.name, subtext: t.date }))}
                    value={formData.masterTripId}
                    onChange={(id) => setFormData({...formData, masterTripId: id})}
                    placeholder="اختر الرحلة..."
                  />
                </div>

                {enableCostCenters && (
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-bold text-amber-600 px-1 flex items-center gap-2"><BadgePercent size={14}/> مركز التكلفة التحليلي</label>
                    <select 
                      className="p-3 bg-amber-50 bg-opacity-50 border border-amber-100 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 ring-opacity-20 focus:border-amber-500 transition-all"
                      value={formData.costCenterId}
                      onChange={e => setFormData({...formData, costCenterId: e.target.value})}
                    >
                      <option value="" className="text-slate-400 bg-white font-bold">-- بدون مركز تكلفة --</option>
                      {(costCenters || []).filter(cc => cc && cc.isActive).map(cc => (
                        <option key={cc.id} value={cc.id} className="text-slate-900 bg-white font-bold">{cc.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-500 px-1">وصف العملية / ملاحظات إضافية</label>
              <input 
                required 
                placeholder={isDoubtfulMode ? "برجاء توضيح سبب إعدام الدين وتفاصيل العميل..." : "تفاصيل المصروف التشغيلي..."}
                className="p-3 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none placeholder:text-slate-300 border border-slate-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-500 ring-opacity-20 transition-all"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-4 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setShowAdd(false)} className="px-6 py-2 text-slate-400 font-bold hover:text-rose-600 transition-colors text-xs">إلغاء العملية</button>
              <button type="submit" className={`${isDoubtfulMode ? 'bg-slate-900 shadow-lg shadow-slate-200' : 'bg-rose-600 shadow-lg shadow-rose-200'} text-white px-10 py-3 rounded-2xl font-bold hover:scale-[1.02] active:scale-95 transition-all duration-300`}>
                {isDoubtfulMode ? 'تأكيد إعدام الدين' : 'حفظ المصروف النهائي'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                {currentUser.role === 'ADMIN' && (
                  <th className="px-6 py-4 text-center w-10">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={(filtered || []).length > 0 && selectedIds.length === (filtered || []).length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest">المرجع</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right">التاريخ</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-right">تفاصيل العملية والفئة</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center">التصنيف المحاسبي</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-left">المبلغ الصافي</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-center">تحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(filtered || []).map(tx => (
                <tr 
                  key={tx.id} 
                  id={`expense-${tx.id}`}
                  className={`hover:bg-slate-50 group transition-all duration-300 ${highlightedId === tx.id ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/30 scale-[1.002] z-10 shadow-2xl' : selectedIds.includes(tx.id) ? 'bg-indigo-50 bg-opacity-30' : ''}`}
                >
                  {currentUser.role === 'ADMIN' && (
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        checked={selectedIds.includes(tx.id)}
                        onChange={() => toggleSelect(tx.id)}
                      />
                    </td>
                  )}
                  <td className="px-6 py-4">
                    {tx.refNo ? (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tx.refNo);
                          const btn = document.getElementById(`ref-exp-${tx.id}`);
                          if (btn) {
                            const originalText = btn.innerText;
                            btn.innerText = 'تم النسخ';
                            setTimeout(() => { btn.innerText = originalText; }, 1000);
                          }
                        }}
                        id={`ref-exp-${tx.id}`}
                        className="text-rose-600 text-[10px] font-bold font-mono bg-rose-50 px-2 py-1 rounded-md border border-rose-100 hover:bg-rose-100 transition-all"
                        title="اضغط للنسخ والبحث"
                      >
                        #{tx.refNo}
                      </button>
                    ) : (
                      <span className="text-rose-600 text-[10px] font-bold font-mono bg-rose-50 px-2 py-1 rounded-md">
                        #{(tx.id || '').slice(-6).toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-slate-500 text-xs font-bold">
                      {tx.date ? new Date(tx.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{tx.description || ''}</p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase bg-slate-100 px-2 py-0.5 rounded-md tracking-widest">{tx.expenseCategory || 'دين معدوم'}</span>
                      {tx.programId && (
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 flex items-center gap-1 font-bold uppercase tracking-widest">
                          <Globe size={10}/> {(programs || []).find(p => p?.id === tx.programId)?.name || 'برنامج محذوف'}
                        </span>
                      )}
                      {tx.masterTripId && (
                        <span className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-md border border-amber-100 flex items-center gap-1 font-bold uppercase tracking-widest">
                          <Globe size={10}/> {(masterTrips || []).find(t => t?.id === tx.masterTripId)?.name || 'رحلة محذوفة'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${tx.category === 'DOUBTFUL_DEBT' ? 'bg-amber-100 text-amber-800' : 'bg-rose-50 text-rose-600'}`}>
                        {tx.category === 'DOUBTFUL_DEBT' ? 'دين مشكوك فيه' : 'مصروف تشغيلي'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-left">
                    <p className="text-xl font-bold text-rose-600 tracking-tight tabular-nums">
                      {tx.category === 'DOUBTFUL_DEBT' 
                        ? (isHidden ? '****' : formatCurrency(tx.amountInBase || tx.amount || 0))
                        : (shouldMaskAggregate ? '****' : formatCurrency(tx.amountInBase || tx.amount || 0))}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <div className="flex justify-center gap-2">
                       <button onClick={() => startEdit(tx)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-amber-500 hover:text-white transition-all duration-300"><Edit2 size={16}/></button>
                       {currentUser.role === 'ADMIN' && (
                         <button onClick={() => deleteTransaction(tx.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-rose-600 hover:text-white transition-all duration-300"><Trash2 size={16}/></button>
                       )}
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
             <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                <BadgePercent size={32} className="text-slate-200" />
             </div>
             <p className="font-bold text-slate-400 text-sm">سجل المصروفات خالٍ تماماً من العمليات</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpenseView;
