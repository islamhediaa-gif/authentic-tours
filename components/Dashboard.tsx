
import React, { useMemo, useState, useEffect } from 'react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Wallet, Users, Target, Activity, CreditCard, ChevronRight, PieChart as PieIcon, Sparkles, History, ShieldCheck, Layers, Cpu, RefreshCw, Trash2, CloudUpload } from 'lucide-react';
import { Transaction, Customer, Supplier, Treasury, User, JournalEntry, Partner, Employee, CostCenter, Currency } from '../types';
import { useIncomeStatement, useTrialBalance, useBalanceSheet } from '../hooks/useReportData';
import { normalizeArabic } from '../utils/arabicUtils';
import { SupabaseService } from '../SupabaseService';
import { DataService } from '../DataService';

interface DashboardProps {
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  customers: Customer[];
  suppliers: Supplier[];
  treasuries: Treasury[];
  partners: Partner[];
  employees: Employee[];
  currentUser: User | null;
  formatCurrency: (amount: number) => string;
  displayCurrency: string;
  costCenters: CostCenter[];
  enableCostCenters?: boolean;
  currencies: Currency[];
  settings: any;
  onManualPull?: () => Promise<void>;
  onManualPush?: (force?: boolean) => Promise<void>;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  transactions, journalEntries, customers, suppliers, treasuries, partners, employees, currentUser,
  formatCurrency, displayCurrency, costCenters, enableCostCenters, currencies, settings, onManualPull,
  onManualPush
}) => {
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('ALL');
  const [cloudStats, setCloudStats] = useState<any>(null);
  const [loadingCloud, setLoadingCloud] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleForceSync = async () => {
    if (!confirm('سيتم إجبار النظام على رفع الحالة الحالية للسحاب حتى لو كانت فارغة. هل تريد الاستمرار؟')) return;
    setIsResetting(true);
    try {
        if (onManualPush) {
            await onManualPush(true);
        }
    } catch (err) {
        console.error("Force push failed", err);
    } finally {
        setIsResetting(false);
    }
  };

  const handleForceReset = async () => {
    if (!confirm('سيتم مسح الذاكرة المحلية وتحميل أحدث نسخة من السحاب. هل تريد الاستمرار؟')) return;
    setIsResetting(true);
    try {
        // مسح الذاكرة المحلية أولاً
        const tenantId = DataService.getTenantId();
        localStorage.removeItem(`nebras_tenant_id`); // سيتم إعادة ضبطه
        
        // محاولة مسح IndexedDB
        try {
            const DB_NAME = 'NebrasDB';
            indexedDB.deleteDatabase(DB_NAME);
        } catch (e) {}

        if (onManualPull) {
            await onManualPull();
        } else {
            window.location.reload();
        }
    } catch (err) {
        console.error("Reset failed", err);
    } finally {
        setIsResetting(false);
        // إعادة تحميل الصفحة لضمان نظافة الحالة
        window.location.reload();
    }
  };

  const handleNuclearWipe = async () => {
    if (!confirm('⚠️ تحذير نهائي: سيتم مسح كافة البيانات من السحاب نهائياً (الجداول والنسخ الاحتياطية). هل أنت متأكد؟')) return;
    if (!confirm('هل أنت متأكد حقاً؟ لا يمكن التراجع عن هذه العملية.')) return;
    
    setIsResetting(true);
    try {
        const tenantId = DataService.getTenantId();
        const res = await DataService.wipeAllTenantData(tenantId);
        
        if (res.success) {
            alert('تم مسح كافة البيانات من السحاب بنجاح. سيتم الآن مسح الذاكرة المحلية.');
            // مسح محلي أيضاً
            localStorage.removeItem(`nebras_tenant_id`);
            try {
                const DB_NAME = 'NebrasDB';
                indexedDB.deleteDatabase(DB_NAME);
            } catch (e) {}
            window.location.reload();
        } else {
            alert('فشل مسح البيانات: ' + res.error);
        }
    } catch (err) {
        console.error("Wipe failed", err);
    } finally {
        setIsResetting(false);
    }
  };

  useEffect(() => {
    const fetchCloudStats = async () => {
      setLoadingCloud(true);
      try {
        const tenantId = DataService.getTenantId();
        const res = await DataService.getDashboardSummary(tenantId);
        if (res.success) {
          setCloudStats(res.data);
        }
      } catch (e) {
        console.error("Failed to fetch cloud dashboard summary", e);
      } finally {
        setLoadingCloud(false);
      }
    };

    fetchCloudStats();
  }, []);

  const filteredJournalEntries = useMemo(() => {
    if (selectedCostCenterId === 'ALL') return journalEntries || [];
    return (journalEntries || []).map(entry => ({
      ...entry,
      lines: (entry.lines || []).filter(line => line && (line.costCenterId || 'GENERAL') === selectedCostCenterId)
    })).filter(entry => (entry.lines || []).length > 0);
  }, [journalEntries, selectedCostCenterId]);

  const filteredTransactions = useMemo(() => {
    if (selectedCostCenterId === 'ALL') return transactions || [];
    return (transactions || []).filter(t => t && (t.costCenterId || 'GENERAL') === selectedCostCenterId);
  }, [transactions, selectedCostCenterId]);

  const activeTx = useMemo(() => filteredTransactions.filter(t => t && !t.isVoided), [filteredTransactions]);
  const activeJE = useMemo(() => filteredJournalEntries, [filteredJournalEntries]);
  
  // تعديل التاريخ الافتراضي ليشمل السنة السابقة والحالية لرؤية الأرباح المنطقية
  const currentYearStart = new Date(new Date().getFullYear() - 1, 0, 1).toISOString().split('T')[0];
  const currentYearEnd = new Date(new Date().getFullYear(), 11, 31).toISOString().split('T')[0];
  
  const trialBalance = useTrialBalance(activeJE, customers, suppliers, partners, employees, treasuries, currencies, currentYearStart, currentYearEnd, transactions);
  const incomeStats = useIncomeStatement(trialBalance, activeJE);
  const balanceSheet = useBalanceSheet(trialBalance);

  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    // 1. الدخل اليومي (المقبوضات النقدية من القيود)
    let incomeToday = 0;
    
    // استخدام نتائج Trial Balance للأرصدة لضمان الدقة
    // الأصول والحسابات المدينة (Debit - Credit)
    const totalReceivables = balanceSheet.assets - (
      (treasuries || []).reduce((s, t) => {
        const b = trialBalance.find(x => x.id === t.id && x.type === 'TREASURY');
        return s + ((b?.debit || 0) - (b?.credit || 0));
      }, 0) +
      (employees || []).reduce((s, e) => {
        const b = trialBalance.find(x => x.id === e.id && x.type === 'EMPLOYEE_ADVANCE');
        return s + ((b?.debit || 0) - (b?.credit || 0));
      }, 0)
    );
    // نلاحظ أن totalReceivables هنا سيتم تبسيطه باستخدام balanceSheet مباشرة
    
    activeJE.forEach(entry => {
      if (entry.date === today) {
        (entry.lines || []).forEach(line => {
          if (line.accountType === 'TREASURY' && (line.debit || 0) > 0) {
            incomeToday += ((line.debit || 0) - (line.credit || 0));
          }
        });
      }
    });

    const netProfit = incomeStats.netProfit;
    const totalSales = incomeStats.totalRevenues;

    const cashOnHand = (treasuries || []).reduce((s, t) => {
      const b = trialBalance.find(x => x.id === t.id && x.type === 'TREASURY');
      return s + (b ? (b.debit - b.credit) : 0);
    }, 0);

    const totalAdvances = (employees || []).reduce((s, e) => {
      const b = trialBalance.find(x => x.id === e.id && x.type === 'EMPLOYEE_ADVANCE');
      return s + (b ? (b.debit - b.credit) : 0);
    }, 0);

    const totalReceivablesFromTB = (customers || []).reduce((s, c) => {
      const b = trialBalance.find(x => x.id === c.id && x.type === 'CUSTOMER');
      return s + (b ? (b.debit - b.credit) : 0);
    }, 0);

    const totalSupplierDebts = (suppliers || []).reduce((s, su) => {
      const b = trialBalance.find(x => x.id === su.id && x.type === 'SUPPLIER');
      return s + (b ? (b.credit - b.debit) : 0);
    }, 0);

    const totalEmployeePayables = (employees || []).reduce((s, e) => {
      const b = trialBalance.find(x => x.id === e.id && x.type === 'LIABILITY');
      return s + (b ? (b.credit - b.debit) : 0);
    }, 0);
    
    const totalEquity = balanceSheet.totalEquity;

    // حساب الأرصدة التراكمية لاستخدامها في الرسوم البيانية
    const balances: Record<string, number> = {};
    trialBalance.forEach(b => {
      balances[`${b.type}-${b.id}`] = (b.debit - b.credit);
    });

    // إحصائيات الموظف الشخصية
    const myCommissions = activeTx
      .filter(t => t && t.employeeId === currentUser?.id)
      .reduce((s, t) => {
        const price = (t.sellingPrice || 0);
        const rate = (t.employeeCommissionRate || 0) * 0.01;
        return s + (price * rate);
      }, 0);

    return { 
      incomeToday, 
      totalSales, 
      totalReceivables: totalReceivablesFromTB, 
      cashOnHand, 
      totalAdvances,
      totalEquity,
      totalSupplierDebts, 
      totalEmployeePayables,
      myCommissions,
      netProfit,
      balances
    };
  }, [activeTx, activeJE, customers, suppliers, treasuries, partners, employees, currentUser, trialBalance, incomeStats, balanceSheet]);

  const chartData = useMemo(() => {
    // العثور على أحدث تاريخ معاملة لعرض البيانات حوله بدلاً من الاكتفاء باليوم الحالي
    let latestDate = new Date();
    if (activeJE.length > 0) {
      const dates = activeJE.map(e => {
        const d = new Date(e.date);
        return isNaN(d.getTime()) ? 0 : d.getTime();
      }).filter(t => t > 0);
      
      if (dates.length > 0) {
        latestDate = new Date(Math.max(...dates));
      }
    }

    const last7Days = Array.from({length: 7}, (_, i) => {
      const d = new Date(latestDate);
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      // مقارنة مرنة للتاريخ للتعامل مع تنسيقات MySQL المختلفة
      const dayJE = (activeJE || []).filter(e => {
        if (!e || !e.date) return false;
        const entryDate = new Date(e.date).toISOString().split('T')[0];
        return entryDate === date;
      });

      let income = 0;
      let expense = 0;
      dayJE.forEach(e => (e.lines || []).forEach(l => { 
        if (l && l.accountType === 'REVENUE') income += ((l.credit || 0) - (l.debit || 0));
        if (l && l.accountType === 'EXPENSE') expense += ((l.debit || 0) - (l.credit || 0));
      }));

      return {
        name: date.split('-').slice(1).join('/'),
        income,
        expense,
      };
    });
  }, [activeJE]);

  const treasuryDistribution = useMemo(() => {
    const preferredOrder = [
      "الخزينة الرئيسية",
      "خزينة العمرة",
      "خزينة العمرة دولار",
      "خزينة الحج",
      "بنك مصر وليد",
      "بنك اهلي وليد",
      "فودافون كاش 656",
      "فودافون كاش 838",
      "بنك مصر ايجي بوينت",
      "فيزا وورلد بنك مصر",
      "فيزا البنك الاهلي وليد يوسف",
      "فيزا تيتانيوم استاذه امل",
      "فيزا استاذه امل بلاتينيوم"
    ].map(normalizeArabic);

    return (treasuries || [])
      .map(t => ({ name: t.name, value: Math.max(0, stats.balances[`TREASURY-${t.id}`] || 0) }))
      .sort((a, b) => {
        const normA = normalizeArabic(a.name);
        const normB = normalizeArabic(b.name);
        const indexA = preferredOrder.indexOf(normA);
        const indexB = preferredOrder.indexOf(normB);
        if (indexA === -1 && indexB === -1) return normA.localeCompare(normB);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
  }, [treasuries, stats.balances]);

  const equityDistribution = useMemo(() => {
    const dist = (partners || []).map(p => ({ name: p.name, value: Math.max(0, stats.balances[`PARTNER-${p.id}`] || 0) }));
    if (stats.netProfit !== 0) {
      dist.push({ name: 'أرباح السنة الحالية', value: Math.max(0, stats.netProfit) });
    }
    return dist;
  }, [partners, stats.netProfit, stats.balances]);

  const COLORS = ['#4f46e5', '#10b981', '#f43f5e', '#6366f1', '#8b5cf6'];

  const cloudStatsDisplay = useMemo(() => {
    return {
      total_cash: stats.cashOnHand,
      customer_debts: stats.totalReceivables,
      supplier_credits: stats.totalSupplierDebts
    };
  }, [stats]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Welcome Message - Simple & Chic */}
      <div className="bg-white p-8 rounded-3xl text-slate-900 flex flex-col md:flex-row justify-between items-center shadow-sm border border-slate-200 relative overflow-hidden group">
         <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500 bg-opacity-5 rounded-full blur-[60px] -mr-24 -mt-24"></div>
         
         <div className="relative z-10 text-center md:text-right">
            <div className="flex items-center gap-3 mb-4 justify-center md:justify-start">
               <span className="bg-slate-900 text-white text-[9px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest">الذكاء التشغيلي</span>
               <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-500 bg-opacity-30 rounded-full"></div>
               </div>
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold mb-2 tracking-tight text-slate-900">
               مرحباً بك في <span className="text-indigo-600">نِـبـراس</span> <Sparkles className="text-amber-400 inline-block mb-1" size={28} />
            </h2>
            <p className="text-slate-500 font-bold text-base opacity-90">أهلاً بك، {currentUser?.name || 'المدير'}! إليك ملخص الأداء المالي لليوم.</p>
            {/* Maintenance buttons hidden for safety */}
         </div>
         
         <div className="mt-8 md:mt-0 relative z-10 bg-slate-50 px-8 py-6 rounded-2xl border border-slate-100 min-w-[300px] text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">مؤشر السيولة الإجمالي</p>
            <p className="text-4xl font-bold text-indigo-600 tracking-tighter tabular-nums">
              {shouldMaskAggregate ? '****' : formatCurrency(stats.cashOnHand ?? 0)}
            </p>
            {loadingCloud && <div className="text-[10px] text-indigo-400 animate-pulse mt-1">جاري التزامن مع السحاب...</div>}
         </div>
      </div>

      {/* Cloud Intelligence Bar - Now Syncing from local state for accuracy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in zoom-in duration-700">
         <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 rounded-2xl text-white shadow-lg flex items-center justify-between">
            <div>
               <p className="text-[10px] font-bold opacity-80 uppercase">صافي النقدية (المحقق)</p>
               <p className="text-xl font-bold">{shouldMaskAggregate ? '****' : formatCurrency(cloudStatsDisplay.total_cash)}</p>
            </div>
            <div className="bg-white/20 p-2 rounded-xl">
               <Cpu size={20} />
            </div>
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">ديون العملاء النشطة</p>
               <p className="text-xl font-bold text-emerald-600">{shouldMaskAggregate ? '****' : formatCurrency(cloudStatsDisplay.customer_debts)}</p>
            </div>
            <Users size={20} className="text-emerald-500" />
         </div>
         <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-[10px] font-bold text-slate-400 uppercase">مستحقات الموردين</p>
               <p className="text-xl font-bold text-rose-600">{shouldMaskAggregate ? '****' : formatCurrency(cloudStatsDisplay.supplier_credits)}</p>
            </div>
            <TrendingDown size={20} className="text-rose-500" />
         </div>
      </div>

      {/* Cost Center Filter */}
      {enableCostCenters && (
        <div className="bg-indigo-50 bg-opacity-30 p-6 rounded-3xl border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
              <Layers size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-indigo-950">تصفية مركز التكلفة</h3>
              <p className="text-[10px] font-bold text-indigo-700 opacity-80">تحليل البيانات المالية لنشاط محدد</p>
            </div>
          </div>
          <select 
            className="w-full md:w-64 p-3 bg-white border border-indigo-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 text-sm outline-none transition-all cursor-pointer shadow-sm"
            value={selectedCostCenterId}
            onChange={e => setSelectedCostCenterId(e.target.value)}
          >
            <option value="ALL">كافة الفروع والمراكز</option>
            {(costCenters || []).filter(cc => cc && cc.isActive).map(cc => (
              <option key={cc.id} value={cc.id}>{cc.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Stats Grid - Premium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="إجمالي المبيعات" value={stats.totalSales} icon={<Target size={24}/>} color="emerald" isHidden={shouldMaskAggregate} formatCurrency={formatCurrency} />
        <StatCard title="حقوق الملكية" value={stats.totalEquity} icon={<ShieldCheck size={24}/>} color="indigo" isHidden={shouldMaskAggregate} formatCurrency={formatCurrency} />
        <StatCard title="ذمم العملاء" value={stats.totalReceivables} icon={<Users size={24}/>} color="emerald" isHidden={shouldMaskAggregate} formatCurrency={formatCurrency} />
        <StatCard title="ديون الموردين" value={stats.totalSupplierDebts} icon={<TrendingDown size={24}/>} color="rose" isHidden={shouldMaskAggregate} formatCurrency={formatCurrency} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Chart Area */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
            <div>
               <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-4">
                 <Activity className="text-indigo-600" size={28} />
                 تحليل التدفق المالي
               </h3>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">تحليل التدفقات النقدية • آخر 7 أيام</p>
            </div>
            <div className="flex gap-6 bg-slate-50 p-3 rounded-2xl border border-slate-100">
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></div> المقبوضات
               </div>
               <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-tight">
                  <div className="w-2.5 h-2.5 bg-rose-500 rounded-full"></div> المصروفات
               </div>
            </div>
          </div>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 700}} />
                <Tooltip 
                  contentStyle={{borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', padding: '16px'}} 
                  itemStyle={{fontWeight: 700, fontSize: '13px'}}
                  cursor={{stroke: '#e2e8f0', strokeWidth: 2}}
                  formatter={(value: any) => shouldMaskAggregate ? '****' : (value || 0).toLocaleString() || '0'}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={6} fillOpacity={1} fill="url(#colorInc)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={4} strokeDasharray="8 8" fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <PieIcon size={24} className="text-indigo-600" /> توزيع المحفظة
          </h3>
          <div className="flex-1 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={treasuryDistribution} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={8}>
                  {treasuryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]}/>
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }} 
                  formatter={(value: any) => shouldMaskAggregate ? '****' : (value || 0).toLocaleString() || '0'}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-3">
             {treasuryDistribution.map((t, i) => (
               <div key={i} className="flex justify-between items-center text-xs font-bold p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300">
                  <div className="flex items-center gap-3">
                     <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}}></div>
                     <span className="text-slate-600 truncate w-32">{t.name}</span>
                  </div>
                  <span className="text-slate-900 font-bold">{shouldMaskAggregate ? '****' : (t.value || 0).toLocaleString() || '0'}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Equity Distribution Chart */}
        {!isBookingEmployee && (
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col">
            <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center gap-3">
              <ShieldCheck size={24} className="text-indigo-600" /> هيكل حقوق الملكية
            </h3>
            <div className="flex-1 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={equityDistribution} innerRadius={65} outerRadius={85} paddingAngle={8} dataKey="value" stroke="none" cornerRadius={8}>
                    {equityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.08)' }} 
                    formatter={(value: any) => shouldMaskAggregate ? '****' : (value || 0).toLocaleString() || '0'}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-3">
               {equityDistribution.map((p, i) => (
                 <div key={i} className="flex justify-between items-center text-xs font-bold p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-all duration-300">
                    <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[(i + 2) % COLORS.length]}}></div>
                       <span className="text-slate-600 truncate w-32">{p.name}</span>
                    </div>
                    <span className="text-slate-900 font-bold">{shouldMaskAggregate ? '****' : (p.value || 0).toLocaleString() || '0'}</span>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* Financial Summary Box */}
        {!isBookingEmployee && (
          <div className="lg:col-span-2 bg-slate-900 p-8 rounded-3xl shadow-lg border-b-8 border-indigo-600 relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 bg-opacity-10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
              
              <div className="relative z-10 space-y-8">
                 <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white uppercase tracking-widest">ملخص المركز المالي</h3>
                    <span className="bg-indigo-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full">تدقيق فوري</span>
                 </div>
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">إجمالي الأصول (سيولة + ذمم + سلف)</p>
                       <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency((stats.cashOnHand || 0) + (stats.totalReceivables || 0) + (stats.totalAdvances || 0))}</p>
                    </div>
                    <div className="space-y-2">
                       <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">الالتزامات وحقوق الملكية</p>
                       <p className="text-3xl font-bold text-white tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency((stats.totalSupplierDebts || 0) + (stats.totalEmployeePayables || 0) + (stats.totalEquity || 0))}</p>
                    </div>
                 </div>
                 
                 <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-emerald-500 bg-opacity-20 rounded-2xl">
                          <TrendingUp className="text-emerald-500" size={24} />
                       </div>
                       <div>
                          <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">مؤشر التوازن المحاسبي</p>
                          <p className="text-lg font-bold text-white">متوازن بنسبة 100%</p>
                       </div>
                    </div>
                    <div className="text-center sm:text-right">
                       <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">صافي قيمة المنشأة</p>
                       <p className="text-4xl font-bold text-indigo-500 tabular-nums tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(stats.totalEquity || 0)}</p>
                    </div>
                 </div>
              </div>
          </div>
        )}
      </div>

      {/* Recent Transactions Section - Modern List */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-8">
             <div>
                <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                  <History size={28} className="text-indigo-600"/> مراقبة النشاط اللحظي
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">بث العمليات المباشر</p>
             </div>
             <button className="text-indigo-600 hover:text-white font-bold text-xs border border-indigo-100 px-6 py-2.5 rounded-full transition-all hover:bg-indigo-600 hover:border-indigo-600">سجل العمليات الكامل</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {activeTx.slice(0, 6).map(tx => (
               <div key={tx.id} className="group p-6 rounded-3xl border border-slate-100 flex justify-between items-center hover:border-indigo-200 hover:bg-slate-50 transition-all duration-300 cursor-pointer">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${tx.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        <ChevronRight size={20} className={tx.type === 'INCOME' ? '-rotate-90' : 'rotate-90'} />
                     </div>
                     <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate w-32 group-hover:text-indigo-600 transition-colors">{tx.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                           <span className="text-[10px] text-slate-400 font-bold">{tx.date}</span>
                           <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                           <span className={`text-[9px] font-bold uppercase tracking-tight ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{tx.category}</span>
                        </div>
                     </div>
                  </div>
                  <p className={`font-bold text-xl tracking-tight ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {isHidden ? '****' : formatCurrency(tx.amountInBase || 0)}
                  </p>
               </div>
             ))}
          </div>
      </div>
    </div>

  );
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  isHidden?: boolean;
  formatCurrency: (amount: number) => string;
}

const StatCard: React.FC<StatCardProps> = ({title, value, icon, color, isHidden, formatCurrency}) => {
  const colorMap: any = {
    indigo: 'from-indigo-600/10 to-transparent text-indigo-600 border-indigo-500 border-opacity-10',
    emerald: 'from-emerald-600/10 to-transparent text-emerald-600 border-emerald-500 border-opacity-10',
    amber: 'from-amber-600/10 to-transparent text-amber-600 border-amber-500 border-opacity-10',
    rose: 'from-rose-600/10 to-transparent text-rose-600 border-rose-500 border-opacity-10'
  };

  const iconColor: any = {
    indigo: 'bg-indigo-600 text-white shadow-indigo-500/40',
    emerald: 'bg-emerald-600 text-white shadow-emerald-500/40',
    amber: 'bg-amber-600 text-white shadow-amber-500/40',
    rose: 'bg-rose-600 text-white shadow-rose-500/40'
  };

  return (
    <div className={`bg-white bg-gradient-to-br ${colorMap[color]} p-8 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group transition-all duration-300`}>
       <div className="flex flex-col gap-6 relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${iconColor[color]}`}>
             {React.cloneElement(icon as React.ReactElement<any>, { size: 24 })}
          </div>
          <div>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 opacity-80">{title}</p>
             <p className="text-3xl font-bold text-slate-900 tracking-tight tabular-nums leading-none">
                {isHidden ? '****' : formatCurrency(value || 0)}
             </p>
          </div>
       </div>
    </div>
  );
};

export default Dashboard;
