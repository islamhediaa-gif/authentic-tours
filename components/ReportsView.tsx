import React, { useState, useMemo, useRef, useEffect } from 'react';
import { compareArabic } from '../utils/arabicUtils';
import { useTranslation } from 'react-i18next';
import {
  FileText, Printer, User as UserIcon, Truck, CalendarDays, ArrowDownCircle, ArrowUpCircle,
  History, Building2, Phone, Mail, Globe, CheckCircle, Download, X, Eye, ShieldCheck, Coins, BarChart3, TrendingUp, Calculator, ArrowLeftRight, Landmark, ReceiptText, Search, Facebook, Layers
} from 'lucide-react';
import { Transaction, Customer, Supplier, Treasury, CompanySettings, User, Currency, JournalEntry, Employee, AuditLog, Partner, MasterTrip, Program, CostCenter } from '../types';
import SearchableSelect from './SearchableSelect';
import CostCenterAnalysis from './reports/CostCenterAnalysis';
import HajjUmrahPL from './reports/HajjUmrahPL';
import TrialBalance from './reports/TrialBalance';
import IncomeStatement from './reports/IncomeStatement';
import BalanceSheet from './reports/BalanceSheet';
import CustomersSummary from './reports/CustomersSummary';
import SuppliersSummary from './reports/SuppliersSummary';
import EmployeeDebtFollowup from './reports/EmployeeDebtFollowup';
import MasterTripReport from './reports/MasterTripReport';
import AgingReport from './reports/AgingReport';
import CommissionReport from './reports/CommissionReport';
import AuditLogReport from './reports/AuditLog';
import TreasuryTransfers from './reports/TreasuryTransfers';
import AccountLedger from './reports/AccountLedger';
import CustomerAdvancesReport from './reports/CustomerAdvancesReport';
import { KPICard, NavBtn } from './reports/ReportComponents';
import { 
  useCostCenterStats, 
  useHajjUmrahProgramStats, 
  useTrialBalance, 
  useIncomeStatement, 
  useBalanceSheet,
  useMasterTripStats,
  useAgingData,
  useAnalytics,
  useLedgerData
} from '../hooks/useReportData';

interface ReportsViewProps {
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  customers: Customer[];
  suppliers: Supplier[];
  partners: Partner[];
  treasuries: Treasury[];
  settings: CompanySettings;
  currentUser: User;
  currencies: Currency[];
  employees: Employee[];
  programs: Program[];
  masterTrips: MasterTrip[];
  auditLogs: AuditLog[];
  costCenters: CostCenter[];
  initialState?: { type: ReportType, id: string } | null;
  onStateApplied?: () => void;
  onTransactionClick?: (id: string) => void;
  searchTerm?: string;
  formatCurrency: (amount: number) => string;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onUpdateJournalEntry?: (id: string, updates: Partial<JournalEntry>) => void;
  onVoidTransaction?: (id: string) => void;
  onDeleteJournalEntry?: (id: string) => void;
}

type ReportType = 'P_L' | 'BALANCE_SHEET' | 'SUMMARY' | 'CUSTOMER_LEDGER' | 'SUPPLIER_LEDGER' | 'TREASURY_REPORT' | 'EMPLOYEE_LEDGER' | 'EMPLOYEE_ADVANCE' | 'AUDIT_LOG' | 'ADVANCED_ANALYTICS' | 'CUSTOMERS_SUMMARY' | 'SUPPLIERS_SUMMARY' | 'PARTNER_LEDGER' | 'HAJJ_UMRAH_P_L' | 'AGING_REPORT' | 'COMMISSION_REPORT' | 'MASTER_TRIP_REPORT' | 'COST_CENTER_ANALYSIS' | 'TREASURY_TRANSFERS' | 'DEBT_FOLLOWUP' | 'CUSTOMER_ADVANCES';

