import React, { useState } from 'react';
import { History, ArrowLeftRight, Landmark, Calendar, ShieldCheck, ArrowUpCircle, ArrowDownCircle, Search, Copy, Check } from 'lucide-react';
import { Customer, Supplier, Employee, Partner, Treasury, Currency, Transaction, JournalEntry, MasterTrip, Program, CostCenter } from '../../types';
import { Edit2, X, Save, Layers, Package } from 'lucide-react';

interface AccountLedgerProps {
  activeReport: string;
  selectedId: string;
  ledgerEntries: any[];
  openingBalance: number;
  fromDate: string;
  toDate: string;
  isHidden: boolean;
  shouldMaskAggregate: boolean;
  customers: Customer[];
  suppliers: Supplier[];
  employees: Employee[];
  partners: Partner[];
  treasuries: Treasury[];
  currencies: Currency[];
  costCenters?: CostCenter[];
  masterTrips?: MasterTrip[];
  programs?: Program[];
  isPrint?: boolean;
  onTransactionClick?: (id: string) => void;
  baseCurrency?: string;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onUpdateJournalEntry?: (id: string, updates: Partial<JournalEntry>) => void;
  onVoidTransaction?: (id: string) => void;
  onDeleteJournalEntry?: (id: string) => void;
  transactions?: Transaction[];
  journalEntries?: JournalEntry[];
}

