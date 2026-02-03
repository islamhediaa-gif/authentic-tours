import React, { useMemo } from 'react';
import { User as UserIcon, ShieldCheck, Search, Users, TrendingUp, TrendingDown } from 'lucide-react';
import { Customer, Currency } from '../../types';

interface CustomersSummaryProps {
  customers: Customer[];
  balanceMap: Record<string, { base: number, currency: number }>;
  isHidden: boolean;
  currencies: Currency[];
  searchTerm: string;
  isPrint?: boolean;
  baseCurrency?: string;
}

const CustomersSummary: React.FC<CustomersSummaryProps> = ({ 
  customers, 
  balanceMap, 
  isHidden, 
  currencies, 
  searchTerm,
  isPrint = false,
  baseCurrency = 'EGP'
}) => {
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const s = searchTerm.toLowerCase();
    return (customers || []).filter(c => (c.name || '').toLowerCase().includes(s));
  }, [customers, searchTerm]);

  const totalCustDebt = useMemo(() => {
    return (customers || []).reduce((sum, c) => {
      if (!c) return sum;
      const b = (balanceMap || {})[`CUSTOMER-${c.id}`]?.base || 0;
      return sum + (b > 0 ? b : 0);
    }, 0);
  }, [customers, balanceMap]);

  if (isPrint) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 print:animate-none print:opacity-100 print:transform-none">
        <div className="overflow-hidden rounded-2xl border-2 border-slate-900 shadow-sm">
          <table className="w-full text-right text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white font-bold uppercase tracking-widest">
                <th className="p-4 border-b border-slate-700">اسم العميل</th>
                <th className="p-4 text-center border-b border-slate-700">الرصيد المحلي (ج.م)</th>
                <th className="p-4 text-center border-b border-slate-700">الرصيد بالعملة</th>
                <th className="p-4 text-center border-b border-slate-700">العملة</th>
                <th className="p-4 text-center border-b border-slate-700">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-bold text-[10px]">
              {(filteredCustomers || []).map((c, idx) => {
                if (!c) return null;
                const balanceData = (balanceMap || {})[`CUSTOMER-${c.id}`];
                const balance = balanceData?.base || 0;
                if (balance === 0) return null;
                const accountCurrency = c.openingBalanceCurrency || baseCurrency;
                const balanceInCurrency = balanceData?.currency || 0;
                const currencySymbol = (currencies || []).find(curr => curr && curr.code === accountCurrency)?.symbol || 'ج.م';
                
                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="p-3 border-x border-slate-200 font-bold">{c.name || '-'}</td>
                    <td className={`p-3 text-center border-x border-slate-200 ${balance > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {isHidden ? '****' : (balance || 0).toLocaleString()}
                    </td>
                    <td className={`p-3 text-center border-x border-slate-200 ${balanceInCurrency > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                      {isHidden ? '****' : Math.abs(balanceInCurrency || 0).toLocaleString()}
                    </td>
                    <td className="p-3 text-center border-x border-slate-200">{accountCurrency}</td>
                    <td className="p-3 text-center border-x border-slate-200 font-bold">
                      {balance > 0 ? 'مدين (عليه)' : 'دائن (له)'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-bold text-xs">
              <tr>
                <td className="p-4">إجمالي المديونيات</td>
                <td className="p-4 text-center">{isHidden ? '****' : totalCustDebt.toLocaleString()}</td>
                <td colSpan={3}></td>
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
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-60"></div>
        <div className="flex items-center gap-4 relative z-10">
           <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 transform group-hover:scale-110 transition-transform duration-500">
              <Users size={28} />
           </div>
           <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">مديونيات العملاء</h3>
              <p className="text-indigo-400 font-bold uppercase tracking-[0.2em] text-[9px] opacity-70 flex items-center gap-2">
                 <ShieldCheck size={12}/> Customers Accounts Summary • Credit Control
              </p>
           </div>
        </div>
        <div className="flex gap-4 relative z-10">
           <div className="bg-rose-50 px-6 py-4 rounded-2xl border border-rose-100 text-center">
              <p className="text-[9px] font-bold text-rose-400 uppercase tracking-[0.2em] mb-1 opacity-60">إجمالي المديونيات المستحقة</p>
              <p className="text-2xl font-bold text-rose-600 tabular-nums tracking-tight">
                {isHidden ? '****' : (totalCustDebt || 0).toLocaleString()} <span className="text-xs font-bold opacity-40">ج.م</span>
              </p>
           </div>
        </div>
      </div>

      <div className={`overflow-hidden rounded-3xl border border-white bg-white shadow-sm`}>
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-4 font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">اسم العميل</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">الرصيد المحلي (ج.م)</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">الرصيد بالعملة</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800">العملة</th>
              <th className="p-4 text-center font-bold text-[10px] uppercase tracking-widest border-b border-slate-800 bg-slate-900">حالة الحساب</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 font-medium text-xs">
            {(!filteredCustomers || filteredCustomers.length === 0) ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-slate-400 italic font-medium">لا توجد مديونيات قائمة حالياً</td>
              </tr>
            ) : (
              filteredCustomers.map((c, idx) => {
                if (!c) return null;
                const balanceData = (balanceMap || {})[`CUSTOMER-${c.id}`];
                const balance = balanceData?.base || 0;
                if (balance === 0) return null;

                const accountCurrency = c.openingBalanceCurrency || baseCurrency;
                const balanceInCurrency = balanceData?.currency || 0;
                const currencySymbol = (currencies || []).find(curr => curr && curr.code === accountCurrency)?.symbol || 'ج.م';
                
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-all group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                          <UserIcon size={14} />
                        </div>
                        <p className="text-slate-900 font-bold text-sm group-hover:text-indigo-600 transition-colors">{c.name || '-'}</p>
                      </div>
                    </td>
                    <td className={`p-4 text-center font-bold text-base tabular-nums ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isHidden ? '****' : (balance || 0).toLocaleString()}
                    </td>
                    <td className={`p-4 text-center font-bold text-base tabular-nums ${balanceInCurrency > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isHidden ? '****' : Math.abs(balanceInCurrency || 0).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        {currencySymbol} ({accountCurrency})
                      </span>
                    </td>
                    <td className="p-4 text-center bg-slate-50/30">
                      {balance > 0 ? (
                        <div className="flex items-center justify-center gap-2 text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl">
                          <TrendingUp size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">عليه مديونية</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl">
                          <TrendingDown size={12} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">له رصيد دائن</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Stats Footer */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
            <Users size={120} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">عدد العملاء المشمولين</p>
          <p className="text-3xl font-bold tabular-nums">{(filteredCustomers || []).filter(c => c && ((balanceMap || {})[`CUSTOMER-${c.id}`]?.base || 0) !== 0).length}</p>
        </div>
        <div className="bg-slate-900 p-6 rounded-3xl text-white shadow-lg relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-10 translate-y-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform duration-700">
            <ShieldCheck size={120} />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 mb-2">متوسط مديونية العميل</p>
          <p className="text-3xl font-bold tabular-nums">
            {isHidden ? '****' : Math.round(totalCustDebt / ((filteredCustomers || []).filter(c => c && ((balanceMap || {})[`CUSTOMER-${c.id}`]?.base || 0) > 0).length || 1)).toLocaleString()}
            <span className="text-sm font-medium opacity-40 mr-2">ج.م</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CustomersSummary);
