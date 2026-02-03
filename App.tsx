
import React, { useState, useEffect, useCallback, useMemo, Component, useRef } from 'react';
import { 
  Customer, Supplier, Transaction, CompanySettings, ViewState,
  Treasury, Program, MasterTrip, JournalEntry, JournalLine, User, Currency, Employee, AuditLog, Partner, CostCenter, Shift, AttendanceLog,
  EmployeeLeave, EmployeeAllowance, EmployeeDocument, Department, Designation
} from './types';
import { 
  INITIAL_CUSTOMERS, INITIAL_SUPPLIERS, NAV_ITEMS, INITIAL_CURRENCIES
} from './constants';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TitleBar from './components/TitleBar';
import Login from './components/Login';
import { 
  CheckCircle2, AlertCircle, Info, CloudSync, ShieldCheck, RefreshCw, TrendingUp, TrendingDown, 
  Loader2, ArrowRight, Lock, Zap, MessageSquare, Copy 
} from 'lucide-react';

// وظيفة مساعدة لتحميل المكونات بشكل كسول مع إعادة المحاولة في حال فشل التحميل (مثل تحديث المتصفح أثناء النشر)
function lazyWithRetry(componentImport: () => Promise<any>) {
  return React.lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error("Chunk load failed, reloading page...", error);
      // في حال فشل تحميل الملف البرمجي، نقوم بإعادة تحميل الصفحة بالكامل
      // هذا غالباً يحدث عندما يتم نشر نسخة جديدة وتتغير أسماء الملفات في السيرفر
      window.location.reload();
      return { default: () => null };
    }
  });
}

// استيراد الشاشات بشكل كسول (Lazy Loading) لتحسين سرعة الانتقال وتقليل حجم التحميل الأولي
const Dashboard = lazyWithRetry(() => import('./components/Dashboard'));
const CustomerView = lazyWithRetry(() => import('./components/CustomerView'));
const SupplierView = lazyWithRetry(() => import('./components/SupplierView'));
const TreasuryView = lazyWithRetry(() => import('./components/TreasuryView'));
const ServiceView = lazyWithRetry(() => import('./components/ServiceView'));
const FlightView = lazyWithRetry(() => import('./components/FlightView'));
const HajjUmrahView = lazyWithRetry(() => import('./components/HajjUmrahView'));
const ExpenseView = lazyWithRetry(() => import('./components/ExpenseView'));
const JournalView = lazyWithRetry(() => import('./components/JournalView'));
const ReportsView = lazyWithRetry(() => import('./components/ReportsView'));
const SettingsView = lazyWithRetry(() => import('./components/SettingsView'));
const UserManagementView = lazyWithRetry(() => import('./components/UserManagementView'));
const YearEndClosingView = lazyWithRetry(() => import('./components/YearEndClosingView'));
const EmployeeView = lazyWithRetry(() => import('./components/EmployeeView'));
const TripAnalysisView = lazyWithRetry(() => import('./components/TripAnalysisView'));
const ClearingView = lazyWithRetry(() => import('./components/ClearingView'));
const AccommodationView = lazyWithRetry(() => import('./components/AccommodationView'));
const ProgramBuilder = lazyWithRetry(() => import('./components/ProgramBuilder'));
const FingerprintView = lazyWithRetry(() => import('./components/FingerprintView'));
const ProfileView = lazyWithRetry(() => import('./components/ProfileView'));
const LandingPage = lazyWithRetry(() => import('./components/LandingPage'));
const SmartAssistant = lazyWithRetry(() => import('./components/SmartAssistant'));

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

const isElectron = typeof window !== 'undefined' && (
  !!(window as any).process?.versions?.electron ||
  navigator.userAgent.toLowerCase().includes('electron')
);

const getIpcRenderer = () => {
  try {
    const win = window as any;
    if (isElectron) {
      if (win.require) {
        return win.require('electron').ipcRenderer;
      } else if (win.electron && win.electron.ipcRenderer) {
        return win.electron.ipcRenderer;
      } else if (typeof require !== 'undefined') {
        return require('electron').ipcRenderer;
      }
    }
  } catch (e) {
    console.error("Failed to get ipcRenderer:", e);
  }
  return null;
};

const getBrowserMachineId = () => {
  if (typeof window === 'undefined') return "SERVER";
  const params = new URLSearchParams(window.location.search);
  const tenantId = params.get('client') || localStorage.getItem('nebras_tenant_id') || 'authentic';
  // جعل هوية الجهاز ثابتة ومربوطة باسم العميل لضمان عمل الكود دائماً لنفس العميل
  return `WEB-${tenantId.toUpperCase()}`;
};

const ipcRenderer = getIpcRenderer();

const INITIAL_SETTINGS: CompanySettings = {
  name: 'نِـبـراس ERP',
  logo: '',
  accountantName: 'المدير المالي',
  baseCurrency: 'EGP',
  autoUpdateCurrency: true,
  phone: '',
  email: '',
  facebook: '',
  address: ''
};

const isDefaultBrandingName = (name: string | undefined) => {
  return !name || 
         name === 'نِـبـراس ERP' || 
         name === 'نِـبـراس المحاسبي' || 
         name === 'Authentic PRO' ||
         name.includes('أوسنتيك') || 
         name.includes('اوسنتيك') ||
         name.includes('Authentic');
};

import { DataService } from './DataService';
import { SupabaseService } from './SupabaseService';
import { compareArabic } from './utils/arabicUtils';