const ReportsView: React.FC<ReportsViewProps> = ({ 
  transactions, journalEntries, customers, suppliers, partners, treasuries, settings, 
  currentUser, currencies, employees, programs, masterTrips, auditLogs, costCenters, initialState, onStateApplied,
  onTransactionClick, searchTerm: globalSearchTerm = '', formatCurrency,
  onUpdateTransaction, onUpdateJournalEntry, onVoidTransaction, onDeleteJournalEntry
}) => {
  const { t } = useTranslation();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [activeReport, setActiveReport] = useState<ReportType>(() => {
    if (initialState) return initialState.type;
    return (currentUser?.role === 'ADMIN') ? 'SUMMARY' : 'EMPLOYEE_LEDGER';
  });
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialState) return initialState.id;
    if (currentUser?.employeeId) return currentUser.employeeId;
    if (currentUser?.role !== 'ADMIN') {
      const emp = (employees || []).find(e => (e.name || '').trim() === (currentUser?.name || '').trim());
      return emp ? emp.id : '';
    }
    return '';
  });
  const [selectedCostCenterId, setSelectedCostCenterId] = useState<string>('ALL');
  const [selectedAnalysisCCId, setSelectedAnalysisCCId] = useState<string>(() => {
    return (costCenters || []).length > 0 ? costCenters[0].id : '';
  });
  const [activeCategory, setActiveCategory] = useState<'FINANCIAL' | 'OPERATIONAL' | 'ANALYTICS'>('FINANCIAL');
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    // Default to start of current year
    return new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Ensure dates are valid and not reversed for calculations
  const { effectiveFromDate, effectiveToDate } = useMemo(() => {
    if (fromDate > toDate) {
      return { effectiveFromDate: toDate, effectiveToDate: fromDate };
    }
    return { effectiveFromDate: fromDate, effectiveToDate: toDate };
  }, [fromDate, toDate]);

  const [showPreview, setShowPreview] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const effectiveSearchTerm = globalSearchTerm || searchTerm;

  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const shouldMaskAggregate = isHidden || currentUser.role === 'BOOKING_EMPLOYEE';

  useEffect(() => {
    if (initialState) {
      setActiveReport(initialState.type);
      setSelectedId(initialState.id);
      if (onStateApplied) onStateApplied();
    }
  }, [initialState, onStateApplied]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role !== 'ADMIN' && activeReport === 'EMPLOYEE_LEDGER') {
      const empId = currentUser.employeeId || (employees || []).find(e => compareArabic(e.name || '', currentUser.name || ''))?.id;
      if (empId && selectedId !== empId) {
        setSelectedId(empId);
      }
    }
  }, [activeReport, currentUser, employees]);

  const filteredTx = useMemo(() => {
    return (transactions || []).filter(t => {
      const dateMatch = !t.isVoided && (t.date || '') >= effectiveFromDate && (t.date || '') <= effectiveToDate;
      if (selectedCostCenterId === 'ALL') return dateMatch;
      const cc = t.costCenterId || 'GENERAL';
      return dateMatch && cc === selectedCostCenterId;
    });
  }, [transactions, effectiveFromDate, effectiveToDate, selectedCostCenterId]);

  const filteredJournalEntries = useMemo(() => {
    const jes = Array.isArray(journalEntries) ? journalEntries : [];
    if (selectedCostCenterId === 'ALL') return jes;
    return jes.map(entry => {
      const lines = Array.isArray(entry.lines) ? entry.lines : [];
      return {
        ...entry,
        lines: lines.filter(line => (line.costCenterId || 'GENERAL') === selectedCostCenterId)
      };
    }).filter(entry => (Array.isArray(entry.lines) ? entry.lines : []).length > 0);
  }, [journalEntries, selectedCostCenterId]);

  const filteredCustomers = useMemo(() => {
    if (!effectiveSearchTerm) return (customers || []);
    const s = effectiveSearchTerm.toLowerCase();
    return (customers || []).filter(c => (c.name || '').toLowerCase().includes(s));
  }, [customers, effectiveSearchTerm]);

  const filteredSuppliers = useMemo(() => {
    if (!effectiveSearchTerm) return (suppliers || []);
    const s = effectiveSearchTerm.toLowerCase();
    return (suppliers || []).filter(sup => (sup.company || '').toLowerCase().includes(s) || (sup.name || '').toLowerCase().includes(s));
  }, [suppliers, effectiveSearchTerm]);

  const reportStats = useMemo(() => {
    // استبعاد عمليات التحصيل والصرف النقدي (CASH) لأنها ليست إيرادات/مصاريف حقيقية بل هي حركة نقدية فقط
    const revenue = (filteredTx || []).filter(t => t.type === 'INCOME' && t.category !== 'CASH').reduce((s, t) => s + (t.amountInBase || 0), 0);
    const expenses = (filteredTx || []).filter(t => t.type === 'EXPENSE' && t.category !== 'CASH').reduce((s, t) => s + (t.amountInBase || 0), 0);
    const profit = revenue - expenses;
    const txCount = (filteredTx || []).length;
    return { revenue, expenses, profit, txCount };
  }, [filteredTx]);

  const trialBalance = useTrialBalance(filteredJournalEntries, customers, suppliers, partners, employees, treasuries, currencies, effectiveFromDate, effectiveToDate, transactions);

  const filteredTrialBalance = useMemo(() => {
    if (!effectiveSearchTerm) return (trialBalance || []);
    const s = effectiveSearchTerm.toLowerCase();
    return (trialBalance || []).filter(item => 
      (item.name || '').toLowerCase().includes(s) || 
      (item.type || '').toLowerCase().includes(s)
    );
  }, [trialBalance, effectiveSearchTerm]);

  const balanceMap = useMemo(() => {
    const map: Record<string, { base: number, currency: number }> = {};
    let totalCustDebt = 0;
    let totalSuppCredit = 0;

    (trialBalance || []).forEach(b => {
      let balance = 0;
      const currencyBalance = b.balanceInAccountCurrency || 0;
      const isForeignAccount = (b.type === 'CUSTOMER' || b.type === 'SUPPLIER') && 
                               ((customers || []).find(c => String(c.id) === String(b.id))?.openingBalanceCurrency !== (settings.baseCurrency || 'EGP') || 
                                (suppliers || []).find(s => String(s.id) === String(b.id))?.openingBalanceCurrency !== (settings.baseCurrency || 'EGP'));

      if (b.type === 'CUSTOMER' || b.type === 'TREASURY' || b.type === 'ASSET' || b.type === 'EMPLOYEE_ADVANCE') {
        balance = (b.debit || 0) - (b.credit || 0);
        if (isForeignAccount && Math.abs(currencyBalance) < 0.01) balance = 0;
        
        map[`${b.type}-${b.id}`] = { base: balance, currency: currencyBalance };
        if (b.type === 'CUSTOMER' && balance > 0) totalCustDebt += balance;
      } else {
        balance = (b.credit || 0) - (b.debit || 0);
        if (isForeignAccount && Math.abs(currencyBalance) < 0.01) balance = 0;

        map[`${b.type}-${b.id}`] = { base: balance, currency: currencyBalance };
        if (b.type === 'SUPPLIER' && balance > 0) totalSuppCredit += balance;
      }
    });
    return { map, totalCustDebt, totalSuppCredit };
  }, [trialBalance, customers, suppliers, settings.baseCurrency]);

  const stats = useIncomeStatement(trialBalance, filteredJournalEntries);
  const balanceSheetTotals = useBalanceSheet(trialBalance);
  const hajjUmrahProgramStats = useHajjUmrahProgramStats(programs, filteredTx);
  const costCenterStats = useCostCenterStats(transactions, costCenters, selectedAnalysisCCId, effectiveFromDate, effectiveToDate);
  const masterTripStats = useMasterTripStats(masterTrips, filteredJournalEntries, transactions);
  const agingData = useAgingData(customers, suppliers, filteredJournalEntries, balanceMap.map, effectiveToDate);
  const analyticsData = useAnalytics(stats, employees, filteredTx, currentUser);
  const { entries: ledgerEntries, openingBalance } = useLedgerData(activeReport, selectedId, filteredJournalEntries, effectiveFromDate, effectiveToDate, effectiveSearchTerm, customers, suppliers, employees, partners, treasuries, currencies, transactions);
  const treasuryEntries = ledgerEntries;

  const handlePrint = () => {
    const previewContent = document.getElementById('report-to-print');
    const printSection = document.getElementById('print-section');
    if (previewContent && printSection) {
      printSection.innerHTML = '';
      
      const content = previewContent.cloneNode(true) as HTMLElement;
      printSection.appendChild(content);
      
      document.body.classList.add('printing-mode');

      setTimeout(() => {
        window.print();
        setTimeout(() => {
          document.body.classList.remove('printing-mode');
        }, 1000);
      }, 300);
    }
  };

  const getReportName = () => {
    switch(activeReport) {
      case 'SUMMARY': return 'ميزان المراجعة العام (Trial Balance)';
      case 'P_L': return 'بيان الأرباح والخسائر (Income Statement)';
      case 'BALANCE_SHEET': return 'قائمة المركز المالي (Balance Sheet)';
      case 'CUSTOMER_LEDGER': return `كشف حساب عميل: ${(customers || []).find(c => c.id === selectedId)?.name || ''}`;
      case 'SUPPLIER_LEDGER': return `كشف حساب مورد: ${(suppliers || []).find(s => s.id === selectedId)?.company || ''}`;
      case 'EMPLOYEE_LEDGER': return `كشف حساب موظف: ${(employees || []).find(e => e.id === selectedId)?.name || ''}`;
      case 'EMPLOYEE_ADVANCE': return `كشف سلف موظف: ${(employees || []).find(e => e.id === selectedId)?.name || ''}`;
      case 'PARTNER_LEDGER': return `كشف حساب جاري شريك: ${(partners || []).find(p => p.id === selectedId)?.name || ''}`;
      case 'TREASURY_REPORT': return `تقرير حركة خزينة: ${(treasuries || []).find(t => t.id === selectedId)?.name || ''}`;
      case 'TREASURY_TRANSFERS': return 'تقرير التحويلات النقدية البينية';
      case 'AUDIT_LOG': return 'سجل مراقبة النظام (Audit Trail)';
      case 'CUSTOMERS_SUMMARY': return 'تقرير إجمالي مديونيات العملاء';
      case 'SUPPLIERS_SUMMARY': return 'تقرير إجمالي مستحقات الموردين';
      case 'ADVANCED_ANALYTICS': return 'التحليلات المتقدمة وذكاء الأعمال';
      case 'HAJJ_UMRAH_P_L': return 'تقرير أرباح وخسائر برامج الحج والعمرة';
      case 'CUSTOMER_ADVANCES': return 'تقرير دفعات العملاء والحجوزات';
      case 'MASTER_TRIP_REPORT': return 'التقرير المجمع للرحلات (Master Trip Report)';
      case 'COMMISSION_REPORT': return 'تقرير عمولات المبيعات';
      case 'DEBT_FOLLOWUP': return 'تقرير متابعة تحصيل المديونيات';
      case 'AGING_REPORT': return 'تقرير أعمار الديون';
      case 'COST_CENTER_ANALYSIS': {
        const cc = (costCenters || []).find(c => c.id === selectedAnalysisCCId);
        return `تحليل أرباح: ${cc?.name || 'مركز تكلفة'}`;
      }
      default: return '';
    }
  };

  return (
    <div className="space-y-6 pb-10 font-['Cairo'] animate-in fade-in duration-500 print:animate-none print:opacity-100 print:transform-none">
      {/* Premium KPI Section */}
      {currentUser.role !== 'BOOKING_EMPLOYEE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 no-print">
          <KPICard 
            title="إجمالي المبيعات" 
            value={stats.totalSales} 
            icon={<TrendingUp size={18} />} 
            trend={`${reportStats.txCount} عملية`}
            color="emerald" 
            isHidden={shouldMaskAggregate}
          />
          <KPICard 
            title="تكلفة العمليات" 
            value={stats.totalDirectCosts} 
            icon={<BarChart3 size={18} />} 
            color="amber" 
            isHidden={shouldMaskAggregate}
          />
          <KPICard 
            title="المصروفات العامة" 
            value={stats.expenses} 
            icon={<ArrowDownCircle size={18} />} 
            color="rose" 
            isHidden={shouldMaskAggregate}
          />
          <KPICard 
            title="صافي الربح النهائي" 
            value={stats.netProfit} 
            icon={<Calculator size={18} />} 
            highlight={true}
            color={stats.netProfit >= 0 ? "emerald" : "rose"} 
            isHidden={shouldMaskAggregate}
          />
        </div>
      )}

      {/* Header Filters & Navigation */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 no-print">
        <div className="flex flex-col gap-6">
          {/* Categories Bar */}
          <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1.5 w-full border border-slate-200 shadow-inner">
            <button 
              onClick={() => setActiveCategory('FINANCIAL')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all duration-300 transform active:scale-95 ${activeCategory === 'FINANCIAL' ? 'bg-slate-900 text-indigo-400 shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
            >
              <Landmark size={16}/> التقارير المالية
            </button>
            <button 
              onClick={() => setActiveCategory('OPERATIONAL')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all duration-300 transform active:scale-95 ${activeCategory === 'OPERATIONAL' ? 'bg-slate-900 text-indigo-400 shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
            >
              <Truck size={16}/> تقارير التشغيل
            </button>
            <button 
              onClick={() => setActiveCategory('ANALYTICS')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-xs transition-all duration-300 transform active:scale-95 ${activeCategory === 'ANALYTICS' ? 'bg-slate-900 text-indigo-400 shadow-md' : 'text-slate-500 hover:bg-white hover:text-slate-900'}`}
            >
              <BarChart3 size={16}/> التحليلات
            </button>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="flex bg-slate-50 p-1.5 rounded-2xl gap-1.5 overflow-x-auto w-full lg:w-auto scrollbar-hide border border-slate-200 shadow-inner">
              {activeCategory === 'FINANCIAL' && (
                <>
                  <NavBtn active={activeReport === 'SUMMARY'} onClick={() => setActiveReport('SUMMARY')} label="ميزان المراجعة" />
                  <NavBtn active={activeReport === 'P_L'} onClick={() => setActiveReport('P_L')} label="الأرباح والخسائر" />
                  <NavBtn active={activeReport === 'BALANCE_SHEET'} onClick={() => setActiveReport('BALANCE_SHEET')} label="المركز المالي" />
                  <NavBtn active={activeReport === 'CUSTOMER_LEDGER'} onClick={() => {setActiveReport('CUSTOMER_LEDGER'); setSelectedId('');}} label="كشف حساب عميل" />
                  <NavBtn active={activeReport === 'SUPPLIER_LEDGER'} onClick={() => {setActiveReport('SUPPLIER_LEDGER'); setSelectedId('');}} label="كشف حساب مورد" />
                  {currentUser.role === 'ADMIN' && (
                    <>
                      <NavBtn active={activeReport === 'PARTNER_LEDGER'} onClick={() => {setActiveReport('PARTNER_LEDGER'); setSelectedId('');}} label="جاري الشركاء" />
                      <NavBtn active={activeReport === 'TREASURY_REPORT'} onClick={() => {setActiveReport('TREASURY_REPORT'); setSelectedId('');}} label="تقرير الخزينة" />
                      <NavBtn active={activeReport === 'TREASURY_TRANSFERS'} onClick={() => setActiveReport('TREASURY_TRANSFERS')} label="التحويلات البينية" />
                    </>
                  )}
                </>
              )}
              {activeCategory === 'OPERATIONAL' && (
                <>
                  <NavBtn active={activeReport === 'HAJJ_UMRAH_P_L'} onClick={() => setActiveReport('HAJJ_UMRAH_P_L')} label="أرباح الحج والعمرة" />
                  <NavBtn active={activeReport === 'CUSTOMER_ADVANCES'} onClick={() => setActiveReport('CUSTOMER_ADVANCES')} label="دفعات العملاء والحجوزات" />
                  {currentUser.role === 'ADMIN' && <NavBtn active={activeReport === 'MASTER_TRIP_REPORT'} onClick={() => setActiveReport('MASTER_TRIP_REPORT')} label="تقرير الرحلات المجمع" />}
                  <NavBtn active={activeReport === 'DEBT_FOLLOWUP'} onClick={() => setActiveReport('DEBT_FOLLOWUP')} label="متابعة تحصيل الديون" />
                  <NavBtn active={activeReport === 'COMMISSION_REPORT'} onClick={() => setActiveReport('COMMISSION_REPORT')} label="تقرير العمولات" />
                  <NavBtn active={activeReport === 'AGING_REPORT'} onClick={() => setActiveReport('AGING_REPORT')} label="أعمار الديون" />
                  <NavBtn active={activeReport === 'EMPLOYEE_LEDGER'} onClick={() => {setActiveReport('EMPLOYEE_LEDGER'); setSelectedId('');}} label="كشف حساب موظف" />
                  <NavBtn active={activeReport === 'EMPLOYEE_ADVANCE'} onClick={() => {setActiveReport('EMPLOYEE_ADVANCE'); setSelectedId('');}} label="سلف الموظفين" />
                </>
              )}
              {activeCategory === 'ANALYTICS' && (
                <>
                  <NavBtn active={activeReport === 'CUSTOMERS_SUMMARY'} onClick={() => setActiveReport('CUSTOMERS_SUMMARY')} label="ملخص مديونيات العملاء" />
                  <NavBtn active={activeReport === 'SUPPLIERS_SUMMARY'} onClick={() => setActiveReport('SUPPLIERS_SUMMARY')} label="ملخص مستحقات الموردين" />
                  {currentUser.role === 'ADMIN' && (
                    <>
                      <NavBtn active={activeReport === 'COST_CENTER_ANALYSIS'} onClick={() => setActiveReport('COST_CENTER_ANALYSIS')} label="تحليل أرباح مراكز التكلفة" />
                      <NavBtn active={activeReport === 'AUDIT_LOG'} onClick={() => setActiveReport('AUDIT_LOG')} label="سجل المراقبة" />
                    </>
                  )}
                </>
              )}
            </div>

            <div className="flex-1 flex flex-wrap items-center gap-4 justify-end w-full">
               <div className="relative group min-w-[200px]">
                  <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500" size={16}/>
                  <input 
                    ref={searchInputRef}
                    type="text" 
                    placeholder="بحث في التقارير..." 
                    className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>

               <div className="flex items-center bg-slate-50 border border-slate-200 rounded-2xl p-1 shadow-inner">
                  <div className="flex flex-col px-3 border-l border-slate-200">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">من تاريخ</span>
                    <input type="date" className="bg-transparent text-slate-900 font-bold text-[10px] outline-none" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  </div>
                  <div className="flex flex-col px-3 border-l border-slate-200">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">إلى تاريخ</span>
                    <input type="date" className="bg-transparent text-slate-900 font-bold text-[10px] outline-none" value={toDate} onChange={e => setToDate(e.target.value)} />
                  </div>
                  <div className="flex flex-col px-3">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">مركز التكلفة</span>
                    <select 
                      className="bg-transparent text-slate-900 font-bold text-[10px] outline-none min-w-[120px] cursor-pointer"
                      value={selectedCostCenterId}
                      onChange={e => setSelectedCostCenterId(e.target.value)}
                    >
                      <option value="ALL">كافة المراكز</option>
                      <option value="GENERAL">المركز الرئيسي</option>
                      {(costCenters || []).filter(cc => cc.isActive).map(cc => (
                        <option key={cc.id} value={cc.id}>{cc.name}</option>
                      ))}
                    </select>
                  </div>
               </div>

               <button 
                onClick={() => setShowPreview(true)}
                className="bg-slate-900 text-indigo-400 px-8 py-3 rounded-2xl font-bold text-xs flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
               >
                <Eye size={16}/> عرض الطباعة
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Account Selector for Ledgers */}
      {(activeReport === 'CUSTOMER_LEDGER' || activeReport === 'SUPPLIER_LEDGER' || activeReport === 'EMPLOYEE_LEDGER' || activeReport === 'EMPLOYEE_ADVANCE' || activeReport === 'PARTNER_LEDGER') && (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center gap-6 no-print">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg">
              {activeReport === 'CUSTOMER_LEDGER' ? <UserIcon size={24}/> : activeReport === 'SUPPLIER_LEDGER' ? <Truck size={24}/> : activeReport === 'PARTNER_LEDGER' ? <Globe size={24}/> : <UserIcon size={24}/>}
           </div>
           <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block tracking-widest">اختر الحساب المطلوب للمراجعة</label>
              <SearchableSelect
                options={
                  activeReport === 'CUSTOMER_LEDGER' 
                    ? (customers || []).map(c => ({ id: c.id, name: c.name, subtext: `الرصيد: ${isHidden ? '****' : (balanceMap.map[`CUSTOMER-${c.id}`]?.base || 0).toLocaleString() || '0'} ج.م` }))
                    : activeReport === 'SUPPLIER_LEDGER'
                    ? (suppliers || []).map(s => ({ id: s.id, name: s.company || s.name, subtext: `الرصيد: ${isHidden ? '****' : (balanceMap.map[`SUPPLIER-${s.id}`]?.base || 0).toLocaleString() || '0'} ج.م` }))
                    : activeReport === 'PARTNER_LEDGER'
                    ? (partners || []).map(p => ({ id: p.id, name: p.name, subtext: `الرصيد: ${isHidden ? '****' : (balanceMap.map[`PARTNER-${p.id}`]?.base || 0).toLocaleString() || '0'} ج.م` }))
                    : activeReport === 'EMPLOYEE_ADVANCE'
                    ? (employees || []).map(e => ({ id: e.id, name: e.name, subtext: `رصيد السلف: ${isHidden ? '****' : (balanceMap.map[`EMPLOYEE_ADVANCE-${e.id}`]?.base || 0).toLocaleString() || '0'} ج.م` }))
                    : (employees || []).map(e => ({ id: e.id, name: e.name, subtext: `الرصيد: ${isHidden ? '****' : (balanceMap.map[`LIABILITY-${e.id}`]?.base || 0).toLocaleString() || '0'} ج.م` }))
                }
                value={selectedId}
                onChange={setSelectedId}
                disabled={currentUser.role !== 'ADMIN' && (activeReport === 'EMPLOYEE_LEDGER' || activeReport === 'EMPLOYEE_ADVANCE')}
                placeholder={currentUser.role !== 'ADMIN' && (activeReport === 'EMPLOYEE_LEDGER' || activeReport === 'EMPLOYEE_ADVANCE') ? 'حسابي الشخصي' : 'اختر من السجل المحاسبي'}
              />
           </div>
        </div>
      )}
      {(activeReport === 'TREASURY_REPORT') && (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center gap-6 no-print">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg">
              <Landmark size={24}/>
           </div>
           <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block tracking-widest">اختر الخزينة المطلوبة للمراجعة</label>
              <SearchableSelect
                options={(treasuries || []).map(t => ({ id: t.id, name: t.name, subtext: `الرصيد: ${shouldMaskAggregate ? '****' : (balanceMap.map[`TREASURY-${t.id}`]?.base || 0).toLocaleString()} ج.م` }))}
                value={selectedId}
                onChange={setSelectedId}
                placeholder="اختر من الخزائن"
              />
           </div>
        </div>
      )}

      {activeReport === 'COST_CENTER_ANALYSIS' && (
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 flex items-center gap-6 no-print">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-indigo-400 shadow-lg">
              <Layers size={24}/>
           </div>
           <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block tracking-widest">اختر مركز التكلفة المطلوب تحليله</label>
              <SearchableSelect
                options={(costCenters || []).map(cc => ({ id: cc.id, name: cc.name }))}
                value={selectedAnalysisCCId}
                onChange={setSelectedAnalysisCCId}
                placeholder="اختر مركز التكلفة"
              />
           </div>
        </div>
      )}

      {/* Embedded Data Table View */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 no-print min-h-[400px]">
        {activeReport === 'CUSTOMERS_SUMMARY' && (
          <CustomersSummary customers={customers} balanceMap={balanceMap.map} isHidden={isHidden} currencies={currencies} searchTerm={effectiveSearchTerm} />
        )}
        {activeReport === 'SUPPLIERS_SUMMARY' && (
          <SuppliersSummary suppliers={suppliers} balanceMap={balanceMap.map} isHidden={isHidden} currencies={currencies} searchTerm={effectiveSearchTerm} />
        )}
        {activeReport === 'SUMMARY' && (
          <TrialBalance trialBalance={trialBalance} shouldMaskAggregate={shouldMaskAggregate} />
        )}
        {activeReport === 'P_L' && (
          <IncomeStatement stats={stats} fromDate={fromDate} toDate={toDate} formatCurrency={formatCurrency} shouldMaskAggregate={shouldMaskAggregate} />
        )}
        {activeReport === 'BALANCE_SHEET' && (
          <BalanceSheet totals={balanceSheetTotals} trialBalance={trialBalance} formatCurrency={formatCurrency} shouldMaskAggregate={shouldMaskAggregate} isHidden={isHidden} toDate={toDate} />
        )}
        {activeReport === 'HAJJ_UMRAH_P_L' && (
          <HajjUmrahPL stats={hajjUmrahProgramStats} fromDate={fromDate} toDate={toDate} shouldMaskAggregate={shouldMaskAggregate} />
        )}
        {activeReport === 'CUSTOMER_ADVANCES' && (
          <CustomerAdvancesReport 
            customers={customers} 
            transactions={transactions} 
            masterTrips={masterTrips} 
            programs={programs} 
            balanceMap={balanceMap.map} 
            isHidden={isHidden} 
            currencies={currencies} 
            searchTerm={effectiveSearchTerm} 
          />
        )}
        {activeReport === 'COST_CENTER_ANALYSIS' && (
          <CostCenterAnalysis stats={costCenterStats} costCenterName={costCenters.find(cc => cc.id === selectedAnalysisCCId)?.name || 'مركز غير معروف'} fromDate={fromDate} toDate={toDate} shouldMaskAggregate={shouldMaskAggregate} />
        )}
        {activeReport === 'COMMISSION_REPORT' && (
          <CommissionReport analyticsData={analyticsData} filteredTx={filteredTx} fromDate={fromDate} toDate={toDate} shouldMaskAggregate={shouldMaskAggregate} setActiveReport={setActiveReport} setSelectedId={setSelectedId} />
        )}
        {activeReport === 'MASTER_TRIP_REPORT' && (
          <MasterTripReport stats={masterTripStats} fromDate={fromDate} toDate={toDate} shouldMaskAggregate={shouldMaskAggregate} />
        )}
        {activeReport === 'AGING_REPORT' && (
          <AgingReport agingData={agingData} isHidden={isHidden} />
        )}
        {activeReport === 'AUDIT_LOG' && (
          <AuditLogReport auditLogs={auditLogs} fromDate={fromDate} toDate={toDate} searchTerm={effectiveSearchTerm} />
        )}
        {activeReport === 'DEBT_FOLLOWUP' && (
          <EmployeeDebtFollowup 
            customers={customers} 
            employees={employees} 
            transactions={transactions} 
            balanceMap={balanceMap.map} 
            isHidden={isHidden} 
            currencies={currencies} 
            searchTerm={effectiveSearchTerm} 
          />
        )}
        {(activeReport === 'CUSTOMER_LEDGER' || activeReport === 'SUPPLIER_LEDGER' || activeReport === 'EMPLOYEE_LEDGER' || activeReport === 'EMPLOYEE_ADVANCE' || activeReport === 'PARTNER_LEDGER' || activeReport === 'TREASURY_REPORT') && selectedId && (
          <AccountLedger 
            activeReport={activeReport}
            selectedId={selectedId}
            ledgerEntries={ledgerEntries}
            openingBalance={openingBalance}
            fromDate={fromDate}
            toDate={toDate}
            isHidden={isHidden}
            shouldMaskAggregate={shouldMaskAggregate}
            customers={customers}
            suppliers={suppliers}
            employees={employees}
            partners={partners}
            treasuries={treasuries}
            currencies={currencies}
            onTransactionClick={onTransactionClick}
            onUpdateTransaction={onUpdateTransaction}
            onUpdateJournalEntry={onUpdateJournalEntry}
            onVoidTransaction={onVoidTransaction}
            onDeleteJournalEntry={onDeleteJournalEntry}
            transactions={transactions}
            journalEntries={journalEntries}
            costCenters={costCenters}
            masterTrips={masterTrips}
            programs={programs}
          />
        )}
      </div>

      {/* Print Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-900 bg-opacity-95 backdrop-blur-xl flex flex-col items-center p-6 overflow-y-auto no-print">
          <div className="w-full max-w-5xl flex justify-between items-center mb-6 text-white animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
                  <ShieldCheck size={24}/>
               </div>
               <div>
                  <h3 className="text-xl font-bold">مركز التقارير والتدقيق المالي</h3>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Financial Intelligence Unit</p>
               </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={handlePrint} 
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95"
              >
                <Printer size={20}/> طباعة المستند
              </button>
              <button 
                onClick={() => setShowPreview(false)} 
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-2xl transition-all hover:rotate-90"
              >
                <X size={24}/>
              </button>
            </div>
          </div>

          <div id="report-to-print" className="bg-white w-full max-w-[210mm] min-h-[297mm] p-[10mm] shadow-2xl relative text-slate-900 animate-in zoom-in-95 duration-700">
             <style>{`
                @media print {
                   @page { size: A4; margin: 10mm; }
                   body { -webkit-print-color-adjust: exact; }
                   .no-print { display: none !important; }
                   table { page-break-inside: auto; width: 100%; border-collapse: collapse; }
                   tr { page-break-inside: avoid; page-break-after: auto; }
                   thead { display: table-header-group; }
                   tfoot { display: table-footer-group; }
                   .report-content { min-height: 150mm; }
                   .avoid-page-break { break-inside: avoid; page-break-inside: avoid; }
                }
             `}</style>
             
             {/* Watermark */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden opacity-[0.03] select-none z-0">
                <div className="text-[8rem] font-bold rotate-[-35deg] whitespace-nowrap uppercase">
                   {settings.name}
                </div>
             </div>

             {/* Official Header */}
             <div className="relative z-10 flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
                <div className="space-y-2 text-right flex-1">
                   <h1 className="text-2xl font-bold text-slate-900 leading-tight">{settings.name}</h1>
                   <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-2 justify-end">
                         {settings.address} <Building2 size={12} className="text-slate-400"/>
                      </p>
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-2 justify-end">
                         {settings.phone} <Phone size={12} className="text-slate-400"/>
                      </p>
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-2 justify-end">
                         {settings.email} <Mail size={12} className="text-slate-400"/>
                      </p>
                      <p className="text-xs font-bold text-slate-700 flex items-center gap-2 justify-end">
                         {settings.facebook} <Facebook size={12} className="text-slate-400"/>
                      </p>
                   </div>
                   <div className="pt-1 border-t border-slate-100">
                      <p className="text-xs font-bold text-indigo-600">قسم الحسابات والتدقيق المالي</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest italic leading-none">Department of Financial Compliance & Internal Audit</p>
                   </div>
                </div>
                <div className="flex flex-col items-center gap-2 mr-6">
                   {settings.logo && <img src={settings.logo} className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-50 shadow-md" />}
                   <div className="px-3 py-1 bg-slate-900 text-white rounded-full shadow-md">
                      <p className="text-[7px] font-bold uppercase tracking-[0.2em]">Official Statement</p>
                   </div>
                </div>
             </div>

             <div className="relative z-10 mb-6 flex justify-center">
                <div className="relative flex flex-col items-center gap-2">
                   <div className="relative">
                      <div className="absolute -inset-1 bg-slate-900 rounded-xl blur-sm opacity-5"></div>
                      <h2 className="relative text-lg font-bold px-8 py-2 bg-white text-slate-900 rounded-xl border-2 border-slate-900 shadow-sm">
                         {getReportName()}
                      </h2>
                   </div>
                   {selectedCostCenterId !== 'ALL' && (
                     <div className="px-4 py-1 bg-slate-100 border border-slate-200 text-slate-900 rounded-full font-bold text-xs shadow-sm">
                        {selectedCostCenterId === 'GENERAL' ? 'المركز الرئيسي' : (costCenters || []).find(cc => cc.id === selectedCostCenterId)?.name}
                     </div>
                   )}
                </div>
             </div>

             <div className="report-content min-h-[400px]">
                {activeReport === 'CUSTOMERS_SUMMARY' && <CustomersSummary customers={customers} balanceMap={balanceMap.map} isHidden={isHidden} currencies={currencies} searchTerm={effectiveSearchTerm} isPrint={true} />}
                {activeReport === 'SUPPLIERS_SUMMARY' && <SuppliersSummary suppliers={suppliers} balanceMap={balanceMap.map} isHidden={isHidden} currencies={currencies} searchTerm={effectiveSearchTerm} isPrint={true} />}
                {activeReport === 'SUMMARY' && <TrialBalance trialBalance={trialBalance} shouldMaskAggregate={shouldMaskAggregate} isPrint={true} />}
                {activeReport === 'P_L' && <IncomeStatement stats={stats} fromDate={fromDate} toDate={toDate} formatCurrency={formatCurrency} shouldMaskAggregate={shouldMaskAggregate} isPrint={true} />}
                {activeReport === 'BALANCE_SHEET' && <BalanceSheet totals={balanceSheetTotals} trialBalance={trialBalance} formatCurrency={formatCurrency} shouldMaskAggregate={shouldMaskAggregate} isHidden={isHidden} toDate={toDate} isPrint={true} />}
                {activeReport === 'HAJJ_UMRAH_P_L' && <HajjUmrahPL stats={hajjUmrahProgramStats} fromDate={fromDate} toDate={toDate} shouldMaskAggregate={shouldMaskAggregate} isPrint={true} />}
                {activeReport === 'COST_CENTER_ANALYSIS' && (
                  <CostCenterAnalysis stats={costCenterStats} costCenterName={costCenters.find(cc => cc.id === selectedAnalysisCCId)?.name || 'مركز غير معروف'} fromDate={fromDate} toDate={toDate} shouldMaskAggregate={shouldMaskAggregate} isPrint={true} />
                )}
                {activeReport === 'COMMISSION_REPORT' && <CommissionReport analyticsData={analyticsData} filteredTx={filteredTx} fromDate={fromDate} toDate={toDate} shouldMaskAggregate={shouldMaskAggregate} setActiveReport={setActiveReport} setSelectedId={setSelectedId} isPrint={true} />}
                {activeReport === 'MASTER_TRIP_REPORT' && <MasterTripReport stats={masterTripStats} fromDate={fromDate} toDate={toDate} shouldMaskAggregate={shouldMaskAggregate} isPrint={true} />}
                {activeReport === 'AGING_REPORT' && <AgingReport agingData={agingData} isHidden={isHidden} isPrint={true} />}
                {activeReport === 'TREASURY_TRANSFERS' && <TreasuryTransfers transactions={transactions} treasuries={treasuries} fromDate={fromDate} toDate={toDate} isPrint={true} baseCurrency={settings.baseCurrency} />}
                {activeReport === 'AUDIT_LOG' && <AuditLogReport auditLogs={auditLogs} fromDate={fromDate} toDate={toDate} searchTerm={effectiveSearchTerm} isPrint={true} />}
                {activeReport === 'DEBT_FOLLOWUP' && (
                  <EmployeeDebtFollowup 
                    customers={customers} 
                    employees={employees} 
                    transactions={transactions} 
                    balanceMap={balanceMap.map} 
                    isHidden={isHidden} 
                    currencies={currencies} 
                    searchTerm={effectiveSearchTerm} 
                    isPrint={true} 
                  />
                )}
                {(activeReport === 'CUSTOMER_LEDGER' || activeReport === 'SUPPLIER_LEDGER' || activeReport === 'EMPLOYEE_LEDGER' || activeReport === 'EMPLOYEE_ADVANCE' || activeReport === 'PARTNER_LEDGER' || activeReport === 'TREASURY_REPORT') && selectedId && (
                  <AccountLedger 
                    activeReport={activeReport} selectedId={selectedId} ledgerEntries={ledgerEntries} openingBalance={openingBalance} fromDate={fromDate} toDate={toDate} isHidden={isHidden} shouldMaskAggregate={shouldMaskAggregate}
                    customers={customers} suppliers={suppliers} employees={employees} partners={partners} treasuries={treasuries} currencies={currencies} isPrint={true}
                    baseCurrency={settings.baseCurrency}
                    transactions={transactions}
                    journalEntries={journalEntries}
                    onUpdateTransaction={onUpdateTransaction}
                    onUpdateJournalEntry={onUpdateJournalEntry}
                    costCenters={costCenters}
                    masterTrips={masterTrips}
                    programs={programs}
                  />
                )}
             </div>

             <div className="mt-8 pt-4 border-t-2 border-slate-900 avoid-page-break">
                <div className="bg-slate-900 text-white p-4 rounded-2xl border-r-4 border-indigo-500 shadow-xl">
                   <p className="text-[10px] font-bold uppercase mb-1 flex items-center gap-2 text-indigo-400 tracking-widest"><ShieldCheck size={14}/> إقرار واعتماد (Official Verification)</p>
                   <p className="text-[9px] font-bold leading-tight text-slate-300">
                      يعتبر هذا المستند مستخرجاً رسمياً من الأنظمة المحاسبية المعتمدة للمؤسسة، وهو تقرير نهائي وقطعي ملزم لجميع الأطراف المذكورة فيه.
                      يعتبر المستند والبيانات الواردة فيه صحيحة ونهائية ما لم يتم الاعتراض عليها خطياً وبمستندات رسمية خلال مدة أقصاها (72 ساعة).
                   </p>
                </div>
             </div>

             <div className="mt-4 pt-4 border-t border-slate-200 avoid-page-break">
                <div className="flex justify-between items-end">
                   <div className="text-center flex-1">
                      <p className="text-xs font-bold text-slate-700 mb-1">توقيع الإدارة المالية</p>
                      <div className="border-b border-slate-400 w-32 mx-auto mb-1"></div>
                      <p className="text-[8px] text-slate-500">المحاسب المسؤول</p>
                   </div>
                   <div className="text-center flex-1">
                      <p className="text-sm font-bold text-slate-700 mb-2">ختم الاعتماد</p>
                      <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-full mx-auto flex items-center justify-center bg-slate-50">
                         <p className="text-xs text-slate-400 font-bold">STAMP</p>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">تاريخ الاعتماد</p>
                   </div>
                </div>
             </div>
             
             <div className="absolute bottom-6 right-10 left-10 flex justify-between items-center text-[9px] text-slate-400 font-bold pt-5 border-t z-10">
                <span className="uppercase tracking-widest">VERIFICATION ID: NB-{activeReport.replace('_','-')}-{Date.now().toString().slice(-6)}</span>
                <span className="uppercase tracking-widest">Internal Audit Copy • {settings.name}</span>
                <span>Page 1 of 1</span>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
