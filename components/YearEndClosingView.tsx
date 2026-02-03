
import React, { useState, useMemo } from 'react';
import { LockKeyhole, AlertTriangle, CheckCircle2, RefreshCw, Landmark, Users, Truck, ArrowRightCircle } from 'lucide-react';
import { Customer, Supplier, Treasury, Transaction, JournalEntry, CompanySettings, User, Currency } from '../types';

interface YearEndClosingViewProps {
  customers: Customer[];
  suppliers: Supplier[];
  treasuries: Treasury[];
  employees: any[];
  partners: any[];
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  currencies: Currency[];
  onClosingComplete: (newCustomers: Customer[], newSuppliers: Supplier[], newTreasuries: Treasury[], newEmployees: any[], newPartners: any[]) => void;
  settings: CompanySettings;
  currentUser: User;
}

const YearEndClosingView: React.FC<YearEndClosingViewProps> = ({ 
  customers, suppliers, treasuries, employees, partners, transactions, journalEntries, currencies, onClosingComplete, settings, currentUser
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const [distributionMode, setDistributionMode] = useState<'EQUALLY' | 'MANUAL' | 'RETAINED'>('RETAINED');
  const [manualDistribution, setManualDistribution] = useState<Record<string, number>>({});

  const stats = useMemo(() => {
    // حساب الأرصدة الحقيقية من القيود لتجنب الاعتماد على خاصية balance المخزنة
    const balances: Record<string, number> = {};
    
    // 1. إضافة الأرصدة الافتتاحية الحالية
    (customers || []).forEach(c => { if (c?.id) balances[`CUSTOMER-${c.id}`] = (c.openingBalanceInBase || 0); });
    (suppliers || []).forEach(s => { if (s?.id) balances[`SUPPLIER-${s.id}`] = (s.openingBalanceInBase || 0); });
    (treasuries || []).forEach(t => { if (t?.id) balances[`TREASURY-${t.id}`] = (t.openingBalance || 0); });
    (partners || []).forEach(p => { if (p?.id) balances[`PARTNER-${p.id}`] = (p.openingBalance || 0); });
    (employees || []).forEach(e => {
      if (e?.id) {
        balances[`LIABILITY-${e.id}`] = (e.openingBalance || 0);
        balances[`EMPLOYEE_ADVANCE-${e.id}`] = (e.openingAdvances || 0);
      }
    });

    // 2. معالجة كافة القيود
    let revenue = 0;
    let expense = 0;
    
    (journalEntries || []).forEach(entry => {
      if (entry && entry.lines) {
        (entry.lines || []).forEach(line => {
          if (line && line.accountId && line.accountType) {
            const key = `${line.accountType}-${line.accountId}`;
            if (balances[key] === undefined) balances[key] = 0;

            if (['CUSTOMER', 'TREASURY', 'EMPLOYEE_ADVANCE', 'ASSET'].includes(line.accountType)) {
              balances[key] += ((line.debit || 0) - (line.credit || 0));
            } else if (['SUPPLIER', 'LIABILITY', 'PARTNER', 'EQUITY', 'REVENUE', 'EXPENSE'].includes(line.accountType)) {
              balances[key] += ((line.credit || 0) - (line.debit || 0));
            }

            if (line.accountType === 'REVENUE') revenue += ((line.credit || 0) - (line.debit || 0));
            if (line.accountType === 'EXPENSE') expense += ((line.debit || 0) - (line.credit || 0));
          }
        });
      }
    });

    const totalAssets = (treasuries || []).reduce((s, t) => s + (t && balances[`TREASURY-${t.id}`] || 0), 0) + 
                        (customers || []).reduce((s, c) => s + (c && balances[`CUSTOMER-${c.id}`] || 0), 0) + 
                        (employees || []).reduce((s, e) => s + (e && balances[`EMPLOYEE_ADVANCE-${e.id}`] || 0), 0);
    
    const totalLiabilities = (suppliers || []).reduce((s, su) => s + (su && balances[`SUPPLIER-${su.id}`] || 0), 0) + 
                             (employees || []).reduce((s, e) => s + (e && balances[`LIABILITY-${e.id}`] || 0), 0) + 
                             (partners || []).reduce((s, p) => s + (p && balances[`PARTNER-${p.id}`] || 0), 0);

    return {
      assets: totalAssets,
      liabilities: totalLiabilities,
      equity: totalAssets - totalLiabilities,
      netProfit: revenue - expense,
      balances
    };
  }, [customers, suppliers, treasuries, employees, partners, journalEntries]);

  const handleExecuteClosing = () => {
    if (!confirm('⚠️ تنبيه هام جداً: هل أنت متأكد من إقفال السنة المالية؟ \n\n سيتم ترحيل الأرصدة الحالية لتصبح أرصدة افتتاحية وسيتم تصفير سجل العمليات والقيود بالكامل لبدء سنة جديدة.')) return;
    
    setIsProcessing(true);
    
    // محاكاة تأخير بسيط للجدية
    setTimeout(() => {
      const profit = stats.netProfit;
      const currentBalances = stats.balances;
      
      // 1. ترحيل العملاء
      const newCustomers = (customers || []).map(c => {
        const currency = (currencies || []).find(curr => curr?.code === c?.openingBalanceCurrency) || (currencies || []).find(curr => curr?.code === (settings?.baseCurrency || 'EGP')) || { rateToMain: 1 };
        const rate = currency?.rateToMain || 1;
        const actualBalance = currentBalances[`CUSTOMER-${c?.id}`] || 0;
        const finalCurrencyBalance = actualBalance * (1 / rate);
        return {
          ...c,
          openingBalance: finalCurrencyBalance,
          openingBalanceInBase: actualBalance,
          balance: actualBalance,
          currencyBalance: finalCurrencyBalance
        };
      });

      // 2. ترحيل الموردين
      const newSuppliers = (suppliers || []).map(s => {
        const currency = (currencies || []).find(curr => curr?.code === s?.openingBalanceCurrency) || (currencies || []).find(curr => curr?.code === (settings?.baseCurrency || 'EGP')) || { rateToMain: 1 };
        const rate = currency?.rateToMain || 1;
        const actualBalance = currentBalances[`SUPPLIER-${s?.id}`] || 0;
        const finalCurrencyBalance = actualBalance * (1 / rate);
        return {
          ...s,
          openingBalance: finalCurrencyBalance,
          openingBalanceInBase: actualBalance,
          balance: actualBalance,
          currencyBalance: finalCurrencyBalance
        };
      });

      // 3. ترحيل الخزائن
      const newTreasuries = (treasuries || []).map(t => {
        const actualBalance = currentBalances[`TREASURY-${t?.id}`] || 0;
        return {
          ...t,
          openingBalance: actualBalance,
          balance: actualBalance
        };
      });

      // 4. ترحيل الموظفين
      const newEmployees = (employees || []).map(e => {
        const actualBalance = currentBalances[`LIABILITY-${e.id}`] || 0;
        const actualAdvances = currentBalances[`EMPLOYEE_ADVANCE-${e.id}`] || 0;
        return {
          ...e,
          openingBalance: actualBalance,
          openingAdvances: actualAdvances,
          balance: actualBalance,
          advances: actualAdvances
        };
      });

      // 5. ترحيل الشركاء مع معالجة الأرباح
      let newPartners = (partners || []).map(p => ({
        ...p,
        balance: currentBalances[`PARTNER-${p?.id}`] || 0
      }));
      
      if (profit !== 0) {
        if (distributionMode === 'RETAINED') {
          const retainedIdx = newPartners.findIndex(p => p?.id?.startsWith('P-RETAINED-') || p?.name === 'أرباح مرحلة');
          if (retainedIdx > -1) {
            newPartners[retainedIdx] = { ...newPartners[retainedIdx], balance: (newPartners[retainedIdx].balance || 0) + profit };
          } else {
            newPartners.push({ id: `P-RETAINED-${Date.now()}`, name: 'أرباح مرحلة', balance: profit });
          }
        } else if (distributionMode === 'EQUALLY') {
          const realPartners = newPartners.filter(p => !p?.id?.startsWith('P-RETAINED-'));
          if (realPartners.length > 0) {
            const share = profit / realPartners.length;
            newPartners = newPartners.map(p => {
              if (!p?.id?.startsWith('P-RETAINED-')) {
                return { ...p, balance: (p?.balance || 0) + share };
              }
              return p;
            });
          }
        } else if (distributionMode === 'MANUAL') {
          newPartners = newPartners.map(p => ({ ...p, balance: (p?.balance || 0) + (manualDistribution[p?.id || ''] || 0) }));
        }
      }

      const finalPartners = newPartners.map(p => ({
        ...p,
        openingBalance: p?.balance || 0,
        balance: p?.balance || 0
      }));

      onClosingComplete(newCustomers, newSuppliers, newTreasuries, newEmployees, finalPartners);
      setIsProcessing(false);
      setStep(3);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 p-10 text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-indigo-500 bg-opacity-5 blur-3xl rounded-full -mr-20 -mt-20 w-64 h-64"></div>
           <div className="w-20 h-20 bg-indigo-500 bg-opacity-10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500 border-opacity-20 relative z-10">
              <LockKeyhole size={40} className="text-indigo-400" />
           </div>
           <h2 className="text-3xl font-bold text-white mb-2 relative z-10">إقفال السنة المالية والترحيل</h2>
           <p className="text-indigo-400 text-opacity-60 font-medium tracking-[0.2em] uppercase text-xs relative z-10">نظام التحويل للأرصدة الافتتاحية الجديدة</p>
        </div>

        {step === 1 && (
          <div className="p-10 space-y-8">
             <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-start gap-5">
                <AlertTriangle className="text-amber-600 shrink-0" size={32} />
                <div className="space-y-1">
                   <h4 className="text-lg font-bold text-amber-900">ماذا سيحدث عند الإقفال؟</h4>
                   <ul className="list-disc list-inside text-amber-800 font-medium space-y-1 text-sm">
                      <li>سيتم اعتماد الرصيد الحالي لكل عميل ومورد كـ "رصيد افتتاحي" للسنة الجديدة.</li>
                      <li>سيتم مسح سجل العمليات والقيود الحالية (يُنصح بتحميل نسخة احتياطية أولاً).</li>
                      <li>ستبدأ السنة المالية الجديدة بسجل نظيف تماماً مع الحفاظ على المديونيات.</li>
                   </ul>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <SummaryBox label="إجمالي السيولة (الخزائن)" value={shouldMaskAggregate ? '****' : ((treasuries || []).reduce((s,t)=>(s+(t && stats.balances[`TREASURY-${t.id}`] || 0)),0) || 0).toLocaleString() || '0'} color="text-emerald-600" />
                <SummaryBox label="ديون العملاء (الأصول)" value={shouldMaskAggregate ? '****' : ((customers || []).reduce((s,c)=>(s+(c && stats.balances[`CUSTOMER-${c.id}`] || 0)),0) || 0).toLocaleString() || '0'} color="text-slate-700" />
                <SummaryBox label="مستحقات الموردين (الخصوم)" value={shouldMaskAggregate ? '****' : ((suppliers || []).reduce((s,su)=>(s+(su && stats.balances[`SUPPLIER-${su.id}`] || 0)),0) || 0).toLocaleString() || '0'} color="text-rose-500" />
                <SummaryBox label="مستحقات الموظفين" value={shouldMaskAggregate ? '****' : ((employees || []).reduce((s,e)=>s+(e && stats.balances[`LIABILITY-${e.id}`]||0),0) || 0).toLocaleString() || '0'} color="text-rose-500" />
                <SummaryBox label="سلف الموظفين (أصول)" value={shouldMaskAggregate ? '****' : ((employees || []).reduce((s,e)=>s+(e && stats.balances[`EMPLOYEE_ADVANCE-${e.id}`]||0),0) || 0).toLocaleString() || '0'} color="text-emerald-500" />
                <SummaryBox label="جاري الشركاء" value={shouldMaskAggregate ? '****' : ((partners || []).reduce((s,p)=>s+(p && stats.balances[`PARTNER-${p.id}`]||0),0) || 0).toLocaleString() || '0'} color="text-slate-900" />
                <SummaryBox label="صافي الربح المستحق للترحيل" value={shouldMaskAggregate ? '****' : (stats.netProfit || 0).toLocaleString() || '0'} color="text-amber-600" />
             </div>

             <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 space-y-6">
                <div>
                   <h4 className="text-sm font-bold text-slate-900 mb-4 uppercase">توزيع صافي الربح المستحق ({(stats.netProfit || 0).toLocaleString() || '0'})</h4>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button 
                        onClick={() => setDistributionMode('RETAINED')}
                        className={`p-4 rounded-xl border font-bold text-sm transition-all ${distributionMode === 'RETAINED' ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-400'}`}
                      >
                         ترحيل كأرباح مرحلة
                      </button>
                      <button 
                        onClick={() => {
                          setDistributionMode('EQUALLY');
                          const realPartners = (partners || []).filter(p => !p?.id?.startsWith('P-RETAINED-'));
                          const share = stats.netProfit * (1 / (realPartners.length || 1));
                          const manual: Record<string, number> = {};
                          (partners || []).forEach(p => {
                            if (p?.id) {
                              if (!p.id.startsWith('P-RETAINED-')) {
                                manual[p.id] = share;
                              } else {
                                manual[p.id] = 0;
                              }
                            }
                          });
                          setManualDistribution(manual);
                        }}
                        className={`p-4 rounded-xl border font-bold text-sm transition-all ${distributionMode === 'EQUALLY' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-400'}`}
                      >
                         توزيع بالتساوي على الشركاء
                      </button>
                      <button 
                        onClick={() => setDistributionMode('MANUAL')}
                        className={`p-4 rounded-xl border font-bold text-sm transition-all ${distributionMode === 'MANUAL' ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 bg-white text-slate-400'}`}
                      >
                         توزيع يدوي مخصص
                      </button>
                   </div>
                </div>

                {distributionMode === 'MANUAL' && (
                  <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-100">
                    {(partners || []).map(p => (
                      <div key={p?.id} className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-sm text-slate-700">{p?.name || '---'}</span>
                           {p?.id?.startsWith('P-RETAINED-') && <span className="bg-amber-50 text-amber-600 text-[8px] px-2 py-0.5 rounded-full font-bold uppercase">حساب تجمعيعي</span>}
                        </div>
                        <input 
                          type="number"
                          className="p-2 bg-slate-50 rounded-lg border border-slate-200 w-32 text-center font-bold text-sm outline-none focus:border-indigo-500 transition-all"
                          value={p?.id ? manualDistribution[p.id] || 0 : 0}
                          onChange={e => { if (p?.id) setManualDistribution({...manualDistribution, [p.id]: parseFloat(e.target.value || '0')}); }}
                        />
                      </div>
                    ))}
                    <div className="pt-3 border-t flex justify-between font-bold text-sm text-slate-900">
                       <span>إجمالي الموزع:</span>
                       <span className={(Object.values(manualDistribution) as number[]).reduce((a,b)=>a+b,0) === stats.netProfit ? 'text-emerald-600' : 'text-rose-600'}>
                         {((Object.values(manualDistribution) as number[]).reduce((a,b)=>a+b,0) || 0).toLocaleString() || '0'} / {(stats.netProfit || 0).toLocaleString() || '0'}
                       </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                   <span className="text-xl font-bold text-slate-900 uppercase">صافي المركز المالي للترحيل</span>
                   <span className="text-2xl font-bold text-amber-600">{shouldMaskAggregate ? '****' : (stats.equity || 0).toLocaleString() || '0'} ج.م</span>
                </div>
                <button 
                  onClick={() => {
                    if (distributionMode === 'MANUAL' && (Object.values(manualDistribution) as number[]).reduce((a,b)=>a+b,0) !== stats.netProfit) {
                      alert('يجب أن يتساوى إجمالي الموزع يدوياً مع صافي الربح');
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full bg-slate-900 text-indigo-400 py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-500 hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                   مراجعة الأرصدة الافتتاحية <ArrowRightCircle size={24} />
                </button>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-10 space-y-8">
             <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-900">مراجعة الأرصدة النهائية للترحيل</h3>
                <button onClick={() => setStep(1)} className="text-slate-400 font-bold text-sm hover:text-slate-600 transition-all underline">تعديل التوزيع</button>
             </div>

             <div className="bg-slate-50 rounded-2xl border border-slate-100 divide-y divide-slate-200">
                <div className="p-4 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                   <span>البند</span>
                   <span>الرصيد النهائي (الافتتاحي القادم)</span>
                </div>
                <div className="max-h-96 overflow-y-auto">
                   {[
                     ...customers.map(c => ({ name: `عميل: ${c.name}`, val: stats.balances[`CUSTOMER-${c.id}`] || 0, color: 'text-slate-700' })),
                     ...suppliers.map(s => ({ name: `مورد: ${s.company}`, val: stats.balances[`SUPPLIER-${s.id}`] || 0, color: 'text-rose-500' })),
                     ...treasuries.map(t => ({ name: `خزينة: ${t.name}`, val: stats.balances[`TREASURY-${t.id}`] || 0, color: 'text-emerald-600' })),
                     ...partners.map(p => ({ 
                       name: `شريك: ${p.name}`, 
                       val: (stats.balances[`PARTNER-${p.id}`] || 0) + (manualDistribution[p.id] || 0), 
                       color: 'text-slate-900' 
                     }))
                   ].map((row, i) => (
                     <div key={i} className="p-4 flex items-center justify-between bg-white/50 hover:bg-white transition-all">
                        <span className="text-sm font-bold text-slate-600">{row.name}</span>
                        <span className={`text-sm font-bold tabular-nums ${row.color}`}>{shouldMaskAggregate ? '****' : row.val.toLocaleString()} ج.م</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="p-8 bg-rose-50 border border-rose-100 rounded-3xl space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                      <AlertTriangle className="text-rose-600" size={24} />
                   </div>
                   <div>
                      <h4 className="text-lg font-bold text-rose-900">تأكيد الإجراء النهائي</h4>
                      <p className="text-sm text-rose-700 font-medium">هذا الإجراء لا يمكن التراجع عنه. سيتم تصفير جميع العمليات الحالية.</p>
                   </div>
                </div>

                <button 
                  onClick={handleExecuteClosing}
                  disabled={isProcessing}
                  className="w-full bg-rose-600 text-white py-5 rounded-2xl font-bold text-xl shadow-lg hover:bg-rose-700 transition-all active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw size={24} className="animate-spin" /> جاري تنفيذ الإقفال والترحيل...
                    </>
                  ) : (
                    <>
                      تنفيذ الإقفال النهائي والترحيل <CheckCircle2 size={24} />
                    </>
                  )}
                </button>
             </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-20 text-center space-y-8 animate-in zoom-in duration-500">
             <div className="w-32 h-32 bg-indigo-50 rounded-full flex items-center justify-center mx-auto border-2 border-indigo-100">
                <CheckCircle2 size={64} className="text-indigo-600" />
             </div>
             <div className="space-y-2">
                <h3 className="text-4xl font-bold text-slate-900">تم الإقفال بنجاح!</h3>
                <p className="text-indigo-600 font-bold text-lg uppercase tracking-widest">أهلاً بك في السنة المالية الجديدة</p>
             </div>
             <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                تم ترحيل جميع الأرصدة بنجاح وتصفير سجل العمليات. يمكنك الآن البدء في تسجيل معاملات السنة الجديدة.
             </p>
             <button 
               onClick={() => window.location.reload()}
               className="bg-slate-900 text-indigo-400 px-12 py-5 rounded-2xl font-bold text-lg shadow-lg hover:bg-indigo-500 hover:text-slate-900 transition-all active:scale-95"
             >
                بدء العمل الآن
             </button>
          </div>
        )}

        {/* Status Bar */}
        <div className="bg-slate-50 p-6 flex justify-between items-center border-t border-slate-100">
           <div className="flex gap-6">
              <StatusItem icon={<Landmark size={12}/>} label="الخزائن" count={treasuries.length} />
              <StatusItem icon={<Users size={12}/>} label="العملاء" count={customers.length} />
              <StatusItem icon={<Truck size={12}/>} label="الموردين" count={suppliers.length} />
              <StatusItem icon={<Users size={12}/>} label="الموظفين" count={(employees || []).length} />
              <StatusItem icon={<Users size={12}/>} label="الشركاء" count={(partners || []).length} />
           </div>
           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">المحاسب: {settings.accountantName}</div>
        </div>
      </div>
    </div>
  );
};

const SummaryBox: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
     <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
     <p className={`text-xl font-bold ${color}`}>{value} <span className="text-[10px] opacity-40">ج.م</span></p>
  </div>
);

const StatusItem: React.FC<{ icon: React.ReactNode; label: string; count: number }> = ({ icon, label, count }) => (
  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
     {icon} {label}: <span className="text-slate-900">{count}</span>
  </div>
);

export default YearEndClosingView;
