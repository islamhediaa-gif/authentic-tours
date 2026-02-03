import React from 'react';
import { BarChart3 } from 'lucide-react';

interface TrialBalanceProps {
  trialBalance: any[];
  shouldMaskAggregate: boolean;
  isPrint?: boolean;
}

const TrialBalance: React.FC<TrialBalanceProps> = ({ trialBalance, shouldMaskAggregate, isPrint = false }) => {
  if (isPrint) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500 print:animate-none print:opacity-100 print:transform-none font-['Cairo']">
        <div className="overflow-hidden rounded-2xl border-2 border-slate-900 shadow-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[12px] font-bold uppercase tracking-[0.2em]">
                <th className="p-6 text-right border-b border-slate-800">اسم الحساب المالي</th>
                <th className="p-6 text-center border-b border-slate-800">التصنيف</th>
                <th className="p-6 text-center border-b border-slate-800">مدين (Debit)</th>
                <th className="p-6 text-center border-b border-slate-800">دائن (Credit)</th>
                <th className="p-6 text-center border-b border-slate-800">الرصيد النهائي</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-bold divide-y divide-slate-100">
              {(trialBalance || []).map((item, idx) => {
                const net = (item.debit || 0) - (item.credit || 0);
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                    <td className="p-5 text-slate-900 font-bold border-l border-slate-100 text-sm">{item.name}</td>
                    <td className="p-5 text-center text-slate-400 font-bold uppercase tracking-widest border-l border-slate-100">{item.type}</td>
                    <td className="p-5 text-center text-emerald-700 font-bold text-sm border-l border-slate-100">{shouldMaskAggregate ? '****' : (item.debit || 0).toLocaleString()}</td>
                    <td className="p-5 text-center text-rose-700 font-bold text-sm border-l border-slate-100">{shouldMaskAggregate ? '****' : (item.credit || 0).toLocaleString()}</td>
                    <td className={`p-5 text-center font-bold text-sm ${net !== 0 ? (net > 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900') : 'text-slate-300'}`}>
                      {shouldMaskAggregate ? '****' : (Math.abs(net) || 0).toLocaleString()} {net > 0 ? 'مدين' : net < 0 ? 'دائن' : '0'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold">
              <tr>
                <td colSpan={2} className="p-8 text-right text-lg">إجمالي أرصدة ميزان المراجعة</td>
                <td className="p-8 text-center text-emerald-400 text-2xl tabular-nums tracking-tighter">{shouldMaskAggregate ? '****' : (trialBalance || []).reduce((s, i) => s + (i.debit || 0), 0).toLocaleString()}</td>
                <td className="p-8 text-center text-rose-400 text-2xl tabular-nums tracking-tighter">{shouldMaskAggregate ? '****' : (trialBalance || []).reduce((s, i) => s + (i.credit || 0), 0).toLocaleString()}</td>
                <td className="p-8 text-center bg-slate-800 text-white text-2xl tabular-nums tracking-tighter">
                  {shouldMaskAggregate ? '****' : ((trialBalance || []).reduce((s, i) => s + (i.debit || 0), 0) - (trialBalance || []).reduce((s, i) => s + (i.credit || 0), 0)).toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 no-print">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <BarChart3 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">ميزان المراجعة</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Trial Balance Statement</p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest border-b border-slate-800">الحساب المالي</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-center border-b border-slate-800">النوع</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-center border-b border-slate-800">مدين (+)</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-center border-b border-slate-800">دائن (-)</th>
              <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-center bg-slate-800 border-b border-slate-800">الرصيد النهائي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(trialBalance || []).map((item, idx) => {
              const net = (item.debit || 0) - (item.credit || 0);
              return (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-slate-900 font-bold text-sm">{item.name}</span>
                      <span className="text-[8px] text-slate-400 font-bold">ID: {(item.id || '').slice(0, 8)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-[9px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-bold uppercase tracking-tighter">
                      {item.type}
                    </span>
                  </td>
                  <td className="p-4 text-center text-emerald-600 font-bold text-base tabular-nums">
                    {(item.debit || 0) > 0 ? (shouldMaskAggregate ? '****' : (item.debit || 0).toLocaleString()) : '-'}
                  </td>
                  <td className="p-4 text-center text-rose-600 font-bold text-base tabular-nums">
                    {(item.credit || 0) > 0 ? (shouldMaskAggregate ? '****' : (item.credit || 0).toLocaleString()) : '-'}
                  </td>
                  <td className="p-4 text-center bg-slate-50/50">
                    {net !== 0 ? (
                      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-bold text-sm ${net > 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        <span>{shouldMaskAggregate ? '****' : Math.abs(net || 0).toLocaleString()}</span>
                        <span className="text-[8px] opacity-70 font-bold">{net > 0 ? '(مدين)' : '(دائن)'}</span>
                      </div>
                    ) : <span className="text-slate-300">-</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-slate-900 text-white font-bold">
            <tr>
              <td colSpan={2} className="p-5 text-sm">إجمالي ميزان المراجعة</td>
              <td className="p-5 text-center text-emerald-400 text-lg tabular-nums">{shouldMaskAggregate ? '****' : (trialBalance || []).reduce((s, i) => s + (i.debit || 0), 0).toLocaleString()}</td>
              <td className="p-5 text-center text-rose-400 text-lg tabular-nums">{shouldMaskAggregate ? '****' : (trialBalance || []).reduce((s, i) => s + (i.credit || 0), 0).toLocaleString()}</td>
              <td className="p-5 text-center bg-slate-800 text-white">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] opacity-60 mb-0.5 uppercase tracking-widest font-bold">الصافي</span>
                  <span className="text-lg tabular-nums tracking-tighter">{shouldMaskAggregate ? '****' : ((trialBalance || []).reduce((s, i) => s + (i.debit || 0), 0) - (trialBalance || []).reduce((s, i) => s + (i.credit || 0), 0)).toLocaleString()}</span>
                </div>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default TrialBalance;
