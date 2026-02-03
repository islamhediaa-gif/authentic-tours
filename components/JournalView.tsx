
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, BookOpenText, Save, Calculator, CheckCircle2, AlertCircle, Calendar, Cpu, Edit2, TrendingUp, Activity, FileText, Layers, X, Copy, Check } from 'lucide-react';
import { JournalEntry, JournalLine, Customer, Supplier, Treasury, User, Currency, CompanySettings, CostCenter, MasterTrip, Program } from '../types';
import { EXPENSE_CATEGORIES, REVENUE_CATEGORIES } from '../constants';
import SearchableSelect from './SearchableSelect';

interface JournalViewProps {
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Omit<JournalEntry, 'id'>) => void;
  customers: Customer[];
  suppliers: Supplier[];
  treasuries: Treasury[];
  employees: any[];
  partners: any[];
  currentUser: User;
  deleteJournalEntry: (id: string) => void;
  editJournalEntry: (id: string, description: string, date: string, lines: Omit<JournalLine, 'id'>[]) => void;
  searchTerm?: string;
  currencies: Currency[];
  settings: CompanySettings;
  costCenters: CostCenter[];
  masterTrips: MasterTrip[];
  programs: Program[];
  enableCostCenters?: boolean;
  formatCurrency: (amount: number) => string;
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
}