const AccountLedger: React.FC<AccountLedgerProps> = ({
  activeReport,
  selectedId,
  ledgerEntries,
  openingBalance,
  fromDate,
  toDate,
  isHidden,
  shouldMaskAggregate,
  customers,
  suppliers,
  employees,
  partners,
  treasuries,
  currencies,
  costCenters = [],
  masterTrips = [],
  programs = [],
  isPrint = false,
  onTransactionClick,
  baseCurrency = 'EGP',
  onUpdateTransaction,
  onUpdateJournalEntry,
  onVoidTransaction,
  onDeleteJournalEntry,
  transactions = [],
  journalEntries = []
}) => {
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    amount: 0,
    description: ''
  });

  const handleEdit = (e: any) => {
    if (!e) return;
    // Find the original source
    const tx = (transactions || []).find(t => t?.id === e.id || t?.journalEntryId === e.id);
    const jv = (journalEntries || []).find(j => j?.id === e.id);

    setEditingEntry({
      ...e,
      originalTx: tx,
      originalJv: jv
    });
    setEditForm({
      amount: e.debit || e.credit || 0,
      description: e.description || ''
    });
  };

  const handleSave = () => {
    if (!editingEntry) return;

    if (editingEntry.originalTx) {
      onUpdateTransaction?.(editingEntry.originalTx.id, {
        amount: editForm.amount,
        description: editForm.description
      });
    } else if (editingEntry.originalJv) {
      const entry = editingEntry.originalJv;
      const newLines = [...(entry?.lines || [])];
      
      // Find the specific line that matches this account in the ledger
      const lineIndex = newLines.findIndex(l => l?.accountId === selectedId);
      if (lineIndex !== -1) {
        const isDebit = (newLines[lineIndex]?.debit || 0) > 0;
        const rate = newLines[lineIndex]?.exchangeRate || 1;
        const baseAmount = (editForm.amount || 0) * rate;

        if (isDebit) newLines[lineIndex].debit = baseAmount;
        else newLines[lineIndex].credit = baseAmount;
        newLines[lineIndex].originalAmount = editForm.amount;

        // Simple balancing for 2-line entries
        if (newLines.length === 2) {
          const otherIndex = lineIndex === 0 ? 1 : 0;
          if (newLines[otherIndex]) {
            if (isDebit) newLines[otherIndex].credit = baseAmount;
            else newLines[otherIndex].debit = baseAmount;
            
            // Only update originalAmount of the other line if it's in the same currency
            if (newLines[otherIndex].currencyCode === newLines[lineIndex].currencyCode) {
              newLines[otherIndex].originalAmount = editForm.amount;
            } else {
              // Recalculate originalAmount for the other side based on its own rate
              const otherRate = newLines[otherIndex].exchangeRate || 1;
              newLines[otherIndex].originalAmount = baseAmount / (otherRate || 1);
            }
          }
        }
      }

      onUpdateJournalEntry?.(entry.id, {
        description: editForm.description,
        lines: newLines
      });
    }

    setEditingEntry(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  if (!selectedId) return null;

  const isTreasury = activeReport === 'TREASURY_REPORT';
  const isCustomer = activeReport === 'CUSTOMER_LEDGER';
  const isEmployee = activeReport === 'EMPLOYEE_LEDGER';
  const isAdvance = activeReport === 'EMPLOYEE_ADVANCE';
  const isPartner = activeReport === 'PARTNER_LEDGER';

  const renderClosingBalanceBox = () => {
    let balanceInAccount = 0;
    let accountCurrency = baseCurrency;
    let label = "";
    let statusColor: 'emerald' | 'rose' | 'slate' | 'indigo' = "indigo";
    let icon = <ShieldCheck size={24} />;

    if (isTreasury) {
      const treasury = (treasuries || []).find(x => x?.id === selectedId);
      if (!treasury) return null;
      const lastEntry = (ledgerEntries || [])[(ledgerEntries || []).length - 1];
      balanceInAccount = lastEntry ? lastEntry.runningBalance : openingBalance;
      accountCurrency = baseCurrency;
      
      if (treasury.type === 'CUSTODY') {
        label = balanceInAccount >= 0 ? "رصيد العهدة المتاح" : "عجز في العهدة (مطلوب تسويته)";
      } else {
        label = balanceInAccount >= 0 ? "الخزينة في حالة وفرة" : "عجز / سحب على المكشوف";
      }
      
      statusColor = balanceInAccount >= 0 ? "emerald" : "rose";
      icon = balanceInAccount >= 0 ? <ShieldCheck size={24} /> : <ArrowDownCircle size={24} />;
    } else {
      const entity = isCustomer 
        ? (customers || []).find(x => x?.id === selectedId) 
        : (isEmployee || isAdvance)
          ? (employees || []).find(x => x?.id === selectedId) 
          : isPartner 
            ? (partners || []).find(x => x?.id === selectedId)
            : (suppliers || []).find(x => x?.id === selectedId);
      
      if (!entity) return null;

      accountCurrency = (entity as any).openingBalanceCurrency || baseCurrency;
      const lastEntry = (ledgerEntries || [])[(ledgerEntries || []).length - 1];
      balanceInAccount = lastEntry ? lastEntry.runningBalance : openingBalance;

      if (isCustomer) {
        if (balanceInAccount > 0) {
          label = "إجمالي المديونية المستحقة (عليه للمؤسسة)";
          statusColor = "rose";
          icon = <ArrowUpCircle size={24} />;
        } else if (balanceInAccount < 0) {
          label = "إجمالي الرصيد الدائن (له طرفنا)";
          statusColor = "emerald";
          icon = <ArrowDownCircle size={24} />;
        } else {
          label = "الحساب متزن (رصيد صفري)";
          statusColor = "slate";
          icon = <ShieldCheck size={24} />;
        }
      } else if (isEmployee) {
        if (balanceInAccount > 0) {
          label = "إجمالي العمولات والمستحقات (له علينا)";
          statusColor = "rose";
          icon = <ArrowUpCircle size={24} />;
        } else if (balanceInAccount < 0) {
          label = "إجمالي الرصيد المدين (عليه لنا)";
          statusColor = "emerald";
          icon = <ArrowDownCircle size={24} />;
        } else {
          label = "تم تسوية كافة المستحقات";
          statusColor = "slate";
          icon = <ShieldCheck size={24} />;
        }
      } else if (isAdvance) {
        if (balanceInAccount > 0) {
          label = "إجمالي سلف الموظف المستحقة (عليه لنا)";
          statusColor = "rose";
          icon = <ArrowUpCircle size={24} />;
        } else if (balanceInAccount < 0) {
          label = "إجمالي فائض تسديد السلف (له عندنا)";
          statusColor = "emerald";
          icon = <ArrowDownCircle size={24} />;
        } else {
          label = "تم تسديد كافة السلف";
          statusColor = "slate";
          icon = <ShieldCheck size={24} />;
        }
      } else {
        if (balanceInAccount > 0) {
          label = "إجمالي المستحقات للمورد (له علينا)";
          statusColor = "rose";
          icon = <ArrowUpCircle size={24} />;
        } else if (balanceInAccount < 0) {
          label = "إجمالي الرصيد المدين للمورد (عليه لنا)";
          statusColor = "emerald";
          icon = <ArrowDownCircle size={24} />;
        } else {
          label = "الحساب متزن (رصيد صفري)";
          statusColor = "slate";
          icon = <ShieldCheck size={24} />;
        }
      }
    }

    const currencySymbol = (currencies || []).find(c => c?.code === accountCurrency)?.symbol || accountCurrency;

    const colorClasses = {
      emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
      rose: "bg-rose-50 border-rose-100 text-rose-700",
      slate: "bg-slate-50 border-slate-200 text-slate-600",
      indigo: "bg-indigo-50 border-indigo-100 text-indigo-700"
    };

    const iconBgClasses = {
      emerald: "bg-emerald-500",
      rose: "bg-rose-500",
      slate: "bg-slate-500",
      indigo: "bg-indigo-500"
    };

    if (isPrint) {
      return (
        <div className={`mt-4 p-4 rounded-2xl border-2 flex justify-between items-center ${colorClasses[statusColor]}`}>
          <div className="space-y-1">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">الرصيد الختامي للفترة</p>
            <p className="text-sm font-bold">{label}</p>
          </div>
          <div className="text-left">
            <p className="text-xl font-bold">{isHidden ? '****' : Math.abs(balanceInAccount || 0).toLocaleString() || '0'} <span className="text-[10px] font-bold">{currencySymbol}</span></p>
          </div>
        </div>
      );
    }

    return (
      <div className={`mt-6 p-4 rounded-3xl border shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 transition-all hover:shadow-md duration-500 ${colorClasses[statusColor]}`}>
        <div className="flex items-center gap-4">
          <div className={`w-10 h-10 ${iconBgClasses[statusColor]} text-white rounded-xl flex items-center justify-center shadow-md`}>
            {React.cloneElement(icon as React.ReactElement<any>, { size: 18 })}
          </div>
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest opacity-60">الرصيد الختامي للفترة المحددة</p>
            <p className="text-lg font-bold tracking-tight">{label}</p>
          </div>
        </div>
        <div className="text-left bg-white/50 px-4 py-2 rounded-xl border border-white/50">
          <p className="text-2xl font-bold tabular-nums tracking-tighter">
            {isHidden ? '****' : Math.abs(balanceInAccount || 0).toLocaleString() || '0'} 
            <span className="text-xs font-bold opacity-40 mr-2">{currencySymbol}</span>
          </p>
        </div>
      </div>
    );
  };

  const currentBalance = (ledgerEntries || []).length > 0 ? (ledgerEntries || [])[(ledgerEntries || []).length - 1].runningBalance : openingBalance;

  const getTripName = (ccId?: string, progId?: string) => {
    if (progId) {
      const prog = (programs || []).find(p => p.id === progId);
      if (prog) return { name: prog.name, type: 'PROGRAM' };
    }
    if (ccId) {
      const mt = (masterTrips || []).find(m => m.id === ccId);
      if (mt) return { name: mt.name, type: 'TRIP' };
      const cc = (costCenters || []).find(c => c.id === ccId);
      if (cc) return { name: cc.name, type: 'COST_CENTER' };
    }
    return null;
  };

  if (isTreasury) {
    const selectedTreasury = (treasuries || []).find(t => t.id === selectedId);
    const isCustody = selectedTreasury?.type === 'CUSTODY';

    return (
      <div className={`space-y-6 ${!isPrint ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''} print:animate-none print:opacity-100 print:transform-none`}>
        {!isPrint && (
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className={`absolute right-0 top-0 w-32 h-32 ${isCustody ? 'bg-indigo-50' : 'bg-amber-50'} rounded-full blur-[60px] -mr-16 -mt-16 opacity-60`}></div>
            <div className="flex items-center gap-6 relative z-10">
               <div className={`w-16 h-16 ${isCustody ? 'bg-indigo-600' : 'bg-amber-500'} text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-500`}>
                  {isCustody ? <History size={28} /> : <Landmark size={28} />}
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">
                    {isCustody ? `حركة العهدة: ${selectedTreasury?.name}` : 'حركة الخزينة والمصارف'}
                  </h3>
                  <p className={`${isCustody ? 'text-indigo-600' : 'text-amber-600'} font-bold uppercase tracking-widest text-[9px] opacity-70 flex items-center gap-2`}>
                     <ShieldCheck size={12}/> {isCustody ? 'Employee Custody Statement' : 'Cash & Bank Flow Statement'}
                  </p>
               </div>
            </div>
            <div className={`text-left ${isCustody ? 'bg-indigo-50/50' : 'bg-amber-50/50'} px-6 py-4 rounded-2xl border ${isCustody ? 'border-indigo-100/50' : 'border-amber-100/50'} relative z-10`}>
               <p className={`text-[9px] font-bold ${isCustody ? 'text-indigo-600' : 'text-amber-600'} uppercase tracking-widest mb-1 opacity-60`}>الرصيد النهائي حالياً</p>
               <p className={`text-3xl font-bold ${isCustody ? 'text-indigo-600' : 'text-amber-600'} tabular-nums tracking-tighter`}>
                 {shouldMaskAggregate ? '****' : currentBalance.toLocaleString()} <span className="text-sm font-bold opacity-40">{baseCurrency}</span>
               </p>
            </div>
          </div>
        )}

        <div className={`overflow-hidden ${isPrint ? 'rounded-2xl border-2 border-slate-900' : 'rounded-3xl border border-slate-200 bg-white shadow-sm'}`}>
           <table className="w-full text-right border-collapse">
              <thead>
                 <tr className="bg-slate-900 text-white">
                    <th className={`${isPrint ? 'p-2' : 'p-4'} font-bold text-[10px] uppercase tracking-widest border-b border-slate-800`}>التاريخ</th>
                    <th className={`${isPrint ? 'p-2' : 'p-4'} font-bold text-[10px] uppercase tracking-widest border-b border-slate-800`}>تفاصيل العملية</th>
                    <th className={`${isPrint ? 'p-2' : 'p-4'} text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800`}>وارد (+)</th>
                    <th className={`${isPrint ? 'p-2' : 'p-4'} text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800`}>صادر (-)</th>
                    <th className={`${isPrint ? 'p-2' : 'p-4'} text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800 bg-slate-900`}>الرصيد التراكمي</th>
                    {!isPrint && <th className="p-4 border-b border-slate-800"></th>}
                 </tr>
              </thead>
              <tbody className={`divide-y divide-slate-50 font-bold ${isPrint ? 'text-[10px]' : 'text-sm'}`}>
                 <tr className="bg-indigo-50/30">
                    <td className={`p-2 text-slate-400 font-medium italic ${isPrint ? 'text-[9px]' : ''}`}>{fromDate}</td>
                    <td className="p-2 text-slate-900 font-bold italic flex items-center gap-3">
                       <div className={`${isPrint ? 'w-6 h-6' : 'w-8 h-8'} bg-white rounded-lg flex items-center justify-center shadow-sm`}>
                        <ArrowLeftRight size={isPrint ? 10 : 14} className="text-indigo-400" />
                       </div>
                       رصيد ما قبل الفترة (منقول)
                    </td>
                    <td className="p-2 text-center text-slate-300">---</td>
                    <td className="p-2 text-center text-slate-300">---</td>
                    <td className={`p-2 text-center text-indigo-900 font-bold bg-indigo-50/50 tabular-nums ${isPrint ? 'text-[10px]' : 'text-base'}`}>
                       {shouldMaskAggregate ? '****' : (openingBalance || 0).toLocaleString()}
                    </td>
                    {!isPrint && <td></td>}
                 </tr>
                 {(ledgerEntries || []).map((t, idx) => {
                    const isEditing = editingEntry?.id === t.id;
                    
                    if (isEditing) {
                       return (
                          <tr key={idx} className="bg-indigo-50 animate-in slide-in-from-right-2 duration-300">
                             <td className="p-2 text-slate-400 font-medium">{t.date}</td>
                             <td className="p-2">
                                <input 
                                  type="text" 
                                  className="w-full p-2 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 outline-none text-sm font-bold"
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  autoFocus
                                />
                             </td>
                             <td className="p-2" colSpan={2}>
                                <div className="flex items-center gap-2 justify-center">
                                   <input 
                                     type="number" 
                                     className="w-32 p-2 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 outline-none text-sm font-bold text-center"
                                     value={editForm.amount}
                                     onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                                   />
                                   <span className="text-[10px] text-slate-400 font-bold">ج.م</span>
                                </div>
                             </td>
                             <td className="p-2 text-center text-indigo-900 font-bold tabular-nums">
                                {shouldMaskAggregate ? '****' : t.runningBalance.toLocaleString()}
                             </td>
                             <td className="p-2">
                                <div className="flex items-center gap-2">
                                   <button 
                                     onClick={handleSave} 
                                     className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-sm transition-all transform active:scale-95"
                                     title="حفظ التعديلات"
                                   >
                                     <Save size={16}/>
                                   </button>
                                   <button 
                                     onClick={() => setEditingEntry(null)} 
                                     className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all transform active:scale-95"
                                     title="إلغاء"
                                   >
                                     <X size={16}/>
                                   </button>
                                </div>
                             </td>
                          </tr>
                       );
                    }

                    return (
                       <tr key={idx} 
                         className={`${!isPrint ? 'hover:bg-slate-50/50 transition-all group' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}`}
                      >
                          <td className={`p-2 text-slate-400 font-medium ${isPrint ? 'text-[9px]' : ''}`}>{t.date}</td>
                          <td className="p-2">
                             <p className={`text-slate-900 font-bold ${isPrint ? 'text-[9px] leading-tight' : 'text-sm'}`}>{t.description}</p>
                             {getTripName(t.costCenterId, t.programId) && (
                               <div className="flex items-center gap-1.5 mt-1">
                                 {getTripName(t.costCenterId, t.programId)?.type === 'PROGRAM' ? <Package size={10} className="text-indigo-400"/> : <Layers size={10} className="text-indigo-400"/>}
                                 <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                   {getTripName(t.costCenterId, t.programId)?.name}
                                 </span>
                               </div>
                             )}
                             {!isPrint && (
                               <div className="flex items-center gap-3 mt-1.5">
                                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${t.debit > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                     {t.debit > 0 ? 'سند قبض / توريد' : 'سند صرف / مدفوعات'}
                                  </span>
                                  {t.refNo && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        copyToClipboard(t.refNo);
                                      }}
                                      className={`flex items-center gap-2 px-2 py-0.5 rounded-md border transition-all duration-300 ${
                                        copiedRef === t.refNo 
                                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' 
                                          : 'bg-indigo-50 text-indigo-500 border-indigo-100 hover:bg-indigo-600 hover:text-white hover:border-indigo-600'
                                      }`}
                                      title="انقر لنسخ رقم المرجع للبحث"
                                    >
                                      {copiedRef === t.refNo ? <Check size={8} /> : <Copy size={8} />}
                                      <span className="text-[9px] font-bold">
                                        {copiedRef === t.refNo ? 'تم النسخ' : `REF: ${t.refNo}`}
                                      </span>
                                    </button>
                                  )}
                               </div>
                             )}
                          </td>
                          <td className={`p-2 text-center text-emerald-600 font-bold tabular-nums ${isPrint ? 'text-[10px]' : 'text-base'}`}>
                           {t.debit > 0 ? (shouldMaskAggregate ? '****' : (t.debit || 0).toLocaleString()) : <span className="text-slate-200">-</span>}
                          </td>
                          <td className={`p-2 text-center text-rose-600 font-bold tabular-nums ${isPrint ? 'text-[10px]' : 'text-base'}`}>
                           {t.credit > 0 ? (shouldMaskAggregate ? '****' : (t.credit || 0).toLocaleString()) : <span className="text-slate-200">-</span>}
                          </td>
                          <td className={`p-2 text-center font-bold tabular-nums ${isPrint ? 'text-[10px]' : 'text-base'} ${t.runningBalance >= 0 ? 'bg-emerald-50/30 text-emerald-700' : 'bg-rose-50/30 text-rose-700'}`}>
                             {shouldMaskAggregate ? '****' : (t.runningBalance || 0).toLocaleString()}
                          </td>
                          {!isPrint && (
                            <td className="p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => handleEdit(t)}
                                 className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm transform active:scale-95"
                                 title="تعديل سريع"
                               >
                                  <Edit2 size={14} />
                               </button>
                               <button 
                                 onClick={() => {
                                   const tx = (transactions || []).find(orig => orig?.id === t?.id || (orig?.journalEntryId === t?.id && orig?.category !== 'JOURNAL_ENTRY'));
                                   if (tx) onVoidTransaction?.(tx.id);
                                   else onDeleteJournalEntry?.(t?.id);
                                 }}
                                 className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm transform active:scale-95"
                                 title="إلغاء / حذف العملية"
                               >
                                  <X size={14} />
                               </button>
                            </td>
                          )}
                       </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
        {renderClosingBalanceBox()}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${!isPrint ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''} print:animate-none print:opacity-100 print:transform-none`}>
       {!isPrint && (
         <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-60"></div>
            <div className="flex items-center gap-6 relative z-10">
               <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-500">
                  <History size={28} />
               </div>
               <div>
                  <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">كشف الحساب التفصيلي</h3>
                  <p className="text-indigo-400 font-bold uppercase tracking-widest text-[9px] opacity-70 flex items-center gap-2">
                     <Search size={12}/> Detailed Account Ledger
                  </p>
               </div>
            </div>
            <div className="flex gap-3 relative z-10">
               <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                    <Calendar size={10} /> من تاريخ
                  </p>
                  <p className="text-xs font-bold text-slate-800">{fromDate}</p>
               </div>
               <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 text-center">
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                    <Calendar size={10} /> إلى تاريخ
                  </p>
                  <p className="text-xs font-bold text-slate-800">{toDate}</p>
               </div>
            </div>
         </div>
       )}

       <div className={`overflow-hidden ${isPrint ? 'rounded-2xl border-2 border-slate-900' : 'rounded-3xl border border-slate-200 bg-white shadow-sm'}`}>
          <table className="w-full text-right border-collapse">
             <thead>
                <tr className="bg-slate-900 text-white">
                   <th className={`${isPrint ? 'p-2' : 'p-4'} font-bold text-[10px] uppercase tracking-widest border-b border-slate-800`}>التاريخ</th>
                   <th className={`${isPrint ? 'p-2' : 'p-4'} font-bold text-[10px] uppercase tracking-widest border-b border-slate-800`}>البيان والتفاصيل</th>
                   <th className={`${isPrint ? 'p-2' : 'p-4'} text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800`}>مدين (+)</th>
                   <th className={`${isPrint ? 'p-2' : 'p-4'} text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800`}>دائن (-)</th>
                   <th className={`${isPrint ? 'p-2' : 'p-4'} text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800 bg-slate-900`}>الرصيد التراكمي</th>
                   {!isPrint && <th className="p-4 border-b border-slate-800"></th>}
                </tr>
             </thead>
             <tbody className={`divide-y divide-slate-50 font-bold ${isPrint ? 'text-[10px]' : 'text-sm'}`}>
                <tr className="bg-indigo-50/30">
                   <td className={`p-2 text-slate-400 font-medium italic ${isPrint ? 'text-[9px]' : ''}`}>{fromDate}</td>
                   <td className="p-2 text-slate-900 font-bold italic flex items-center gap-3">
                      <div className={`${isPrint ? 'w-6 h-6' : 'w-8 h-8'} bg-white rounded-lg flex items-center justify-center shadow-sm`}>
                        <ArrowLeftRight size={isPrint ? 10 : 14} className="text-indigo-400" />
                      </div>
                      رصيد ما قبل الفترة (رصيد منقول)
                   </td>
                   <td className="p-2 text-center text-slate-300">---</td>
                   <td className="p-2 text-center text-slate-300">---</td>
                   <td className={`p-2 text-center text-indigo-900 font-bold bg-indigo-50/50 tabular-nums ${isPrint ? 'text-[10px]' : 'text-base'}`}>
                     {isHidden ? '****' : (openingBalance || 0).toLocaleString()}
                   </td>
                   {!isPrint && <td></td>}
                </tr>
                {ledgerEntries.map((t, idx) => {
                   const isEditing = editingEntry?.id === t.id;

                   if (isEditing) {
                      return (
                         <tr key={idx} className="bg-indigo-50 animate-in slide-in-from-right-2 duration-300">
                            <td className="p-2 text-slate-400 font-medium">{t.date}</td>
                            <td className="p-2">
                               <input 
                                 type="text" 
                                 className="w-full p-2 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 outline-none text-sm font-bold"
                                 value={editForm.description}
                                 onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                 autoFocus
                               />
                            </td>
                            <td className="p-2" colSpan={2}>
                               <div className="flex items-center gap-2 justify-center">
                                  <input 
                                    type="number" 
                                    className="w-32 p-2 rounded-xl border-2 border-indigo-200 focus:border-indigo-500 outline-none text-sm font-bold text-center"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                                  />
                               </div>
                            </td>
                            <td className="p-2 text-center text-indigo-900 font-bold tabular-nums">
                               {isHidden ? '****' : t.runningBalance.toLocaleString()}
                            </td>
                            <td className="p-2">
                               <div className="flex items-center gap-2">
                                  <button 
                                    onClick={handleSave} 
                                    className="p-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-sm transition-all transform active:scale-95"
                                    title="حفظ التعديلات"
                                  >
                                    <Save size={16}/>
                                  </button>
                                  <button 
                                    onClick={() => setEditingEntry(null)} 
                                    className="p-2 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all transform active:scale-95"
                                    title="إلغاء"
                                  >
                                    <X size={16}/>
                                  </button>
                               </div>
                            </td>
                         </tr>
                      );
                   }

                   return (
                      <tr key={idx} 
                         className={`${!isPrint ? 'hover:bg-slate-50/50 transition-all group' : (idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50')}`}
                      >
                         <td className={`p-2 text-slate-400 font-medium ${isPrint ? 'text-[9px]' : ''}`}>{t.date}</td>
                         <td className="p-2">
                            <p className={`text-slate-900 font-bold ${isPrint ? 'text-[9px] leading-tight' : 'text-sm'}`}>{t.description}</p>
                            {getTripName(t.costCenterId, t.programId) && (
                              <div className="flex items-center gap-1.5 mt-1">
                                {getTripName(t.costCenterId, t.programId)?.type === 'PROGRAM' ? <Package size={10} className="text-indigo-400"/> : <Layers size={10} className="text-indigo-400"/>}
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                                  {getTripName(t.costCenterId, t.programId)?.name}
                                </span>
                              </div>
                            )}
                            {!isPrint && (
                              <div className="flex items-center gap-2 mt-1">
                                <span 
                                  className="text-[9px] text-indigo-400 font-bold uppercase tracking-widest opacity-60 bg-indigo-50 px-1.5 py-0.5 rounded cursor-text select-all"
                                  title="انقر لنسخ رقم المرجع للبحث"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(t?.refNo || t?.id?.split('-')[0] || '');
                                  }}
                                >
                                  REF: {t?.refNo || t?.id?.split('-')[0] || 'N/A'}
                                </span>
                              </div>
                            )}
                         </td>
                         <td className={`p-2 text-center text-emerald-600 font-bold tabular-nums ${isPrint ? 'text-[10px]' : 'text-base'}`}>
                           {t.debit > 0 ? (isHidden ? '****' : (t.debit || 0).toLocaleString()) : <span className="text-slate-200">-</span>}
                         </td>
                         <td className={`p-2 text-center text-rose-600 font-bold tabular-nums ${isPrint ? 'text-[10px]' : 'text-base'}`}>
                           {t.credit > 0 ? (isHidden ? '****' : (t.credit || 0).toLocaleString()) : <span className="text-slate-200">-</span>}
                         </td>
                         <td className={`p-2 text-center font-bold tabular-nums ${isPrint ? 'text-[10px]' : 'text-base'} ${t.runningBalance >= 0 ? 'bg-emerald-50/30 text-emerald-700' : 'bg-rose-50/30 text-rose-700'}`}>
                            {isHidden ? '****' : (t.runningBalance || 0).toLocaleString()}
                         </td>
                         {!isPrint && (
                            <td className="p-2 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                               <button 
                                 onClick={() => handleEdit(t)}
                                 className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm transform active:scale-95"
                                 title="تعديل سريع"
                               >
                                  <Edit2 size={14} />
                               </button>
                               <button 
                                 onClick={() => {
                                   const tx = (transactions || []).find(orig => orig?.id === t?.id || (orig?.journalEntryId === t?.id && orig?.category !== 'JOURNAL_ENTRY'));
                                   if (tx) onVoidTransaction?.(tx.id);
                                   else onDeleteJournalEntry?.(t?.id);
                                 }}
                                 className="p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm transform active:scale-95"
                                 title="إلغاء / حذف العملية"
                               >
                                  <X size={14} />
                               </button>
                            </td>
                         )}
                      </tr>
                   );
                })}
             </tbody>
          </table>
       </div>
       {renderClosingBalanceBox()}
    </div>
  );
};

export default React.memo(AccountLedger);
