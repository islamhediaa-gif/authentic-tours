import React, { useMemo } from 'react';
import { User as UserIcon, ShieldCheck, Users, TrendingUp, Phone, MessageSquare } from 'lucide-react';
import { Customer, Currency, Transaction, Employee } from '../../types';

interface EmployeeDebtFollowupProps {
  customers: Customer[];
  employees: Employee[];
  transactions: Transaction[];
  balanceMap: Record<string, { base: number, currency: number }>;
  isHidden: boolean;
  currencies: Currency[];
  searchTerm: string;
  isPrint?: boolean;
  baseCurrency?: string;
}

const EmployeeDebtFollowup: React.FC<EmployeeDebtFollowupProps> = ({ 
  customers, 
  employees,
  transactions,
  balanceMap, 
  isHidden, 
  currencies, 
  searchTerm,
  isPrint = false,
  baseCurrency = 'EGP'
}) => {
  // الربط بين الموظفين والعملاء بناءً على المعاملات
  const employeeCustomerMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    
    // نمر على كل المعاملات ونجمع العملاء لكل موظف
    (transactions || []).forEach(tx => {
      if (tx && !tx.isVoided && tx.employeeId && tx.relatedEntityId) {
        if (!map[tx.employeeId]) {
          map[tx.employeeId] = new Set();
        }
        map[tx.employeeId].add(tx.relatedEntityId);
      }
    });

    return map;
  }, [transactions]);

  const debtData = useMemo(() => {
    const data: { employee: Employee, customers: (Customer & { debt: number })[] }[] = [];

    (employees || []).forEach(emp => {
      if (!emp) return;
      const assignedCustomerIds = employeeCustomerMap[emp.id] || new Set();
      const empCustomers: (Customer & { debt: number })[] = [];

      assignedCustomerIds.forEach(custId => {
        const customer = (customers || []).find(c => c && c.id === custId);
        const balance = (balanceMap || {})[`CUSTOMER-${custId}`]?.base || 0;
        
        if (customer && balance > 0) {
          empCustomers.push({ ...customer, debt: balance });
        }
      });

      if (empCustomers.length > 0) {
        // ترتيب العملاء حسب قيمة المديونية
        empCustomers.sort((a, b) => b.debt - a.debt);
        data.push({ employee: emp, customers: empCustomers });
      }
    });

    // فلترة بناءً على البحث
    if (!searchTerm) return data;
    const s = searchTerm.toLowerCase();
    return (data || []).filter(item => 
      item && item.employee && (
        (item.employee.name || '').toLowerCase().includes(s) || 
        (item.customers || []).some(c => c && (c.name || '').toLowerCase().includes(s))
      )
    );
  }, [employees, customers, balanceMap, employeeCustomerMap, searchTerm]);

  if (isPrint) {
    return (
      <div className="space-y-6">
        {(debtData || []).map((item, idx) => (
          <div key={idx} className="space-y-2 break-inside-avoid mb-8">
            <div className="bg-slate-100 p-3 rounded-lg border border-slate-300">
              <h3 className="font-bold text-sm">الموظف: {item.employee?.name || '-'}</h3>
              <p className="text-[10px]">عدد العملاء المدينين: {item.customers?.length || 0}</p>
            </div>
            <table className="w-full text-right text-[10px] border-collapse">
              <thead>
                <tr className="bg-slate-200">
                  <th className="p-2 border border-slate-300">اسم العميل</th>
                  <th className="p-2 border border-slate-300">رقم الهاتف</th>
                  <th className="p-2 text-center border border-slate-300">المديونية (ج.م)</th>
                </tr>
              </thead>
              <tbody>
                {(item.customers || []).map((c, cidx) => (
                  <tr key={cidx}>
                    <td className="p-2 border border-slate-300">{c.name || '-'}</td>
                    <td className="p-2 border border-slate-300">{c.phone || '-'}</td>
                    <td className="p-2 text-center border border-slate-300 font-bold">
                      {isHidden ? '****' : (c.debt || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Premium Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-white relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-60"></div>
        <div className="flex items-center gap-4 relative z-10">
           <div className="w-16 h-16 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200 transform group-hover:scale-110 transition-transform duration-500">
              <ShieldCheck size={28} />
           </div>
           <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">متابعة تحصيل المديونيات</h3>
              <p className="text-rose-400 font-bold uppercase tracking-[0.2em] text-[9px] opacity-70 flex items-center gap-2">
                 <ShieldCheck size={12}/> Debt Collection Follow-up • Employee Assignment
              </p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {debtData.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center shadow-sm">
            <Users size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">لا توجد مديونيات مرتبطة بموظفين حالياً</p>
          </div>
        ) : (
          debtData.map((item, idx) => (
            <div key={idx} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-sm">
                    <UserIcon size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.employee?.name || '-'}</h4>
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{item.employee?.position || 'موظف'}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center min-w-[120px]">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">إجمالي التحصيل المطلوب</p>
                    <p className="text-lg font-bold text-rose-600">
                      {isHidden ? '****' : (item.customers || []).reduce((s, c) => s + (c.debt || 0), 0).toLocaleString()} <span className="text-[10px] opacity-40">ج.م</span>
                    </p>
                  </div>
                  <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-center">
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">عدد العملاء</p>
                    <p className="text-lg font-bold text-indigo-600">{item.customers?.length || 0}</p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-white text-slate-400">
                      <th className="p-4 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100">العميل</th>
                      <th className="p-4 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100 text-center">رقم الهاتف</th>
                      <th className="p-4 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100 text-center">المديونية</th>
                      <th className="p-4 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(item.customers || []).map((c, cidx) => (
                      <tr key={cidx} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="p-4">
                          <p className="font-bold text-slate-900 text-sm">{c.name || '-'}</p>
                        </td>
                        <td className="p-4 text-center">
                          <span className="text-slate-600 text-xs font-medium">{c.phone || '---'}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-bold text-rose-600 tabular-nums">
                            {isHidden ? '****' : (c.debt || 0).toLocaleString()} <span className="text-[10px] opacity-40 font-normal">ج.م</span>
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {c.phone && typeof c.phone === 'string' && (
                              <>
                                <a 
                                  href={`tel:${c.phone}`}
                                  className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="اتصال هاتفي"
                                >
                                  <Phone size={14} />
                                </a>
                                <a 
                                  href={`https://wa.me/${c.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="واتساب"
                                >
                                  <MessageSquare size={14} />
                                </a>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(EmployeeDebtFollowup);
