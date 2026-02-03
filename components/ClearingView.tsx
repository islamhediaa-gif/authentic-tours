
import React, { useState, useMemo, useEffect } from 'react';
import { RefreshCw, ArrowRightLeft, User, Truck, Calendar, Save, AlertTriangle, CheckCircle2, Edit, Trash2, History } from 'lucide-react';
import { Customer, Supplier, Currency, Transaction, User as UserType, JournalEntry, CostCenter } from '../types';
import SearchableSelect from './SearchableSelect';
import { Layers } from 'lucide-react';

interface ClearingViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  journalEntries: JournalEntry[];
  addTransaction: (tx: any) => void;
  transactions: Transaction[];
  currencies: Currency[];
  currentUser: UserType;
  formatCurrency: (amount: number) => string;
  costCenters: CostCenter[];
  enableCostCenters?: boolean;
  settings: any;
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
}

type ClearingType = 'C_S' | 'C_C' | 'S_S';

const ClearingView: React.FC<ClearingViewProps> = ({ 
  customers, suppliers, journalEntries, addTransaction, transactions, currencies, currentUser, formatCurrency, 
  costCenters, enableCostCenters, settings, initialEditingId, onClearInitialEdit
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const calculatedBalances = useMemo(() => {
    const cust: Record<string, number> = {};
    const supp: Record<string, number> = {};

    (customers || []).forEach(c => {
      if (c?.id) cust[c.id] = c.openingBalanceInBase || 0;
    });
    (suppliers || []).forEach(s => {
      if (s?.id) supp[s.id] = s.openingBalanceInBase || 0;
    });

    (journalEntries || []).forEach(entry => {
      if (!entry?.lines) return;
      (entry.lines || []).forEach(line => {
        if (!line?.accountId) return;
        if (line.accountType === 'CUSTOMER' && cust[line.accountId] !== undefined) {
          cust[line.accountId] += (line.debit || 0) - (line.credit || 0);
        } else if (line.accountType === 'SUPPLIER' && supp[line.accountId] !== undefined) {
          supp[line.accountId] += (line.credit || 0) - (line.debit || 0);
        }
      });
    });

    return { customers: cust, suppliers: supp };
  }, [customers, suppliers, journalEntries]);

  const [clearingType, setClearingType] = useState<ClearingType>('C_S');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  
  useEffect(() => {
    if (initialEditingId) {
      const tx = (transactions || []).find(t => t?.id === initialEditingId);
      if (tx) {
        setHighlightedId(tx.id);
        setTimeout(() => {
          const element = document.getElementById(`clearing-${tx.id}`);
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
    fromId: '',
    toId: '',
    amount: '',
    currencyCode: settings?.baseCurrency || 'EGP',
    exchangeRate: '1',
    date: new Date().toISOString().split('T')[0],
    description: 'مقاصة وتحويل أرصدة',
    costCenterId: ''
  });

  const selectedCurrency = (currencies || []).find(c => c?.code === formData.currencyCode);
  
  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount);
    if (!amountNum || !formData.fromId || !formData.toId) return;

    let relatedType: 'CUSTOMER' | 'SUPPLIER' = 'CUSTOMER';
    let targetType: 'CUSTOMER' | 'SUPPLIER' = 'SUPPLIER';

    if (clearingType === 'C_S') { relatedType = 'SUPPLIER'; targetType = 'CUSTOMER'; }
    else if (clearingType === 'C_C') { relatedType = 'CUSTOMER'; targetType = 'CUSTOMER'; }
    else if (clearingType === 'S_S') { relatedType = 'SUPPLIER'; targetType = 'SUPPLIER'; }

    addTransaction({
      description: formData.description,
      amount: amountNum,
      currencyCode: formData.currencyCode,
      exchangeRate: parseFloat(formData.exchangeRate || '1'),
      type: 'CLEARING',
      category: 'ACCOUNT_CLEARING',
      date: formData.date,
      relatedEntityId: formData.fromId, 
      relatedEntityType: relatedType,
      targetEntityId: formData.toId,
      targetEntityType: targetType,
      costCenterId: formData.costCenterId || undefined
    });

    setFormData({ 
      ...formData, 
      amount: '', 
      fromId: '', 
      toId: '', 
      costCenterId: '',
      currencyCode: settings?.baseCurrency || 'EGP',
      exchangeRate: '1'
    });
    alert('✅ تمت عملية التسوية بنجاح وتم ترحيل القيود للأطراف المعنية');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-xl border-b-8 border-indigo-600">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
            <RefreshCw size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">المقاصة والتسويات المتقدمة</h2>
            <p className="text-slate-400 font-bold text-sm">إدارة الحسابات المتقابلة والتحويلات بين العملاء والموردين</p>
          </div>
        </div>
      </div>

      <div className="flex bg-white p-2 rounded-2xl shadow-md border max-w-fit mx-auto">
        <button onClick={() => setClearingType('C_S')} className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${clearingType === 'C_S' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>عميل ↔ مورد</button>
        <button onClick={() => setClearingType('C_C')} className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${clearingType === 'C_C' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>عميل ↔ عميل</button>
        <button onClick={() => setClearingType('S_S')} className={`px-8 py-3 rounded-xl font-bold text-sm transition-all ${clearingType === 'S_S' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>مورد ↔ مورد</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-12 rounded-3xl shadow-2xl border-4 border-indigo-50">
           <form onSubmit={handleSettle} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <User size={14}/> 
                      {clearingType === 'C_S' ? 'خصم من حساب (المورد)' : 'خصم من حساب'}
                    </label>
                    <SearchableSelect
                      options={
                        clearingType === 'S_S' || clearingType === 'C_S' 
                          ? (suppliers || []).map(s => ({ id: s?.id, name: s?.company, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(calculatedBalances.suppliers[s?.id || ''] || 0)}` }))
                          : (customers || []).map(c => ({ id: c?.id, name: c?.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(calculatedBalances.customers[c?.id || ''] || 0)}` }))
                      }
                      value={formData.fromId}
                      onChange={val => setFormData({...formData, fromId: val})}
                      placeholder="اختر الطرف الأول"
                    />
                 </div>
                 <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2">
                      <ArrowRightLeft size={14}/>
                      {clearingType === 'C_S' ? 'تخفيض مديونية (العميل)' : 'تحويل لصالح حساب'}
                    </label>
                    <SearchableSelect
                      options={
                        clearingType === 'S_S' 
                          ? (suppliers || []).map(s => ({ id: s?.id, name: s?.company, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(calculatedBalances.suppliers[s?.id || ''] || 0)}` }))
                          : (customers || []).map(c => ({ id: c?.id, name: c?.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(calculatedBalances.customers[c?.id || ''] || 0)}` }))
                      }
                      value={formData.toId}
                      onChange={val => setFormData({...formData, toId: val})}
                      placeholder="اختر الطرف الثاني"
                    />
                 </div>
              </div>

              <div className="bg-slate-900 p-10 rounded-3xl text-white flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden">
                 <ArrowRightLeft className="text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10" size={150} />
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full relative z-10">
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-indigo-300 uppercase block text-center">المبلغ المراد تسويته</label>
                       <input type="number" required className="w-full p-5 bg-white/10 border-2 border-white/20 rounded-2xl font-bold text-3xl text-center text-indigo-400 outline-none focus:border-indigo-400" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-indigo-300 uppercase block text-center">عملة التسوية</label>
                       <select className="w-full p-5 bg-white/10 border-2 border-white/20 rounded-2xl font-bold text-2xl text-center text-white outline-none" value={formData.currencyCode} onChange={e => {
                         const code = e.target.value;
                         const rate = (currencies || []).find(c => c && c.code === code)?.rateToMain || 1;
                         setFormData({...formData, currencyCode: code, exchangeRate: rate.toString()});
                       }}>
                          {(currencies || []).map(c => c && <option key={c.code} value={c.code} className="text-slate-900">{c.code}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-indigo-300 uppercase block text-center">سعر الصرف ({settings?.baseCurrency})</label>
                       <input 
                         type="number" 
                         step="any"
                         disabled={formData.currencyCode === settings?.baseCurrency}
                         className="w-full p-5 bg-white/10 border-2 border-white/20 rounded-2xl font-bold text-2xl text-center text-white outline-none focus:border-indigo-400 disabled:opacity-50" 
                         value={formData.currencyCode === settings?.baseCurrency ? '1' : formData.exchangeRate} 
                         onChange={e => setFormData({...formData, exchangeRate: e.target.value})} 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-bold text-indigo-300 uppercase block text-center">تاريخ العملية</label>
                       <input type="date" className="w-full p-5 bg-white/10 border-2 border-white/20 rounded-2xl font-bold text-lg text-center text-white outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                 </div>
                 <div className="w-full space-y-2 relative z-10">
                    <label className="text-[10px] font-bold text-indigo-300 uppercase block">البيان / ملاحظات العملية</label>
                    <input required className="w-full p-4 bg-white/5 border-2 border-white/10 rounded-xl font-bold text-white text-center" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                 </div>
                 {enableCostCenters && (
                   <div className="w-full space-y-2 relative z-10">
                      <label className="text-[10px] font-bold text-indigo-300 uppercase block">مركز التكلفة (اختياري)</label>
                      <select 
                        className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-xl font-bold text-white text-center outline-none"
                        value={formData.costCenterId}
                        onChange={e => setFormData({...formData, costCenterId: e.target.value})}
                      >
                        <option value="" className="text-slate-900">بدون مركز تكلفة</option>
                        {(costCenters || []).filter(cc => cc && cc.isActive).map(cc => (
                          <option key={cc.id} value={cc.id} className="text-slate-900">{cc.name}</option>
                        ))}
                      </select>
                   </div>
                 )}
              </div>

              <div className="flex justify-end pt-6">
                 <button type="submit" className="bg-slate-900 text-indigo-400 px-24 py-6 rounded-3xl font-bold text-3xl shadow-2xl hover:bg-indigo-700 hover:text-white transition-all transform hover:scale-105 active:scale-95">إتمام العملية الآن</button>
              </div>
           </form>
        </div>

        <div className="space-y-6">
           <div className="bg-white p-8 rounded-3xl shadow-xl border border-indigo-50">
              <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3"><AlertTriangle className="text-indigo-600" /> تنبيه محاسبي</h3>
              <p className="text-slate-500 font-bold leading-relaxed text-sm">
                 تُستخدم هذه الواجهة لإجراء التسويات المباشرة بين الحسابات دون الحاجة لصرف أو قبض نقدية. مثالية لحالات:
                 <br/><br/>
                 1. العميل الذي يورد خدمة للمؤسسة (خصم مستحقاته من مديونيته).
                 <br/>
                 2. تحويل مبالغ من عميل لآخر.
                 <br/>
                 3. تسوية حسابات الموردين البينية.
              </p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                <History size={20} />
             </div>
             <h3 className="text-white font-bold text-lg">سجل عمليات التسوية الأخيرة</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">التاريخ</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">البيان</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">من حساب</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-center">→</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest">إلى حساب</th>
                <th className="px-8 py-5 text-xs font-bold text-slate-500 uppercase tracking-widest text-left">المبلغ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(transactions || []).filter(t => t?.category === 'ACCOUNT_CLEARING').sort((a,b) => (b.date || '').localeCompare(a.date || '')).map(tx => (
                <tr 
                  key={tx?.id} 
                  id={`clearing-${tx?.id}`}
                  className={`hover:bg-slate-50/80 transition-all duration-300 group ${highlightedId === tx?.id ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/30 scale-[1.002] z-10 shadow-2xl' : ''}`}
                >
                  <td className="px-8 py-5">
                    <span className="text-slate-500 font-bold text-xs">{tx?.date}</span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="font-bold text-slate-900 text-sm">{tx?.description}</p>
                    <span className="text-[10px] text-indigo-600 font-bold uppercase tracking-tighter">REF: #{tx?.refNo || tx?.id?.slice(-6).toUpperCase()}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-bold text-sm">
                        {tx?.relatedEntityType === 'CUSTOMER' ? (customers || []).find(c => c?.id === tx?.relatedEntityId)?.name : (suppliers || []).find(s => s?.id === tx?.relatedEntityId)?.company}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{tx?.relatedEntityType === 'CUSTOMER' ? 'عميل' : 'مورد'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <ArrowRightLeft size={16} className="text-slate-300 mx-auto" />
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className="text-slate-700 font-bold text-sm">
                        {tx?.targetEntityType === 'CUSTOMER' ? (customers || []).find(c => c?.id === tx?.targetEntityId)?.name : (suppliers || []).find(s => s?.id === tx?.targetEntityId)?.company}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{tx?.targetEntityType === 'CUSTOMER' ? 'عميل' : 'مورد'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-left">
                    <span className="text-lg font-black text-slate-900 tabular-nums">
                      {isHidden ? '****' : formatCurrency(tx?.amountInBase || tx?.amount || 0)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(transactions || []).filter(t => t?.category === 'ACCOUNT_CLEARING').length === 0 && (
            <div className="p-20 text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-dashed border-slate-200">
                  <RefreshCw size={32} className="text-slate-200" />
               </div>
               <p className="text-slate-400 font-bold text-sm">لا توجد عمليات تسوية سابقة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClearingView;
