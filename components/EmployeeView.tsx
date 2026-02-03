
import React, { useState, useMemo } from 'react';
import { Plus, Search, Contact2, Trash2, Edit2, Save, X, DollarSign, TrendingUp, UserCheck, Briefcase, Users, Activity, Wallet, Landmark, ArrowRightLeft, FileText, Calendar, Award, Building2, ClipboardList, Shield, HardDrive } from 'lucide-react';
import { 
  Employee, Transaction, User as UserType, Treasury, JournalEntry, CostCenter, Shift,
  EmployeeLeave, EmployeeAllowance, EmployeeDocument, Department, Designation 
} from '../types';
import SearchableSelect from './SearchableSelect';
import { Layers, Fingerprint, Clock } from 'lucide-react';
import { calculateAttendanceDeductions } from '../utils/attendance';

interface EmployeeViewProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  deleteEmployee: (id: string) => void;
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  addTransaction: (tx: any) => void;
  treasuries: Treasury[];
  currentUser: UserType;
  searchTerm?: string;
  formatCurrency: (amount: number) => string;
  addAuditLog: (action: any, entityType: any, entityId: string, details: string, oldV?: any, newV?: any) => void;
  costCenters: CostCenter[];
  enableCostCenters?: boolean;
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
  shifts: Shift[];
  attendanceLogs: any[];
  leaves: EmployeeLeave[];
  setLeaves: React.Dispatch<React.SetStateAction<EmployeeLeave[]>>;
  allowances: EmployeeAllowance[];
  setAllowances: React.Dispatch<React.SetStateAction<EmployeeAllowance[]>>;
  documents: EmployeeDocument[];
  setDocuments: React.Dispatch<React.SetStateAction<EmployeeDocument[]>>;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  designations: Designation[];
  setDesignations: React.Dispatch<React.SetStateAction<Designation[]>>;
}

