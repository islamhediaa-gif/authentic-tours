import React, { useMemo } from 'react';
import { User as UserIcon, ShieldCheck, Wallet, Calendar, Phone, MessageSquare } from 'lucide-react';
import { Customer, Currency, Transaction, MasterTrip, Program } from '../../types';

interface CustomerAdvancesReportProps {
  customers: Customer[];
  transactions: Transaction[];
  masterTrips: MasterTrip[];
  programs: Program[];
  balanceMap: Record<string, { base: number, currency: number }>;
  isHidden: boolean;
  currencies: Currency[];
  searchTerm: string;
}

const CustomerAdvancesReport: React.FC<CustomerAdvancesReportProps> = ({ 
  customers, 
  transactions,
  masterTrips,
  programs,
  balanceMap, 
  isHidden, 
  currencies, 
  searchTerm
}) => {
  // Map trip/program IDs to names
  const tripNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    (masterTrips || []).forEach(t => { map[t.id] = t.name; });
    (programs || []).forEach(p => { map[p.id] = p.name; });
    return map;
  }, [masterTrips, programs]);

  // Map customers to their booked trips
  const customerBookingsMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    (transactions || []).forEach(tx => {
      if (tx && !tx.isVoided && tx.relatedEntityId && (tx.masterTripId || tx.programId)) {
        if (!map[tx.relatedEntityId]) {
          map[tx.relatedEntityId] = new Set();
        }
        if (tx.masterTripId) map[tx.relatedEntityId].add(tx.masterTripId);
        if (tx.programId) map[tx.relatedEntityId].add(tx.programId);
      }
    });
    return map;
  }, [transactions]);

  const reportData = useMemo(() => {
    const data: (Customer & { advance: number, trips: string[] })[] = [];

    (customers || []).forEach(cust => {
      // Balance < 0 means the customer has money with us (Credit)
      const balance = (balanceMap || {})[`CUSTOMER-${cust.id}`]?.base || 0;
      
      if (balance < 0) {
        const bookedTripIds = Array.from(customerBookingsMap[cust.id] || []);
        const tripNames = bookedTripIds.map(id => tripNamesMap[id]).filter(Boolean);
        
        data.push({ 
          ...cust, 
          advance: Math.abs(balance), 
          trips: tripNames.length > 0 ? tripNames : ['حجز غير محدد']
        });
      }
    });

    // Sort by advance amount
    data.sort((a, b) => b.advance - a.advance);

    if (!searchTerm) return data;
    const s = searchTerm.toLowerCase();
    return data.filter(c => 
      (c.name || '').toLowerCase().includes(s) || 
      c.trips.some(t => t.toLowerCase().includes(s))
    );
  }, [customers, balanceMap, customerBookingsMap, tripNamesMap, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-white relative overflow-hidden group">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] -mr-32 -mt-32 opacity-60"></div>
        <div className="flex items-center gap-4 relative z-10">
           <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 transform group-hover:scale-110 transition-transform duration-500">
              <Wallet size={28} />
           </div>
           <div>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-1">دفعات العملاء والحجوزات</h3>
              <p className="text-emerald-500 font-bold uppercase tracking-[0.2em] text-[9px] opacity-70 flex items-center gap-2">
                 <ShieldCheck size={12}/> Customer Advances • Active Bookings
              </p>
           </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400">
                <th className="p-4 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100">العميل</th>
                <th className="p-4 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100 text-center">الرحلات المحجوزة</th>
                <th className="p-4 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100 text-center">المبلغ المودع (لصالح العميل)</th>
                <th className="p-4 font-bold text-[9px] uppercase tracking-widest border-b border-slate-100 text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-slate-400 font-medium">
                    لا يوجد عملاء لديهم مبالغ مودعة حالياً
                  </td>
                </tr>
              ) : (
                reportData.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                          <UserIcon size={16} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{c.name || '-'}</p>
                          <p className="text-[10px] text-slate-500">{c.phone || 'بدون هاتف'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 justify-center">
                        {c.trips.map((trip, tidx) => (
                          <span key={tidx} className="bg-indigo-50 text-indigo-600 text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1">
                            <Calendar size={10} /> {trip}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <span className="font-bold text-emerald-600 tabular-nums text-lg">
                        {isHidden ? '****' : c.advance.toLocaleString()} <span className="text-[10px] opacity-40 font-normal">ج.م</span>
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {c.phone && (
                          <>
                            <a href={`tel:${c.phone}`} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><Phone size={14} /></a>
                            <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><MessageSquare size={14} /></a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CustomerAdvancesReport);