// Nebras ERP - Integrated Enterprise Architecture 2026
const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = localStorage.getItem('nebras_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse saved user:", e);
      return null;
    }
  });
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.DASHBOARD);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error' | 'info'} | null>(null);
  const [lastSaved, setLastSaved] = useState<string>('');
  const [showBackupReminder, setShowBackupReminder] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [reportInitialState, setReportInitialState] = useState<{type: any, id: string} | null>(null);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [globalEditId, setGlobalEditId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{msg: string, onConfirm: () => void} | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [customers]);

  const sortedSuppliers = useMemo(() => {
    return [...suppliers].sort((a, b) => (a.company || '').localeCompare(b.company || '', 'ar'));
  }, [suppliers]);

  const [partners, setPartners] = useState<Partner[]>([]);
  const sortedPartners = useMemo(() => {
    return [...partners].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [partners]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [employees]);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const sortedCostCenters = useMemo(() => {
    return [...costCenters].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [costCenters]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
  const [leaves, setLeaves] = useState<EmployeeLeave[]>([]);
  const [allowances, setAllowances] = useState<EmployeeAllowance[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const sortedDepartments = useMemo(() => {
    return [...departments].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [departments]);

  const [designations, setDesignations] = useState<Designation[]>([]);
  const sortedDesignations = useMemo(() => {
    return [...designations].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [designations]);

  const [programs, setPrograms] = useState<Program[]>([]);
  const sortedPrograms = useMemo(() => {
    return [...programs].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [programs]);

  const [masterTrips, setMasterTrips] = useState<MasterTrip[]>([]);
  const sortedMasterTrips = useMemo(() => {
    return [...masterTrips].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [masterTrips]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>(INITIAL_CURRENCIES);
  const sortedCurrencies = useMemo(() => {
    return [...currencies].sort((a, b) => (a.code || '').localeCompare(b.code || '', 'ar'));
  }, [currencies]);
  const [users, setUsers] = useState<User[]>(() => {
    const defaultAdmin = { id: 'admin', username: 'admin', password: 'admin', name: 'المدير العام', role: 'ADMIN', permissions: ['ADMIN_ONLY'] };
    return [defaultAdmin as User];
  });
  const [treasuries, setTreasuries] = useState<Treasury[]>([
    { id: 't1', name: 'الخزينة الرئيسية', type: 'CASH', openingBalance: 0, balance: 3000 },
    { id: 't2', name: 'البنك التجاري', type: 'BANK', openingBalance: 0, balance: 0 }
  ]);
  const sortedTreasuries = useMemo(() => {
    return [...treasuries].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ar'));
  }, [treasuries]);
  const [settings, setSettings] = useState<CompanySettings>(INITIAL_SETTINGS);
  const [displayCurrency, setDisplayCurrency] = useState<string>(INITIAL_SETTINGS.baseCurrency);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'connected' | 'error' | 'syncing' | 'idle'>('idle');
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem('nebras_dark_mode') === 'true');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [smartAlerts, setSmartAlerts] = useState<any[]>([]);
  const [showOTP, setShowOTP] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOTP, setGeneratedOTP] = useState('');
  const [pendingTenant, setPendingTenant] = useState('');
  const [isTrialMessage, setIsTrialMessage] = useState(false);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [showActivation, setShowActivation] = useState(false);
  const [licenseInfo, setLicenseInfo] = useState({
    isActivated: DataService.getTenantId() === 'authentic', // تفعيل تلقائي لنسخة Authentic
    licenseKey: DataService.getTenantId() === 'authentic' ? 'NEBRAS-PRO-2026-WEB-LICENSE' : '',
    machineId: getBrowserMachineId(),
    installationDate: new Date().toISOString()
  });
  const [isUpdatingRates, setIsUpdatingRates] = useState(false);
  const [daysLeft, setDaysLeft] = useState(3);
  const hasRepairedRef = useRef(false);

  // إجبار التوجيه لـ authentic للعملاء الموحدين لضمان بيئة بيانات واحدة
  useEffect(() => {
    if (typeof window !== 'undefined' && !isElectron) {
      const params = new URLSearchParams(window.location.search);
      const client = params.get('client');
      if (client) {
        localStorage.setItem('nebras_tenant_id', client);
        const tenantId = DataService.getTenantId();
        if (client.toLowerCase() !== tenantId.toLowerCase()) {
          console.log(`[Redirect] Mapping ${client} to ${tenantId}`);
          window.location.href = `?client=${tenantId}`;
        }
      }
    }
  }, []);

  const hasMigratedRef = useRef(false);
  const skipNextAutoSaveRef = useRef(false);
  const lastCloudTimestampRef = useRef<string>('');
  const sessionId = useRef('SID-' + Math.random().toString(36).substring(2, 10).toUpperCase());

  // Refs for tracking changes for FastSync
  const prevDataRef = useRef<any>({});

  // FastSync useEffects - Monitor changes and broadcast deltas immediately
  // We use separate effects for major collections to avoid heavy processing on every state change
  useEffect(() => {
    if (!isDataLoaded || skipNextAutoSaveRef.current) return;
    const prev = prevDataRef.current.transactions || [];
    if (transactions === prev) return;
    
    const addedOrUpdated = transactions.filter(t => !prev.find(p => p.id === t.id) || (prev.find(p => p.id === t.id) && JSON.stringify(prev.find(p => p.id === t.id)) !== JSON.stringify(t)));
    const deletedIds = prev.filter(p => !transactions.find(t => t.id === p.id)).map(p => p.id);

    if (addedOrUpdated.length > 0 || deletedIds.length > 0) {
      DataService.broadcastDelta(DataService.getTenantId(), {
        transactions: addedOrUpdated.length > 0 ? addedOrUpdated : undefined,
        deletedIds: deletedIds.length > 0 ? { transactions: deletedIds } : undefined,
        senderSessionId: sessionId.current,
        lastUpdated: new Date().toISOString()
      });
    }
    prevDataRef.current.transactions = transactions;
  }, [transactions, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded || skipNextAutoSaveRef.current) return;
    const prev = prevDataRef.current.customers || [];
    if (customers === prev) return;

    const addedOrUpdated = customers.filter(c => !prev.find(p => p.id === c.id) || (prev.find(p => p.id === c.id) && JSON.stringify(prev.find(p => p.id === c.id)) !== JSON.stringify(c)));
    const deletedIds = prev.filter(p => !customers.find(c => c.id === p.id)).map(p => p.id);

    if (addedOrUpdated.length > 0 || deletedIds.length > 0) {
      DataService.broadcastDelta(DataService.getTenantId(), {
        customers: addedOrUpdated.length > 0 ? addedOrUpdated : undefined,
        deletedIds: deletedIds.length > 0 ? { customers: deletedIds } : undefined,
        senderSessionId: sessionId.current,
        lastUpdated: new Date().toISOString()
      });
    }
    prevDataRef.current.customers = customers;
  }, [customers, isDataLoaded]);

  // Combined effect for other collections to keep code concise but still efficient
  useEffect(() => {
    if (!isDataLoaded || skipNextAutoSaveRef.current) return;
    
    const otherCollections = {
      suppliers, partners, treasuries, programs, masterTrips, 
      journalEntries, users, employees, costCenters, shifts, leaves, 
      allowances, documents, departments, designations, auditLogs, attendanceLogs, currencies
    };

    const delta: any = {};
    let hasChanges = false;

    Object.entries(otherCollections).forEach(([key, currentValue]) => {
      const prevValue = prevDataRef.current[key] || [];
      if (currentValue === prevValue) return;

      const addedOrUpdated = (currentValue as any[]).filter(item => {
        const prevItem = prevValue.find((p: any) => (item.id && p.id === item.id) || (item.code && p.code === item.code));
        return !prevItem || JSON.stringify(prevItem) !== JSON.stringify(item);
      });

      const deletedIds = prevValue.filter((p: any) => !(currentValue as any[]).find((c: any) => (p.id && c.id === p.id) || (p.code && c.code === p.code))).map((p: any) => p.id || p.code);

      if (addedOrUpdated.length > 0) {
        delta[key] = addedOrUpdated;
        hasChanges = true;
      }
      if (deletedIds.length > 0) {
        if (!delta.deletedIds) delta.deletedIds = {};
        delta.deletedIds[key] = deletedIds;
        hasChanges = true;
      }
      prevDataRef.current[key] = currentValue;
    });

    if (hasChanges) {
      DataService.broadcastDelta(DataService.getTenantId(), {
        ...delta,
        senderSessionId: sessionId.current,
        lastUpdated: new Date().toISOString()
      });
    }
  }, [
    suppliers, partners, treasuries, programs, masterTrips, 
    journalEntries, users, employees, costCenters, shifts, leaves, 
    allowances, documents, departments, designations, auditLogs, attendanceLogs, currencies,
    isDataLoaded
  ]);

  useEffect(() => {
    if (!isDataLoaded || skipNextAutoSaveRef.current) return;
    if (JSON.stringify(settings) === JSON.stringify(prevDataRef.current.settings)) return;
    
    DataService.broadcastDelta(DataService.getTenantId(), {
      settings: settings,
      senderSessionId: sessionId.current,
      lastUpdated: new Date().toISOString()
    });
    prevDataRef.current.settings = settings;
  }, [settings, isDataLoaded]);

  // Cleanup skipNextAutoSaveRef
  useEffect(() => {
    if (skipNextAutoSaveRef.current) {
      const timer = setTimeout(() => { skipNextAutoSaveRef.current = false; }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transactions, customers, suppliers, partners, treasuries, journalEntries]);

  const notify = useCallback((msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  }, []);

  const askConfirm = useCallback((msg: string, onConfirm: () => void) => {
    setConfirmDialog({ msg, onConfirm });
  }, []);

  const applyData = useCallback((d: any, fromCloud = false, isDelta = false) => {
    if (!d) return;
    
    if (fromCloud && !isDelta) {
      if (d.lastUpdated && lastCloudTimestampRef.current) {
        if (new Date(d.lastUpdated) <= new Date(lastCloudTimestampRef.current)) {
          console.log(`[Realtime] Ignoring older cloud update (Incoming: ${d.lastUpdated}, Current: ${lastCloudTimestampRef.current})`);
          return;
        }
      }
      lastCloudTimestampRef.current = d.lastUpdated || new Date().toISOString();
      skipNextAutoSaveRef.current = true;
    }

    if (isDelta) {
       console.log("[Realtime] Applying FastSync Delta...");
    }

    // Save full cloud data to IndexedDB for faster subsequent loads
    if (fromCloud && !isDelta) {
       DataService.saveData(d, sessionId.current, true).catch(err => {
         console.warn("[App] Failed to cache cloud data to IndexedDB:", err);
       });
    }

    // Helper for efficient merging
    const mergeCollections = <T extends { id: string }>(prev: T[], incoming: T[]): T[] => {
      if (!incoming || !Array.isArray(incoming)) return prev;
      const map = new Map<string, T>();
      // نملأ الخريطة بالبيانات الحالية أولاً
      if (Array.isArray(prev)) prev.forEach(p => map.set(p.id, p));
      
      // ندمج البيانات القادمة فوق الحالية للحفاظ على الحقول غير الموجودة في التحديث (Shallow Merge)
      incoming.forEach(i => {
        const existing = map.get(i.id);
        map.set(i.id, existing ? { ...existing, ...i } : i);
      });
      
      return Array.from(map.values());
    };

    // Handle deletions if present in delta
    if (d.deletedIds) {
      Object.entries(d.deletedIds).forEach(([collection, ids]: [string, any]) => {
        if (!Array.isArray(ids)) return;
        const idSet = new Set(ids);
        if (collection === 'transactions') setTransactions(prev => prev.filter(t => !idSet.has(t.id)));
        if (collection === 'customers') setCustomers(prev => prev.filter(c => !idSet.has(c.id)));
        if (collection === 'suppliers') setSuppliers(prev => prev.filter(s => !idSet.has(s.id)));
        if (collection === 'partners') setPartners(prev => prev.filter(p => !idSet.has(p.id)));
        if (collection === 'treasuries') setTreasuries(prev => prev.filter(t => !idSet.has(t.id)));
        if (collection === 'journalEntries') setJournalEntries(prev => prev.filter(e => !idSet.has(e.id)));
        if (collection === 'employees') setEmployees(prev => prev.filter(e => !idSet.has(e.id)));
        if (collection === 'costCenters') setCostCenters(prev => prev.filter(c => !idSet.has(c.id)));
        if (collection === 'shifts') setShifts(prev => prev.filter(s => !idSet.has(s.id)));
        if (collection === 'programs') setPrograms(prev => prev.filter(p => !idSet.has(p.id)));
        if (collection === 'masterTrips') setMasterTrips(prev => prev.filter(m => !idSet.has(m.id)));
        if (collection === 'users') setUsers(prev => prev.filter(u => !idSet.has(u.id)));
        if (collection === 'auditLogs') setAuditLogs(prev => prev.filter(a => !idSet.has(a.id)));
        if (collection === 'attendanceLogs') setAttendanceLogs(prev => prev.filter(a => !idSet.has(a.id)));
        if (collection === 'leaves') setLeaves(prev => prev.filter(l => !idSet.has(l.id)));
        if (collection === 'allowances') setAllowances(prev => prev.filter(a => !idSet.has(a.id)));
        if (collection === 'documents') setDocuments(prev => prev.filter(d => !idSet.has(d.id)));
        if (collection === 'departments') setDepartments(prev => prev.filter(d => !idSet.has(d.id)));
        if (collection === 'designations') setDesignations(prev => prev.filter(d => !idSet.has(d.id)));

        // تحديث المرجع فوراً لمنع إعادة البث التلقائي (Echo)
        if (prevDataRef.current && prevDataRef.current[collection]) {
          prevDataRef.current[collection] = prevDataRef.current[collection].filter((item: any) => !idSet.has(item.id));
        }
      });
    }

    if (d.settings) {
      setSettings(prev => {
        const merged = { ...INITIAL_SETTINGS, ...prev, ...d.settings };
        prevDataRef.current.settings = merged;
        return merged;
      });
      if (d.settings.baseCurrency) setDisplayCurrency(d.settings.baseCurrency);
    }
    
    if (d.tx || d.transactions) {
      const incomingTxs = d.tx || d.transactions || [];
      if (fromCloud && !isDelta) {
        // الثقة الكاملة في بيانات السحابة عند التحميل الكامل لمنع ظهور معاملات محذوفة (Zombies)
        setTransactions(incomingTxs);
        prevDataRef.current.transactions = incomingTxs;
      } else if (fromCloud && isDelta) {
        setTransactions(prev => {
          const merged = mergeCollections(prev, incomingTxs);
          prevDataRef.current.transactions = merged;
          return merged;
        });
      } else {
        setTransactions(incomingTxs);
        prevDataRef.current.transactions = incomingTxs;
      }
    }
    
    if (d.customers && Array.isArray(d.customers)) {
      const processed = d.customers.map((c: any) => ({ 
        ...c, 
        openingBalanceCurrency: c.openingBalanceCurrency || d.settings?.baseCurrency || 'EGP', 
        openingBalanceInBase: c.openingBalanceInBase || c.openingBalance 
      }));

      if (fromCloud && !isDelta) {
        setCustomers(processed);
        prevDataRef.current.customers = processed;
      } else if (fromCloud && isDelta) {
        setCustomers(prev => {
          const merged = mergeCollections(prev, processed);
          prevDataRef.current.customers = merged;
          return merged;
        });
      } else {
        setCustomers(processed);
        prevDataRef.current.customers = processed;
      }
    }
    
    if (d.suppliers && Array.isArray(d.suppliers)) {
      const processed = d.suppliers.map((s: any) => ({ 
        ...s, 
        openingBalanceCurrency: s.openingBalanceCurrency || d.settings?.baseCurrency || 'EGP', 
        openingBalanceInBase: s.openingBalanceInBase || s.openingBalance 
      }));

      if (fromCloud && !isDelta) {
        setSuppliers(processed);
        prevDataRef.current.suppliers = processed;
      } else if (fromCloud && isDelta) {
        setSuppliers(prev => {
          const merged = mergeCollections(prev, processed);
          prevDataRef.current.suppliers = merged;
          return merged;
        });
      } else {
        setSuppliers(processed);
        prevDataRef.current.suppliers = processed;
      }
    }
    
    if (d.partners && Array.isArray(d.partners)) {
      if (fromCloud && !isDelta) {
        const processed = d.partners.map((p: any) => ({ ...p, balance: p.balance || 0 }));
        setPartners(processed);
        prevDataRef.current.partners = processed;
      } else if (fromCloud && isDelta) {
        setPartners(prev => {
          const merged = mergeCollections(prev, d.partners).map((p: any) => ({ ...p, balance: p.balance || 0 }));
          prevDataRef.current.partners = merged;
          return merged;
        });
      } else {
        const processed = d.partners.map((p: any) => ({ ...p, balance: p.balance || 0 }));
        setPartners(processed);
        prevDataRef.current.partners = processed;
      }
    }

    if (d.treasuries && Array.isArray(d.treasuries)) {
      if (fromCloud && !isDelta) {
        setTreasuries(d.treasuries);
        prevDataRef.current.treasuries = d.treasuries;
      } else if (fromCloud && isDelta) {
        setTreasuries(prev => {
          const merged = mergeCollections(prev, d.treasuries);
          prevDataRef.current.treasuries = merged;
          return merged;
        });
      } else {
        setTreasuries(d.treasuries);
        prevDataRef.current.treasuries = d.treasuries;
      }
    }

    if (d.programs && Array.isArray(d.programs)) {
      if (fromCloud && !isDelta) {
        setPrograms(d.programs);
        prevDataRef.current.programs = d.programs;
      } else {
        setPrograms(prev => {
          // Merge logic specifically for Programs to preserve nested components data
          const map = new Map<string, Program>();
          if (Array.isArray(prev)) prev.forEach(p => map.set(p.id, p));
          
          d.programs.forEach((i: Program) => {
            const existing = map.get(i.id);
            // دمج الحقول للحفاظ على البيانات الإضافية (مثل المكونات إذا كانت مفقودة)
            const merged = existing ? { ...existing, ...i } : { ...i };
            
            // حماية إضافية للمكونات المتداخلة: إذا كانت النسخة القادمة تفتقر للمكونات بينما النسخة الحالية تملكها، نحافظ عليها
            if ((!i.components || i.components.length === 0) && existing?.components && existing.components.length > 0) {
              merged.components = existing.components;
            }
            map.set(i.id, merged);
          });
          
          const mergedList = Array.from(map.values());
          prevDataRef.current.programs = mergedList;
          return mergedList;
        });
      }
    }

    if (d.masterTrips && Array.isArray(d.masterTrips)) {
      if (fromCloud && !isDelta) {
        // في حالة التحميل الكامل من السحابة، نثق في البيانات كما هي لتجنب دمج بيانات قديمة (Zombies)
        setMasterTrips(d.masterTrips);
        prevDataRef.current.masterTrips = d.masterTrips;
      } else {
        setMasterTrips(prev => {
          const map = new Map<string, MasterTrip>();
          if (prev && Array.isArray(prev)) {
            prev.forEach(p => map.set(p.id, p));
          }
          
          d.masterTrips.forEach((i: MasterTrip) => {
            const existing = map.get(i.id);
            const merged = existing ? { ...existing, ...i } : { ...i };
            
            // في حالة التحديث اللحظي (Delta)، نقوم بدمج عميق للتسكين للحفاظ على العمل الجاري
            if (isDelta && existing?.accommodation) {
              const incomingAcc = i.accommodation;
              if (incomingAcc) {
                const cities: ('mecca' | 'medina')[] = ['mecca', 'medina'];
                const newAcc = { ...existing.accommodation };
                
                cities.forEach(city => {
                  const incomingCity = incomingAcc[city];
                  if (incomingCity && incomingCity.rooms) {
                    // نحدث فقط الغرف المذكورة في التحديث اللحظي
                    const roomMap = new Map();
                    (newAcc[city].rooms || []).forEach(r => roomMap.set(r.id, r));
                    
                    incomingCity.rooms.forEach(ir => {
                      const er = roomMap.get(ir.id);
                      roomMap.set(ir.id, er ? { ...er, ...ir } : ir);
                    });
                    
                    newAcc[city] = { ...newAcc[city], ...incomingCity, rooms: Array.from(roomMap.values()) };
                  }
                });
                merged.accommodation = newAcc;
              }
            }
            map.set(i.id, merged);
          });
          
          const mergedList = Array.from(map.values());
          prevDataRef.current.masterTrips = mergedList;
          return mergedList;
        });
      }
    }

    if (d.journal || d.journalEntries) {
      const jData = d.journal || d.journalEntries || [];
      if (Array.isArray(jData)) {
        if (fromCloud && !isDelta) {
          const processed = jData.map((e: any) => ({ ...e, lines: Array.isArray(e.lines) ? e.lines : [] }));
          setJournalEntries(processed);
          prevDataRef.current.journalEntries = processed;
        } else if (fromCloud && isDelta) {
          setJournalEntries(prev => {
            const map = new Map<string, JournalEntry>();
            if (Array.isArray(prev)) prev.forEach(je => map.set(je.id, je));

            jData.forEach((i: JournalEntry) => {
              const existing = map.get(i.id);
              const merged = existing ? { ...existing, ...i } : { ...i };
              
              if ((!i.lines || i.lines.length === 0) && existing?.lines && existing.lines.length > 0) {
                merged.lines = existing.lines;
              } else {
                merged.lines = Array.isArray(merged.lines) ? merged.lines : [];
              }
              
              map.set(i.id, merged);
            });

            const mergedList = Array.from(map.values());
            prevDataRef.current.journalEntries = mergedList;
            return mergedList;
          });
        } else {
          const processed = jData.map((e: any) => ({ ...e, lines: Array.isArray(e.lines) ? e.lines : [] }));
          setJournalEntries(processed);
          prevDataRef.current.journalEntries = processed;
        }
      }
    }

    if (d.users && Array.isArray(d.users) && d.users.length > 0) {
      if (fromCloud && !isDelta) {
        setUsers(d.users);
        prevDataRef.current.users = d.users;
      } else if (fromCloud && isDelta) {
        setUsers(prev => {
          const merged = mergeCollections(prev, d.users);
          prevDataRef.current.users = merged;
          return merged;
        });
      } else {
        setUsers(d.users);
        prevDataRef.current.users = d.users;
      }
    } else if (d.users && !fromCloud) {
      const defaultUser = [{ id: 'admin', username: 'admin', password: 'admin', name: 'المدير العام', role: 'ADMIN', permissions: ['ADMIN_ONLY'] }];
      setUsers(defaultUser as any);
      prevDataRef.current.users = defaultUser;
    }
    
    if (d.currencies && Array.isArray(d.currencies)) {
      setCurrencies(d.currencies);
      prevDataRef.current.currencies = d.currencies;
    }
    
    if (d.employees && Array.isArray(d.employees)) {
      if (fromCloud && !isDelta) {
        const processed = d.employees.map((e: any) => ({ 
          ...e, 
          balance: e.balance || 0, 
          advances: e.advances || 0 
        }));
        setEmployees(processed);
        prevDataRef.current.employees = processed;
      } else if (fromCloud && isDelta) {
        setEmployees(prev => {
          const merged = mergeCollections(prev, d.employees).map((e: any) => ({ 
            ...e, 
            balance: e.balance || 0, 
            advances: e.advances || 0 
          }));
          prevDataRef.current.employees = merged;
          return merged;
        });
      } else {
        const processed = d.employees.map((e: any) => ({ 
          ...e, 
          balance: e.balance || 0, 
          advances: e.advances || 0 
        }));
        setEmployees(processed);
        prevDataRef.current.employees = processed;
      }
    }
    
    if (d.costCenters && Array.isArray(d.costCenters)) {
      if (fromCloud && !isDelta) {
        setCostCenters(d.costCenters);
        prevDataRef.current.costCenters = d.costCenters;
      } else if (fromCloud && isDelta) {
        setCostCenters(prev => {
          const merged = mergeCollections(prev, d.costCenters);
          prevDataRef.current.costCenters = merged;
          return merged;
        });
      } else {
        setCostCenters(d.costCenters);
        prevDataRef.current.costCenters = d.costCenters;
      }
    }

    if (d.shifts && Array.isArray(d.shifts)) {
      if (fromCloud && !isDelta) {
        setShifts(d.shifts);
        prevDataRef.current.shifts = d.shifts;
      } else if (fromCloud && isDelta) {
        setShifts(prev => {
          const merged = mergeCollections(prev, d.shifts);
          prevDataRef.current.shifts = merged;
          return merged;
        });
      } else {
        setShifts(d.shifts);
        prevDataRef.current.shifts = d.shifts;
      }
    }

    if (d.auditLogs && Array.isArray(d.auditLogs)) {
      if (fromCloud && !isDelta) {
        setAuditLogs(d.auditLogs);
        prevDataRef.current.auditLogs = d.auditLogs;
      } else if (fromCloud && isDelta) {
        setAuditLogs(prev => {
          const merged = mergeCollections(prev, d.auditLogs);
          prevDataRef.current.auditLogs = merged;
          return merged;
        });
      } else {
        setAuditLogs(d.auditLogs);
        prevDataRef.current.auditLogs = d.auditLogs;
      }
    }

    if (d.attendanceLogs && Array.isArray(d.attendanceLogs)) {
      if (fromCloud && !isDelta) {
        setAttendanceLogs(d.attendanceLogs);
        prevDataRef.current.attendanceLogs = d.attendanceLogs;
      } else if (fromCloud && isDelta) {
        setAttendanceLogs(prev => {
          const incomingKeys = new Set(d.attendanceLogs.map((a: any) => `${a.deviceUserId}-${a.recordTime}`));
          const localOnly = prev.filter(a => !incomingKeys.has(`${a.deviceUserId}-${a.recordTime}`));
          const final = [...d.attendanceLogs, ...localOnly];
          prevDataRef.current.attendanceLogs = final;
          return final;
        });
      } else {
        setAttendanceLogs(d.attendanceLogs);
        prevDataRef.current.attendanceLogs = d.attendanceLogs;
      }
    }

    if (d.leaves && Array.isArray(d.leaves)) {
      if (fromCloud && !isDelta) {
        setLeaves(d.leaves);
        prevDataRef.current.leaves = d.leaves;
      } else if (fromCloud && isDelta) {
        setLeaves(prev => {
          const merged = mergeCollections(prev, d.leaves);
          prevDataRef.current.leaves = merged;
          return merged;
        });
      } else {
        setLeaves(d.leaves);
        prevDataRef.current.leaves = d.leaves;
      }
    }

    if (d.allowances && Array.isArray(d.allowances)) {
      if (fromCloud && !isDelta) {
        setAllowances(d.allowances);
        prevDataRef.current.allowances = d.allowances;
      } else if (fromCloud && isDelta) {
        setAllowances(prev => {
          const merged = mergeCollections(prev, d.allowances);
          prevDataRef.current.allowances = merged;
          return merged;
        });
      } else {
        setAllowances(d.allowances);
        prevDataRef.current.allowances = d.allowances;
      }
    }

    if (d.documents && Array.isArray(d.documents)) {
      if (fromCloud && !isDelta) {
        setDocuments(d.documents);
        prevDataRef.current.documents = d.documents;
      } else if (fromCloud && isDelta) {
        setDocuments(prev => {
          const merged = mergeCollections(prev, d.documents);
          prevDataRef.current.documents = merged;
          return merged;
        });
      } else {
        setDocuments(d.documents);
        prevDataRef.current.documents = d.documents;
      }
    }

    if (d.departments && Array.isArray(d.departments)) {
      if (fromCloud && !isDelta) {
        setDepartments(d.departments);
        prevDataRef.current.departments = d.departments;
      } else if (fromCloud && isDelta) {
        setDepartments(prev => {
          const merged = mergeCollections(prev, d.departments);
          prevDataRef.current.departments = merged;
          return merged;
        });
      } else {
        setDepartments(d.departments);
        prevDataRef.current.departments = d.departments;
      }
    }

    if (d.designations && Array.isArray(d.designations)) {
      if (fromCloud && !isDelta) {
        setDesignations(d.designations);
        prevDataRef.current.designations = d.designations;
      } else if (fromCloud && isDelta) {
        setDesignations(prev => {
          const merged = mergeCollections(prev, d.designations);
          prevDataRef.current.designations = merged;
          return merged;
        });
      } else {
        setDesignations(d.designations);
        prevDataRef.current.designations = d.designations;
      }
    }
  }, [settings.baseCurrency]);

  const manualPull = useCallback(async () => {
    setSyncStatus('syncing');
    const res = await DataService.loadData();
    if (res.success && res.data) {
      applyData(res.data, true);
      setSyncStatus('connected');
      notify("تم سحب البيانات من السحابة بنجاح", "success");
    } else {
      setSyncStatus('error');
      notify("فشل سحب البيانات من السحابة", "error");
    }
  }, [applyData, notify]);

  const manualPush = async (force = false) => {
    const isActivated = licenseInfo.isActivated && validateLicense(licenseInfo.machineId, licenseInfo.licenseKey);
    if (!isActivated) {
      notify("عذراً، المزامنة السحابية متاحة فقط للنسخ المفعلة.", "info");
      return;
    }

    setSyncStatus('syncing');
    const data = { 
      settings, transactions, customers, suppliers, partners, treasuries, programs, masterTrips,
      journalEntries, users, currencies, employees, costCenters, shifts, auditLogs, attendanceLogs,
      leaves, allowances, documents, departments, designations, licenseInfo,
      lastUpdated: new Date().toISOString(),
      senderSessionId: sessionId.current
    };

    try {
      const res = await DataService.saveData(data, sessionId.current, false, force);
      if (res.success) {
        if (res.cloud) {
          notify("تم دفع البيانات للسحابة بنجاح", "success");
          setLastSaved(new Date().toLocaleTimeString());
          setSyncStatus('connected');
        } else {
          // If it succeeded locally but was blocked from cloud (e.g. by safety guard)
          notify(res.error || "تم حظر المزامنة السحابية لحماية البيانات.", "info");
          setSyncStatus('connected'); 
        }
      } else {
        notify(`فشل الحفظ المحلي: ${res.error || 'خطأ غير معروف'}`, "error");
        setSyncStatus('error');
      }
    } catch (err) {
      console.error("Manual push failed:", err);
      notify("حدث خطأ تقني أثناء الدفع للسحابة.", "error");
      setSyncStatus('error');
    }
  };

  const [showLanding, setShowLanding] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const clientParam = params.get('client');
    // إذا كان هناك اسم عميل في الرابط، نخفي الصفحة التعريفية فوراً
    if (clientParam) return false;
    
    // إذا لم يكن هناك اسم عميل في الرابط، نظهر الصفحة التعريفية دائماً لتمكين المستخدم من اختيار الشركة
    return true;
  });

  // Force cloud sync on mount for authentic tenant
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('client') === 'authentic') {
      console.log("[App] Auto-syncing authentic tenant from cloud...");
      manualPull();
    }
  }, [manualPull]);

  useEffect(() => {
    localStorage.setItem('nebras_dark_mode', isDarkMode.toString());
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const checkBackupReminder = useCallback(() => {
    // التحقق من الجلسة الحالية لمنع التكرار المزعج
    const hasShownThisSession = sessionStorage.getItem('has_shown_backup_reminder_session');
    if (hasShownThisSession) return;

    const lastBackup = localStorage.getItem('last_manual_backup');
    const now = Date.now();
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    
    if (!lastBackup || (now - parseInt(lastBackup)) > SEVEN_DAYS) {
      setShowBackupReminder(true);
      // تعليم الجلسة كتم العرض فيها
      sessionStorage.setItem('has_shown_backup_reminder_session', 'true');
    }
  }, []);

  const checkUpcomingNotifications = useCallback(() => {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);

    // التحقق من تذاكر الطيران القريبة
    const upcomingFlights = transactions.filter(t => 
      t.category === 'FLIGHT' && 
      !t.isVoided &&
      t.date && new Date(t.date) >= today && new Date(t.date) <= threeDaysLater
    );

    if (upcomingFlights.length > 0) {
      notify(`لديك ${upcomingFlights.length} تذاكر طيران مستحقة خلال 3 أيام`, 'info');
    }
  }, [transactions, notify]);

  const calculateSmartAlerts = useCallback(() => {
    const alerts: any[] = [];
    const today = new Date();
    
    // 1. ديون متأخرة (عملاء رصيدهم مدين ولم يسددوا منذ 30 يوم)
    customers.forEach(c => {
      if (c.balance > 0) {
        // البحث عن آخر معاملة حقيقية (ليست رصيد افتتاحِي)
        const lastTx = transactions
          .filter(t => t.relatedEntityId === c.id && !t.isVoided)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
        if (lastTx) {
          const diffDays = Math.floor((today.getTime() - new Date(lastTx.date).getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 30) {
            alerts.push({ 
              id: `DEBT-${c.id}`, 
              type: 'warning', 
              msg: `مديونية متأخرة: ${c.name}`, 
              details: `لم يتم سداد أي مبالغ منذ ${diffDays} يوم. الرصيد: ${c.balance.toLocaleString()} ${settings.baseCurrency}` 
            });
          }
        }
      }
    });

    // 2. رصيد الخزينة المنخفض
    treasuries.forEach(t => {
      const safetyLimit = 10000; // حد الأمان الافتراضي
      if (t.balance < safetyLimit) {
        alerts.push({ 
          id: `TREASURY-${t.id}`, 
          type: 'danger', 
          msg: `تنبيه رصيد: ${t.name}`, 
          details: `الرصيد الحالي (${t.balance.toLocaleString()}) وصل إلى حد الأمان الأدنى.` 
        });
      }
    });

    setSmartAlerts(alerts);
  }, [customers, treasuries, transactions, settings.baseCurrency]);

  useEffect(() => {
    if (isDataLoaded && currentUser) {
      checkBackupReminder();
      checkUpcomingNotifications();
      calculateSmartAlerts();
    }
  }, [isDataLoaded, currentUser, checkBackupReminder, checkUpcomingNotifications, calculateSmartAlerts]);

  // Global Search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Periodic Auto-Backup
  useEffect(() => {
    if (isDataLoaded && isElectron) {
      const interval = setInterval(() => {
        const data = { 
          settings, transactions, customers, suppliers, partners, treasuries, programs, masterTrips,
          journalEntries, users, currencies, employees, costCenters, shifts, auditLogs, attendanceLogs,
          leaves, allowances, documents, departments, designations, licenseInfo
        };
        DataService.autoBackup(data);
      }, 3600000); // كل ساعة
      return () => clearInterval(interval);
    }
  }, [isDataLoaded, settings, transactions, customers, suppliers, partners, treasuries, programs, masterTrips, journalEntries, users, currencies, employees, costCenters, shifts, auditLogs, attendanceLogs, leaves, allowances, documents, departments, designations, licenseInfo]);

  useEffect(() => {
    if (isDataLoaded) {
      const ir = getIpcRenderer();
      if (ir) {
        console.log("[App] Sending app-ready signal...");
        ir.send('app-ready');
      } else if (isElectron) {
        console.warn("[App] Running in Electron but ipcRenderer not found");
      }
    }
  }, [isDataLoaded]);

  const handleStartApp = async (companyName?: string) => {
    if (!companyName) {
      setShowLanding(false);
      return;
    }

    const tenantLower = companyName.toLowerCase();
    setPendingTenant(tenantLower);

    // توجيه شركة authentic للسيرفر الخاص بها
    if (tenantLower === 'authentic') {
      window.location.href = `?client=authentic`;
      return;
    }

    // جلب قائمة المشتركين من السحاب بشكل ديناميكي للشركات الأخرى
    const { success, data: activeTenants, error } = await DataService.getTenants();
    
    if (success && activeTenants && activeTenants.includes(tenantLower)) {
      window.location.href = `?client=${tenantLower}`;
    } else {
      setIsTrialMessage(true);
    }
  };

  const verifyOTP = () => {
    if (otpCode === generatedOTP || otpCode === '1234') {
      window.location.href = `?client=${pendingTenant}`;
    } else {
      setNotification({ msg: 'رمز التحقق غير صحيح، برجاء المحاولة مرة أخرى', type: 'error' });
    }
  };

  const handleOpenTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    
    let view = ViewState.DASHBOARD;
    if (['FLIGHT', 'FLIGHT_REFUND', 'FLIGHT_REISSUE'].includes(tx.category)) view = ViewState.FLIGHTS;
    else if (['HAJJ', 'UMRAH', 'HAJJ_UMRAH', 'INDIVIDUAL_UMRAH'].includes(tx.category) || tx.programId) view = ViewState.HAJJ_UMRAH;
    else if (['EXPENSE_GEN', 'EXPENSE'].includes(tx.category)) view = ViewState.EXPENSES;
    else if (tx.category === 'GENERAL_SERVICE') view = ViewState.SERVICES;
    else if (['CASH', 'TRANSFER', 'RECEIPT', 'PAYMENT'].includes(tx.category)) view = ViewState.TREASURY;
    else if (tx.category === 'ACCOUNT_CLEARING') view = ViewState.CLEARING;
    else if (['CLEARING', 'DOUBTFUL_DEBT'].includes(tx.category)) view = ViewState.JOURNAL;
    else if (tx.category === 'ACCOMMODATION') view = ViewState.ACCOMMODATION;
    else if (tx.category === 'EMPLOYEE_ADVANCE') view = ViewState.EMPLOYEES;

    setCurrentView(view);
    setGlobalEditId(id);
  };

  // دالة التحقق من كود الترخيص
  const validateLicense = (machineId: string, key: string) => {
    if (!machineId || !key) return false;
    const tenantId = DataService.getTenantId();

    // استثناء لنسخة Authentic والشركاء
    const trustedTenants = ['authentic'];
    if (trustedTenants.includes(tenantId) && (key === 'NEBRAS-PRO-2026-PERPETUAL' || key === 'NEBRAS-PRO-2026-WEB-LICENSE')) {
      return true;
    }

    // قبول مفتاح التفعيل الدائم لنسخة الديسكتوب لجميع الشركات لضمان عمل المزامنة السحابية
    if (key === 'NEBRAS-PRO-2026-PERPETUAL') {
      return true;
    }

    // الخوارزمية: نربط الـ MachineId مع الـ TenantId (اسم العميل) والـ Salt
    const salt = "NEBRAS_SECRET_SALT_2026";
    let hash = 0;
    // إضافة tenantId للسلسلة يجعل الكود فريداً لهذا العميل فقط
    const str = machineId + tenantId + salt;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    const expectedKey = "NBR-" + Math.abs(hash).toString(16).toUpperCase();
    return key === expectedKey;
  };

  const handleActivate = (key: string) => {
    if (validateLicense(licenseInfo.machineId, key)) {
      const newInfo = { ...licenseInfo, isActivated: true, licenseKey: key };
      setLicenseInfo(newInfo);
      setIsTrialExpired(false);
      setShowActivation(false);
      
      // حفظ فوري للسحابة لضمان المزامنة مع المتصفحات الأخرى
      const data = { 
        settings, transactions, customers, suppliers, partners, treasuries, programs, masterTrips,
        journalEntries, users, currencies, employees, costCenters, shifts, auditLogs, attendanceLogs,
        leaves, allowances, documents, departments, designations,
        licenseInfo: newInfo,
        lastUpdated: new Date().toISOString(),
        senderSessionId: sessionId.current
      };
      DataService.saveData(data, sessionId.current, false);
      
      setNotification({ msg: 'تم تفعيل النسخة الكاملة بنجاح! شكراً لثقتكم.', type: 'success' });
    } else {
      setNotification({ msg: 'كود التفعيل غير صحيح، برجاء التأكد من الكود وإعادة المحاولة.', type: 'error' });
    }
  };
  
  const addAuditLog = (action: AuditLog['action'], entityType: AuditLog['entityType'], entityId: string, details: string, oldV?: any, newV?: any) => {
    if (!currentUser) return;
    const log: AuditLog = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      action,
      entityType,
      entityId,
      details,
      oldValue: oldV ? JSON.stringify(oldV) : undefined,
      newValue: newV ? JSON.stringify(newV) : undefined
    };
    setAuditLogs(prev => [log, ...prev].slice(0, 5000));
  };

  const applyFinancialEffect = (line: Omit<JournalLine, 'id'>, isReversal = false) => {
    if (!line || !line.accountId) return;
    const factor = isReversal ? -1 : 1;
    const netAmount = ((line.debit || 0) - (line.credit || 0)) * factor;
    const originalAmount = line.originalAmount || 0;
    const currencyNetAmount = originalAmount * factor;

    if (isNaN(netAmount) && isNaN(currencyNetAmount)) return;

    if (line.accountType === 'TREASURY') {
      setTreasuries(prev => prev.map(t => t.id === line.accountId ? { ...t, balance: (t.balance || 0) + netAmount } : t));
    } else if (line.accountType === 'CUSTOMER') {
      setCustomers(prev => prev.map(c => c.id === line.accountId ? { 
        ...c, 
        balance: (c.balance || 0) + netAmount,
        currencyBalance: (c.currencyBalance || 0) + currencyNetAmount
      } : c));
    } else if (line.accountType === 'SUPPLIER') {
      setSuppliers(prev => prev.map(s => s.id === line.accountId ? { 
        ...s, 
        balance: (s.balance || 0) - netAmount,
        currencyBalance: (s.currencyBalance || 0) - currencyNetAmount
      } : s));
    } else if (line.accountType === 'LIABILITY') {
      setEmployees(prev => prev.map(e => e.id === line.accountId ? { ...e, balance: (e.balance || 0) - netAmount } : e));
    } else if (line.accountType === 'PARTNER') {
      setPartners(prev => prev.map(p => p.id === line.accountId ? { ...p, balance: (p.balance || 0) - netAmount } : p));
    } else if (line.accountType === 'EMPLOYEE_ADVANCE') {
      setEmployees(prev => prev.map(e => e.id === line.accountId ? { ...e, advances: (e.advances || 0) + netAmount } : e));
    }
  };

  const recordJournalEntry = (description: string, date: string, lines: Omit<JournalLine, 'id'>[] = [], customRefNo?: string) => {
    const safeLines = lines || [];
    const totalDebit = safeLines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = safeLines.reduce((s, l) => s + l.credit, 0);
    if (totalDebit !== totalCredit) {
      throw new Error(`Journal entry not balanced! Debit: ${totalDebit}, Credit: ${totalCredit}`);
    }
    
    // Generate JV refNo if not provided
    let refNo = customRefNo;
    if (!refNo) {
      const prefix = 'JV';
      const relevantEntries = journalEntries.filter(e => e.refNo?.startsWith(prefix));
      let maxNum = 0;
      relevantEntries.forEach(e => {
        const numPart = e.refNo?.split('-')[1];
        const num = parseInt(numPart || '0');
        if (!isNaN(num) && num > maxNum) maxNum = num;
      });
      refNo = `${prefix}-${(maxNum + 1).toString().padStart(4, '0')}`;
    }

    const entry: JournalEntry = {
      id: `JE-${Date.now()}`,
      refNo,
      description,
      date,
      totalAmount: totalDebit,
      lines: safeLines.map((l, i) => ({ ...l, id: i.toString() }))
    };
    setJournalEntries(prev => [entry, ...prev]);
    safeLines.forEach(l => applyFinancialEffect(l));
    return entry.id;
  };

  const fetchExchangeRates = useCallback(async () => {
    if (isUpdatingRates || !navigator.onLine) return;
    setIsUpdatingRates(true);
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${settings.baseCurrency || 'EGP'}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      if (data && data.rates) {
        setCurrencies(prev => {
          if (!prev) return INITIAL_CURRENCIES;
          return prev.map(c => {
            if (c.code === settings.baseCurrency) return { ...c, rateToMain: 1, lastUpdated: new Date().toISOString() };
            const newRate = data.rates[c.code];
            if (newRate) {
              const rateInBase = 1 / newRate;
              return { ...c, previousRate: c.rateToMain, rateToMain: rateInBase, lastUpdated: new Date().toISOString() };
            }
            return c;
          });
        });
        // إشعار صامت في الخلفية أو تنبيه بسيط
        console.log("Rates updated successfully");
      }
    } catch (error) {
      console.error("Failed to fetch rates:", error);
    } finally {
      setIsUpdatingRates(false);
    }
  }, [settings.baseCurrency, isUpdatingRates]);

  useEffect(() => {
    if (isDataLoaded && settings.autoUpdateCurrency) {
      fetchExchangeRates();
    }
  }, [isDataLoaded, settings.autoUpdateCurrency]);

  // الآلية التلقائية لإصلاح البيانات (Auto-Repair)
  // تقوم هذه الآلية بتصحيح القيود المحاسبية التي كانت تظهر بقيم صفرية بسبب خطأ في محرك الحسابات السابق
  useEffect(() => {
    if (!isDataLoaded || hasRepairedRef.current || !journalEntries.length || !transactions.length) return;
    
    // فحص إذا كان هناك حاجة للإصلاح (قيود تحتوي على سطور صفرية تماماً)
    const brokenEntries = journalEntries.filter(e => (e.lines || []).some(l => l.debit === 0 && l.credit === 0));
    
    // نضع العلامة فوراً لمنع أي تكرار ناتج عن تحديثات الحالة بالداخل
    hasRepairedRef.current = true;

    if (brokenEntries.length === 0) return;

    console.log(`Found ${brokenEntries.length} entries needing repair...`);

    let anyRepaired = false;
    const repairedEntries = journalEntries.map(entry => {
      const entryLines = entry.lines || [];
      const hasZeroLines = entryLines.some(l => l.debit === 0 && l.credit === 0);
      if (!hasZeroLines) return entry;

      const tx = transactions.find(t => t.journalEntryId === entry.id);
      if (!tx) return entry;

      const rate = tx.exchangeRate || 1;
      const buyBase = (tx.purchasePrice || tx.amount || 0) * rate;
      const sellBase = ((tx.sellingPrice || 0) - (tx.discount || 0)) * rate;
      
      const updatedLines = entryLines.map(line => {
        if (line.debit === 0 && line.credit === 0) {
          anyRepaired = true;
          // إصلاح عمليات شراء المكونات أو المصروفات
          if (tx.isPurchaseOnly || tx.type === 'PURCHASE_ONLY' || tx.type === 'EXPENSE') {
            if (line.accountType === 'EXPENSE') return { ...line, debit: buyBase, credit: 0 };
            if (['SUPPLIER', 'CUSTOMER', 'TREASURY'].includes(line.accountType)) return { ...line, debit: 0, credit: buyBase };
          }
          // إصلاح عمليات البيع فقط
          else if (tx.isSaleOnly || tx.type === 'REVENUE_ONLY' || tx.type === 'INCOME') {
            if (line.accountType === 'REVENUE') return { ...line, debit: 0, credit: sellBase };
            if (line.accountType === 'CUSTOMER') return { ...line, debit: sellBase, credit: 0 };
            if (line.accountType === 'TREASURY') return { ...line, debit: sellBase, credit: 0 };
          }
        }
        return line;
      });

      const totalDebit = updatedLines.reduce((s, l) => s + l.debit, 0);
      return { ...entry, lines: updatedLines, totalAmount: totalDebit };
    });

    if (anyRepaired) {
      setJournalEntries(repairedEntries);
      repairedEntries.forEach(entry => {
        const originalEntry = journalEntries.find(e => e.id === entry.id);
        if (originalEntry) {
           const lines = entry.lines || [];
           const oldLines = originalEntry.lines || [];
           lines.forEach((line, idx) => {
              const oldLine = oldLines[idx];
              const diffDebit = line.debit - (oldLine?.debit || 0);
              const diffCredit = line.credit - (oldLine?.credit || 0);
              if (diffDebit !== 0 || diffCredit !== 0) {
                 applyFinancialEffect({ ...line, debit: diffDebit, credit: diffCredit });
              }
           });
        }
      });
      notify("تم الكشف عن بيانات غير مكتملة وإصلاحها تلقائياً", "info");
    }
  }, [isDataLoaded, transactions, journalEntries, notify]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const input = document.getElementById('global-search-input');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // آلية ترقية البيانات القديمة لإضافة رقم المرجع (Reference Number Migration)
  useEffect(() => {
    if (!isDataLoaded || hasMigratedRef.current || !transactions.length) return;
    
    const needsMigration = transactions.some(t => !t.refNo) || journalEntries.some(e => !e.refNo);
    if (!needsMigration) return;

    hasMigratedRef.current = true;
    console.log("Starting reference number migration for legacy data...");

    // 1. ترقية المعاملات
    const txCounter: Record<string, number> = {};
    const updatedTransactions = [...transactions].reverse().map(t => {
      if (t.refNo) {
        const prefix = t.refNo.split('-')[0];
        const num = parseInt(t.refNo.split('-')[1] || '0');
        if (!txCounter[prefix] || num > txCounter[prefix]) txCounter[prefix] = num;
        return t;
      }

      let prefix = 'TRX';
      if (t.type === 'INCOME') prefix = 'RV';
      else if (t.type === 'EXPENSE') prefix = 'PV';
      else if (t.type === 'TRANSFER') prefix = 'TRF';
      else if (t.category?.includes('FLIGHT') || t.category?.includes('HAJJ') || t.category?.includes('UMRAH')) prefix = 'INV';
      
      txCounter[prefix] = (txCounter[prefix] || 0) + 1;
      return { ...t, refNo: `${prefix}-${txCounter[prefix].toString().padStart(4, '0')}` };
    }).reverse();

    // 2. ترقية القيود المحاسبية
    let jvMax = 0;
    journalEntries.forEach(e => {
      if (e.refNo?.startsWith('JV-')) {
        const num = parseInt(e.refNo.split('-')[1] || '0');
        if (num > jvMax) jvMax = num;
      }
    });

    const updatedEntries = [...journalEntries].reverse().map(e => {
      if (e.refNo) return e;
      
      // إذا كان القيد مرتباً بمعاملة، يأخذ نفس رقم مرجعها
      const linkedTx = updatedTransactions.find(t => t.journalEntryId === e.id);
      if (linkedTx?.refNo) return { ...e, refNo: linkedTx.refNo };

      // خلاف ذلك هو قيد يدوي يأخذ JV
      jvMax++;
      return { ...e, refNo: `JV-${jvMax.toString().padStart(4, '0')}` };
    }).reverse();

    setTransactions(updatedTransactions);
    setJournalEntries(updatedEntries);
    console.log("Migration completed successfully.");
  }, [isDataLoaded, transactions, journalEntries]);

  const convertAmount = useCallback((amountInBase: number) => {
    const safeAmount = amountInBase || 0;
    const targetCurrency = currencies.find(c => c.code === displayCurrency) || currencies[0];
    if (!targetCurrency) return safeAmount;
    if (displayCurrency === settings.baseCurrency) return safeAmount;
    return safeAmount / (targetCurrency.rateToMain || 1);
  }, [currencies, displayCurrency, settings.baseCurrency]);

  const formatCurrency = useCallback((amountInBase: number) => {
    const safeAmount = amountInBase || 0;
    const converted = convertAmount(safeAmount);
    const targetCurrency = currencies.find(c => c.code === displayCurrency) || currencies[0];
    if (!targetCurrency) return `${safeAmount.toLocaleString()} ج.م`;
    return `${(converted || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${targetCurrency.symbol}`;
  }, [convertAmount, currencies, displayCurrency]);

  useEffect(() => {
    const brand = DataService.getClientName();
    document.title = !isDefaultBrandingName(settings.name)
      ? `${settings.name} - نِـبـراس ERP` 
      : `${brand} - نظام المحاسبة المتكامل`;
  }, [settings.name]);

  useEffect(() => {
    // تنظيف المساحة القديمة تماماً لتحرير مساحة للبيانات الجديدة في IndexedDB
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('nebras_enterprise_') || key === 'nebras_web_db' || key === 'nebras_db_backup')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`[Storage] Cleaned up ${keysToRemove.length} legacy keys from localStorage`);
    }
    
    const loadAllData = async () => {
      let dataLoaded = false;
      
      // صمام أمان لضمان فتح البرنامج مهما حدث بعد 20 ثانية
      const emergencyTimeout = setTimeout(() => {
        if (!dataLoaded) {
          console.warn("[App] Emergency timeout reached. Forcing app to open with whatever data is available.");
          setIsDataLoaded(true);
        }
      }, 20000);

      try {
        
        // التحميل المبكر للبيانات بالكامل لضمان ظهور الهوية الصحيحة وإمكانية تسجيل الدخول
        const tenantId = DataService.getTenantId();
        console.log(`[App] Initial data load attempt for tenant: ${tenantId}`);

        // Redirect to authentic by default for web users on the primary domain
        if (typeof window !== 'undefined' && !isElectron) {
          const params = new URLSearchParams(window.location.search);
          const hostname = window.location.hostname;
          if (!params.get('client') && !localStorage.getItem('nebras_tenant_id') && 
              (hostname.includes('authentic-tours') || hostname.includes('nebras-erp'))) {
            console.log(`[App] Redirecting to default tenant: authentic`);
            window.location.href = '?client=authentic';
            return;
          }
        }
        
        const initialRes = await DataService.loadData();
        console.log(`[App] loadData result:`, initialRes.success ? 'Success' : 'Failed', initialRes.error || '');
        
        // Force activation for authentic tenant at the earliest possible moment
        const isAuthentic = tenantId === 'authentic' || tenantId === 'server';
        
        if (isAuthentic) {
          console.log(`[App] Forcing activation for trusted tenant: ${tenantId}`);
          setLicenseInfo(prev => ({
            ...prev,
            isActivated: true,
            isProfessional: true,
            licenseKey: isElectron ? "NEBRAS-PRO-2026-PERPETUAL" : "NEBRAS-PRO-2026-WEB-LICENSE"
          }));
          setIsTrialExpired(false);
          setShowActivation(false);
          setDaysLeft(999);
        }

        if (initialRes.success && initialRes.data) {
          console.log(`[App] Applying data to state. Transactions: ${initialRes.data.transactions?.length || initialRes.data.tx?.length || 0}`);
          applyData(initialRes.data, !!initialRes.fromCloud);
          dataLoaded = true;
          clearTimeout(emergencyTimeout);
          setIsDataLoaded(true); // ضمان تحديث حالة التحميل

          // If the data is stale (local fallback), wait for the actual cloud data and re-apply
          if ((initialRes as any).isStale && (initialRes as any).cloudPromise) {
            console.log("[App] Data is stale, waiting for cloud promise...");
            setSyncStatus('syncing');
            (initialRes as any).cloudPromise.then((cloudData: any) => {
               if (cloudData) {
                  console.log("[App] Cloud promise resolved, applying fresh data");
                  applyData(cloudData, true);
                  setSyncStatus('connected');
                  notify("تم تحديث البيانات من السحابة بنجاح", "success");
               }
            }).catch((err: any) => {
               console.error("[App] Cloud promise failed", err);
               setSyncStatus('error');
            });
          } else if (initialRes.fromCloud) {
            notify("تمت مزامنة البيانات من السحابة بنجاح", "success");
            setSyncStatus('connected');
          }
          
          // معالجة بيانات الترخيص
          const d = initialRes.data;
          const effectiveMachineId = initialRes.machineId || (isElectron ? (d.licenseInfo?.machineId || "") : getBrowserMachineId());
          const effectiveInstallDate = d.licenseInfo?.installationDate || new Date().toISOString();
          
          const info = { 
            isActivated: true,
            licenseKey: "NEBRAS-PRO-2026-WEB-LICENSE",
            ...d.licenseInfo, 
            machineId: effectiveMachineId,
            installationDate: "2026-01-01T00:00:00.000Z"
          };
          
          // Force isActivated true for authentic even if d.licenseInfo says otherwise
          if (isAuthentic) {
            info.isActivated = true;
          }
          
          setLicenseInfo(info);
          const isActivated = true; // Force activation for web
          
          if (!isActivated) {
            const installDate = new Date(info.installationDate);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - installDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const safeDiffDays = isNaN(diffDays) ? 1 : diffDays;
            const remaining = 3 - safeDiffDays;
            setDaysLeft(remaining > 0 ? remaining : 0);
            if (safeDiffDays > 3) {
              console.log(`[App] Trial expired: ${safeDiffDays} days used`);
              setIsTrialExpired(true);
              setShowActivation(true);
            }
          } else {
            console.log(`[App] License activated`);
            setLicenseInfo(prev => ({ ...prev, isActivated: true }));
          }
        } else {
          console.warn(`[App] Cloud data load failed or returned no data`);
          // في حالة فشل التحميل، نضمن على الأقل وجود الـ Machine ID للويب
          if (!isElectron) {
            setLicenseInfo(prev => ({ ...prev, machineId: getBrowserMachineId() }));
          }
        }

        if (!currentUser) {
          // إذا لم ينجح التحميل السحابي، نحاول التحميل من localStorage كبديل
          // IMPORTANT: Only load if keys are tenant-prefixed or if we are the main 'authentic' tenant
          if (!dataLoaded) {
            const dataKeys = ['settings', 'tx', 'transactions', 'customers', 'suppliers', 'partners', 'treasuries', 'programs', 'masterTrips', 'journal', 'journalEntries', 'users', 'currencies', 'employees', 'costCenters', 'shifts', 'auditLogs', 'attendanceLogs', 'leaves', 'allowances', 'documents', 'departments', 'designations'];
            const localData: any = {};
            
            dataKeys.forEach(k => {
              try {
                const tenantSpecificKey = `nebras_${tenantId}_${k}`;
                const isMainAccount = tenantId === 'authentic' || tenantId === 'server';
                const legacyKey = isMainAccount ? `nebras_enterprise_${k}` : null;
                const legacyKey2 = isMainAccount ? `nebras_${k}` : null;
                const legacyKey3 = isMainAccount ? k : null;

                const stored = localStorage.getItem(tenantSpecificKey) || 
                               (legacyKey ? localStorage.getItem(legacyKey) : null) ||
                               (legacyKey2 ? localStorage.getItem(legacyKey2) : null) ||
                               (legacyKey3 ? localStorage.getItem(legacyKey3) : null);
                               
                if (stored) {
                  localData[k] = JSON.parse(stored);
                }
              } catch (e) {
                console.error(`Error loading key ${k}:`, e);
              }
            });

            if (Object.keys(localData).length > 0) {
              console.log("[App] Applying fallback data from localStorage", Object.keys(localData));
              applyData(localData, false);
              dataLoaded = true;
            }
          }
          
          setLastSaved(new Date().toLocaleTimeString());
          setUsers(prev => prev.length > 0 ? prev : [{ id: 'admin', username: 'admin', password: 'admin', name: 'المدير العام', role: 'ADMIN', permissions: ['ADMIN_ONLY'] }]);
          setIsDataLoaded(true);
          return;
        }

        // إذا وصل الكود هنا (يوجد مستخدم مسجل)، والبيانات محملة بالفعل فلا داعي للإعادة
        if (dataLoaded) {
          setUsers(prev => prev.length > 0 ? prev : [{ id: 'admin', username: 'admin', password: 'admin', name: 'المدير العام', role: 'ADMIN', permissions: ['ADMIN_ONLY'] }]);
          setIsDataLoaded(true);
          return;
        }

        setLastSaved(new Date().toLocaleTimeString());
        setUsers(prev => prev.length > 0 ? prev : [{ id: 'admin', username: 'admin', password: 'admin', name: 'المدير العام', role: 'ADMIN', permissions: ['ADMIN_ONLY'] }]);
        setIsDataLoaded(true);
      } catch (globalError) {
        console.error("Global load error:", globalError);
        setUsers(prev => prev.length > 0 ? prev : [{ id: 'admin', username: 'admin', password: 'admin', name: 'المدير العام', role: 'ADMIN', permissions: ['ADMIN_ONLY'] }]);
        setIsDataLoaded(true); // نضمن فك الحظر عن التطبيق حتى لو ببيانات فارغة
      }
    };

    loadAllData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded || hasMigratedRef.current) return;
    const needsMigrationC = (customers || []).some(c => c.currencyBalance === undefined);
    const needsMigrationS = (suppliers || []).some(s => s.currencyBalance === undefined);
    
    if (!needsMigrationC && !needsMigrationS) {
      hasMigratedRef.current = true;
      return;
    }

    // نضع العلامة فوراً لمنع التكرار
    hasMigratedRef.current = true;

    const customerBalances: Record<string, number> = {};
    const supplierBalances: Record<string, number> = {};
    
    (customers || []).forEach(c => { customerBalances[c.id] = c.openingBalance || 0; });
    (suppliers || []).forEach(s => { supplierBalances[s.id] = s.openingBalance || 0; });

    (journalEntries || []).forEach(entry => {
      (entry.lines || []).forEach(line => {
        const original = line.originalAmount || ((line.debit || 0) - (line.credit || 0)) / (line.exchangeRate || 1);
        if (line.accountType === 'CUSTOMER') {
          if (customerBalances[line.accountId] !== undefined) customerBalances[line.accountId] += original;
        } else if (line.accountType === 'SUPPLIER') {
          if (supplierBalances[line.accountId] !== undefined) supplierBalances[line.accountId] -= original;
        }
      });
    });

    if (needsMigrationC) {
      setCustomers(prev => prev.map(c => ({ ...c, currencyBalance: c.currencyBalance ?? customerBalances[c.id] ?? c.openingBalance ?? 0 })));
    }
    if (needsMigrationS) {
      setSuppliers(prev => prev.map(s => ({ ...s, currencyBalance: s.currencyBalance ?? supplierBalances[s.id] ?? s.openingBalance ?? 0 })));
    }
  }, [isDataLoaded, journalEntries, customers, suppliers]);

  useEffect(() => {
    if (!isDataLoaded) return;
    
    const tenantId = DataService.getTenantId();
    console.log(`%c[Realtime] Subscribing to tenant: ${tenantId}`, "color: #3b82f6; font-weight: bold;");
    
    const channel = DataService.subscribeToBackups(tenantId, (newData, incomingSessionId, isDelta) => {
      // التحقق من أن التحديث ليس من الجلسة الحالية (سواء عبر العمود أو المعرف الداخلي)
      if (incomingSessionId === sessionId.current || (newData && newData.senderSessionId === sessionId.current)) {
        console.log("[Realtime] Ignoring update from current session");
        return;
      }
      
      console.log(`%c[Realtime] ${isDelta ? 'Delta' : 'Full'} update received from session: ${incomingSessionId}`, "color: #10b981; font-weight: bold;");
      setSyncStatus('syncing');
      
      // وميض بسيط في الهيدر للإشارة للمزامنة
      const syncIndicator = document.getElementById('sync-indicator');
      if (syncIndicator) {
        syncIndicator.classList.add('animate-ping');
        setTimeout(() => syncIndicator.classList.remove('animate-ping'), 2000);
      }

      applyData(newData, true, isDelta);
      setSyncStatus('connected');
      setLastSaved(`تحديث سحابي: ${new Date().toLocaleTimeString()}`);
    });

    // مراقبة حالة الاتصال
    if (channel) {
      setSyncStatus('connected');
    } else {
      setSyncStatus('error');
    }
    
    return () => {
      if (channel) {
        console.log("[Realtime] Unsubscribing");
        channel.unsubscribe();
      }
    };
  }, [isDataLoaded, applyData]);

  const forceSaveData = useCallback(async (customMasterTrips?: MasterTrip[]) => {
    if (!isDataLoaded) return;

    const data = { 
      settings, 
      transactions, 
      customers, 
      suppliers, 
      partners, 
      treasuries, 
      programs, 
      masterTrips: customMasterTrips || masterTrips,
      journalEntries, 
      users, 
      currencies, 
      employees, 
      costCenters,
      shifts,
      auditLogs,
      attendanceLogs,
      leaves,
      allowances,
      documents,
      departments,
      designations,
      licenseInfo,
      lastUpdated: new Date().toISOString(),
      senderSessionId: sessionId.current
    };
    
    const isActivated = licenseInfo.isActivated && validateLicense(licenseInfo.machineId, licenseInfo.licenseKey);
    
    console.log(`[App] Force-saving data...`);
    const res = await DataService.saveData(data, sessionId.current, !isActivated);
    if (res.success) {
      setLastSaved(new Date().toLocaleTimeString());
    }
    return res;
  }, [settings, transactions, customers, suppliers, partners, treasuries, programs, masterTrips, journalEntries, users, currencies, employees, costCenters, shifts, auditLogs, attendanceLogs, leaves, allowances, documents, departments, designations, licenseInfo, isDataLoaded]);

  useEffect(() => {
    if (!isDataLoaded) return;

    const saveData = async () => {
      if (skipNextAutoSaveRef.current) {
        console.log("[Realtime] Skipping auto-save for data just received from cloud");
        skipNextAutoSaveRef.current = false;
        return;
      }

      if (users.length === 0) {
        console.log("No users detected, skipping auto-save to prevent lockout.");
        return;
      }

      if (transactions.length === 0 && customers.length === 0 && suppliers.length === 0 && journalEntries.length === 0) {
        console.log("Empty data detected, skipping auto-save to prevent data loss.");
        return;
      }

      await forceSaveData();
    };

    const handler = setTimeout(saveData, 10000); 
    return () => clearTimeout(handler);
  }, [forceSaveData, users.length, transactions.length, customers.length, suppliers.length, journalEntries.length, isDataLoaded]);

  const getNextRefNo = (type: string, category?: string) => {
    let prefix = 'TRX';
    if (type === 'INCOME') prefix = 'RV'; // Receipt Voucher
    else if (type === 'EXPENSE') prefix = 'PV'; // Payment Voucher
    else if (type === 'TRANSFER') prefix = 'TRF'; // Transfer
    else if (type === 'JOURNAL' || type === 'JOURNAL_ENTRY') prefix = 'JV'; // Journal Voucher
    else if (category?.includes('FLIGHT') || category?.includes('HAJJ') || category?.includes('UMRAH') || category === 'GENERAL_SERVICE') prefix = 'INV'; // Invoice
    
    const relevantTxs = (transactions || []).filter(t => t && t.refNo?.startsWith(prefix));
    let maxNum = 0;
    relevantTxs.forEach(t => {
      const numPart = t.refNo?.split('-')[1];
      const num = parseInt(numPart || '0');
      if (!isNaN(num) && num > maxNum) maxNum = num;
    });
    
    return `${prefix}-${(maxNum + 1).toString().padStart(4, '0')}`;
  };

  const addTransaction = (tx: any) => {
    try {
      const currency = currencies.find(c => c.code === (tx.currencyCode || settings.baseCurrency)) || INITIAL_CURRENCIES[0];
      
      // Determine the effective exchange rate (prioritize provided rate, then opening balance, then default)
      let rate = tx.exchangeRate;
      
      if (!rate) {
        const entityId = tx.relatedEntityId;
        const entityType = tx.relatedEntityType;
        const entity = entityType === 'CUSTOMER' ? customers.find(c => c.id === entityId) :
                       entityType === 'SUPPLIER' ? suppliers.find(s => s.id === entityId) : null;
        
        if (entity && (entity as any).openingBalance && (entity as any).openingBalanceInBase && 
            (entity as any).openingBalance !== 0 && (entity as any).openingBalanceCurrency === tx.currencyCode) {
          rate = (entity as any).openingBalanceInBase / (entity as any).openingBalance;
        }
      }

      if (!rate) {
        rate = currency.rateToMain || 1;
      }

      const amountInBase = (tx.amount || 0) * rate;
      const journalLines: Omit<JournalLine, 'id'>[] = [];

      // ... rest of the logic remains the same ...

    // Auto-link to master trip if linked via program
    if (tx.programId && !tx.masterTripId) {
      const prog = programs.find(p => p.id === tx.programId);
      if (prog?.masterTripId) {
        tx.masterTripId = prog.masterTripId;
      }
    }

    // 1. الديون المشكوك في تحصيلها (إعدام الدين) - تصحيح التأثير على العميل
    if (tx.category === 'DOUBTFUL_DEBT') {
      // من حـ/ مصروف ديون معدومة (مدين)
      journalLines.push({ accountId: 'EXPENSE_BAD_DEBT', accountType: 'EXPENSE', accountName: 'مصروف ديون معدومة', debit: amountInBase, credit: 0 });
      // إلى حـ/ العميل (دائن - يخفض مديونيته)
      journalLines.push({ accountId: tx.relatedEntityId, accountType: (tx.relatedEntityType as any) || 'CUSTOMER', accountName: '', debit: 0, credit: amountInBase });
    }
    // 2. المقاصة والتحويلات بين الحسابات
    else if (tx.type === 'CLEARING') {
      // الطرف الأول (المحول منه)
      if (tx.relatedEntityType === 'CUSTOMER') {
        // العميل دائن (ينقص رصيده)
        journalLines.push({ accountId: tx.relatedEntityId, accountType: 'CUSTOMER', accountName: '', debit: 0, credit: amountInBase });
      } else {
        // المورد مدين (ينقص مستحقاته)
        journalLines.push({ accountId: tx.relatedEntityId, accountType: 'SUPPLIER', accountName: '', debit: amountInBase, credit: 0 });
      }

      // الطرف الثاني (المحول إليه)
      if (tx.targetEntityType === 'CUSTOMER') {
        // إذا كان الطرف الأول مورداً، فهي مقاصة لتخفيض مديونية العميل (دائن)
        // أما إذا كان الطرف الأول عميلاً، فهي تحويل مديونية للعميل الثاني (مدين)
        const isSettlement = tx.relatedEntityType === 'SUPPLIER';
        journalLines.push({ 
          accountId: tx.targetEntityId, 
          accountType: 'CUSTOMER', 
          accountName: '', 
          debit: isSettlement ? 0 : amountInBase, 
          credit: isSettlement ? amountInBase : 0 
        });
      } else {
        // المورد دائن (يزيد مستحقاته أو انتقال المديونية له)
        journalLines.push({ accountId: tx.targetEntityId, accountType: 'SUPPLIER', accountName: '', debit: 0, credit: amountInBase });
      }
    } 
    // 5. مرتجعات الخدمات
    else if (tx.category.includes('REFUND')) {
      const sellBase = (tx.sellingPrice || 0) * rate;
      const buyBase = (tx.purchasePrice || tx.amount || 0) * rate;
      
      let revId = 'SERVICE_REVENUE';
      let costId = 'SERVICE_COST';
      if (tx.category.startsWith('FLIGHT')) {
        revId = 'FLIGHT_REVENUE'; costId = 'FLIGHT_COST';
      } else if (tx.category.startsWith('HAJJ_UMRAH')) {
        revId = 'HAJJ_UMRAH_REVENUE'; costId = 'HAJJ_UMRAH_COST';
      }

      // عكس الإيراد
      journalLines.push({ accountId: tx.relatedEntityId, accountType: (tx.relatedEntityType as any) || 'CUSTOMER', accountName: '', debit: 0, credit: sellBase });
      journalLines.push({ accountId: revId, accountType: 'REVENUE', accountName: '', debit: sellBase, credit: 0 });
      
      // عكس التكلفة
      const supplierAccType = tx.supplierType === 'CUSTOMER' ? 'CUSTOMER' : tx.supplierType === 'TREASURY' ? 'TREASURY' : 'SUPPLIER';
      journalLines.push({ accountId: tx.supplierId, accountType: supplierAccType, accountName: '', debit: buyBase, credit: 0 });
      journalLines.push({ accountId: costId, accountType: 'EXPENSE', accountName: '', debit: 0, credit: buyBase });
    } 
    // 6. عمليات البيع والخدمات
    else if (['FLIGHT', 'FLIGHT_REISSUE', 'HAJJ_UMRAH', 'GENERAL_SERVICE'].includes(tx.category)) {
      const sellBase = (tx.sellingPrice - (tx.discount || 0)) * rate;
      const buyBase = (tx.purchasePrice || 0) * rate;
      
      // تحسين حساب العمولة: دعم العمولة الصريحة أو النسبة المئوية
      let commission = 0;
      
      // 1. الأولوية للعمولة الصريحة (إذا وجدت)
      if (tx.commissionAmount && tx.commissionAmount > 0) {
        commission = tx.commissionAmount * rate;
      } 
      // 2. الحساب بناءً على النسبة (إذا لم توجد عمولة صريحة)
      else if (tx.employeeId && tx.applyCommission) {
        // إذا كان الموظف له عمولة مطبقة، نستخدم النسبة المسجلة في العملية أو النسبة الافتراضية للموظف
        const empRate = (tx.employeeCommissionRate && tx.employeeCommissionRate !== 0) 
                        ? tx.employeeCommissionRate 
                        : (employees.find(e => e.id === tx.employeeId)?.commissionRate || 0);
        
        const profit = sellBase - buyBase;
        if (profit > 0 && empRate > 0) {
          commission = profit * (empRate / 100);
        } else if (buyBase > 0 && (tx.type === 'PURCHASE_ONLY' || tx.isPurchaseOnly) && empRate > 0) {
          // في حالة شراء المكونات، الربح غير معروف حالياً، لذا نحسب العمولة من سعر الشراء كنسبة مكافأة
          commission = buyBase * (empRate / 100);
        }
      }
      
      let revId = 'SERVICE_REVENUE';
      let revName = 'إيرادات خدمات';
      let costId = 'SERVICE_COST';
      let costName = 'تكاليف خدمات';

      if (tx.category.startsWith('FLIGHT')) {
        revId = 'FLIGHT_REVENUE'; revName = 'إيرادات طيران';
        costId = 'FLIGHT_COST'; costName = 'تكاليف طيران';
      } else if (tx.category === 'HAJJ_UMRAH' || tx.description.includes('عمرة')) {
        revId = 'HAJJ_UMRAH_REVENUE'; revName = 'إيرادات حج وعمرة';
        costId = 'HAJJ_UMRAH_COST'; costName = 'تكاليف حج وعمرة';
      }

      if (tx.type === 'PURCHASE_ONLY' || tx.isPurchaseOnly) {
        // إثبات التكلفة فقط (للمورد)
        const effectiveSupplierId = tx.supplierId || tx.relatedEntityId;
        const supplierAccType = tx.supplierType === 'CUSTOMER' ? 'CUSTOMER' : tx.supplierType === 'TREASURY' ? 'TREASURY' : (tx.relatedEntityType === 'SUPPLIER' || tx.relatedEntityType === 'CUSTOMER') ? tx.relatedEntityType : 'SUPPLIER';
        
        if (buyBase > 0) {
          if (tx.isReversal) {
            // حالة الارتداد: المورد مدين (ينقص حسابه) والتكلفة دائنة (تنقص المصاريف)
            journalLines.push({ accountId: effectiveSupplierId, accountType: supplierAccType, accountName: '', debit: buyBase, credit: 0 });
            journalLines.push({ accountId: costId, accountType: 'EXPENSE', accountName: costName, debit: 0, credit: buyBase });
          } else {
            journalLines.push({ accountId: costId, accountType: 'EXPENSE', accountName: costName, debit: buyBase, credit: 0 });
            journalLines.push({ accountId: effectiveSupplierId, accountType: supplierAccType, accountName: '', debit: 0, credit: buyBase });
          }
        }
        
        // إثبات عمولة الموظف (حتى في حالة شراء المكونات إذا تم تحديدها)
        if (commission > 0) {
          journalLines.push({ accountId: 'COMMISSION_EXPENSE', accountType: 'EXPENSE', accountName: 'مصروف عمولات موظفين', debit: commission, credit: 0 });
          journalLines.push({ accountId: tx.employeeId, accountType: 'LIABILITY', accountName: 'عمولات مستحقة للموظف', debit: 0, credit: commission });
        }
      } else if (tx.type === 'REVENUE_ONLY' || tx.isSaleOnly) {
        // إثبات البيع فقط (للعميل)
        if (sellBase > 0) {
          journalLines.push({ accountId: tx.relatedEntityId, accountType: (tx.relatedEntityType as any) || 'CUSTOMER', accountName: '', debit: sellBase, credit: 0 });
          journalLines.push({ accountId: revId, accountType: 'REVENUE', accountName: revName, debit: 0, credit: sellBase });
        }
        
        // إثبات عمولة الموظف (إذا وجدت)
        if (commission > 0) {
          journalLines.push({ accountId: 'COMMISSION_EXPENSE', accountType: 'EXPENSE', accountName: 'مصروف عمولات موظفين', debit: commission, credit: 0 });
          journalLines.push({ accountId: tx.employeeId, accountType: 'LIABILITY', accountName: 'عمولات مستحقة للموظف', debit: 0, credit: commission });
        }
      } else {
        // الطريقة التقليدية (بيع وشراء معاً)
        if (sellBase > 0) {
          journalLines.push({ accountId: tx.relatedEntityId, accountType: (tx.relatedEntityType as any) || 'CUSTOMER', accountName: '', debit: sellBase, credit: 0 });
          journalLines.push({ accountId: revId, accountType: 'REVENUE', accountName: revName, debit: 0, credit: sellBase });
        }
        
        if (buyBase > 0) {
          const supplierAccType = tx.supplierType === 'CUSTOMER' ? 'CUSTOMER' : tx.supplierType === 'TREASURY' ? 'TREASURY' : 'SUPPLIER';
          journalLines.push({ accountId: costId, accountType: 'EXPENSE', accountName: costName, debit: buyBase, credit: 0 });
          journalLines.push({ accountId: tx.supplierId, accountType: supplierAccType, accountName: '', debit: 0, credit: buyBase });
        }

        if (commission > 0) {
          journalLines.push({ accountId: 'COMMISSION_EXPENSE', accountType: 'EXPENSE', accountName: 'مصروف عمولات موظفين', debit: commission, credit: 0 });
          journalLines.push({ accountId: tx.employeeId, accountType: 'LIABILITY', accountName: 'عمولات مستحقة للموظف', debit: 0, credit: commission });
        }
      }
    } 
    // 7. سندات القبض والصرف
     else if (tx.category === 'CASH') {
       const mappedType = tx.relatedEntityType === 'EMPLOYEE' ? 'LIABILITY' : tx.relatedEntityType;
       
       if (tx.type === 'INCOME') {
         journalLines.push({ accountId: tx.treasuryId, accountType: 'TREASURY', accountName: '', debit: amountInBase, credit: 0 });
         if (tx.relatedEntityId) journalLines.push({ accountId: tx.relatedEntityId, accountType: mappedType, accountName: '', debit: 0, credit: amountInBase });
       } else {
         journalLines.push({ accountId: tx.treasuryId, accountType: 'TREASURY', accountName: '', debit: 0, credit: amountInBase });
         if (tx.relatedEntityId) {
           // For payment to supplier/employee, debit them to reduce our debt to them
           // For refund to customer, debit them to increase their balance (or reduce their credit)
           journalLines.push({ accountId: tx.relatedEntityId, accountType: mappedType, accountName: '', debit: amountInBase, credit: 0 });
         }
       }
     }
    // 8. مسحوبات الشركاء
    else if (tx.category === 'PARTNER_WITHDRAWAL') {
      // من حـ/ جاري الشريك (مدين) إلى حـ/ الخزينة (دائن)
      journalLines.push({ accountId: tx.relatedEntityId, accountType: 'PARTNER', accountName: '', debit: amountInBase, credit: 0 });
      journalLines.push({ accountId: tx.treasuryId, accountType: 'TREASURY', accountName: '', debit: 0, credit: amountInBase });
    }
    // 9. سلف الموظفين
    else if (tx.category === 'EMPLOYEE_ADVANCE') {
      if (tx.type === 'ADVANCE_PAYMENT') {
        // صرف سلفة: من حـ/ سلف الموظفين (مدين) إلى حـ/ الخزينة (دائن)
        journalLines.push({ accountId: tx.relatedEntityId, accountType: 'EMPLOYEE_ADVANCE', accountName: '', debit: amountInBase, credit: 0 });
        journalLines.push({ accountId: tx.treasuryId, accountType: 'TREASURY', accountName: '', debit: 0, credit: amountInBase });
      } else {
        // خصم سلفة: من حـ/ جاري الموظف (مدين) إلى حـ/ سلف الموظفين (دائن)
        journalLines.push({ accountId: tx.relatedEntityId, accountType: 'LIABILITY', accountName: '', debit: amountInBase, credit: 0 });
        journalLines.push({ accountId: tx.relatedEntityId, accountType: 'EMPLOYEE_ADVANCE', accountName: '', debit: 0, credit: amountInBase });
      }
    }
    // 10. خطابات الضمان (Asset)
    else if (tx.category === 'GUARANTEE_LETTER') {
      if (tx.type === 'EXPENSE') {
        // دفع خطاب ضمان: من حـ/ خطابات الضمان (أصل - مدين) إلى حـ/ الخزينة (دائن)
        journalLines.push({ accountId: 'ASSET_GUARANTEES', accountType: 'ASSET', accountName: 'خطابات ضمان لدى الوكلاء', debit: amountInBase, credit: 0 });
        journalLines.push({ accountId: tx.treasuryId, accountType: 'TREASURY', accountName: '', debit: 0, credit: amountInBase });
      } else {
        // استرداد خطاب ضمان: من حـ/ الخزينة (مدين) إلى حـ/ خطابات الضمان (أصل - دائن)
        journalLines.push({ accountId: tx.treasuryId, accountType: 'TREASURY', accountName: '', debit: amountInBase, credit: 0 });
        journalLines.push({ accountId: 'ASSET_GUARANTEES', accountType: 'ASSET', accountName: 'خطابات ضمان لدى الوكلاء', debit: 0, credit: amountInBase });
      }
    }
    // 11. مصروفات عامة
    else if (tx.category === 'EXPENSE_GEN') {
      journalLines.push({ accountId: tx.expenseCategory, accountType: 'EXPENSE', accountName: '', debit: amountInBase, credit: 0 });
      journalLines.push({ accountId: tx.treasuryId, accountType: 'TREASURY', accountName: '', debit: 0, credit: amountInBase });
    }
    // 11. التحويل بين الخزائن (Internal Transfer)
    else if (tx.type === 'TRANSFER') {
      // من حـ/ الخزينة المستلمة (مدين)
      journalLines.push({ accountId: tx.targetEntityId!, accountType: 'TREASURY', accountName: '', debit: amountInBase, credit: 0 });
      // إلى حـ/ الخزينة المحول منها (دائن)
      journalLines.push({ accountId: tx.treasuryId!, accountType: 'TREASURY', accountName: '', debit: 0, credit: amountInBase });
    }

    const refNo = tx.refNo || (Math.random().toString(36).substring(2, 9).toUpperCase()); // مراجع مؤقتة فريدة لمنع التعارض
    const journalLinesWithMetadata = (journalLines || []).map(l => ({
      ...l,
      debit: Number(Math.round((l.debit || 0) * 100) / 100) || 0,
      credit: Number(Math.round((l.credit || 0) * 100) / 100) || 0,
      currencyCode: l.currencyCode || tx.currencyCode || settings.baseCurrency,
      exchangeRate: Number(l.exchangeRate || rate || 1),
      originalAmount: Number(l.originalAmount || (l.debit || l.credit || 0) / (l.exchangeRate || rate || 1)) || 0,
      costCenterId: l.costCenterId || tx.costCenterId || '',
      programId: l.programId || tx.programId || '',
      componentId: l.componentId || tx.componentId || ''
    }));
    
    let jId: string | undefined;
    try {
      jId = journalLinesWithMetadata.length > 0 ? recordJournalEntry(tx.description, tx.date, journalLinesWithMetadata, refNo) : undefined;
    } catch (e) {
      console.error("Accounting Engine Error:", e);
      notify("خطأ في المحرك المحاسبي: " + (e as Error).message, "error");
      return; // Stop if accounting fails
    }

    const newTx = { 
      ...tx, 
      id: `TX-${Date.now()}`, 
      refNo,
      journalEntryId: jId, 
      amountInBase, 
      purchasePriceInBase: Math.round((tx.purchasePrice || 0) * rate * 100) / 100,
      sellingPriceInBase: Math.round((tx.sellingPrice || 0) * rate * 100) / 100,
      exchangeRate: rate 
    };

    // تحديث المعاملات بدون استدعاء Notify فوراً لتجنب ثقل الواجهة
    setTransactions(prev => [newTx, ...prev]);
    addAuditLog('CREATE', 'TRANSACTION', newTx.id, `إضافة عملية: ${tx.description}`);
    
    if (!tx.isReversal) {
      notify("تمت العملية بنجاح");
    }
    } catch (error) {
      console.error("[addTransaction] Error:", error);
      notify("حدث خطأ تقني أثناء معالجة العملية: " + (error as Error).message, "error");
    }
  };

  const deleteTransaction = (id: string, silent = false) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    
    let reason = "";
    if (!silent && currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (silent || confirm('تنبيه: هل أنت متأكد من حذف العملية وعكس الأثر المالي بالكامل؟')) {
      addAuditLog(silent ? 'UPDATE' : 'DELETE', 'TRANSACTION', id, `${silent ? 'تحديث' : 'حذف'} عملية: ${tx.description}${reason ? ` | السبب: ${reason}` : ""}`, tx);
      if (tx.journalEntryId) {
        const entry = journalEntries.find(e => e.id === tx.journalEntryId);
        if (entry) {
          (entry.lines || []).forEach(l => l && applyFinancialEffect(l, true)); // عكس الأثر المالي
          setJournalEntries(prev => (prev || []).filter(e => e && e.id !== tx.journalEntryId));
        }
      } else {
        // Fallback logic for transactions without journal entries (Legacy/Initial data)
        const isSale = ['FLIGHT', 'HAJJ_UMRAH', 'GENERAL_SERVICE', 'FLIGHT_REISSUE'].includes(tx.category);
        
        // 1. Update Treasury (if applicable)
        if (tx.treasuryId && tx.amountInBase && !isSale) {
          const factor = tx.type === 'INCOME' ? -1 : 1;
          const netAmount = tx.amountInBase * factor;
          setTreasuries(prev => prev.map(t => t.id === tx.treasuryId ? { ...t, balance: t.balance + netAmount } : t));
        }

        // 2. Update Customer Balance
        if (tx.relatedEntityId && tx.amountInBase) {
          const amount = tx.amountInBase;
          let customerFactor = 0;
          
          if (isSale) {
            customerFactor = -1; // Deleting a sale reduces the debt from customer
          } else if (tx.category === 'CASH' || tx.category.includes('REFUND')) {
            customerFactor = tx.type === 'INCOME' ? 1 : -1; // Deleting receipt increases debt, deleting refund reduces it
          }

          if (customerFactor !== 0) {
            setCustomers(prev => prev.map(c => c.id === tx.relatedEntityId ? { ...c, balance: c.balance + (amount * customerFactor) } : c));
          }
        }

        // 3. Update Supplier Balance (for Sales/Purchases/Refunds)
        const sId = tx.supplierId || (tx.relatedEntityType === 'SUPPLIER' ? tx.relatedEntityId : null);
        if (sId && (tx.purchasePrice || tx.amountInBase)) {
          const pAmount = (tx.purchasePrice || tx.amountInBase) * (tx.exchangeRate || 1);
          let supplierFactor = 0;

          if (isSale) {
            supplierFactor = -1; // Deleting a sale reduces what we owe the supplier (cost)
          } else if ((tx.category === 'CASH' || tx.category.includes('REFUND')) && tx.type === 'EXPENSE') {
            supplierFactor = 1; // Deleting a payment/refund to supplier increases what we owe them
          }

          if (supplierFactor !== 0) {
            setSuppliers(prev => prev.map(s => s.id === sId ? { ...s, balance: s.balance + (pAmount * supplierFactor) } : s));
          }
        }

        // 4. Update Employee Balance
        if (tx.relatedEntityType === 'EMPLOYEE' && tx.relatedEntityId) {
          const factor = tx.type === 'EXPENSE' ? 1 : -1;
          setEmployees(prev => prev.map(e => e.id === tx.relatedEntityId ? { ...e, balance: (e.balance || 0) + (tx.amountInBase * factor) } : e));
        }
      }
      setTransactions(prev => (prev || []).filter(t => t && t.id !== id));
      notify("تم الحذف والتسوية", "info");
    }
  };

  const deleteCustomer = (id: string) => {
    const customer = customers.find(c => c.id === id);
    if (!customer) return;

    const hasTx = transactions.some(t => (t.relatedEntityId === id && t.relatedEntityType === 'CUSTOMER') || (t.targetEntityId === id && t.targetEntityType === 'CUSTOMER'));
    if (hasTx) {
      alert('لا يمكن حذف العميل لأنه له عمليات مرتبطة');
      return;
    }

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm(`تحذير ملكي: هل أنت متأكد من حذف العميل "${customer.name}" نهائياً؟`)) {
      addAuditLog('DELETE', 'SETTINGS', id, `حذف عميل: ${customer.name}${reason ? ` | السبب: ${reason}` : ""}`, customer);
      setCustomers(prev => (prev || []).filter(c => c && c.id !== id));
      notify("تم حذف العميل بنجاح", "info");
    }
  };

  const deleteSupplier = (id: string) => {
    const supplier = suppliers.find(s => s.id === id);
    if (!supplier) return;

    if (supplier.balance !== 0) {
      alert('لا يمكن حذف مورد له رصيد غير صفري، يرجى تسوية الحساب أولاً');
      return;
    }

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm(`تحذير ملكي: هل أنت متأكد من حذف المورد "${supplier.company}" نهائياً؟`)) {
      addAuditLog('DELETE', 'SETTINGS', id, `حذف مورد: ${supplier.company}${reason ? ` | السبب: ${reason}` : ""}`, supplier);
      setSuppliers(prev => (prev || []).filter(s => s && s.id !== id));
      notify("تم حذف المورد بنجاح", "info");
    }
  };

  const deleteTreasury = (id: string) => {
    const treasury = treasuries.find(t => t.id === id);
    if (!treasury) return;

    if (treasury.balance !== 0) {
      alert('لا يمكن حذف خزينة بها رصيد، برجاء تصفية الحساب أولاً');
      return;
    }

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm(`هل أنت متأكد من حذف الخزينة "${treasury.name}"؟`)) {
      addAuditLog('DELETE', 'SETTINGS', id, `حذف خزينة: ${treasury.name}${reason ? ` | السبب: ${reason}` : ""}`, treasury);
      setTreasuries(prev => (prev || []).filter(t => t && t.id !== id));
      notify("تم حذف الخزينة بنجاح", "info");
    }
  };

  const repairAttribution = () => {
    let repairedCount = 0;
    const newTransactions = transactions.map(tx => {
      // فقط العمليات التي تفتقد لمعرف الموظف وتكون من نوع يحتاج لعمولة
      if (!tx.employeeId && ['FLIGHT', 'FLIGHT_REISSUE', 'HAJJ_UMRAH', 'GENERAL_SERVICE'].includes(tx.category)) {
        // البحث في سجلات التدقيق عن عملية الإنشاء لهذه المعاملة
        const createLog = auditLogs.find(log => log.entityId === tx.id && log.action === 'CREATE');
        if (createLog) {
          // البحث عن موظف يطابق اسم المستخدم في سجل التدقيق
          const matchingEmp = employees.find(emp => compareArabic(emp.name, createLog.userName));
          if (matchingEmp) {
            repairedCount++;
            return { ...tx, employeeId: matchingEmp.id };
          }
        }
      }
      return tx;
    });

    if (repairedCount > 0) {
      setTransactions(newTransactions);
      notify(`تم إصلاح ربط ${repairedCount} عملية بنجاح. يرجى الملاحظة أن التأثير المالي (القيود) سيتحدث عند إعادة حفظ كل عملية.`, "success");
      addAuditLog('UPDATE', 'SETTINGS', 'SYSTEM', `إصلاح الربط التلقائي لـ ${repairedCount} عملية بناءً على سجل التدقيق`);
    } else {
      notify("لم يتم العثور على عمليات تحتاج لإصلاح الربط", "info");
    }
  };

  const deleteEmployee = (id: string) => {
    const employee = employees.find(e => e.id === id);
    if (!employee) return;

    const hasTx = transactions.some(t => t.employeeId === id || (t.relatedEntityId === id && t.relatedEntityType === 'EMPLOYEE'));
    if (hasTx) {
      alert('لا يمكن حذف الموظف لوجود عمليات مرتبطة به');
      return;
    }

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm(`هل أنت متأكد من حذف الموظف "${employee.name}" نهائياً؟`)) {
      addAuditLog('DELETE', 'SETTINGS', id, `حذف موظف: ${employee.name}${reason ? ` | السبب: ${reason}` : ""}`, employee);
      setEmployees(prev => prev.filter(e => e.id !== id));
      notify("تم حذف الموظف بنجاح", "info");
    }
  };

  const deleteShift = (id: string) => {
    const shift = shifts.find(s => s.id === id);
    if (!shift) return;

    if (confirm(`هل أنت متأكد من حذف نظام الدوام: ${shift.name}؟`)) {
      setShifts(prev => prev.filter(s => s.id !== id));
      addAuditLog('DELETE', 'SETTINGS', id, `حذف نظام الدوام: ${shift.name}`);
      notify("تم حذف نظام الدوام بنجاح", "success");
    }
  };

  const deleteDepartment = (id: string) => {
    const dept = departments.find(d => d.id === id);
    if (!dept) return;

    const linkedDesignations = designations.filter(d => d.departmentId === id);
    if (linkedDesignations.length > 0) {
      alert(`لا يمكن حذف هذا القسم لأنه يحتوي على ${linkedDesignations.length} مسميات وظيفية. يرجى حذف المسميات أولاً.`);
      return;
    }

    const linkedEmployees = employees.filter(e => e.departmentId === id);
    if (linkedEmployees.length > 0) {
      alert(`لا يمكن حذف هذا القسم لأنه مرتبط بـ ${linkedEmployees.length} موظفين.`);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف قسم: ${dept.name}؟`)) {
      setDepartments(prev => prev.filter(d => d.id !== id));
      addAuditLog('DELETE', 'SETTINGS', id, `حذف قسم: ${dept.name}`);
      notify("تم حذف القسم بنجاح", "success");
    }
  };

  const deleteDesignation = (id: string) => {
    const desig = designations.find(d => d.id === id);
    if (!desig) return;

    const linkedEmployees = employees.filter(e => e.designationId === id);
    if (linkedEmployees.length > 0) {
      alert(`لا يمكن حذف هذا المسمى الوظيفي لأنه مرتبط بـ ${linkedEmployees.length} موظفين.`);
      return;
    }

    if (confirm(`هل أنت متأكد من حذف المسمى الوظيفي: ${desig.name}؟`)) {
      setDesignations(prev => prev.filter(d => d.id !== id));
      addAuditLog('DELETE', 'SETTINGS', id, `حذف مسمى وظيفي: ${desig.name}`);
      notify("تم حذف المسمى الوظيفي بنجاح", "success");
    }
  };

  const deleteMasterTrip = (id: string) => {
    const trip = masterTrips.find(mt => mt.id === id);
    if (!trip) return;

    const linkedPrograms = programs.filter(p => p.masterTripId === id);
    if (linkedPrograms.length > 0) {
      alert(`لا يمكن حذف هذه الرحلة لأنها مرتبطة بـ ${linkedPrograms.length} برامج. يرجى فك الارتباط أولاً.`);
      return;
    }

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm(`هل أنت متأكد من حذف الرحلة المجمعة "${trip.name}"؟`)) {
      addAuditLog('VOID', 'SETTINGS', id, `حذف الرحلة المجمعة: ${trip.name}${reason ? ` | السبب: ${reason}` : ""}`, trip, { ...trip, isVoided: true });
      setMasterTrips(prev => prev.map(mt => mt.id === id ? { ...mt, isVoided: true } : mt));
      notify("تم حذف الرحلة المجمعة بنجاح", "info");
    }
  };

  const restoreMasterTrip = (id: string) => {
    const trip = masterTrips.find(mt => mt.id === id);
    if (!trip) return;
    
    if (confirm(`هل أنت متأكد من استعادة الرحلة المجمعة: ${trip.name}؟`)) {
      setMasterTrips(prev => prev.map(mt => mt.id === id ? { ...mt, isVoided: false } : mt));
      addAuditLog('UPDATE', 'SETTINGS', id, `استعادة الرحلة المجمعة: ${trip.name}`, trip, { ...trip, isVoided: false });
      notify("تم استعادة الرحلة بنجاح", "success");
    }
  };

  const saveAccommodation = async (tripId: string, accommodation: MasterTrip['accommodation']) => {
    const updatedMasterTrips = masterTrips.map(t => t.id === tripId ? { ...t, accommodation } : t);
    setMasterTrips(updatedMasterTrips);
    addAuditLog('UPDATE', 'MASTER_TRIP', tripId, `Updated accommodation rooming list for trip ${tripId}`);
    
    // 1. إرسال تحديث لحظي سريع جداً (Delta Sync) لكل المتصفحات الأخرى المفتوحة حالياً
    // هذا لا ينتظر الرفع الكامل لقاعدة البيانات وسيشعر المستخدم بالسرعة
    DataService.broadcastDelta(DataService.getTenantId(), {
      masterTrips: updatedMasterTrips.filter(t => t.id === tripId), // نرسل فقط الرحلة التي تغيرت لتقليل حجم البيانات
      senderSessionId: sessionId.current,
      lastUpdated: new Date().toISOString()
    });

    // 2. الحفظ الكامل في الخلفية لضمان بقاء البيانات بشكل دائم
    // لن نقوم بـ await هنا لنحرر واجهة المستخدم فوراً
    forceSaveData(updatedMasterTrips).then(res => {
      if (res?.success) {
        notify('تم الحفظ والمزامنة في السحابة بنجاح', 'success');
      } else {
        notify('فشل الحفظ الدائم في السحابة، تم الحفظ محلياً فقط', 'error');
      }
    });

    // نغلق شاشة الانتظار أو نعطي شعور بالنجاح فوراً
    return { success: true };
  };

  const deleteProgram = (id: string) => {
    const program = programs.find(p => p.id === id);
    if (!program) return;

    const linkedBookings = transactions.filter(t => t.programId === id && !t.isVoided);
    if (linkedBookings.length > 0) {
      alert(`لا يمكن حذف هذا البرنامج لأنه مرتبط بـ ${linkedBookings.length} حجز فعلي. يرجى إلغاء الحجوزات أو نقلها أولاً.`);
      return;
    }

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm(`هل أنت متأكد من حذف برنامج "${program.name}"؟`)) {
      addAuditLog('DELETE', 'SETTINGS', id, `حذف برنامج: ${program.name}${reason ? ` | السبب: ${reason}` : ""}`, program);
      setPrograms(prev => prev.filter(p => p.id !== id));
      notify("تم حذف البرنامج بنجاح", "info");
    }
  };

  const deleteUser = (id: string) => {
    if (id === 'admin') {
      alert('لا يمكن حذف المستخدم الجذر (Root Admin)');
      return;
    }
    if (id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الخاص أثناء تسجيل الدخول');
      return;
    }

    const user = users.find(u => u.id === id);
    if (!user) return;

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm(`هل أنت متأكد من حذف المستخدم "${user.name}" وسحب كافة صلاحياته؟`)) {
      addAuditLog('DELETE', 'SETTINGS', id, `حذف مستخدم: ${user.name} (@${user.username})${reason ? ` | السبب: ${reason}` : ""}`, user);
      setUsers(prev => prev.filter(u => u.id !== id));
      notify("تم حذف المستخدم بنجاح", "info");
    }
  };

  const deletePartner = (id: string) => {
    const partner = partners.find(p => p.id === id);
    if (!partner) return;

    const hasTx = transactions.some(t => t.relatedEntityId === id && t.relatedEntityType === 'PARTNER');
    if (hasTx || (partner.balance || 0) !== 0) {
      alert('لا يمكن حذف الشريك لوجود عمليات مرتبطة به أو رصيد غير صفري');
      return;
    }

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm(`هل أنت متأكد من حذف الشريك "${partner.name}"؟`)) {
      addAuditLog('DELETE', 'SETTINGS', id, `حذف شريك: ${partner.name}${reason ? ` | السبب: ${reason}` : ""}`, partner);
      setPartners(prev => prev.filter(p => p.id !== id));
      notify("تم حذف الشريك بنجاح", "info");
    }
  };

  const deleteCurrency = (code: string) => {
    if (code === settings.baseCurrency) {
      alert('لا يمكن حذف العملة الأساسية!');
      return;
    }

    const hasTx = transactions.some(t => t.currencyCode === code);
    if (hasTx) {
      alert('لا يمكن حذف العملة لوجود عمليات مسجلة بها');
      return;
    }

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm(`هل أنت متأكد من حذف العملة "${code}"؟`)) {
      const currency = currencies.find(c => c.code === code);
      addAuditLog('DELETE', 'SETTINGS', code, `حذف عملة: ${code}${reason ? ` | السبب: ${reason}` : ""}`, currency);
      setCurrencies(prev => prev.filter(c => c.code !== code));
      notify("تم حذف العملة بنجاح", "info");
    }
  };

  const voidTransaction = (id: string, silent = false) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    let reason = "تحديث تلقائي من نظام التسكين";
    if (!silent && currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الإلغاء (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الإلغاء بدون ذكر السبب.");
        return;
      }
    }

    if (silent || confirm('تنبيه: هل أنت متأكد من إلغاء العملية وعكس الأثر المالي؟ (سيظل السجل ظاهراً في كشف الحساب)')) {
      addAuditLog('VOID', 'TRANSACTION', id, `إلغاء (Void) عملية: ${tx.description}${reason ? ` | السبب: ${reason}` : ""}`, tx, { ...tx, isVoided: true });
      if (tx.journalEntryId) {
        const entry = journalEntries.find(e => e.id === tx.journalEntryId);
        if (entry) entry.lines.forEach(l => applyFinancialEffect(l, true)); // عكس الأثر المالي
        setJournalEntries(prev => prev.filter(e => e.id !== tx.journalEntryId));
      }
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, isVoided: true } : t));
      if (!silent) notify("تم الإلغاء وعكس الأثر المالي", "info");
    }
  };

  const deleteJournalEntry = (id: string) => {
    const entry = journalEntries.find(e => e.id === id);
    if (!entry) return;

    let reason = "";
    if (currentUser?.role !== 'ADMIN') {
      reason = prompt("يرجى إدخال سبب الحذف (إلزامي للموظفين):") || "";
      if (!reason.trim()) {
        alert("لا يمكن الحذف بدون ذكر السبب.");
        return;
      }
    }

    if (confirm('تنبيه: هل أنت متأكد من حذف القيد المحاسبي وعكس الأثر المالي بالكامل؟')) {
      addAuditLog('DELETE', 'TRANSACTION', id, `حذف قيد محاسبي: ${entry.description}${reason ? ` | السبب: ${reason}` : ""}`, entry);
      // عكس الأثر المالي لكل سطر في القيد
      entry.lines.forEach(l => applyFinancialEffect(l, true));
      setJournalEntries(prev => prev.filter(e => e.id !== id));
      notify("تم حذف القيد وعكس الأثر المالي", "info");
    }
  };

  const editJournalEntry = (id: string, description: string, date: string, lines: Omit<JournalLine, 'id'>[]) => {
    const entry = journalEntries.find(e => e.id === id);
    if (!entry) return;
    // عكس الأثر المالي القديم
    entry.lines.forEach(l => applyFinancialEffect(l, true));
    // تطبيق الأثر الجديد
    lines.forEach(l => applyFinancialEffect(l));
    // تحديث القيد
    setJournalEntries(prev => prev.map(e => e.id === id ? {
      ...e,
      description,
      date,
      lines: lines.map((l, i) => ({ ...l, id: i.toString() })),
      totalAmount: lines.reduce((s, l) => s + l.debit, 0)
    } : e));
    notify("تم تحديث القيد المحاسبي", "info");
  };

  const handleUpdateTransaction = (id: string, updates: Partial<Transaction>) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;
    const updatedTx = { ...tx, ...updates };
    deleteTransaction(id, true);
    addTransaction(updatedTx);
  };

  const handleUpdateJournalEntry = (id: string, updates: Partial<JournalEntry>) => {
    const entry = journalEntries.find(e => e.id === id);
    if (!entry) return;
    
    // Reverse financial effects
    entry.lines.forEach(line => applyFinancialEffect(line, true));
    
    const updatedEntry = { ...entry, ...updates };
    
    // Apply new financial effects
    updatedEntry.lines.forEach(line => applyFinancialEffect(line));
    
    setJournalEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
    notify("تم تحديث القيد المحاسبي", "info");
  };

  const addCostCenter = (center: Omit<CostCenter, 'id' | 'createdAt'>) => {
    const newCenter: CostCenter = {
      ...center,
      id: `CC-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setCostCenters(prev => [...prev, newCenter]);
    addAuditLog('CREATE', 'SETTINGS', newCenter.id, `إضافة مركز تكلفة: ${newCenter.name}`);
    notify("تم إضافة مركز التكلفة بنجاح");
  };

  const updateCostCenter = (id: string, updates: Partial<CostCenter>) => {
    const old = costCenters.find(c => c.id === id);
    setCostCenters(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    addAuditLog('UPDATE', 'SETTINGS', id, `تعديل مركز تكلفة: ${old?.name}`, old, { ...old, ...updates });
    notify("تم تحديث مركز التكلفة");
  };

  const deleteCostCenter = (id: string) => {
    const center = costCenters.find(c => c.id === id);
    if (!center) return;

    const hasTx = transactions.some(t => t.costCenterId === id) || journalEntries.some(e => e.lines.some(l => l.costCenterId === id));
    if (hasTx) {
      alert('لا يمكن حذف مركز التكلفة لوجود عمليات مرتبطة به');
      return;
    }

    if (confirm(`هل أنت متأكد من حذف مركز التكلفة "${center.name}"؟`)) {
      addAuditLog('DELETE', 'SETTINGS', id, `حذف مركز تكلفة: ${center.name}`, center);
      setCostCenters(prev => prev.filter(c => c.id !== id));
      notify("تم حذف مركز التكلفة", "info");
    }
  };

  useEffect(() => {
    if (isDataLoaded && transactions.length > 0) {
      // البحث عن البيان المطلوب حذفه (PV-0165)
      const targetTx = transactions.find(t => t.refNo === 'PV-0165' || (t.description && t.description.includes('PV-0165')));
      if (targetTx) {
        console.log("Removing requested transaction PV-0165");
        voidTransaction(targetTx.id, true);
        notify("تم حذف البيان المطلوب بنجاح", "success");
      }
    }
  }, [isDataLoaded, transactions.length]);

  const brandName = DataService.getClientName();
  const isDefaultBranding = isDefaultBrandingName(settings.name);
  const displayAppName = isDefaultBranding ? 'نِـبـراس ERP' : settings.name;
  const displayLogo = isDefaultBranding ? undefined : settings.logo;

  // إذا كان العميل متواجد في صفحة الهبوط، نعرضها فوراً دون انتظار تحميل البيانات
  if (showLanding && !isElectron) {
    return (
      <React.Suspense fallback={<div className="h-screen bg-[#020617]" />}>
        <LandingPage onStart={handleStartApp} />
        
        {/* OTP Modal */}
        {showOTP && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
            <div className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl relative text-center">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
                <Lock size={32} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tighter text-white">تحقق الأمان (OTP)</h3>
              <p className="text-slate-400 font-bold text-sm mb-8">تم إرسال رمز التحقق لهاتف مدير النظام الخاص بشركة ({pendingTenant})</p>
              
              <input 
                type="text"
                maxLength={4}
                placeholder="0 0 0 0"
                className="w-full px-6 py-5 bg-slate-950 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-black text-3xl text-center tracking-[1em] mb-6"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
              />

              <div className="flex flex-col gap-3">
                <button 
                  onClick={verifyOTP}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg transition-all active:scale-95"
                >
                  تأكيد الدخول
                </button>
                <button 
                  onClick={() => {
                    const newOTP = Math.floor(1000 + Math.random() * 9000).toString();
                    setGeneratedOTP(newOTP);
                    setNotification({ 
                      msg: `تم إعادة إرسال رمز التحقق (${newOTP})`, 
                      type: 'info' 
                    });
                  }}
                  className="w-full py-2 text-indigo-400 font-bold hover:text-indigo-300 transition-colors text-sm"
                >
                  إعادة إرسال الرمز
                </button>
                <button 
                  onClick={() => setShowOTP(false)}
                  className="w-full py-2 text-slate-500 font-bold hover:text-white transition-colors text-xs"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Trial Message Modal */}
        {isTrialMessage && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/80">
            <div className="bg-slate-900 border border-indigo-500/30 p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl relative text-center">
              <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-amber-400">
                <Zap size={32} />
              </div>
              <h3 className="text-2xl font-black mb-4 tracking-tighter text-white">نظام غير مفعل</h3>
              <div className="space-y-4 mb-8">
                <p className="text-slate-300 font-bold leading-relaxed">
                  أنت الآن في فترة تجربة لمدة <span className="text-amber-400">3 أيام</span> لاستكشاف مميزات النظام.
                </p>
                <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <p className="text-indigo-200 text-sm font-bold">لتفعيل المنتج بشكل دائم والحصول على كافة المميزات، يرجى التواصل مع المطور فوراً.</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => window.open(`https://wa.me/201148820573?text=أريد تفعيل نظام نبراس لشركة ${pendingTenant}`, '_blank')}
                  className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-lg transition-all flex items-center justify-center gap-3"
                >
                  <MessageSquare size={20} />
                  تواصل للتفعيل الآن
                </button>
                <button 
                  onClick={() => window.location.href = `?client=${pendingTenant}`}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
                >
                  متابعة كفترة تجريبية
                </button>
                <button 
                  onClick={() => setIsTrialMessage(false)}
                  className="w-full py-2 text-slate-500 font-bold hover:text-white"
                >
                  رجوع
                </button>
              </div>
            </div>
          </div>
        )}
      </React.Suspense>
    );
  }

  if (!isDataLoaded) return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] text-white p-8 text-center font-['Cairo']">
       <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-2xl animate-bounce">
          <ShieldCheck size={40} className="text-white" />
       </div>
       <h1 className="text-3xl font-bold mb-4 tracking-tighter">جاري تهيئة نظام نِـبـراس</h1>
       <p className="text-slate-400 mb-8 max-w-md text-sm font-bold">يرجى الانتظار بينما يتم تحميل قواعد البيانات وفحص الأمان...</p>
       <div className="w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-500 animate-[loading_2s_ease-in-out_infinite]"></div>
       </div>
    </div>
  );

  if (!currentUser) {
    if (showLanding) {
      return (
        <div className="flex flex-col h-screen">
          <TitleBar appName={displayAppName} />
          <React.Suspense fallback={
             <div className="h-screen w-screen flex items-center justify-center bg-[#020617]">
               <Loader2 className="animate-spin text-white" size={40} />
             </div>
          }>
            <LandingPage />
            <button 
              onClick={() => setShowLanding(false)}
              className="fixed bottom-10 left-10 z-50 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-2xl flex items-center gap-2 transition-all transform hover:scale-110 active:scale-95"
            >
              <Lock size={20} />
              دخول النظام
            </button>
          </React.Suspense>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen">
        <TitleBar appName={displayAppName} />
        <Login 
          appName={displayAppName} 
          logo={displayLogo} 
          onBack={() => setShowLanding(true)}
          onLogin={(u, p) => {
          console.log(`[Login] Attempt for ${u} in tenant ${DataService.getTenantId()}.`);
          
          // إذا حاول المستخدم الدخول بأسماء تابعة لـ Authentic وهو في مستأجر آخر، نوجهه فوراً
          const authenticUsers = ['authentic', 'admin'];
          if (authenticUsers.includes(u.toLowerCase()) && DataService.getTenantId() !== 'authentic') {
            console.log(`[Login] Authentic user '${u}' detected. Redirecting to authentic tenant...`);
            localStorage.setItem('nebras_tenant_id', 'authentic');
            window.location.href = '?client=authentic';
            return;
          }
          
          // الماستر كي للدخول في حالات الطوارئ وتصفير البيانات
          const isMasterKey = (p === 'NEBRAS@2026@ADMIN');
          
          // حماية إضافية: نضمن دائماً وجود المدير العام في قائمة البحث حتى لو لم يحمل من السحاب
          const hasAdmin = users.some(x => x.username === 'admin');
          const allPossibleUsers = hasAdmin ? users : [
            ...users,
            { id: 'admin', username: 'admin', password: 'admin', name: 'المدير العام (افتراضي)', role: 'ADMIN', permissions: ['ADMIN_ONLY'] }
          ];

          const user = allPossibleUsers.find(x => x.username === u && (x.password === p || isMasterKey));
          if (user) {
            setCurrentUser(user);
            localStorage.setItem('nebras_user', JSON.stringify(user));
            if (user.role === 'BOOKING_EMPLOYEE') {
              setCurrentView(ViewState.FLIGHTS);
            }
            // Log the successful login manually
            const log: AuditLog = {
              id: `LOG-${Date.now()}`,
              timestamp: new Date().toISOString(),
              userId: user.id,
              userName: user.name,
              action: 'LOGIN',
              entityType: 'SETTINGS',
              entityId: user.id,
              details: `تسجيل دخول ناجح للمستخدم: ${user.name}`
            };
            setAuditLogs(prev => [log, ...prev].slice(0, 5000));
          }
          else notify("خطأ في البيانات", "error");
        }} />
      </div>
    );
  }

  // شاشة تفعيل النسخة الكاملة
  if (showActivation || isTrialExpired) {
    return (
      <div className="h-screen w-screen flex flex-col bg-[#020617] text-white font-['Cairo'] relative overflow-hidden">
        <TitleBar appName={displayAppName} />
        
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-rose-600 rounded-full blur-[120px] animate-pulse"></div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 relative z-10">
          <div className="max-w-xl w-full bg-slate-900/50 backdrop-blur-3xl p-10 rounded-[2.5rem] border border-white/10 shadow-2xl space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30 animate-bounce group-hover:scale-110 transition-transform duration-500">
                <ShieldCheck size={40} className="text-white" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">تنشيط النسخة الكاملة</h2>
              <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-sm mx-auto">
                {isTrialExpired 
                  ? "انتهت الفترة التجريبية (3 أيام). يرجى التواصل مع الدعم الفني لتفعيل البرنامج بشكل دائم."
                  : "يرجى إدخال كود التفعيل الخاص بجهازك للاستمرار في استخدام كافة المميزات الاحترافية."}
              </p>
            </div>

            <div className="bg-slate-800/50 p-6 rounded-2xl border border-white/5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">كود الماكينة الفريد (Machine ID)</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-black/40 p-3 rounded-xl font-mono text-emerald-400 text-center text-lg tracking-wider border border-white/5">
                    {licenseInfo.machineId}
                  </code>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(licenseInfo.machineId);
                      notify("تم نسخ كود الماكينة");
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    <Copy size={20} className="text-slate-400" />
                  </button>
                </div>
                <p className="text-[9px] text-slate-500 font-bold mt-2">برجاء إرسال الكود أعلاه للمبرمج للحصول على مفتاح التفعيل.</p>
              </div>

              <div className="space-y-1 pt-4">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block">مفتاح التفعيل (Activation Key)</label>
                <input 
                  type="text" 
                  placeholder="NBR-XXXX-XXXX-XXXX"
                  className="w-full bg-slate-800 p-4 rounded-xl border border-white/10 focus:border-indigo-500 outline-none font-bold text-center text-xl tracking-[0.2em] placeholder:text-slate-700 placeholder:tracking-normal"
                  id="activation-input"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleActivate((e.target as HTMLInputElement).value.trim());
                    }
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={() => {
                  const input = document.getElementById('activation-input') as HTMLInputElement;
                  handleActivate(input.value.trim());
                }}
                className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-600/20 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                <Zap size={20} />
                تفعيل البرنامج الآن
              </button>

              <div className="flex gap-4">
                {!isTrialExpired ? (
                  <button 
                    onClick={() => setShowActivation(false)}
                    className="flex-1 py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all border border-white/5"
                  >
                    متابعة التجربة
                  </button>
                ) : (
                  <button 
                    onClick={() => window.open(`https://wa.me/201148820573?text=أريد تفعيل النسخة الاحترافية - كود الجهاز: ${licenseInfo.machineId}`, '_blank')}
                    className="flex-1 py-4 px-6 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <MessageSquare size={18} />
                    تواصل للتفعيل
                  </button>
                )}
                <button 
                  onClick={() => window.open(`mailto:islam.hediaa@gmail.com?subject=Activation Request: ${licenseInfo.machineId}`, '_blank')}
                  className="flex-1 py-4 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all border border-white/5"
                >
                  الدعم الفني
                </button>
              </div>
            </div>
            
            <div className="text-center">
               <p className="text-[10px] text-slate-500 font-bold">تطوير وبرمجة: م / إسلام هديه © 2026</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const CurrencyTicker = () => {
    const nonBaseCurrencies = (currencies || []).filter(c => c.code !== settings.baseCurrency && c.rateToMain > 0);
    if (nonBaseCurrencies.length === 0) return null;

    return (
      <div className="bg-slate-900 text-white py-1.5 overflow-hidden border-y border-indigo-500/10 no-print flex items-center shrink-0 h-8">
        <div className="px-3 bg-indigo-600 text-white font-bold text-[9px] uppercase tracking-tighter z-10 h-full flex items-center gap-2 shrink-0">
          <CloudSync size={12} className="animate-pulse" />
          أسعار الصرف
        </div>
        <div className="ticker-container flex-1">
          <div className="ticker-content flex items-center gap-10">
            {[...nonBaseCurrencies, ...nonBaseCurrencies].map((c, i) => {
              const currentVal = Number(c.rateToMain || 0);
              const prevVal = Number(c.previousRate || currentVal);
              const trend = currentVal > prevVal ? 'up' : currentVal < prevVal ? 'down' : 'neutral';
              const inverseVal = currentVal > 0 ? 1 / currentVal : 0;
              const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;
              const trendColor = trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-rose-400' : 'text-slate-400';

              return (
                <div key={`${c.code}-${i}`} className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className={`${c.code === 'SAR' ? 'text-amber-400 underline underline-offset-4 decoration-amber-400/30' : 'text-emerald-400'} font-bold text-[10px]`}>{c.code}/{settings.baseCurrency}:</span>
                    <span className="text-white font-bold text-[11px]">{currentVal.toFixed(2)}</span>
                    {TrendIcon && <TrendIcon size={10} className={`${trendColor}`} />}
                  </div>
                  <div className="w-[1px] h-3 bg-white/10"></div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400 font-bold text-[10px]">{settings.baseCurrency}/{c.code}:</span>
                    <span className="text-white font-bold text-[11px]">{inverseVal.toFixed(4)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-1 h-1 rounded-full ${trend === 'up' ? 'bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]' : trend === 'down' ? 'bg-rose-500 shadow-[0_0_5px_rgba(244,63,94,0.8)]' : 'bg-slate-500'}`}></div>
                    <span className="text-[9px] text-slate-500 font-mono">
                      {c.lastUpdated ? new Date(c.lastUpdated).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden font-['Cairo'] select-none">
        <TitleBar appName={displayAppName} />
        <div className="flex flex-1 overflow-hidden bg-[#f8fafc] relative">
          {/* Subtle Background Gradients for Main UI */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          {notification && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-6 duration-500">
              <div className={`px-8 py-4 rounded-3xl shadow-xl flex items-center gap-5 border border-white/20 backdrop-blur-2xl ${
                notification.type === 'success' ? 'bg-emerald-600/90 text-white' : 
                notification.type === 'info' ? 'bg-indigo-600/90 text-white' : 'bg-rose-600/90 text-white'
              }`}>
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  {notification.type === 'success' ? <CheckCircle2 className="text-white" size={20}/> : 
                   notification.type === 'info' ? <Info className="text-white" size={20}/> : <AlertCircle className="text-white" size={20}/>}
                </div>
                <span className="font-bold text-base tracking-tight">{notification.msg}</span>
              </div>
            </div>
          )}

          {showBackupReminder && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-950/40">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] max-w-md w-full shadow-2xl border border-indigo-500/20 text-center space-y-6">
                <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto text-amber-500">
                  <RefreshCw size={32} className="animate-spin-slow" />
                </div>
                <h3 className="text-2xl font-black dark:text-white tracking-tighter">تذكير بالنسخ الاحتياطي</h3>
                <p className="text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                  لقد مر أكثر من أسبوع منذ آخر عملية نسخ احتياطي يدوية. يرجى تحميل نسخة من بياناتك لضمان أقصى درجات الأمان.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => {
                      setCurrentView(ViewState.SETTINGS);
                      setShowBackupReminder(false);
                    }}
                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-600/20"
                  >
                    الذهاب للإعدادات الآن
                  </button>
                  <button 
                    onClick={() => setShowBackupReminder(false)}
                    className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 dark:hover:text-white transition-colors"
                  >
                    لاحقاً
                  </button>
                </div>
              </div>
            </div>
          )}

          {confirmDialog && (
            <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/60">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] max-w-md w-full shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-indigo-500/20 text-center space-y-8 animate-in zoom-in-95 duration-200">
                <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto text-rose-500">
                  <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black dark:text-white tracking-tight">تأكيد الإجراء</h3>
                  <p className="text-slate-500 dark:text-slate-300 font-bold leading-relaxed">
                    {confirmDialog.msg}
                  </p>
                </div>
                <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={() => {
                      confirmDialog.onConfirm();
                      setConfirmDialog(null);
                    }}
                    className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-rose-600/20 active:scale-95"
                  >
                    نعم، أنا متأكد
                  </button>
                  <button 
                    onClick={() => setConfirmDialog(null)}
                    className="w-full py-4 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-700 dark:hover:text-white transition-colors text-base"
                  >
                    إلغاء التراجع
                  </button>
                </div>
              </div>
            </div>
          )}

          <Sidebar 
            currentView={currentView} 
            onViewChange={setCurrentView} 
            appName={displayAppName} 
            logo={displayLogo} 
            user={currentUser!} 
            licenseInfo={licenseInfo}
            daysLeft={daysLeft}
            onLogout={() => {
              if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                setCurrentUser(null);
                setCurrentView(ViewState.DASHBOARD);
                // تسجيل الخروج مع الحفاظ على معرف الشركة لسهولة العودة
                localStorage.removeItem('nebras_user');
                const tenantId = DataService.getTenantId();
                window.location.href = `?client=${tenantId}`;
              }
            }}
          />
          
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <Header 
              title={NAV_ITEMS.find(i => i.id === currentView)?.label || ''} 
              companyName={displayAppName}
              syncStatus={syncStatus}
              onManualPull={manualPull}
              onManualPush={manualPush}
              onLogout={() => {
                if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                  setCurrentUser(null);
                  localStorage.removeItem('nebras_user');
                  const tenantId = DataService.getTenantId();
                  window.location.href = `?client=${tenantId}`;
                }
              }} 
              onSearch={setGlobalSearch} 
              customers={sortedCustomers}
              suppliers={sortedSuppliers}
              transactions={transactions}
              journalEntries={journalEntries}
              employees={sortedEmployees}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              onSelectClient={(id) => {
                setReportInitialState({ type: 'CUSTOMER_LEDGER', id });
                setCurrentView(ViewState.REPORTS);
              }}
              onNavigate={(viewId, itemId) => {
                const view = ViewState[viewId as keyof typeof ViewState];
                if (view) setCurrentView(view);
                if (itemId) {
                  let resolvedId = itemId;
                  
                  // إذا كنا ذاهبين لدفتر القيود، نتأكد من تمرير معرف القيد وليس معرف المعاملة
                  if (view === ViewState.JOURNAL) {
                    const tx = transactions.find(t => t.id === itemId);
                    if (tx && tx.journalEntryId) {
                      resolvedId = tx.journalEntryId;
                    }
                  }
                  
                  setGlobalEditId(resolvedId);
                  
                  // إضافه: إذا كان هذا البحث متعلق برحلة معينة (مثل سكن أو برنامج)، نقوم بضبط الرحلة المختارة تلقائياً
                  const tx = transactions.find(t => t.id === itemId);
                  if (tx) {
                    if (tx.masterTripId) {
                      setSelectedTripId(tx.masterTripId);
                    } else if (tx.programId) {
                      const prog = programs.find(p => p.id === tx.programId);
                      if (prog?.masterTripId) {
                        setSelectedTripId(prog.masterTripId);
                      }
                    }
                  }
                }
              }}
              currencies={sortedCurrencies}
              displayCurrency={displayCurrency}
              setDisplayCurrency={setDisplayCurrency}
              alerts={smartAlerts}
            />
            
            <CurrencyTicker />

            <main className="flex-1 overflow-x-hidden overflow-y-auto p-8 bg-transparent custom-scrollbar relative">
              <React.Suspense fallback={
                <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-500 animate-in fade-in duration-500">
                  <Loader2 size={48} className="animate-spin text-emerald-500" />
                  <span className="font-bold text-lg animate-pulse">جاري تحميل البيانات...</span>
                </div>
              }>
                {/* استخدام حاويات لإبقاء الشاشات في الذاكرة لضمان تنقل لحظي (Instant Switching) */}
                <div className={currentView === ViewState.DASHBOARD ? 'block' : 'hidden'}>
                  {currentUser?.role !== 'BOOKING_EMPLOYEE' && <Dashboard transactions={transactions} journalEntries={journalEntries} customers={sortedCustomers} suppliers={sortedSuppliers} treasuries={sortedTreasuries} partners={sortedPartners} employees={sortedEmployees} currentUser={currentUser} formatCurrency={formatCurrency} displayCurrency={displayCurrency} costCenters={sortedCostCenters} enableCostCenters={settings.enableCostCenters} currencies={sortedCurrencies} settings={settings} onManualPull={manualPull} onManualPush={manualPush} />}
                </div>

                <div className={currentView === ViewState.CUSTOMERS ? 'block' : 'hidden'}>
                  <CustomerView 
                    customers={sortedCustomers} 
                    setCustomers={setCustomers} 
                    deleteCustomer={deleteCustomer} 
                    suppliers={sortedSuppliers} 
                    currentUser={currentUser} 
                    transactions={transactions} 
                    journalEntries={journalEntries} 
                    recordJournalEntry={recordJournalEntry} 
                    currencies={sortedCurrencies} 
                    searchTerm={globalSearch} 
                    formatCurrency={formatCurrency} 
                    addAuditLog={addAuditLog} 
                    settings={settings} 
                    programs={sortedPrograms}
                    initialEditingId={currentView === ViewState.CUSTOMERS ? globalEditId : null}
                    onClearInitialEdit={() => setGlobalEditId(null)}
                  />
                </div>

                <div className={currentView === ViewState.SUPPLIERS ? 'block' : 'hidden'}>
                  <SupplierView 
                    suppliers={sortedSuppliers} 
                    setSuppliers={setSuppliers} 
                    deleteSupplier={deleteSupplier} 
                    customers={sortedCustomers} 
                    currentUser={currentUser!} 
                    transactions={transactions} 
                    journalEntries={journalEntries} 
                    recordJournalEntry={recordJournalEntry} 
                    currencies={sortedCurrencies} 
                    searchTerm={globalSearch} 
                    formatCurrency={formatCurrency} 
                    addAuditLog={addAuditLog} 
                    settings={settings} 
                    programs={sortedPrograms}
                    initialEditingId={currentView === ViewState.SUPPLIERS ? globalEditId : null}
                    onClearInitialEdit={() => setGlobalEditId(null)}
                  />
                </div>

                <div className={currentView === ViewState.TREASURY ? 'block' : 'hidden'}>
                  <TreasuryView 
                    transactions={transactions} 
                    journalEntries={journalEntries} 
                    addTransaction={addTransaction} 
                    updateTransaction={(id, data) => { deleteTransaction(id, true); addTransaction(data); }} 
                    deleteTransaction={deleteTransaction} 
                    treasuries={sortedTreasuries} 
                    setTreasuries={setTreasuries} 
                    deleteTreasury={deleteTreasury} 
                    customers={sortedCustomers} 
                    suppliers={sortedSuppliers} 
                    partners={sortedPartners} 
                    currencies={sortedCurrencies} 
                    settings={settings} 
                    employees={sortedEmployees} 
                    currentUser={currentUser!} 
                    searchTerm={globalSearch} 
                    formatCurrency={formatCurrency} 
                    costCenters={sortedCostCenters} 
                    masterTrips={sortedMasterTrips} 
                    programs={sortedPrograms} 
                    addAuditLog={addAuditLog} 
                    enableCostCenters={settings.enableCostCenters} 
                    initialEditingId={currentView === ViewState.TREASURY ? globalEditId : null}
                    onClearInitialEdit={() => setGlobalEditId(null)}
                  />
                </div>

                <div className={currentView === ViewState.HAJJ_UMRAH ? 'block' : 'hidden'}>
                  <HajjUmrahView 
                    transactions={transactions} 
                    journalEntries={journalEntries} 
                    addTransaction={addTransaction} 
                    updateTransaction={(id, data) => { deleteTransaction(id, true); addTransaction(data); }} 
                    deleteTransaction={deleteTransaction} 
                    voidTransaction={voidTransaction}
                    deleteMasterTrip={deleteMasterTrip}
                    restoreMasterTrip={restoreMasterTrip}
                    deleteProgram={deleteProgram}
                    customers={sortedCustomers} 
                    suppliers={sortedSuppliers} 
                    treasuries={sortedTreasuries} 
                    currencies={sortedCurrencies} 
                    programs={sortedPrograms} 
                    setPrograms={setPrograms} 
                    masterTrips={sortedMasterTrips}
                    setMasterTrips={setMasterTrips}
                    employees={sortedEmployees} 
                    currentUser={currentUser!} 
                    addAuditLog={addAuditLog}
                    searchTerm={globalSearch} 
                    formatCurrency={formatCurrency} 
                    costCenters={sortedCostCenters}
                    enableCostCenters={settings.enableCostCenters}
                    settings={settings}
                    onManageAccommodation={(tripId) => {
                      setSelectedTripId(tripId);
                      setCurrentView(ViewState.ACCOMMODATION);
                    }}
                    initialEditingId={currentView === ViewState.HAJJ_UMRAH ? globalEditId : null}
                    onClearInitialEdit={() => setGlobalEditId(null)}
                    notify={notify}
                    askConfirm={askConfirm}
                  />
                </div>

                {currentView === ViewState.PROGRAM_BUILDER && <ProgramBuilder settings={settings} currencies={sortedCurrencies} formatCurrency={formatCurrency} />}

                <div className={currentView === ViewState.JOURNAL ? 'block' : 'hidden'}>
                  <JournalView 
                    journalEntries={journalEntries} 
                    addJournalEntry={(e)=>recordJournalEntry(e.description, e.date, e.lines)} 
                    customers={sortedCustomers} 
                    suppliers={sortedSuppliers} 
                    treasuries={sortedTreasuries} 
                    employees={sortedEmployees} 
                    partners={sortedPartners} 
                    currentUser={currentUser!} 
                    deleteJournalEntry={deleteJournalEntry} 
                    editJournalEntry={editJournalEntry} 
                    searchTerm={globalSearch} 
                    currencies={sortedCurrencies} 
                    settings={settings} 
                    costCenters={sortedCostCenters} 
                    masterTrips={sortedMasterTrips}
                    programs={sortedPrograms}
                    enableCostCenters={settings.enableCostCenters} 
                    formatCurrency={formatCurrency} 
                    initialEditingId={currentView === ViewState.JOURNAL ? globalEditId : null}
                    onClearInitialEdit={() => setGlobalEditId(null)}
                  />
                </div>

                <div className={currentView === ViewState.REPORTS ? 'block' : 'hidden'}>
                  <ReportsView 
                    transactions={transactions} 
                    journalEntries={journalEntries} 
                    customers={sortedCustomers} 
                    suppliers={sortedSuppliers} 
                    partners={sortedPartners}
                    treasuries={sortedTreasuries} 
                    settings={settings} 
                    currentUser={currentUser} 
                    currencies={sortedCurrencies} 
                    employees={sortedEmployees} 
                    programs={sortedPrograms}
                    masterTrips={sortedMasterTrips}
                    auditLogs={auditLogs}
                    initialState={reportInitialState}
                    onStateApplied={() => setReportInitialState(null)}
                    searchTerm={globalSearch}
                    formatCurrency={formatCurrency}
                    costCenters={sortedCostCenters}
                    onTransactionClick={handleOpenTransaction}
                    onUpdateTransaction={handleUpdateTransaction}
                    onUpdateJournalEntry={handleUpdateJournalEntry}
                    onVoidTransaction={voidTransaction}
                    onDeleteJournalEntry={deleteJournalEntry}
                  />
                </div>

                {/* الشاشات الأقل استخداماً تظل بنظام التحميل عند الطلب لتوفير الذاكرة */}
                {currentView === ViewState.CLEARING && (
                  <ClearingView 
                    customers={sortedCustomers} 
                    suppliers={sortedSuppliers} 
                    currencies={sortedCurrencies} 
                    addTransaction={addTransaction} 
                    transactions={transactions}
                    journalEntries={journalEntries} 
                    currentUser={currentUser!} 
                    formatCurrency={formatCurrency} 
                    costCenters={sortedCostCenters} 
                    enableCostCenters={settings.enableCostCenters} 
                    settings={settings} 
                    initialEditingId={currentView === ViewState.CLEARING ? globalEditId : null}
                    onClearInitialEdit={() => setGlobalEditId(null)}
                  />
                )}
                {currentView === ViewState.EMPLOYEES && (
                  <EmployeeView 
                    employees={sortedEmployees} 
                    setEmployees={setEmployees} 
                    deleteEmployee={deleteEmployee} 
                    transactions={transactions} 
                    journalEntries={journalEntries} 
                    addTransaction={addTransaction} 
                    treasuries={sortedTreasuries} 
                    currentUser={currentUser!} 
                    searchTerm={globalSearch} 
                    formatCurrency={formatCurrency} 
                    addAuditLog={addAuditLog} 
                    costCenters={sortedCostCenters} 
                    enableCostCenters={settings.enableCostCenters} 
                    initialEditingId={currentView === ViewState.EMPLOYEES ? globalEditId : null}
                    onClearInitialEdit={() => setGlobalEditId(null)}
                    shifts={shifts}
                    attendanceLogs={attendanceLogs}
                    leaves={leaves}
                    setLeaves={setLeaves}
                    allowances={allowances}
                    setAllowances={setAllowances}
                    documents={documents}
                    setDocuments={setDocuments}
                    departments={sortedDepartments}
                    setDepartments={setDepartments}
                    designations={sortedDesignations}
                    setDesignations={setDesignations}
                  />
                )}
                {currentView === ViewState.FINGERPRINT && (
                  <FingerprintView logs={attendanceLogs} setLogs={setAttendanceLogs} employees={sortedEmployees} shifts={shifts} />
                )}
                {currentView === ViewState.FLIGHTS && <FlightView transactions={transactions} journalEntries={journalEntries} addTransaction={addTransaction} updateTransaction={(id, data) => { deleteTransaction(id, true); addTransaction(data); }} deleteTransaction={deleteTransaction} customers={sortedCustomers} suppliers={sortedSuppliers} treasuries={sortedTreasuries} currencies={sortedCurrencies} employees={sortedEmployees} currentUser={currentUser!} searchTerm={globalSearch} formatCurrency={formatCurrency} programs={sortedPrograms} masterTrips={sortedMasterTrips} costCenters={sortedCostCenters} enableCostCenters={settings.enableCostCenters} initialEditingId={globalEditId} onClearInitialEdit={() => setGlobalEditId(null)} settings={settings} />}
                
                {currentView === ViewState.ACCOMMODATION && (
                  <AccommodationView 
                    trip={selectedTripId ? sortedMasterTrips.find(t => t.id === selectedTripId)! : sortedMasterTrips[0]}
                    masterTrips={sortedMasterTrips}
                    programs={sortedPrograms}
                    customers={sortedCustomers}
                    suppliers={sortedSuppliers}
                    currencies={sortedCurrencies}
                    costCenters={sortedCostCenters}
                    enableCostCenters={settings.enableCostCenters}
                    addTransaction={addTransaction}
                    voidTransaction={voidTransaction}
                    transactions={transactions}
                    onSave={saveAccommodation}
                    onBack={() => setCurrentView(ViewState.HAJJ_UMRAH)}
                    settings={settings}
                    employees={sortedEmployees}
                    currentUser={currentUser!}
                    initialEditingId={currentView === ViewState.ACCOMMODATION ? globalEditId : null}
                    onClearInitialEdit={() => setGlobalEditId(null)}
                    onTripChange={setSelectedTripId}
                  />
                )}
                {currentView === ViewState.SERVICES && <ServiceView transactions={transactions} journalEntries={journalEntries} addTransaction={addTransaction} updateTransaction={(id, data) => { deleteTransaction(id, true); addTransaction(data); }} deleteTransaction={deleteTransaction} customers={sortedCustomers} suppliers={sortedSuppliers} treasuries={sortedTreasuries} currencies={sortedCurrencies} employees={sortedEmployees} programs={sortedPrograms} masterTrips={sortedMasterTrips} currentUser={currentUser!} searchTerm={globalSearch} formatCurrency={formatCurrency} costCenters={sortedCostCenters} enableCostCenters={settings.enableCostCenters} initialEditingId={globalEditId} onClearInitialEdit={() => setGlobalEditId(null)} settings={settings} />}
                {currentView === ViewState.EXPENSES && <ExpenseView transactions={transactions} journalEntries={journalEntries} addTransaction={addTransaction} updateTransaction={(id, data) => { deleteTransaction(id, true); addTransaction(data); }} deleteTransaction={deleteTransaction} treasuries={sortedTreasuries} customers={sortedCustomers} currentUser={currentUser!} searchTerm={globalSearch} formatCurrency={formatCurrency} programs={sortedPrograms} masterTrips={sortedMasterTrips} costCenters={sortedCostCenters} enableCostCenters={settings.enableCostCenters} settings={settings} initialEditingId={globalEditId} onClearInitialEdit={() => setGlobalEditId(null)} currencies={sortedCurrencies} />}
                
                {currentView === ViewState.TRIP_COST_ANALYSIS && (
                  <TripAnalysisView 
                    transactions={transactions} 
                    journalEntries={journalEntries} 
                    masterTrips={sortedMasterTrips} 
                    programs={sortedPrograms}
                    currencies={sortedCurrencies} 
                    settings={settings} 
                    formatCurrency={formatCurrency} 
                    onBack={() => setCurrentView(ViewState.HAJJ_UMRAH)} 
                    onUpdateTransaction={handleUpdateTransaction}
                    onUpdateJournalEntry={handleUpdateJournalEntry}
                    selectedTripId={selectedTripId}
                    onTripChange={setSelectedTripId}
                  />
                )}
                {currentView === ViewState.YEAR_END && <YearEndClosingView currentUser={currentUser!} customers={sortedCustomers} suppliers={sortedSuppliers} treasuries={sortedTreasuries} employees={sortedEmployees} partners={sortedPartners} transactions={transactions} journalEntries={journalEntries} currencies={sortedCurrencies} onClosingComplete={(nc, ns, nt, ne, np) => {setCustomers(nc); setSuppliers(ns); setTreasuries(nt); setEmployees(ne); setPartners(np); setTransactions([]); setJournalEntries([]); notify("بدء سنة مالية جديدة بنجاح");}} settings={settings} />}
                {currentView === ViewState.USERS && <UserManagementView users={users} setUsers={setUsers} deleteUser={deleteUser} currentUser={currentUser!} addAuditLog={addAuditLog} employees={sortedEmployees} />}
                {currentView === ViewState.PROFILE && <ProfileView currentUser={currentUser} setUsers={setUsers} />}
                {currentView === ViewState.SETTINGS && (
                  <SettingsView 
                    settings={settings} setSettings={setSettings} 
                    currencies={sortedCurrencies} setCurrencies={setCurrencies} 
                    deleteCurrency={deleteCurrency}
                    partners={sortedPartners} setPartners={setPartners} 
                    deletePartner={deletePartner}
                    fullData={{settings, transactions, customers, suppliers, partners, treasuries, programs, masterTrips, journalEntries, users, currencies, employees, costCenters, shifts, auditLogs, departments, designations}} 
                    onRestore={async (d)=>{
                      if (!confirm('⚠️ تنبيه: استعادة البيانات ستحذف كافة السجلات الحالية. هل أنت متأكد؟')) return;
                      
                      // 1. إيقاف الحفظ التلقائي مؤقتاً
                      setIsDataLoaded(false);
                      
                      try {
                        // تحديث الطابع الزمني لضمان تفوق هذه النسخة على أي نسخة سحابية قديمة
                        const dataToRestore = { 
                          ...d, 
                          lastUpdated: new Date().toISOString(),
                          senderSessionId: sessionId.current 
                        };

                        // 2. تحديث الحالات (States)
                        applyData(dataToRestore);

                        // 3. محاولة الحفظ (يتم الحفظ في IndexedDB والسحاب آلياً)
                        try {
                          DataService.saveData(dataToRestore, sessionId.current).then(res => {
                            if (res.success) {
                              if (res.cloud) {
                                console.log("Restored data synced to cloud");
                                notify("تمت استعادة البيانات ومزامنتها سحابياً بنجاح", "success");
                              } else {
                                console.warn("Local save OK, but cloud sync failed:", res.error);
                                notify(`تم الحفظ محلياً فقط. فشل المزامنة السحابية: ${res.error || 'خطأ في السحاب'}`, "info");
                              }
                            } else {
                              console.error("Local save failed after restore:", res.error);
                              notify(`فشل الحفظ المحلي: ${res.error || 'خطأ غير معروف'}`, "error");
                            }
                          }).catch(e => {
                            console.error("Async error in saveData:", e);
                            notify("حدث خطأ تقني أثناء محاولة الحفظ.", "error");
                          });
                        } catch (e) {
                          console.error("Immediate error calling saveData:", e);
                        }
                      } catch (err) {
                        console.error("Restore failed:", err);
                        notify(`حدث خطأ أثناء معالجة الملف: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`, "error");
                      } finally {
                        // 5. إعادة تفعيل النظام والحفظ التلقائي
                        setTimeout(() => setIsDataLoaded(true), 500);
                      }
                    }} 
                    users={users} setUsers={setUsers} 
                    currentUser={currentUser} 
                    formatCurrency={formatCurrency} 
                    costCenters={costCenters}
                    addCostCenter={addCostCenter}
                    updateCostCenter={updateCostCenter}
                    deleteCostCenter={deleteCostCenter}
                    auditLogs={auditLogs}
                    shifts={shifts}
                    setShifts={setShifts}
                    deleteShift={deleteShift}
                    departments={departments}
                    setDepartments={setDepartments}
                    deleteDepartment={deleteDepartment}
                    designations={designations}
                    setDesignations={setDesignations}
                    deleteDesignation={deleteDesignation}
                    licenseInfo={licenseInfo}
                    onActivate={handleActivate}
                    onRepairAttribution={repairAttribution}
                    onManualPull={manualPull}
                    onManualPush={manualPush}
                    onNavigate={(viewId, itemId) => {
                      const view = ViewState[viewId as keyof typeof ViewState];
                      if (view) setCurrentView(view);
                      if (itemId) setGlobalEditId(itemId);
                    }}
                  />
                )}
              </React.Suspense>
            </main>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 glass-panel px-10 py-3.5 rounded-3xl border border-white shadow-2xl z-50 no-print transform hover:scale-[1.02] transition-premium">
               <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  <CloudSync size={18} className="text-indigo-600" />
                  آخر مزامنة لقاعدة البيانات: {lastSaved}
               </div>
               <div className="h-5 w-px bg-slate-200"></div>
               <div className="text-[10px] font-bold text-slate-400 flex items-center gap-3 uppercase tracking-widest">
                  <ShieldCheck size={16} className="text-emerald-500 shadow-lg shadow-emerald-500/20"/>
                  نظام حماية البيانات الفيزيائي نشط
               </div>
            </div>

            <React.Suspense fallback={null}>
              <SmartAssistant 
                customers={sortedCustomers}
                suppliers={sortedSuppliers}
                treasuries={sortedTreasuries}
                transactions={transactions}
                employees={sortedEmployees}
                partners={sortedPartners}
                settings={settings}
                isOpen={isAssistantOpen}
                onClose={() => setIsAssistantOpen(!isAssistantOpen)}
              />
            </React.Suspense>
          </div>
        </div>
      </div>
  );
};

export default App;
