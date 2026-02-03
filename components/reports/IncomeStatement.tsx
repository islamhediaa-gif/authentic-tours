import React from 'react';

interface IncomeStatementProps {
  stats: any;
  fromDate: string;
  toDate: string;
  formatCurrency: (amount: number) => string;
  shouldMaskAggregate: boolean;
  isPrint?: boolean;
}

const IncomeStatement: React.FC<IncomeStatementProps> = ({ stats, fromDate, toDate, formatCurrency, shouldMaskAggregate, isPrint = false }) => {
  const safeStats = stats || {};
  const safeFormatCurrency = typeof formatCurrency === 'function' ? formatCurrency : (val: number) => val.toLocaleString();

  if (isPrint) {
    return (
      <div className="space-y-8 animate-in zoom-in-95 duration-500 print:animate-none print:opacity-100 print:transform-none">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-6">
              <h4 className="text-xl font-bold border-b-2 border-emerald-500 pb-2 flex justify-between items-center text-slate-900">
                 <span>الإيرادات (Revenues)</span>
              </h4>
              <div className="space-y-3 text-slate-800">
                 <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><span>إيرادات حجز طيران</span> <span className="font-bold">{shouldMaskAggregate ? '****' : (safeStats.flightRevenue || 0).toLocaleString()}</span></div>
                 <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><span>إيرادات برامج الحج والعمرة</span> <span className="font-bold">{shouldMaskAggregate ? '****' : (safeStats.hajjUmrahRevenue || 0).toLocaleString()}</span></div>
                 <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><span>إيرادات خدمات متنوعة</span> <span className="font-bold">{shouldMaskAggregate ? '****' : (safeStats.serviceRevenue || 0).toLocaleString()}</span></div>
                 <div className="flex justify-between p-4 bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg">
                    <span>إجمالي الإيرادات</span>
                    <span>{shouldMaskAggregate ? '****' : (safeStats.totalSales || 0).toLocaleString()}</span>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <h4 className="text-xl font-bold border-b-2 border-rose-500 pb-2 flex justify-between items-center text-slate-900">
                 <span>المصروفات (Expenses)</span>
              </h4>
              <div className="space-y-3 text-slate-800">
                 <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><span>تكلفة المبيعات المباشرة</span> <span className="font-bold">{shouldMaskAggregate ? '****' : (safeStats.totalCost || 0).toLocaleString()}</span></div>
                 <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100"><span>المصروفات التشغيلية والديون</span> <span className="font-bold">{shouldMaskAggregate ? '****' : (safeStats.expenses || 0).toLocaleString()}</span></div>
                 <div className="flex justify-between p-4 bg-rose-600 text-white rounded-xl font-bold text-lg shadow-lg">
                    <span>إجمالي التكاليف</span>
                    <span>{shouldMaskAggregate ? '****' : ((safeStats.totalCost || 0) + (safeStats.expenses || 0)).toLocaleString() || '0'}</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-12 flex justify-between items-center p-8 bg-slate-900 text-white rounded-3xl border-r-[15px] border-emerald-500 shadow-2xl relative overflow-hidden">
           <div className="relative z-10">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">النتيجة النهائية للفترة</p>
              <h3 className="text-3xl font-bold">صافي الربح / الخسارة التشغيلية</h3>
           </div>
           <div className="relative z-10 text-left">
              <p className="text-5xl font-bold text-emerald-400 tabular-nums">{shouldMaskAggregate ? '****' : (safeStats.netProfit || 0).toLocaleString()} <span className="text-xl font-medium text-white/60">ج.م</span></p>
           </div>
        </div>
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in zoom-in-95 duration-500 no-print">
      <div className="bg-white p-6 rounded-3xl text-slate-900 border border-slate-200 shadow-sm relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-full blur-[60px] -mr-16 -mt-16 opacity-60"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-100 pb-6 gap-4 relative z-10">
          <div>
            <h3 className="text-xl font-bold">بيان الأرباح والخسائر التشغيلي</h3>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest dir-ltr" dir="ltr">{fromDate} - {toDate}</p>
          </div>
          <div className={`px-6 py-3 rounded-2xl border font-bold ${(safeStats.netProfit || 0) >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            <p className="text-[9px] uppercase tracking-widest mb-0.5 opacity-70">صافي الربح / الخسارة</p>
            <p className="text-2xl tabular-nums tracking-tighter">{shouldMaskAggregate ? '****' : safeFormatCurrency(safeStats.netProfit || 0)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <div className="space-y-4">
            <h4 className="text-emerald-700 font-bold text-[10px] uppercase tracking-widest border-r-4 border-emerald-500 pr-3">تدفقات الإيرادات</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <span className="text-slate-600 text-sm">إيرادات حجز طيران</span>
                <span className="font-bold text-base tabular-nums">{shouldMaskAggregate ? '****' : (safeStats.flightRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <span className="text-slate-600 text-sm">إيرادات العمرة والحج</span>
                <span className="font-bold text-base tabular-nums">{shouldMaskAggregate ? '****' : (safeStats.hajjUmrahRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <span className="text-slate-600 text-sm">إيرادات خدمات أخرى</span>
                <span className="font-bold text-base tabular-nums">{shouldMaskAggregate ? '****' : (safeStats.serviceRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100">
                <span className="text-emerald-700 font-bold text-sm">إجمالي الإيرادات</span>
                <span className="text-xl font-bold text-emerald-700 tabular-nums">{shouldMaskAggregate ? '****' : (safeStats.totalRevenues || safeStats.totalSales || 0).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-rose-700 font-bold text-[10px] uppercase tracking-widest border-r-4 border-rose-500 pr-3">التكاليف والمصروفات</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <span className="text-slate-600 text-sm">تكاليف مباشرة</span>
                <span className="font-bold text-base tabular-nums">{shouldMaskAggregate ? '****' : (safeStats.totalDirectCosts || safeStats.totalCost || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl border border-slate-50 hover:bg-slate-50 transition-colors">
                <span className="text-slate-600 text-sm">مصروفات إدارية</span>
                <span className="font-bold text-base tabular-nums">{shouldMaskAggregate ? '****' : (safeStats.adminExpenses || safeStats.expenses || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pt-4 mt-2 border-t border-slate-100">
                <span className="text-rose-700 font-bold text-sm">إجمالي التكاليف</span>
                <span className="text-xl font-bold text-rose-700 tabular-nums">{shouldMaskAggregate ? '****' : ((safeStats.totalDirectCosts || safeStats.totalCost || 0) + (safeStats.adminExpenses || safeStats.expenses || 0)).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeStatement;
