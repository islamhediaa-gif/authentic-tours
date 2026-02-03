
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Globe, X, Printer, Ban, Edit2, Hotel, Tag, Calendar, Briefcase, ChevronLeft, MapPin, MoonStar, Contact2, User, Trash2, Save, BadgeDollarSign, Percent, TrendingUp, TrendingDown, Activity, Layers, Package, FileText, ShieldCheck, Plane, Calculator, AlertCircle, RotateCcw
} from 'lucide-react';
import { Transaction, Customer, Supplier, Treasury, Currency, Program, Employee, UmrahComponent, MasterTrip, User as UserType, CostCenter, JournalEntry } from '../types';
import SearchableSelect from './SearchableSelect';
import { compareArabic } from '../utils/arabicUtils';

interface HajjUmrahViewProps {
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  addTransaction: (tx: any) => void;
  updateTransaction: (id: string, tx: any) => void;
  deleteTransaction: (id: string) => void;
  voidTransaction: (id: string, silent?: boolean) => void;
  deleteMasterTrip: (id: string) => void;
  restoreMasterTrip: (id: string) => void;
  deleteProgram: (id: string) => void;
  customers: Customer[];
  suppliers: Supplier[];
  treasuries: Treasury[];
  currencies: Currency[];
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
  masterTrips: MasterTrip[];
  setMasterTrips: React.Dispatch<React.SetStateAction<MasterTrip[]>>;
  employees: Employee[];
  currentUser: UserType;
  addAuditLog: (action: any, entityType: any, entityId: string, details: string, oldV?: any, newV?: any) => void;
  searchTerm?: string;
  formatCurrency: (amount: number) => string;
  costCenters: CostCenter[];
  enableCostCenters?: boolean;
  onManageAccommodation?: (tripId: string) => void;
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
  settings: any;
  notify: (msg: string, type?: 'success' | 'error' | 'info') => void;
  askConfirm: (msg: string, onConfirm: () => void) => void;
}

const INITIAL_PROGRAM_FORM = {
  name: '', masterTripId: '', customerId: '', supplierId: '', supplierType: 'SUPPLIER' as 'SUPPLIER' | 'CUSTOMER' | 'TREASURY', 
  purchasePrice: '', sellingPrice: '', 
  adultPurchasePrice: '', childPurchasePrice: '', infantPurchasePrice: '',
  singlePurchasePrice: '', singleChildPurchasePrice: '', singleInfantPurchasePrice: '',
  doublePurchasePrice: '', doubleChildPurchasePrice: '', doubleInfantPurchasePrice: '',
  triplePurchasePrice: '', tripleChildPurchasePrice: '', tripleInfantPurchasePrice: '',
  quadPurchasePrice: '', quadChildPurchasePrice: '', quadInfantPurchasePrice: '',
  adultSellingPrice: '', childSellingPrice: '', infantSellingPrice: '',
  singleSellingPrice: '', singleChildSellingPrice: '', singleInfantSellingPrice: '',
  doubleSellingPrice: '', doubleChildSellingPrice: '', doubleInfantSellingPrice: '',
  tripleSellingPrice: '', tripleChildSellingPrice: '', tripleInfantSellingPrice: '',
  quadSellingPrice: '', quadChildSellingPrice: '', quadInfantSellingPrice: '',
  adultAgentPrice: '', childAgentPrice: '', infantAgentPrice: '',
  singleAgentPrice: '', doubleAgentPrice: '', tripleAgentPrice: '', quadAgentPrice: '',
  type: 'UMRAH' as 'HAJJ' | 'UMRAH' | 'INDIVIDUAL_UMRAH' | 'GENERAL', date: new Date().toISOString().split('T')[0], currencyCode: 'EGP', exchangeRate: '1', components: [] as UmrahComponent[],
  adultCount: '0', childCount: '0', infantCount: '0', roomType: 'DEFAULT' as 'DEFAULT' | 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD',
  // Counts for all room types
  singleAdultCount: '0', singleChildCount: '0', singleInfantCount: '0',
  doubleAdultCount: '0', doubleChildCount: '0', doubleInfantCount: '0',
  tripleAdultCount: '0', tripleChildCount: '0', tripleInfantCount: '0',
  quadAdultCount: '0', quadChildCount: '0', quadInfantCount: '0',
  isAgent: false,
  employeeId: '',
  employeeCommissionRate: '',
  commissionAmount: '',
  applyCommission: true
};

const INITIAL_BOOKING_FORM = {
  programId: '', customerId: '', agentId: '', bookingType: 'DIRECT' as 'DIRECT' | 'AGENT' | 'SUPERVISOR',
  employeeId: '', accommodationEmployeeId: '', accommodation: '', names: '', roomType: 'DEFAULT' as 'DEFAULT' | 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD', discount: '0', date: new Date().toISOString().split('T')[0], 
  customSellingPrice: '', adultCount: '1', childCount: '0', infantCount: '0', supervisorCount: '0', supervisorName: '', employeeCommissionRate: '', commissionAmount: '', applyCommission: true, costCenterId: ''
};

const INITIAL_COMPONENT_FORM = {
  type: 'FLIGHT' as 'EXPENSE' | 'FLIGHT' | 'VISA' | 'HOTEL' | 'INTERNAL_TRANSPORT' | 'SAUDI_TRANSPORT' | 'GUARANTEE_LETTER' | 'GIFTS_AND_PRINTS', 
  name: '', 
  pricingMode: 'PER_PERSON' as 'PER_PERSON' | 'TOTAL',
  quantity: '1',
  purchasePrice: '', 
  sellingPrice: '', 
  adultPurchasePrice: '',
  childPurchasePrice: '',
  infantPurchasePrice: '',
  singlePurchasePrice: '',
  singleChildPurchasePrice: '',
  singleInfantPurchasePrice: '',
  doublePurchasePrice: '',
  doubleChildPurchasePrice: '',
  doubleInfantPurchasePrice: '',
  triplePurchasePrice: '',
  tripleChildPurchasePrice: '',
  tripleInfantPurchasePrice: '',
  quadPurchasePrice: '',
  quadChildPurchasePrice: '',
  quadInfantPurchasePrice: '',
  adultSellingPrice: '',
  childSellingPrice: '',
  infantSellingPrice: '',
  singleSellingPrice: '',
  singleChildSellingPrice: '',
  singleInfantSellingPrice: '',
  doubleSellingPrice: '',
  doubleChildSellingPrice: '',
  doubleInfantSellingPrice: '',
  tripleSellingPrice: '',
  tripleChildSellingPrice: '',
  tripleInfantSellingPrice: '',
  quadSellingPrice: '',
  quadChildSellingPrice: '',
  quadInfantSellingPrice: '',
  currencyCode: 'EGP', 
  exchangeRate: '1', 
  supplierId: '', 
  details: '', 
  supplierType: 'SUPPLIER' as 'SUPPLIER' | 'CUSTOMER' | 'TREASURY',
  isCommissionable: true,
  employeeId: '',
  commissionAmount: 0
};