const EmployeeView: React.FC<EmployeeViewProps> = ({ 
  employees, setEmployees, deleteEmployee, transactions, journalEntries, addTransaction, treasuries, 
  currentUser, searchTerm: globalSearchTerm = '', formatCurrency, addAuditLog, 
  costCenters, enableCostCenters, initialEditingId, onClearInitialEdit, shifts, attendanceLogs,
  leaves, setLeaves, allowances, setAllowances, documents, setDocuments, 
  departments, setDepartments, designations, setDesignations
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const [showAdd, setShowAdd] = useState(false);
  const [showAdvanceForm, setShowAdvanceForm] = useState(false);
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [showAllowanceForm, setShowAllowanceForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [showCommissionForm, setShowCommissionForm] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    employeeId: '',
    paySalary: true,
    payCommission: true,
    salaryAmount: 0,
    commissionAmount: 0,
    allowances: 0,
    advances: 0,
    deductions: 0,
    treasuryId: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [activeTab, setActiveTab] = useState<'INFO' | 'FINANCE' | 'LEAVES' | 'DOCS'>('INFO');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialEditingId) {
      const employee = (employees || []).find(e => e.id === initialEditingId);
      if (employee) {
        setHighlightedId(employee.id);
        setTimeout(() => {
          const element = document.getElementById(`employee-${employee.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 500);
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, employees, onClearInitialEdit]);

  const toggleSelectAll = () => {
    if (selectedIds.length === (filtered || []).length) {
      setSelectedIds([]);
    } else {
      setSelectedIds((filtered || []).map(e => e.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`هل أنت متأكد من حذف ${(selectedIds || []).length} من الموظفين المحددين؟`)) {
      (selectedIds || []).forEach(id => {
        if (id) deleteEmployee(id);
      });
      setSelectedIds([]);
    }
  };

  const [advanceData, setAdvanceData] = useState({
    employeeId: '',
    amount: '',
    treasuryId: (treasuries || [])[0]?.id || '',
    type: 'ADVANCE_PAYMENT' as 'ADVANCE_PAYMENT' | 'ADVANCE_DEDUCTION',
    date: new Date().toISOString().split('T')[0],
    costCenterId: ''
  });

  const [commissionData, setCommissionData] = useState({
    employeeId: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    costCenterId: ''
  });

  const effectiveSearchTerm = globalSearchTerm || searchTerm;

  const handleCommissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(commissionData.amount);
    if (isNaN(amountNum) || amountNum <= 0 || !commissionData.employeeId) {
      alert("يرجى إدخال مبلغ عمولة صحيح أكبر من الصفر");
      return;
    }

    const emp = (employees || []).find(e => e && e.id === commissionData.employeeId);
    if (!emp) return;

    addTransaction({
      description: commissionData.description || `عمولة يدوية للموظف: ${emp.name}`,
      amount: 0,
      amountInBase: 0,
      sellingPrice: 0,
      purchasePrice: 0,
      commissionAmount: amountNum,
      type: 'INCOME', // To trigger the sale logic in addTransaction
      category: 'GENERAL_SERVICE',
      date: commissionData.date,
      relatedEntityId: 'INTERNAL', // Dummy customer
      relatedEntityType: 'CUSTOMER',
      employeeId: commissionData.employeeId,
      applyCommission: true,
      costCenterId: commissionData.costCenterId || undefined
    });

    addAuditLog('CREATE', 'TRANSACTION', Date.now().toString(), `تسجيل عمولة يدوية: ${emp.name} بمبلغ ${amountNum}`);

    setShowCommissionForm(false);
    setCommissionData({ ...commissionData, amount: '', employeeId: '', description: '' });
  };

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(advanceData.amount);
    if (isNaN(amountNum) || !advanceData.employeeId) return;

    const emp = (employees || []).find(e => e && e.id === advanceData.employeeId);
    if (!emp) return;

    addTransaction({
      description: advanceData.type === 'ADVANCE_PAYMENT' 
        ? `صرف سلفة للموظف: ${emp.name}`
        : `خصم سلفة من الموظف: ${emp.name}`,
      amount: amountNum,
      amountInBase: amountNum,
      type: advanceData.type,
      category: 'EMPLOYEE_ADVANCE',
      date: advanceData.date,
      treasuryId: advanceData.type === 'ADVANCE_PAYMENT' ? advanceData.treasuryId : undefined,
      relatedEntityId: advanceData.employeeId,
      relatedEntityType: 'EMPLOYEE',
      costCenterId: advanceData.costCenterId || undefined
    });

    addAuditLog('CREATE', 'TRANSACTION', Date.now().toString(), `${advanceData.type === 'ADVANCE_PAYMENT' ? 'صرف' : 'خصم'} سلفة: ${emp.name} بمبلغ ${amountNum}`);

    setShowAdvanceForm(false);
    setAdvanceData({ ...advanceData, amount: '', employeeId: '' });
  };

  const calculatedBalances = useMemo(() => {
    const balances: Record<string, { balance: number, advances: number, commissions: number }> = {};
    const treasuryBalances: Record<string, number> = {};

    (employees || []).forEach(e => {
      if (!e || !e.id) return;
      balances[e.id] = { 
        balance: e.openingBalance || 0,
        advances: e.openingAdvances || 0,
        commissions: e.openingBalance || 0
      };
    });

    (treasuries || []).forEach(t => {
      if (!t || !t.id) return;
      treasuryBalances[t.id] = t.openingBalance || 0;
    });

    (journalEntries || []).forEach(entry => {
      if (!entry?.lines) return;
      (entry.lines || []).forEach(line => {
        if (!line || !line.accountId) return;
        if (line.accountType === 'EMPLOYEE_ADVANCE' && balances[line.accountId]) {
          balances[line.accountId].advances += (line.debit || 0) - (line.credit || 0);
        } else if (line.accountType === 'LIABILITY' && balances[line.accountId]) {
          // Commission liability: credit increases it, debit decreases it
          balances[line.accountId].commissions += (line.credit || 0) - (line.debit || 0);
        } else if (line.accountType === 'TREASURY' && treasuryBalances[line.accountId] !== undefined) {
          treasuryBalances[line.accountId] += (line.debit || 0) - (line.credit || 0);
        }
      });
    });
    return { employees: balances, treasuries: treasuryBalances };
  }, [employees, treasuries, journalEntries]);

  const globalStats = useMemo(() => {
    const total = (employees || []).length;
    const baseSalaries = (employees || []).reduce((s, e) => s + (e?.basicSalary || 0), 0);
    const totalBalances = (employees || []).reduce((s, e) => {
      if (!e?.id) return s;
      const b = calculatedBalances?.employees?.[e.id];
      return s + (b?.commissions || 0) - (b?.advances || 0);
    }, 0);
    const activeThisMonth = (employees || []).filter(e => {
      if (!e?.id) return false;
      return (transactions || []).some(t => {
        if (!t?.date || !t?.employeeId) return false;
        try {
          const d = new Date(t.date);
          if (isNaN(d.getTime())) return false;
          const now = new Date();
          return t.employeeId === e.id && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        } catch (err) {
          return false;
        }
      });
    }).length;
    return { total, baseSalaries, totalBalances, activeThisMonth };
  }, [employees, transactions, calculatedBalances]);

  const [formData, setFormData] = useState({
    name: '', 
    phone: '', 
    basicSalary: '', 
    commissionRate: '10', 
    position: 'مسؤول مبيعات', 
    joiningDate: new Date().toISOString().split('T')[0],
    fingerprintId: '',
    shiftId: '',
    departmentId: '',
    designationId: '',
    leaveBalance: '21'
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const oldEmp = editingId ? ((employees || []).find(emp => emp && emp.id === editingId)) : undefined;
    const newEmp: Employee = {
      id: editingId || Date.now().toString(),
      name: formData.name,
      phone: formData.phone,
      basicSalary: parseFloat(formData.basicSalary) || 0,
      commissionRate: parseFloat(formData.commissionRate) || 0,
      position: formData.position,
      joiningDate: formData.joiningDate,
      balance: editingId ? (oldEmp?.balance || 0) : 0,
      advances: editingId ? (oldEmp?.advances || 0) : 0,
      fingerprintId: formData.fingerprintId,
      shiftId: formData.shiftId,
      departmentId: formData.departmentId,
      designationId: formData.designationId,
      leaveBalance: parseFloat(formData.leaveBalance) || 21
    };

    if (editingId) {
      setEmployees(prev => (prev || []).map(e => e.id === editingId ? newEmp : e));
      addAuditLog('UPDATE', 'EMPLOYEE', editingId, `تعديل بيانات الموظف: ${newEmp.name}`, oldEmp, newEmp);
    } else {
      setEmployees(prev => [...(prev || []), newEmp]);
      addAuditLog('CREATE', 'EMPLOYEE', newEmp.id, `إضافة موظف جديد: ${newEmp.name}`, undefined, newEmp);
    }

    setFormData({ 
      name: '', 
      phone: '', 
      basicSalary: '', 
      commissionRate: '10', 
      position: 'مسؤول مبيعات', 
      joiningDate: new Date().toISOString().split('T')[0],
      fingerprintId: '',
      shiftId: '',
      departmentId: '',
      designationId: '',
      leaveBalance: '21'
    });
    setShowAdd(false);
    setEditingId(null);
  };

  const getEmployeeStats = (employeeId: string) => {
    const employeeTx = (transactions || []).filter(t => t && t.employeeId === employeeId && !t.isVoided);
    const employee = (employees || []).find(e => e && e.id === employeeId);
    
    // Pro-rated salary calculation if joined this month
    let basicSalary = employee?.basicSalary || 0;
    if (employee?.joiningDate) {
      const joinDate = new Date(employee.joiningDate);
      const now = new Date();
      // If joined in the same month and year as "now"
      if (joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()) {
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const workingDays = daysInMonth - joinDate.getDate() + 1;
        if (workingDays < daysInMonth && workingDays > 0) {
           basicSalary = (basicSalary / daysInMonth) * workingDays;
        }
      }
    }

    // حساب الأرباح لكل عملية
    let totalProfit = 0;

    employeeTx.forEach(tx => {
      if (!tx) return;
      // الربح بناءً على العملية
      const rateScale = tx.exchangeRate || 1;
      const sellBase = ((tx.sellingPrice || 0) - (tx.discount || 0)) * rateScale;
      const buyBase = (tx.purchasePrice || (tx.type === 'PURCHASE_ONLY' || tx.isPurchaseOnly ? tx.amount : 0) || 0) * rateScale;
      
      const profit = sellBase - buyBase;
      totalProfit += profit;
    });
    
    const empCommissions = calculatedBalances?.employees?.[employeeId]?.commissions || 0;
    const empAdvances = calculatedBalances?.employees?.[employeeId]?.advances || 0;

    // حساب خصومات البصمة
    let attendanceDeductions = 0;
    if (employee?.fingerprintId && employee?.shiftId) {
      const shift = (shifts || []).find(s => s && s.id === employee.shiftId);
      if (shift) {
        const empLogs = (attendanceLogs || []).filter(l => l && l.deviceUserId == employee.fingerprintId);
        // حساب للشهر الحالي افتراضياً
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfToday = new Date();
        const attStats = calculateAttendanceDeductions(empLogs, shift, employee, startOfMonth, endOfToday);
        attendanceDeductions = attStats?.totalDeductions || 0;
      }
    }
    
    const empAllowances = (allowances || []).filter(a => a && a.employeeId === employeeId && a.isMonthly);
    const totalAllowances = empAllowances.reduce((s, a) => {
      if (!a) return s;
      if (a.type === 'FIXED') return s + (a.amount || 0);
      return s + (employee?.basicSalary || 0) * ((a.amount || 0) / 100);
    }, 0);
    
    return {
      txCount: employeeTx.length,
      totalProfit,
      commission: empCommissions, // Use ledger balance
      advances: empAdvances,
      attendanceDeductions,
      allowances: totalAllowances,
      totalPayable: basicSalary + empCommissions + totalAllowances - empAdvances - attendanceDeductions,
      actualBasicSalary: basicSalary // Returning the calculated salary
    };
  };

  const handlePaySalary = (employeeId: string) => {
    const emp = (employees || []).find(e => e && e.id === employeeId);
    if (!emp) return;
    const stats = getEmployeeStats(employeeId);
    
    setPaymentFormData({
      employeeId,
      paySalary: true,
      payCommission: true,
      salaryAmount: stats.actualBasicSalary,
      commissionAmount: stats.commission,
      allowances: stats.allowances,
      advances: stats.advances,
      deductions: stats.attendanceDeductions,
      treasuryId: (treasuries || [])[0]?.id || '',
      date: new Date().toISOString().split('T')[0]
    });
    setShowPaymentModal(true);
  };

  const submitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = (employees || []).find(e => e && e.id === paymentFormData.employeeId);
    if (!emp) return;

    // 1. Pay Salary Part
    if (paymentFormData.paySalary) {
      const salaryPart = paymentFormData.salaryAmount + paymentFormData.allowances - paymentFormData.deductions;
      if (salaryPart > 0) {
        addTransaction({
          description: `صرف راتب شهر: ${emp.name}`,
          amount: salaryPart,
          amountInBase: salaryPart,
          type: 'EXPENSE',
          category: 'EXPENSE_GEN',
          expenseCategory: 'رواتب وأجور',
          date: paymentFormData.date,
          treasuryId: paymentFormData.treasuryId,
          relatedEntityId: emp.id,
          relatedEntityType: 'EMPLOYEE'
        });
      }
      
      // Clear Advances if paying salary
      if (paymentFormData.advances > 0) {
        addTransaction({
          description: `تسوية سلف موظف عند صرف الراتب: ${emp.name}`,
          amount: paymentFormData.advances,
          amountInBase: paymentFormData.advances,
          type: 'ADVANCE_DEDUCTION',
          category: 'EMPLOYEE_ADVANCE',
          date: paymentFormData.date,
          relatedEntityId: emp.id,
          relatedEntityType: 'EMPLOYEE'
        });
      }
    }

    // 2. Pay Commission Part
    if (paymentFormData.payCommission && paymentFormData.commissionAmount > 0) {
      addTransaction({
        description: `صرف عمولات مستحقة: ${emp.name}`,
        amount: paymentFormData.commissionAmount,
        amountInBase: paymentFormData.commissionAmount,
        type: 'EXPENSE',
        category: 'CASH',
        date: paymentFormData.date,
        treasuryId: paymentFormData.treasuryId,
        relatedEntityId: emp.id,
        relatedEntityType: 'EMPLOYEE'
      });
    }

    addAuditLog('CREATE', 'TRANSACTION', Date.now().toString(), `صرف مستحقات للموظف: ${emp.name}`);
    setShowPaymentModal(false);
  };

  const handleLeaveSubmit = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newLeave: EmployeeLeave = {
      id: Date.now().toString(),
      employeeId: selectedEmployeeId!,
      type: fd.get('type') as any,
      startDate: fd.get('startDate') as string,
      endDate: fd.get('endDate') as string,
      status: 'PENDING',
      reason: fd.get('reason') as string
    };
    setLeaves(prev => [...(prev || []), newLeave]);
    setShowLeaveForm(false);
    addAuditLog('CREATE', 'LEAVE', newLeave.id, `طلب إجازة للموظف: ${selectedEmp?.name}`);
  };

  const handleAllowanceSubmit = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newAllowance: EmployeeAllowance = {
      id: Date.now().toString(),
      employeeId: selectedEmployeeId!,
      name: fd.get('name') as string,
      amount: parseFloat(fd.get('amount') as string),
      type: fd.get('type') as any,
      isMonthly: fd.get('isMonthly') === 'true'
    };
    setAllowances(prev => [...(prev || []), newAllowance]);
    setShowAllowanceForm(false);
    addAuditLog('CREATE', 'ALLOWANCE', newAllowance.id, `إضافة بدل للموظف: ${selectedEmp?.name}`);
  };

  const handleDocSubmit = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newDoc: EmployeeDocument = {
      id: Date.now().toString(),
      employeeId: selectedEmployeeId!,
      name: fd.get('name') as string,
      type: fd.get('type') as string,
      expiryDate: fd.get('expiryDate') as string,
      filePath: fd.get('filePath') as string
    };
    setDocuments(prev => [...(prev || []), newDoc]);
    setShowDocForm(false);
    addAuditLog('CREATE', 'DOCUMENT', newDoc.id, `إضافة مستند للموظف: ${selectedEmp?.name}`);
  };

  const filtered = (employees || []).filter(e => {
    const s = (effectiveSearchTerm || '').toLowerCase();
    return (e.name || '').toLowerCase().includes(s) || (e.position || '').toLowerCase().includes(s);
  });

  const selectedEmp = (employees || []).find(e => e.id === selectedEmployeeId);

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Users size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي الموظفين</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{globalStats.total}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">كتلة الرواتب</p>
            <p className="text-2xl font-bold text-indigo-600 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(globalStats.baseSalaries || 0)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">مستحقات (مديونية)</p>
            <p className="text-2xl font-bold text-rose-600 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(globalStats.totalBalances || 0)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">نشطون هذا الشهر</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{globalStats.activeThisMonth}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-200 no-print gap-8 mt-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg">
            <Contact2 size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">شؤون الموظفين</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">إدارة الرواتب والأداء المالي والعمولات</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => setShowAdvanceForm(true)} 
            className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-amber-500 hover:text-white transition-all active:scale-95"
          >
            <ArrowRightLeft size={18} /> سلف ومسحوبات
          </button>
          <button 
            onClick={() => setShowCommissionForm(true)} 
            className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-emerald-600 hover:text-white transition-all active:scale-95"
          >
            <Award size={18} /> عمولة يدوية
          </button>
          <button 
            onClick={() => setShowAdd(true)} 
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-md active:scale-95"
          >
            <Plus size={18} /> إضافة موظف جديد
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mt-8 no-print">
        <div className="flex items-center gap-4 flex-1">
          {currentUser.role === 'ADMIN' && (
            <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                checked={filtered.length > 0 && selectedIds.length === filtered.length}
                onChange={toggleSelectAll}
              />
              <span className="text-xs font-bold text-slate-500">تحديد الكل</span>
            </div>
          )}
          <div className="relative flex-1 max-w-2xl group">
            <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="بحث في سجل الموظفين..." 
              className="w-full pr-14 pl-10 py-3 bg-white border border-slate-200 rounded-2xl focus:border-indigo-600 outline-none font-bold text-sm shadow-sm transition-all placeholder:text-slate-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        {selectedIds.length > 0 && currentUser.role === 'ADMIN' && (
          <button 
            onClick={handleBulkDelete}
            className="bg-rose-50 text-rose-600 px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-rose-100 transition-all shadow-sm active:scale-95"
          >
            <Trash2 size={18} />
            حذف المحدد ({selectedIds.length})
          </button>
        )}
      </div>

      {showAdvanceForm && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500 no-print">
          {/* ... existing advance form content ... */}
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-amber-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                إدارة سلف الموظفين
              </h3>
            </div>
            <button onClick={() => setShowAdvanceForm(false)} className="text-slate-400 hover:text-rose-500 transition-all bg-slate-50 hover:bg-rose-50 p-2 rounded-xl">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleAdvanceSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">الموظف</label>
              <SearchableSelect
                options={(employees || []).map(e => ({ id: e?.id, name: e?.name, subtext: `الراتب: ${isHidden ? '****' : formatCurrency(e?.basicSalary || 0)}` }))}
                value={advanceData.employeeId}
                onChange={val => setAdvanceData({...advanceData, employeeId: val})}
                placeholder="اختر الموظف"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">نوع العملية</label>
              <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={advanceData.type} onChange={e => setAdvanceData({...advanceData, type: e.target.value as any})}>
                <option value="ADVANCE_PAYMENT">صرف سلفة جديدة</option>
                <option value="ADVANCE_DEDUCTION">خصم من الرصيد/الراتب</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">المبلغ</label>
              <input type="number" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-amber-500 outline-none font-bold text-sm text-center text-slate-900 transition-all focus:bg-white" value={advanceData.amount} onChange={e => setAdvanceData({...advanceData, amount: e.target.value})} />
            </div>
            {advanceData.type === 'ADVANCE_PAYMENT' && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">الصرف من</label>
                <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={advanceData.treasuryId} onChange={e => setAdvanceData({...advanceData, treasuryId: e.target.value})}>
                  {(treasuries || []).map(t => (
                    <option key={t?.id} value={t?.id}>
                      {t?.type === 'CUSTODY' ? '📦 ' : t?.type === 'BANK' ? '🏦 ' : '💰 '}
                      {t?.name} ({t?.type === 'CUSTODY' ? 'عهدة' : t?.type === 'BANK' ? 'بنك' : 'خزينة'})
                    </option>
                  ))}
                </select>
              </div>
            )}
            {enableCostCenters && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">مركز التكلفة</label>
                <select 
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white"
                  value={advanceData.costCenterId}
                  onChange={e => setAdvanceData({...advanceData, costCenterId: e.target.value})}
                >
                  <option value="">تلقائي (GENERAL)</option>
                  {(costCenters || []).filter(cc => cc && cc.isActive).map(cc => (
                    <option key={cc?.id} value={cc?.id}>{cc?.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="lg:col-span-4 flex justify-end gap-4 mt-6 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setShowAdvanceForm(false)} className="px-6 py-2.5 text-slate-400 font-bold text-sm hover:text-rose-600 transition-colors">إلغاء</button>
              <button type="submit" className="bg-amber-500 text-slate-900 px-8 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-amber-600 transition-all flex items-center gap-2 active:scale-95">
                <ArrowRightLeft size={18} />
                تأكيد العملية
              </button>
            </div>
          </form>
        </div>
      )}

      {showCommissionForm && (
        <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500 no-print mb-8">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-emerald-500 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                تسجيل عمولة يدوية استثنائية
              </h3>
            </div>
            <button onClick={() => setShowCommissionForm(false)} className="text-slate-400 hover:text-rose-500 transition-all bg-slate-50 hover:bg-rose-50 p-2 rounded-xl">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleCommissionSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">الموظف</label>
              <SearchableSelect
                options={(employees || []).map(e => ({ id: e?.id, name: e?.name, subtext: `${e?.position}` }))}
                value={commissionData.employeeId}
                onChange={val => setCommissionData({...commissionData, employeeId: val})}
                placeholder="اختر الموظف"
              />
            </div>
            <div className="flex flex-col gap-2 lg:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">البيان (سبب العمولة)</label>
              <input type="text" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={commissionData.description} onChange={e => setCommissionData({...commissionData, description: e.target.value})} placeholder="مثال: مكافأة عن أداء استثنائي في رحلة عمرة" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">المبلغ</label>
              <input type="number" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold text-sm text-center text-slate-900 transition-all focus:bg-white" value={commissionData.amount} onChange={e => setCommissionData({...commissionData, amount: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">التاريخ</label>
              <input type="date" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white text-center" value={commissionData.date} onChange={e => setCommissionData({...commissionData, date: e.target.value})} />
            </div>
            {enableCostCenters && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">مركز التكلفة</label>
                <select 
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white"
                  value={commissionData.costCenterId}
                  onChange={e => setCommissionData({...commissionData, costCenterId: e.target.value})}
                >
                  <option value="">تلقائي (GENERAL)</option>
                  {(costCenters || []).filter(cc => cc && cc.isActive).map(cc => (
                    <option key={cc.id} value={cc.id}>{cc.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="lg:col-span-4 flex justify-end gap-4 mt-6 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => setShowCommissionForm(false)} className="px-6 py-2.5 text-slate-400 font-bold text-sm hover:text-rose-600 transition-colors">إلغاء</button>
              <button type="submit" className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95">
                <Award size={18} />
                تسجيل العمولة
              </button>
            </div>
          </form>
        </div>
      )}

      {showAdd && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500 no-print relative overflow-hidden">
          <div className="flex justify-between items-center mb-8 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-8 bg-indigo-600 rounded-full"></div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {editingId ? 'تعديل بيانات الموظف' : 'تسجيل موظف جديد'}
              </h3>
            </div>
            <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="text-slate-400 hover:text-rose-500 transition-all bg-slate-50 hover:bg-rose-50 p-2 rounded-xl">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">اسم الموظف</label>
              <input required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">رقم الهاتف</label>
              <input className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">المسمى الوظيفي</label>
              <input required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">رقم البصمة (ID)</label>
              <input className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" placeholder="مثال: 101" value={formData.fingerprintId} onChange={e => setFormData({...formData, fingerprintId: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">نظام الدوام</label>
              <select 
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white"
                value={formData.shiftId}
                onChange={e => setFormData({...formData, shiftId: e.target.value})}
              >
                <option value="">بدون نظام دوام</option>
                {(shifts || []).map(shift => (
                  <option key={shift?.id} value={shift?.id}>{shift?.name} ({shift?.startTime} - {shift?.endTime})</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">الراتب الأساسي</label>
              <input type="number" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-center text-slate-900 transition-all focus:bg-white" value={formData.basicSalary} onChange={e => setFormData({...formData, basicSalary: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">نسبة العمولة %</label>
              <input type="number" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-center text-slate-900 transition-all focus:bg-white" value={formData.commissionRate} onChange={e => setFormData({...formData, commissionRate: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">تاريخ التعيين</label>
              <input type="date" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={formData.joiningDate} onChange={e => setFormData({...formData, joiningDate: e.target.value})} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">القسم</label>
              <select 
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white"
                value={formData.departmentId}
                onChange={e => setFormData({...formData, departmentId: e.target.value})}
              >
                <option value="">اختر القسم</option>
                {(departments || []).map(dept => (
                  <option key={dept?.id} value={dept?.id}>{dept?.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">المسمى الوظيفي (الهيكل)</label>
              <select 
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white"
                value={formData.designationId}
                onChange={e => setFormData({...formData, designationId: e.target.value})}
              >
                <option value="">اختر المسمى</option>
                {(designations || []).filter(d => d && (!formData.departmentId || d.departmentId === formData.departmentId)).map(des => (
                  <option key={des?.id} value={des?.id}>{des?.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">رصيد الإجازات السنوي</label>
              <input type="number" className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white text-center" value={formData.leaveBalance} onChange={e => setFormData({...formData, leaveBalance: e.target.value})} />
            </div>
            <div className="lg:col-span-3 flex justify-end gap-4 mt-6 pt-6 border-t border-slate-100">
              <button type="button" onClick={() => { setShowAdd(false); setEditingId(null); }} className="px-6 py-2.5 text-slate-400 font-bold text-sm hover:text-rose-600 transition-colors">إلغاء</button>
              <button type="submit" className="bg-slate-900 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-600 transition-all flex items-center gap-2 active:scale-95">
                <Save size={18} />
                {editingId ? 'حفظ التعديلات' : 'تسجيل الموظف'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(filtered || []).map(emp => {
          if (!emp?.id) return null;
          const stats = getEmployeeStats(emp.id);
          return (
            <div 
              key={emp.id} 
              id={`employee-${emp.id}`}
              className={`bg-white rounded-3xl shadow-sm border transition-all duration-300 overflow-hidden group ${highlightedId === emp.id ? 'ring-4 ring-indigo-500 border-indigo-500 scale-[1.01] z-10 shadow-2xl bg-indigo-50/30' : (selectedIds || []).includes(emp.id) ? 'border-indigo-500 shadow-md ring-1 ring-indigo-500 ring-opacity-20' : 'border-slate-200 hover:border-indigo-200'}`}
            >
               <div className="p-6 bg-slate-900 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 bg-opacity-10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                  <div className="flex items-center gap-4 relative z-10">
                     {currentUser?.role === 'ADMIN' && (
                       <input 
                         type="checkbox" 
                         className="w-5 h-5 rounded-lg border-white/20 bg-white/10 text-indigo-500 focus:ring-indigo-500 cursor-pointer transition-all"
                         checked={(selectedIds || []).includes(emp.id)}
                         onChange={() => toggleSelect(emp.id)}
                       />
                     )}
                     <div className="w-12 h-12 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center font-bold text-xl shadow-md">
                        {(emp.name || 'M').charAt(0)}
                     </div>
                     <div>
                        <h4 className="text-lg font-bold tracking-tight">{emp.name || 'موظف غير معروف'}</h4>
                        <div className="flex items-center gap-2">
                           <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                             {(designations || []).find(d => d && d.id === emp.designationId)?.name || emp.position || 'بدون مسمى'}
                           </p>
                           {emp.fingerprintId && (
                             <span className="bg-white/10 text-amber-500 px-2 py-0.5 rounded text-[9px] font-black border border-white/5">
                               ID: {emp.fingerprintId}
                             </span>
                           )}
                           <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                           <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                             {(departments || []).find(d => d && d.id === emp.departmentId)?.name || 'بدون قسم'}
                           </p>
                        </div>
                     </div>
                  </div>
                     <div className="flex gap-1 relative z-10">
                        <button onClick={() => setSelectedEmployeeId(emp.id)} className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-all" title="التفاصيل والملفات"><ClipboardList size={16}/></button>
                        <button onClick={() => { 
  setEditingId(emp.id); 
  setFormData({ 
    ...emp, 
    basicSalary: (emp.basicSalary || 0).toString(), 
    commissionRate: (emp.commissionRate || 0).toString(),
    fingerprintId: emp.fingerprintId || '',
    shiftId: emp.shiftId || '',
    departmentId: emp.departmentId || '',
    designationId: emp.designationId || '',
    leaveBalance: (emp.leaveBalance || 21).toString()
  }); 
  setShowAdd(true); 
}} className="p-2 text-slate-400 hover:text-amber-400 hover:bg-white/5 rounded-lg transition-all"><Edit2 size={16}/></button>
                     {currentUser?.role === 'ADMIN' && (
                       <button onClick={() => deleteEmployee(emp.id)} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-all"><Trash2 size={16}/></button>
                     )}
                  </div>
               </div>
               <div className="p-6 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">الراتب الأساسي</p>
                     <p className="text-lg font-bold text-slate-900">{isHidden ? '****' : formatCurrency(emp.basicSalary || 0)}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-center">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">النسبة</p>
                     <p className="text-lg font-bold text-emerald-600">{emp.commissionRate || 0}%</p>
                  </div>
                  <div className="bg-indigo-50 bg-opacity-50 p-4 rounded-2xl border border-indigo-100 border-opacity-50">
                     <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">الأرباح المُحققة</p>
                     <p className="text-lg font-bold text-indigo-900">{isHidden ? '****' : formatCurrency(stats.totalProfit || 0)}</p>
                  </div>
                  <div className="bg-emerald-50 bg-opacity-50 p-4 rounded-2xl border border-emerald-100 border-opacity-50">
                     <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">العمولات</p>
                     <p className="text-lg font-bold text-emerald-700">{isHidden ? '****' : formatCurrency(stats.commission || 0)}</p>
                  </div>
                  <div className="bg-rose-50 bg-opacity-50 p-4 rounded-2xl border border-rose-100 border-opacity-50">
                     <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">السلف القائمة</p>
                     <p className="text-lg font-bold text-rose-600">{isHidden ? '****' : formatCurrency(stats.advances || 0)}</p>
                  </div>
                  <div className="bg-amber-50 bg-opacity-50 p-4 rounded-2xl border border-amber-100 border-opacity-50">
                     <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">خصومات البصمة</p>
                     <p className="text-lg font-bold text-amber-700">{isHidden ? '****' : formatCurrency(stats.attendanceDeductions || 0)}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 p-5 rounded-3xl border border-slate-200 mt-2 flex flex-col gap-4">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="p-2 bg-amber-500 bg-opacity-10 rounded-lg">
                              <DollarSign className="text-amber-600" size={20} />
                           </div>
                           <span className="font-bold text-slate-900">صافي المستحق</span>
                        </div>
                        <span className="text-2xl font-bold text-amber-600 tabular-nums">{isHidden ? '****' : formatCurrency(stats.totalPayable || 0)}</span>
                     </div>
                     <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-200">
                        <p className="text-[9px] text-slate-400 font-bold leading-relaxed">الصافي = (الراتب + العمولات) - (السلف + خصومات البصمة)</p>
                        <button 
                          onClick={() => handlePaySalary(emp.id)}
                          className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 text-xs shadow-sm active:scale-95"
                        >
                          <Wallet size={14}/> صرف المستحقات
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          );
        })}
      </div>
      

      {selectedEmployeeId && selectedEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="p-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-500 text-slate-900 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg">
                  {(selectedEmp.name || 'M').charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold tracking-tight">{selectedEmp.name || 'موظف غير معروف'}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                      {(designations || []).find(d => d && d.id === selectedEmp.designationId)?.name || selectedEmp.position || 'بدون مسمى'}
                    </span>
                    <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                      {(departments || []).find(d => d && d.id === selectedEmp.departmentId)?.name || 'بدون قسم'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedEmployeeId(null)} className="p-3 bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 rounded-2xl transition-all">
                <X size={24} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex bg-slate-50 p-2 gap-2 shrink-0 border-b border-slate-200">
              <button 
                onClick={() => setActiveTab('INFO')}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'INFO' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <UserCheck size={18} /> نظرة عامة
              </button>
              <button 
                onClick={() => setActiveTab('FINANCE')}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'FINANCE' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <DollarSign size={18} /> الرواتب والبدلات
              </button>
              <button 
                onClick={() => setActiveTab('LEAVES')}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'LEAVES' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <Calendar size={18} /> الإجازات
              </button>
              <button 
                onClick={() => setActiveTab('DOCS')}
                className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 transition-all ${activeTab === 'DOCS' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <FileText size={18} /> المستندات
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              {activeTab === 'INFO' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">بيانات الاتصال</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                          <Activity size={16} />
                        </div>
                        <span className="font-bold text-slate-900">{selectedEmp.phone || 'غير متوفر'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                          <Calendar size={16} />
                        </div>
                        <span className="font-bold text-slate-900">{selectedEmp.joiningDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">نظام العمل</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                          <Clock size={16} />
                        </div>
                        <span className="font-bold text-slate-900">
                          {(shifts || []).find(s => s && s.id === selectedEmp?.shiftId)?.name || 'لم يحدد'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                          <Fingerprint size={16} />
                        </div>
                        <span className="font-bold text-slate-900">ID: {selectedEmp?.fingerprintId || 'لا يوجد'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">الهيكل التنظيمي</p>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                          <Building2 size={16} />
                        </div>
                        <span className="font-bold text-slate-900">
                          {(departments || []).find(d => d && d.id === selectedEmp.departmentId)?.name || 'بدون قسم'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                          <Award size={16} />
                        </div>
                        <span className="font-bold text-slate-900">
                          {(designations || []).find(d => d && d.id === selectedEmp.designationId)?.name || selectedEmp.position || 'بدون مسمى'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">إحصائيات الإجازات</p>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">الرصيد الكلي:</span>
                          <span className="text-lg font-bold text-slate-900">{selectedEmp.leaveBalance || 21} يوم</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-sm font-bold text-slate-500">المستخدم:</span>
                          <span className="text-lg font-bold text-rose-600">
                            {(leaves || []).filter(l => l && l.employeeId === selectedEmp.id && l.status === 'APPROVED').length} أيام
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'FINANCE' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                      <Award className="text-indigo-600" /> البدلات والمكافآت الشهرية
                    </h4>
                    <button 
                      onClick={() => setShowAllowanceForm(true)}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                      <Plus size={18} /> إضافة بدل
                    </button>
                  </div>

                  {showAllowanceForm && (
                    <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-300">
                      <form onSubmit={handleAllowanceSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">اسم البدل</label>
                          <input name="name" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm" placeholder="مثال: بدل سكن" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">المبلغ / النسبة</label>
                          <input name="amount" type="number" step="0.01" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-center" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">النوع</label>
                          <select name="type" className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm">
                            <option value="FIXED">مبلغ ثابت</option>
                            <option value="PERCENTAGE">نسبة من الأساسي</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">التكرار</label>
                          <select name="isMonthly" className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm">
                            <option value="true">شهري مستمر</option>
                            <option value="false">مرة واحدة فقط</option>
                          </select>
                        </div>
                        <div className="md:col-span-4 flex justify-end gap-3 mt-4">
                          <button type="button" onClick={() => setShowAllowanceForm(false)} className="px-6 py-2 text-slate-400 font-bold text-sm">إلغاء</button>
                          <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold text-sm">حفظ البدل</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">البدل</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">القيمة</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">النوع</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">الحالة</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(allowances || []).filter(a => a && a.employeeId === selectedEmp.id).map(allow => (
                          <tr key={allow.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-bold text-slate-900">{allow.name}</td>
                            <td className="px-6 py-4 font-bold text-indigo-600 tabular-nums">
                              {allow.type === 'FIXED' ? formatCurrency(allow.amount) : `${allow.amount}%`}
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                              {allow.type === 'FIXED' ? 'مبلغ ثابت' : 'نسبة مئوية'}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${allow.isMonthly ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                {allow.isMonthly ? 'مستمر' : 'مؤقت'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button onClick={() => setAllowances(prev => (prev || []).filter(a => a && a.id !== allow.id))} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {(allowances || []).filter(a => a && a.employeeId === selectedEmp.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">لا توجد بدلات مسجلة</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'LEAVES' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                      <ClipboardList className="text-indigo-600" /> سجل الإجازات
                    </h4>
                    <button 
                      onClick={() => setShowLeaveForm(true)}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                      <Plus size={18} /> طلب إجازة
                    </button>
                  </div>

                  {showLeaveForm && (
                    <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-300">
                      <form onSubmit={handleLeaveSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">نوع الإجازة</label>
                          <select name="type" className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm">
                            <option value="ANNUAL">سنوية</option>
                            <option value="SICK">مرضية</option>
                            <option value="UNPAID">بدون راتب</option>
                            <option value="OTHER">أخرى</option>
                          </select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">من تاريخ</label>
                          <input name="startDate" type="date" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">إلى تاريخ</label>
                          <input name="endDate" type="date" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm" />
                        </div>
                        <div className="md:col-span-3 flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">السبب</label>
                          <textarea name="reason" rows={2} className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm" />
                        </div>
                        <div className="md:col-span-3 flex justify-end gap-3 mt-4">
                          <button type="button" onClick={() => setShowLeaveForm(false)} className="px-6 py-2 text-slate-400 font-bold text-sm">إلغاء</button>
                          <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold text-sm">إرسال الطلب</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-slate-900 text-white">
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">النوع</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">الفترة</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">الأيام</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">الحالة</th>
                          <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-indigo-300">إجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {(leaves || []).filter(l => l && l.employeeId === selectedEmp.id).map(leave => {
                          const diff = Math.ceil((new Date(leave.endDate || Date.now()).getTime() - new Date(leave.startDate || Date.now()).getTime()) / (1000 * 60 * 60 * 24)) + 1;
                          return (
                            <tr key={leave.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-slate-900">
                                {leave.type === 'ANNUAL' ? 'سنوية' : leave.type === 'SICK' ? 'مرضية' : 'بدون راتب'}
                              </td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-500 tabular-nums">
                                {leave.startDate} ↔ {leave.endDate}
                              </td>
                              <td className="px-6 py-4 font-bold text-indigo-600">{diff} يوم</td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  {leave.status === 'PENDING' && (
                                    <div className="flex gap-2">
                                      <button onClick={() => setLeaves(prev => (prev || []).map(l => l && l.id === leave.id ? {...l, status: 'APPROVED'} : l))} className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-500 hover:text-white transition-all"><UserCheck size={14}/></button>
                                      <button onClick={() => setLeaves(prev => (prev || []).map(l => l && l.id === leave.id ? {...l, status: 'REJECTED'} : l))} className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-500 hover:text-white transition-all"><X size={14}/></button>
                                    </div>
                                  )}
                                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${leave.status === 'APPROVED' ? 'bg-indigo-50 text-indigo-600' : leave.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
                                    {leave.status === 'PENDING' ? 'قيد الانتظار' : leave.status === 'APPROVED' ? 'تمت الموافقة' : 'مرفوض'}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <button onClick={() => setLeaves(prev => (prev || []).filter(l => l && l.id !== leave.id))} className="p-2 text-slate-300 hover:text-rose-500 rounded-lg transition-all">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                        {(leaves || []).filter(l => l && l.employeeId === selectedEmp.id).length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">لا توجد سجلات إجازات</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activeTab === 'DOCS' && (
                <div className="space-y-8">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-bold text-slate-900 flex items-center gap-3">
                      <Shield className="text-indigo-600" /> أرشيف المستندات
                    </h4>
                    <button 
                      onClick={() => setShowDocForm(true)}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                      <Plus size={18} /> إضافة مستند
                    </button>
                  </div>

                  {showDocForm && (
                    <div className="bg-white p-6 rounded-3xl border border-indigo-200 shadow-sm mb-6 animate-in slide-in-from-top-4 duration-300">
                      <form onSubmit={handleDocSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">اسم المستند</label>
                          <input name="name" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm" placeholder="مثال: جواز السفر" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">النوع</label>
                          <input name="type" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm" placeholder="ID, Passport, Contract" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">تاريخ الانتهاء</label>
                          <input name="expiryDate" type="date" className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm" />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">رابط/مسار الملف</label>
                          <input name="filePath" className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-left ltr" placeholder="C:\Users\..." />
                        </div>
                        <div className="lg:col-span-4 flex justify-end gap-3 mt-4">
                          <button type="button" onClick={() => setShowDocForm(false)} className="px-6 py-2 text-slate-400 font-bold text-sm">إلغاء</button>
                          <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold text-sm">حفظ المستند</button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(documents || []).filter(d => d && d.employeeId === selectedEmp.id).map(doc => (
                      <div key={doc.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm relative group overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-12 h-12 bg-slate-900 text-indigo-400 rounded-xl flex items-center justify-center shadow-md">
                            <HardDrive size={24} />
                          </div>
                          <button onClick={() => setDocuments(prev => (prev || []).filter(d => d && d.id !== doc.id))} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <h5 className="font-bold text-slate-900 text-lg mb-1">{doc.name}</h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{doc.type}</p>
                        
                        {doc.expiryDate && (
                          <div className="flex items-center gap-2 mb-4 p-2 bg-slate-50 rounded-lg">
                            <Calendar size={14} className="text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-600 italic">ينتهي في: {doc.expiryDate}</span>
                          </div>
                        )}
                        
                        <button 
                          onClick={() => doc.filePath && window.open(`file:///${doc.filePath}`)}
                          className="w-full bg-slate-50 text-indigo-600 py-2 rounded-xl font-bold text-sm hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 flex items-center justify-center gap-2"
                        >
                          <FileText size={16} /> فتح المستند
                        </button>
                      </div>
                    ))}
                    {(documents || []).filter(d => d && d.employeeId === selectedEmp.id).length === 0 && (
                      <div className="lg:col-span-3 py-12 text-center text-slate-400 font-bold italic">لا توجد مستندات مؤرشفة</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
               <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  نظام نِـبـراس ERP - إصدار v3.0.1 (قيد المزامنة السحابية)
               </div>
               <button 
                 onClick={() => window.print()}
                 className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-lg active:scale-95"
               >
                 <FileText size={20} /> تصدير التقرير PDF
               </button>
            </div>
          </div>
        </div>
      )}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 no-print animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
                  <DollarSign size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">صرف مستحقات الموظف</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                    {(employees || []).find(e => e.id === paymentFormData.employeeId)?.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="text-slate-400 hover:text-rose-500 transition-all p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={submitPayment} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Options */}
                <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">بنود الصرف</h4>
                  
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={paymentFormData.paySalary}
                      onChange={(e) => setPaymentFormData({...paymentFormData, paySalary: e.target.checked})}
                    />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">صرف الراتب والبدلات</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      checked={paymentFormData.payCommission}
                      onChange={(e) => setPaymentFormData({...paymentFormData, payCommission: e.target.checked})}
                    />
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">صرف العمولات المستحقة</span>
                  </label>
                </div>

                {/* Date and Treasury */}
                <div className="space-y-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">تاريخ الصرف</label>
                    <input 
                      type="date" 
                      required 
                      className="p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm shadow-sm"
                      value={paymentFormData.date}
                      onChange={(e) => setPaymentFormData({...paymentFormData, date: e.target.value})}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">الصرف من</label>
                    <select 
                      className="p-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm shadow-sm"
                      value={paymentFormData.treasuryId}
                      onChange={(e) => setPaymentFormData({...paymentFormData, treasuryId: e.target.value})}
                      required
                    >
                      {(treasuries || []).map(t => (
                        <option key={t?.id} value={t?.id}>
                          {t?.type === 'CUSTODY' ? '📦 ' : t?.type === 'BANK' ? '🏦 ' : '💰 '}
                          {t?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white space-y-4 shadow-xl">
                <div className="flex justify-between items-center pb-4 border-b border-slate-800">
                  <span className="text-slate-400 font-bold">إجمالي الراتب (النسبي):</span>
                  <span className={`font-bold ${!paymentFormData.paySalary ? 'line-through text-slate-600' : 'text-white'}`}>
                    {formatCurrency(paymentFormData.salaryAmount)}
                  </span>
                </div>
                {paymentFormData.paySalary && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-emerald-400">+ البدلات الشهرية:</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(paymentFormData.allowances)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-rose-400">- خصم السلف:</span>
                      <span className="font-bold text-rose-400">{formatCurrency(paymentFormData.advances)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-rose-400">- خصم البصمة:</span>
                      <span className="font-bold text-rose-400">{formatCurrency(paymentFormData.deductions)}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center pt-4 border-t border-slate-800">
                  <span className="text-slate-400 font-bold">العمولات المستحقة:</span>
                  <span className={`font-bold ${!paymentFormData.payCommission ? 'line-through text-slate-600' : 'text-white'}`}>
                    {formatCurrency(paymentFormData.commissionAmount)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center pt-6 mt-4 border-t-2 border-indigo-500/30">
                  <span className="text-lg font-bold text-indigo-400 uppercase tracking-widest">الصافي للدفع</span>
                  <span className="text-3xl font-black text-white">
                    {formatCurrency(
                      (paymentFormData.paySalary ? (paymentFormData.salaryAmount + paymentFormData.allowances - paymentFormData.advances - paymentFormData.deductions) : 0) +
                      (paymentFormData.payCommission ? paymentFormData.commissionAmount : 0)
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowPaymentModal(false)}
                  className="px-8 py-3 text-slate-400 font-bold text-sm hover:text-rose-600 transition-colors"
                >
                  إلغاء العملية
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-12 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 active:scale-95"
                >
                  تأكيد وصرف المستحقات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeView;
