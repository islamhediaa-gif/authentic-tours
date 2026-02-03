import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Printer, Edit2, Tag, ClipboardList, User, Truck, Contact2, Percent, Trash2, Calendar, Award
} from 'lucide-react';
import { Transaction, Customer, Supplier, Treasury, Currency, Employee, User as UserType, CostCenter, JournalEntry, Program, MasterTrip } from '../types';
import SearchableSelect from './SearchableSelect';
import { compareArabic } from '../utils/arabicUtils';

interface ServiceViewProps {
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  addTransaction: (tx: any) => void;
  updateTransaction: (id: string, tx: any) => void;
  deleteTransaction: (id: string) => void;
  customers: Customer[];
  suppliers: Supplier[];
  treasuries: Treasury[];
  currencies: Currency[];
  employees: Employee[];
  programs: Program[];
  masterTrips: MasterTrip[];
  currentUser: UserType;
  searchTerm?: string;
  formatCurrency: (amount: number) => string;
  costCenters: CostCenter[];
  enableCostCenters?: boolean;
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
  settings: any;
}

const ServiceView: React.FC<ServiceViewProps> = ({ 
  transactions, journalEntries, addTransaction, updateTransaction, 
  deleteTransaction, customers, suppliers, treasuries, currencies, 
  employees, programs, masterTrips, currentUser, searchTerm = '', formatCurrency, costCenters, 
  enableCostCenters, initialEditingId, onClearInitialEdit, settings 
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const otherBalances = useMemo(() => {
    const cust: Record<string, number> = {};
    const supp: Record<string, number> = {};

    (customers || []).forEach(c => { if (c?.id) cust[c.id] = c.openingBalanceInBase || 0; });
    (suppliers || []).forEach(s => { if (s?.id) supp[s.id] = s.openingBalanceInBase || 0; });

    (journalEntries || []).forEach(entry => {
      if (entry && entry.lines) {
        (entry.lines || []).forEach(line => {
          if (line && line.accountType === 'CUSTOMER' && cust[line.accountId] !== undefined) {
            cust[line.accountId] += (line.debit || 0) - (line.credit || 0);
          } else if (line && line.accountType === 'SUPPLIER' && supp[line.accountId] !== undefined) {
            supp[line.accountId] += (line.credit || 0) - (line.debit || 0);
          }
        });
      }
    });

    return { customers: cust, suppliers: supp };
  }, [customers, suppliers, journalEntries]);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialEditingId) {
      const tx = (transactions || []).find(t => t && t.id === initialEditingId);
      if (tx) {
        setHighlightedId(tx.id);
        setTimeout(() => {
          const element = document.getElementById(`service-${tx.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 500);
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, transactions, onClearInitialEdit]);

  const [formData, setFormData] = useState({
    serviceName: '', customerId: '', supplierId: '', supplierType: 'SUPPLIER' as 'SUPPLIER' | 'CUSTOMER' | 'TREASURY', employeeId: '', currencyCode: settings?.baseCurrency || '', exchangeRate: '1', purchasePrice: '', sellingPrice: '', discount: '0', employeeCommissionRate: '', commissionAmount: '', notes: '', date: new Date().toISOString().split('T')[0], costCenterId: '', applyCommission: true,
    programId: '', componentId: '', masterTripId: ''
  });

  useEffect(() => {
    if (!editingId && settings?.baseCurrency) {
      const curr = (currencies || []).find(c => c.code === formData.currencyCode);
      if (curr) setFormData(prev => ({ ...prev, exchangeRate: curr.rateToMain.toString() }));
    }
  }, [formData.currencyCode, currencies, editingId, settings?.baseCurrency]);

  useEffect(() => {
    if (isBookingEmployee && !formData.employeeId && !editingId && currentUser.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: currentUser.employeeId || '' }));
    } else if (isBookingEmployee && !formData.employeeId && !editingId) {
      const emp = (employees || []).find(e => compareArabic(e.name, currentUser.name));
      if (emp) setFormData(prev => ({ ...prev, employeeId: emp.id }));
    }
  }, [isBookingEmployee, currentUser, employees, formData.employeeId, editingId]);

  useEffect(() => {
    if (formData.employeeId && !editingId && !formData.employeeCommissionRate) {
      const emp = (employees || []).find(e => e.id === formData.employeeId);
      if (emp) setFormData(prev => ({ ...prev, employeeCommissionRate: emp.commissionRate.toString() }));
    }
  }, [formData.employeeId, employees, editingId]);

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setFormData({
      serviceName: tx.description || '',
      customerId: tx.relatedEntityId || '',
      supplierId: tx.supplierId || '',
      supplierType: tx.supplierType || 'SUPPLIER',
      employeeId: tx.employeeId || '',
      currencyCode: tx.currencyCode || settings?.baseCurrency || '',
      exchangeRate: (tx.exchangeRate || 1).toString(),
      purchasePrice: (tx.purchasePrice || 0).toString(),
      sellingPrice: (tx.sellingPrice || 0).toString(),
      discount: (tx.discount || 0).toString(),
      employeeCommissionRate: (tx.employeeCommissionRate || 0).toString(),
      commissionAmount: tx.commissionAmount?.toString() || '',
      applyCommission: tx.applyCommission ?? true,
      notes: tx.accommodation || '', 
      date: tx.date || new Date().toISOString().split('T')[0],
      costCenterId: tx.costCenterId || '',
      programId: tx.programId || '',
      componentId: tx.componentId || '',
      masterTripId: tx.masterTripId || ''
    });
    setShowAdd(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const txPayload = {
      description: `${formData.serviceName}`,
      amount: 0,
      currencyCode: formData.currencyCode,
      exchangeRate: parseFloat(formData.exchangeRate || '1'),
      type: 'INCOME',
      category: 'GENERAL_SERVICE',
      date: formData.date,
      relatedEntityId: formData.customerId,
      relatedEntityType: 'CUSTOMER',
      supplierId: formData.supplierId,
      supplierType: formData.supplierType,
      employeeId: formData.employeeId,
      employeeCommissionRate: parseFloat(formData.employeeCommissionRate || '0'),
      commissionAmount: parseFloat(formData.commissionAmount || '0'),
      applyCommission: formData.applyCommission,
      accommodation: formData.notes, 
      purchasePrice: parseFloat(formData.purchasePrice || '0'),
      sellingPrice: parseFloat(formData.sellingPrice || '0'),
      discount: parseFloat(formData.discount || '0'),
      amountInBase: (parseFloat(formData.sellingPrice || '0') - parseFloat(formData.discount || '0')) * parseFloat(formData.exchangeRate || '1'),
      costCenterId: formData.costCenterId || undefined,
      programId: formData.programId || undefined,
      componentId: formData.componentId || undefined,
      masterTripId: formData.masterTripId || undefined
    };
    if (editingId) updateTransaction(editingId, txPayload);
    else addTransaction(txPayload);
    cancelForm();
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setFormData({ serviceName: '', customerId: '', supplierId: '', supplierType: 'SUPPLIER', employeeId: '', currencyCode: settings?.baseCurrency || '', exchangeRate: '1', purchasePrice: '', sellingPrice: '', discount: '0', employeeCommissionRate: '', commissionAmount: '', notes: '', date: new Date().toISOString().split('T')[0], costCenterId: '', applyCommission: true, programId: '', componentId: '', masterTripId: '' });
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(tx => tx.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} من العمليات المحددة؟`)) {
      selectedIds.forEach(id => deleteTransaction(id));
      setSelectedIds([]);
    }
  };

  const filtered = useMemo(() => {
    return (transactions || [])
      .filter(t => t && t.category === 'GENERAL_SERVICE')
      .filter(t => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        const customer = (customers || []).find(c => c && c.id === t.relatedEntityId);
        return (
          (t.description || '').toLowerCase().includes(s) ||
          (t.refNo || '').toLowerCase().includes(s) ||
          (customer?.name || '').toLowerCase().includes(s)
        );
      })
      .sort((a, b) => (b?.date || '').localeCompare(a?.date || ''));
  }, [transactions, searchTerm, customers]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header section */}
      <div className="relative overflow-hidden bg-slate-900 p-8 rounded-3xl shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 bg-opacity-10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-indigo-500 bg-opacity-20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-indigo-500 border-opacity-30">
              <ClipboardList size={32} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-white tracking-tight">الخدمات اللوجستية</h2>
              <p className="text-indigo-400 text-opacity-80 font-medium text-sm">إدارة كافة الخدمات، التأشيرات ووسائل النقل</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {selectedIds.length > 0 && currentUser.role === 'ADMIN' && (
              <button 
                onClick={handleBulkDelete}
                className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-rose-500/20 hover:bg-rose-400 transition-all active:scale-95 animate-in zoom-in"
              >
                <Trash2 size={20}/> حذف ({selectedIds.length})
              </button>
            )}
            <button 
              onClick={() => setShowAdd(true)} 
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95"
            >
              <Plus size={20}/> إضافة خدمة جديدة
            </button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-in zoom-in-95 duration-200">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
            <h3 className="text-xl font-bold text-slate-900">{editingId ? 'تعديل بيانات الخدمة' : 'تسجيل طلب خدمة جديد'}</h3>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <ClipboardList size={14} className="text-indigo-600"/> نوع الخدمة
                </label>
                <input 
                  required 
                  className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600 ring-opacity-5 rounded-2xl font-bold text-lg text-slate-900 outline-none transition-all" 
                  placeholder="مثال: تأشيرة زيارة / نقل مطار" 
                  value={formData.serviceName} 
                  onChange={e => setFormData({...formData, serviceName: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <User size={14} className="text-indigo-600"/> العميل
                  </label>
                  <SearchableSelect
                    options={(customers || []).map(c => ({ id: c.id, name: c.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(otherBalances.customers[c.id] || 0)}` }))}
                    value={formData.customerId}
                    onChange={val => setFormData({...formData, customerId: val})}
                    placeholder="اختر العميل"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Truck size={14} className="text-indigo-600"/> جهة الشراء
                    </label>
                    <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
                      {['SUPPLIER', 'CUSTOMER', 'TREASURY'].map((type) => (
                        <button 
                          key={type}
                          type="button" 
                          onClick={() => setFormData({...formData, supplierType: type as any, supplierId: ''})} 
                          className={`px-2 py-0.5 rounded-md text-[9px] font-bold transition-all ${formData.supplierType === type ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                          {type === 'SUPPLIER' ? 'مورد' : type === 'CUSTOMER' ? 'عميل' : 'خزينة'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SearchableSelect
                    options={
                      formData.supplierType === 'SUPPLIER'
                        ? (suppliers || []).map(s => ({ id: s.id, name: s.company, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(otherBalances.suppliers[s.id] || 0)}` }))
                        : formData.supplierType === 'CUSTOMER'
                          ? (customers || []).map(c => ({ id: c.id, name: c.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(otherBalances.customers[c.id] || 0)}` }))
                          : (treasuries || []).map(t => ({ id: t.id, name: t.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(t.balance)}` }))
                    }
                    value={formData.supplierId}
                    onChange={val => setFormData({...formData, supplierId: val})}
                    placeholder={`اختر ${formData.supplierType === 'SUPPLIER' ? 'المورد' : formData.supplierType === 'CUSTOMER' ? 'العميل' : 'الخزينة'}`}
                  />
                </div>
              </div>

              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Contact2 className="text-indigo-600" size={14} /> الموظف المسؤول
                </label>
                <SearchableSelect
                  options={(employees || []).map(emp => ({ id: emp.id, name: emp.name, subtext: emp.position }))}
                  value={formData.employeeId}
                  onChange={val => {
                    const emp = (employees || []).find(e => e.id === val);
                    setFormData({
                      ...formData, 
                      employeeId: val,
                      employeeCommissionRate: emp ? emp.commissionRate.toString() : formData.employeeCommissionRate
                    });
                  }}
                  placeholder="اختر الموظف المسؤول"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Tag className="text-indigo-600" size={14} /> ربط ببرنامج (اختياري)
                  </label>
                  <SearchableSelect
                    options={(programs || []).map(p => ({ id: p.id, name: p.name, subtext: `${p.type} - ${p.date}` }))}
                    value={formData.programId}
                    onChange={val => {
                      const prog = (programs || []).find(p => p.id === val);
                      setFormData({ ...formData, programId: val, componentId: '' });
                    }}
                    placeholder="اختر البرنامج"
                  />
                </div>

                {formData.programId && (
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-right-4">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <ClipboardList className="text-indigo-600" size={14} /> المكون المرتبط
                    </label>
                    <select
                      className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:border-indigo-600 transition-all"
                      value={formData.componentId}
                      onChange={e => setFormData({ ...formData, componentId: e.target.value })}
                    >
                      <option value="">اختر المكون...</option>
                      {((programs || []).find(p => p.id === formData.programId)?.components || []).map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                      <Percent className="text-indigo-600" size={14} /> نسبة العمولة %
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        checked={formData.applyCommission}
                        onChange={e => setFormData({...formData, applyCommission: e.target.checked})}
                      />
                      <span className="text-[10px] font-bold text-slate-400 group-hover:text-indigo-600 transition-colors">تفعيل العمولة</span>
                    </label>
                  </div>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-500 outline-none text-center" 
                    value={formData.employeeCommissionRate} 
                    onChange={e => setFormData({...formData, employeeCommissionRate: e.target.value, commissionAmount: ''})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Award className="text-emerald-600" size={14} /> مبلغ عمولة محدد
                  </label>
                  <input 
                    type="number" 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-500 outline-none text-center" 
                    value={formData.commissionAmount} 
                    onChange={e => setFormData({...formData, commissionAmount: e.target.value, employeeCommissionRate: ''})} 
                    placeholder="مبلغ ثابت"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <ClipboardList className="text-indigo-600" size={14} /> الرحلة المرتبطة (Trip)
                  </label>
                  <select 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-500 outline-none"
                    value={formData.masterTripId}
                    onChange={e => setFormData({...formData, masterTripId: e.target.value})}
                  >
                    <option value="">بدون رحلة محددة</option>
                    {(masterTrips || []).filter(t => !t.isVoided).map(t => (
                      <option key={t.id} value={t.id}>{t.name} - {new Date(t.date).toLocaleDateString('ar-EG')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Tag className="text-slate-600" size={14} /> مركز التكلفة
                  </label>
                  <select 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-slate-400 outline-none disabled:opacity-50"
                    value={formData.costCenterId}
                    disabled={!enableCostCenters}
                    onChange={e => setFormData({...formData, costCenterId: e.target.value})}
                  >
                    <option value="">بدون مركز تكلفة</option>
                    {(costCenters || []).filter(cc => cc.isActive).map(cc => (
                      <option key={cc.id} value={cc.id}>{cc.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Calendar className="text-slate-600" size={14} /> تاريخ الخدمة
                  </label>
                  <input 
                    type="date" 
                    required 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-500 outline-none" 
                    value={formData.date} 
                    onChange={e => setFormData({...formData, date: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-rose-400 uppercase text-center block">سعر التكلفة</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full p-4 bg-slate-800 border border-slate-700 focus:border-rose-500 rounded-2xl font-bold text-2xl text-center text-rose-400 outline-none transition-all" 
                    value={formData.purchasePrice} 
                    onChange={e => setFormData({...formData, purchasePrice: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-emerald-400 uppercase text-center block">سعر البيع</label>
                  <input 
                    type="number" 
                    required 
                    className="w-full p-4 bg-slate-800 border border-slate-700 focus:border-emerald-500 rounded-2xl font-bold text-2xl text-center text-emerald-400 outline-none transition-all" 
                    value={formData.sellingPrice} 
                    onChange={e => setFormData({...formData, sellingPrice: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-rose-500 uppercase text-center block">خصم مسموح</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-slate-800 border border-slate-700 focus:border-rose-500 rounded-2xl font-bold text-2xl text-center text-rose-500 outline-none transition-all" 
                    value={formData.discount} 
                    onChange={e => setFormData({...formData, discount: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase text-center block">العملة</label>
                  <select 
                    className="w-full p-4 bg-slate-800 border border-slate-700 focus:border-slate-500 rounded-2xl font-bold text-xl text-center text-white outline-none" 
                    value={formData.currencyCode} 
                    onChange={e => {
                      const code = e.target.value;
                      const rate = (currencies || []).find(c => c.code === code)?.rateToMain || 1;
                      setFormData({...formData, currencyCode: code, exchangeRate: rate.toString()});
                    }}
                  >
                    {(currencies || []).map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase text-center block">سعر الصرف</label>
                  <input 
                    type="number" 
                    step="any"
                    disabled={formData.currencyCode === settings?.baseCurrency}
                    className="w-full p-4 bg-slate-800 border border-slate-700 focus:border-slate-500 rounded-2xl font-bold text-xl text-center text-white outline-none disabled:opacity-50" 
                    value={formData.currencyCode === settings?.baseCurrency ? '1' : formData.exchangeRate} 
                    onChange={e => setFormData({...formData, exchangeRate: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase text-center block">التاريخ</label>
                  <div className="relative">
                    <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input 
                      type="date" 
                      className="w-full p-4 pr-4 bg-slate-800 border border-slate-700 focus:border-slate-500 rounded-2xl font-bold text-base text-center text-white outline-none" 
                      value={formData.date} 
                      onChange={e => setFormData({...formData, date: e.target.value})} 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
              <button 
                type="button" 
                onClick={cancelForm} 
                className="px-8 py-3 font-bold text-slate-500 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
              >
                إلغاء
              </button>
              <button 
                type="submit" 
                className="bg-slate-900 text-indigo-400 px-16 py-4 rounded-2xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-all active:scale-95"
              >
                {editingId ? 'تحديث البيانات' : 'حفظ الخدمة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    checked={filtered.length > 0 && selectedIds.length === filtered.length}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">الخدمة</th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider">المنفذ / النسبة</th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider text-center">التكلفة</th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider text-center">البيع</th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider text-center">صافي الربح</th>
                <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(tx => (
                <tr 
                  key={tx.id} 
                  id={`service-${tx.id}`}
                  className={`hover:bg-slate-50 bg-opacity-80 transition-all group ${highlightedId === tx.id ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/30 scale-[1.002] z-10 shadow-2xl' : ''}`}
                >
                  <td className="px-6 py-5 text-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                      checked={selectedIds.includes(tx.id)}
                      onChange={() => toggleSelect(tx.id)}
                    />
                  </td>
                  <td className="px-6 py-5">
                    <div className="font-bold text-slate-900 text-lg">{tx.description}</div>
                    <div className="flex flex-wrap items-center gap-3 mt-1">
                      {tx.refNo ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tx.refNo);
                            const btn = document.getElementById(`ref-srv-${tx.id}`);
                            if (btn) {
                              const originalText = btn.innerText;
                              btn.innerText = 'تم النسخ';
                              setTimeout(() => { btn.innerText = originalText; }, 1000);
                            }
                          }}
                          id={`ref-srv-${tx.id}`}
                          className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 hover:bg-indigo-100 transition-all"
                          title="اضغط للنسخ والبحث"
                        >
                          Ref: #{tx.refNo}
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Ref: #{(tx.id || '').toString().slice(-6).toUpperCase()}
                        </span>
                      )}
                      <div className="text-xs text-slate-400 flex items-center gap-2">
                         <Calendar size={12} /> {tx.date}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                     <div className="flex flex-col gap-1.5">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg w-fit">
                            <User size={12} className="text-slate-400" />
                            {(employees || []).find(e => e.id === tx.employeeId)?.name || '---'}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold px-1">عمولة: {isHidden ? '****' : (tx.employeeCommissionRate || 0)}%</span>
                     </div>
                  </td>
                  <td className="px-6 py-5 text-center text-rose-600 font-bold">
                    {shouldMaskAggregate ? '****' : formatCurrency((tx.purchasePrice || 0) * (tx.exchangeRate || 1))}
                  </td>
                  <td className="px-6 py-5 text-center text-emerald-600 font-bold">
                    {isHidden ? '****' : formatCurrency((tx.sellingPrice || 0) * (tx.exchangeRate || 1))}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="px-4 py-2 bg-slate-900 text-emerald-400 rounded-xl font-bold text-lg inline-block min-w-[120px]">
                      {shouldMaskAggregate ? '****' : formatCurrency(((tx.sellingPrice || 0) - (tx.purchasePrice || 0)) * (tx.exchangeRate || 1))}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                     <div className="flex justify-center gap-2">
                       <button 
                        onClick={() => handleEdit(tx)} 
                        className="p-2.5 bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-indigo-400 rounded-xl transition-all" 
                        title="تعديل"
                       >
                        <Edit2 size={16}/>
                       </button>
                       {currentUser.role === 'ADMIN' && (
                         <button 
                          onClick={() => deleteTransaction(tx.id)} 
                          className="p-2.5 bg-rose-50 text-rose-500 hover:bg-rose-600 hover:text-white rounded-xl transition-all" 
                          title="حذف"
                         >
                          <Trash2 size={16}/>
                         </button>
                       )}
                     </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-medium">
                    لا توجد خدمات مسجلة تطابق البحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ServiceView;
