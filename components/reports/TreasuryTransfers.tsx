import React from 'react';
import { ArrowLeftRight, Calendar, ArrowRight, Wallet, Info } from 'lucide-react';
import { Transaction, Treasury } from '../../types';

interface TreasuryTransfersProps {
  transactions: Transaction[];
  treasuries: Treasury[];
  fromDate: string;
  toDate: string;
  isPrint?: boolean;
  baseCurrency?: string;
}

const TreasuryTransfers: React.FC<TreasuryTransfersProps> = ({ transactions, treasuries, fromDate, toDate, isPrint, baseCurrency = 'EGP' }) => {
  const transfers = (transactions || []).filter(t => 
    t &&
    !t.isVoided && 
    t.type === 'TRANSFER' && 
    (t.date || '') >= fromDate && 
    (t.date || '') <= toDate
  ).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

  const getTreasuryName = (id?: string) => (treasuries || []).find(t => t && t.id === id)?.name || 'غير معروف';

  const totalTransfers = transfers.reduce((sum, t) => sum + (t.amount || 0), 0);

  const groupedTransfers = transfers.reduce((acc, t) => {
    if (!t) return acc;
    const key = `${t.treasuryId}-${t.targetEntityId}`;
    if (!acc[key]) {
      acc[key] = {
        from: t.treasuryId,
        to: t.targetEntityId,
        amount: 0,
        count: 0
      };
    }
    acc[key].amount += (t.amount || 0);
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { from?: string; to?: string; amount: number; count: number }>);

  const routeSummary: { from?: string; to?: string; amount: number; count: number }[] = Object.values(groupedTransfers).sort((a, b) => b.amount - a.amount);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Summary Cards */}
      {!isPrint && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <ArrowLeftRight size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي التحويلات</p>
              <p className="text-xl font-bold text-slate-900">{totalTransfers.toLocaleString()} <span className="text-xs opacity-50">{baseCurrency}</span></p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <Info size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">عدد العمليات</p>
              <p className="text-xl font-bold text-slate-900">{transfers.length} عملية</p>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Calendar size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">الفترة الزمنية</p>
              <p className="text-sm font-bold text-slate-900">من {fromDate} إلى {toDate}</p>
            </div>
          </div>
        </div>
      )}

      {/* Transfers Table */}
      <div className={`${isPrint ? '' : 'bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm'}`}>
        <table className="w-full text-right">
          <thead>
            <tr className={`${isPrint ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'} border-b border-slate-200`}>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">التاريخ</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">من خزينة</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center"></th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">إلى خزينة</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">المبلغ</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">البيان والتفاصيل</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transfers.length > 0 ? (
              transfers.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-bold text-slate-900">{t.date || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Wallet size={14} className="text-slate-400" />
                      <span className="text-xs font-bold text-slate-700">{getTreasuryName(t.treasuryId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <ArrowLeftRight size={14} className="text-indigo-400 mx-auto" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <ArrowRight size={14} className="text-emerald-400" />
                      <span className="text-xs font-bold text-slate-700">{getTreasuryName(t.targetEntityId)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-black text-slate-900">{(t.amount || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-400">{t.currencyCode || baseCurrency}</span></span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-bold text-slate-500 leading-relaxed">{t.description || '-'}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                      <ArrowLeftRight size={32} />
                    </div>
                    <p className="text-slate-400 font-bold text-sm">لا توجد عمليات تحويل بين الخزائن في هذه الفترة</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          {transfers.length > 0 && (
            <tfoot className="border-t-2 border-slate-900">
              <tr className="bg-slate-50 font-black">
                <td colSpan={4} className="px-6 py-4 text-xs text-slate-900 text-left">إجمالي المبالغ المحولة:</td>
                <td className="px-6 py-4 text-sm text-indigo-600 font-bold">{totalTransfers.toLocaleString()} {baseCurrency}</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Route Summary */}
      {transfers.length > 0 && (
        <div className={`mt-8 ${isPrint ? 'border-t-2 border-slate-100 pt-8' : ''}`}>
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
              <ArrowLeftRight size={16} />
            </div>
            <h3 className="text-sm font-black text-slate-900">ملخص التحويلات حسب المسار</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routeSummary.map((route, idx) => (
              <div key={idx} className={`${isPrint ? 'bg-white border-2 border-slate-100' : 'bg-slate-50 border border-slate-200'} p-5 rounded-2xl transition-all hover:shadow-md`}>
                <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2">
                     <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{getTreasuryName(route.from)}</span>
                     <ArrowRight size={12} className="text-indigo-400" />
                     <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{getTreasuryName(route.to)}</span>
                   </div>
                   <div className="flex flex-col items-end">
                     <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">العمليات</span>
                     <span className="text-xs font-black text-slate-700">{route.count}</span>
                   </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black text-slate-900">{route.amount.toLocaleString()}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{baseCurrency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TreasuryTransfers;
