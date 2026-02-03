import React from 'react';
import { ShieldCheck, Coins, Landmark, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';

interface BalanceSheetProps {
  totals: any;
  trialBalance: any[];
  formatCurrency: (amount: number) => string;
  shouldMaskAggregate: boolean;
  isHidden: boolean;
  toDate: string;
  isPrint?: boolean;
}

const BalanceSheet: React.FC<BalanceSheetProps> = ({ totals, trialBalance, formatCurrency, shouldMaskAggregate, isHidden, toDate, isPrint = false }) => {
  if (isPrint) {
    return (
      <div className="grid grid-cols-2 gap-0 border-2 border-slate-900">
        <div className="border-l-2 border-slate-900">
           <div className="bg-slate-900 text-white p-3 font-bold text-center text-xs uppercase tracking-widest">الأصول (Assets)</div>
           <div className="p-4 space-y-4 text-[10px] font-bold">
              {/* Cash & Banks */}
              <div>
                 <p className="border-b border-slate-200 text-[8px] text-slate-400 mb-2 uppercase font-bold">السيولة النقدية والبنكية</p>
                 <div className="space-y-1">
                    {(trialBalance || []).filter(b => b.type === 'TREASURY').map((b, idx) => (
                       <div key={idx} className="flex justify-between"><span>{b.name}</span> <span>{shouldMaskAggregate ? '****' : (b.debit - b.credit).toLocaleString() || '0'}</span></div>
                    ))}
                 </div>
              </div>

              {/* Customers */}
              <div>
                 <p className="border-b border-slate-200 text-[8px] text-slate-400 mb-2 uppercase font-bold">مديونيات العملاء</p>
                 <div className="space-y-1">
                    {(trialBalance || []).filter(b => b.type === 'CUSTOMER').sort((a,b) => (b.debit-b.credit) - (a.debit-a.credit)).slice(0, 15).map((b, idx) => (
                       <div key={idx} className="flex justify-between"><span>{b.name}</span> <span>{isHidden ? '****' : (b.debit - b.credit).toLocaleString() || '0'}</span></div>
                    ))}
                    {(trialBalance || []).filter(b => b.type === 'CUSTOMER').length > 15 && <div className="text-center text-[7px] text-slate-300 italic">... وغيرهم من العملاء</div>}
                 </div>
              </div>

              {/* Employee Advances */}
              <div>
                 <p className="border-b border-slate-200 text-[8px] text-slate-400 mb-2 uppercase font-bold">سلف ومسحوبات موظفين</p>
                 <div className="space-y-1">
                    {(trialBalance || []).filter(b => b.type === 'EMPLOYEE_ADVANCE').map((b, idx) => (
                       <div key={idx} className="flex justify-between"><span>{b.name}</span> <span>{isHidden ? '****' : (b.debit - b.credit).toLocaleString() || '0'}</span></div>
                    ))}
                 </div>
              </div>

              {(trialBalance || []).filter(b => b.type === 'ASSET' && b.id !== 'INVENTORY_ASSET').map((b, idx) => (
                <div key={idx} className="flex justify-between"><span>{b.name}</span> <span>{shouldMaskAggregate ? '****' : (b.debit - b.credit).toLocaleString() || '0'}</span></div>
              ))}
              <div className="mt-10 pt-4 border-t-2 border-slate-900 font-bold flex justify-between text-xs bg-slate-50 p-2">
                 <span>إجمالي الأصول</span>
                 <span>{shouldMaskAggregate ? '****' : (
                   (trialBalance || []).filter(b => b.type === 'TREASURY' || b.type === 'CUSTOMER' || b.type === 'EMPLOYEE_ADVANCE').reduce((s, b) => s + (b.debit - b.credit), 0) +
                   (trialBalance || []).filter(b => b.type === 'ASSET' && b.id !== 'INVENTORY_ASSET').reduce((s, b) => s + (b.debit - b.credit), 0)
                 ).toLocaleString() || '0'}</span>
              </div>
           </div>
        </div>
        <div>
           <div className="bg-slate-900 text-white p-3 font-bold text-center text-xs uppercase tracking-widest">الخصوم والملكبة (Liabilities)</div>
           <div className="p-4 space-y-4 text-[10px] font-bold">
              {/* Suppliers */}
              <div>
                 <p className="border-b border-slate-200 text-[8px] text-slate-400 mb-2 uppercase font-bold">مستحقات الموردين</p>
                 <div className="space-y-1">
                    {(trialBalance || []).filter(b => b.type === 'SUPPLIER').sort((a,b) => (a.debit-b.credit) - (b.debit-b.credit)).slice(0, 15).map((b, idx) => (
                       <div key={idx} className="flex justify-between"><span>{b.name}</span> <span>{isHidden ? '****' : Math.abs((b.debit || 0) - (b.credit || 0)).toLocaleString() || '0'}</span></div>
                    ))}
                    {(trialBalance || []).filter(b => b.type === 'SUPPLIER').length > 15 && <div className="text-center text-[7px] text-slate-300 italic">... وغيرهم من الموردين</div>}
                 </div>
              </div>

              {/* Partners */}
              <div>
                 <p className="border-b border-slate-200 text-[8px] text-slate-400 mb-2 uppercase font-bold">جاري الشركاء وحقوق الملكية</p>
                 <div className="space-y-1">
                    {(trialBalance || []).filter(b => b.type === 'PARTNER').map((b, idx) => (
                       <div key={idx} className="flex justify-between"><span>{b.name}</span> <span>{isHidden ? '****' : Math.abs((b.debit || 0) - (b.credit || 0)).toLocaleString() || '0'}</span></div>
                    ))}
                 </div>
              </div>

              {(trialBalance || []).filter(b => b.type === 'LIABILITY').map((b, idx) => (
                <div key={idx} className="flex justify-between"><span>{b.name}</span> <span>{shouldMaskAggregate ? '****' : Math.abs((b.debit || 0) - (b.credit || 0)).toLocaleString() || '0'}</span></div>
              ))}
              <div className="flex justify-between pt-4 italic text-slate-500 border-t border-dashed">
                 <span>الأرباح المحتجزة / رأس المال</span>
                 <span>{shouldMaskAggregate ? '****' : (
                   ((trialBalance || []).filter(b => b.type === 'TREASURY' || b.type === 'CUSTOMER' || b.type === 'EMPLOYEE_ADVANCE').reduce((s, b) => s + (b.debit - b.credit), 0) +
                    (trialBalance || []).filter(b => b.type === 'ASSET' && b.id !== 'INVENTORY_ASSET').reduce((s, b) => s + (b.debit - b.credit), 0)) 
                   - 
                   Math.abs((trialBalance || []).filter(b => b.type === 'SUPPLIER' || b.type === 'LIABILITY' || b.type === 'PARTNER').reduce((s, b) => s + (b.debit - b.credit), 0))
                 ).toLocaleString() || '0'}</span>
              </div>
              <div className="mt-10 pt-4 border-t-2 border-slate-900 font-bold flex justify-between text-xs bg-slate-50 p-2">
                 <span>إجمالي الخصوم والملكية</span>
                 <span>{shouldMaskAggregate ? '****' : (
                   (trialBalance || []).filter(b => b.type === 'TREASURY' || b.type === 'CUSTOMER' || b.type === 'EMPLOYEE_ADVANCE').reduce((s, b) => s + (b.debit - b.credit), 0) +
                   (trialBalance || []).filter(b => b.type === 'ASSET' && b.id !== 'INVENTORY_ASSET').reduce((s, b) => s + (b.debit - b.credit), 0)
                 ).toLocaleString() || '0'}</span>
              </div>
           </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-8 animate-in fade-in duration-500 print:animate-none print:opacity-100 print:transform-none">
       {/* Premium Header Card */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-60"></div>
          <div className="flex items-center gap-6 relative z-10">
             <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-transform duration-500">
                <Landmark size={28} />
             </div>
             <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">قائمة المركز المالي</h3>
                <p className="text-indigo-400 font-bold uppercase tracking-widest text-[9px] opacity-70 flex items-center gap-2">
                   <ShieldCheck size={12}/> Statement of Financial Position • As of {toDate}
                </p>
             </div>
          </div>
          <div className="text-left bg-indigo-50/50 px-6 py-4 rounded-2xl border border-indigo-100/50 relative z-10">
             <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1 opacity-60">إجمالي الميزانية العمومية</p>
             <p className="text-3xl font-bold text-indigo-600 tabular-nums tracking-tighter">
                {shouldMaskAggregate ? '****' : (totals?.assets || 0).toLocaleString()} <span className="text-sm font-bold opacity-40">ج.م</span>
             </p>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Assets Column */}
          <div className="space-y-6">
             <div className="flex items-center gap-4 mb-2 px-2">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-md">
                   <ArrowUpCircle size={24} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 tracking-tight">الأصول والاستخدامات</h4>
             </div>
             
             <div className="space-y-4">
                {/* Cash & Banks */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-500">
                   <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">السيولة النقدية والبنكية</h5>
                   <div className="space-y-3">
                      {(trialBalance || []).filter(b => b.type === 'TREASURY').map((b, idx) => (
                         <div key={idx} className="flex justify-between items-center group">
                            <span className="text-slate-600 font-bold text-sm group-hover:text-indigo-600 transition-colors">{b.name}</span>
                            <span className="font-bold text-slate-900 text-base tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : ((b.debit || 0) - (b.credit || 0)).toLocaleString() || '0'}</span>
                         </div>
                      ))}
                      <div className="pt-4 mt-1 border-t-2 border-slate-50 flex justify-between items-center">
                         <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">إجمالي السيولة</span>
                         <div className="bg-indigo-50 px-4 py-1.5 rounded-xl">
                            <span className="text-indigo-600 font-bold text-lg tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : ((trialBalance || []).filter(b => b.type === 'TREASURY').reduce((s, b) => s + (b.debit - b.credit), 0) || 0).toLocaleString() || '0'}</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Customers */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-500">
                   <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">مديونيات العملاء (ذمم مدينة)</h5>
                   <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {(trialBalance || []).filter(b => b.type === 'CUSTOMER').sort((a,b) => (b.debit-b.credit) - (a.debit-a.credit)).map((b, idx) => (
                         <div key={idx} className="flex justify-between items-center group">
                            <span className="text-slate-600 font-bold text-sm group-hover:text-emerald-600 transition-colors">{b.name}</span>
                            <span className="font-bold text-slate-900 text-base tabular-nums tracking-tight">{isHidden ? '****' : ((b.debit || 0) - (b.credit || 0)).toLocaleString() || '0'}</span>
                         </div>
                      ))}
                   </div>
                   <div className="pt-6 mt-3 border-t-2 border-slate-50 flex justify-between items-center">
                      <span className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">إجمالي الذمم المدينة</span>
                      <div className="bg-emerald-50 px-4 py-1.5 rounded-xl">
                        <span className="text-emerald-600 font-bold text-lg tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : ((trialBalance || []).filter(b => b.type === 'CUSTOMER').reduce((s, b) => s + (b.debit - b.credit), 0) || 0).toLocaleString() || '0'}</span>
                      </div>
                   </div>
                </div>

                {/* Employee Advances */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-500">
                   <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">سلف ومسحوبات موظفين</h5>
                   <div className="space-y-3">
                      {(trialBalance || []).filter(b => b.type === 'EMPLOYEE_ADVANCE').map((b, idx) => (
                         <div key={idx} className="flex justify-between items-center group">
                            <span className="text-slate-600 font-bold text-sm group-hover:text-amber-600 transition-colors">{b.name}</span>
                            <span className="font-bold text-slate-900 text-base tabular-nums tracking-tight">{isHidden ? '****' : ((b.debit || 0) - (b.credit || 0)).toLocaleString() || '0'}</span>
                         </div>
                      ))}
                      {(trialBalance || []).filter(b => b.type === 'EMPLOYEE_ADVANCE').length === 0 && <p className="text-xs text-slate-300 font-bold text-center py-2">لا توجد سلف قائمة حالياً</p>}
                      <div className="pt-4 mt-1 border-t-2 border-slate-50 flex justify-between items-center font-bold">
                         <span className="text-slate-400 uppercase tracking-widest text-[9px]">إجمالي العهد والسلف</span>
                         <span className="text-slate-900 text-lg tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : ((trialBalance || []).filter(b => b.type === 'EMPLOYEE_ADVANCE').reduce((s, b) => s + (b.debit - b.credit), 0) || 0).toLocaleString() || '0'}</span>
                      </div>
                   </div>
                </div>
                
                {/* Other Assets */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-500">
                   <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">أصول أخرى وخطابات ضمان</h5>
                   <div className="space-y-3">
                      {(trialBalance || []).filter(b => b.type === 'ASSET' && b.id !== 'INVENTORY_ASSET').map((b, idx) => (
                         <div key={idx} className="flex justify-between items-center group">
                            <span className="text-slate-600 font-bold text-sm group-hover:text-indigo-600 transition-colors">{b.name}</span>
                            <span className="font-bold text-slate-900 text-base tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : ((b.debit || 0) - (b.credit || 0)).toLocaleString() || '0'}</span>
                         </div>
                      ))}
                      {(trialBalance || []).filter(b => b.type === 'ASSET' && b.id !== 'INVENTORY_ASSET').length === 0 && <p className="text-xs text-slate-300 font-bold text-center py-2">لا توجد أصول أخرى</p>}
                      <div className="pt-6 mt-2 border-t-2 border-slate-50 flex justify-between items-center font-bold">
                         <span className="text-slate-400 uppercase tracking-widest text-[10px]">إجمالي الأصول غير المتداولة</span>
                         <span className="text-slate-900 text-xl tabular-nums tracking-tighter">{shouldMaskAggregate ? '****' : ((trialBalance || []).filter(b => b.type === 'ASSET' && b.id !== 'INVENTORY_ASSET').reduce((s, b) => s + (b.debit - b.credit), 0) || 0).toLocaleString() || '0'}</span>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Liabilities & Equity Column */}
          <div className="space-y-6">
             <div className="flex items-center gap-4 mb-2 px-2">
                <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-md">
                   <ArrowDownCircle size={24} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 tracking-tight">الخصوم والالتزامات</h4>
             </div>

             <div className="space-y-4">
                {/* Suppliers */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-500">
                   <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">مستحقات الموردين (ذمم دائنة)</h5>
                   <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {(trialBalance || []).filter(b => b.type === 'SUPPLIER').sort((a,b) => (b.credit-b.debit) - (a.credit-a.debit)).map((b, idx) => (
                         <div key={idx} className="flex justify-between items-center group">
                            <span className="text-slate-600 font-bold text-sm group-hover:text-rose-600 transition-colors">{b.name}</span>
                            <span className="font-bold text-slate-900 text-base tabular-nums tracking-tight">{isHidden ? '****' : ((b.credit || 0) - (b.debit || 0)).toLocaleString() || '0'}</span>
                         </div>
                      ))}
                   </div>
                   <div className="pt-6 mt-3 border-t-2 border-slate-50 flex justify-between items-center">
                      <span className="text-rose-600 font-bold uppercase tracking-widest text-[10px]">إجمالي الذمم الدائنة</span>
                      <div className="bg-rose-50 px-4 py-1.5 rounded-xl">
                        <span className="text-rose-600 font-bold text-lg tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : ((trialBalance || []).filter(b => b.type === 'SUPPLIER').reduce((s, b) => s + (b.credit - b.debit), 0) || 0).toLocaleString() || '0'}</span>
                      </div>
                   </div>
                </div>

                {/* Liabilities */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md transition-all duration-500">
                   <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-3">مستحقات الرواتب والالتزامات</h5>
                   <div className="space-y-3">
                      {(trialBalance || []).filter(b => b.type === 'LIABILITY').map((b, idx) => (
                         <div key={idx} className="flex justify-between items-center group">
                            <span className="text-slate-600 font-bold text-sm group-hover:text-rose-600 transition-colors">{b.name}</span>
                            <span className="font-bold text-slate-900 text-base tabular-nums tracking-tight">{isHidden ? '****' : ((b.credit || 0) - (b.debit || 0)).toLocaleString() || '0'}</span>
                         </div>
                      ))}
                      <div className="pt-6 mt-2 border-t-2 border-slate-50 flex justify-between items-center font-bold">
                         <span className="text-slate-400 uppercase tracking-widest text-[9px]">إجمالي الالتزامات الجارية</span>
                         <span className="text-rose-600 text-lg tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : ((trialBalance || []).filter(b => b.type === 'LIABILITY').reduce((s, b) => s + (b.credit - b.debit), 0) || 0).toLocaleString() || '0'}</span>
                      </div>
                   </div>
                </div>

                {/* Equity Section - Premium Dark */}
                <div className="bg-slate-900 p-8 rounded-3xl text-white shadow-sm relative overflow-hidden group">
                   <div className="absolute -right-16 -top-16 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px]"></div>
                   
                   <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2 relative z-10">
                      <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                      حقوق الملكية والأرباح المحتجزة
                   </h5>
                   
                   <div className="space-y-4 relative z-10">
                      {(trialBalance || []).filter(b => b.type === 'PARTNER' || b.type === 'EQUITY').map((b, idx) => (
                         <div key={idx} className="flex justify-between items-center group/item">
                            <span className="text-slate-400 font-bold text-sm group-hover/item:text-white transition-colors">{b.name}</span>
                            <span className="font-bold text-lg tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : ((b.credit || 0) - (b.debit || 0)).toLocaleString() || '0'}</span>
                         </div>
                      ))}
                      
                      <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-all">
                         <div>
                            <span className="text-emerald-400 font-bold uppercase tracking-widest text-[8px] block mb-0.5">Current Period Result</span>
                            <span className="text-white font-bold text-sm">أرباح / (خسائر) الفترة الحالية</span>
                         </div>
                         <span className={`text-xl font-bold tabular-nums tracking-tight ${totals?.currentNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {shouldMaskAggregate ? '****' : (totals?.currentNetProfit || 0).toLocaleString()}
                         </span>
                      </div>
                      
                      <div className="pt-6 mt-2 border-t border-white/10 flex justify-between items-center">
                         <span className="text-indigo-400 font-bold text-base uppercase tracking-widest">إجمالي رأس المال والملكبة</span>
                         <span className="text-2xl font-bold text-indigo-400 tabular-nums tracking-tighter">
                            {shouldMaskAggregate ? '****' : (totals?.totalEquity || 0).toLocaleString()}
                         </span>
                      </div>
                   </div>
                </div>
             </div>
          </div>
       </div>

       {/* Bottom Balancing Bar */}
       <div className="bg-indigo-600 p-8 rounded-3xl text-white flex flex-col xl:flex-row justify-between items-center gap-6 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-transparent opacity-50"></div>
          
          <div className="relative z-10 text-center xl:text-right">
             <h4 className="text-2xl font-bold mb-1 tracking-tight">توازن المركز المالي (Balanced)</h4>
             <p className="text-indigo-100 text-[9px] font-bold uppercase tracking-widest opacity-80">Accounting Equation: Assets = Liabilities + Equity</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
             <div className="text-center">
                <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-1.5 opacity-70">إجمالي الأصول</p>
                <p className="text-3xl font-bold tabular-nums tracking-tighter">{shouldMaskAggregate ? '****' : (totals?.assets || 0).toLocaleString()}</p>
             </div>
             
             <div className="hidden md:block w-px h-12 bg-white/20"></div>
             
             <div className="text-center">
                <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest mb-1.5 opacity-70">الخصوم + حقوق الملكية</p>
                <p className="text-3xl font-bold tabular-nums tracking-tighter">{shouldMaskAggregate ? '****' : ((totals?.liabilities || 0) + (totals?.totalEquity || 0)).toLocaleString()}</p>
             </div>

             {Math.abs((totals?.assets || 0) - ((totals?.liabilities || 0) + (totals?.totalEquity || 0))) < 1 ? (
                <div className="bg-white text-indigo-600 p-4 rounded-2xl shadow-lg transform group-hover:rotate-[360deg] transition-transform duration-1000">
                   <ShieldCheck size={28} />
                </div>
             ) : (
                <div className="bg-rose-500 text-white p-4 rounded-2xl shadow-lg animate-pulse">
                   <Landmark size={28} />
                </div>
             )}
          </div>
       </div>
    </div>
  );
};

export default BalanceSheet;