const JournalView: React.FC<JournalViewProps> = ({ 
  journalEntries, addJournalEntry, customers, suppliers, treasuries, 
  employees, partners, currentUser, deleteJournalEntry, editJournalEntry, 
  searchTerm = '', currencies, settings, costCenters, masterTrips, programs,
  enableCostCenters, formatCurrency, initialEditingId, onClearInitialEdit 
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const [showAdd, setShowAdd] = useState(false);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [lines, setLines] = useState<Omit<JournalLine, 'id'>[]>([
    { accountId: '', accountType: 'TREASURY', accountName: '', debit: 0, credit: 0, currencyCode: settings.baseCurrency, exchangeRate: 1, originalAmount: 0, programId: '', componentId: '' },
    { accountId: '', accountType: 'EXPENSE', accountName: '', debit: 0, credit: 0, currencyCode: settings.baseCurrency, exchangeRate: 1, originalAmount: 0, programId: '', componentId: '' }
  ]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  useEffect(() => {
    if (initialEditingId) {
      const entry = journalEntries.find(e => e.id === initialEditingId);
      if (entry) {
        // إذا كان قيداً آلياً لا يمكن تعديله، نقوم فقط بتمييزه في القائمة والذهاب إليه
        if (entry.description.includes('سند') || entry.description.includes('حجز') || entry.description.includes('تأشيرة') || entry.description.includes('تسكين') || entry.description.includes('مقاصة')) {
          setHighlightedId(entry.id);
          setTimeout(() => {
            const element = document.getElementById(`journal-entry-${entry.id}`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => setHighlightedId(null), 3000);
            }
          }, 500);
        } else {
          startEdit(entry);
        }
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, journalEntries, onClearInitialEdit]);

  const toggleSelectAll = () => {
    if (selectedIds.length === sortedJournalEntries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(sortedJournalEntries.map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    const manualOnly = selectedIds.filter(id => {
      const entry = journalEntries.find(e => e.id === id);
      return entry && !(entry.description.includes('سند') || entry.description.includes('حجز') || entry.description.includes('تأشيرة'));
    });

    if (manualOnly.length === 0) {
      alert('لا يمكن حذف القيود الآلية جماعياً، يرجى تحديد قيود يدوية فقط');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف ${manualOnly.length} من القيود اليدوية المحددة؟`)) {
      manualOnly.forEach(id => deleteJournalEntry(id));
      setSelectedIds([]);
    }
  };

  const stats = useMemo(() => {
    const entries = journalEntries || [];
    const total = entries.length;
    const totalValue = entries.reduce((s, e) => s + (e?.totalAmount || 0), 0);
    const manual = entries.filter(e => {
      const desc = e?.description || '';
      return !desc.includes('سند') && !desc.includes('حجز') && !desc.includes('تأشيرة');
    }).length;
    const automated = total - manual;
    return { total, totalValue, manual, automated };
  }, [journalEntries]);

  const totals = useMemo(() => {
    return (lines || []).reduce((acc, line) => ({
      debit: acc.debit + (parseFloat(line?.debit as any) || 0),
      credit: acc.credit + (parseFloat(line?.credit as any) || 0)
    }), { debit: 0, credit: 0 });
  }, [lines]);

  const sortedJournalEntries = useMemo(() => {
    return (journalEntries || [])
      .filter(entry => {
        if (!entry) return false;
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (
          (entry.description || '').toLowerCase().includes(s) ||
          (entry.refNo || '').toLowerCase().includes(s) ||
          (entry.lines || []).some(l => (l?.accountName || '').toLowerCase().includes(s))
        );
      })
      .sort((a, b) => (b?.date || '').localeCompare(a?.date || ''));
  }, [journalEntries, searchTerm]);

  const isBalanced = totals.debit === totals.credit && totals.debit > 0;

  const addLine = () => {
    setLines([...lines, { accountId: '', accountType: 'TREASURY', accountName: '', debit: 0, credit: 0, currencyCode: settings.baseCurrency, exchangeRate: 1, originalAmount: 0, programId: '', componentId: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const startEdit = (entry: JournalEntry) => {
    if (!entry) return;
    setEditingId(entry.id);
    setDescription(entry.description || '');
    setDate(entry.date || new Date().toISOString().split('T')[0]);
    setLines((entry.lines || []).map(l => ({ 
      ...l, 
      id: undefined, 
      currencyCode: l?.currencyCode || settings.baseCurrency, 
      exchangeRate: l?.exchangeRate || 1, 
      originalAmount: l?.originalAmount || (parseFloat(l?.debit as any) || parseFloat(l?.credit as any) || 0) 
    })));
    setShowAdd(true);
  };

  const updateLine = (index: number, field: keyof Omit<JournalLine, 'id'>, value: any) => {
    const newLines = [...lines];
    if (!newLines[index]) return;
    
    let line = { ...newLines[index], [field]: value };

    if (field === 'currencyCode') {
      const selectedCurrency = (currencies || []).find(c => c && c.code === value);
      line.exchangeRate = selectedCurrency?.rateToMain || 1;
    }

    // Recalculate based on original amount and rate
    if (field === 'originalAmount' || field === 'exchangeRate' || field === 'currencyCode') {
      const baseAmount = (parseFloat(line.originalAmount as any) || 0) * (parseFloat(line.exchangeRate as any) || 1);
      if ((line.debit || 0) > 0) {
        line.debit = baseAmount;
        line.credit = 0;
      } else if ((line.credit || 0) > 0) {
        line.credit = baseAmount;
        line.debit = 0;
      } else {
        // Default to debit if both are 0
        line.debit = baseAmount;
        line.credit = 0;
      }
    }

    const er = parseFloat(line.exchangeRate as any) || 1;
    const erInv = er !== 0 ? 1 / er : 1;

    if (field === 'debit') {
      line.credit = 0;
      line.originalAmount = (parseFloat(value) || 0) * erInv;
    } else if (field === 'credit') {
      line.debit = 0;
      line.originalAmount = (parseFloat(value) || 0) * erInv;
    }

    if (field === 'accountId' || field === 'accountType') {
      const type = line.accountType;
      const id = line.accountId;
      let name = '';
      if (type === 'TREASURY') name = (treasuries || []).find(t => t && t.id === id)?.name || '';
      else if (type === 'CUSTOMER') name = (customers || []).find(c => c && c.id === id)?.name || '';
      else if (type === 'SUPPLIER') name = (suppliers || []).find(s => s && s.id === id)?.company || '';
      else if (type === 'LIABILITY' || type === 'EMPLOYEE_ADVANCE') name = (employees || []).find(e => e && e.id === id)?.name || '';
      else if (type === 'PARTNER') name = (partners || []).find(p => p && p.id === id)?.name || '';
      else if (type === 'EXPENSE' || type === 'REVENUE') name = id || '';
      line.accountName = name;
    }
    
    newLines[index] = line;
    setLines(newLines);
  };

  const cancelEdit = () => {
    setShowAdd(false);
    setEditingId(null);
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setLines([
      { accountId: '', accountType: 'TREASURY', accountName: '', debit: 0, credit: 0, currencyCode: settings.baseCurrency, exchangeRate: 1, originalAmount: 0, programId: '', componentId: '' },
      { accountId: '', accountType: 'EXPENSE', accountName: '', debit: 0, credit: 0, currencyCode: settings.baseCurrency, exchangeRate: 1, originalAmount: 0, programId: '', componentId: '' }
    ]);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced) return;

    const hasInvalidLines = lines.some(l => !l.accountId);
    if (hasInvalidLines) {
      alert('يرجى اختيار حساب لكل طرف في القيد');
      return;
    }

    if (editingId) {
      editJournalEntry(editingId, description, date, lines);
    } else {
      addJournalEntry({
        date,
        description,
        lines: lines.map((l, i) => ({ ...l, id: i.toString() })),
        totalAmount: totals.debit
      });
    }

    cancelEdit();
  };

  return (
    <div className="space-y-12 pb-20">
      {/* KPI Cards - Premium Look */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Layers size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي القيود</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.total}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">حجم العمليات</p>
            <p className="text-2xl font-bold text-indigo-600 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(stats.totalValue || 0)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-400 to-indigo-500 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">قيود يدوية</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.manual}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-600 to-slate-700 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Cpu size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">قيود مؤتمتة</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.automated}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-100 gap-8 no-print mt-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
             <BookOpenText size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">دفتر اليومية الموحد</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">المحرك المالي وتتبع القيود المزدوجة</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {selectedIds.length > 0 && currentUser.role === 'ADMIN' && (
            <button 
              onClick={handleBulkDelete}
              className="bg-rose-50 text-rose-600 px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-rose-100 transition-all shadow-md active:scale-95"
            >
              <Trash2 size={18} />
              حذف المحدد ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={showAdd ? cancelEdit : () => setShowAdd(true)}
            className={`px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 transition-all shadow-md active:scale-95 ${showAdd ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {showAdd ? <X size={18} /> : <Plus size={18} />}
            {showAdd ? 'إلغاء العملية' : 'إضافة قيد يدوي'}
          </button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSave} className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl space-y-10 animate-in fade-in zoom-in duration-500">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-5">
              <div className="p-4 rounded-2xl bg-indigo-600 text-white shadow-lg">
                <Edit2 size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  {editingId ? 'تعديل القيد اليدوي' : 'تحرير قيد يومية جديد'}
                </h3>
                <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">نموذج الإدخال المحاسبي المزدوج</p>
              </div>
            </div>
            <button 
              onClick={cancelEdit} 
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">البيان / وصف القيد</label>
              <input 
                required placeholder="مثال: تسوية رصيد عهدة / شراء أصول..."
                className="w-full p-4 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-600 ring-opacity-10 border border-slate-200 focus:border-indigo-600 transition-all placeholder:text-slate-300"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">التاريخ</label>
              <div className="relative">
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="date" required 
                  className="w-full p-4 pr-12 bg-slate-50 rounded-xl font-bold text-slate-900 outline-none border border-slate-200 focus:border-slate-900 transition-all"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>
          </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm bg-white">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-right">نوع الحساب</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-right">الحساب المالي التفصيلي</th>
                    {enableCostCenters && <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-right">مركز التكلفة</th>}
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-right">البرنامج والمكون</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-center w-24">العملة</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-center w-28">سعر الصرف</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-center w-36">المبلغ (عملة)</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-center w-36">مدين (+)</th>
                    <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-widest text-center w-36">دائن (-)</th>
                    <th className="px-6 py-5 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, index) => (
                    <tr key={index} className="group hover:bg-slate-50 bg-opacity-50 transition-colors duration-300">
                      <td className="py-4 px-4">
                        <select 
                          className="w-full p-3 bg-white rounded-lg font-bold text-xs text-slate-900 border border-slate-200 focus:border-slate-900 outline-none shadow-sm transition-all"
                          value={line.accountType}
                          onChange={e => updateLine(index, 'accountType', e.target.value)}
                        >
                          <option value="TREASURY">خزينة / بنك</option>
                          <option value="CUSTOMER">عميل (ذمم مدينة)</option>
                          <option value="SUPPLIER">مورد (ذمم دائنة)</option>
                          <option value="LIABILITY">موظف (حساب جاري)</option>
                          <option value="EMPLOYEE_ADVANCE">موظف (سلف)</option>
                          <option value="PARTNER">شريك (حساب جاري)</option>
                          <option value="EXPENSE">مصروف تشغيلي</option>
                          <option value="REVENUE">إيراد نشاط</option>
                        </select>
                      </td>
                      <td className="py-5 px-4">
                        <SearchableSelect
                          options={
                            line.accountType === 'TREASURY' ? (treasuries || []).map(t => ({ id: t.id, name: t.name, subtext: `الرصيد: ${isHidden ? '****' : (t.balance || 0).toLocaleString()}` })) :
                            line.accountType === 'CUSTOMER' ? (customers || []).map(c => ({ id: c.id, name: c.name, subtext: `الرصيد: ${isHidden ? '****' : (c.balance || 0).toLocaleString()}` })) :
                            line.accountType === 'SUPPLIER' ? (suppliers || []).map(s => ({ id: s.id, name: s.company, subtext: `الرصيد: ${isHidden ? '****' : (s.balance || 0).toLocaleString()}` })) :
                            line.accountType === 'LIABILITY' ? (employees || []).map(e => ({ id: e.id, name: e.name, subtext: `المستحقات: ${isHidden ? '****' : (e.balance || 0).toLocaleString()}` })) :
                            line.accountType === 'EMPLOYEE_ADVANCE' ? (employees || []).map(e => ({ id: e.id, name: e.name, subtext: `السلف: ${isHidden ? '****' : (e.advances || 0).toLocaleString()}` })) :
                            line.accountType === 'PARTNER' ? (partners || []).map(p => ({ id: p.id, name: p.name, subtext: `الرصيد: ${isHidden ? '****' : (p.balance || 0).toLocaleString()}` })) :
                            line.accountType === 'REVENUE' ? (REVENUE_CATEGORIES || []).map(cat => ({ id: cat, name: cat })) :
                            (EXPENSE_CATEGORIES || []).map(cat => ({ id: cat, name: cat }))
                          }
                          value={line.accountId}
                          onChange={val => updateLine(index, 'accountId', val)}
                          placeholder="ابحث عن الحساب..."
                          className="!p-0"
                        />
                      </td>
                      {enableCostCenters && (
                        <td className="py-4 px-2">
                          <select 
                            className="w-full p-3 bg-white rounded-lg font-bold text-xs text-slate-900 border border-slate-200 focus:border-slate-900 outline-none shadow-sm transition-all"
                            value={line.costCenterId || ''}
                            onChange={e => updateLine(index, 'costCenterId', e.target.value)}
                          >
                            <option value="">عام / بدون مركز</option>
                            {(costCenters || []).length > 0 && (
                              <optgroup label="مراكز التكلفة العامة">
                                {(costCenters || []).filter(cc => cc.isActive).map(cc => (
                                  <option key={cc.id} value={cc.id}>{cc.name}</option>
                                ))}
                              </optgroup>
                            )}
                            {(masterTrips || []).length > 0 && (
                              <optgroup label="الرحلات المجمعة">
                                {(masterTrips || []).map(trip => (
                                  <option key={trip.id} value={trip.id}>{trip.name}</option>
                                ))}
                              </optgroup>
                            )}
                          </select>
                        </td>
                      )}
                      <td className="py-4 px-2">
                        <div className="flex flex-col gap-1">
                          <select 
                            className="w-full p-2 bg-white rounded-lg font-bold text-[10px] text-slate-900 border border-slate-200 outline-none"
                            value={line.programId || ''}
                            onChange={e => updateLine(index, 'programId', e.target.value)}
                          >
                            <option value="">برنامج (اختياري)</option>
                            {(programs || []).map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                          {line.programId && (
                            <select 
                              className="w-full p-2 bg-indigo-50 rounded-lg font-bold text-[10px] text-indigo-700 border border-indigo-100 outline-none"
                              value={line.componentId || ''}
                              onChange={e => updateLine(index, 'componentId', e.target.value)}
                            >
                              <option value="">المكون...</option>
                              {((programs || []).find(p => p.id === line.programId)?.components || []).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-2 text-center">
                        <select 
                          className="w-full p-3 bg-white rounded-lg font-bold text-xs text-slate-900 border border-slate-200 outline-none shadow-sm"
                          value={line.currencyCode}
                          onChange={e => updateLine(index, 'currencyCode', e.target.value)}
                        >
                          {(currencies || []).map(c => (
                            <option key={c.code} value={c.code}>{c.code}</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 px-2">
                        <input 
                          type="number" step="0.0001"
                          className="w-full p-3 bg-white rounded-lg font-bold text-center text-xs text-slate-900 border border-slate-200 outline-none shadow-sm"
                          value={line.exchangeRate || ''}
                          onChange={e => updateLine(index, 'exchangeRate', parseFloat(e.target.value || '0'))}
                        />
                      </td>
                      <td className="py-4 px-2">
                        <input 
                          type="number"
                          className="w-full p-3 bg-white rounded-lg font-bold text-center text-xs text-slate-900 border border-slate-200 focus:border-slate-900 outline-none shadow-sm"
                          value={line.originalAmount || ''}
                          placeholder="0"
                          onChange={e => updateLine(index, 'originalAmount', parseFloat(e.target.value || '0'))}
                        />
                      </td>
                      <td className="py-4 px-2">
                        <input 
                          type="number"
                          className="w-full p-3 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-center text-sm border border-emerald-100 focus:border-emerald-600 outline-none shadow-sm"
                          value={line.debit || ''}
                          placeholder="0"
                          onChange={e => updateLine(index, 'debit', parseFloat(e.target.value || '0'))}
                        />
                      </td>
                      <td className="py-4 px-2">
                        <input 
                          type="number"
                          className="w-full p-3 bg-rose-50 text-rose-700 rounded-lg font-bold text-center text-sm border border-rose-100 focus:border-rose-500 outline-none shadow-sm"
                          value={line.credit || ''}
                          placeholder="0"
                          onChange={e => updateLine(index, 'credit', parseFloat(e.target.value || '0'))}
                        />
                      </td>
                      <td className="py-4 px-4 text-center">
                        <button 
                          type="button" onClick={() => removeLine(index)}
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-300 hover:bg-rose-50 hover:text-rose-600 transition-all duration-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-indigo-600 text-white">
                    <td colSpan={enableCostCenters ? 4 : 3} className="py-6 px-10">
                      <button 
                        type="button" onClick={addLine}
                        className="group flex items-center gap-4 hover:translate-x-[-4px] transition-transform"
                      >
                        <div className="w-8 h-8 bg-white text-indigo-600 rounded-lg flex items-center justify-center font-bold group-hover:rotate-90 transition-transform duration-500">
                          <Plus size={20} />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-widest text-white">إضافة طرف محاسبي للقيد</span>
                      </button>
                    </td>
                    <td colSpan={4} className="py-6 px-6 text-left">
                       <div className="flex justify-end gap-12">
                          <div className="flex flex-col items-center">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-300 mb-1">إجمالي مدين (+)</span>
                             <span className="text-2xl font-bold tabular-nums tracking-tight text-white">{isHidden ? '****' : (totals.debit || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col items-center">
                             <span className="text-[9px] font-bold uppercase tracking-widest text-rose-300 mb-1">إجمالي دائن (-)</span>
                             <span className="text-2xl font-bold tabular-nums tracking-tight text-white">{isHidden ? '****' : (totals.credit || 0).toLocaleString()}</span>
                          </div>
                       </div>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="flex items-center justify-between p-8 bg-indigo-600 rounded-2xl shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-64 h-64 bg-white bg-opacity-5 rounded-full blur-3xl -ml-32 -mt-32"></div>
               <div className="flex items-center gap-8 relative z-10">
                  <div className={`flex items-center gap-3 px-6 py-2.5 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-inner ${isBalanced ? 'bg-white bg-opacity-20 text-white border border-white border-opacity-30' : 'bg-rose-500 bg-opacity-20 text-rose-400 border border-rose-500 border-opacity-30 animate-pulse'}`}>
                     {isBalanced ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}
                     {isBalanced ? 'توازن محاسبي مكتمل' : 'خلل في توازن القيد'}
                  </div>
                  {!isBalanced && totals.debit > 0 && (
                    <p className="text-rose-100 text-[10px] font-bold">فرق التوازن: {(Math.abs(totals.debit - totals.credit)).toLocaleString()}</p>
                  )}
               </div>
               <button
                type="submit" disabled={!isBalanced}
                className={`px-12 py-4 rounded-xl font-bold text-base shadow-xl transition-all duration-500 flex items-center gap-3 relative z-10 transform active:scale-95 ${
                  isBalanced ? 'bg-white text-indigo-600 hover:bg-slate-50 shadow-white/10' : 'bg-indigo-800 text-indigo-400 cursor-not-allowed'
                }`}
               >
                 <Save size={20} />
                 {editingId ? 'حفظ التعديلات النهائية' : 'ترحيل القيد للمحرك المالي'}
               </button>
            </div>
          </form>
        )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 bg-indigo-600 flex justify-between items-center relative overflow-hidden no-print">
          <div className="absolute right-0 top-0 w-64 h-64 bg-white bg-opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="flex items-center gap-6 relative z-10">
            {currentUser.role === 'ADMIN' && (
              <div className="flex items-center bg-white/10 p-2 rounded-xl border border-white/20">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 rounded border-white/20 text-white focus:ring-white cursor-pointer bg-white/10"
                  checked={sortedJournalEntries.length > 0 && selectedIds.length === sortedJournalEntries.length}
                  onChange={toggleSelectAll}
                />
              </div>
            )}
            <div className="w-14 h-14 bg-white text-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <BookOpenText size={28} />
            </div>
            <div>
              <h4 className="font-bold text-white uppercase tracking-widest text-lg">أرشيف القيود المكتملة</h4>
              <p className="text-[10px] text-white text-opacity-70 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <CheckCircle2 size={12}/> تتبع النشاط المالي الكامل (آلي + يدوي)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
             <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest px-4">الترتيب الزمني: الأحدث أولاً</span>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {(sortedJournalEntries || []).map(entry => {
            const isAuto = (entry.description || '').includes('سند') || (entry.description || '').includes('حجز') || (entry.description || '').includes('تأشيرة');
            return (
              <div 
                key={entry.id} 
                id={`journal-entry-${entry.id}`}
                className={`p-10 hover:bg-slate-50 bg-opacity-50 transition-all duration-500 group relative ${highlightedId === entry.id ? 'ring-4 ring-indigo-500 border-indigo-500 scale-[1.01] z-10 shadow-2xl bg-indigo-50/30' : ''}`}
              >
                 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-10 gap-8">
                    <div className="flex items-start gap-8">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-110 duration-500 ${isAuto ? 'bg-slate-100 text-slate-400' : 'bg-emerald-50 text-indigo-600'}`}>
                        {isAuto ? <Cpu size={24}/> : <Edit2 size={24}/>}
                      </div>
                      <div>
                        <div className="flex items-center gap-4 mb-2">
                          <button 
                            onClick={() => copyToClipboard(entry.refNo || entry.id, entry.id)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full font-bold uppercase tracking-widest transition-all duration-300 ${
                              copiedId === entry.id 
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white hover:shadow-md'
                            }`}
                          >
                            {copiedId === entry.id ? <Check size={10} /> : <Copy size={10} />}
                            <span className="text-[10px]">
                              {copiedId === entry.id ? 'تم النسخ' : `REF: ${entry.refNo || entry.id}`}
                            </span>
                          </button>
                          {isAuto && <span className="flex items-center gap-2 text-[9px] bg-slate-900 text-indigo-400 px-3 py-1 rounded-full font-bold uppercase tracking-widest border border-slate-800">نظام آلي</span>}
                          {!isAuto && <span className="flex items-center gap-2 text-[9px] bg-indigo-700 text-white px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-sm">قيد يدوي</span>}
                        </div>
                        <h5 className="text-2xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{entry.description}</h5>
                        <div className="flex items-center gap-4 mt-2">
                           <div className="flex items-center gap-2 text-slate-400">
                              <Calendar size={12} />
                              <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(entry.date).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                           </div>
                           {!isAuto && (
                             <div className="flex gap-2 no-print opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-x-4 group-hover:translate-x-0">
                               <button onClick={() => startEdit(entry)} className="w-9 h-9 flex items-center justify-center bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-900 hover:text-white transition-all"><Edit2 size={14} /></button>
                               <button onClick={() => deleteJournalEntry(entry.id)} className="w-9 h-9 flex items-center justify-center bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={14} /></button>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right bg-white p-6 rounded-2xl border border-slate-100 shadow-sm min-w-[200px] group-hover:shadow-md transition-all duration-500">
                      <p className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums">{isHidden ? '****' : (entry.totalAmount || 0).toLocaleString()}</p>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-widest mt-1">إجمالي قيمة القيد</span>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {(entry.lines || []).map((line, idx) => (
                      <div key={idx} className={`p-6 rounded-2xl flex justify-between items-center transition-all duration-500 border ${line.debit > 0 ? 'bg-emerald-50 bg-opacity-10 border-emerald-100 border-opacity-50 hover:border-indigo-600 border-opacity-30' : 'bg-rose-50 bg-opacity-10 border-rose-100 border-opacity-50 hover:border-rose-500 border-opacity-30'}`}>
                         <div className="flex items-center gap-4">
                            <div className={`w-1.5 h-10 rounded-full ${line.debit > 0 ? 'bg-indigo-600' : 'bg-rose-500'}`}></div>
                            <div>
                              <p className="font-bold text-slate-900 text-base leading-tight">{line.accountName}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{line.accountType}</span>
                                {line.costCenterId && (
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                                    {costCenters.find(cc => cc.id === line.costCenterId)?.name || masterTrips.find(mt => mt.id === line.costCenterId)?.name || 'مركز غير معروف'}
                                  </span>
                                )}
                                {line.programId && (
                                  <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                                    {programs.find(p => p.id === line.programId)?.name || 'برنامج غير معروف'}
                                  </span>
                                )}
                                {line.componentId && (
                                  <span className="text-[9px] bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-bold">
                                    {programs.flatMap(p => p.components || []).find(c => c.id === line.componentId)?.name || 'مكون غير معروف'}
                                  </span>
                                )}
                              </div>
                            </div>
                         </div>
                         <div className="text-left">
                            <p className={`text-xl font-bold tabular-nums tracking-tight ${line.debit > 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                               {isHidden ? '****' : (line.debit > 0 ? `+${(line.debit || 0).toLocaleString()}` : `-${(line.credit || 0).toLocaleString()}`)}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{line.debit > 0 ? 'طرف مدين' : 'طرف دائن'}</p>
                         </div>
                      </div>
                    ))}
                 </div>
              </div>
            );
          })}
          {journalEntries.length === 0 && (
            <div className="py-32 text-center flex flex-col items-center">
               <div className="w-24 h-24 bg-slate-50 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpenText size={48} className="text-slate-200" />
               </div>
               <p className="font-bold text-slate-300 uppercase tracking-widest text-xs">دفتر قيود اليومية لا يحتوي على سجلات حالياً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JournalView;