const HajjUmrahView: React.FC<HajjUmrahViewProps> = ({
  transactions, journalEntries, addTransaction, updateTransaction, deleteTransaction, voidTransaction, deleteMasterTrip, restoreMasterTrip, deleteProgram, customers, suppliers, treasuries, currencies, programs, setPrograms, 
  masterTrips, setMasterTrips, employees, currentUser, addAuditLog, searchTerm = '',
  formatCurrency, costCenters, enableCostCenters, onManageAccommodation, initialEditingId, onClearInitialEdit, settings, notify, askConfirm
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const otherBalances = useMemo(() => {
    const cust: Record<string, number> = {};
    const supp: Record<string, number> = {};

    (customers || []).forEach(c => { if (c && c.id) cust[c.id] = c.openingBalanceInBase || 0; });
    (suppliers || []).forEach(s => { if (s && s.id) supp[s.id] = s.openingBalanceInBase || 0; });

    (journalEntries || []).forEach(entry => {
      (entry?.lines || []).forEach(line => {
        if (!line || !line.accountId) return;
        const debit = typeof line.debit === 'number' ? line.debit : parseFloat(line.debit as any) || 0;
        const credit = typeof line.credit === 'number' ? line.credit : parseFloat(line.credit as any) || 0;

        if (line.accountType === 'CUSTOMER' && cust[line.accountId] !== undefined) {
          cust[line.accountId] += debit - credit;
        } else if (line.accountType === 'SUPPLIER' && supp[line.accountId] !== undefined) {
          supp[line.accountId] += credit - debit;
        }
      });
    });

    return { customers: cust, suppliers: supp };
  }, [customers, suppliers, journalEntries]);

  const [activeTab, setActiveTab] = useState<'PROGRAMS' | 'BOOKINGS' | 'GUARANTEES' | 'VISA_MANAGEMENT' | 'MASTER_TRIPS'>('PROGRAMS');
  const [pricingActiveTab, setPricingActiveTab] = useState<'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD'>('SINGLE');
  const [compPricingActiveTab, setCompPricingActiveTab] = useState<'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD'>('SINGLE');
  
  const stats = useMemo(() => {
    const safePrograms = Array.isArray(programs) ? programs : [];
    const totalPrograms = safePrograms.length;
    const bookingTxs = (transactions || []).filter(t => t && !t.isVoided && (t.category === 'HAJJ' || t.category === 'UMRAH') && t.type === 'INCOME');
    const totalBookings = bookingTxs.length;
    const revenue = bookingTxs.reduce((s, t) => s + (t?.amountInBase || 0), 0);
    const today = new Date().getTime();
    const activePrograms = safePrograms.filter(p => p && p.date && new Date(p.date).getTime() >= today).length;
    const openGuarantees = (transactions || []).filter(t => t && !t.isVoided && t.category === 'GUARANTEE_LETTER' && t.type === 'EXPENSE').length;
    const releasedGuarantees = (transactions || []).filter(t => t && !t.isVoided && t.category === 'GUARANTEE_LETTER' && t.type === 'INCOME').length;
    return { totalPrograms, totalBookings, revenue, activePrograms, openGuarantees, releasedGuarantees };
  }, [programs, transactions]);

  const [showAddProgram, setShowAddProgram] = useState(false);
  const [showAddBooking, setShowAddBooking] = useState(false);
  const [showAddGuarantee, setShowAddGuarantee] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  const [showAddComponent, setShowAddComponent] = useState(false);
  const [editingComponentId, setEditingComponentId] = useState<string | null>(null);
  const [guaranteeForm, setGuaranteeForm] = useState({
    supplierId: '',
    programId: '',
    amount: '',
    currencyCode: (settings?.baseCurrency || 'EGP'),
    exchangeRate: '1',
    treasuryId: '',
    date: new Date().toISOString().split('T')[0],
    details: '',
    costCenterId: ''
  });
  const [componentForm, setComponentForm] = useState(() => ({
    ...INITIAL_COMPONENT_FORM,
    currencyCode: (settings?.baseCurrency || 'EGP')
  }));
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [showRoomingListId, setShowRoomingListId] = useState<string | null>(null);
  const [showAddMasterTrip, setShowAddMasterTrip] = useState(false);
  const [showVoidedTrips, setShowVoidedTrips] = useState(false);
  const [editingMasterTripId, setEditingMasterTripId] = useState<string | null>(null);
  const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [showReturnSelectionModal, setShowReturnSelectionModal] = useState(false);
  const [showReturnForm, setShowReturnForm] = useState(false);
  const [returnFormData, setReturnFormData] = useState({
    programId: '',
    componentId: '',
    compName: '',
    supplierName: '',
    originalQuantity: 1,
    quantity: '1',
    amount: '',
    currencyCode: 'EGP',
    exchangeRate: '1',
    supplierId: '',
    supplierType: 'SUPPLIER'
  });

  useEffect(() => {
    if (initialEditingId) {
      const tx = (transactions || []).find(t => t?.id === initialEditingId);
      if (tx) {
        setActiveTab('BOOKINGS');
        setHighlightedId(tx.id);
        setTimeout(() => {
          const element = document.getElementById(`booking-${tx.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 500);
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, transactions, onClearInitialEdit]);

  const [masterTripForm, setMasterTripForm] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0],
    type: 'UMRAH' as 'UMRAH' | 'HAJJ' | 'GENERAL',
    details: '',
    components: [] as UmrahComponent[]
  });

  const handleRoomingListPrint = () => {
    // Wait for a small delay to ensure DOM is updated with the selected program data
    setTimeout(() => {
      const previewContent = document.getElementById('rooming-list-to-print');
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
      } else {
        notify("خطأ: لم يتم العثور على محتوى للطباعة", "error");
      }
    }, 300);
  };

  const [tempPurchasePrice, setTempPurchasePrice] = useState('');
  const [tempSellingPrice, setTempSellingPrice] = useState('');

  const supplierQuotas = useMemo(() => {
    const quotas: Record<string, { used: number, total: number }> = {};
    (suppliers || []).forEach(s => {
      if (s && s.id && s.isSaudiWallet) {
        const used = (transactions || []).filter(t => t && !t.isVoided && (t.supplierId === s.id || t.relatedEntityId === s.id) && (t.category === 'HAJJ' || t.category === 'UMRAH')).reduce((sum, t) => sum + (parseInt(t?.adultCount as any) || 0) + (parseInt(t?.childCount as any) || 0), 0);
        quotas[s.id] = { used, total: parseInt(s.visaQuota as any) || 0 };
      }
    });
    return quotas;
  }, [suppliers, transactions]);

  const [programForm, setProgramForm] = useState(() => ({
    ...INITIAL_PROGRAM_FORM,
    currencyCode: (settings?.baseCurrency || 'EGP')
  }));

  const [bookingForm, setBookingForm] = useState(INITIAL_BOOKING_FORM);

  useEffect(() => {
    if (isBookingEmployee && !bookingForm.employeeId && !editingBookingId && currentUser?.employeeId) {
      setBookingForm(prev => ({ ...prev, employeeId: currentUser.employeeId || '' }));
    } else if (isBookingEmployee && !bookingForm.employeeId && !editingBookingId) {
      const emp = (employees || []).find(e => e && compareArabic(e.name || '', currentUser?.name || ''));
      if (emp) setBookingForm(prev => ({ ...prev, employeeId: emp.id }));
    }
  }, [isBookingEmployee, currentUser, employees, bookingForm.employeeId, editingBookingId]);

  useEffect(() => {
    if (isBookingEmployee && !programForm.employeeId && !editingProgramId && currentUser?.employeeId) {
      setProgramForm(prev => ({ ...prev, employeeId: currentUser.employeeId || '' }));
    } else if (isBookingEmployee && !programForm.employeeId && !editingProgramId) {
      const emp = (employees || []).find(e => e && compareArabic(e.name || '', currentUser?.name || ''));
      if (emp) setProgramForm(prev => ({ ...prev, employeeId: emp.id }));
    }
  }, [isBookingEmployee, currentUser, employees, programForm.employeeId, editingProgramId]);

  useEffect(() => {
    if (isBookingEmployee && !componentForm.employeeId && !editingComponentId && currentUser?.employeeId) {
      setComponentForm(prev => ({ ...prev, employeeId: currentUser.employeeId || '' }));
    } else if (isBookingEmployee && !componentForm.employeeId && !editingComponentId) {
      const emp = (employees || []).find(e => e && compareArabic(e.name || '', currentUser?.name || ''));
      if (emp) setComponentForm(prev => ({ ...prev, employeeId: emp.id }));
    }
  }, [isBookingEmployee, currentUser, employees, componentForm.employeeId, editingComponentId]);

  useEffect(() => {
    if (bookingForm.programId) {
      const selected = (programs || []).find(p => p.id === bookingForm.programId);
      if (selected) {
        const adultCount = parseInt(bookingForm.adultCount || '0');
        const childCount = parseInt(bookingForm.childCount || '0');
        const infantCount = parseInt(bookingForm.infantCount || '0');
        
        const adultSelling = 
          bookingForm.bookingType === 'AGENT' ? (
            bookingForm.roomType === 'SINGLE' ? (selected.singleAgentPrice || selected.adultAgentPrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (selected.doubleAgentPrice || selected.adultAgentPrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (selected.tripleAgentPrice || selected.adultAgentPrice || 0) :
            bookingForm.roomType === 'QUAD' ? (selected.quadAgentPrice || selected.adultAgentPrice || 0) :
            (selected.adultAgentPrice || 0)
          ) : (
            bookingForm.roomType === 'SINGLE' ? (selected.singleSellingPrice || selected.adultSellingPrice || selected.sellingPrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (selected.doubleSellingPrice || selected.adultSellingPrice || selected.sellingPrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (selected.tripleSellingPrice || selected.adultSellingPrice || selected.sellingPrice || 0) :
            bookingForm.roomType === 'QUAD' ? (selected.quadSellingPrice || selected.adultSellingPrice || selected.sellingPrice || 0) :
            (selected.adultSellingPrice || selected.sellingPrice || 0)
          );
        
        const childSelling = 
          bookingForm.bookingType === 'AGENT' ? (selected.childAgentPrice || 0) : (
            bookingForm.roomType === 'SINGLE' ? (selected.singleChildSellingPrice || selected.childSellingPrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (selected.doubleChildSellingPrice || selected.childSellingPrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (selected.tripleChildSellingPrice || selected.childSellingPrice || 0) :
            bookingForm.roomType === 'QUAD' ? (selected.quadChildSellingPrice || selected.childSellingPrice || 0) :
            (selected.childSellingPrice || 0)
          );

        const infantSelling = 
          bookingForm.bookingType === 'AGENT' ? (selected.infantAgentPrice || 0) : (
            bookingForm.roomType === 'SINGLE' ? (selected.singleInfantSellingPrice || selected.infantSellingPrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (selected.doubleInfantSellingPrice || selected.infantSellingPrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (selected.tripleInfantSellingPrice || selected.infantSellingPrice || 0) :
            bookingForm.roomType === 'QUAD' ? (selected.quadInfantSellingPrice || selected.infantSellingPrice || 0) :
            (selected.infantSellingPrice || 0)
          );
        
        const total = (adultCount * adultSelling) + (childCount * childSelling) + (infantCount * infantSelling);
        setBookingForm(prev => ({ ...prev, customSellingPrice: total.toString() }));
      }
    }
  }, [bookingForm.programId, bookingForm.adultCount, bookingForm.childCount, bookingForm.infantCount, bookingForm.roomType, bookingForm.bookingType, programs]);

  // تحديث النسبة الافتراضية عند اختيار الموظف
  useEffect(() => {
    if (bookingForm.employeeId && !editingBookingId && !bookingForm.employeeCommissionRate) {
      const emp = (employees || []).find(e => e.id === bookingForm.employeeId);
      if (emp) setBookingForm(prev => ({ ...prev, employeeCommissionRate: emp.commissionRate.toString() }));
    }
  }, [bookingForm.employeeId, employees, editingBookingId]);

  const handleMasterTripSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMasterTripId) {
      const oldTrip = (masterTrips || []).find(mt => mt.id === editingMasterTripId);
      const updatedTrip = { ...oldTrip, ...masterTripForm };
      addAuditLog('UPDATE', 'SETTINGS', editingMasterTripId, `تعديل الرحلة المجمعة: ${masterTripForm.name}`, oldTrip, updatedTrip);
      setMasterTrips(prev => (prev || []).map(mt => mt.id === editingMasterTripId ? updatedTrip : mt));
    } else {
      const newMasterTrip: MasterTrip = {
        id: Date.now().toString(),
        ...masterTripForm,
        accommodation: {
          mecca: { hotelName: '', rooms: [] },
          medina: { hotelName: '', rooms: [] }
        }
      };
      addAuditLog('CREATE', 'SETTINGS', newMasterTrip.id, `إضافة رحلة مجمعة جديدة: ${newMasterTrip.name}`, undefined, newMasterTrip);
      setMasterTrips(prev => [...(prev || []), newMasterTrip]);
    }
    setShowAddMasterTrip(false);
    setEditingMasterTripId(null);
    setMasterTripForm({
      name: '',
      date: new Date().toISOString().split('T')[0],
      type: 'UMRAH',
      details: '',
      components: []
    });
  };

  const startEditMasterTrip = (trip: MasterTrip) => {
    setEditingMasterTripId(trip.id);
    setMasterTripForm({
      name: trip.name,
      date: trip.date,
      type: trip.type,
      details: trip.details || '',
      components: trip.components || []
    });
    setShowAddMasterTrip(true);
  };


  const handleProgramSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let purchasePrice = parseFloat(programForm.purchasePrice || '0');
    let sellingPrice = parseFloat(programForm.sellingPrice || '0');
    
    let adultPurchasePrice = parseFloat(programForm.adultPurchasePrice || programForm.purchasePrice || '0');
    let childPurchasePrice = parseFloat(programForm.childPurchasePrice || '0');
    let infantPurchasePrice = parseFloat(programForm.infantPurchasePrice || '0');
    let singlePurchasePrice = parseFloat(programForm.singlePurchasePrice || '0');
    let singleChildPurchasePrice = parseFloat(programForm.singleChildPurchasePrice || '0');
    let singleInfantPurchasePrice = parseFloat(programForm.singleInfantPurchasePrice || '0');
    let doublePurchasePrice = parseFloat(programForm.doublePurchasePrice || '0');
    let doubleChildPurchasePrice = parseFloat(programForm.doubleChildPurchasePrice || '0');
    let doubleInfantPurchasePrice = parseFloat(programForm.doubleInfantPurchasePrice || '0');
    let triplePurchasePrice = parseFloat(programForm.triplePurchasePrice || '0');
    let tripleChildPurchasePrice = parseFloat(programForm.tripleChildPurchasePrice || '0');
    let tripleInfantPurchasePrice = parseFloat(programForm.tripleInfantPurchasePrice || '0');
    let quadPurchasePrice = parseFloat(programForm.quadPurchasePrice || '0');
    let quadChildPurchasePrice = parseFloat(programForm.quadChildPurchasePrice || '0');
    let quadInfantPurchasePrice = parseFloat(programForm.quadInfantPurchasePrice || '0');

    let adultSellingPrice = parseFloat(programForm.adultSellingPrice || programForm.sellingPrice || '0');
    let childSellingPrice = parseFloat(programForm.childSellingPrice || '0');
    let infantSellingPrice = parseFloat(programForm.infantSellingPrice || '0');
    let singleSellingPrice = parseFloat(programForm.singleSellingPrice || '0');
    let singleChildSellingPrice = parseFloat(programForm.singleChildSellingPrice || '0');
    let singleInfantSellingPrice = parseFloat(programForm.singleInfantSellingPrice || '0');
    let doubleSellingPrice = parseFloat(programForm.doubleSellingPrice || '0');
    let doubleChildSellingPrice = parseFloat(programForm.doubleChildSellingPrice || '0');
    let doubleInfantSellingPrice = parseFloat(programForm.doubleInfantSellingPrice || '0');
    let tripleSellingPrice = parseFloat(programForm.tripleSellingPrice || '0');
    let tripleChildSellingPrice = parseFloat(programForm.tripleChildSellingPrice || '0');
    let tripleInfantSellingPrice = parseFloat(programForm.tripleInfantSellingPrice || '0');
    let quadSellingPrice = parseFloat(programForm.quadSellingPrice || '0');
    let quadChildSellingPrice = parseFloat(programForm.quadChildSellingPrice || '0');
    let quadInfantSellingPrice = parseFloat(programForm.quadInfantSellingPrice || '0');

    const hasManualPricing = purchasePrice > 0 || sellingPrice > 0 || adultPurchasePrice > 0 || adultSellingPrice > 0 || singlePurchasePrice > 0 || doublePurchasePrice > 0 || triplePurchasePrice > 0 || quadPurchasePrice > 0;

    const comps = programForm.components || [];
    if (comps.length > 0 && !hasManualPricing) {
      purchasePrice = comps.reduce((sum, c) => sum + (c?.purchasePrice || 0), 0);
      sellingPrice = comps.reduce((sum, c) => sum + (c?.sellingPrice || 0), 0);
      adultPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum + (c.purchasePrice || 0);
        return sum + (c?.adultPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      childPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.childPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      infantPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.infantPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      singlePurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.singlePurchasePrice || c?.purchasePrice || 0);
      }, 0);
      singleChildPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.singleChildPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      singleInfantPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.singleInfantPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      doublePurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.doublePurchasePrice || c?.purchasePrice || 0);
      }, 0);
      doubleChildPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.doubleChildPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      doubleInfantPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.doubleInfantPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      triplePurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.triplePurchasePrice || c?.purchasePrice || 0);
      }, 0);
      tripleChildPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.tripleChildPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      tripleInfantPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.tripleInfantPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      quadPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.quadPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      quadChildPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.quadChildPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      quadInfantPurchasePrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.quadInfantPurchasePrice || c?.purchasePrice || 0);
      }, 0);
      
      adultSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum + (c.sellingPrice || 0);
        return sum + (c?.adultSellingPrice || c?.sellingPrice || 0);
      }, 0);
      childSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.childSellingPrice || c?.sellingPrice || 0);
      }, 0);
      infantSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.infantSellingPrice || c?.sellingPrice || 0);
      }, 0);
      singleSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.singleSellingPrice || c?.sellingPrice || 0);
      }, 0);
      singleChildSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.singleChildSellingPrice || c?.sellingPrice || 0);
      }, 0);
      singleInfantSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.singleInfantSellingPrice || c?.sellingPrice || 0);
      }, 0);
      doubleSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.doubleSellingPrice || c?.sellingPrice || 0);
      }, 0);
      doubleChildSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.doubleChildSellingPrice || c?.sellingPrice || 0);
      }, 0);
      doubleInfantSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.doubleInfantSellingPrice || c?.sellingPrice || 0);
      }, 0);
      tripleSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.tripleSellingPrice || c?.sellingPrice || 0);
      }, 0);
      tripleChildSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.tripleChildSellingPrice || c?.sellingPrice || 0);
      }, 0);
      tripleInfantSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.tripleInfantSellingPrice || c?.sellingPrice || 0);
      }, 0);
      quadSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.quadSellingPrice || c?.sellingPrice || 0);
      }, 0);
      quadChildSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.quadChildSellingPrice || c?.sellingPrice || 0);
      }, 0);
      quadInfantSellingPrice = comps.reduce((sum, c) => {
        if (c?.pricingMode === 'TOTAL') return sum;
        return sum + (c?.quadInfantSellingPrice || c?.sellingPrice || 0);
      }, 0);
    }
    const newProgram: Program = {
      id: editingProgramId || Date.now().toString(),
      name: programForm.name,
      masterTripId: programForm.masterTripId || undefined,
      customerId: programForm.customerId || undefined,
      supplierId: programForm.supplierId,
      supplierType: programForm.supplierType,
      purchasePrice,
      sellingPrice,
      adultPurchasePrice,
      childPurchasePrice,
      infantPurchasePrice,
      singlePurchasePrice,
      singleChildPurchasePrice,
      singleInfantPurchasePrice,
      doublePurchasePrice,
      doubleChildPurchasePrice,
      doubleInfantPurchasePrice,
      triplePurchasePrice,
      tripleChildPurchasePrice,
      tripleInfantPurchasePrice,
      quadPurchasePrice,
      quadChildPurchasePrice,
      quadInfantPurchasePrice,
      adultSellingPrice,
      childSellingPrice,
      infantSellingPrice,
      singleSellingPrice,
      singleChildSellingPrice,
      singleInfantSellingPrice,
      doubleSellingPrice,
      doubleChildSellingPrice,
      doubleInfantSellingPrice,
      tripleSellingPrice,
      tripleChildSellingPrice,
      tripleInfantSellingPrice,
      quadSellingPrice,
      quadChildSellingPrice,
      quadInfantSellingPrice,

      // Agent Pricing
      adultAgentPrice: parseFloat(programForm.adultAgentPrice || '0'),
      childAgentPrice: parseFloat(programForm.childAgentPrice || '0'),
      infantAgentPrice: parseFloat(programForm.infantAgentPrice || '0'),
      singleAgentPrice: parseFloat(programForm.singleAgentPrice || '0'),
      doubleAgentPrice: parseFloat(programForm.doubleAgentPrice || '0'),
      tripleAgentPrice: parseFloat(programForm.tripleAgentPrice || '0'),
      quadAgentPrice: parseFloat(programForm.quadAgentPrice || '0'),

      type: programForm.type,
      date: programForm.date,
      currencyCode: programForm.currencyCode,
      exchangeRate: parseFloat(programForm.exchangeRate || '1'),
      components: programForm.components,
      adultCount: parseInt(programForm.adultCount || '0'),
      childCount: parseInt(programForm.childCount || '0'),
      infantCount: parseInt(programForm.infantCount || '0'),
      singleAdultCount: parseInt(programForm.singleAdultCount || '0'),
      singleChildCount: parseInt(programForm.singleChildCount || '0'),
      singleInfantCount: parseInt(programForm.singleInfantCount || '0'),
      doubleAdultCount: parseInt(programForm.doubleAdultCount || '0'),
      doubleChildCount: parseInt(programForm.doubleChildCount || '0'),
      doubleInfantCount: parseInt(programForm.doubleInfantCount || '0'),
      tripleAdultCount: parseInt(programForm.tripleAdultCount || '0'),
      tripleChildCount: parseInt(programForm.tripleChildCount || '0'),
      tripleInfantCount: parseInt(programForm.tripleInfantCount || '0'),
      quadAdultCount: parseInt(programForm.quadAdultCount || '0'),
      quadChildCount: parseInt(programForm.quadChildCount || '0'),
      quadInfantCount: parseInt(programForm.quadInfantCount || '0'),
      roomType: programForm.roomType,
      isAgent: programForm.isAgent,
      employeeId: programForm.employeeId,
      employeeCommissionRate: parseFloat(programForm.employeeCommissionRate || '0'),
      commissionAmount: parseFloat(programForm.commissionAmount || '0'),
      applyCommission: programForm.applyCommission
    };

    // Handle voiding transactions for removed components in individual Umrah programs
    if (editingProgramId && (newProgram.type === 'INDIVIDUAL_UMRAH' || newProgram.type === 'GENERAL' || (newProgram.components && newProgram.components.length > 0))) {
      const oldProgram = (programs || []).find(p => p.id === editingProgramId);
      if (oldProgram && oldProgram.components) {
        const newComponentIds = (newProgram.components || []).map(c => c.id) || [];
        const removedComponents = (oldProgram.components || []).filter(c => c && !newComponentIds.includes(c.id));
        
        removedComponents.forEach(comp => {
          const matchingTransactions = (transactions || []).filter(t =>
            t &&
            t.programId === editingProgramId &&
            !t.isVoided &&
            (t.componentId === comp.id || t.description === `${oldProgram.name} - ${comp.name}`)
          );
          matchingTransactions.forEach(tx => voidTransaction(tx.id));
        });
      }
    }

    if (editingProgramId) {
      const oldProgram = (programs || []).find(p => p.id === editingProgramId);
      const updatedProgram = { ...oldProgram, ...newProgram };
      addAuditLog('UPDATE', 'SETTINGS', editingProgramId, `تعديل البرنامج: ${newProgram.name}`, oldProgram, updatedProgram);
      setPrograms(prev => (prev || []).map(p => p.id === editingProgramId ? updatedProgram : p));
      
      // Update linked transactions with new prices and program details
      const linkedTransactions = (transactions || []).filter(t => t && t.programId === editingProgramId && !t.isVoided);
      linkedTransactions.forEach(t => {
        let updatedTx = { ...t };
        let changed = false;

        // Update masterTripId if changed
        if (t.masterTripId !== newProgram.masterTripId) {
          updatedTx.masterTripId = newProgram.masterTripId;
          changed = true;
        }

        // Update description if program name changed
        if (oldProgram && oldProgram.name !== newProgram.name) {
          updatedTx.description = t.description.replace(oldProgram.name, newProgram.name);
          changed = true;
        }

        if (newProgram.type === 'INDIVIDUAL_UMRAH' || newProgram.type === 'GENERAL' || (newProgram.components && newProgram.components.length > 0)) {
          // Find the component this transaction belongs to
          const comp = t.componentId 
            ? newProgram.components?.find(c => c.id === t.componentId)
            : (() => {
                const parts = t.description.split(' - ');
                const compPart = parts[1]?.split(' (')[0];
                return newProgram.components?.find(c => c.name === compPart);
              })();
          
          if (comp) {
            const adultCount = t.adultCount || 0;
            const childCount = t.childCount || 0;
            const infantCount = t.infantCount || 0;
            
            let currentSellingPrice = 0;
            let currentPurchasePrice = 0;

            if (comp.pricingMode === 'TOTAL') {
              currentSellingPrice = comp.type === 'EXPENSE' ? 0 : (comp.sellingPrice || 0);
              currentPurchasePrice = comp.purchasePrice || 0;
            } else {
              const compAdultSelling = 
                t.roomType === 'SINGLE' ? (comp.singleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                t.roomType === 'DOUBLE' ? (comp.doubleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                t.roomType === 'TRIPLE' ? (comp.tripleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                t.roomType === 'QUAD' ? (comp.quadSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                (comp.adultSellingPrice || comp.sellingPrice || 0);

              const compChildSelling = 
                t.roomType === 'SINGLE' ? (comp.singleChildSellingPrice || comp.childSellingPrice || 0) :
                t.roomType === 'DOUBLE' ? (comp.doubleChildSellingPrice || comp.childSellingPrice || 0) :
                t.roomType === 'TRIPLE' ? (comp.tripleChildSellingPrice || comp.childSellingPrice || 0) :
                t.roomType === 'QUAD' ? (comp.quadChildSellingPrice || comp.childSellingPrice || 0) :
                (comp.childSellingPrice || 0);

              const compInfantSelling = 
                t.roomType === 'SINGLE' ? (comp.singleInfantSellingPrice || comp.infantSellingPrice || 0) :
                t.roomType === 'DOUBLE' ? (comp.doubleInfantSellingPrice || comp.infantSellingPrice || 0) :
                t.roomType === 'TRIPLE' ? (comp.tripleInfantSellingPrice || comp.infantSellingPrice || 0) :
                t.roomType === 'QUAD' ? (comp.quadInfantSellingPrice || comp.infantSellingPrice || 0) :
                (comp.infantSellingPrice || 0);

              currentSellingPrice = comp.type === 'EXPENSE' ? 0 : (adultCount * compAdultSelling) + (childCount * compChildSelling) + (infantCount * compInfantSelling);

              const compAdultPurchase = 
                t.roomType === 'SINGLE' ? (comp.singlePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                t.roomType === 'DOUBLE' ? (comp.doublePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                t.roomType === 'TRIPLE' ? (comp.triplePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                t.roomType === 'QUAD' ? (comp.quadPurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                (comp.adultPurchasePrice || comp.purchasePrice || 0);

              const compChildPurchase = 
                t.roomType === 'SINGLE' ? (comp.singleChildPurchasePrice || comp.childPurchasePrice || 0) :
                t.roomType === 'DOUBLE' ? (comp.doubleChildPurchasePrice || comp.childPurchasePrice || 0) :
                t.roomType === 'TRIPLE' ? (comp.tripleChildPurchasePrice || comp.childPurchasePrice || 0) :
                t.roomType === 'QUAD' ? (comp.quadChildPurchasePrice || comp.childPurchasePrice || 0) :
                (comp.childPurchasePrice || 0);

              const compInfantPurchase = 
                t.roomType === 'SINGLE' ? (comp.singleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                t.roomType === 'DOUBLE' ? (comp.doubleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                t.roomType === 'TRIPLE' ? (comp.tripleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                t.roomType === 'QUAD' ? (comp.quadInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                (comp.infantPurchasePrice || 0);

              currentPurchasePrice = (adultCount * compAdultPurchase) + (childCount * compChildPurchase) + (infantCount * compInfantPurchase);
            }

            const tripRate = newProgram.exchangeRate || 1;
            
            const sellPriceTrip = currentSellingPrice * (1 / (tripRate || 1));
            const buyPriceTrip = currentPurchasePrice * (1 / (tripRate || 1));
            
            if (t.sellingPrice !== sellPriceTrip || t.purchasePrice !== buyPriceTrip) {
              updatedTx.sellingPrice = sellPriceTrip;
              updatedTx.purchasePrice = buyPriceTrip;
              // For purchase only, amount is usually the purchase price. For sale only, it's the selling price.
              // For combined (rare in components), it's the selling price minus discount.
              if (t.isPurchaseOnly || t.type === 'PURCHASE_ONLY') {
                updatedTx.amount = buyPriceTrip;
              } else {
                updatedTx.amount = sellPriceTrip - (t.discount || 0);
              }
              changed = true;
            }
          }
        } else if (t.category === 'HAJJ_UMRAH') {
          const adultCount = t.adultCount || 0;
          const childCount = t.childCount || 0;
          const infantCount = t.infantCount || 0;

          const adultSelling = 
            t.roomType === 'SINGLE' ? parseFloat(newProgram.singleSellingPrice?.toString() || newProgram.adultSellingPrice?.toString() || newProgram.sellingPrice?.toString() || '0') :
            t.roomType === 'DOUBLE' ? parseFloat(newProgram.doubleSellingPrice?.toString() || newProgram.adultSellingPrice?.toString() || newProgram.sellingPrice?.toString() || '0') :
            t.roomType === 'TRIPLE' ? parseFloat(newProgram.tripleSellingPrice?.toString() || newProgram.adultSellingPrice?.toString() || newProgram.sellingPrice?.toString() || '0') :
            t.roomType === 'QUAD' ? parseFloat(newProgram.quadSellingPrice?.toString() || newProgram.adultSellingPrice?.toString() || newProgram.sellingPrice?.toString() || '0') :
            parseFloat(newProgram.adultSellingPrice?.toString() || newProgram.sellingPrice?.toString() || '0');

          const childSelling = 
            t.roomType === 'SINGLE' ? parseFloat(newProgram.singleChildSellingPrice?.toString() || newProgram.childSellingPrice?.toString() || '0') :
            t.roomType === 'DOUBLE' ? parseFloat(newProgram.doubleChildSellingPrice?.toString() || newProgram.childSellingPrice?.toString() || '0') :
            t.roomType === 'TRIPLE' ? parseFloat(newProgram.tripleChildSellingPrice?.toString() || newProgram.childSellingPrice?.toString() || '0') :
            t.roomType === 'QUAD' ? parseFloat(newProgram.quadChildSellingPrice?.toString() || newProgram.childSellingPrice?.toString() || '0') :
            parseFloat(newProgram.childSellingPrice?.toString() || '0');

          const infantSelling = 
            t.roomType === 'SINGLE' ? parseFloat(newProgram.singleInfantSellingPrice?.toString() || newProgram.infantSellingPrice?.toString() || '0') :
            t.roomType === 'DOUBLE' ? parseFloat(newProgram.doubleInfantSellingPrice?.toString() || newProgram.infantSellingPrice?.toString() || '0') :
            t.roomType === 'TRIPLE' ? parseFloat(newProgram.tripleInfantSellingPrice?.toString() || newProgram.infantSellingPrice?.toString() || '0') :
            t.roomType === 'QUAD' ? parseFloat(newProgram.quadInfantSellingPrice?.toString() || newProgram.infantSellingPrice?.toString() || '0') :
            parseFloat(newProgram.infantSellingPrice?.toString() || '0');

          const adultPurchase = 
            t.roomType === 'SINGLE' ? parseFloat(newProgram.singlePurchasePrice?.toString() || newProgram.adultPurchasePrice?.toString() || newProgram.purchasePrice?.toString() || '0') :
            t.roomType === 'DOUBLE' ? parseFloat(newProgram.doublePurchasePrice?.toString() || newProgram.adultPurchasePrice?.toString() || newProgram.purchasePrice?.toString() || '0') :
            t.roomType === 'TRIPLE' ? parseFloat(newProgram.triplePurchasePrice?.toString() || newProgram.adultPurchasePrice?.toString() || newProgram.purchasePrice?.toString() || '0') :
            t.roomType === 'QUAD' ? parseFloat(newProgram.quadPurchasePrice?.toString() || newProgram.adultPurchasePrice?.toString() || newProgram.purchasePrice?.toString() || '0') :
            parseFloat(newProgram.adultPurchasePrice?.toString() || newProgram.purchasePrice?.toString() || '0');

          const childPurchase = 
            t.roomType === 'SINGLE' ? parseFloat(newProgram.singleChildPurchasePrice?.toString() || newProgram.childPurchasePrice?.toString() || '0') :
            t.roomType === 'DOUBLE' ? parseFloat(newProgram.doubleChildPurchasePrice?.toString() || newProgram.childPurchasePrice?.toString() || '0') :
            t.roomType === 'TRIPLE' ? parseFloat(newProgram.tripleChildPurchasePrice?.toString() || newProgram.childPurchasePrice?.toString() || '0') :
            t.roomType === 'QUAD' ? parseFloat(newProgram.quadChildPurchasePrice?.toString() || newProgram.childPurchasePrice?.toString() || '0') :
            parseFloat(newProgram.childPurchasePrice?.toString() || '0');

          const infantPurchase = 
            t.roomType === 'SINGLE' ? parseFloat(newProgram.singleInfantPurchasePrice?.toString() || newProgram.infantPurchasePrice?.toString() || '0') :
            t.roomType === 'DOUBLE' ? parseFloat(newProgram.doubleInfantPurchasePrice?.toString() || newProgram.infantPurchasePrice?.toString() || '0') :
            t.roomType === 'TRIPLE' ? parseFloat(newProgram.tripleInfantPurchasePrice?.toString() || newProgram.infantPurchasePrice?.toString() || '0') :
            t.roomType === 'QUAD' ? parseFloat(newProgram.quadInfantPurchasePrice?.toString() || newProgram.infantPurchasePrice?.toString() || '0') :
            parseFloat(newProgram.infantPurchasePrice?.toString() || '0');

          const totalSelling = (adultCount * adultSelling) + (childCount * childSelling) + (infantCount * infantSelling);
          const totalPurchase = (adultCount * adultPurchase) + (childCount * childPurchase) + (infantCount * infantPurchase);

          if (t.sellingPrice !== totalSelling || t.purchasePrice !== totalPurchase) {
            updatedTx.sellingPrice = totalSelling;
            updatedTx.purchasePrice = totalPurchase;
            updatedTx.amount = totalSelling - (t.discount || 0);
            changed = true;
          }
        }

        if (changed) {
          updateTransaction(t.id, updatedTx);
        }
      });
    } else {
      addAuditLog('CREATE', 'SETTINGS', newProgram.id, `إضافة برنامج جديد: ${newProgram.name}`, undefined, newProgram);
      setPrograms(prev => [...(prev || []), newProgram]);

      // Automated Posting for programs with a customer
      if (newProgram.customerId) {
        const customer = (customers || []).find(c => c.id === newProgram.customerId);
        const roomConfigs = [
          { type: 'SINGLE' as const, adult: newProgram.singleAdultCount || 0, child: newProgram.singleChildCount || 0, infant: newProgram.singleInfantCount || 0 },
          { type: 'DOUBLE' as const, adult: newProgram.doubleAdultCount || 0, child: newProgram.doubleChildCount || 0, infant: newProgram.doubleInfantCount || 0 },
          { type: 'TRIPLE' as const, adult: newProgram.tripleAdultCount || 0, child: newProgram.tripleChildCount || 0, infant: newProgram.tripleInfantCount || 0 },
          { type: 'QUAD' as const, adult: newProgram.quadAdultCount || 0, child: newProgram.quadChildCount || 0, infant: newProgram.quadInfantCount || 0 },
          // Legacy support
          { type: newProgram.roomType || 'DEFAULT' as const, adult: newProgram.adultCount || 0, child: newProgram.childCount || 0, infant: newProgram.infantCount || 0 }
        ].filter(conf => conf && (conf.adult > 0 || conf.child > 0 || conf.infant > 0));

        let totalSelling = 0;
        if (roomConfigs.length === 0) {
          totalSelling = newProgram.sellingPrice;
        } else {
          roomConfigs.forEach(conf => {
            const adultSelling = 
              conf.type === 'SINGLE' ? (newProgram.singleSellingPrice || newProgram.adultSellingPrice || newProgram.sellingPrice || 0) :
              conf.type === 'DOUBLE' ? (newProgram.doubleSellingPrice || newProgram.adultSellingPrice || newProgram.sellingPrice || 0) :
              conf.type === 'TRIPLE' ? (newProgram.tripleSellingPrice || newProgram.adultSellingPrice || newProgram.sellingPrice || 0) :
              conf.type === 'QUAD' ? (newProgram.quadSellingPrice || newProgram.adultSellingPrice || newProgram.sellingPrice || 0) :
              (newProgram.adultSellingPrice || newProgram.sellingPrice || 0);

            const childSelling = 
              conf.type === 'SINGLE' ? (newProgram.singleChildSellingPrice || newProgram.childSellingPrice || 0) :
              conf.type === 'DOUBLE' ? (newProgram.doubleChildSellingPrice || newProgram.childSellingPrice || 0) :
              conf.type === 'TRIPLE' ? (newProgram.tripleChildSellingPrice || newProgram.childSellingPrice || 0) :
              conf.type === 'QUAD' ? (newProgram.quadChildSellingPrice || newProgram.childSellingPrice || 0) :
              (newProgram.childSellingPrice || 0);

            const infantSelling = 
              conf.type === 'SINGLE' ? (newProgram.singleInfantSellingPrice || newProgram.infantSellingPrice || 0) :
              conf.type === 'DOUBLE' ? (newProgram.doubleInfantSellingPrice || newProgram.infantSellingPrice || 0) :
              conf.type === 'TRIPLE' ? (newProgram.tripleInfantSellingPrice || newProgram.infantSellingPrice || 0) :
              conf.type === 'QUAD' ? (newProgram.quadInfantSellingPrice || newProgram.infantSellingPrice || 0) :
              (newProgram.infantSellingPrice || 0);
            
            totalSelling += (conf.adult * adultSelling) + (conf.child * childSelling) + (conf.infant * infantSelling);
          });
        }

        askConfirm(`هل تريد إثبات فاتورة مبيعات ومديونية للعميل (${customer?.name}) وللمورد بقيمة ${totalSelling} ${newProgram.currencyCode} الآن؟`, () => {
          if (newProgram.components && newProgram.components.length > 0) {
            // Update components to mark them as posted
            newProgram.components = newProgram.components.map(c => ({ ...c, isPosted: true }));
            
            // Post per component
            newProgram.components.forEach(comp => {
              if (comp.type === 'EXPENSE') return;
              
              if (roomConfigs.length === 0) {
                // Handle base case if no room counts provided but components exist
                const compSellPrice = comp.sellingPrice || 0;
                const compPurchasePrice = comp.purchasePrice || 0;
                
                addTransaction({
                  description: `${newProgram.name} - ${comp.name}`,
                  amount: compSellPrice,
                  currencyCode: newProgram.currencyCode,
                  exchangeRate: newProgram.exchangeRate,
                  type: 'REVENUE_ONLY',
                  category: comp.type === 'FLIGHT' ? 'FLIGHT' : 'GENERAL_SERVICE',
                  date: newProgram.date,
                  relatedEntityId: newProgram.customerId,
                  relatedEntityType: 'CUSTOMER',
                  sellingPrice: compSellPrice,
                  purchasePrice: 0,
                  programId: newProgram.id,
                  componentId: comp.id,
                  masterTripId: newProgram.masterTripId,
                  isSaleOnly: true,
                  employeeId: comp.employeeId || newProgram.employeeId,
                  employeeCommissionRate: newProgram.employeeCommissionRate,
                  commissionAmount: comp.commissionAmount,
                  applyCommission: comp.isCommissionable !== undefined ? comp.isCommissionable : newProgram.applyCommission
                });

                if (comp.supplierId || newProgram.supplierId) {
                  addTransaction({
                    description: `شراء خدمة: ${comp.name} - برنامج: ${newProgram.name}`,
                    amount: compPurchasePrice,
                    currencyCode: newProgram.currencyCode,
                    exchangeRate: newProgram.exchangeRate,
                    type: 'PURCHASE_ONLY',
                    category: comp.type === 'FLIGHT' ? 'FLIGHT' : 'GENERAL_SERVICE',
                    date: newProgram.date,
                    relatedEntityId: comp.supplierId || newProgram.supplierId,
                    relatedEntityType: comp.supplierType || newProgram.supplierType || 'SUPPLIER',
                    sellingPrice: 0,
                    purchasePrice: compPurchasePrice,
                    programId: newProgram.id,
                    componentId: comp.id,
                    masterTripId: newProgram.masterTripId,
                    isPurchaseOnly: true,
                    employeeId: comp.employeeId || newProgram.employeeId,
                    employeeCommissionRate: newProgram.employeeCommissionRate,
                    commissionAmount: comp.commissionAmount,
                    applyCommission: comp.isCommissionable !== undefined ? comp.isCommissionable : newProgram.applyCommission
                  });
                }
              } else {
                roomConfigs.forEach(conf => {
                  const compAdultSelling = 
                    conf.type === 'SINGLE' ? (comp.singleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                    conf.type === 'DOUBLE' ? (comp.doubleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                    conf.type === 'TRIPLE' ? (comp.tripleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                    conf.type === 'QUAD' ? (comp.quadSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                    (comp.adultSellingPrice || comp.sellingPrice || 0);

                  const compChildSelling = 
                    conf.type === 'SINGLE' ? (comp.singleChildSellingPrice || comp.childSellingPrice || 0) :
                    conf.type === 'DOUBLE' ? (comp.doubleChildSellingPrice || comp.childSellingPrice || 0) :
                    conf.type === 'TRIPLE' ? (comp.tripleChildSellingPrice || comp.childSellingPrice || 0) :
                    conf.type === 'QUAD' ? (comp.quadChildSellingPrice || comp.childSellingPrice || 0) :
                    (comp.childSellingPrice || 0);

                  const compInfantSelling = 
                    conf.type === 'SINGLE' ? (comp.singleInfantSellingPrice || comp.infantSellingPrice || 0) :
                    conf.type === 'DOUBLE' ? (comp.doubleInfantSellingPrice || comp.infantSellingPrice || 0) :
                    conf.type === 'TRIPLE' ? (comp.tripleInfantSellingPrice || comp.infantSellingPrice || 0) :
                    conf.type === 'QUAD' ? (comp.quadInfantSellingPrice || comp.infantSellingPrice || 0) :
                    (comp.infantSellingPrice || 0);

                  const compSellPrice = (conf.adult * compAdultSelling) + (conf.child * compChildSelling) + (conf.infant * compInfantSelling);
                  
                  const compAdultPurchase = 
                    conf.type === 'SINGLE' ? (comp.singlePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                    conf.type === 'DOUBLE' ? (comp.doublePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                    conf.type === 'TRIPLE' ? (comp.triplePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                    conf.type === 'QUAD' ? (comp.quadPurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                    (comp.adultPurchasePrice || comp.purchasePrice || 0);

                  const compChildPurchase = 
                    conf.type === 'SINGLE' ? (comp.singleChildPurchasePrice || comp.childPurchasePrice || 0) :
                    conf.type === 'DOUBLE' ? (comp.doubleChildPurchasePrice || comp.childPurchasePrice || 0) :
                    conf.type === 'TRIPLE' ? (comp.tripleChildPurchasePrice || comp.childPurchasePrice || 0) :
                    conf.type === 'QUAD' ? (comp.quadChildPurchasePrice || comp.childPurchasePrice || 0) :
                    (comp.childPurchasePrice || 0);

                  const compInfantPurchase = 
                    conf.type === 'SINGLE' ? (comp.singleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                    conf.type === 'DOUBLE' ? (comp.doubleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                    conf.type === 'TRIPLE' ? (comp.tripleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                    conf.type === 'QUAD' ? (comp.quadInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                    (comp.infantPurchasePrice || 0);

                  const compPurchasePrice = (conf.adult * compAdultPurchase) + (conf.child * compChildPurchase) + (conf.infant * compInfantPurchase);

                  // Post INCOME to Customer
                  addTransaction({
                    description: `${newProgram.name} - ${comp.name} (${conf.adult} بالغ، ${conf.child} طفل، ${conf.infant} رضيع) - ${conf.type}`,
                    amount: compSellPrice,
                    currencyCode: newProgram.currencyCode,
                    exchangeRate: newProgram.exchangeRate,
                    type: 'REVENUE_ONLY',
                    category: comp.type === 'FLIGHT' ? 'FLIGHT' : 'GENERAL_SERVICE',
                    date: newProgram.date,
                    relatedEntityId: newProgram.customerId,
                    relatedEntityType: 'CUSTOMER',
                    sellingPrice: compSellPrice,
                    purchasePrice: 0,
                    programId: newProgram.id,
                    componentId: comp.id,
                    masterTripId: newProgram.masterTripId,
                    isSaleOnly: true,
                    adultCount: conf.adult,
                    childCount: conf.child,
                    infantCount: conf.infant,
                    roomType: conf.type,
                    employeeId: comp.employeeId || newProgram.employeeId,
                    employeeCommissionRate: newProgram.employeeCommissionRate,
                    commissionAmount: comp.commissionAmount,
                    applyCommission: comp.isCommissionable !== undefined ? comp.isCommissionable : newProgram.applyCommission
                  });

                  // Post EXPENSE to Supplier if specified
                  if (comp.supplierId || newProgram.supplierId) {
                    addTransaction({
                      description: `شراء خدمة: ${comp.name} - برنامج: ${newProgram.name} (${conf.type})`,
                      amount: compPurchasePrice,
                      currencyCode: newProgram.currencyCode,
                      exchangeRate: newProgram.exchangeRate,
                      type: 'PURCHASE_ONLY',
                      category: comp.type === 'FLIGHT' ? 'FLIGHT' : 'GENERAL_SERVICE',
                      date: newProgram.date,
                      relatedEntityId: comp.supplierId || newProgram.supplierId,
                      relatedEntityType: comp.supplierType || newProgram.supplierType || 'SUPPLIER',
                      sellingPrice: 0,
                      purchasePrice: compPurchasePrice,
                      programId: newProgram.id,
                      componentId: comp.id,
                      masterTripId: newProgram.masterTripId,
                      isPurchaseOnly: true,
                      adultCount: conf.adult,
                      childCount: conf.child,
                      infantCount: conf.infant,
                      roomType: conf.type,
                      employeeId: comp.employeeId || newProgram.employeeId,
                      employeeCommissionRate: newProgram.employeeCommissionRate,
                      commissionAmount: comp.commissionAmount,
                      applyCommission: comp.isCommissionable !== undefined ? comp.isCommissionable : newProgram.applyCommission
                    });
                  }
                });
              }
            });
          } else {
            // Post single transaction (no components)
            if (roomConfigs.length === 0) {
              const finalSellPrice = newProgram.sellingPrice;
              const finalPurchasePrice = newProgram.purchasePrice;
              
              addTransaction({
                description: `مبيعات برنامج: ${newProgram.name} - عميل: ${customer?.name}`,
                amount: finalSellPrice,
                currencyCode: newProgram.currencyCode,
                exchangeRate: newProgram.exchangeRate,
                type: 'REVENUE_ONLY',
                category: (newProgram.type === 'UMRAH' || newProgram.type === 'INDIVIDUAL_UMRAH') ? 'HAJJ_UMRAH' : 'GENERAL_SERVICE',
                date: newProgram.date,
                relatedEntityId: newProgram.customerId,
                relatedEntityType: 'CUSTOMER',
                sellingPrice: finalSellPrice,
                purchasePrice: 0,
                programId: newProgram.id,
                masterTripId: newProgram.masterTripId,
                isSaleOnly: true,
                employeeId: newProgram.employeeId,
                employeeCommissionRate: newProgram.employeeCommissionRate,
                commissionAmount: newProgram.commissionAmount,
                applyCommission: newProgram.applyCommission
              });

              if (newProgram.supplierId) {
                addTransaction({
                  description: `شراء برنامج: ${newProgram.name} - مورد: ${(suppliers || []).find(s => s?.id === newProgram.supplierId)?.company || '---'}`,
                  amount: finalPurchasePrice,
                  currencyCode: newProgram.currencyCode,
                  exchangeRate: newProgram.exchangeRate,
                  type: 'PURCHASE_ONLY',
                  category: (newProgram.type === 'UMRAH' || newProgram.type === 'INDIVIDUAL_UMRAH') ? 'HAJJ_UMRAH' : 'GENERAL_SERVICE',
                  date: newProgram.date,
                  relatedEntityId: newProgram.supplierId,
                  relatedEntityType: newProgram.supplierType || 'SUPPLIER',
                  sellingPrice: 0,
                  purchasePrice: finalPurchasePrice,
                  programId: newProgram.id,
                  masterTripId: newProgram.masterTripId,
                  isPurchaseOnly: true,
                  employeeId: newProgram.employeeId,
                  employeeCommissionRate: newProgram.employeeCommissionRate,
                  commissionAmount: newProgram.commissionAmount,
                  applyCommission: newProgram.applyCommission
                });
              }
            } else {
              roomConfigs.forEach(conf => {
                const adultSelling = 
                  conf.type === 'SINGLE' ? (newProgram.singleSellingPrice || newProgram.adultSellingPrice || newProgram.sellingPrice || 0) :
                  conf.type === 'DOUBLE' ? (newProgram.doubleSellingPrice || newProgram.adultSellingPrice || newProgram.sellingPrice || 0) :
                  conf.type === 'TRIPLE' ? (newProgram.tripleSellingPrice || newProgram.adultSellingPrice || newProgram.sellingPrice || 0) :
                  conf.type === 'QUAD' ? (newProgram.quadSellingPrice || newProgram.adultSellingPrice || newProgram.sellingPrice || 0) :
                  (newProgram.adultSellingPrice || newProgram.sellingPrice || 0);

                const childSelling = 
                  conf.type === 'SINGLE' ? (newProgram.singleChildSellingPrice || newProgram.childSellingPrice || 0) :
                  conf.type === 'DOUBLE' ? (newProgram.doubleChildSellingPrice || newProgram.childSellingPrice || 0) :
                  conf.type === 'TRIPLE' ? (newProgram.tripleChildSellingPrice || newProgram.childSellingPrice || 0) :
                  conf.type === 'QUAD' ? (newProgram.quadChildSellingPrice || newProgram.childSellingPrice || 0) :
                  (newProgram.childSellingPrice || 0);

                const infantSelling = 
                  conf.type === 'SINGLE' ? (newProgram.singleInfantSellingPrice || newProgram.infantSellingPrice || 0) :
                  conf.type === 'DOUBLE' ? (newProgram.doubleInfantSellingPrice || newProgram.infantSellingPrice || 0) :
                  conf.type === 'TRIPLE' ? (newProgram.tripleInfantSellingPrice || newProgram.infantSellingPrice || 0) :
                  conf.type === 'QUAD' ? (newProgram.quadInfantSellingPrice || newProgram.infantSellingPrice || 0) :
                  (newProgram.infantSellingPrice || 0);

                const finalSellPrice = (conf.adult * adultSelling) + (conf.child * childSelling) + (conf.infant * infantSelling);
                
                const adultPurchase = 
                  conf.type === 'SINGLE' ? (newProgram.singlePurchasePrice || newProgram.adultPurchasePrice || newProgram.purchasePrice || 0) :
                  conf.type === 'DOUBLE' ? (newProgram.doublePurchasePrice || newProgram.adultPurchasePrice || newProgram.purchasePrice || 0) :
                  conf.type === 'TRIPLE' ? (newProgram.triplePurchasePrice || newProgram.adultPurchasePrice || newProgram.purchasePrice || 0) :
                  conf.type === 'QUAD' ? (newProgram.quadPurchasePrice || newProgram.adultPurchasePrice || newProgram.purchasePrice || 0) :
                  (newProgram.adultPurchasePrice || newProgram.purchasePrice || 0);

                const childPurchase = 
                  conf.type === 'SINGLE' ? (newProgram.singleChildPurchasePrice || newProgram.childPurchasePrice || 0) :
                  conf.type === 'DOUBLE' ? (newProgram.doubleChildPurchasePrice || newProgram.childPurchasePrice || 0) :
                  conf.type === 'TRIPLE' ? (newProgram.tripleChildPurchasePrice || newProgram.childPurchasePrice || 0) :
                  conf.type === 'QUAD' ? (newProgram.quadChildPurchasePrice || newProgram.childPurchasePrice || 0) :
                  (newProgram.childPurchasePrice || 0);

                const infantPurchase = 
                  conf.type === 'SINGLE' ? (newProgram.singleInfantPurchasePrice || newProgram.infantPurchasePrice || 0) :
                  conf.type === 'DOUBLE' ? (newProgram.doubleInfantPurchasePrice || newProgram.infantPurchasePrice || 0) :
                  conf.type === 'TRIPLE' ? (newProgram.tripleInfantPurchasePrice || newProgram.infantPurchasePrice || 0) :
                  conf.type === 'QUAD' ? (newProgram.quadInfantPurchasePrice || newProgram.infantPurchasePrice || 0) :
                  (newProgram.infantPurchasePrice || 0);

                const finalPurchasePrice = (conf.adult * adultPurchase) + (conf.child * childPurchase) + (conf.infant * infantPurchase);

                // Post INCOME to Customer
                addTransaction({
                  description: `مبيعات برنامج: ${newProgram.name} - عميل: ${customer?.name} (${conf.adult} بالغ، ${conf.child} طفل، ${conf.infant} رضيع) - ${conf.type}`,
                  amount: finalSellPrice,
                  currencyCode: newProgram.currencyCode,
                  exchangeRate: newProgram.exchangeRate,
                  type: 'REVENUE_ONLY',
                  category: (newProgram.type === 'UMRAH' || newProgram.type === 'INDIVIDUAL_UMRAH') ? 'HAJJ_UMRAH' : 'GENERAL_SERVICE',
                  date: newProgram.date,
                  relatedEntityId: newProgram.customerId,
                  relatedEntityType: 'CUSTOMER',
                  sellingPrice: finalSellPrice,
                  purchasePrice: 0,
                  programId: newProgram.id,
                  masterTripId: newProgram.masterTripId,
                  isSaleOnly: true,
                  adultCount: conf.adult,
                  childCount: conf.child,
                  infantCount: conf.infant,
                  roomType: conf.type,
                  employeeId: newProgram.employeeId,
                  employeeCommissionRate: newProgram.employeeCommissionRate,
                  applyCommission: newProgram.applyCommission
                });

                // Post EXPENSE to Supplier
                if (newProgram.supplierId) {
                  addTransaction({
                    description: `شراء برنامج: ${newProgram.name} - مورد: ${(suppliers || []).find(s => s?.id === newProgram.supplierId)?.company || '---'} (${conf.type})`,
                    amount: finalPurchasePrice,
                    currencyCode: newProgram.currencyCode,
                    exchangeRate: newProgram.exchangeRate,
                    type: 'PURCHASE_ONLY',
                    category: (newProgram.type === 'UMRAH' || newProgram.type === 'INDIVIDUAL_UMRAH') ? 'HAJJ_UMRAH' : 'GENERAL_SERVICE',
                    date: newProgram.date,
                    relatedEntityId: newProgram.supplierId,
                    relatedEntityType: newProgram.supplierType || 'SUPPLIER',
                    sellingPrice: 0,
                    purchasePrice: finalPurchasePrice,
                    programId: newProgram.id,
                    masterTripId: newProgram.masterTripId,
                    isPurchaseOnly: true,
                    adultCount: conf.adult,
                    childCount: conf.child,
                    infantCount: conf.infant,
                    roomType: conf.type,
                    employeeId: newProgram.employeeId,
                    employeeCommissionRate: newProgram.employeeCommissionRate,
                    applyCommission: newProgram.applyCommission
                  });
                }
              });
            }
        }
        notify("تم إثبات الفواتورة وترحيلها لحساب العميل والمورد بنجاح", "success");
      });
    }
  }
    
    // إغلاق النافذة وتنظيف النموذج فوراً
    setShowAddProgram(false);
    setEditingProgramId(null);
    setProgramForm({ ...INITIAL_PROGRAM_FORM, currencyCode: (settings?.baseCurrency || 'EGP') });
    setActiveTab('PROGRAMS');
  };

  const handleCancelComponent = (programId: string, componentId: string) => {
    askConfirm('هل أنت متأكد من إلغاء هذا المكون؟ سيتم إلغاء كافة القيود المالية المرتبطة به تلقائياً وتعديل حساب المورد والعميل.', () => {
      // Void associated transactions
      const associatedTxs = (transactions || []).filter(t => t && !t.isVoided && t.programId === programId && t.componentId === componentId);
      associatedTxs.forEach(t => t?.id && voidTransaction(t.id, true));

      // Update program to remove/update component
      setPrograms(prev => (prev || []).map(p => {
        if (p?.id === programId) {
          return {
            ...p,
            components: (p.components || []).filter(c => c?.id !== componentId)
          };
        }
        return p;
      }));

      notify('تم إلغاء المكون وكافة قيوده المالية بنجاح.', 'success');
    });
  };

  const handleReturnComponent = (programId: string, componentId: string, transactionId?: string) => {
    const program = (programs || []).find(p => p.id === programId);
    if (!program) return;
    
    let comp = (program.components || []).find(c => c.id === componentId);
    
    let supplierId = comp?.supplierId;
    let compName = comp?.name;
    let originalQuantity = comp?.quantity || 1;
    let currencyCode = comp?.currencyCode || 'EGP';
    let exchangeRate = comp?.exchangeRate || 1;
    let unitPurchase = (comp?.originalPurchasePrice || 0) / (comp?.quantity || 1);

    // If transactionId is provided or comp not found, search in transactions
    const targetTx = transactionId 
        ? (transactions || []).find(t => t.id === transactionId)
        : (transactions || []).find(t => t.programId === programId && t.componentId === componentId && t.supplierId && !t.isVoided && (t.type === 'EXPENSE' || t.isPurchaseOnly));

    if (targetTx) {
        supplierId = targetTx.supplierId;
        // Clean up description to get a nice name
        compName = targetTx.description?.replace('شراء مكون:', '')?.split('-')?.[0]?.trim() || targetTx.description || compName || 'مكون سابق';
        currencyCode = targetTx.currencyCode || 'EGP';
        exchangeRate = targetTx.exchangeRate || 1;
        unitPurchase = targetTx.amount || 0;
        
        // For ad-hoc transactions, we might not know the original total quantity easily, 
        // so we default to 1 or try to count similar transactions
        if (!comp) {
            originalQuantity = (transactions || [])
                .filter(t => t && t.programId === programId && t.componentId === (componentId || targetTx.componentId) && t.supplierId === supplierId && !t.isVoided && (t.type === 'EXPENSE' || t.isPurchaseOnly))
                .length || 1;
        }
    }

    const supplier = (suppliers || []).find(s => s.id === supplierId);

    setReturnFormData({
        programId,
        componentId: componentId || targetTx?.componentId || '',
        compName: compName || 'مكون غير معروف',
        supplierName: supplier?.company || '---',
        originalQuantity: originalQuantity || 1,
        quantity: '1',
        amount: unitPurchase.toString(),
        currencyCode: currencyCode,
        exchangeRate: exchangeRate.toString(),
        supplierId: supplierId || '',
        supplierType: 'SUPPLIER'
    });
    setShowReturnForm(true);
    
    // Smooth scroll to form
    setTimeout(() => {
        const el = document.getElementById('return-form-section');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const qty = parseInt(returnFormData.quantity);
    const amount = parseFloat(returnFormData.amount);
    const exchangeRate = parseFloat(returnFormData.exchangeRate || '1');

    if (qty <= 0 || qty > returnFormData.originalQuantity) {
        notify("كمية غير صالحة", "error");
        return;
    }
    if (amount <= 0) {
        notify("المبلغ غير صحيح", "error");
        return;
    }
    if (exchangeRate <= 0) {
        notify("سعر الصرف غير صحيح", "error");
        return;
    }

    try {
        const currentProgram = (programs || []).find(p => p.id === returnFormData.programId);
        
        addTransaction({
            description: `ارتداد شراء مكون: ${returnFormData.compName} - عدد ${qty} - برنامج: ${currentProgram?.name || '---'}`,
            amount: Number(Math.round(amount * 100) / 100), 
            purchasePrice: Number(Math.round(amount * 100) / 100),
            sellingPrice: 0,
            currencyCode: returnFormData.currencyCode || 'EGP',
            exchangeRate: Number(exchangeRate || 1),
            type: 'PURCHASE_ONLY',
            category: 'HAJJ_UMRAH',
            date: new Date().toISOString().split('T')[0],
            supplierId: returnFormData.supplierId,
            supplierType: returnFormData.supplierType || 'SUPPLIER',
            relatedEntityId: returnFormData.supplierId, 
            relatedEntityType: returnFormData.supplierType || 'SUPPLIER',
            programId: returnFormData.programId,
            componentId: returnFormData.componentId,
            isPurchaseOnly: true,
            isReversal: true
        });
        
        setShowReturnForm(false);
        notify("تم تسجيل الارتداد بنجاح", "success");
    } catch (err) {
        console.error("Return submission error:", err);
        notify("حدث خطأ أثناء الحفظ: " + (err as Error).message, "error");
    }
  };

  const handleGeneralReturnSelection = () => {
    if (!editingProgramId) {
        notify("لا يمكن عمل ارتداد لمكون في برنامج جديد لم يتم حفظه بعد.", "error");
        return;
    }
    const componentsWithSuppliers = (programForm.components || []).filter(c => c && c.supplierId);
    if (componentsWithSuppliers.length === 0) {
        notify("لا يوجد مكونات مرتبطة بموردين في هذا البرنامج لعمل ارتداد لها.", "error");
        return;
    }

    setShowReturnSelectionModal(true);
  };

  const manualPostProgram = (program: Program) => {
    if (!program.customerId) {
      notify("لا يمكن ترحيل برنامج بدون تحديد عميل.", "error");
      return;
    }

    const customer = (customers || []).find(c => c.id === program.customerId);
    const roomConfigs = [
      { type: 'SINGLE' as const, adult: program.singleAdultCount || 0, child: program.singleChildCount || 0, infant: program.singleInfantCount || 0 },
      { type: 'DOUBLE' as const, adult: program.doubleAdultCount || 0, child: program.doubleChildCount || 0, infant: program.doubleInfantCount || 0 },
      { type: 'TRIPLE' as const, adult: program.tripleAdultCount || 0, child: program.tripleChildCount || 0, infant: program.tripleInfantCount || 0 },
      { type: 'QUAD' as const, adult: program.quadAdultCount || 0, child: program.quadChildCount || 0, infant: program.quadInfantCount || 0 },
      { type: program.roomType || 'DEFAULT' as const, adult: program.adultCount || 0, child: program.childCount || 0, infant: program.infantCount || 0 }
    ].filter(conf => conf && (conf.adult > 0 || conf.child > 0 || conf.infant > 0));

    let totalSelling = 0;
    if (roomConfigs.length === 0) {
      totalSelling = program.sellingPrice;
    } else {
      roomConfigs.forEach(conf => {
        const adultSelling = 
          conf.type === 'SINGLE' ? (program.singleSellingPrice || program.adultSellingPrice || program.sellingPrice || 0) :
          conf.type === 'DOUBLE' ? (program.doubleSellingPrice || program.adultSellingPrice || program.sellingPrice || 0) :
          conf.type === 'TRIPLE' ? (program.tripleSellingPrice || program.adultSellingPrice || program.sellingPrice || 0) :
          conf.type === 'QUAD' ? (program.quadSellingPrice || program.adultSellingPrice || program.sellingPrice || 0) :
          (program.adultSellingPrice || program.sellingPrice || 0);

        const childSelling = 
          conf.type === 'SINGLE' ? (program.singleChildSellingPrice || program.childSellingPrice || 0) :
          conf.type === 'DOUBLE' ? (program.doubleChildSellingPrice || program.childSellingPrice || 0) :
          conf.type === 'TRIPLE' ? (program.tripleChildSellingPrice || program.childSellingPrice || 0) :
          conf.type === 'QUAD' ? (program.quadChildSellingPrice || program.childSellingPrice || 0) :
          (program.childSellingPrice || 0);

        const infantSelling = 
          conf.type === 'SINGLE' ? (program.singleInfantSellingPrice || program.infantSellingPrice || 0) :
          conf.type === 'DOUBLE' ? (program.doubleInfantSellingPrice || program.infantSellingPrice || 0) :
          conf.type === 'TRIPLE' ? (program.tripleInfantSellingPrice || program.infantSellingPrice || 0) :
          conf.type === 'QUAD' ? (program.quadInfantSellingPrice || program.infantSellingPrice || 0) :
          (program.infantSellingPrice || 0);
        
        totalSelling += (conf.adult * adultSelling) + (conf.child * childSelling) + (conf.infant * infantSelling);
      });
    }

    askConfirm(`هل أنت متأكد من ترحيل مديونية بقيمة ${formatCurrency(totalSelling)} للعميل (${customer?.name}) الآن؟ سيتم ترحيل المكونات أيضاً.`, () => {
      if (program.components && program.components.length > 0) {
        program.components.forEach(comp => {
          if (comp.type === 'EXPENSE') return;
          
          if (roomConfigs.length === 0) {
            const compSellPrice = comp.sellingPrice || 0;
            const compPurchasePrice = comp.purchasePrice || 0;
            
            addTransaction({
              description: `${program.name} - ${comp.name}`,
              amount: compSellPrice,
              currencyCode: program.currencyCode,
              exchangeRate: program.exchangeRate,
              type: 'REVENUE_ONLY',
              category: comp.type === 'FLIGHT' ? 'FLIGHT' : 'GENERAL_SERVICE',
              date: program.date,
              relatedEntityId: program.customerId,
              relatedEntityType: 'CUSTOMER',
              sellingPrice: compSellPrice,
              purchasePrice: 0,
              programId: program.id,
              componentId: comp.id,
              masterTripId: program.masterTripId,
              isSaleOnly: true,
              employeeId: comp.employeeId || program.employeeId,
              employeeCommissionRate: program.employeeCommissionRate,
              commissionAmount: comp.commissionAmount,
              applyCommission: comp.isCommissionable !== undefined ? comp.isCommissionable : program.applyCommission
            });

            if (comp.supplierId || program.supplierId) {
              addTransaction({
                description: `شراء خدمة: ${comp.name} - برنامج: ${program.name}`,
                amount: compPurchasePrice,
                currencyCode: program.currencyCode,
                exchangeRate: program.exchangeRate,
                type: 'PURCHASE_ONLY',
                category: comp.type === 'FLIGHT' ? 'FLIGHT' : 'GENERAL_SERVICE',
                date: program.date,
                relatedEntityId: comp.supplierId || program.supplierId,
                relatedEntityType: comp.supplierType || program.supplierType || 'SUPPLIER',
                sellingPrice: 0,
                purchasePrice: compPurchasePrice,
                programId: program.id,
                componentId: comp.id,
                masterTripId: program.masterTripId,
                isPurchaseOnly: true,
                employeeId: comp.employeeId || program.employeeId,
                applyCommission: false
              });
            }
          } else {
            roomConfigs.forEach(conf => {
              const compAdultSelling = 
                conf.type === 'SINGLE' ? (comp.singleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                conf.type === 'DOUBLE' ? (comp.doubleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                conf.type === 'TRIPLE' ? (comp.tripleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                conf.type === 'QUAD' ? (comp.quadSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
                (comp.adultSellingPrice || comp.sellingPrice || 0);

              const compChildSelling = 
                conf.type === 'SINGLE' ? (comp.singleChildSellingPrice || comp.childSellingPrice || 0) :
                conf.type === 'DOUBLE' ? (comp.doubleChildSellingPrice || comp.childSellingPrice || 0) :
                conf.type === 'TRIPLE' ? (comp.tripleChildSellingPrice || comp.childSellingPrice || 0) :
                conf.type === 'QUAD' ? (comp.quadChildSellingPrice || comp.childSellingPrice || 0) :
                (comp.childSellingPrice || 0);

              const compInfantSelling = 
                conf.type === 'SINGLE' ? (comp.singleInfantSellingPrice || comp.infantSellingPrice || 0) :
                conf.type === 'DOUBLE' ? (comp.doubleInfantSellingPrice || comp.infantSellingPrice || 0) :
                conf.type === 'TRIPLE' ? (comp.tripleInfantSellingPrice || comp.infantSellingPrice || 0) :
                conf.type === 'QUAD' ? (comp.quadInfantSellingPrice || comp.infantSellingPrice || 0) :
                (comp.infantSellingPrice || 0);

              const compSellPrice = (conf.adult * compAdultSelling) + (conf.child * compChildSelling) + (conf.infant * compInfantSelling);
              
              const compAdultPurchase = 
                conf.type === 'SINGLE' ? (comp.singlePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                conf.type === 'DOUBLE' ? (comp.doublePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                conf.type === 'TRIPLE' ? (comp.triplePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                conf.type === 'QUAD' ? (comp.quadPurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
                (comp.adultPurchasePrice || comp.purchasePrice || 0);

              const compChildPurchase = 
                conf.type === 'SINGLE' ? (comp.singleChildPurchasePrice || comp.childPurchasePrice || 0) :
                conf.type === 'DOUBLE' ? (comp.doubleChildPurchasePrice || comp.childPurchasePrice || 0) :
                conf.type === 'TRIPLE' ? (comp.tripleChildPurchasePrice || comp.childPurchasePrice || 0) :
                conf.type === 'QUAD' ? (comp.quadChildPurchasePrice || comp.childPurchasePrice || 0) :
                (comp.childPurchasePrice || 0);

              const compInfantPurchase = 
                conf.type === 'SINGLE' ? (comp.singleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                conf.type === 'DOUBLE' ? (comp.doubleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                conf.type === 'TRIPLE' ? (comp.tripleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                conf.type === 'QUAD' ? (comp.quadInfantPurchasePrice || comp.infantPurchasePrice || 0) :
                (comp.infantPurchasePrice || 0);

              const compPurchasePrice = (conf.adult * compAdultPurchase) + (conf.child * compChildPurchase) + (conf.infant * compInfantPurchase);

              if (compSellPrice > 0) {
                addTransaction({
                  description: `${program.name} - ${comp.name} (${conf.adult} بالغ، ${conf.child} طفل، ${conf.infant} رضيع) - ${conf.type}`,
                  amount: compSellPrice,
                  currencyCode: program.currencyCode,
                  exchangeRate: program.exchangeRate,
                  type: 'REVENUE_ONLY',
                  category: comp.type === 'FLIGHT' ? 'FLIGHT' : 'GENERAL_SERVICE',
                  date: program.date,
                  relatedEntityId: program.customerId,
                  relatedEntityType: 'CUSTOMER',
                  sellingPrice: compSellPrice,
                  purchasePrice: 0,
                  programId: program.id,
                  componentId: comp.id,
                  masterTripId: program.masterTripId,
                  isSaleOnly: true,
                  adultCount: conf.adult,
                  childCount: conf.child,
                  infantCount: conf.infant,
                  roomType: conf.type,
                  employeeId: comp.employeeId || program.employeeId,
                  employeeCommissionRate: program.employeeCommissionRate,
                  commissionAmount: comp.commissionAmount,
                  applyCommission: comp.isCommissionable !== undefined ? comp.isCommissionable : program.applyCommission
                });
              }

              if (compPurchasePrice > 0 && (comp.supplierId || program.supplierId)) {
                addTransaction({
                  description: `شراء خدمة: ${comp.name} - برنامج: ${program.name} (${conf.type})`,
                  amount: compPurchasePrice,
                  currencyCode: program.currencyCode,
                  exchangeRate: program.exchangeRate,
                  type: 'PURCHASE_ONLY',
                  category: comp.type === 'FLIGHT' ? 'FLIGHT' : 'GENERAL_SERVICE',
                  date: program.date,
                  relatedEntityId: comp.supplierId || program.supplierId,
                  relatedEntityType: comp.supplierType || program.supplierType || 'SUPPLIER',
                  sellingPrice: 0,
                  purchasePrice: compPurchasePrice,
                  programId: program.id,
                  componentId: comp.id,
                  masterTripId: program.masterTripId,
                  isPurchaseOnly: true,
                  adultCount: conf.adult,
                  childCount: conf.child,
                  infantCount: conf.infant,
                  roomType: conf.type,
                  employeeId: comp.employeeId || program.employeeId,
                  employeeCommissionRate: program.employeeCommissionRate,
                  commissionAmount: comp.commissionAmount,
                  applyCommission: comp.isCommissionable !== undefined ? comp.isCommissionable : program.applyCommission
                });
              }
            });
          }
        });
      } else {
        if (roomConfigs.length === 0) {
          const finalSellPrice = program.sellingPrice;
          const finalPurchasePrice = program.purchasePrice;
          
          addTransaction({
            description: `مبيعات برنامج: ${program.name} - عميل: ${customer?.name}`,
            amount: finalSellPrice,
            currencyCode: program.currencyCode,
            exchangeRate: program.exchangeRate,
            type: 'REVENUE_ONLY',
            category: (program.type === 'UMRAH' || program.type === 'INDIVIDUAL_UMRAH') ? 'HAJJ_UMRAH' : 'GENERAL_SERVICE',
            date: program.date,
            relatedEntityId: program.customerId,
            relatedEntityType: 'CUSTOMER',
            sellingPrice: finalSellPrice,
            purchasePrice: 0,
            programId: program.id,
            masterTripId: program.masterTripId,
            isSaleOnly: true,
            employeeId: program.employeeId,
            employeeCommissionRate: program.employeeCommissionRate,
            commissionAmount: program.commissionAmount,
            applyCommission: program.applyCommission
          });

          if (program.supplierId) {
            addTransaction({
              description: `شراء برنامج: ${program.name} - مورد: ${(suppliers || []).find(s => s?.id === program.supplierId)?.company || '---'}`,
              amount: finalPurchasePrice,
              currencyCode: program.currencyCode,
              exchangeRate: program.exchangeRate,
              type: 'PURCHASE_ONLY',
              category: (program.type === 'UMRAH' || program.type === 'INDIVIDUAL_UMRAH') ? 'HAJJ_UMRAH' : 'GENERAL_SERVICE',
              date: program.date,
              relatedEntityId: program.supplierId,
              relatedEntityType: program.supplierType || 'SUPPLIER',
              sellingPrice: 0,
              purchasePrice: finalPurchasePrice,
              programId: program.id,
              masterTripId: program.masterTripId,
              isPurchaseOnly: true,
              employeeId: program.employeeId,
              employeeCommissionRate: program.employeeCommissionRate,
              commissionAmount: program.commissionAmount,
              applyCommission: program.applyCommission
            });
          }
        } else {
          roomConfigs.forEach(conf => {
            const adultSelling = 
              conf.type === 'SINGLE' ? (program.singleSellingPrice || program.adultSellingPrice || program.sellingPrice || 0) :
              conf.type === 'DOUBLE' ? (program.doubleSellingPrice || program.adultSellingPrice || program.sellingPrice || 0) :
              conf.type === 'TRIPLE' ? (program.tripleSellingPrice || program.adultSellingPrice || program.sellingPrice || 0) :
              conf.type === 'QUAD' ? (program.quadSellingPrice || program.adultSellingPrice || program.sellingPrice || 0) :
              (program.adultSellingPrice || program.sellingPrice || 0);

            const childSelling = 
              conf.type === 'SINGLE' ? (program.singleChildSellingPrice || program.childSellingPrice || 0) :
              conf.type === 'DOUBLE' ? (program.doubleChildSellingPrice || program.childSellingPrice || 0) :
              conf.type === 'TRIPLE' ? (program.tripleChildSellingPrice || program.childSellingPrice || 0) :
              conf.type === 'QUAD' ? (program.quadChildSellingPrice || program.childSellingPrice || 0) :
              (program.childSellingPrice || 0);

            const infantSelling = 
              conf.type === 'SINGLE' ? (program.singleInfantSellingPrice || program.infantSellingPrice || 0) :
              conf.type === 'DOUBLE' ? (program.doubleInfantSellingPrice || program.infantSellingPrice || 0) :
              conf.type === 'TRIPLE' ? (program.tripleInfantSellingPrice || program.infantSellingPrice || 0) :
              conf.type === 'QUAD' ? (program.quadInfantSellingPrice || program.infantSellingPrice || 0) :
              (program.infantSellingPrice || 0);

            const finalSellPrice = (conf.adult * adultSelling) + (conf.child * childSelling) + (conf.infant * infantSelling);
            
            const adultPurchase = 
              conf.type === 'SINGLE' ? (program.singlePurchasePrice || program.adultPurchasePrice || program.purchasePrice || 0) :
              conf.type === 'DOUBLE' ? (program.doublePurchasePrice || program.adultPurchasePrice || program.purchasePrice || 0) :
              conf.type === 'TRIPLE' ? (program.triplePurchasePrice || program.adultPurchasePrice || program.purchasePrice || 0) :
              conf.type === 'QUAD' ? (program.quadPurchasePrice || program.adultPurchasePrice || program.purchasePrice || 0) :
              (program.adultPurchasePrice || program.purchasePrice || 0);

            const childPurchase = 
              conf.type === 'SINGLE' ? (program.singleChildPurchasePrice || program.childPurchasePrice || 0) :
              conf.type === 'DOUBLE' ? (program.doubleChildPurchasePrice || program.childPurchasePrice || 0) :
              conf.type === 'TRIPLE' ? (program.tripleChildPurchasePrice || program.childPurchasePrice || 0) :
              conf.type === 'QUAD' ? (program.quadChildPurchasePrice || program.childPurchasePrice || 0) :
              (program.childPurchasePrice || 0);

            const infantPurchase = 
              conf.type === 'SINGLE' ? (program.singleInfantPurchasePrice || program.infantPurchasePrice || 0) :
              conf.type === 'DOUBLE' ? (program.doubleInfantPurchasePrice || program.infantPurchasePrice || 0) :
              conf.type === 'TRIPLE' ? (program.tripleInfantPurchasePrice || program.infantPurchasePrice || 0) :
              conf.type === 'QUAD' ? (program.quadInfantPurchasePrice || program.infantPurchasePrice || 0) :
              (program.infantPurchasePrice || 0);

            const finalPurchasePrice = (conf.adult * adultPurchase) + (conf.child * childPurchase) + (conf.infant * infantPurchase);

            // Post INCOME to Customer
            addTransaction({
              description: `مبيعات برنامج: ${program.name} - عميل: ${customer?.name} (${conf.adult} بالغ، ${conf.child} طفل، ${conf.infant} رضيع) - ${conf.type}`,
              amount: finalSellPrice,
              currencyCode: program.currencyCode,
              exchangeRate: program.exchangeRate,
              type: 'REVENUE_ONLY',
              category: (program.type === 'UMRAH' || program.type === 'INDIVIDUAL_UMRAH') ? 'HAJJ_UMRAH' : 'GENERAL_SERVICE',
              date: program.date,
              relatedEntityId: program.customerId,
              relatedEntityType: 'CUSTOMER',
              sellingPrice: finalSellPrice,
              purchasePrice: 0,
              programId: program.id,
              masterTripId: program.masterTripId,
              isSaleOnly: true,
              adultCount: conf.adult,
              childCount: conf.child,
              infantCount: conf.infant,
              roomType: conf.type,
              employeeId: program.employeeId,
              employeeCommissionRate: program.employeeCommissionRate,
              applyCommission: program.applyCommission
            });

            // Post EXPENSE to Supplier
            if (program.supplierId) {
              addTransaction({
                description: `شراء برنامج: ${program.name} - مورد: ${(suppliers || []).find(s => s?.id === program.supplierId)?.company || '---'} (${conf.type})`,
                amount: finalPurchasePrice,
                currencyCode: program.currencyCode,
                exchangeRate: program.exchangeRate,
                type: 'PURCHASE_ONLY',
                category: (program.type === 'UMRAH' || program.type === 'INDIVIDUAL_UMRAH') ? 'HAJJ_UMRAH' : 'GENERAL_SERVICE',
                date: program.date,
                relatedEntityId: program.supplierId,
                relatedEntityType: program.supplierType || 'SUPPLIER',
                sellingPrice: 0,
                purchasePrice: finalPurchasePrice,
                programId: program.id,
                masterTripId: program.masterTripId,
                isPurchaseOnly: true,
                adultCount: conf.adult,
                childCount: conf.child,
                infantCount: conf.infant,
                roomType: conf.type,
                employeeId: program.employeeId,
                employeeCommissionRate: program.employeeCommissionRate,
                applyCommission: program.applyCommission
              });
            }
          });
        }
      }
      
      // Update program components isPosted flag
      if (program.components) {
        const updatedProgram = {
          ...program,
          components: program.components.map(c => ({ ...c, isPosted: true }))
        };
        setPrograms(prev => (prev || []).map(p => p.id === program.id ? updatedProgram : p));
      }
      
      addAuditLog('CREATE', 'TRANSACTION', program.id, `ترحيل حسابات البرنامج يدوياً: ${program.name}`);
      notify("تم ترحيل الفواتير للحسابات بنجاح.", "success");
    });
  };

  const startEditProgram = (p: Program) => {
    setEditingProgramId(p.id);
    setProgramForm({
      name: p.name,
      masterTripId: p.masterTripId || '',
      customerId: p.customerId || '',
      supplierId: p.supplierId,
      supplierType: (p as any).supplierType || 'SUPPLIER',
      purchasePrice: p.purchasePrice.toString(),
      sellingPrice: p.sellingPrice.toString(),
      adultPurchasePrice: (p.adultPurchasePrice || p.purchasePrice || 0).toString(),
      childPurchasePrice: (p.childPurchasePrice || 0).toString(),
      infantPurchasePrice: (p.infantPurchasePrice || 0).toString(),
      singlePurchasePrice: (p.singlePurchasePrice || 0).toString(),
      singleChildPurchasePrice: (p.singleChildPurchasePrice || 0).toString(),
      singleInfantPurchasePrice: (p.singleInfantPurchasePrice || 0).toString(),
      doublePurchasePrice: (p.doublePurchasePrice || 0).toString(),
      doubleChildPurchasePrice: (p.doubleChildPurchasePrice || 0).toString(),
      doubleInfantPurchasePrice: (p.doubleInfantPurchasePrice || 0).toString(),
      triplePurchasePrice: (p.triplePurchasePrice || 0).toString(),
      tripleChildPurchasePrice: (p.tripleChildPurchasePrice || 0).toString(),
      tripleInfantPurchasePrice: (p.tripleInfantPurchasePrice || 0).toString(),
      quadPurchasePrice: (p.quadPurchasePrice || 0).toString(),
      quadChildPurchasePrice: (p.quadChildPurchasePrice || 0).toString(),
      quadInfantPurchasePrice: (p.quadInfantPurchasePrice || 0).toString(),
      adultSellingPrice: (p.adultSellingPrice || p.sellingPrice || 0).toString(),
      childSellingPrice: (p.childSellingPrice || 0).toString(),
      infantSellingPrice: (p.infantSellingPrice || 0).toString(),
      singleSellingPrice: (p.singleSellingPrice || 0).toString(),
      singleChildSellingPrice: (p.singleChildSellingPrice || 0).toString(),
      singleInfantSellingPrice: (p.singleInfantSellingPrice || 0).toString(),
      doubleSellingPrice: (p.doubleSellingPrice || 0).toString(),
      doubleChildSellingPrice: (p.doubleChildSellingPrice || 0).toString(),
      doubleInfantSellingPrice: (p.doubleInfantSellingPrice || 0).toString(),
      tripleSellingPrice: (p.tripleSellingPrice || 0).toString(),
      tripleChildSellingPrice: (p.tripleChildSellingPrice || 0).toString(),
      tripleInfantSellingPrice: (p.tripleInfantSellingPrice || 0).toString(),
      quadSellingPrice: (p.quadSellingPrice || 0).toString(),
      quadChildSellingPrice: (p.quadChildSellingPrice || 0).toString(),
      quadInfantSellingPrice: (p.quadInfantSellingPrice || 0).toString(),
      adultAgentPrice: (p.adultAgentPrice || 0).toString(),
      childAgentPrice: (p.childAgentPrice || 0).toString(),
      infantAgentPrice: (p.infantAgentPrice || 0).toString(),
      singleAgentPrice: (p.singleAgentPrice || 0).toString(),
      doubleAgentPrice: (p.doubleAgentPrice || 0).toString(),
      tripleAgentPrice: (p.tripleAgentPrice || 0).toString(),
      quadAgentPrice: (p.quadAgentPrice || 0).toString(),
      type: p.type,
      date: p.date,
      currencyCode: p.currencyCode,
      exchangeRate: (p.exchangeRate || 1).toString(),
      components: p.components || [],
      adultCount: (p.adultCount || 0).toString(),
      childCount: (p.childCount || 0).toString(),
      infantCount: (p.infantCount || 0).toString(),
      singleAdultCount: (p.singleAdultCount || 0).toString(),
      singleChildCount: (p.singleChildCount || 0).toString(),
      singleInfantCount: (p.singleInfantCount || 0).toString(),
      doubleAdultCount: (p.doubleAdultCount || 0).toString(),
      doubleChildCount: (p.doubleChildCount || 0).toString(),
      doubleInfantCount: (p.doubleInfantCount || 0).toString(),
      tripleAdultCount: (p.tripleAdultCount || 0).toString(),
      tripleChildCount: (p.tripleChildCount || 0).toString(),
      tripleInfantCount: (p.tripleInfantCount || 0).toString(),
      quadAdultCount: (p.quadAdultCount || 0).toString(),
      quadChildCount: (p.quadChildCount || 0).toString(),
      quadInfantCount: (p.quadInfantCount || 0).toString(),
      roomType: p.roomType || 'DEFAULT',
      isAgent: p.isAgent || false,
      employeeId: p.employeeId || '',
      employeeCommissionRate: (p.employeeCommissionRate || 0).toString(),
      commissionAmount: (p.commissionAmount || 0).toString(),
      applyCommission: p.applyCommission ?? true
    });
    setShowAddProgram(true);
  };

  const handleGuaranteeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(guaranteeForm.amount || '0');
    const rate = parseFloat(guaranteeForm.exchangeRate || '1');
    const supplier = (suppliers || []).find(s => s.id === guaranteeForm.supplierId);
    const program = (programs || []).find(p => p.id === guaranteeForm.programId);

    if (amount <= 0 || !guaranteeForm.supplierId || !guaranteeForm.treasuryId) {
      notify('يرجى ملء كافة البيانات المطلوبة', 'error');
      return;
    }

    addTransaction({
      description: `دفع خطاب ضمان للوكيل: ${supplier?.company} - ${program?.name || 'عام'}`,
      amount,
      amountInBase: amount * rate,
      currencyCode: guaranteeForm.currencyCode,
      exchangeRate: rate,
      type: 'EXPENSE',
      category: 'GUARANTEE_LETTER',
      date: guaranteeForm.date,
      relatedEntityId: guaranteeForm.supplierId,
      relatedEntityType: 'SUPPLIER',
      treasuryId: guaranteeForm.treasuryId,
      programId: guaranteeForm.programId || undefined,
      masterTripId: program?.masterTripId || undefined,
      details: guaranteeForm.details,
      costCenterId: guaranteeForm.costCenterId || undefined
    });

    setShowAddGuarantee(false);
    setGuaranteeForm({
      supplierId: '',
      programId: '',
      amount: '',
      currencyCode: settings.baseCurrency || 'EGP',
      exchangeRate: '1',
      treasuryId: '',
      date: new Date().toISOString().split('T')[0],
      details: '',
      costCenterId: ''
    });
  };

  const releaseGuarantee = (tx: Transaction) => {
    askConfirm('هل تريد تأكيد استرداد خطاب الضمان هذا وإعادته للخزينة؟', () => {
      addTransaction({
        description: `استرداد خطاب ضمان: ${tx.description}`,
        amount: tx.amount,
        amountInBase: tx.amountInBase,
        currencyCode: tx.currencyCode,
        exchangeRate: tx.exchangeRate,
        type: 'INCOME',
        category: 'GUARANTEE_LETTER',
        date: new Date().toISOString().split('T')[0],
        relatedEntityId: tx.relatedEntityId,
        relatedEntityType: 'SUPPLIER',
        treasuryId: tx.treasuryId, // استرداد لنفس الخزنة أو يمكن اختيار أخرى
        programId: tx.programId,
        masterTripId: tx.masterTripId,
        costCenterId: tx.costCenterId,
        parentTransactionId: tx.id // ربط الاسترداد بالأصل
      });
    });
  };

  const startEditBooking = (tx: Transaction) => {
    setEditingBookingId(tx.id);
    setBookingForm({
      programId: tx.programId || '',
      customerId: tx.bookingType === 'AGENT' ? '' : (tx.relatedEntityId || ''),
      agentId: tx.bookingType === 'AGENT' ? (tx.relatedEntityId || '') : '',
      bookingType: tx.bookingType || 'DIRECT',
      employeeId: tx.employeeId || '',
      accommodationEmployeeId: tx.accommodationEmployeeId || '',
      accommodation: tx.accommodation || '',
      roomType: tx.roomType || 'DEFAULT',
      discount: (tx.discount || 0).toString(),
      date: tx.date,
      customSellingPrice: (tx.sellingPrice || 0).toString(),
      adultCount: (tx.adultCount || 0).toString(),
      childCount: (tx.childCount || 0).toString(),
      infantCount: (tx.infantCount || 0).toString(),
      supervisorCount: (tx.supervisorCount || 0).toString(),
      supervisorName: tx.supervisorName || '',
      names: tx.names || '',
      employeeCommissionRate: (tx.employeeCommissionRate || 0).toString(),
      commissionAmount: (tx.commissionAmount || 0).toString(),
      applyCommission: tx.applyCommission ?? true,
      costCenterId: tx.costCenterId || ''
    });
    setShowAddBooking(true);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trip = (programs || []).find(p => p.id === bookingForm.programId);
    if (!trip) return;

    const editingTx = editingBookingId ? (transactions || []).find(t => t.id === editingBookingId) : null;
    const groupId = editingTx?.bookingGroupId || `BG-${Date.now()}`;

    const adultCount = parseInt(bookingForm.adultCount || '0');
    const childCount = parseInt(bookingForm.childCount || '0');
    const infantCount = parseInt(bookingForm.infantCount || '0');
    const supervisorCount = parseInt(bookingForm.supervisorCount || '0');
    const totalPilgrims = adultCount + childCount + supervisorCount;

    // التحقق من كوتا التأشيرات للمحافظ السعودية
    if (trip.components && trip.components.length > 0) {
      for (const comp of trip.components) {
        const sid = comp.supplierId || trip.supplierId;
        if (sid && supplierQuotas[sid]) {
          const q = supplierQuotas[sid];
          if (q.used + totalPilgrims > q.total) {
            notify(`خطأ: لا يمكن إتمام الحجز. كوتا التأشيرات للمورد (${(suppliers || []).find(s => s.id === sid)?.company}) غير كافية. المتبقي: ${q.total - q.used}`, "error");
            return;
          }
        }
      }
    } else if (trip.supplierId && supplierQuotas[trip.supplierId]) {
      const q = supplierQuotas[trip.supplierId];
      if (q.used + totalPilgrims > q.total) {
        notify(`خطأ: لا يمكن إتمام الحجز. كوتا التأشيرات للمورد (${(suppliers || []).find(s => s.id === trip.supplierId)?.company}) غير كافية. المتبقي: ${q.total - q.used}`, "error");
        return;
      }
    }

    if (trip.components && trip.components.length > 0) {
      const tripRate = trip.exchangeRate || 1;

      // Calculate current total selling price in Base currency for discount distribution
      let currentTotalSellingBase = 0;
      trip.components.forEach(comp => {
        if (comp.type !== 'EXPENSE') {
          if (comp.pricingMode === 'TOTAL') {
            currentTotalSellingBase += (comp.sellingPrice || 0);
          } else {
            const compAdultSelling = 
              bookingForm.roomType === 'SINGLE' ? (comp.singleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
              bookingForm.roomType === 'DOUBLE' ? (comp.doubleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
              bookingForm.roomType === 'TRIPLE' ? (comp.tripleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
              bookingForm.roomType === 'QUAD' ? (comp.quadSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
              (comp.adultSellingPrice || comp.sellingPrice || 0);
              
            const compChildSelling = 
              bookingForm.roomType === 'SINGLE' ? (comp.singleChildSellingPrice || comp.childSellingPrice || 0) :
              bookingForm.roomType === 'DOUBLE' ? (comp.doubleChildSellingPrice || comp.childSellingPrice || 0) :
              bookingForm.roomType === 'TRIPLE' ? (comp.tripleChildSellingPrice || comp.childSellingPrice || 0) :
              bookingForm.roomType === 'QUAD' ? (comp.quadChildSellingPrice || comp.childSellingPrice || 0) :
              (comp.childSellingPrice || 0);

            const compInfantSelling = 
              bookingForm.roomType === 'SINGLE' ? (comp.singleInfantSellingPrice || comp.infantSellingPrice || 0) :
              bookingForm.roomType === 'DOUBLE' ? (comp.doubleInfantSellingPrice || comp.infantSellingPrice || 0) :
              bookingForm.roomType === 'TRIPLE' ? (comp.tripleInfantSellingPrice || comp.infantSellingPrice || 0) :
              bookingForm.roomType === 'QUAD' ? (comp.quadInfantSellingPrice || comp.infantSellingPrice || 0) :
              (comp.infantSellingPrice || 0);

            currentTotalSellingBase += (adultCount * compAdultSelling) + (childCount * compChildSelling) + (infantCount * compInfantSelling) + (supervisorCount * compAdultSelling);
          }
        }
      });

      // Handle manual custom price override even for components
      const manualTotalBase = parseFloat(bookingForm.customSellingPrice || '0') * tripRate;
      const scalingFactor = (currentTotalSellingBase > 0) ? (manualTotalBase * (1 / (currentTotalSellingBase || 1))) : (manualTotalBase > 0 ? 1 : null);

      // Create transactions for each component
      (trip.components || []).forEach(comp => {
        if (!comp) return;
        const category = comp.type === 'FLIGHT' ? 'FLIGHT' : comp.type === 'GUARANTEE_LETTER' ? 'GUARANTEE_LETTER' : comp.type === 'GIFTS_AND_PRINTS' ? 'GIFTS_AND_PRINTS' : 'GENERAL_SERVICE';
        const type = 'INCOME';
        
        let currentSellingPriceBase = 0;
        let currentPurchasePriceBase = 0;

        if (comp.pricingMode === 'TOTAL') {
          currentSellingPriceBase = comp.type === 'EXPENSE' ? 0 : (comp.sellingPrice || 0);
          
          // Apply scaling for TOTAL mode as well
          if (scalingFactor !== null && comp.type !== 'EXPENSE') {
            if (currentTotalSellingBase > 0) {
              currentSellingPriceBase = currentSellingPriceBase * scalingFactor;
            } else {
              const nonExpenseCount = (trip.components || []).filter(c => c && c.type !== 'EXPENSE').length || 1;
              currentSellingPriceBase = manualTotalBase * (1 / (nonExpenseCount || 1));
            }
          }

          currentPurchasePriceBase = comp.purchasePrice || 0;
        } else {
          const compAdultSelling = 
            bookingForm.roomType === 'SINGLE' ? (comp.singleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (comp.doubleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (comp.tripleSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
            bookingForm.roomType === 'QUAD' ? (comp.quadSellingPrice || comp.adultSellingPrice || comp.sellingPrice || 0) :
            (comp.adultSellingPrice || comp.sellingPrice || 0);

          const compChildSelling = 
            bookingForm.roomType === 'SINGLE' ? (comp.singleChildSellingPrice || comp.childSellingPrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (comp.doubleChildSellingPrice || comp.childSellingPrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (comp.tripleChildSellingPrice || comp.childSellingPrice || 0) :
            bookingForm.roomType === 'QUAD' ? (comp.quadChildSellingPrice || comp.childSellingPrice || 0) :
            (comp.childSellingPrice || 0);

          const compInfantSelling = 
            bookingForm.roomType === 'SINGLE' ? (comp.singleInfantSellingPrice || comp.infantSellingPrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (comp.doubleInfantSellingPrice || comp.infantSellingPrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (comp.tripleInfantSellingPrice || comp.infantSellingPrice || 0) :
            bookingForm.roomType === 'QUAD' ? (comp.quadInfantSellingPrice || comp.infantSellingPrice || 0) :
            (comp.infantSellingPrice || 0);

          currentSellingPriceBase = comp.type === 'EXPENSE' ? 0 : (adultCount * compAdultSelling) + (childCount * compChildSelling) + (infantCount * compInfantSelling) + (supervisorCount * compAdultSelling);

          // Apply scaling if manual total price is provided
          if (scalingFactor !== null && comp.type !== 'EXPENSE') {
            if (currentTotalSellingBase > 0) {
              currentSellingPriceBase = currentSellingPriceBase * scalingFactor;
            } else {
              // If original total was 0, distribute manual total equally among non-expense components
              const nonExpenseCount = (trip.components || []).filter(c => c && c.type !== 'EXPENSE').length || 1;
              currentSellingPriceBase = manualTotalBase * (1 / (nonExpenseCount || 1));
            }
          }

          const compAdultPurchase = 
            bookingForm.roomType === 'SINGLE' ? (comp.singlePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (comp.doublePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (comp.triplePurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
            bookingForm.roomType === 'QUAD' ? (comp.quadPurchasePrice || comp.adultPurchasePrice || comp.purchasePrice || 0) :
            (comp.adultPurchasePrice || comp.purchasePrice || 0);

          const compChildPurchase = 
            bookingForm.roomType === 'SINGLE' ? (comp.singleChildPurchasePrice || comp.childPurchasePrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (comp.doubleChildPurchasePrice || comp.childPurchasePrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (comp.tripleChildPurchasePrice || comp.childPurchasePrice || 0) :
            bookingForm.roomType === 'QUAD' ? (comp.quadChildPurchasePrice || comp.childPurchasePrice || 0) :
            (comp.childPurchasePrice || 0);

          const compInfantPurchase = 
            bookingForm.roomType === 'SINGLE' ? (comp.singleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
            bookingForm.roomType === 'DOUBLE' ? (comp.doubleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
            bookingForm.roomType === 'TRIPLE' ? (comp.tripleInfantPurchasePrice || comp.infantPurchasePrice || 0) :
            bookingForm.roomType === 'QUAD' ? (comp.quadInfantPurchasePrice || comp.infantPurchasePrice || 0) :
            (comp.infantPurchasePrice || 0);

          currentPurchasePriceBase = (adultCount * compAdultPurchase) + (childCount * compChildPurchase) + (infantCount * compInfantPurchase) + (supervisorCount * compAdultPurchase);
        }
        
        const componentDiscountTrip = comp.type === 'EXPENSE' ? 0 : (parseFloat(bookingForm.discount || '0') * (currentSellingPriceBase * (1 / (currentTotalSellingBase || 1)))) * (1 / (tripRate || 1));
        const sellPriceTrip = currentSellingPriceBase * (1 / (tripRate || 1));

        const componentCommission = comp.isCommissionable !== false ? (comp.commissionAmount || parseFloat(bookingForm.employeeCommissionRate || '0')) : 0;

        const paxDetails = `(${adultCount} بالغ، ${childCount} طفل، ${infantCount} رضيع${supervisorCount > 0 ? `، ${supervisorCount} مشرف${bookingForm.supervisorName ? `: ${bookingForm.supervisorName}` : ''}` : ''})`;
        const nameDetails = bookingForm.names ? ` - الأسماء: ${bookingForm.names}` : '';
        const compDesc = comp.type === 'FLIGHT' ? 'تذكرة طيران' : comp.type === 'VISA' ? 'تأشيرة' : comp.type === 'HOTEL' ? 'فندق' : comp.type === 'INTERNAL_TRANSPORT' ? 'نقل داخلي' : comp.type === 'SAUDI_TRANSPORT' ? 'نقل سعودي' : comp.type === 'GUARANTEE_LETTER' ? 'خطاب ضمان' : comp.type === 'GIFTS_AND_PRINTS' ? 'هدايا ومطبوعات' : 'مصروفات';
        const accommodationText = bookingForm.accommodation?.trim() || trip.name || 'غير محدد';
        const descriptionText = `${compDesc} - ${accommodationText} ${paxDetails}${nameDetails}`;

        const txPayload = {
          description: descriptionText,
          amount: sellPriceTrip - componentDiscountTrip,
          currencyCode: trip.currencyCode,
          exchangeRate: trip.exchangeRate,
          type,
          category,
          date: bookingForm.date,
          relatedEntityId: bookingForm.bookingType === 'AGENT' ? bookingForm.agentId : bookingForm.customerId,
          relatedEntityType: 'CUSTOMER' as 'CUSTOMER',
          supplierId: comp.supplierId || trip.supplierId,
          supplierType: comp.supplierType || (trip as any).supplierType || 'SUPPLIER',
          employeeId: bookingForm.employeeId,
          employeeCommissionRate: componentCommission,
          accommodationEmployeeId: bookingForm.accommodationEmployeeId,
          accommodation: comp.type === 'HOTEL' ? comp.name : bookingForm.accommodation,
          // تم تحديث سعر الشراء ليشمل المشرف، مع إبقائه في الحقل المناسب للتقارير
          purchasePrice: currentPurchasePriceBase * (1 / (tripRate || 1)), 
          sellingPrice: sellPriceTrip,
          adultCount,
          childCount,
          infantCount,
          supervisorCount,
          supervisorName: bookingForm.supervisorName,
          names: bookingForm.names,
          roomType: bookingForm.roomType,
          discount: componentDiscountTrip,
          programId: trip.id,
          masterTripId: trip.masterTripId,
          componentId: comp.id,
          bookingGroupId: groupId,
          bookingType: bookingForm.bookingType,
          agentId: bookingForm.bookingType === 'AGENT' ? bookingForm.agentId : undefined,
          isSaleOnly: false, // يتم الترحيل للعميل والمورد معاً
          visaStatus: comp.type === 'VISA' ? 'PENDING' : undefined,
          visaIssuedCount: comp.type === 'VISA' ? 0 : undefined,
          costCenterId: bookingForm.costCenterId || undefined,
          applyCommission: bookingForm.applyCommission
        };
        
        if (editingBookingId) {
          // محاولة العثور على المعاملة المطابقة لهذا المكون ضمن المجموعة
          let match = (transactions || []).find(t => 
            t.bookingGroupId === groupId && t.componentId === comp.id && !t.isVoided
          );

          // إذا لم نجد بـ groupId (ربما حجز قديم)، نحاول البحث بالخصائص
          if (!match && !editingTx?.bookingGroupId) {
            match = (transactions || []).find(t => 
              t.programId === trip.id &&
              t.relatedEntityId === (bookingForm.bookingType === 'AGENT' ? bookingForm.agentId : bookingForm.customerId) &&
              t.date === bookingForm.date &&
              t.category === category &&
              t.supplierId === (comp.supplierId || trip.supplierId) &&
              !t.bookingGroupId &&
              !t.isVoided
            );
          }
          
          if (match) {
            updateTransaction(match.id, txPayload);
          } else if (editingTx && editingTx.id === editingBookingId && editingTx.category === category && (editingTx.supplierId === (comp.supplierId || trip.supplierId))) {
            // fallback إذا فشل كل شيء وكان هذا هو السجل الذي ضغطنا عليه تعديل
            updateTransaction(editingBookingId, txPayload);
          } else if (editingTx?.bookingGroupId) {
            // إذا كنا في حجز "حديث" (له groupId) ولم نجد المعاملة لهذا المكون، فهذا يعني أنه مكون جديد أضيف للبرنامج
            addTransaction(txPayload);
          }
          // ملاحظة: للأرقام القديمة التي ليس لها groupId، لا نضيف مكونات جديدة تلقائياً لتجنب اللبس
        } else {
          addTransaction(txPayload);
        }
      });
    } else {
      // Regular booking
      const adultSelling = 
        bookingForm.bookingType === 'AGENT' ? (
          bookingForm.roomType === 'SINGLE' ? (trip.singleAgentPrice || trip.adultAgentPrice || 0) :
          bookingForm.roomType === 'DOUBLE' ? (trip.doubleAgentPrice || trip.adultAgentPrice || 0) :
          bookingForm.roomType === 'TRIPLE' ? (trip.tripleAgentPrice || trip.adultAgentPrice || 0) :
          bookingForm.roomType === 'QUAD' ? (trip.quadAgentPrice || trip.adultAgentPrice || 0) :
          (trip.adultAgentPrice || 0)
        ) : (
          bookingForm.roomType === 'SINGLE' ? parseFloat(trip.singleSellingPrice?.toString() || trip.adultSellingPrice?.toString() || trip.sellingPrice?.toString() || '0') :
          bookingForm.roomType === 'DOUBLE' ? parseFloat(trip.doubleSellingPrice?.toString() || trip.adultSellingPrice?.toString() || trip.sellingPrice?.toString() || '0') :
          bookingForm.roomType === 'TRIPLE' ? parseFloat(trip.tripleSellingPrice?.toString() || trip.adultSellingPrice?.toString() || trip.sellingPrice?.toString() || '0') :
          bookingForm.roomType === 'QUAD' ? parseFloat(trip.quadSellingPrice?.toString() || trip.adultSellingPrice?.toString() || trip.sellingPrice?.toString() || '0') :
          parseFloat(trip.adultSellingPrice?.toString() || trip.sellingPrice?.toString() || '0')
        );

      const childSelling = 
        bookingForm.bookingType === 'AGENT' ? (trip.childAgentPrice || 0) : (
          bookingForm.roomType === 'SINGLE' ? parseFloat(trip.singleChildSellingPrice?.toString() || trip.childSellingPrice?.toString() || '0') :
          bookingForm.roomType === 'DOUBLE' ? parseFloat(trip.doubleChildSellingPrice?.toString() || trip.childSellingPrice?.toString() || '0') :
          bookingForm.roomType === 'TRIPLE' ? parseFloat(trip.tripleChildSellingPrice?.toString() || trip.childSellingPrice?.toString() || '0') :
          bookingForm.roomType === 'QUAD' ? parseFloat(trip.quadChildSellingPrice?.toString() || trip.childSellingPrice?.toString() || '0') :
          parseFloat(trip.childSellingPrice?.toString() || '0')
        );

      const infantSelling = 
        bookingForm.bookingType === 'AGENT' ? (trip.infantAgentPrice || 0) : (
          bookingForm.roomType === 'SINGLE' ? parseFloat(trip.singleInfantSellingPrice?.toString() || trip.infantSellingPrice?.toString() || '0') :
          bookingForm.roomType === 'DOUBLE' ? parseFloat(trip.doubleInfantSellingPrice?.toString() || trip.infantSellingPrice?.toString() || '0') :
          bookingForm.roomType === 'TRIPLE' ? parseFloat(trip.tripleInfantSellingPrice?.toString() || trip.infantSellingPrice?.toString() || '0') :
          bookingForm.roomType === 'QUAD' ? parseFloat(trip.quadInfantSellingPrice?.toString() || trip.infantSellingPrice?.toString() || '0') :
          parseFloat(trip.infantSellingPrice?.toString() || '0')
        );
      
      const adultPurchase = 
        bookingForm.roomType === 'SINGLE' ? parseFloat(trip.singlePurchasePrice?.toString() || trip.adultPurchasePrice?.toString() || trip.purchasePrice?.toString() || '0') :
        bookingForm.roomType === 'DOUBLE' ? parseFloat(trip.doublePurchasePrice?.toString() || trip.adultPurchasePrice?.toString() || trip.purchasePrice?.toString() || '0') :
        bookingForm.roomType === 'TRIPLE' ? parseFloat(trip.triplePurchasePrice?.toString() || trip.adultPurchasePrice?.toString() || trip.purchasePrice?.toString() || '0') :
        bookingForm.roomType === 'QUAD' ? parseFloat(trip.quadPurchasePrice?.toString() || trip.adultPurchasePrice?.toString() || trip.purchasePrice?.toString() || '0') :
        parseFloat(trip.adultPurchasePrice?.toString() || trip.purchasePrice?.toString() || '0');

      const childPurchase = 
        bookingForm.roomType === 'SINGLE' ? parseFloat(trip.singleChildPurchasePrice?.toString() || trip.childPurchasePrice?.toString() || '0') :
        bookingForm.roomType === 'DOUBLE' ? parseFloat(trip.doubleChildPurchasePrice?.toString() || trip.childPurchasePrice?.toString() || '0') :
        bookingForm.roomType === 'TRIPLE' ? parseFloat(trip.tripleChildPurchasePrice?.toString() || trip.childPurchasePrice?.toString() || '0') :
        bookingForm.roomType === 'QUAD' ? parseFloat(trip.quadChildPurchasePrice?.toString() || trip.childPurchasePrice?.toString() || '0') :
        parseFloat(trip.childPurchasePrice?.toString() || '0');

      const infantPurchase = 
        bookingForm.roomType === 'SINGLE' ? parseFloat(trip.singleInfantPurchasePrice?.toString() || trip.infantPurchasePrice?.toString() || '0') :
        bookingForm.roomType === 'DOUBLE' ? parseFloat(trip.doubleInfantPurchasePrice?.toString() || trip.infantPurchasePrice?.toString() || '0') :
        bookingForm.roomType === 'TRIPLE' ? parseFloat(trip.tripleInfantPurchasePrice?.toString() || trip.infantPurchasePrice?.toString() || '0') :
        bookingForm.roomType === 'QUAD' ? parseFloat(trip.quadInfantPurchasePrice?.toString() || trip.infantPurchasePrice?.toString() || '0') :
        parseFloat(trip.infantPurchasePrice?.toString() || '0');

      const totalSelling = (adultCount * adultSelling) + (childCount * childSelling) + (infantCount * infantSelling) + (supervisorCount * adultSelling);
      const totalPurchase = (adultCount * adultPurchase) + (childCount * childPurchase) + (infantCount * infantPurchase) + (supervisorCount * adultPurchase);

      const finalSelling = parseFloat(bookingForm.customSellingPrice || totalSelling.toString());
      const discount = parseFloat(bookingForm.discount || '0');

      const paxDetails = `(${adultCount} بالغ، ${childCount} طفل، ${infantCount} رضيع${supervisorCount > 0 ? `، ${supervisorCount} مشرف${bookingForm.supervisorName ? `: ${bookingForm.supervisorName}` : ''}` : ''})`;
      const nameDetails = bookingForm.names ? ` - الأسماء: ${bookingForm.names}` : '';
      const tripTypeDesc = trip.type === 'HAJJ' ? 'حج' : 'عمرة';
      const accommodationText = bookingForm.accommodation?.trim() || trip.name || 'غير محدد';
      const descriptionText = `${tripTypeDesc} - ${accommodationText} ${paxDetails}${nameDetails}`;

      const txPayload = {
        description: descriptionText,
        amount: finalSelling - discount,
        currencyCode: trip.currencyCode,
        exchangeRate: trip.exchangeRate,
        type: 'INCOME',
        category: 'HAJJ_UMRAH',
        date: bookingForm.date,
        relatedEntityId: bookingForm.bookingType === 'AGENT' ? bookingForm.agentId : bookingForm.customerId,
        relatedEntityType: 'CUSTOMER' as 'CUSTOMER',
        supplierId: trip.supplierId,
        supplierType: (trip as any).supplierType || 'SUPPLIER',
        employeeId: bookingForm.employeeId,
        employeeCommissionRate: parseFloat(bookingForm.employeeCommissionRate || '0'),
        accommodationEmployeeId: bookingForm.accommodationEmployeeId,
        accommodation: bookingForm.accommodation,
        purchasePrice: totalPurchase,
        sellingPrice: finalSelling,
        adultCount,
        childCount,
        infantCount,
        supervisorCount,
        supervisorName: bookingForm.supervisorName,
        names: bookingForm.names,
        roomType: bookingForm.roomType,
        discount,
        programId: trip.id,
        masterTripId: trip.masterTripId,
        bookingGroupId: groupId,
        bookingType: bookingForm.bookingType,
        agentId: bookingForm.bookingType === 'AGENT' ? bookingForm.agentId : undefined,
        visaStatus: 'PENDING',
        visaIssuedCount: 0,
        costCenterId: bookingForm.costCenterId || undefined,
        applyCommission: bookingForm.applyCommission
      };
      if (editingBookingId) updateTransaction(editingBookingId, txPayload);
      else addTransaction(txPayload);
    }

    setShowAddBooking(false);
    setEditingBookingId(null);
    setBookingForm(INITIAL_BOOKING_FORM);
  };

  const handleComponentSubmit = () => {
    const rate = parseFloat(componentForm.exchangeRate || '1') || 1;
    const quantity = parseFloat(componentForm.quantity || '1') || 1;
    const basePurchase = parseFloat(componentForm.purchasePrice || '0') || 
                         parseFloat(componentForm.doublePurchasePrice || '0') || 
                         parseFloat(componentForm.singlePurchasePrice || '0') || 
                         parseFloat(componentForm.triplePurchasePrice || '0') || 
                         parseFloat(componentForm.quadPurchasePrice || '0') || 
                         parseFloat(componentForm.adultPurchasePrice || '0') || 0;
    
    const baseSelling = parseFloat(componentForm.sellingPrice || '0') || 
                        parseFloat(componentForm.doubleSellingPrice || '0') || 
                        parseFloat(componentForm.singleSellingPrice || '0') || 
                        parseFloat(componentForm.tripleSellingPrice || '0') || 
                        parseFloat(componentForm.quadSellingPrice || '0') || 
                        parseFloat(componentForm.adultSellingPrice || '0') || 0;

    const originalPurchasePrice = basePurchase * quantity;
    const originalSellingPrice = baseSelling * quantity;
    
    const originalAdultPurchasePrice = (parseFloat(componentForm.adultPurchasePrice || '0') || basePurchase) * quantity;
    const originalChildPurchasePrice = parseFloat(componentForm.childPurchasePrice || '0') * quantity;
    const originalInfantPurchasePrice = parseFloat(componentForm.infantPurchasePrice || '0') * quantity;
    const originalSinglePurchasePrice = parseFloat(componentForm.singlePurchasePrice || '0') * quantity;
    const originalSingleChildPurchasePrice = parseFloat(componentForm.singleChildPurchasePrice || '0') * quantity;
    const originalSingleInfantPurchasePrice = parseFloat(componentForm.singleInfantPurchasePrice || '0') * quantity;
    const originalDoublePurchasePrice = parseFloat(componentForm.doublePurchasePrice || '0') * quantity;
    const originalDoubleChildPurchasePrice = parseFloat(componentForm.doubleChildPurchasePrice || '0') * quantity;
    const originalDoubleInfantPurchasePrice = parseFloat(componentForm.doubleInfantPurchasePrice || '0') * quantity;
    const originalTriplePurchasePrice = parseFloat(componentForm.triplePurchasePrice || '0') * quantity;
    const originalTripleChildPurchasePrice = parseFloat(componentForm.tripleChildPurchasePrice || '0') * quantity;
    const originalTripleInfantPurchasePrice = parseFloat(componentForm.tripleInfantPurchasePrice || '0') * quantity;
    const originalQuadPurchasePrice = parseFloat(componentForm.quadPurchasePrice || '0') * quantity;
    const originalQuadChildPurchasePrice = parseFloat(componentForm.quadChildPurchasePrice || '0') * quantity;
    const originalQuadInfantPurchasePrice = parseFloat(componentForm.quadInfantPurchasePrice || '0') * quantity;

    const originalAdultSellingPrice = (parseFloat(componentForm.adultSellingPrice || '0') || baseSelling) * quantity;
    const originalChildSellingPrice = parseFloat(componentForm.childSellingPrice || '0') * quantity;
    const originalInfantSellingPrice = parseFloat(componentForm.infantSellingPrice || '0') * quantity;
    const originalSingleSellingPrice = parseFloat(componentForm.singleSellingPrice || '0') * quantity;
    const originalSingleChildSellingPrice = parseFloat(componentForm.singleChildSellingPrice || '0') * quantity;
    const originalSingleInfantSellingPrice = parseFloat(componentForm.singleInfantSellingPrice || '0') * quantity;
    const originalDoubleSellingPrice = parseFloat(componentForm.doubleSellingPrice || '0') * quantity;
    const originalDoubleChildSellingPrice = parseFloat(componentForm.doubleChildSellingPrice || '0') * quantity;
    const originalDoubleInfantSellingPrice = parseFloat(componentForm.doubleInfantSellingPrice || '0') * quantity;
    const originalTripleSellingPrice = parseFloat(componentForm.tripleSellingPrice || '0') * quantity;
    const originalTripleChildSellingPrice = parseFloat(componentForm.tripleChildSellingPrice || '0') * quantity;
    const originalTripleInfantSellingPrice = parseFloat(componentForm.tripleInfantSellingPrice || '0') * quantity;
    const originalQuadSellingPrice = parseFloat(componentForm.quadSellingPrice || '0') * quantity;
    const originalQuadChildSellingPrice = parseFloat(componentForm.quadChildSellingPrice || '0') * quantity;
    const originalQuadInfantSellingPrice = parseFloat(componentForm.quadInfantSellingPrice || '0') * quantity;

    const purchasePrice = originalPurchasePrice * rate;
    const sellingPrice = componentForm.type === 'EXPENSE' ? 0 : originalSellingPrice * rate;

    const adultPurchasePrice = originalAdultPurchasePrice * rate;
    const childPurchasePrice = originalChildPurchasePrice * rate;
    const infantPurchasePrice = originalInfantPurchasePrice * rate;
    const singlePurchasePrice = originalSinglePurchasePrice * rate;
    const singleChildPurchasePrice = originalSingleChildPurchasePrice * rate;
    const singleInfantPurchasePrice = originalSingleInfantPurchasePrice * rate;
    const doublePurchasePrice = originalDoublePurchasePrice * rate;
    const doubleChildPurchasePrice = originalDoubleChildPurchasePrice * rate;
    const doubleInfantPurchasePrice = originalDoubleInfantPurchasePrice * rate;
    const triplePurchasePrice = originalTriplePurchasePrice * rate;
    const tripleChildPurchasePrice = originalTripleChildPurchasePrice * rate;
    const tripleInfantPurchasePrice = originalTripleInfantPurchasePrice * rate;
    const quadPurchasePrice = originalQuadPurchasePrice * rate;
    const quadChildPurchasePrice = originalQuadChildPurchasePrice * rate;
    const quadInfantPurchasePrice = originalQuadInfantPurchasePrice * rate;

    const adultSellingPrice = originalAdultSellingPrice * rate;
    const childSellingPrice = originalChildSellingPrice * rate;
    const infantSellingPrice = originalInfantSellingPrice * rate;
    const singleSellingPrice = originalSingleSellingPrice * rate;
    const singleChildSellingPrice = originalSingleChildSellingPrice * rate;
    const singleInfantSellingPrice = originalSingleInfantSellingPrice * rate;
    const doubleSellingPrice = originalDoubleSellingPrice * rate;
    const doubleChildSellingPrice = originalDoubleChildSellingPrice * rate;
    const doubleInfantSellingPrice = originalDoubleInfantSellingPrice * rate;
    const tripleSellingPrice = originalTripleSellingPrice * rate;
    const tripleChildSellingPrice = originalTripleChildSellingPrice * rate;
    const tripleInfantSellingPrice = originalTripleInfantSellingPrice * rate;
    const quadSellingPrice = originalQuadSellingPrice * rate;
    const quadChildSellingPrice = originalQuadChildSellingPrice * rate;
    const quadInfantSellingPrice = originalQuadInfantSellingPrice * rate;

    const compId = editingComponentId || Date.now().toString();
    const comp: UmrahComponent = {
      id: compId,
      type: componentForm.type,
      name: componentForm.name,
      pricingMode: componentForm.pricingMode,
      quantity,
      purchasePrice,
      sellingPrice,
      adultPurchasePrice,
      childPurchasePrice,
      infantPurchasePrice,
      singlePurchasePrice,
      singleChildPurchasePrice,
      singleInfantPurchasePrice,
      doublePurchasePrice,
      doubleChildPurchasePrice,
      doubleInfantPurchasePrice,
      triplePurchasePrice,
      tripleChildPurchasePrice,
      tripleInfantPurchasePrice,
      quadPurchasePrice,
      quadChildPurchasePrice,
      quadInfantPurchasePrice,
      adultSellingPrice,
      childSellingPrice,
      infantSellingPrice,
      singleSellingPrice,
      singleChildSellingPrice,
      singleInfantSellingPrice,
      doubleSellingPrice,
      doubleChildSellingPrice,
      doubleInfantSellingPrice,
      tripleSellingPrice,
      tripleChildSellingPrice,
      tripleInfantSellingPrice,
      quadSellingPrice,
      quadChildSellingPrice,
      quadInfantSellingPrice,
      originalPurchasePrice,
      originalSellingPrice,
      originalAdultPurchasePrice,
      originalChildPurchasePrice,
      originalInfantPurchasePrice,
      originalSinglePurchasePrice,
      originalSingleChildPurchasePrice,
      originalSingleInfantPurchasePrice,
      originalDoublePurchasePrice,
      originalDoubleChildPurchasePrice,
      originalDoubleInfantPurchasePrice,
      originalTriplePurchasePrice,
      originalTripleChildPurchasePrice,
      originalTripleInfantPurchasePrice,
      originalQuadPurchasePrice,
      originalQuadChildPurchasePrice,
      originalQuadInfantPurchasePrice,
      originalAdultSellingPrice,
      originalChildSellingPrice,
      originalInfantSellingPrice,
      originalSingleSellingPrice,
      originalSingleChildSellingPrice,
      originalSingleInfantSellingPrice,
      originalDoubleSellingPrice,
      originalDoubleChildSellingPrice,
      originalDoubleInfantSellingPrice,
      originalTripleSellingPrice,
      originalTripleChildSellingPrice,
      originalTripleInfantSellingPrice,
      originalQuadSellingPrice,
      originalQuadChildSellingPrice,
      originalQuadInfantSellingPrice,
      currencyCode: componentForm.currencyCode,
      exchangeRate: rate,
      supplierId: componentForm.supplierId || undefined,
      supplierType: componentForm.supplierType,
      isCommissionable: componentForm.isCommissionable,
      details: componentForm.details || undefined
    };

    // إثبات مديونية الشراء أو تحديثها
    if (comp.supplierId && originalPurchasePrice > 0) {
      const existingTx = editingComponentId ? (transactions || []).find(t => 
        t.programId === (editingProgramId || undefined) && 
        t.isPurchaseOnly && 
        t.description.includes(`شراء مكون: ${comp.name}`)
      ) : null;

      if (existingTx) {
        // تحديث المعاملة الموجودة
        updateTransaction(existingTx.id, {
          ...existingTx,
          amount: originalPurchasePrice,
          purchasePrice: originalPurchasePrice,
          amountInBase: originalPurchasePrice * rate,
          exchangeRate: rate,
          currencyCode: comp.currencyCode,
          employeeId: comp.employeeId || programForm.employeeId,
          employeeCommissionRate: parseFloat(programForm.employeeCommissionRate || '0'),
          applyCommission: comp.isCommissionable !== undefined ? comp.isCommissionable : programForm.applyCommission
        });
        notify("تم تحديث فاتورة الشراء ومديونية المورد بنجاح لتطابق التعديلات الجديدة", "success");
      } else {
        // إضافة معاملة جديدة إذا لم تكن موجودة ووافق المستخدم
        askConfirm(`هل تريد إثبات فاتورة شراء ومديونية للمورد (${comp.name}) بقيمة ${originalPurchasePrice} ${comp.currencyCode} الآن؟`, () => {
          addTransaction({
            description: `شراء مكون: ${comp.name} - برنامج: ${programForm.name || 'جديد'}`,
            amount: originalPurchasePrice,
            currencyCode: comp.currencyCode,
            exchangeRate: rate,
            type: 'EXPENSE',
            category: comp.type === 'FLIGHT' ? 'FLIGHT' : comp.type === 'GUARANTEE_LETTER' ? 'GUARANTEE_LETTER' : comp.type === 'GIFTS_AND_PRINTS' ? 'GIFTS_AND_PRINTS' : 'GENERAL_SERVICE',
            date: new Date().toISOString().split('T')[0],
            supplierId: comp.supplierId,
            relatedEntityId: comp.supplierId,
            relatedEntityType: comp.supplierType || 'SUPPLIER',
            purchasePrice: originalPurchasePrice,
            amountInBase: originalPurchasePrice * rate,
            sellingPrice: 0,
            programId: editingProgramId || undefined,
            isPurchaseOnly: true,
            employeeId: comp.employeeId || programForm.employeeId,
            employeeCommissionRate: parseFloat(programForm.employeeCommissionRate || '0'),
            applyCommission: comp.isCommissionable !== undefined ? comp.isCommissionable : programForm.applyCommission
          });
          notify("تم إثبات فاتورة الشراء بنجاح", "success");
        });
      }
    }

    if (editingComponentId) {
      setProgramForm(prev => ({ ...prev, components: (prev.components || []).map(c => c.id === editingComponentId ? comp : c) }));
    } else {
      setProgramForm(prev => ({ ...prev, components: [...(prev.components || []), comp] }));
    }
    setShowAddComponent(false);
    setEditingComponentId(null);
    setComponentForm({ ...INITIAL_COMPONENT_FORM, currencyCode: settings.baseCurrency || 'EGP' });
  };

  const startEditComponent = (comp: UmrahComponent) => {
    setEditingComponentId(comp.id);
    const q = comp.quantity || 1;
    setComponentForm({
      type: comp.type,
      name: comp.name,
      pricingMode: comp.pricingMode || 'PER_PERSON',
      quantity: q.toString(),
      purchasePrice: (comp.originalPurchasePrice * (1 / q)).toString(),
      sellingPrice: (comp.originalSellingPrice * (1 / q)).toString(),
      adultPurchasePrice: (comp.adultPurchasePrice ? (comp.adultPurchasePrice / comp.exchangeRate) * (1 / q) : comp.originalPurchasePrice * (1 / q)).toString(),
      childPurchasePrice: (comp.childPurchasePrice ? (comp.childPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      infantPurchasePrice: (comp.infantPurchasePrice ? (comp.infantPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      singlePurchasePrice: (comp.singlePurchasePrice ? (comp.singlePurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      singleChildPurchasePrice: (comp.singleChildPurchasePrice ? (comp.singleChildPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      singleInfantPurchasePrice: (comp.singleInfantPurchasePrice ? (comp.singleInfantPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      doublePurchasePrice: (comp.doublePurchasePrice ? (comp.doublePurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      doubleChildPurchasePrice: (comp.doubleChildPurchasePrice ? (comp.doubleChildPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      doubleInfantPurchasePrice: (comp.doubleInfantPurchasePrice ? (comp.doubleInfantPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      triplePurchasePrice: (comp.triplePurchasePrice ? (comp.triplePurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      tripleChildPurchasePrice: (comp.tripleChildPurchasePrice ? (comp.tripleChildPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      tripleInfantPurchasePrice: (comp.tripleInfantPurchasePrice ? (comp.tripleInfantPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      quadPurchasePrice: (comp.quadPurchasePrice ? (comp.quadPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      quadChildPurchasePrice: (comp.quadChildPurchasePrice ? (comp.quadChildPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      quadInfantPurchasePrice: (comp.quadInfantPurchasePrice ? (comp.quadInfantPurchasePrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      adultSellingPrice: (comp.adultSellingPrice ? (comp.adultSellingPrice / comp.exchangeRate) * (1 / q) : comp.originalSellingPrice * (1 / q)).toString(),
      childSellingPrice: (comp.childSellingPrice ? (comp.childSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      infantSellingPrice: (comp.infantSellingPrice ? (comp.infantSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      singleSellingPrice: (comp.singleSellingPrice ? (comp.singleSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      singleChildSellingPrice: (comp.singleChildSellingPrice ? (comp.singleChildSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      singleInfantSellingPrice: (comp.singleInfantSellingPrice ? (comp.singleInfantSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      doubleSellingPrice: (comp.doubleSellingPrice ? (comp.doubleSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      doubleChildSellingPrice: (comp.doubleChildSellingPrice ? (comp.doubleChildSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      doubleInfantSellingPrice: (comp.doubleInfantSellingPrice ? (comp.doubleInfantSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      tripleSellingPrice: (comp.tripleSellingPrice ? (comp.tripleSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      tripleChildSellingPrice: (comp.tripleChildSellingPrice ? (comp.tripleChildSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      tripleInfantSellingPrice: (comp.tripleInfantSellingPrice ? (comp.tripleInfantSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      quadSellingPrice: (comp.quadSellingPrice ? (comp.quadSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      quadChildSellingPrice: (comp.quadChildSellingPrice ? (comp.quadChildSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      quadInfantSellingPrice: (comp.quadInfantSellingPrice ? (comp.quadInfantSellingPrice / comp.exchangeRate) * (1 / q) : 0).toString(),
      currencyCode: comp.currencyCode,
      exchangeRate: comp.exchangeRate.toString(),
      supplierId: comp.supplierId || '',
      supplierType: (comp as any).supplierType || 'SUPPLIER',
      isCommissionable: comp.isCommissionable !== false,
      employeeId: comp.employeeId || '',
      commissionAmount: comp.commissionAmount || 0,
      details: comp.details || ''
    });
    setShowAddComponent(true);
    setTimeout(() => {
      document.getElementById('component-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const startEditPrice = (comp: UmrahComponent) => {
    setEditingPriceId(comp.id);
    setTempPurchasePrice(comp.originalPurchasePrice.toString());
    setTempSellingPrice(comp.originalSellingPrice.toString());
  };

  const savePriceEdit = () => {
    if (!editingPriceId) return;
    const rate = (programForm.components || []).find(c => c.id === editingPriceId)?.exchangeRate || 1;
    setProgramForm(prev => ({
      ...prev,
      components: (prev.components || []).map(c =>
        c.id === editingPriceId
          ? {
              ...c,
              originalPurchasePrice: parseFloat(tempPurchasePrice || '0'),
              originalSellingPrice: parseFloat(tempSellingPrice || '0'),
              purchasePrice: parseFloat(tempPurchasePrice || '0') * rate,
              sellingPrice: c.type === 'EXPENSE' ? 0 : parseFloat(tempSellingPrice || '0') * rate
            }
          : c
      )
    }));
    setEditingPriceId(null);
  };

  const cancelPriceEdit = () => {
    setEditingPriceId(null);
  };

  const filteredBookings = useMemo(() => {
    return transactions
      .filter(t => {
        if (!t) return false;
        if (t.category === 'HAJJ_UMRAH') return true;
        if (t.programId) {
          const p = (programs || []).find(prog => prog.id === t.programId);
          return p && (p.type === 'INDIVIDUAL_UMRAH' || p.type === 'GENERAL' || (p.components && p.components.length > 0));
        }
        return false;
      })
      .filter(t => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        const customer = (customers || []).find(c => c?.id === t?.relatedEntityId);
        const emp = (employees || []).find(e => e?.id === t?.employeeId);
        const accEmp = (employees || []).find(e => e?.id === t?.accommodationEmployeeId);
        return (
          (t?.description || '').toLowerCase().includes(s) ||
          (t?.refNo || '').toLowerCase().includes(s) ||
          (customer?.name || '').toLowerCase().includes(s) ||
          (emp?.name || '').toLowerCase().includes(s) ||
          (accEmp?.name || '').toLowerCase().includes(s) ||
          (t?.accommodation || '').toLowerCase().includes(s)
        );
      })
      .sort((a, b) => (b?.date || '').localeCompare(a?.date || ''));
  }, [transactions, programs, searchTerm, customers]);

  const filteredPrograms = useMemo(() => {
    const safePrograms = Array.isArray(programs) ? programs : [];
    if (!searchTerm) return safePrograms;
    const s = searchTerm.toLowerCase();
    return safePrograms.filter(p => 
      p && (
        (p.name || '').toLowerCase().includes(s) || 
        ((suppliers || []).find(sup => sup?.id === p.supplierId)?.company || '').toLowerCase().includes(s)
      )
    );
  }, [programs, searchTerm, suppliers]);

  const toggleSelectAllBookings = () => {
    if (selectedBookingIds.length === filteredBookings.length) {
      setSelectedBookingIds([]);
    } else {
      setSelectedBookingIds(filteredBookings.map(tx => tx?.id).filter(Boolean) as string[]);
    }
  };

  const toggleSelectBooking = (id: string) => {
    setSelectedBookingIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDeleteBookings = () => {
    askConfirm(`هل أنت متأكد من حذف ${selectedBookingIds.length} من الحجوزات المحددة؟`, () => {
      selectedBookingIds.forEach(id => deleteTransaction(id));
      setSelectedBookingIds([]);
    });
  };

  const { purchasePrice, sellingPrice } = useMemo(() => {
    let pp = parseFloat(programForm.purchasePrice || '0');
    let sp = parseFloat(programForm.sellingPrice || '0');
    const hasManual = pp > 0 || sp > 0 || parseFloat(programForm.adultSellingPrice?.toString() || '0') > 0 || parseFloat(programForm.singleSellingPrice?.toString() || '0') > 0;
    
    if (programForm.components && programForm.components.length > 0 && !hasManual) {
      pp = programForm.components.reduce((sum, c) => sum + (c.purchasePrice || 0), 0);
      sp = programForm.components.reduce((sum, c) => sum + (c.sellingPrice || 0), 0);
    }
    return { purchasePrice: pp, sellingPrice: sp };
  }, [programForm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Package size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي البرامج</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalPrograms}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي الحجوزات</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{stats.totalBookings}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center shadow-md">
            <BadgeDollarSign size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">المبيعات الإجمالية</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(stats.revenue || 0)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">خطابات الضمان</p>
            <p className="text-2xl font-bold text-amber-600 tracking-tight">{stats.openGuarantees - stats.releasedGuarantees}</p>
          </div>
        </div>
      </div>

      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200 no-print gap-8 mt-4">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg">
            <MoonStar size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">إدارة الحج والعمرة</h2>
            <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">Faith-based Trip Management System</p>
          </div>
        </div>
        
        <div className="flex flex-wrap bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner gap-1">
          {[
            { id: 'BOOKINGS', icon: Hotel, label: 'تسكين العملاء' },
            { id: 'PROGRAMS', icon: Briefcase, label: 'إدارة البرامج' },
            { id: 'GUARANTEES', icon: ShieldCheck, label: 'خطابات الضمان' },
            { id: 'VISA_MANAGEMENT', icon: Globe, label: 'متابعة التأشيرات' },
            { id: 'MASTER_TRIPS', icon: Layers, label: 'الرحلات المجمعة' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)} 
              className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md border border-slate-100' : 'text-slate-400 hover:text-indigo-600'}`}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {activeTab === 'PROGRAMS' && (
            <button onClick={() => { setEditingProgramId(null); setProgramForm({ ...INITIAL_PROGRAM_FORM, currencyCode: (settings?.baseCurrency || 'EGP') }); setShowAddProgram(true); }} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-3 active:scale-95">
              <Plus size={18} /> إضافة برنامج
            </button>
          )}
          {activeTab === 'BOOKINGS' && (
            <button onClick={() => { setEditingBookingId(null); setBookingForm(INITIAL_BOOKING_FORM); setShowAddBooking(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-3 active:scale-95">
              <Plus size={18} /> حجز جديد
            </button>
          )}
          {activeTab === 'GUARANTEES' && (
            <button onClick={() => setShowAddGuarantee(true)} className="bg-amber-600 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-lg flex items-center gap-3 active:scale-95">
              <Plus size={18} /> خطاب ضمان
            </button>
          )}
        </div>
      </div>

      {/* PROGRAMS TAB UI */}
      {activeTab === 'PROGRAMS' && (
        <div className="space-y-6">
           <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                   <Briefcase size={32} />
                </div>
                <div>
                   <h3 className="text-2xl font-bold text-slate-900 tracking-tight">تعريف برامج الحج والعمرة</h3>
                   <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">إدارة برامج المجموعات والحجوزات الفردية</p>
                </div>
             </div>
             {currentUser.role === 'ADMIN' && (
               <button onClick={() => { 
                 setEditingProgramId(null); 
                 setProgramForm({ ...INITIAL_PROGRAM_FORM, currencyCode: (settings?.baseCurrency || 'EGP') }); 
                 setShowAddProgram(true); 
               }} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 shadow-lg hover:bg-indigo-600 transition-all active:scale-95">
                 <Plus size={18} /> إضافة برنامج جديد
               </button>
             )}
          </div>

          {showAddProgram && (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in zoom-in duration-300">
               <div className="mb-10 flex justify-between items-center">
                  <div className="flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-slate-900 text-indigo-400 shadow-lg">
                      <Plus size={28} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">{editingProgramId ? 'تعديل بيانات البرنامج' : 'تسجيل برنامج جديد'}</h3>
                      <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">إدارة برامج المجموعات والحجوزات الفردية</p>
                    </div>
                  </div>
                  <button onClick={() => setShowAddProgram(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">
                    <X size={20} />
                  </button>
               </div>
               <form onSubmit={handleProgramSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">الرحلة المجموعة (الأم)</label>
                          <button type="button" onClick={() => setShowAddMasterTrip(true)} className="text-[10px] font-bold text-indigo-600 hover:underline">+ رحلة جديدة</button>
                        </div>
                        <SearchableSelect
                          options={(masterTrips || []).map(mt => ({ id: mt?.id, name: mt?.name, subtext: mt?.date }))}
                          value={programForm.masterTripId}
                          onChange={val => {
                            const selectedTrip = (masterTrips || []).find(mt => mt?.id === val);
                            setProgramForm({
                              ...programForm, 
                              masterTripId: val,
                              components: selectedTrip?.components || programForm.components || [],
                              date: selectedTrip?.date || programForm.date,
                              type: selectedTrip?.type as any || programForm.type
                            });
                          }}
                          placeholder="اختر الرحلة الأم..."
 />
                     </div>
                     <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">اسم البرنامج</label>
                        <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none shadow-sm transition-all" placeholder="مثال: عمرة رجب - الاقتصادي" value={programForm.name} onChange={e => setProgramForm({...programForm, name: e.target.value})} />
                     </div>
                     <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">نوع الرحلة</label>
                        <div className="flex gap-4 items-center">
                          <select className="flex-1 p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-slate-900 outline-none shadow-sm transition-all h-[52px]" value={programForm.type} onChange={e => setProgramForm({...programForm, type: e.target.value as any})}>
                             <option value="UMRAH">رحلة عمرة</option>
                             <option value="INDIVIDUAL_UMRAH">برنامج عمرة فردي</option>
                             <option value="HAJJ">رحلة حج</option>
                             <option value="GENERAL">رحلة سياحية عامة</option>
                          </select>
                          <label className="flex items-center gap-2 cursor-pointer group bg-slate-50 p-2 rounded-xl border border-slate-200 h-[52px] px-4">
                             <input type="checkbox" className="hidden" checked={programForm.isAgent} onChange={e => setProgramForm({...programForm, isAgent: e.target.checked})} />
                             <div className={`w-10 h-5 rounded-full transition-all relative ${programForm.isAgent ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${programForm.isAgent ? 'left-5.5' : 'left-0.5'}`} style={{ left: programForm.isAgent ? '22px' : '2px' }} />
                             </div>
                             <span className="text-[10px] font-black text-slate-600 group-hover:text-indigo-600 whitespace-nowrap">برنامج وكلاء</span>
                          </label>
                        </div>
                     </div>
                     <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">العميل (المستفيد)</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                             <button type="button" onClick={() => setProgramForm({...programForm, customerId: ''})} className="px-2 py-0.5 rounded text-[8px] font-bold text-rose-500 hover:bg-white transition-all">مسح</button>
                          </div>
                        </div>
                        <SearchableSelect
                          options={(customers || []).map(c => ({ id: c?.id, name: c?.name, subtext: c?.phone }))}
                          value={programForm.customerId}
                          onChange={val => setProgramForm({...programForm, customerId: val})}
                          placeholder="اختر العميل المستلم..."
 />
                     </div>
                     <div className="flex flex-col gap-3 md:col-span-2">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">توزيع الغرف والعدد (كشف التسكين)</label>
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                           <table className="w-full text-center text-[10px]">
                              <thead className="bg-slate-50 border-b border-slate-200">
                                 <tr>
                                    <th className="p-2 font-bold text-slate-500">نوع الغرفة</th>
                                    <th className="p-2 font-bold text-slate-500">بالغ</th>
                                    <th className="p-2 font-bold text-slate-500">طفل</th>
                                    <th className="p-2 font-bold text-slate-500">رضيع</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                 {[
                                    { id: 'single', label: 'فردي' },
                                    { id: 'double', label: 'ثنائي' },
                                    { id: 'triple', label: 'ثلاثي' },
                                    { id: 'quad', label: 'رباعي' }
                                 ].map(room => (
                                    <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                                       <td className="p-2 font-bold text-slate-700">{room.label}</td>
                                       <td className="p-1">
                                          <input type="number" className="w-12 p-1 text-center bg-slate-50 border border-slate-100 rounded focus:border-indigo-500 outline-none font-bold" value={(programForm as any)[`${room.id}AdultCount`]} onChange={e => setProgramForm({...programForm, [`${room.id}AdultCount`]: e.target.value})} />
                                       </td>
                                       <td className="p-1">
                                          <input type="number" className="w-12 p-1 text-center bg-slate-50 border border-slate-100 rounded focus:border-indigo-500 outline-none font-bold" value={(programForm as any)[`${room.id}ChildCount`]} onChange={e => setProgramForm({...programForm, [`${room.id}ChildCount`]: e.target.value})} />
                                       </td>
                                       <td className="p-1">
                                          <input type="number" className="w-12 p-1 text-center bg-slate-50 border border-slate-100 rounded focus:border-indigo-500 outline-none font-bold" value={(programForm as any)[`${room.id}InfantCount`]} onChange={e => setProgramForm({...programForm, [`${room.id}InfantCount`]: e.target.value})} />
                                       </td>
                                    </tr>
                                 ))}
                                 <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                                    <td className="p-2">أخرى (عام)</td>
                                    <td className="p-1"><input type="number" className="w-12 p-1 text-center bg-white border border-slate-200 rounded outline-none font-bold" value={programForm.adultCount} onChange={e => setProgramForm({...programForm, adultCount: e.target.value})} /></td>
                                    <td className="p-1"><input type="number" className="w-12 p-1 text-center bg-white border border-slate-200 rounded outline-none font-bold" value={programForm.childCount} onChange={e => setProgramForm({...programForm, childCount: e.target.value})} /></td>
                                    <td className="p-1"><input type="number" className="w-12 p-1 text-center bg-white border border-slate-200 rounded outline-none font-bold" value={programForm.infantCount} onChange={e => setProgramForm({...programForm, infantCount: e.target.value})} /></td>
                                 </tr>
                              </tbody>
                           </table>
                        </div>
                     </div>
                     <div className="flex flex-col gap-3 md:col-span-2">
                        <div className="flex justify-between items-center px-2">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">جهة الشراء</label>
                          <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                            <button type="button" onClick={() => setProgramForm({...programForm, supplierType: 'SUPPLIER', supplierId: ''})} className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${programForm.supplierType === 'SUPPLIER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>مورد</button>
                            <button type="button" onClick={() => setProgramForm({...programForm, supplierType: 'CUSTOMER', supplierId: ''})} className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${programForm.supplierType === 'CUSTOMER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>عميل</button>
                            <button type="button" onClick={() => setProgramForm({...programForm, supplierType: 'TREASURY', supplierId: ''})} className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${programForm.supplierType === 'TREASURY' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>خزينة</button>
                          </div>
                        </div>
                        <SearchableSelect
                          options={
                            programForm.supplierType === 'SUPPLIER'
                              ? (suppliers || []).map(s => {
                                  const quota = supplierQuotas[s.id];
                                  const quotaText = quota ? ` (متبقي: ${quota.total - quota.used})` : '';
                                  return { 
                                    id: s.id, 
                                    name: s.company + (s.isSaudiWallet ? ' 🇸🇦' : '') + quotaText, 
                                    subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(otherBalances.suppliers[s.id] || 0)}` 
                                  };
                                })
                              : programForm.supplierType === 'CUSTOMER'
                                ? (customers || []).map(c => ({ 
                                    id: c.id, 
                                    name: c.name, 
                                    subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(otherBalances.customers[c.id] || 0)}` 
                                  }))
                                : (treasuries || []).map(t => ({
                                    id: t.id,
                                    name: t.name,
                                    subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(t.balance)}`
                                  }))
                          }
                          value={programForm.supplierId}
                          onChange={val => setProgramForm({...programForm, supplierId: val})}
                          disabled={programForm.type === 'INDIVIDUAL_UMRAH'}
                          placeholder={`اختر ${programForm.supplierType === 'SUPPLIER' ? 'المورد' : programForm.supplierType === 'CUSTOMER' ? 'العميل' : 'الخزينة'}`}
 />
                     </div>

                     {/* قسم العمولة الجديد */}
                     <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center px-2">
                           <label className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest">عمولة الموظف المسؤول</label>
                           <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" className="hidden" checked={programForm.applyCommission} onChange={e => setProgramForm({...programForm, applyCommission: e.target.checked})} />
                              <div className={`w-8 h-4 rounded-full transition-all relative ${programForm.applyCommission ? 'bg-indigo-500' : 'bg-slate-300'}`}>
                                 <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${programForm.applyCommission ? 'left-4.5' : 'left-0.5'}`} style={{ left: programForm.applyCommission ? '18px' : '2px' }} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-500">تفعيل</span>
                           </label>
                        </div>
                        <div className="flex gap-2">
                           <div className="flex-1">
                              <SearchableSelect
                                 options={(employees || []).map(e => ({ id: e.id, name: e.name, subtext: e.position }))}
                                 value={programForm.employeeId}
                                 onChange={val => {
                                    const emp = (employees || []).find(e => e.id === val);
                                    setProgramForm({
                                       ...programForm, 
                                       employeeId: val,
                                       employeeCommissionRate: emp ? emp.commissionRate.toString() : programForm.employeeCommissionRate
                                    });
                                 }}
                                 placeholder="اختر الموظف..."
 />
                           </div>
                           <div className="w-24">
                              <input 
                                 type="number" 
                                 className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none shadow-sm transition-all h-[52px] text-center" 
                                 placeholder="النسبة %"
                                 value={programForm.employeeCommissionRate}
                                 onChange={e => setProgramForm({...programForm, employeeCommissionRate: e.target.value})}
 />
                           </div>
                        </div>
                     </div>
                     <div className="space-y-4 md:col-span-3 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                           <h4 className="font-bold text-slate-900 flex items-center gap-2"><BadgeDollarSign size={20} className="text-indigo-600" /> تفاصيل الأسعار للفرد</h4>
                           <div className="flex bg-slate-200 p-1 rounded-2xl gap-1">
                              {[
                                 { id: 'SINGLE', label: 'فردي' },
                                 { id: 'DOUBLE', label: 'ثنائي' },
                                 { id: 'TRIPLE', label: 'ثلاثي' },
                                 { id: 'QUAD', label: 'رباعي' }
                              ].map(tab => (
                                 <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setPricingActiveTab(tab.id as any)}
                                    className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${pricingActiveTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                 >
                                    {tab.label}
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="overflow-x-auto">
                           <table className="w-full border-separate border-spacing-0 bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
                              <thead>
                                 <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="p-4 text-center border-l border-slate-100 font-bold text-slate-500 text-[10px] uppercase tracking-wider">النوع</th>
                                    <th className="p-4 text-center border-l border-slate-100 font-bold text-slate-500 text-[10px] uppercase tracking-wider">بالغ</th>
                                    <th className="p-4 text-center border-l border-slate-100 font-bold text-slate-500 text-[10px] uppercase tracking-wider">طفل</th>
                                    <th className="p-4 text-center border-l border-slate-100 font-bold text-slate-500 text-[10px] uppercase tracking-wider">رضيع</th>
                                 </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                 <tr>
                                    <td className="p-4 font-bold text-rose-600 bg-rose-50 bg-opacity-30 border-l border-slate-100 text-center text-[11px] uppercase tracking-wide whitespace-nowrap">سعر الشراء</td>
                                    {pricingActiveTab === 'SINGLE' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.singlePurchasePrice} onChange={e => setProgramForm({...programForm, singlePurchasePrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.singleChildPurchasePrice} onChange={e => setProgramForm({...programForm, singleChildPurchasePrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.singleInfantPurchasePrice} onChange={e => setProgramForm({...programForm, singleInfantPurchasePrice: e.target.value})} /></td>
                                       </>
                                    )}
                                    {pricingActiveTab === 'DOUBLE' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.doublePurchasePrice} onChange={e => setProgramForm({...programForm, doublePurchasePrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.doubleChildPurchasePrice} onChange={e => setProgramForm({...programForm, doubleChildPurchasePrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.doubleInfantPurchasePrice} onChange={e => setProgramForm({...programForm, doubleInfantPurchasePrice: e.target.value})} /></td>
                                       </>
                                    )}
                                    {pricingActiveTab === 'TRIPLE' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.triplePurchasePrice} onChange={e => setProgramForm({...programForm, triplePurchasePrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.tripleChildPurchasePrice} onChange={e => setProgramForm({...programForm, tripleChildPurchasePrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.tripleInfantPurchasePrice} onChange={e => setProgramForm({...programForm, tripleInfantPurchasePrice: e.target.value})} /></td>
                                       </>
                                    )}
                                    {pricingActiveTab === 'QUAD' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.quadPurchasePrice} onChange={e => setProgramForm({...programForm, quadPurchasePrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.quadChildPurchasePrice} onChange={e => setProgramForm({...programForm, quadChildPurchasePrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-rose-600 outline-none focus:ring-1 focus:ring-rose-500 transition-all" value={programForm.quadInfantPurchasePrice} onChange={e => setProgramForm({...programForm, quadInfantPurchasePrice: e.target.value})} /></td>
                                       </>
                                    )}
                                 </tr>
                                 <tr>
                                    <td className="p-4 font-bold text-emerald-600 bg-emerald-50 bg-opacity-30 border-l border-slate-100 text-center text-[11px] uppercase tracking-wide whitespace-nowrap">سعر البيع</td>
                                    {pricingActiveTab === 'SINGLE' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.singleSellingPrice} onChange={e => setProgramForm({...programForm, singleSellingPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.singleChildSellingPrice} onChange={e => setProgramForm({...programForm, singleChildSellingPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.singleInfantSellingPrice} onChange={e => setProgramForm({...programForm, singleInfantSellingPrice: e.target.value})} /></td>
                                       </>
                                    )}
                                    {pricingActiveTab === 'DOUBLE' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.doubleSellingPrice} onChange={e => setProgramForm({...programForm, doubleSellingPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.doubleChildSellingPrice} onChange={e => setProgramForm({...programForm, doubleChildSellingPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.doubleInfantSellingPrice} onChange={e => setProgramForm({...programForm, doubleInfantSellingPrice: e.target.value})} /></td>
                                       </>
                                    )}
                                    {pricingActiveTab === 'TRIPLE' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.tripleSellingPrice} onChange={e => setProgramForm({...programForm, tripleSellingPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.tripleChildSellingPrice} onChange={e => setProgramForm({...programForm, tripleChildSellingPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.tripleInfantSellingPrice} onChange={e => setProgramForm({...programForm, tripleInfantSellingPrice: e.target.value})} /></td>
                                       </>
                                    )}
                                    {pricingActiveTab === 'QUAD' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.quadSellingPrice} onChange={e => setProgramForm({...programForm, quadSellingPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.quadChildSellingPrice} onChange={e => setProgramForm({...programForm, quadChildSellingPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" disabled={(programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL')} className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-emerald-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.quadInfantSellingPrice} onChange={e => setProgramForm({...programForm, quadInfantSellingPrice: e.target.value})} /></td>
                                       </>
                                    )}
                                 </tr>
                                 <tr>
                                    <td className="p-4 font-bold text-indigo-600 bg-indigo-50 bg-opacity-30 border-l border-slate-100 text-center text-[11px] uppercase tracking-wide whitespace-nowrap">سعر المندوب (الصافي)</td>
                                    {pricingActiveTab === 'SINGLE' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.adultAgentPrice} onChange={e => setProgramForm({...programForm, adultAgentPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.childAgentPrice} onChange={e => setProgramForm({...programForm, childAgentPrice: e.target.value})} /></td>
                                          <td className="p-2 border-l border-slate-50"><input type="number" className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.infantAgentPrice} onChange={e => setProgramForm({...programForm, infantAgentPrice: e.target.value})} /></td>
                                       </>
                                    )}
                                    {pricingActiveTab === 'DOUBLE' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.doubleAgentPrice} onChange={e => setProgramForm({...programForm, doubleAgentPrice: e.target.value})} /></td>
                                          <td colSpan={2} className="p-2 border-l border-slate-50 text-[10px] text-slate-400 text-center font-bold italic">نفس أسعار الطفل والرضيع في الفئة الفردية</td>
                                       </>
                                    )}
                                    {pricingActiveTab === 'TRIPLE' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.tripleAgentPrice} onChange={e => setProgramForm({...programForm, tripleAgentPrice: e.target.value})} /></td>
                                          <td colSpan={2} className="p-2 border-l border-slate-50 text-[10px] text-slate-400 text-center font-bold italic">نفس أسعار الطفل والرضيع في الفئة الفردية</td>
                                       </>
                                    )}
                                    {pricingActiveTab === 'QUAD' && (
                                       <>
                                          <td className="p-2 border-l border-slate-50"><input type="number" className="w-full p-3 bg-slate-50 bg-opacity-50 rounded-lg font-bold text-sm text-center text-indigo-600 outline-none focus:ring-1 focus:ring-indigo-500 transition-all" value={programForm.quadAgentPrice} onChange={e => setProgramForm({...programForm, quadAgentPrice: e.target.value})} /></td>
                                          <td colSpan={2} className="p-2 border-l border-slate-50 text-[10px] text-slate-400 text-center font-bold italic">نفس أسعار الطفل والرضيع في الفئة الفردية</td>
                                       </>
                                    )}
                                 </tr>
                              </tbody>
                           </table>
                        </div>
                     </div>
                     <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">العملة</label>
                        <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none shadow-sm transition-all h-[52px]" value={programForm.currencyCode} onChange={e => {
                          const curr = (currencies || []).find(c => c && c.code === e.target.value);
                          setProgramForm({...programForm, currencyCode: e.target.value, exchangeRate: curr?.rateToMain?.toString() || '1'});
                        }}>
                           {(currencies || []).map(c => (
                              <option key={c?.code} value={c?.code}>{c?.name} ({c?.code})</option>
                           ))}
                        </select>
                     </div>
                     <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">سعر الصرف ({settings?.baseCurrency || 'EGP'})</label>
                        <input 
                           type="number" 
                           step="0.0001" 
                           className={`w-full p-4 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none shadow-sm transition-all h-[52px] ${programForm.currencyCode === (settings?.baseCurrency || 'EGP') ? 'bg-slate-100' : 'bg-slate-50 focus:border-indigo-600'}`} 
                           value={programForm.currencyCode === (settings?.baseCurrency || 'EGP') ? '1' : programForm.exchangeRate} 
                           onChange={e => setProgramForm({...programForm, exchangeRate: e.target.value})}
                           disabled={programForm.currencyCode === (settings?.baseCurrency || 'EGP')}
 />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">تاريخ الانطلاق</label>
                        <input type="date" className="w-full p-5 bg-slate-50 border-2 rounded-2xl font-bold" value={programForm.date} onChange={e => setProgramForm({...programForm, date: e.target.value})} />
                     </div>
                  </div>
                   {(programForm.type === 'HAJJ' || programForm.type === 'UMRAH' || programForm.type === 'INDIVIDUAL_UMRAH' || programForm.type === 'GENERAL' || programForm.components.length > 0 || editingProgramId) && (
                     <div className="space-y-6 pt-8 border-t border-slate-200">
                       <div className="flex justify-between items-center">
                          <h4 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Briefcase size={20} className="text-indigo-600" /> مكونات البرنامج وتفاصيل التسعير</h4>
                          <div className="flex gap-4">
                             <div className="bg-rose-50 px-4 py-2 rounded-xl border border-rose-100">
                                <p className="text-[9px] font-bold text-rose-400 uppercase">إجمالي تكلفة المكونات</p>
                                <p className="text-sm font-bold text-rose-600">{formatCurrency(purchasePrice)}</p>
                             </div>
                             <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                                <p className="text-[9px] font-bold text-emerald-400 uppercase">إجمالي بيع المكونات</p>
                                <p className="text-sm font-bold text-emerald-600">{formatCurrency(sellingPrice)}</p>
                             </div>
                          </div>
                       </div>
                       {(programForm.components || []).length > 0 && (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {(programForm.components || []).map(comp => (
                             <div key={comp.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 transition-all group">
                               <div className="flex justify-between items-start mb-4">
                                 <div className="flex-1">
                                   <div className="flex items-center gap-2 mb-1">
                                      <p className="font-bold text-slate-900 text-lg">{comp.name}</p>
                                      {comp.quantity && comp.quantity > 1 && (
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                                          العدد: {comp.quantity}
                                        </span>
                                      )}
                                      <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md ${comp.pricingMode === 'TOTAL' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                                         {comp.pricingMode === 'TOTAL' ? 'إجمالي' : 'فردي'}
                                      </span>
                                      {comp.isCommissionable !== false && (
                                        <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700" title="خاضع لعمولة الموظف">
                                          % عمولة
                                        </span>
                                      )}
                                   </div>
                                   <p className="text-sm text-slate-600 font-bold">{comp.type === 'FLIGHT' ? 'تذكرة طيران' : comp.type === 'VISA' ? 'تأشيرة' : comp.type === 'HOTEL' ? 'فندق' : comp.type === 'INTERNAL_TRANSPORT' ? 'نقل داخلي' : comp.type === 'SAUDI_TRANSPORT' ? 'نقل سعودي' : comp.type === 'GUARANTEE_LETTER' ? 'خطاب ضمان' : comp.type === 'GIFTS_AND_PRINTS' ? 'هدايا ومطبوعات' : 'مصروفات'}</p>
                                   {comp.details && <p className="text-xs text-slate-500 mt-1">{comp.details}</p>}
                                   {comp.supplierId && <p className="text-xs text-slate-500">المورد: {(suppliers || []).find(s => s.id === comp.supplierId)?.company}</p>}
                                 </div>
                                 <div className="flex flex-wrap gap-2 ml-4">
                                   <button 
                                     type="button" 
                                     onClick={() => startEditComponent(comp)} 
                                     className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-bold text-xs shadow-sm border border-indigo-100"
                                   >
                                     <Edit2 size={14} /> تعديل البيانات
                                   </button>

                                   {editingProgramId && (comp.isPosted || comp.supplierId) && (
                                     <>
                                       <button 
                                         type="button" 
                                         onClick={() => handleReturnComponent(editingProgramId, comp.id)} 
                                         className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-600 hover:text-white transition-all font-bold text-xs shadow-sm border border-amber-100"
                                         title="عمل ارتداد (مرتجع) لعدد معين من الوحدات"
                                       >
                                         <RotateCcw size={14} /> ارتداد
                                       </button>
                                       <button 
                                         type="button" 
                                         onClick={() => handleCancelComponent(editingProgramId, comp.id)} 
                                         className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all font-bold text-xs shadow-sm border border-rose-100"
                                       >
                                         <Trash2 size={14} /> إلغاء مالي (حذف)
                                       </button>
                                     </>
                                   )}

                                   {!comp.isPosted && (
                                     <button 
                                       type="button" 
                                       onClick={() => { if(confirm('هل أنت متأكد من حذف هذا المكون من النموذج؟')) setProgramForm(prev => ({ ...prev, components: (prev.components || []).filter(c => c.id !== comp.id) })) }} 
                                       className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-600 hover:text-white transition-all font-bold text-xs shadow-sm border border-slate-200"
                                     >
                                       <Trash2 size={14} /> حذف المكون
                                     </button>
                                   )}
                                 </div>
                               </div>
                              <div className="mt-4 pt-4 border-t border-slate-200">
                                {comp.pricingMode === 'TOTAL' ? (
                                  <div className="flex justify-between text-sm font-bold">
                                    <span className="text-rose-600">
                                      شراء:
                                      {editingPriceId === comp.id ? (
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={shouldMaskAggregate ? '****' : tempPurchasePrice}
                                          onChange={(e) => setTempPurchasePrice(e.target.value)}
                                          onBlur={savePriceEdit}
                                          onKeyDown={(e) => e.key === 'Enter' ? savePriceEdit() : e.key === 'Escape' ? cancelPriceEdit() : null}
                                          className="w-20 mx-2 px-2 py-1 text-xs bg-rose-50 border border-rose-200 rounded"
                                          autoFocus
 />
                                      ) : (
                                        <span onClick={() => !shouldMaskAggregate && startEditPrice(comp)} className="cursor-pointer hover:bg-rose-50 px-1 rounded">
                                          {shouldMaskAggregate ? '****' : formatCurrency((comp.originalPurchasePrice || 0) * (comp.exchangeRate || 1))}
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-emerald-600">
                                      بيع:
                                      {editingPriceId === comp.id ? (
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={shouldMaskAggregate ? '****' : tempSellingPrice}
                                          onChange={(e) => setTempSellingPrice(e.target.value)}
                                          onBlur={savePriceEdit}
                                          onKeyDown={(e) => e.key === 'Enter' ? savePriceEdit() : e.key === 'Escape' ? cancelPriceEdit() : null}
                                          className="w-20 mx-2 px-2 py-1 text-xs bg-emerald-50 border border-emerald-200 rounded"
                                          disabled={comp.type === 'EXPENSE'}
                                          autoFocus
 />
                                      ) : (
                                        <span onClick={() => !shouldMaskAggregate && startEditPrice(comp)} className="cursor-pointer hover:bg-emerald-50 px-1 rounded">
                                          {shouldMaskAggregate ? '****' : formatCurrency((comp.originalSellingPrice || 0) * (comp.exchangeRate || 1))}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-[8px] font-bold uppercase text-center">
                                    <div className="bg-white p-1 rounded border">
                                      <p className="text-slate-400 mb-1 border-b">بالغ</p>
                                      <p className="text-rose-600">ش: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalAdultPurchasePrice || comp.originalPurchasePrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                      <p className="text-emerald-600">ب: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalAdultSellingPrice || comp.originalSellingPrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                    </div>
                                    <div className="bg-white p-1 rounded border">
                                      <p className="text-slate-400 mb-1 border-b">سنجل</p>
                                      <p className="text-rose-600">ش: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalSinglePurchasePrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                      <p className="text-emerald-600">ب: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalSingleSellingPrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                    </div>
                                    <div className="bg-white p-1 rounded border">
                                      <p className="text-slate-400 mb-1 border-b">ثنائي</p>
                                      <p className="text-rose-600">ش: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalDoublePurchasePrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                      <p className="text-emerald-600">ب: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalDoubleSellingPrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                    </div>
                                    <div className="bg-white p-1 rounded border">
                                      <p className="text-slate-400 mb-1 border-b">ثلاثي</p>
                                      <p className="text-rose-600">ش: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalTriplePurchasePrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                      <p className="text-emerald-600">ب: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalTripleSellingPrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                    </div>
                                    <div className="bg-white p-1 rounded border">
                                      <p className="text-slate-400 mb-1 border-b">رباعي</p>
                                      <p className="text-rose-600">ش: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalQuadPurchasePrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                      <p className="text-emerald-600">ب: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalQuadSellingPrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                    </div>
                                    <div className="bg-white p-1 rounded border">
                                      <p className="text-slate-400 mb-1 border-b">طفل</p>
                                      <p className="text-rose-600">ش: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalChildPurchasePrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                      <p className="text-emerald-600">ب: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalChildSellingPrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                    </div>
                                    <div className="bg-white p-1 rounded border">
                                      <p className="text-slate-400 mb-1 border-b">رضيع</p>
                                      <p className="text-rose-600">ش: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalInfantPurchasePrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                      <p className="text-emerald-600">ب: {shouldMaskAggregate ? '****' : formatCurrency(((comp.originalInfantSellingPrice || 0) * (1 / (comp.quantity || 1))) * (comp.exchangeRate || 1))}</p>
                                    </div>
                                    <div className="col-span-full text-[8px] text-slate-400 mt-1">العملة: {comp.currencyCode}</div>
                                  </div>
                                )}
                              </div>
                             </div>
                           ))}
                         </div>
                       )}
                       <div className="flex justify-center gap-4">
                         <button type="button" onClick={() => { setEditingComponentId(null); setComponentForm({ ...INITIAL_COMPONENT_FORM, currencyCode: settings.baseCurrency || 'EGP' }); setShowAddComponent(true); }} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg hover:bg-indigo-700 transition-all transform hover:scale-105">
                           <Plus size={24} /> إضافة مكون جديد
                         </button>
                         {editingProgramId && (programForm.components || []).some(c => c.supplierId) && (
                           <button 
                             type="button" 
                             onClick={handleGeneralReturnSelection} 
                             className="bg-amber-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-lg hover:bg-amber-700 transition-all transform hover:scale-105"
                           >
                             <RotateCcw size={24} /> ارتداد مكون حالي
                           </button>
                         )}
                       </div>
                       {showReturnForm && (
                         <div id="return-form-section" className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl mt-6 animate-in slide-in-from-top duration-300">
                           <div className="mb-10 flex justify-between items-center">
                              <div className="flex items-center gap-5">
                                <div className="p-4 rounded-2xl bg-amber-600 text-white shadow-lg">
                                  <RotateCcw size={28} />
                                </div>
                                <div>
                                  <h3 className="text-2xl font-bold text-slate-900">تسجيل ارتداد مالي (مرتجع)</h3>
                                  <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">إرجاع مبلغ من مورد مقابل بند تم شراؤه مسبقاً</p>
                                </div>
                              </div>
                              <button onClick={() => setShowReturnForm(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-all">
                                <X size={20} />
                              </button>
                           </div>
                           
                           <form onSubmit={handleReturnSubmit} className="space-y-10">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                               <div className="flex flex-col gap-3">
                                 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">اسم المكون</label>
                                 <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 shadow-sm cursor-not-allowed">
                                   {returnFormData.compName}
                                 </div>
                               </div>

                               <div className="flex flex-col gap-3">
                                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">جهة الارتداد (المورد)</label>
                                  <div className="w-full p-4 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-600 shadow-sm cursor-not-allowed">
                                    {returnFormData.supplierName}
                                  </div>
                               </div>

                               <div className="flex flex-col gap-3">
                                 <label className="text-[11px] font-bold text-amber-600 uppercase tracking-widest px-2">العدد / الكمية المراد ارتدادها</label>
                                 <div className="relative">
                                   <input 
                                     type="number" 
                                     min="1" 
                                     max={returnFormData.originalQuantity}
                                     required 
                                     className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-amber-600 outline-none shadow-sm transition-all" 
                                     value={returnFormData.quantity} 
                                     onChange={e => {
                                        const qtyStr = e.target.value;
                                        const qtyInt = parseInt(qtyStr || '0');
                                        const program = (programs || []).find(p => p.id === returnFormData.programId);
                                        const comp = program?.components.find(c => c.id === returnFormData.componentId);
                                        const unitPurchase = (comp?.originalPurchasePrice || 0) / (comp?.quantity || 1);
                                        
                                        // Prevents NaN in amount field
                                        const newAmount = isNaN(qtyInt) ? '0' : (unitPurchase * qtyInt).toString();
                                        
                                        setReturnFormData({
                                          ...returnFormData, 
                                          quantity: qtyStr, 
                                          amount: newAmount
                                        });
                                     }} 
                                   />
                                   <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">من أصل {returnFormData.originalQuantity}</div>
                                 </div>
                               </div>

                               <div className="flex flex-col gap-3">
                                 <label className="text-[11px] font-bold text-indigo-600 uppercase tracking-widest px-2">إجمالي مبلغ الارتداد ({returnFormData.currencyCode})</label>
                                 <input 
                                   type="number" 
                                   step="0.01" 
                                   required 
                                   className="w-full p-4 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none shadow-sm transition-all" 
                                   value={returnFormData.amount} 
                                   onChange={e => setReturnFormData({...returnFormData, amount: e.target.value})} 
                                 />
                               </div>

                               <div className="flex flex-col gap-3">
                                 <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">سعر الصرف ({settings.baseCurrency})</label>
                                 <input 
                                   type="number" 
                                   step="0.000001" 
                                   required 
                                   className={`w-full p-4 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-amber-600 outline-none shadow-sm transition-all ${returnFormData.currencyCode === settings.baseCurrency ? 'bg-slate-100 cursor-not-allowed' : 'bg-slate-50'}`} 
                                   value={returnFormData.currencyCode === settings.baseCurrency ? '1' : returnFormData.exchangeRate} 
                                   onChange={e => setReturnFormData({...returnFormData, exchangeRate: e.target.value})} 
                                   disabled={returnFormData.currencyCode === settings.baseCurrency}
                                 />
                               </div>
                             </div>

                             <div className="flex gap-4 pt-6 border-t border-slate-100">
                               <button 
                                 type="submit" 
                                 className="flex-1 bg-slate-900 text-white px-8 py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:bg-amber-600 transition-all active:scale-95"
                               >
                                 <Save size={18} /> حفظ عملية الارتداد
                               </button>
                               <button 
                                 type="button" 
                                 onClick={() => setShowReturnForm(false)}
                                 className="px-10 bg-slate-50 text-slate-400 py-4 rounded-xl font-bold text-sm hover:bg-rose-50 hover:text-rose-600 transition-all active:scale-95"
                               >
                                 إلغاء
                               </button>
                             </div>
                           </form>
                         </div>
                       )}
                       {showAddComponent && (
                         <div id="component-form-section" className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl mt-6 animate-in slide-in-from-top duration-300">
                           <div className="mb-6 flex items-center gap-4">
                             <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                             <h5 className="text-xl font-bold text-slate-900">{editingComponentId ? 'تعديل مكون البرنامج' : 'إضافة مكون جديد للبرنامج'}</h5>
                           </div>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-3">
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">نوع المكون</label>
                               <select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all" value={componentForm.type} onChange={e => setComponentForm({...componentForm, type: e.target.value as UmrahComponent['type']})}>
                                 <option value="FLIGHT">تذكرة طيران</option>
                                 <option value="VISA">تأشيرة</option>
                                 <option value="HOTEL">فندق</option>
                                 <option value="INTERNAL_TRANSPORT">نقل داخلي</option>
                                 <option value="GUARANTEE_LETTER">خطاب ضمان</option>
                                 <option value="GIFTS_AND_PRINTS">هدايا ومطبوعات</option>
                                 {programForm.type === 'INDIVIDUAL_UMRAH' && <option value="SAUDI_TRANSPORT">نقل سعودي</option>}
                                 {programForm.type !== 'INDIVIDUAL_UMRAH' && <option value="EXPENSE">مصروفات الرحلة</option>}
                               </select>
                             </div>
                             <div className="space-y-3">
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">اسم المكون</label>
                               <input required className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all" value={componentForm.name} onChange={e => setComponentForm({...componentForm, name: e.target.value})} placeholder="مثال: تذكرة مصر للطيران" />
                             </div>
                             <div className="space-y-3">
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 text-indigo-600">العدد / الكمية</label>
                               <input type="number" min="1" required className="w-full p-4 bg-indigo-50 bg-opacity-50 border border-indigo-100 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none transition-all" value={componentForm.quantity} onChange={e => setComponentForm({...componentForm, quantity: e.target.value})} />
                             </div>
                             <div className="space-y-3">
                               <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">طريقة التسعير</label>
                               <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                                 <button type="button" onClick={() => setComponentForm({...componentForm, pricingMode: 'PER_PERSON'})} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${componentForm.pricingMode === 'PER_PERSON' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>بالفرد</button>
                                 <button type="button" onClick={() => setComponentForm({...componentForm, pricingMode: 'TOTAL'})} className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all ${componentForm.pricingMode === 'TOTAL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>إجمالي للمجموعة</button>
                               </div>
                             </div>
                             <div className="space-y-3">
                               <div className="flex justify-between items-center">
                                 <label className="text-sm font-bold text-slate-400 uppercase">جهة الشراء (الموفر)</label>
                                 <div className="flex bg-slate-100 p-1 rounded-lg gap-1">
                                   <button type="button" onClick={() => setComponentForm({...componentForm, supplierType: 'SUPPLIER', supplierId: ''})} className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${componentForm.supplierType === 'SUPPLIER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>مورد</button>
                                   <button type="button" onClick={() => setComponentForm({...componentForm, supplierType: 'CUSTOMER', supplierId: ''})} className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${componentForm.supplierType === 'CUSTOMER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>عميل</button>
                                   <button type="button" onClick={() => setComponentForm({...componentForm, supplierType: 'TREASURY', supplierId: ''})} className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${componentForm.supplierType === 'TREASURY' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>خزينة</button>
                                 </div>
                               </div>
                               <SearchableSelect
                                 options={
                                   componentForm.supplierType === 'SUPPLIER'
                                     ? (suppliers || []).map(s => {
                                         const quota = supplierQuotas[s.id];
                                         const quotaText = quota ? ` (متبقي: ${quota.total - quota.used})` : '';
                                         return { 
                                           id: s.id, 
                                           name: s.company + (s.isSaudiWallet ? ' 🇸🇦 (محفظة)' : '') + quotaText, 
                                           subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(s.balance || 0)}` 
                                         };
                                       })
                                     : componentForm.supplierType === 'CUSTOMER'
                                       ? (customers || []).map(c => ({ 
                                           id: c.id, 
                                           name: c.name, 
                                           subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(c.balance || 0)}` 
                                         }))
                                       : (treasuries || []).map(t => ({
                                           id: t.id,
                                           name: t.name,
                                           subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(t.balance)}`
                                         }))
                                 }
                                 value={componentForm.supplierId}
                                 onChange={val => setComponentForm({...componentForm, supplierId: val})}
                                 placeholder={`اختر ${componentForm.supplierType === 'SUPPLIER' ? 'المورد' : componentForm.supplierType === 'CUSTOMER' ? 'العميل' : 'الخزينة'}`}
 />
                             </div>
                             <div className="space-y-3">
                               <label className="text-sm font-bold text-slate-400 uppercase">العملة</label>
                               <select className="w-full p-5 bg-slate-50 border-2 rounded-2xl font-bold text-slate-900" value={componentForm.currencyCode} onChange={e => { const curr = (currencies || []).find(c => c.code === e.target.value); setComponentForm({...componentForm, currencyCode: e.target.value, exchangeRate: curr?.rateToMain.toString() || '1'}) }}>
                                 {(currencies || []).map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                               </select>
                             </div>
                             <div className="space-y-3">
                               <label className="text-sm font-bold text-slate-400 uppercase">سعر الصرف ({settings.baseCurrency})</label>
                               <input 
                                 type="number" 
                                 step="0.01" 
                                 className={`w-full p-5 border-2 rounded-2xl font-bold text-slate-900 ${componentForm.currencyCode === settings.baseCurrency ? 'bg-slate-100' : 'bg-slate-50'}`} 
                                 value={componentForm.currencyCode === settings.baseCurrency ? '1' : componentForm.exchangeRate} 
                                 onChange={e => setComponentForm({...componentForm, exchangeRate: e.target.value})} 
                                 disabled={componentForm.currencyCode === settings.baseCurrency}
 />
                             </div>
                             <div className="space-y-3">
                               <label className="text-sm font-bold text-slate-400 uppercase">تفاصيل إضافية</label>
                               <input className="w-full p-5 bg-slate-50 border-2 rounded-2xl font-bold text-slate-900" value={componentForm.details} onChange={e => setComponentForm({...componentForm, details: e.target.value})} placeholder={componentForm.type === 'FLIGHT' ? 'رقم PNR' : componentForm.type === 'HOTEL' ? 'مكة / المدينة' : componentForm.type === 'GUARANTEE_LETTER' ? 'جهة إصدار الخطاب' : 'تفاصيل أخرى'} />
                             </div>
                             <div className="space-y-3 p-5 bg-amber-50 rounded-2xl border-2 border-amber-100 md:col-span-2">
                               <div className="flex items-center gap-4">
                                 <input 
                                   type="checkbox" 
                                   id="isCommissionable" 
                                   className="w-6 h-6 accent-indigo-600" 
                                   checked={componentForm.isCommissionable} 
                                   onChange={e => setComponentForm({...componentForm, isCommissionable: e.target.checked})} 
 />
                                 <label htmlFor="isCommissionable" className="font-bold text-slate-900 cursor-pointer">
                                   تمكين عمولة الموظف على هذا المكون (تذكرة، تأشيرة، إلخ)
                                 </label>
                               </div>

                               {componentForm.isCommissionable && (
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-amber-200 border-opacity-50">
                                   <div className="space-y-2">
                                     <label className="text-xs font-bold text-amber-900 mr-2">الموظف المستحق</label>
                                     <select 
                                       className="w-full p-3 bg-white border-2 border-amber-200 rounded-xl font-bold text-slate-900 text-xs"
                                       value={componentForm.employeeId || ''}
                                       onChange={e => setComponentForm({...componentForm, employeeId: e.target.value})}
                                     >
                                       <option value="">اختر الموظف...</option>
                                       {(employees || []).map(emp => (
                                         <option key={emp?.id} value={emp?.id}>{emp?.name}</option>
                                       ))}
                                     </select>
                                   </div>
                                   <div className="space-y-2">
                                     <label className="text-xs font-bold text-amber-900 mr-2">قيمة العمولة</label>
                                     <input 
                                       type="number"
                                       className="w-full p-3 bg-white border-2 border-amber-200 rounded-xl font-bold text-slate-900 text-xs"
                                       value={componentForm.commissionAmount || ''}
                                       onChange={e => setComponentForm({...componentForm, commissionAmount: Number(e.target.value)})}
                                       placeholder="المبلغ..."
 />
                                   </div>
                                 </div>
                               )}
                             </div>
                             <div className="md:col-span-2 space-y-4 bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                               {componentForm.pricingMode === 'PER_PERSON' ? (
                                 <>
                                   <div className="flex justify-between items-center mb-2">
                                      <h4 className="font-bold text-slate-900 text-sm">تفاصيل التسعير لكل فرد</h4>
                                      <div className="flex bg-slate-200 p-1 rounded-2xl gap-1">
                                         {[
                                            { id: 'SINGLE', label: 'فردي' },
                                            { id: 'DOUBLE', label: 'ثنائي' },
                                            { id: 'TRIPLE', label: 'ثلاثي' },
                                            { id: 'QUAD', label: 'رباعي' }
                                         ].map(tab => (
                                            <button
                                               key={tab.id}
                                               type="button"
                                               onClick={() => setCompPricingActiveTab(tab.id as any)}
                                               className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all ${compPricingActiveTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                                            >
                                               {tab.label}
                                            </button>
                                         ))}
                                      </div>
                                   </div>
                                   <div className="overflow-x-auto">
                                      <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-slate-100">
                                         <thead>
                                            <tr className="bg-slate-50 border-b-2 border-slate-100">
                                               <th className="p-3 text-center border-l-2 border-slate-100 font-bold text-slate-900 text-sm">النوع</th>
                                               <th className="p-3 text-center border-l-2 border-slate-100 font-bold text-slate-900 text-sm">بالغ</th>
                                               <th className="p-3 text-center border-l-2 border-slate-100 font-bold text-slate-900 text-sm">طفل</th>
                                               <th className="p-3 text-center border-l-2 border-slate-100 font-bold text-slate-900 text-sm">رضيع</th>
                                            </tr>
                                         </thead>
                                         <tbody>
                                            <tr>
                                               <td className="p-3 font-bold text-rose-600 bg-rose-50 border-l-2 border-slate-100 text-center text-xs whitespace-nowrap">سعر الشراء</td>
                                               {compPricingActiveTab === 'SINGLE' && (
                                                  <>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.singlePurchasePrice} onChange={e => setComponentForm({...componentForm, singlePurchasePrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.singleChildPurchasePrice} onChange={e => setComponentForm({...componentForm, singleChildPurchasePrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.singleInfantPurchasePrice} onChange={e => setComponentForm({...componentForm, singleInfantPurchasePrice: e.target.value})} /></td>
                                                  </>
                                               )}
                                               {compPricingActiveTab === 'DOUBLE' && (
                                                  <>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.doublePurchasePrice} onChange={e => setComponentForm({...componentForm, doublePurchasePrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.doubleChildPurchasePrice} onChange={e => setComponentForm({...componentForm, doubleChildPurchasePrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.doubleInfantPurchasePrice} onChange={e => setComponentForm({...componentForm, doubleInfantPurchasePrice: e.target.value})} /></td>
                                                  </>
                                               )}
                                               {compPricingActiveTab === 'TRIPLE' && (
                                                  <>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.triplePurchasePrice} onChange={e => setComponentForm({...componentForm, triplePurchasePrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.tripleChildPurchasePrice} onChange={e => setComponentForm({...componentForm, tripleChildPurchasePrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.tripleInfantPurchasePrice} onChange={e => setComponentForm({...componentForm, tripleInfantPurchasePrice: e.target.value})} /></td>
                                                  </>
                                               )}
                                               {compPricingActiveTab === 'QUAD' && (
                                                  <>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.quadPurchasePrice} onChange={e => setComponentForm({...componentForm, quadPurchasePrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.quadChildPurchasePrice} onChange={e => setComponentForm({...componentForm, quadChildPurchasePrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-rose-600 outline-none" value={componentForm.quadInfantPurchasePrice} onChange={e => setComponentForm({...componentForm, quadInfantPurchasePrice: e.target.value})} /></td>
                                                  </>
                                               )}
                                            </tr>
                                            <tr>
                                               <td className="p-3 font-bold text-emerald-600 bg-emerald-50 border-l-2 border-slate-100 text-center text-xs whitespace-nowrap">سعر البيع</td>
                                               {compPricingActiveTab === 'SINGLE' && (
                                                  <>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.singleSellingPrice} onChange={e => setComponentForm({...componentForm, singleSellingPrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.singleChildSellingPrice} onChange={e => setComponentForm({...componentForm, singleChildSellingPrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.singleInfantSellingPrice} onChange={e => setComponentForm({...componentForm, singleInfantSellingPrice: e.target.value})} /></td>
                                                  </>
                                               )}
                                               {compPricingActiveTab === 'DOUBLE' && (
                                                  <>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.doubleSellingPrice} onChange={e => setComponentForm({...componentForm, doubleSellingPrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.doubleChildSellingPrice} onChange={e => setComponentForm({...componentForm, doubleChildSellingPrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.doubleInfantSellingPrice} onChange={e => setComponentForm({...componentForm, doubleInfantSellingPrice: e.target.value})} /></td>
                                                  </>
                                               )}
                                               {compPricingActiveTab === 'TRIPLE' && (
                                                  <>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.tripleSellingPrice} onChange={e => setComponentForm({...componentForm, tripleSellingPrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.tripleChildSellingPrice} onChange={e => setComponentForm({...componentForm, tripleChildSellingPrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.tripleInfantSellingPrice} onChange={e => setComponentForm({...componentForm, tripleInfantSellingPrice: e.target.value})} /></td>
                                                  </>
                                               )}
                                               {compPricingActiveTab === 'QUAD' && (
                                                  <>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.quadSellingPrice} onChange={e => setComponentForm({...componentForm, quadSellingPrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.quadChildSellingPrice} onChange={e => setComponentForm({...componentForm, quadChildSellingPrice: e.target.value})} /></td>
                                                     <td className="p-1 border-l border-slate-100"><input type="number" step="0.01" className="w-full p-2 bg-transparent font-bold text-sm text-center text-emerald-600 outline-none" value={componentForm.quadInfantSellingPrice} onChange={e => setComponentForm({...componentForm, quadInfantSellingPrice: e.target.value})} /></td>
                                                  </>
                                               )}
                                            </tr>
                                         </tbody>
                                      </table>
                                   </div>
                                 </>
                               ) : (
                                 <div className="col-span-full grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                                   <div className="space-y-3">
                                     <label className="text-[10px] font-bold text-rose-500 uppercase">إجمالي تكلفة الشراء للمجموعة</label>
                                     <input type="number" step="0.01" required className="w-full p-4 bg-white border-2 rounded-xl font-bold text-center text-rose-600 text-xl" value={componentForm.purchasePrice} onChange={e => setComponentForm({...componentForm, purchasePrice: e.target.value})} />
                                   </div>
                                   <div className="space-y-3">
                                     <label className="text-[10px] font-bold text-emerald-600 uppercase">إجمالي سعر البيع للمجموعة</label>
                                     <input type="number" step="0.01" className="w-full p-4 bg-white border-2 rounded-xl font-bold text-center text-emerald-600 text-xl" value={componentForm.sellingPrice} onChange={e => setComponentForm({...componentForm, sellingPrice: e.target.value})} />
                                   </div>
                                   <div className="flex items-center text-xs text-slate-400 font-bold p-4 bg-slate-50 rounded-xl border border-slate-100 mt-3">
                                     ℹ️ سيتم تقسيم هذا المبلغ بالتساوي على جميع أفراد التسكين تلقائياً.
                                   </div>
                                 </div>
                               )}
                             </div>
                           </div>
                           <div className="flex justify-end gap-6 pt-8 border-t border-slate-200 mt-8">
                             <button type="button" onClick={() => setShowAddComponent(false)} className="px-8 py-4 font-bold text-slate-400 hover:text-red-500 transition-colors">إلغاء</button>
                             <button type="button" onClick={handleComponentSubmit} className="bg-slate-900 text-emerald-400 px-16 py-5 rounded-3xl font-bold text-xl shadow-2xl hover:bg-emerald-600 hover:text-white transition-all transform hover:scale-105">
                               {editingComponentId ? 'حفظ التعديلات' : 'إضافة المكون'}
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                   )}
                  <div className="flex justify-end gap-6 pt-10 border-t">
                     <button type="button" onClick={() => setShowAddProgram(false)} className="px-10 py-4 font-bold text-slate-400 hover:text-red-500 transition-colors">إلغاء</button>
                     <button type="submit" className="bg-slate-900 text-emerald-400 px-24 py-5 rounded-3xl font-bold text-2xl shadow-2xl hover:bg-emerald-600 hover:text-white transition-all transform hover:scale-105">
                        {editingProgramId ? 'حفظ التعديلات' : 'حفظ البرنامج الجديد'}
                     </button>
                  </div>
               </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPrograms.map(p => {
               const bookingsCount = (transactions || []).filter(t => t && t.programId === p.id && !t.isVoided).length;
               return (
                 <div key={p.id} className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden group hover:shadow-xl transition-all cursor-pointer" onClick={() => startEditProgram(p)}>
                    <div className="p-8 bg-slate-900 text-white relative">
                       <div className="absolute top-4 left-4 bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{p.type}</div>
                       <h4 className="text-xl font-bold mb-1">{p.name}</h4>
                       {p.masterTripId && (
                         <div className="flex items-center gap-1.5 mb-2">
                           <Layers size={14} className="text-emerald-400" />
                           <span className="text-[10px] font-bold text-emerald-100 bg-emerald-900 bg-opacity-40 px-2 py-0.5 rounded-lg">
                             الرحلة الأم: {(masterTrips || []).find(mt => mt && mt.id === p.masterTripId)?.name || '---'}
                           </span>
                         </div>
                       )}
                       <p className="text-slate-400 font-bold text-xs flex items-center gap-1.5 mt-2 opacity-80"><MapPin size={12} /> {(suppliers || []).find(s => s && s.id === p.supplierId)?.company || '---'}</p>
                    </div>
                    <div className="p-8 space-y-6">
                       <div className="flex justify-between border-b border-slate-50 pb-4">
                          <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">سعر الفرد</p>
                             <p className="text-lg font-bold text-slate-900">{shouldMaskAggregate ? '****' : formatCurrency(p.adultSellingPrice || p.sellingPrice || 0)}</p>
                          </div>
                          <div className="text-left">
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">عدد الحجوزات</p>
                             <p className="text-lg font-bold text-emerald-600">{bookingsCount} أفراد</p>
                          </div>
                       </div>
                       <div className="flex justify-between items-center">
                          <div>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">تاريخ الرحلة</p>
                             <div className="flex items-center gap-2 text-slate-600">
                                <Calendar size={14} />
                                <span className="text-sm font-bold">{p.date}</span>
                             </div>
                          </div>
                          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                             {currentUser.role === 'ADMIN' && p.customerId && (
                               <button 
                                 onClick={() => manualPostProgram(p)} 
                                 className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm flex items-center gap-2 px-4"
                                 title="ترحيل الفواتير للحسابات"
                               >
                                 <BadgeDollarSign size={16} />
                                 <span className="text-xs font-bold">ترحيل الحسابات</span>
                               </button>
                             )}
                             <button onClick={() => setShowRoomingListId(p.id)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm" title="كشف التسكين"><FileText size={16} /></button>
                             {currentUser.role === 'ADMIN' && (
                               <>
                                 <button onClick={() => startEditProgram(p)} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm"><Edit2 size={16} /></button>
                                 <button onClick={() => deleteProgram(p.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"><Trash2 size={16} /></button>
                               </>
                             )}
                          </div>
                       </div>
                    </div>
                 </div>
               );
            })}
          </div>
        </div>
      )}

      {/* BOOKINGS TAB UI */}
      {activeTab === 'BOOKINGS' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                   <Hotel size={24} />
                </div>
                <div>
                   <h3 className="text-xl font-bold text-slate-900 tracking-tight">تسكين وحجوزات العملاء</h3>
                   <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest">إدارة غرف وإقامات المعتمرين</p>
                </div>
             </div>
             <div className="flex items-center gap-4">
               {selectedBookingIds.length > 0 && currentUser.role === 'ADMIN' && (
                 <button 
                   onClick={handleBulkDeleteBookings}
                   className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 shadow-lg hover:bg-rose-600 transition-all active:scale-95 animate-in zoom-in"
                 >
                   <Ban size={18} /> حذف ({selectedBookingIds.length})
                 </button>
               )}
               <button onClick={() => setShowAddBooking(true)} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 shadow-lg hover:bg-emerald-600 transition-all active:scale-95">
                 <Plus size={18} /> تسكين جديد
               </button>
             </div>
          </div>

          {showAddBooking && (
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in zoom-in duration-300">
               <form onSubmit={handleBookingSubmit} className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                     <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">نوع الحجز</label>
                        <select 
                          className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-slate-900 outline-none shadow-sm h-[52px]"
                          value={bookingForm.bookingType}
                          onChange={e => {
                            const type = e.target.value as any;
                            const prog = (programs || []).find(p => p.id === bookingForm.programId);
                            setBookingForm({
                              ...bookingForm, 
                              bookingType: type,
                              customSellingPrice: type === 'SUPERVISOR' ? '0' : (type === 'AGENT' ? (prog?.adultAgentPrice || prog?.adultSellingPrice || prog?.sellingPrice || 0).toString() : (prog?.adultSellingPrice || prog?.sellingPrice || 0).toString())
                            });
                          }}
                        >
                          <option value="DIRECT">عميل مباشر</option>
                          <option value="AGENT">عن طريق مندوب</option>
                          <option value="SUPERVISOR">مشرف رحلة</option>
                        </select>
                     </div>
                     <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">اختر الرحلة المتاحة</label>
                        <SearchableSelect
                          options={(programs || []).map(p => ({ id: p.id, name: p.name, subtext: `بتاريخ: ${p.date}` }))}
                          value={bookingForm.programId}
                          onChange={val => {
                            const prog = (programs || []).find(p => p.id === val);
                            const newBookingType = prog?.isAgent ? 'AGENT' as const : bookingForm.bookingType;
                            setBookingForm({
                              ...bookingForm, 
                              programId: val,
                              bookingType: newBookingType,
                              customSellingPrice: newBookingType === 'SUPERVISOR' ? '0' : (newBookingType === 'AGENT' ? (prog?.adultAgentPrice || prog?.adultSellingPrice || prog?.sellingPrice || 0).toString() : (prog?.adultSellingPrice || prog?.sellingPrice || 0).toString())
                            });
                          }}
                          placeholder="اختر الرحلة"
 />
                     </div>
                     <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">
                          {bookingForm.bookingType === 'AGENT' ? 'المندوب (كعميل)' : 'العميل'}
                        </label>
                        <SearchableSelect
                          options={(customers || []).map(c => ({ id: c.id, name: c.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(otherBalances.customers[c.id] || 0)}` }))}
                          value={bookingForm.bookingType === 'AGENT' ? bookingForm.agentId : bookingForm.customerId}
                          onChange={val => setBookingForm({
                            ...bookingForm, 
                            [bookingForm.bookingType === 'AGENT' ? 'agentId' : 'customerId']: val
                          })}
                          placeholder={bookingForm.bookingType === 'AGENT' ? "اختر المندوب" : "اختر العميل"}
 />
                     </div>
                     <div className="flex flex-col gap-3">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2 flex items-center gap-2">الموظف المسؤول</label>
                        <SearchableSelect
                          options={(employees || []).map(emp => ({ id: emp.id, name: emp.name, subtext: emp.position }))}
                          value={bookingForm.employeeId}
                          onChange={val => {
                            const emp = (employees || []).find(e => e.id === val);
                            setBookingForm({
                              ...bookingForm, 
                              employeeId: val,
                              employeeCommissionRate: emp ? emp.commissionRate.toString() : bookingForm.employeeCommissionRate
                            });
                          }}
                          placeholder="الموظف المسؤول"
                         />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 p-10 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-3">
                           <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">تفاصيل التسكين (الفنادق)</label>
                           <input required className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none shadow-sm" placeholder="فندق موفنبيك" value={bookingForm.accommodation} onChange={e => setBookingForm({...bookingForm, accommodation: e.target.value})} />
                        </div>
                        <div className="flex flex-col gap-3">
                           <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">أسماء المعتمرين (اختياري)</label>
                           <input className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 outline-none shadow-sm" placeholder="أحمد، محمد، ..." value={bookingForm.names} onChange={e => setBookingForm({...bookingForm, names: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-3">
                           <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">نوع الغرفة</label>
                           <select className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-slate-900 outline-none shadow-sm" value={bookingForm.roomType} onChange={e => setBookingForm({...bookingForm, roomType: e.target.value as any})}>
                              <option value="DEFAULT">افتراضي (سعر البالغ)</option>
                              <option value="SINGLE">غرفة سنجل</option>
                              <option value="DOUBLE">غرفة ثنائية</option>
                              <option value="TRIPLE">غرفة ثلاثية</option>
                              <option value="QUAD">غرفة رباعية</option>
                           </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                           <label className="text-base font-bold text-slate-900 uppercase flex items-center gap-2 tracking-wide"><Contact2 size={20} className="text-blue-600" /> المسئول عن التسكين</label>
                           <SearchableSelect
                             options={(employees || []).map(emp => ({ id: emp?.id, name: emp?.name, subtext: emp?.position }))}
                             value={bookingForm.accommodationEmployeeId}
                             onChange={val => setBookingForm({...bookingForm, accommodationEmployeeId: val})}
                             placeholder="المسؤول عن التسكين"
 />
                        </div>
                        <div className="space-y-4">
                           <label className="text-base font-bold text-amber-600 uppercase flex items-center gap-2 tracking-wide"><Percent size={20} /> نسبة العمولة %</label>
                           <input type="number" step="0.1" required className="w-full p-6 bg-white border-2 border-slate-300 rounded-3xl font-bold text-3xl text-center text-slate-900 focus:border-amber-500 outline-none shadow-sm" value={bookingForm.employeeCommissionRate} onChange={e => setBookingForm({...bookingForm, employeeCommissionRate: e.target.value})} />
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-6">
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 uppercase">بالغ</label>
                          <input type="number" min="0" className="w-full p-5 bg-white border border-slate-200 rounded-2xl font-bold text-center text-xl shadow-sm focus:border-indigo-600 outline-none" value={bookingForm.adultCount} onChange={e => setBookingForm({...bookingForm, adultCount: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 uppercase">طفل</label>
                          <input type="number" min="0" className="w-full p-5 bg-white border border-slate-200 rounded-2xl font-bold text-center text-xl shadow-sm focus:border-indigo-600 outline-none" value={bookingForm.childCount} onChange={e => setBookingForm({...bookingForm, childCount: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-slate-500 uppercase">رضيع</label>
                          <input type="number" min="0" className="w-full p-5 bg-white border border-slate-200 rounded-2xl font-bold text-center text-xl shadow-sm focus:border-indigo-600 outline-none" value={bookingForm.infantCount} onChange={e => setBookingForm({...bookingForm, infantCount: e.target.value})} />
                        </div>
                        <div className="space-y-3">
                          <label className="text-xs font-bold text-rose-500 uppercase">المشرفين</label>
                          <input type="number" min="0" className="w-full p-5 bg-white border border-rose-100 rounded-2xl font-bold text-center text-rose-700 text-xl shadow-sm focus:border-rose-500 outline-none" value={bookingForm.supervisorCount} onChange={e => setBookingForm({...bookingForm, supervisorCount: e.target.value})} />
                        </div>
                      </div>
                      <div className="space-y-4">
                         <label className="text-base font-bold text-slate-900 uppercase flex items-center gap-2 tracking-wide"><User size={20} className="text-rose-600" /> اسم مشرف الرحلة</label>
                         <input className="w-full p-6 bg-white border-2 border-rose-100 rounded-3xl font-bold text-xl text-slate-900 focus:border-rose-600 outline-none shadow-sm" placeholder="اكتب اسم المشرف هنا" value={bookingForm.supervisorName} onChange={e => setBookingForm({...bookingForm, supervisorName: e.target.value})} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-8">
                       <div className="space-y-4">
                          <label className="text-base font-bold text-slate-900 uppercase tracking-wide">تاريخ الحجز</label>
                          <input type="date" className="w-full p-6 bg-white border-2 border-slate-200 rounded-3xl font-bold text-xl text-slate-900 focus:border-indigo-600 outline-none shadow-sm" value={bookingForm.date} onChange={e => setBookingForm({...bookingForm, date: e.target.value})} />
                       </div>
                       <div className="space-y-4">
                          <label className="text-base font-bold text-emerald-700 uppercase flex items-center gap-2 tracking-wide"><BadgeDollarSign size={20} /> سعر البيع (تعديل يدوي)</label>
                          <input type="number" className="w-full p-8 bg-white border-4 border-emerald-200 rounded-3xl font-bold text-4xl text-center text-emerald-700 focus:border-indigo-500 outline-none shadow-xl" value={bookingForm.customSellingPrice} onChange={e => setBookingForm({...bookingForm, customSellingPrice: e.target.value})} placeholder="اترك فارغاً للسعر الافتراضي" />
                       </div>
                       <div className="space-y-4">
                          <label className="text-base font-bold text-rose-600 uppercase flex items-center gap-2 tracking-wide"><Tag size={20} /> الخصم للعميل</label>
                          <input type="number" className="w-full p-8 bg-white border-4 border-rose-200 rounded-3xl font-bold text-4xl text-center text-rose-600 focus:border-rose-500 outline-none shadow-xl" value={bookingForm.discount} onChange={e => setBookingForm({...bookingForm, discount: e.target.value})} />
                       </div>

                       {/* Profit and Commission Calculator for Individual Umrah */}
                       {(() => {
                         const prog = (programs || []).find(p => p.id === bookingForm.programId);
                         if (prog?.type === 'INDIVIDUAL_UMRAH') {
                           const adultCount = parseInt(bookingForm.adultCount || '0');
                           const childCount = parseInt(bookingForm.childCount || '0');
                           const infantCount = parseInt(bookingForm.infantCount || '0');
                           
                           const adultPurchase = 
                             bookingForm.roomType === 'SINGLE' ? (prog.singlePurchasePrice || prog.adultPurchasePrice || prog.purchasePrice || 0) :
                             bookingForm.roomType === 'DOUBLE' ? (prog.doublePurchasePrice || prog.adultPurchasePrice || prog.purchasePrice || 0) :
                             bookingForm.roomType === 'TRIPLE' ? (prog.triplePurchasePrice || prog.adultPurchasePrice || prog.purchasePrice || 0) :
                             bookingForm.roomType === 'QUAD' ? (prog.quadPurchasePrice || prog.adultPurchasePrice || prog.purchasePrice || 0) :
                             (prog.adultPurchasePrice || prog.purchasePrice || 0);

                           const childPurchase = 
                             bookingForm.roomType === 'SINGLE' ? (prog.singleChildPurchasePrice || prog.childPurchasePrice || 0) :
                             bookingForm.roomType === 'DOUBLE' ? (prog.doubleChildPurchasePrice || prog.childPurchasePrice || 0) :
                             bookingForm.roomType === 'TRIPLE' ? (prog.tripleChildPurchasePrice || prog.childPurchasePrice || 0) :
                             bookingForm.roomType === 'QUAD' ? (prog.quadChildPurchasePrice || prog.childPurchasePrice || 0) :
                             (prog.childPurchasePrice || 0);

                           const infantPurchase = 
                             bookingForm.roomType === 'SINGLE' ? (prog.singleInfantPurchasePrice || prog.infantPurchasePrice || 0) :
                             bookingForm.roomType === 'DOUBLE' ? (prog.doubleInfantPurchasePrice || prog.infantPurchasePrice || 0) :
                             bookingForm.roomType === 'TRIPLE' ? (prog.tripleInfantPurchasePrice || prog.infantPurchasePrice || 0) :
                             bookingForm.roomType === 'QUAD' ? (prog.quadInfantPurchasePrice || prog.infantPurchasePrice || 0) :
                             (prog.infantPurchasePrice || 0);

                           const totalPurchase = (adultCount * adultPurchase) + (childCount * childPurchase) + (infantCount * infantPurchase);
                           const totalSelling = parseFloat(bookingForm.customSellingPrice || '0') - parseFloat(bookingForm.discount || '0');
                           const netProfit = totalSelling - totalPurchase;
                           const commRate = parseFloat(bookingForm.employeeCommissionRate || '0');
                           const commissionValue = netProfit > 0 ? (netProfit * (commRate * 0.01)) : 0;

                           return (
                             <div className="md:col-span-1 space-y-4 bg-emerald-50 bg-opacity-50 p-6 rounded-3xl border-2 border-emerald-100 shadow-sm animate-in fade-in slide-in-from-top-4 duration-500">
                               <div className="flex items-center justify-between mb-4">
                                 <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                                     <Calculator size={20} />
                                   </div>
                                   <h4 className="text-lg font-black text-emerald-900">حاسبة الربح والعمولة</h4>
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-4">
                                 <div className={`p-4 rounded-2xl border shadow-sm transition-all ${netProfit >= 0 ? 'bg-white border-emerald-100' : 'bg-rose-50 border-rose-200 animate-pulse'}`}>
                                   <div className="flex items-center justify-between mb-1">
                                      <p className="text-[10px] font-bold text-slate-400 uppercase">صافي الربح</p>
                                      {netProfit < 0 && <TrendingDown size={14} className="text-rose-600" />}
                                   </div>
                                   <p className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                     {formatCurrency(netProfit)}
                                   </p>
                                   {netProfit < 0 && (
                                     <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-rose-700 bg-white bg-opacity-50 p-1 rounded border border-rose-100">
                                       <AlertCircle size={10} />
                                       تنبيه: العملية تحقق خسارة!
                                     </div>
                                   )}
                                 </div>
                                 <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">العمولة المستحقة</p>
                                   <p className="text-xl font-black text-amber-600">
                                     {formatCurrency(commissionValue)}
                                   </p>
                                 </div>
                               </div>

                               <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
                                 <input 
                                   type="checkbox" 
                                   id="applyCommissionUmrah"
                                   className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                                   checked={bookingForm.applyCommission}
                                   onChange={e => setBookingForm({...bookingForm, applyCommission: e.target.checked})}
 />
                                 <label htmlFor="applyCommissionUmrah" className="text-xs font-bold text-slate-700 cursor-pointer">
                                   ترحيل العمولة لحساب الموظف تلقائياً
                                 </label>
                               </div>
                             </div>
                           );
                         }
                         return null;
                       })()}

                       {enableCostCenters && (
                         <div className="space-y-4">
                            <label className="text-base font-bold text-slate-700 uppercase flex items-center gap-2 tracking-wide"><Layers size={20} className="text-slate-600" /> مركز التكلفة</label>
                            <select 
                              className="w-full p-6 bg-white border-2 border-slate-200 rounded-3xl font-bold text-xl text-slate-900 focus:border-slate-500 outline-none shadow-sm"
                              value={bookingForm.costCenterId}
                              onChange={e => setBookingForm({...bookingForm, costCenterId: e.target.value})}
                            >
                              <option value="">بدون مركز تكلفة</option>
                              {costCenters.filter(cc => cc.isActive).map(cc => (
                                <option key={cc.id} value={cc.id}>{cc.name}</option>
                              ))}
                            </select>
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-6 border-t border-slate-100 pt-8">
                    <button type="button" onClick={() => setShowAddBooking(false)} className="px-12 py-5 font-bold text-slate-400 hover:text-red-500 transition-colors text-xl">إلغاء</button>
                    <button type="submit" className="bg-slate-900 text-emerald-400 px-24 py-6 rounded-3xl font-bold text-3xl shadow-2xl hover:bg-emerald-700 hover:text-white transition-all transform hover:scale-105">إتمام الترحيل المالي</button>
                  </div>
               </form>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 border-b border-slate-800">
                    <th className="px-10 py-8 w-12 text-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                        checked={filteredBookings.length > 0 && selectedBookingIds.length === filteredBookings.length}
                        onChange={toggleSelectAllBookings}
 />
                    </th>
                    <th className="px-10 py-8 text-xs font-bold uppercase tracking-[0.2em]">تفاصيل الرحلة والبرنامج</th>
                    <th className="px-10 py-8 text-xs font-bold uppercase tracking-[0.2em]">المعتمر / العميل</th>
                    <th className="px-10 py-8 text-xs font-bold uppercase tracking-[0.2em] text-center">نوع الغرفة والعدد</th>
                    <th className="px-10 py-8 text-xs font-bold uppercase tracking-[0.2em] text-center">المسؤول عن التنفيذ</th>
                    <th className="px-10 py-8 text-xs font-bold uppercase tracking-[0.2em] text-center">المسؤول عن التسكين</th>
                    <th className="px-10 py-8 text-xs font-bold uppercase tracking-[0.2em] text-center">القيمة النهائية</th>
                    <th className="px-10 py-8 text-xs font-bold uppercase tracking-[0.2em] text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {filteredBookings.map(tx => (
                    <tr 
                      key={tx.id} 
                      id={`booking-${tx.id}`}
                      className={`hover:bg-slate-50 transition-all group ${highlightedId === tx.id ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/30 scale-[1.002] z-10 shadow-2xl' : ''}`}
                    >
                      <td className="px-10 py-8 text-center">
                        <input 
                          type="checkbox" 
                          className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                          checked={selectedBookingIds.includes(tx.id)}
                          onChange={() => toggleSelectBooking(tx.id)}
 />
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-2">
                          {tx.masterTripId && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg w-fit border border-emerald-100">
                              {(masterTrips || []).find(mt => mt && mt.id === tx.masterTripId)?.name || 'رحلة غير محددة'}
                            </span>
                          )}
                          <p className="text-slate-900 font-bold text-lg leading-tight">{(tx.description || '').split(' - ')[0]}</p>
                          {tx.refNo && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(tx.refNo);
                                const btn = document.getElementById(`ref-hu-${tx.id}`);
                                if (btn) {
                                  const originalText = btn.innerText;
                                  btn.innerText = 'تم النسخ';
                                  setTimeout(() => { btn.innerText = originalText; }, 1000);
                                }
                              }}
                              id={`ref-hu-${tx.id}`}
                              className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg w-fit border border-emerald-100 hover:bg-emerald-100 transition-all"
                              title="اضغط للنسخ والبحث"
                            >
                              Ref: #{tx.refNo}
                            </button>
                          )}
                          {!tx.refNo && (
                            <span className="text-[11px] text-emerald-600 font-bold uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-lg w-fit border border-emerald-100">Ref: #{tx.id.slice(-6).toUpperCase()}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
                            {(customers || []).find(c => c && c.id === tx.relatedEntityId)?.name?.charAt(0) || '?'}
                          </div>
                          <p className="text-slate-900 font-bold text-lg">{(customers || []).find(c => c && c.id === tx.relatedEntityId)?.name || '---'}</p>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                        <div className="flex flex-col items-center gap-2">
                          <span className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm ${
                            tx.roomType === 'SINGLE' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                            tx.roomType === 'DOUBLE' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                            tx.roomType === 'TRIPLE' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                            tx.roomType === 'QUAD' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            {tx.roomType === 'SINGLE' ? 'سنجل' :
                             tx.roomType === 'DOUBLE' ? 'ثنائي' :
                             tx.roomType === 'TRIPLE' ? 'ثلاثي' :
                             tx.roomType === 'QUAD' ? 'رباعي' : 'افتراضي'}
                          </span>
                          <span className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
                            {tx.adultCount} بالغ | {tx.childCount} طفل | {tx.infantCount} رضيع{tx.supervisorCount > 0 && ` | ${tx.supervisorCount} مشرف`}
                          </span>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                         <div className="flex flex-col items-center gap-2">
                            <span className="text-slate-900 text-base font-bold">
                               {(employees || []).find(e => e && e.id === tx.employeeId)?.name || '---'}
                            </span>
                            <span className="text-[10px] font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-lg uppercase tracking-wider border border-amber-200">عمولة: {isHidden ? '****' : (tx.employeeCommissionRate || 0)}%</span>
                         </div>
                      </td>
                      <td className="px-10 py-8 text-center">
                         <span className="text-slate-900 text-base font-bold bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            {(employees || []).find(e => e && e.id === tx.accommodationEmployeeId)?.name || '---'}
                         </span>
                      </td>
                      <td className="px-10 py-8 text-center">
                         <div className="flex flex-col items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-2xl font-bold text-slate-900">
                               {isHidden ? '****' : formatCurrency(tx.amountInBase || ((tx.sellingPrice || 0) - (tx.discount || 0)) * (tx.exchangeRate || 1))}
                            </p>
                            {tx.discount > 0 && <p className="text-[11px] text-rose-600 font-bold mt-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">خصم: {isHidden ? '****' : formatCurrency((tx.discount || 0) * (tx.exchangeRate || 1))}</p>}
                         </div>
                      </td>
                      <td className="px-8 py-5">
                         <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEditBooking(tx)} className="p-2.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all" title="تعديل الحجز">
                               <Edit2 size={18} />
                            </button>
                            {currentUser.role === 'ADMIN' && (
                              <button onClick={() => deleteTransaction(tx.id)} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all" title="حذف الحجز">
                                <Ban size={18} />
                              </button>
                            )}
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MASTER TRIPS TAB UI */}
      {activeTab === 'MASTER_TRIPS' && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
           <div className="flex justify-between items-center bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                   <Layers size={32} />
                </div>
                <div>
                   <h3 className="text-2xl font-bold text-slate-900 tracking-tight">إدارة الرحلات المجمعة</h3>
                   <div className="flex items-center gap-4 mt-1">
                      <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">تنظيم وتصنيف المجموعات والبرامج</p>
                      <button 
                        onClick={() => setShowVoidedTrips(!showVoidedTrips)}
                        className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all ${showVoidedTrips ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                      >
                        {showVoidedTrips ? 'إخفاء الملغي' : 'عرض الرحلات الملغية'}
                      </button>
                   </div>
                </div>
             </div>
             <button onClick={() => { setEditingMasterTripId(null); setMasterTripForm({ name: '', date: new Date().toISOString().split('T')[0], type: 'UMRAH', details: '', components: [] }); setShowAddMasterTrip(true); }} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 shadow-lg hover:bg-emerald-600 transition-all active:scale-95">
               <Plus size={18} /> تعريف رحلة مجمعة جديدة
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(masterTrips || []).filter(mt => mt && (showVoidedTrips ? true : !mt.isVoided)).map(trip => {
              const linkedPrograms = (programs || []).filter(p => p && p.masterTripId === trip.id);
              const totalBookings = (transactions || []).filter(t => t && (linkedPrograms || []).some(p => p && p.id === t.programId) && !t.isVoided).reduce((sum, t) => sum + (t?.adultCount || 0) + (t?.childCount || 0), 0);
              
              return (
                <div key={trip.id} className={`bg-white p-8 rounded-3xl border shadow-sm hover:border-indigo-500 transition-all group relative overflow-hidden ${trip.isVoided ? 'border-rose-200 opacity-75 grayscale-[0.5]' : 'border-slate-200'}`}>
                  <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-3xl -mr-10 -mt-10 group-hover:bg-emerald-600 transition-colors duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className={`px-4 py-1 rounded-full text-[10px] font-bold ${
                        trip.isVoided ? 'bg-rose-100 text-rose-700' :
                        trip.type === 'HAJJ' ? 'bg-amber-100 text-amber-700' :
                        trip.type === 'UMRAH' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {trip.isVoided ? 'ملغية / محذوفة' : (trip.type === 'HAJJ' ? 'حج' : trip.type === 'UMRAH' ? 'عمرة' : 'عام')}
                      </div>
                      <div className="flex gap-2">
                        {trip.isVoided ? (
                          <button onClick={() => restoreMasterTrip(trip.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="استعادة">
                            <Activity size={16} />
                          </button>
                        ) : (
                          <>
                            <button onClick={() => startEditMasterTrip(trip)} className="p-2 text-slate-400 hover:text-emerald-600 transition-colors">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => deleteMasterTrip(trip.id)} className="p-2 text-slate-400 hover:text-rose-600 transition-colors">
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <h4 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-emerald-600 transition-colors">{trip.name}</h4>
                    <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-6">
                      <Calendar size={14} />
                      {trip.date}
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">البرامج</p>
                        <p className="text-lg font-bold text-slate-900">{linkedPrograms.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي المعتمرين</p>
                        <p className="text-lg font-bold text-emerald-600">{totalBookings}</p>
                      </div>
                    </div>

                    {/* عرض البرامج المندرجة */}
                    <div className="mt-6 space-y-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-1">البرامج المندرجـــة</p>
                      {linkedPrograms.length > 0 ? (
                        <div className="max-h-32 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                          {(linkedPrograms || []).map(p => (
                            <div key={p?.id} className="flex justify-between items-center text-[11px] font-bold text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100 hover:border-emerald-200 transition-colors">
                              <div className="flex items-center gap-2">
                                <Package size={12} className="text-slate-400" />
                                <span className="truncate max-w-[120px]">{p?.name || '-'}</span>
                              </div>
                              <span className="text-emerald-600 text-[9px] bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">{formatCurrency(p?.sellingPrice || 0)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-300 italic py-2">لا توجد برامج مضافة بعد</p>
                      )}
                    </div>

                    <button 
                      onClick={() => { 
                        setEditingProgramId(null); 
                        setProgramForm({ 
                          ...INITIAL_PROGRAM_FORM,
                          masterTripId: trip.id, 
                          type: trip.type as any || 'UMRAH', 
                          date: trip.date, 
                          components: trip.components || [] 
                        }); 
                        setShowAddProgram(true); 
                        setActiveTab('PROGRAMS');
                      }}
                      className="mt-6 w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all border border-emerald-100 shadow-sm"
                    >
                      <Plus size={14} /> إضافة برنامج لهذه المجموعة
                    </button>

                    <button 
                      onClick={() => onManageAccommodation?.(trip.id)}
                      className="mt-2 w-full py-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100 shadow-sm"
                    >
                      <Hotel size={14} /> إدارة كشوف التسكين
                    </button>

                    {trip.details && (
                      <p className="mt-4 text-[10px] text-slate-400 font-bold line-clamp-1 italic">
                        "{trip.details}"
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          
          {(masterTrips || []).filter(mt => mt && (showVoidedTrips ? true : !mt.isVoided)).length === 0 && (
            <div className="bg-white p-20 rounded-3xl border-4 border-dashed border-slate-200 text-center">
              <Layers size={64} className="mx-auto text-slate-200 mb-6" />
              <h4 className="text-2xl font-bold text-slate-400">لا توجد رحلات مجمعة حالياً</h4>
              <p className="text-slate-300 font-bold mt-2">{showVoidedTrips ? 'جرب إخفاء الرحلات الملغية' : 'ابدأ بتعريف رحلة أم لربط البرامج والرحلات بها'}</p>
            </div>
          )}
        </div>
      )}

      {/* VISA MANAGEMENT TAB UI */}
      {activeTab === 'VISA_MANAGEMENT' && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <Globe size={20} />
              </div>
              متابعة إصدار التأشيرات
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest">العميل</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest">البرنامج / المكون</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-center">عدد المعتمرين</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-center">تم الإصدار</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest">الحالة التشغيلية</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-center">التقدم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(transactions || [])
                    .filter(t => t && t.visaStatus && !t.isVoided)
                    .map(tx => {
                      const totalPilgrims = (tx?.adultCount || 0) + (tx?.childCount || 0);
                      return (
                        <tr key={tx?.id} className="hover:bg-slate-50 transition-all">
                          <td className="px-8 py-5 font-bold text-slate-900">
                            {(customers || []).find(c => c && c.id === tx?.relatedEntityId)?.name || '---'}
                          </td>
                          <td className="px-8 py-5 font-bold text-emerald-600 text-xs">
                            {tx?.description || '---'}
                          </td>
                          <td className="px-8 py-5 text-center font-bold text-slate-900">
                            {totalPilgrims}
                          </td>
                          <td className="px-8 py-5 text-center">
                            <input 
                              type="number" 
                              max={totalPilgrims}
                              min={0}
                              className="w-16 p-2 bg-slate-50 border border-slate-200 rounded-lg text-center font-bold text-emerald-600 focus:border-indigo-500 outline-none"
                              value={tx.visaIssuedCount || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value || '0');
                                updateTransaction(tx.id, { ...tx, visaIssuedCount: val });
                              }}
 />
                          </td>
                          <td className="px-8 py-5">
                            <select 
                              className={`px-4 py-1.5 rounded-full text-[10px] font-bold border-none outline-none ${
                                tx.visaStatus === 'ISSUED' ? 'bg-emerald-100 text-emerald-700' :
                                tx.visaStatus === 'IN_PROCESS' ? 'bg-amber-100 text-amber-700' :
                                tx.visaStatus === 'CANCELLED' ? 'bg-rose-100 text-rose-700' :
                                'bg-slate-100 text-slate-700'
                              }`}
                              value={tx.visaStatus}
                              onChange={(e) => {
                                updateTransaction(tx.id, { ...tx, visaStatus: e.target.value as any });
                              }}
                            >
                              <option value="PENDING">قيد الانتظار</option>
                              <option value="IN_PROCESS">تحت التنفيذ</option>
                              <option value="ISSUED">تم الإصدار ✅</option>
                              <option value="CANCELLED">ملغى ❌</option>
                            </select>
                          </td>
                          <td className="px-8 py-5 text-center">
                            <div className="w-32 mx-auto">
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-indigo-500 h-full transition-all duration-500" 
                                  style={{ width: `${Math.min(100, ((tx.visaIssuedCount || 0) * (1 / (totalPilgrims || 1))) * 100)}%` }}
 />
                              </div>
                              <p className="text-[9px] font-bold text-slate-400 mt-1">
                                {Math.round(((tx.visaIssuedCount || 0) * (1 / (totalPilgrims || 1))) * 100)}% مكتمل
                              </p>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* GUARANTEES TAB UI */}
      {activeTab === 'GUARANTEES' && (
        <div className="space-y-8 animate-in zoom-in-95 duration-500">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                <ShieldCheck size={20} />
              </div>
              سجل خطابات الضمان والوكلاء (LG)
            </h3>
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-900 text-white">
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest">التاريخ</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest">الوكيل المودع لديه</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest">البرنامج / الرحلة</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest">المبلغ</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest">الحالة</th>
                    <th className="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold">
                  {(transactions || [])
                    .filter(t => t.category === 'GUARANTEE_LETTER' && !t.isVoided)
                    .map(tx => {
                      const isReleased = (transactions || []).some(t => t.parentTransactionId === tx.id && !t.isVoided);
                      const isRefundTx = tx.type === 'INCOME';
                      
                      if (isRefundTx) return null; 

                      return (
                        <tr key={tx.id} className={`hover:bg-slate-50 transition-all ${isReleased ? 'opacity-50' : ''}`}>
                          <td className="px-8 py-5 font-bold text-slate-500 text-xs">{tx.date || '-'}</td>
                          <td className="px-8 py-5 font-bold text-slate-900">{(suppliers || []).find(s => s && s.id === tx.relatedEntityId)?.company || '---'}</td>
                          <td className="px-8 py-5 font-bold text-emerald-600 text-xs">{(programs || []).find(p => p && p.id === tx.programId)?.name || 'عام / غير محدد'}</td>
                          <td className="px-8 py-5 font-bold text-lg text-slate-900">{formatCurrency(tx.amount || 0)}</td>
                          <td className="px-8 py-5">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold ${isReleased ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {isReleased ? 'تم الاسترداد ✅' : 'قائم لدى الوكيل ⏳'}
                            </span>
                          </td>
                          <td className="px-8 py-5 text-center">
                            {!isReleased && (
                              <button 
                                onClick={() => releaseGuarantee(tx)}
                                className="bg-indigo-500 text-white px-4 py-2 rounded-xl text-[10px] font-bold hover:bg-emerald-600 transition-all"
                              >
                                تأكيد الاسترداد
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ADD MASTER TRIP MODAL */}
      {showAddMasterTrip && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-md z-[120] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-900 text-emerald-400 rounded-xl flex items-center justify-center shadow-lg">
                       <Globe size={28} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-900">{editingMasterTripId ? 'تعديل الرحلة الأم' : 'تعريف رحلة أم جديدة'}</h3>
                       <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">Create Group Trip * (1 / Master) Trip</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAddMasterTrip(false)} className="w-12 h-12 bg-white text-slate-400 rounded-xl flex items-center justify-center hover:text-rose-500 transition-all shadow-sm border border-slate-100">
                    <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleMasterTripSubmit} className="p-10 space-y-8">
                 <div className="space-y-6">
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">اسم الرحلة (المجموعة)</label>
                       <input required className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xl text-slate-900 focus:border-indigo-600 outline-none transition-all shadow-sm" placeholder="مثال: عمرة رجب - 22 يناير" value={masterTripForm.name} onChange={e => setMasterTripForm({...masterTripForm, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">تاريخ البداية</label>
                          <input type="date" required className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-indigo-600 outline-none shadow-sm" value={masterTripForm.date} onChange={e => setMasterTripForm({...masterTripForm, date: e.target.value})} />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">نوع الرحلة</label>
                          <select className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-slate-900 outline-none shadow-sm" value={masterTripForm.type} onChange={e => setMasterTripForm({...masterTripForm, type: e.target.value as any})}>
                             <option value="UMRAH">عمرة</option>
                             <option value="HAJJ">حج</option>
                             <option value="GENERAL">سياحة عامة</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest px-2">تفاصيل إضافية</label>
                       <textarea className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl font-bold focus:border-indigo-600 outline-none min-h-[100px] shadow-sm" value={masterTripForm.details} onChange={e => setMasterTripForm({...masterTripForm, details: e.target.value})} placeholder="أي ملاحظات عامة عن الرحلة..." />
                    </div>
                 </div>

                 <div className="flex justify-end gap-6 pt-10 border-t border-slate-100">
                    <button type="button" onClick={() => setShowAddMasterTrip(false)} className="px-10 py-5 font-bold text-slate-400 hover:text-rose-600 transition-colors">إلغاء</button>
                    <button type="submit" className="bg-slate-900 text-emerald-400 px-16 py-5 rounded-2xl font-bold text-xl shadow-xl hover:bg-emerald-600 hover:text-white transition-all transform active:scale-95">
                       تأكيد التعريف
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showAddGuarantee && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border-b-8 border-amber-500 animate-in zoom-in-95 duration-300">
              <div className="p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
                       <ShieldCheck size={28} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-900">دفع خطاب ضمان (LG)</h3>
                       <p className="text-slate-400 font-bold text-[10px] uppercase">Record New Guarantee Deposit</p>
                    </div>
                 </div>
                 <button onClick={() => setShowAddGuarantee(false)} className="w-12 h-12 bg-white text-slate-400 rounded-2xl flex items-center justify-center hover:text-rose-500 hover:rotate-90 transition-all shadow-sm border border-slate-100">
                    <X size={24} />
                 </button>
              </div>

              <form onSubmit={handleGuaranteeSubmit} className="p-10 space-y-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">الوكيل / المورد</label>
                       <SearchableSelect
                         options={(suppliers || []).map(s => ({ id: s?.id, name: s?.company, subtext: `رصيد: ${formatCurrency(s?.balance || 0)}` }))}
                         value={guaranteeForm.supplierId}
                         onChange={val => setGuaranteeForm({...guaranteeForm, supplierId: val})}
                         placeholder="اختر الوكيل..."
 />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">البرنامج (اختياري)</label>
                       <SearchableSelect
                         options={(programs || []).map(p => ({ id: p?.id, name: p?.name, subtext: p?.date }))}
                         value={guaranteeForm.programId}
                         onChange={val => setGuaranteeForm({...guaranteeForm, programId: val})}
                         placeholder="اختر الرحلة..."
 />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">المبلغ</label>
                       <div className="flex gap-2">
                          <input type="number" required className="flex-1 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-2xl text-amber-600 focus:border-amber-500 outline-none transition-all" value={guaranteeForm.amount} onChange={e => setGuaranteeForm({...guaranteeForm, amount: e.target.value})} />
                          <select 
                            className="w-32 p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-900 focus:border-amber-500 outline-none transition-all"
                            value={guaranteeForm.currencyCode}
                            onChange={e => {
                              const code = e.target.value;
                              const rate = (currencies || []).find(c => c?.code === code)?.rateToMain || 1;
                              setGuaranteeForm({...guaranteeForm, currencyCode: code, exchangeRate: rate.toString()});
                            }}
                          >
                            {(currencies || []).map(c => <option key={c?.code} value={c?.code}>{c?.code}</option>)}
                          </select>
                       </div>
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">سعر الصرف ({(settings?.baseCurrency || 'EGP')})</label>
                       <input 
                         type="number" 
                         step="any"
                         disabled={guaranteeForm.currencyCode === (settings?.baseCurrency || 'EGP')}
                         className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-xl text-slate-900 focus:border-amber-500 outline-none transition-all disabled:opacity-50" 
                         value={guaranteeForm.currencyCode === (settings?.baseCurrency || 'EGP') ? '1' : guaranteeForm.exchangeRate} 
                         onChange={e => setGuaranteeForm({...guaranteeForm, exchangeRate: e.target.value})} 
 />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">الدفع من (الخزينة / البنك)</label>
                       <SearchableSelect
                         options={(treasuries || []).map(t => ({ id: t?.id, name: t?.name, subtext: `الرصيد: ${formatCurrency(t?.balance || 0)}` }))}
                         value={guaranteeForm.treasuryId}
                         onChange={val => setGuaranteeForm({...guaranteeForm, treasuryId: val})}
                         placeholder="اختر الخزينة..."
 />
                    </div>
                    {enableCostCenters && (
                      <div className="space-y-3">
                         <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">مركز التكلفة (اختياري)</label>
                         <SearchableSelect
                           options={(costCenters || []).filter(cc => cc?.isActive).map(cc => ({ id: cc?.id, name: cc?.name }))}
                           value={guaranteeForm.costCenterId}
                           onChange={val => setGuaranteeForm({...guaranteeForm, costCenterId: val})}
                           placeholder="اختر مركز التكلفة..."
 />
                      </div>
                    )}
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">التاريخ</label>
                       <input type="date" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-amber-500 outline-none" value={guaranteeForm.date} onChange={e => setGuaranteeForm({...guaranteeForm, date: e.target.value})} />
                    </div>
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">ملاحظات</label>
                       <input className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold focus:border-amber-500 outline-none" value={guaranteeForm.details} onChange={e => setGuaranteeForm({...guaranteeForm, details: e.target.value})} placeholder="رقم الشيك أو تفاصيل إضافية" />
                    </div>
                 </div>

                 <div className="flex justify-end gap-6 pt-10 border-t border-slate-100 mt-8">
                    <button type="button" onClick={() => setShowAddGuarantee(false)} className="px-10 py-5 font-bold text-slate-400 hover:text-rose-500 transition-colors">إلغاء</button>
                    <button type="submit" className="bg-amber-500 text-white px-20 py-5 rounded-3xl font-bold text-xl shadow-2xl hover:bg-amber-600 transition-all transform hover:scale-105">
                       تأكيد دفع خطاب الضمان
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      {showRoomingListId && (
        <div className="fixed inset-0 bg-slate-900 bg-opacity-40 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-10">
          <div className="bg-white w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col border-4 border-indigo-500">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center no-print">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">كشف تسكين المعتمرين</h3>
                    <p className="text-xs text-slate-500 font-bold">{(programs || []).find(p => p.id === showRoomingListId)?.name}</p>
                  </div>
               </div>
               <div className="flex gap-4">
                  <button onClick={handleRoomingListPrint} className="bg-slate-900 text-emerald-400 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all">
                    <Printer size={18} /> طباعة الكشف
                  </button>
                  <button onClick={() => setShowRoomingListId(null)} className="p-3 bg-white border-2 text-slate-400 rounded-xl hover:text-red-500 transition-colors">
                    <X size={24} />
                  </button>
               </div>
            </div>
            
            <div id="rooming-list-to-print" className="flex-1 overflow-y-auto p-10 print:p-0">
               <div className="space-y-10">
                  <div className="hidden print:block text-center border-b-4 border-slate-900 pb-6 mb-10">
                     <h2 className="text-3xl font-bold text-slate-900 mb-2">{(programs || []).find(p => p.id === showRoomingListId)?.name}</h2>
                     <p className="text-lg font-bold text-slate-600">كشف تسكين الغرف والمنافست</p>
                     <p className="text-sm font-bold text-emerald-600 mt-2">تاريخ الرحلة: {(programs || []).find(p => p.id === showRoomingListId)?.date}</p>
                  </div>

                  {/* سجل تذاكر الطيران المرتبطة بالبرنامج */}
                  {(transactions || []).some(t => t.programId === showRoomingListId && ['FLIGHT', 'FLIGHT_REFUND', 'FLIGHT_REISSUE'].includes(t.category) && !t.isVoided) && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 bg-sky-50 p-4 rounded-2xl border-r-8 border-sky-600 no-print">
                        <Plane size={24} className="text-sky-600" />
                        <h4 className="text-lg font-bold text-slate-900">تذاكر الطيران الصادرة لهذا البرنامج</h4>
                      </div>
                      <div className="overflow-x-auto rounded-2xl border-2 border-sky-100">
                        <table className="w-full text-right bg-white">
                          <thead className="bg-sky-600 text-white text-xs uppercase">
                            <tr>
                              <th className="px-6 py-4 font-bold">PNR / البيان</th>
                              <th className="px-6 py-4 font-bold">اسم العميل</th>
                              <th className="px-6 py-4 font-bold text-center">الحالة</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-sky-100">
                            {transactions
                              .filter(t => t.programId === showRoomingListId && ['FLIGHT', 'FLIGHT_REFUND', 'FLIGHT_REISSUE'].includes(t.category) && !t.isVoided)
                              .map(t => (
                                <tr key={t.id} className="hover:bg-sky-50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-slate-900 uppercase">{t.pnr || '---'}</span>
                                      <span className="text-[10px] text-slate-400 font-bold">{t.description}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 font-bold text-slate-700">{(customers || []).find(c => c?.id === t?.relatedEntityId)?.name || '---'}</td>
                                  <td className="px-6 py-4 text-center">
                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-bold ${
                                      t.category === 'FLIGHT_REFUND' ? 'bg-rose-100 text-rose-600' :
                                      t.category === 'FLIGHT_REISSUE' ? 'bg-amber-100 text-amber-600' :
                                      'bg-emerald-100 text-emerald-600'
                                    }`}>
                                      {t.category === 'FLIGHT_REFUND' ? 'مسترجع' : t.category === 'FLIGHT_REISSUE' ? 'إعادة إصدار' : 'مؤكد'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {Object.entries(
                    (transactions || [])
                      .filter(t => t && t.programId === showRoomingListId && !t.isVoided && t.type === 'INCOME')
                      .reduce((groups, t) => {
                        const acc = t.accommodation || 'تسكين غير محدد';
                        if (!groups[acc]) groups[acc] = [];
                        groups[acc].push(t);
                        return groups;
                      }, {} as Record<string, Transaction[]>)
                  ).map(([acc, bookings]: [string, any[]]) => (
                    <div key={acc} className="space-y-4">
                       <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border-r-8 border-slate-900">
                          <Hotel className="text-emerald-600" size={24} />
                          <h4 className="text-lg font-bold text-slate-900">{acc}</h4>
                          <span className="mr-auto bg-white px-4 py-1 rounded-full text-xs font-bold text-emerald-600 border border-emerald-100">
                             عدد الأفراد: {bookings.reduce((s: number, b: any) => s + (b.adultCount || 0) + (b.childCount || 0) + (b.infantCount || 0) + (b.supervisorCount || 0), 0)}
                          </span>
                       </div>
                       <table className="w-full border-collapse border border-slate-200">
                          <thead>
                             <tr className="bg-slate-100 text-slate-600">
                                <th className="border p-3 text-right text-xs font-bold">اسم المعتمر / العميل</th>
                                <th className="border p-3 text-center text-xs font-bold w-24">نوع الغرفة</th>
                                <th className="border p-3 text-center text-xs font-bold w-14">بالغ</th>
                                <th className="border p-3 text-center text-xs font-bold w-14">طفل</th>
                                <th className="border p-3 text-center text-xs font-bold w-14">رضيع</th>
                                <th className="border p-3 text-center text-xs font-bold w-14 text-rose-600">مشرف</th>
                                <th className="border p-3 text-right text-xs font-bold">الموظف المسؤول</th>
                             </tr>
                          </thead>
                          <tbody>
                             {bookings.map((b: any) => (
                               <tr key={b.id} className="border-b hover:bg-slate-50 transition-colors">
                                  <td className="border p-3 font-bold text-slate-900">{(customers || []).find(c => c?.id === b?.relatedEntityId)?.name || '---'}</td>
                                  <td className="border p-3 text-center text-[10px] font-bold">
                                    {b.roomType === 'SINGLE' ? 'سنجل' :
                                     b.roomType === 'DOUBLE' ? 'ثنائي' :
                                     b.roomType === 'TRIPLE' ? 'ثلاثي' :
                                     b.roomType === 'QUAD' ? 'رباعي' : '---'}
                                  </td>
                                  <td className="border p-3 text-center font-bold">{b.adultCount || 0}</td>
                                  <td className="border p-3 text-center font-bold">{b.childCount || 0}</td>
                                  <td className="border p-3 text-center font-bold">{b.infantCount || 0}</td>
                                  <td className="border p-3 text-center font-bold text-rose-600">
                                    <div className="flex flex-col">
                                      <span>{b.supervisorCount || 0}</span>
                                      {b.supervisorName && <span className="text-[8px] mt-0.5 text-rose-600">{b.supervisorName}</span>}
                                    </div>
                                  </td>
                                  <td className="border p-3 text-sm font-bold text-slate-500">{(employees || []).find(e => e?.id === (b.accommodationEmployeeId || b.employeeId))?.name || '---'}</td>
                               </tr>
                             ))}
                          </tbody>
                       </table>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </div>
      )}
      {showReturnSelectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-6 flex justify-between items-center">
              <div className="flex items-center gap-4 text-white">
                <div className="p-3 bg-amber-500 rounded-xl">
                  <RotateCcw size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold">اختيار المكون للارتداد المالي</h3>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">يرجى اختيار البند الذي ترغب في عمل ارتداد له</p>
                </div>
              </div>
              <button onClick={() => setShowReturnSelectionModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-rose-500 transition-all">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {(() => {
                // Fetch ALL relevant purchase transactions for this program
                const programTransactions = (transactions || [])
                  .filter(t => t.programId === editingProgramId && t.supplierId && !t.isVoided && (t.type === 'EXPENSE' || t.isPurchaseOnly || t.category === 'REFUND_SERVICE'))
                  .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

                // Exclude already reversed transactions if they are exact matches (optional, but let's show everything for transparency)
                // Map transactions to a standard display format
                const availableItems = programTransactions.map(t => {
                  const supplier = (suppliers || []).find(s => s.id === t.supplierId);
                  const isRefund = t.category === 'REFUND_SERVICE';
                  
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setShowReturnSelectionModal(false);
                        handleReturnComponent(editingProgramId!, t.componentId || '', t.id);
                      }}
                      className={`w-full flex items-center justify-between p-5 ${isRefund ? 'bg-rose-50 border-rose-100 opacity-60' : 'bg-slate-50 border-slate-200'} hover:bg-indigo-50 border hover:border-indigo-200 rounded-2xl transition-all group`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl shadow-sm ${isRefund ? 'bg-rose-100 text-rose-600' : 'bg-white text-slate-500 group-hover:bg-indigo-600 group-hover:text-white'} transition-all`}>
                          {t.category === 'HOTEL' ? <Hotel size={20} /> :
                           t.category === 'FLIGHT' || t.category === 'FLIGHT_TICKET' ? <Plane size={20} /> :
                           t.category === 'VISA' ? <ShieldCheck size={20} /> : 
                           t.category === 'REFUND_SERVICE' ? <RotateCcw size={20} /> :
                           <Package size={20} />}
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-all text-right">
                              {t.description?.replace('شراء مكون:', '')?.split('-')?.[0]?.trim() || t.description || 'مكون غير معروف'}
                            </h4>
                            {isRefund && <span className="text-[8px] bg-rose-200 text-rose-700 px-1 rounded font-bold">ارتداد سابق</span>}
                          </div>
                          <div className="flex flex-col text-right">
                            <p className="text-xs font-bold text-slate-400 mt-0.5">المورد: <span className="text-slate-600">{supplier?.company || '---'}</span></p>
                            <p className="text-[10px] text-slate-400 font-bold">{t.date} | {formatCurrency(t.amount * t.exchangeRate)}</p>
                          </div>
                        </div>
                      </div>
                      <ChevronLeft className="text-slate-300 group-hover:text-indigo-600 transition-all" size={20} />
                    </button>
                  );
                });

                return availableItems.length > 0 ? availableItems : (
                  <div className="text-center py-10">
                    <AlertCircle size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">لا توجد عمليات شراء مسجلة لهذا البرنامج</p>
                  </div>
                );
              })()}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button onClick={() => setShowReturnSelectionModal(false)} className="px-6 py-2 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-all">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HajjUmrahView;
