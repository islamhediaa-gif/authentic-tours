import React, { useMemo } from 'react';
import { Calculator, User as UserIcon, Eye, ShieldCheck, TrendingUp, BarChart3, Target } from 'lucide-react';
import { Transaction } from '../../types';

interface CommissionReportProps {
  analyticsData: any;
  filteredTx: Transaction[];
  shouldMaskAggregate: boolean;
  fromDate: string;
  toDate: string;
  setActiveReport: (report: any) => void;
  setSelectedId: (id: string) => void;
  isPrint?: boolean;
}

const CommissionReport: React.FC<CommissionReportProps> = ({ 
  analyticsData, 
  filteredTx, 
  shouldMaskAggregate, 
  fromDate, 
  toDate,
  setActiveReport,
  setSelectedId,
  isPrint = false
}) => {
  const employeePerf = analyticsData?.employeePerf || [];
  const totalCommission = employeePerf.reduce((s: number, e: any) => s + e.commission, 0);
  const totalVolume = employeePerf.reduce((s: number, e: any) => s + e.volume, 0);

  if (isPrint) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500 print:animate-none print:opacity-100 print:transform-none">
        <div className="overflow-hidden rounded-2xl border-2 border-slate-900 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[11px] font-bold uppercase tracking-wider">
                <th className="p-4 text-right border-b border-slate-700">اسم الموظف</th>
                <th className="p-4 text-center border-b border-slate-700">حجم المبيعات</th>
                <th className="p-4 text-center border-b border-slate-700">العمولة المستحقة</th>
                <th className="p-4 text-center border-b border-slate-700">عدد العمليات</th>
              </tr>
            </thead>
            <tbody className="text-[10px] font-bold divide-y divide-slate-200">
              {employeePerf.map((emp: any, idx: number) => (
                <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="p-3 border-x border-slate-200 text-slate-900 font-bold">{emp.name}</td>
                  <td className="p-3 border-x border-slate-200 text-center">{shouldMaskAggregate ? '****' : (emp.volume || 0).toLocaleString()}</td>
                  <td className="p-3 border-x border-slate-200 text-center text-amber-700 font-bold">{shouldMaskAggregate ? '****' : (emp.commission || 0).toLocaleString()}</td>
                  <td className="p-3 border-x border-slate-200 text-center">
                    {(filteredTx || []).filter(t => t?.employeeId === emp?.id).length} عملية
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold text-xs">
              <tr>
                <td className="p-4 text-right">إجمالي العمولات المستحقة</td>
                <td className="p-4 text-center">{shouldMaskAggregate ? '****' : (totalVolume || 0).toLocaleString()}</td>
                <td className="p-4 text-center text-amber-400">{shouldMaskAggregate ? '****' : (totalCommission || 0).toLocaleString()}</td>
                <td className="p-4 text-center">-</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-white relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-amber-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-60"></div>
        <div className="flex items-center gap-4 relative z-10">
           <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 transform group-hover:scale-110 transition-transform duration-500">
              <Calculator size={28} />
           </div>
           <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">عمولات الموظفين</h3>
              <p className="text-amber-600 font-bold uppercase tracking-[0.2em] text-[9px] opacity-70 flex items-center gap-2">
                 <ShieldCheck size={12}/> Sales Performance & Commissions Analysis
              </p>
           </div>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-amber-50 px-6 py-4 rounded-2xl border border-amber-100 text-center">
              <p className="text-[9px] font-bold text-amber-600 uppercase tracking-[0.2em] mb-1 opacity-60">إجمالي العمولات المستحقة</p>
              <p className="text-2xl font-bold text-amber-600 tabular-nums tracking-tight">
                {shouldMaskAggregate ? '****' : totalCommission.toLocaleString()} <span className="text-xs font-bold opacity-40">ج.م</span>
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
            <BarChart3 size={120} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">إجمالي حجم المبيعات</p>
          <p className="text-3xl font-bold tabular-nums">
            {shouldMaskAggregate ? '****' : totalVolume.toLocaleString()}
            <span className="text-sm font-medium opacity-40 mr-2">ج.م</span>
          </p>
        </div>
        <div className="bg-emerald-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
            <Target size={120} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">متوسط عمولة الموظف</p>
          <p className="text-3xl font-bold tabular-nums">
            {shouldMaskAggregate ? '****' : Math.round(totalCommission / (employeePerf.length || 1)).toLocaleString()}
            <span className="text-sm font-medium opacity-40 mr-2">ج.م</span>
          </p>
        </div>
      </div>

      <div className={`overflow-hidden rounded-3xl border border-white bg-white shadow-sm`}>
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-4 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">اسم الموظف</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">حجم المبيعات (حسب الصرف)</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800 bg-amber-600/20">العمولة المستحقة</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">عدد العمليات</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium text-xs">
            {(employeePerf || []).length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400 italic font-medium">لا توجد بيانات عمولات متاحة</td>
              </tr>
            ) : (
              (employeePerf || []).map((emp: any, idx: number) => {
                const txCount = (filteredTx || []).filter(t => t?.employeeId === emp?.id).length;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-amber-500 group-hover:text-white transition-all duration-500">
                          <UserIcon size={14} />
                        </div>
                        <p className="text-slate-900 font-bold text-sm group-hover:text-amber-600 transition-colors">{emp.name}</p>
                      </div>
                    </td>
                    <td className="p-4 text-center text-slate-600 font-bold text-base tabular-nums">
                      {shouldMaskAggregate ? '****' : (emp.volume || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-amber-700 bg-amber-50/30 font-bold text-lg tabular-nums">
                      {shouldMaskAggregate ? '****' : (emp.commission || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center text-slate-400">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        {txCount} عملية
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => {setActiveReport('EMPLOYEE_LEDGER'); setSelectedId(emp.id);}} 
                        className="bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-4 py-2 rounded-xl flex items-center gap-2 justify-center mx-auto transition-all duration-500 font-bold text-[9px] uppercase tracking-widest active:scale-95 shadow-sm"
                      >
                        <Eye size={12} /> كشف الحساب
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(CommissionReport);
