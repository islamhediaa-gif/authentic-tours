
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Plane, X, Printer, Ban, Edit2, Ticket, PlaneTakeoff, Contact2, User, Percent, Undo2, RefreshCw, AlertCircle, Calendar, Layers, Briefcase, Calculator, FileUp, Award } from 'lucide-react';
import { Transaction, Customer, Supplier, Treasury, Currency, Employee, Program, MasterTrip, User as UserType, CostCenter, JournalEntry } from '../types';
import SearchableSelect from './SearchableSelect';
import { compareArabic } from '../utils/arabicUtils';

interface FlightViewProps {
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  addTransaction: (tx: any) => void;
  updateTransaction: (id: string, tx: any) => void;
  deleteTransaction: (id: string) => void;
  customers: Customer[];
  suppliers: Supplier[];
  treasuries: Treasury[];
  currencies: Currency[];
  employees: Employee[];
  programs: Program[];
  masterTrips: MasterTrip[];
  currentUser: UserType;
  searchTerm?: string;
  formatCurrency: (amount: number) => string;
  costCenters: CostCenter[];
  enableCostCenters?: boolean;
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
  settings: any;
}

const FlightView: React.FC<FlightViewProps> = ({ 
  transactions, journalEntries, addTransaction, updateTransaction, 
  deleteTransaction, customers, suppliers, treasuries, currencies, 
  employees, programs, masterTrips, currentUser, searchTerm = '', 
  formatCurrency, costCenters, enableCostCenters, initialEditingId, 
  onClearInitialEdit, settings 
}) => {
  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const otherBalances = useMemo(() => {
    const cust: Record<string, number> = {};
    const supp: Record<string, number> = {};

    (customers || []).forEach(c => {
      if (c?.id) cust[c.id] = c.openingBalanceInBase || 0;
    });
    (suppliers || []).forEach(s => {
      if (s?.id) supp[s.id] = s.openingBalanceInBase || 0;
    });

    (journalEntries || []).forEach(entry => {
      (entry?.lines || []).forEach(line => {
        if (!line) return;
        if (line.accountType === 'CUSTOMER' && line.accountId && cust[line.accountId] !== undefined) {
          cust[line.accountId] += (line.debit || 0) - (line.credit || 0);
        } else if (line.accountType === 'SUPPLIER' && line.accountId && supp[line.accountId] !== undefined) {
          supp[line.accountId] += (line.credit || 0) - (line.debit || 0);
        }
      });
    });

    return { customers: cust, suppliers: supp };
  }, [customers, suppliers, journalEntries]);

  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showSearchPNR, setShowSearchPNR] = useState(false);
  const [searchPNRTerm, setSearchPNRTerm] = useState('');
  const [opMode, setOpMode] = useState<'NEW' | 'REFUND' | 'REISSUE'>('NEW');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentTx, setParentTx] = useState<Transaction | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAirFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target?.result as string) || '';
      parseAirFile(content);
    };
    reader.readAsText(file);
    // Reset file input
    if (event.target) event.target.value = '';
  };

  const parseAirFile = (content: string) => {
    if (!content) return;
    const lines = content.split('\r').join('').split('\n');
    let pnr = '';
    let airlineCode = '';
    let purchasePrice = 0;
    let baseFare = 0;
    let taxes = 0;
    let currencyCode = 'EGP';
    let passengerName = '';
    let ticketNumber = '';
    let segments: string[] = [];

    for (const line of lines) {
      if (!line) continue;
      // PNR: M1 line, columns 3-8
      if (line.startsWith('M1')) {
        pnr = line.substring(2, 8).trim();
      }
      
      // Airline: T-K line, columns 4-5
      if (line.startsWith('T-K')) {
        airlineCode = line.substring(3, 5).trim();
      }

      // Ticket Number: K-T line
      if (line.startsWith('K-T')) {
        ticketNumber = line.substring(3).trim();
      }

      // Segments: T- lines (excluding T-K)
      if (line.startsWith('T-') && !line.startsWith('T-K')) {
        // Look for city codes like CAI, DXB, etc.
        const cities = line.match(/[A-Z]{3}/g);
        if (cities) {
          cities.forEach(city => {
            if (city && !segments.includes(city)) segments.push(city);
          });
        }
      }

      // Passenger Name: N- line
      if (line.startsWith('N-') && !passengerName) {
        passengerName = line.substring(2).trim().split(' ').filter(Boolean).join(' ');
      }

      // Fare: K-F (Base Fare)
      if (line.startsWith('K-F')) {
        const fareStr = line.substring(3).trim();
        const amountMatch = fareStr.match(/([A-Z]{3})?\s*([0-9.]+)/);
        if (amountMatch) {
          if (amountMatch[1]) currencyCode = amountMatch[1];
          baseFare = parseFloat(amountMatch[2]);
        }
      }

      // Total Fare: K-FT (Total Fare includes taxes)
      if (line.startsWith('K-FT')) {
        const fareStr = line.substring(4).trim();
        const amountMatch = fareStr.match(/([A-Z]{3})?\s*([0-9.]+)/);
        if (amountMatch) {
          purchasePrice = parseFloat(amountMatch[2]);
        }
      }

      // Taxes: K-TX
      if (line.startsWith('K-TX')) {
        const taxStr = line.substring(4).trim();
        const amountMatch = taxStr.match(/([A-Z]{3})?\s*([0-9.]+)/);
        if (amountMatch) {
          taxes += parseFloat(amountMatch[2]);
        }
      }
    }

    // If purchasePrice (Total) wasn't found but baseFare + taxes was
    if (purchasePrice === 0 && baseFare > 0) {
      purchasePrice = baseFare + taxes;
    }

    // Try regex for PNR if not found
    if (!pnr) {
      const pnrMatch = content.match(/M1([A-Z0-9]{6})/);
      if (pnrMatch) pnr = pnrMatch[1];
    }

    if (!airlineCode) {
      const airlineMatch = content.match(/T-K([A-Z0-9]{2})/);
      if (airlineMatch) airlineCode = airlineMatch[1];
    }

    // Amadeus often uses "AMD" tags for some data
    const amdPnrMatch = content.match(/AMD\s+([A-Z0-9]{6})/);
    if (amdPnrMatch) pnr = amdPnrMatch[1];

    if (pnr || airlineCode || ticketNumber) {
      setFormData({
        ...formData,
        pnr: pnr || formData.pnr,
        ticketNumber: ticketNumber || formData.ticketNumber,
        passengerName: passengerName || formData.passengerName,
        route: segments.join('-') || formData.route,
        airlineCode: airlineCode || formData.airlineCode,
        purchasePrice: purchasePrice > 0 ? purchasePrice.toString() : formData.purchasePrice,
        sellingPrice: purchasePrice > 0 ? (purchasePrice + 100).toString() : formData.sellingPrice, // Default markup
        currencyCode: currencyCode,
      });
      setOpMode('NEW');
      setShowAdd(true);
    } else {
      alert("تعذر قراءة بيانات تذكرة صالحة من الملف. يرجى التأكد أنه ملف AIR الخاص بـ Amadeus.");
    }
  };

  useEffect(() => {
    if (initialEditingId) {
      const tx = (transactions || []).find(t => t?.id === initialEditingId);
      if (tx) {
        setHighlightedId(tx.id);
        setTimeout(() => {
          const element = document.getElementById(`flight-${tx.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 500);
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, transactions, onClearInitialEdit]);

  const handleRetrievePNR = () => {
    const term = (searchPNRTerm || '').toLowerCase();
    const found = (transactions || []).find(t => 
      t && t.pnr?.toLowerCase() === term && 
      ['FLIGHT', 'FLIGHT_REFUND', 'FLIGHT_REISSUE'].includes(t.category)
    );
    if (found) {
      startRefund(found);
      setShowSearchPNR(false);
      setSearchPNRTerm('');
    } else {
      if (confirm('لم يتم العثور على تذكرة بهذا الرقم في سجلات السنة الحالية. هل تريد فتح نموذج استرجاع يدوي (لتذكرة قديمة)؟')) {
        startManualRefund(searchPNRTerm);
        setShowSearchPNR(false);
        setSearchPNRTerm('');
      }
    }
  };

  const startManualRefund = (pnr: string) => {
    setParentTx(null);
    setOpMode('REFUND');
    setFormData({
      customerId: '',
      supplierId: '',
      supplierType: 'SUPPLIER',
      employeeId: '',
      pnr: (pnr || '').toUpperCase(),
      ticketNumber: '',
      passengerName: '',
      route: '',
      airlineCode: '',
      currencyCode: 'EGP',
      exchangeRate: '1',
      purchasePrice: '',
      sellingPrice: '',
      discount: '0',
      employeeCommissionRate: '',
      commissionAmount: '',
      applyCommission: true,
      date: new Date().toISOString().split('T')[0],
      programId: '',
      componentId: '',
      masterTripId: '',
      costCenterId: ''
    });
    setShowAdd(true);
  };

  const [formData, setFormData] = useState({
    customerId: '',
    supplierId: '',
    supplierType: 'SUPPLIER' as 'SUPPLIER' | 'CUSTOMER' | 'TREASURY',
    employeeId: '',
    pnr: '',
    ticketNumber: '',
    passengerName: '',
    route: '',
    airlineCode: '',
    currencyCode: 'EGP',
    exchangeRate: '1',
    purchasePrice: '',
    sellingPrice: '',
    discount: '0',
    employeeCommissionRate: '',
    commissionAmount: '',
    applyCommission: true,
    date: new Date().toISOString().split('T')[0],
    programId: '',
    componentId: '',
    masterTripId: '',
    costCenterId: ''
  });

  useEffect(() => {
    if (!editingId && opMode === 'NEW') {
      const curr = (currencies || []).find(c => c?.code === formData.currencyCode);
      if (curr) setFormData(prev => ({ ...prev, exchangeRate: (curr.rateToMain || 1).toString() }));
    }
  }, [formData.currencyCode, currencies, editingId, opMode]);

  useEffect(() => {
    if (isBookingEmployee && !formData.employeeId && !editingId && currentUser?.employeeId) {
      setFormData(prev => ({ ...prev, employeeId: currentUser.employeeId || '' }));
    } else if (isBookingEmployee && !formData.employeeId && !editingId) {
      // Fallback: search by name with robust normalization
      const emp = (employees || []).find(e => e && compareArabic(e.name || '', currentUser?.name || ''));
      if (emp) setFormData(prev => ({ ...prev, employeeId: emp.id }));
    }
  }, [isBookingEmployee, currentUser, employees, formData.employeeId, editingId]);

  useEffect(() => {
    if (formData.employeeId && !editingId && !formData.employeeCommissionRate) {
      const emp = (employees || []).find(e => e?.id === formData.employeeId);
      if (emp) setFormData(prev => ({ ...prev, employeeCommissionRate: (emp.commissionRate || 0).toString() }));
    }
  }, [formData.employeeId, employees, editingId]);

  const handleEdit = (tx: Transaction) => {
    setEditingId(tx.id);
    setOpMode('NEW');
    setFormData({
      customerId: tx.relatedEntityId || '',
      supplierId: tx.supplierId || '',
      supplierType: tx.supplierType || 'SUPPLIER',
      employeeId: tx.employeeId || '',
      pnr: tx.pnr || '',
      ticketNumber: tx.ticketNumber || '',
      passengerName: tx.passengerName || '',
      route: tx.route || '',
      airlineCode: tx.airlineCode || '',
      currencyCode: tx.currencyCode || 'EGP',
      exchangeRate: (tx.exchangeRate || 1).toString(),
      purchasePrice: (tx.purchasePrice || 0).toString(),
      sellingPrice: (tx.sellingPrice || 0).toString(),
      discount: (tx.discount || 0).toString(),
      employeeCommissionRate: (tx.employeeCommissionRate || 0).toString(),
      commissionAmount: tx.commissionAmount?.toString() || '',
      applyCommission: tx.applyCommission ?? true,
      date: tx.date,
      programId: tx.programId || '',
      componentId: tx.componentId || '',
      masterTripId: tx.masterTripId || '',
      costCenterId: tx.costCenterId || ''
    });
    setShowAdd(true);
  };

  const startRefund = (tx: Transaction) => {
    setParentTx(tx);
    setOpMode('REFUND');
    setFormData({
      ...formData,
      customerId: tx.relatedEntityId || '',
      supplierId: tx.supplierId || '',
      supplierType: tx.supplierType || 'SUPPLIER',
      pnr: tx.pnr || '',
      ticketNumber: tx.ticketNumber || '',
      passengerName: tx.passengerName || '',
      route: tx.route || '',
      airlineCode: tx.airlineCode || '',
      purchasePrice: tx.purchasePrice?.toString() || '',
      sellingPrice: tx.sellingPrice?.toString() || '',
      discount: (tx.discount || 0).toString(),
      employeeId: tx.employeeId || '',
      employeeCommissionRate: '0',
      commissionAmount: '',
      applyCommission: true,
      programId: tx.programId || '',
      masterTripId: tx.masterTripId || '',
      costCenterId: tx.costCenterId || ''
    });
    setShowAdd(true);
  };

  const startReissue = (tx: Transaction) => {
    setParentTx(tx);
    setOpMode('REISSUE');
    setFormData({
      ...formData,
      customerId: tx.relatedEntityId || '',
      supplierId: tx.supplierId || '',
      supplierType: tx.supplierType || 'SUPPLIER',
      pnr: tx.pnr || '',
      ticketNumber: tx.ticketNumber || '',
      passengerName: tx.passengerName || '',
      route: tx.route || '',
      airlineCode: tx.airlineCode || '',
      purchasePrice: '', // الفروقات
      sellingPrice: '',
      discount: '0',
      employeeId: tx.employeeId || '',
      employeeCommissionRate: tx.employeeCommissionRate?.toString() || '0',
      commissionAmount: '',
      applyCommission: true,
      programId: tx.programId || '',
      masterTripId: tx.masterTripId || '',
      costCenterId: tx.costCenterId || ''
    });
    setShowAdd(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let description = '';
    let category = 'FLIGHT';
    const pnr = (formData.pnr || '').trim().toUpperCase();
    if (opMode === 'REFUND') {
      description = `استرجاع (Refund) - PNR: ${pnr} - ${parentTx ? `الأصل: ${parentTx.id}` : 'تذكرة قديمة'}`;
      category = 'FLIGHT_REFUND';
    } else if (opMode === 'REISSUE') {
      description = `إعادة إصدار (Reissue) - PNR: ${pnr} - الأصل: ${parentTx?.id || 'غير معروف'}`;
      category = 'FLIGHT_REISSUE';
    } else {
      description = `حجز طيران - PNR: ${pnr} (${formData.airlineCode || ''})`;
      category = 'FLIGHT';
    }

    const exchangeRate = parseFloat(formData.exchangeRate || '1') || 1;
    const sellingPrice = parseFloat(formData.sellingPrice || '0') || 0;
    const purchasePrice = parseFloat(formData.purchasePrice || '0') || 0;
    const discount = parseFloat(formData.discount || '0') || 0;
    const commRate = parseFloat(formData.employeeCommissionRate || '0') || 0;
    const commAmount = parseFloat(formData.commissionAmount || '0') || 0;

    const txPayload = {
      description,
      amount: 0,
      currencyCode: formData.currencyCode || (settings?.baseCurrency || 'EGP'),
      exchangeRate,
      type: 'INCOME',
      category,
      date: formData.date || new Date().toISOString().split('T')[0],
      relatedEntityId: formData.customerId,
      relatedEntityType: 'CUSTOMER',
      supplierId: formData.supplierId,
      supplierType: formData.supplierType,
      employeeId: formData.employeeId,
      employeeCommissionRate: commRate,
      commissionAmount: commAmount,
      applyCommission: !!formData.applyCommission,
      pnr,
      ticketNumber: formData.ticketNumber,
      passengerName: formData.passengerName,
      route: formData.route,
      airlineCode: formData.airlineCode,
      purchasePrice,
      sellingPrice,
      discount,
      parentTransactionId: parentTx?.id,
      amountInBase: (sellingPrice - discount) * exchangeRate,
      programId: formData.programId || undefined,
      componentId: formData.componentId || undefined,
      masterTripId: formData.masterTripId || undefined,
      costCenterId: formData.costCenterId || undefined
    };

    if (editingId) updateTransaction(editingId, txPayload);
    else addTransaction(txPayload);
    
    cancelForm();
  };

  const cancelForm = () => {
    setShowAdd(false);
    setEditingId(null);
    setParentTx(null);
    setOpMode('NEW');
    setFormData({ customerId: '', supplierId: '', supplierType: 'SUPPLIER', employeeId: '', pnr: '', ticketNumber: '', passengerName: '', route: '', airlineCode: '', currencyCode: settings?.baseCurrency || 'EGP', exchangeRate: '1', purchasePrice: '', sellingPrice: '', discount: '0', employeeCommissionRate: '', commissionAmount: '', applyCommission: true, date: new Date().toISOString().split('T')[0], programId: '', componentId: '', masterTripId: '', costCenterId: '' });
  };

  const toggleSelectAll = () => {
    const currentFiltered = filtered || [];
    if (selectedIds.length === currentFiltered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentFiltered.map(tx => tx?.id).filter(Boolean) as string[]);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} من العمليات المحددة؟`)) {
      selectedIds.forEach(id => id && deleteTransaction(id));
      setSelectedIds([]);
    }
  };

  const filtered = useMemo(() => {
    return (transactions || [])
      .filter(t => t && ['FLIGHT', 'FLIGHT_REFUND', 'FLIGHT_REISSUE'].includes(t.category))
      .filter(t => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        const customer = (customers || []).find(c => c && c.id === t.relatedEntityId);
        return (
          (t.description || '').toLowerCase().includes(s) ||
          (t.refNo || '').toLowerCase().includes(s) ||
          (t.pnr || '').toLowerCase().includes(s) ||
          (customer?.name || '').toLowerCase().includes(s)
        );
      })
      .sort((a, b) => (b?.date || '').localeCompare(a?.date || ''));
  }, [transactions, searchTerm, customers]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="flex flex-col lg:flex-row justify-between items-center bg-white p-10 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500 bg-opacity-5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="flex items-center gap-8 relative z-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 group-hover:rotate-0 transition-all duration-500">
            <PlaneTakeoff size={40} className="text-white" />
          </div>
          <div>
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">تذاكر الطيران</h2>
            <p className="text-indigo-600 font-bold text-sm uppercase tracking-widest mt-1">إدارة الحجوزات والاسترجاع</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-8 lg:mt-0 relative z-10">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleAirFileUpload} 
            accept=".air,.txt" 
            className="hidden" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-indigo-50 text-indigo-700 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-indigo-100 transition-all active:scale-95 border border-indigo-100 shadow-sm"
          >
            <FileUp size={24}/> استيراد AIR
          </button>
          {selectedIds.length > 0 && currentUser.role === 'ADMIN' && (
            <button 
              onClick={handleBulkDelete}
              className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-lg hover:bg-rose-600 transition-all active:scale-95 h-fit animate-in zoom-in"
            >
              <Ban size={24}/> حذف ({selectedIds.length})
            </button>
          )}
          <div className="flex flex-col gap-2">
            <button onClick={() => setShowSearchPNR(true)} className="bg-slate-100 text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 hover:bg-slate-200 transition-all active:scale-95">
              <RefreshCw size={24} className="text-rose-600"/> استرجاع تذكرة قديمة
            </button>
            <button onClick={() => startManualRefund('')} className="text-slate-400 text-[10px] font-bold flex items-center justify-center gap-2 hover:text-rose-600 transition-all">
               <AlertCircle size={12} /> إضافة يدوية مباشرة بدون بحث
            </button>
          </div>
          <button onClick={() => { setOpMode('NEW'); setShowAdd(true); }} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center gap-3 shadow-lg hover:bg-indigo-700 transition-all active:scale-95 h-fit">
            <Plus size={28}/> إصدار تذكرة جديدة
          </button>
        </div>
      </div>

      {showSearchPNR && (
        <div className="bg-white p-10 rounded-3xl border border-indigo-200 shadow-xl animate-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <Ticket className="text-indigo-600" size={28} /> البحث عن تذكرة برقم الـ PNR
            </h3>
            <button onClick={() => setShowSearchPNR(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-all text-slate-400"><X size={20} /></button>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              className="flex-1 p-5 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-2xl font-bold text-2xl text-center uppercase outline-none transition-all placeholder:text-slate-300"
              placeholder="PNR CODE"
              value={searchPNRTerm}
              onChange={e => setSearchPNRTerm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRetrievePNR()}
            />
            <button onClick={handleRetrievePNR} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-95">
              بحث وجلب البيانات
            </button>
          </div>
        </div>
      )}


      {showAdd && (
        <div className={`bg-white p-10 rounded-3xl border shadow-xl animate-in zoom-in duration-200 ${
          opMode === 'REFUND' ? 'border-rose-200 bg-rose-50 bg-opacity-10' : opMode === 'REISSUE' ? 'border-indigo-200 bg-indigo-50 bg-opacity-10' : 'border-slate-100'
        }`}>
          <div className="mb-8 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className={`w-1.5 h-8 rounded-full ${opMode === 'REFUND' ? 'bg-rose-500' : opMode === 'REISSUE' ? 'bg-indigo-600' : 'bg-indigo-600'}`}></div>
                <h3 className="text-xl font-bold text-slate-900">
                  {opMode === 'REFUND' ? 'عملية استرجاع (Refund)' : opMode === 'REISSUE' ? 'إعادة إصدار (Reissue)' : editingId ? 'تعديل بيانات الحجز' : 'إصدار حجز طيران جديد'}
                </h3>
             </div>
             {parentTx && (
               <div className="bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">مرتبط بالحجز الأصلي</p>
                  <p className="text-xs font-bold text-slate-700">PNR: {parentTx.pnr}</p>
               </div>
             )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">رقم الحجز</label>
                <input required readOnly={opMode !== 'NEW' && parentTx !== null} className={`w-full p-4 border rounded-2xl font-bold text-xl text-center uppercase outline-none transition-all ${ (opMode === 'NEW' || parentTx === null) ? 'bg-slate-50 border-slate-200 focus:border-indigo-600 focus:bg-white' : 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed'}`} placeholder="PNR" value={formData.pnr} onChange={e => setFormData({...formData, pnr: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">كود الطيران</label>
                <input required readOnly={opMode !== 'NEW' && parentTx !== null} className={`w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg text-center text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all ${opMode !== 'NEW' && parentTx !== null ? 'opacity-50' : ''}`} value={formData.airlineCode} onChange={e => setFormData({...formData, airlineCode: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">رقم التذكرة</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg text-center text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.ticketNumber} onChange={e => setFormData({...formData, ticketNumber: e.target.value})} placeholder="Ticket #" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">اسم الراكب</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.passengerName} onChange={e => setFormData({...formData, passengerName: e.target.value})} placeholder="Passenger Name" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">خط السير (Route)</label>
                <input className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-lg text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all" value={formData.route} onChange={e => setFormData({...formData, route: e.target.value})} placeholder="e.g. CAI-DXB-CAI" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">العميل</label>
                <SearchableSelect
                  options={(customers || []).map(c => ({ id: c?.id, name: c?.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency((otherBalances.customers || {})[c?.id || ''] || 0)}` }))}
                  value={formData.customerId}
                  onChange={val => setFormData({...formData, customerId: val})}
                  disabled={opMode !== 'NEW' && parentTx !== null}
                  placeholder="اختر العميل"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">جهة الشراء (الموفر)</label>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg gap-0.5">
                    <button type="button" disabled={opMode !== 'NEW' && parentTx !== null} onClick={() => setFormData({...formData, supplierType: 'SUPPLIER', supplierId: ''})} className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${formData.supplierType === 'SUPPLIER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>مورد</button>
                    <button type="button" disabled={opMode !== 'NEW' && parentTx !== null} onClick={() => setFormData({...formData, supplierType: 'CUSTOMER', supplierId: ''})} className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${formData.supplierType === 'CUSTOMER' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>عميل</button>
                    <button type="button" disabled={opMode !== 'NEW' && parentTx !== null} onClick={() => setFormData({...formData, supplierType: 'TREASURY', supplierId: ''})} className={`px-2 py-0.5 rounded text-[8px] font-bold transition-all ${formData.supplierType === 'TREASURY' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>خزينة</button>
                  </div>
                </div>
                <SearchableSelect
                  options={
                    formData.supplierType === 'SUPPLIER' 
                      ? (suppliers || []).map(s => ({ id: s?.id, name: s?.company || s?.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency((otherBalances.suppliers || {})[s?.id || ''] || 0)}` }))
                      : formData.supplierType === 'CUSTOMER'
                        ? (customers || []).map(c => ({ id: c?.id, name: c?.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency((otherBalances.customers || {})[c?.id || ''] || 0)}` }))
                        : (treasuries || []).map(t => ({ id: t?.id, name: t?.name, subtext: `الرصيد: ${isHidden ? '****' : formatCurrency(t?.balance || 0)}` }))
                  }
                  value={formData.supplierId}
                  onChange={val => setFormData({...formData, supplierId: val})}
                  disabled={opMode !== 'NEW' && parentTx !== null}
                  placeholder={`اختر ${formData.supplierType === 'SUPPLIER' ? 'المورد' : formData.supplierType === 'CUSTOMER' ? 'العميل' : 'الخزينة'}`}
                />
              </div>
              <div className="md:col-span-2 space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Contact2 className="text-indigo-600" size={14} /> الموظف المنفذ للعملية
                </label>
                <SearchableSelect
                  options={(employees || []).map(emp => ({ id: emp?.id, name: emp?.name, subtext: `${emp?.position} (الرصيد: ${isHidden ? '****' : formatCurrency(emp?.balance || 0)})` }))}
                  value={formData.employeeId}
                  onChange={val => {
                    const emp = (employees || []).find(e => e?.id === val);
                    setFormData({
                      ...formData, 
                      employeeId: val,
                      employeeCommissionRate: emp ? (emp.commissionRate || 0).toString() : formData.employeeCommissionRate
                    });
                  }}
                  placeholder="اختر الموظف المسؤول"
                />
              </div>
              <div className="space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Percent className="text-indigo-600" size={14} /> نسبة العمولة %
                </label>
                <input type="number" step="0.1" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 text-center text-lg outline-none transition-all" value={formData.employeeCommissionRate} onChange={e => setFormData({...formData, employeeCommissionRate: e.target.value, commissionAmount: ''})} />
              </div>
              <div className="space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Award className="text-emerald-600" size={14} /> أو مبلغ عمولة محدد
                </label>
                <input type="number" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-emerald-600 text-center text-lg outline-none transition-all" value={formData.commissionAmount} onChange={e => setFormData({...formData, commissionAmount: e.target.value, employeeCommissionRate: ''})} placeholder="مبلغ ثابت" />
              </div>
              <div className="space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Calendar className="text-indigo-600" size={14} /> تاريخ الحركة
                </label>
                <input type="date" required className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 text-center text-lg outline-none transition-all" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>

              {/* Cost Center Selection */}
              {enableCostCenters && (
                <div className="md:col-span-4 space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                    <Layers className="text-indigo-600" size={14} /> مركز التكلفة (Cost Center)
                  </label>
                  <select 
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-900 focus:border-indigo-600 text-center text-lg outline-none transition-all"
                    value={formData.costCenterId}
                    onChange={e => setFormData({...formData, costCenterId: e.target.value})}
                  >
                    <option value="">بدون مركز تكلفة</option>
                    {(costCenters || []).filter(cc => cc && cc.isActive).map(cc => (
                      <option key={cc?.id} value={cc?.id}>{cc?.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Linking to Programs or Master Trips */}
              <div className={`${formData.programId ? 'md:col-span-1' : 'md:col-span-2'} space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100`}>
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Layers className="text-indigo-600" size={14} /> ربط ببرنامج عمرة/حج (اختياري)
                </label>
                <SearchableSelect
                  options={(programs || []).map(p => ({ id: p?.id, name: p?.name, subtext: `${p?.type} - ${p?.date}` }))}
                  value={formData.programId}
                  onChange={val => {
                    const prog = (programs || []).find(p => p?.id === val);
                    const flightComp = (prog?.components || []).find(c => c?.type === 'FLIGHT');
                    setFormData({ 
                      ...formData, 
                      programId: val, 
                      componentId: flightComp?.id || '', 
                      masterTripId: prog?.masterTripId || formData.masterTripId 
                    });
                  }}
                  placeholder="اختر البرنامج"
                />
              </div>

              {formData.programId && (
                <div className="md:col-span-1 space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                     <Ticket className="text-indigo-600" size={14} /> المكون المرتبط (اختياري)
                  </label>
                  <select
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:border-indigo-600 transition-all"
                    value={formData.componentId}
                    onChange={e => setFormData({ ...formData, componentId: e.target.value })}
                  >
                    <option value="">اختر المكون...</option>
                    {((programs || []).find(p => p?.id === formData.programId)?.components || []).map(c => (
                      <option key={c?.id} value={c?.id}>{c?.name} ({c?.type})</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="md:col-span-2 space-y-2 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                   <Briefcase className="text-indigo-600" size={14} /> ربط برحلة مجمعة (Master Trip)
                </label>
                <SearchableSelect
                  options={(masterTrips || []).map(mt => ({ id: mt?.id, name: mt?.name, subtext: `${mt?.type} - ${mt?.date}` }))}
                  value={formData.masterTripId}
                  onChange={val => setFormData({ ...formData, masterTripId: val })}
                  placeholder="اختر الرحلة المجمعة"
                />
              </div>
            </div>

            <div className={`grid grid-cols-1 md:grid-cols-5 gap-6 p-8 rounded-3xl border border-slate-100 bg-slate-50 bg-opacity-50 shadow-sm`}>
              <div className="md:col-span-5 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-100 mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                    <Calculator size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">صافي الربح المتوقع</p>
                    <p className={`text-2xl font-black ${ 
                      (opMode === 'REFUND' 
                        ? parseFloat(formData.purchasePrice || '0') - parseFloat(formData.sellingPrice || '0')
                        : parseFloat(formData.sellingPrice || '0') - parseFloat(formData.discount || '0') - parseFloat(formData.purchasePrice || '0')
                      ) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {formatCurrency(
                        (opMode === 'REFUND' 
                          ? parseFloat(formData.purchasePrice || '0') - parseFloat(formData.sellingPrice || '0')
                          : parseFloat(formData.sellingPrice || '0') - parseFloat(formData.discount || '0') - parseFloat(formData.purchasePrice || '0')
                        ) * parseFloat(formData.exchangeRate || '1')
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                  <input 
                    type="checkbox" 
                    id="applyCommission"
                    className="w-5 h-5 accent-indigo-600 rounded"
                    checked={formData.applyCommission}
                    onChange={e => setFormData({...formData, applyCommission: e.target.checked})}
                  />
                  <label htmlFor="applyCommission" className="text-sm font-bold text-slate-700 cursor-pointer">
                    ترحيل العمولة لحساب الموظف تلقائياً
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase text-center block ${opMode === 'REFUND' ? 'text-rose-600' : 'text-slate-500'}`}>
                   {opMode === 'REFUND' ? 'المسترد من المورد' : opMode === 'REISSUE' ? 'فرق التكلفة للمورد' : 'سعر الشراء (التكلفة)'}
                </label>
                <input type="number" required className="w-full p-4 bg-rose-50 border border-rose-100 rounded-2xl font-bold text-2xl text-center text-rose-700 outline-none focus:border-rose-300 focus:bg-white transition-all" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className={`text-xs font-bold uppercase text-center block ${opMode === 'REFUND' ? 'text-rose-600' : 'text-emerald-600'}`}>
                   {opMode === 'REFUND' ? 'المبلغ للعميل' : opMode === 'REISSUE' ? 'فرق السعر على العميل' : 'سعر البيع للعميل'}
                </label>
                <input type="number" required className="w-full p-4 bg-emerald-50 border border-emerald-100 rounded-2xl font-bold text-2xl text-center text-emerald-700 outline-none focus:border-emerald-300 focus:bg-white transition-all" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-rose-600 uppercase text-center block">خصم مسموح به</label>
                <input type="number" className="w-full p-4 bg-rose-50 border border-rose-100 rounded-2xl font-bold text-2xl text-center text-rose-700 outline-none focus:border-rose-300 focus:bg-white transition-all" value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase text-center block">العملة</label>
                <select className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xl text-center text-slate-900 outline-none focus:border-indigo-600 transition-all" value={formData.currencyCode} onChange={e => {
                  const code = e.target.value;
                  const rate = (currencies || []).find(c => c?.code === code)?.rateToMain || 1;
                  setFormData({...formData, currencyCode: code, exchangeRate: rate.toString()});
                }}>
                  {(currencies || []).map(c => <option key={c?.code} value={c?.code}>{c?.code}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase text-center block">سعر الصرف</label>
                <input 
                  type="number" 
                  step="any"
                  disabled={formData.currencyCode === (settings?.baseCurrency || 'EGP')}
                  className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-xl text-center text-slate-900 outline-none focus:border-indigo-600 transition-all disabled:opacity-50" 
                  value={formData.currencyCode === (settings?.baseCurrency || 'EGP') ? '1' : formData.exchangeRate} 
                  onChange={e => setFormData({...formData, exchangeRate: e.target.value})} 
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className={`w-full py-5 rounded-2xl font-bold text-xl shadow-lg transition-all active:scale-95 ${
                  opMode === 'REFUND' ? 'bg-rose-600 text-white hover:bg-rose-700' : opMode === 'REISSUE' ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}>
                  {opMode === 'REFUND' ? 'تأكيد الاسترجاع' : opMode === 'REISSUE' ? 'حفظ إعادة الإصدار' : 'حفظ الحجز الآن'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-indigo-600 text-white">
              <th className="px-6 py-5 border-b border-white border-opacity-20 text-center w-12">
                <input 
                  type="checkbox" 
                  className="w-5 h-5 accent-white rounded cursor-pointer"
                  checked={filtered.length > 0 && selectedIds.length === filtered.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-5 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white border-opacity-20">البيان / PNR</th>
              <th className="px-6 py-5 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white border-opacity-20">العميل المرتبط</th>
              <th className="px-6 py-5 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white border-opacity-20">المنفذ / العمولة</th>
              <th className="px-6 py-5 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white border-opacity-20 text-center">التكلفة</th>
              <th className="px-6 py-5 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white border-opacity-20 text-center">سعر البيع</th>
              <th className="px-6 py-5 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white border-opacity-20 text-center">صافي الربح</th>
              <th className="px-6 py-5 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-white border-opacity-20 text-center">التحكم</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(tx => (
              <tr 
                key={tx.id} 
                id={`flight-${tx.id}`}
                className={`hover:bg-slate-50 bg-opacity-50 transition-all group duration-300 ${highlightedId === tx.id ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/30 scale-[1.002] z-10 shadow-2xl' : tx.category === 'FLIGHT_REFUND' ? 'bg-rose-50 bg-opacity-10' : tx.category === 'FLIGHT_REISSUE' ? 'bg-amber-50 bg-opacity-10' : ''}`}
              >
                <td className="px-6 py-5 text-center">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                    checked={selectedIds.includes(tx.id)}
                    onChange={() => toggleSelect(tx.id)}
                  />
                </td>
                <td className="px-6 py-5">
                   <div className="flex flex-col">
                      <span className="text-slate-900 font-bold text-lg uppercase flex items-center gap-2 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {tx?.category === 'FLIGHT_REFUND' && <Undo2 size={16} className="text-rose-500" />}
                        {tx?.category === 'FLIGHT_REISSUE' && <RefreshCw size={16} className="text-amber-500" />}
                        {tx?.pnr || '---'}
                      </span>
                      {tx?.passengerName && (
                        <span className="text-[10px] font-bold text-slate-500 mt-1 flex items-center gap-1">
                          <User size={10} className="text-indigo-400" /> {tx.passengerName}
                        </span>
                      )}
                      {tx?.ticketNumber && (
                        <span className="text-[9px] font-bold text-slate-400 font-mono flex items-center gap-1">
                          <Ticket size={10} className="text-indigo-300" /> {tx.ticketNumber}
                        </span>
                      )}
                      {tx?.route && (
                        <span className="text-[9px] font-bold text-indigo-400 flex items-center gap-1 mt-0.5">
                          <PlaneTakeoff size={10} /> {tx.route}
                        </span>
                      )}
                      {tx?.refNo ? (
                        <button
                          onClick={() => {
                            if (tx?.refNo) navigator.clipboard.writeText(tx.refNo);
                            const btn = document.getElementById(`ref-fl-${tx?.id}`);
                            if (btn) {
                              const originalText = btn.innerText;
                              btn.innerText = 'تم النسخ';
                              setTimeout(() => { btn.innerText = originalText; }, 1000);
                            }
                          }}
                          id={`ref-fl-${tx?.id}`}
                          className="text-[9px] text-indigo-600 font-bold uppercase tracking-tighter hover:text-indigo-800 transition-all"
                          title="اضغط للنسخ والبحث"
                        >
                          REF: #{tx.refNo}
                        </button>
                      ) : (
                        <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-tighter">
                          REF: #{(tx?.id || '').slice(-6).toUpperCase()}
                        </span>
                      )}
                      <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-tighter">
                         | {(tx?.description || '').split(' - ')[0]}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-5">
                   <span className="text-slate-700 font-bold text-sm">
                      {(customers || []).find(c => c?.id === tx?.relatedEntityId)?.name || '---'}
                   </span>
                </td>
                <td className="px-6 py-5">
                   <div className="flex flex-col gap-1.5">
                      <span className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-200 transition-all">
                          <User size={12} className="text-indigo-600" />
                          {(employees || []).find(e => e?.id === tx?.employeeId)?.name || '---'}
                      </span>
                      <div className="flex items-center gap-1.5 px-1">
                         <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></div>
                         <span className="text-[9px] text-indigo-600 font-bold uppercase">العمولة: {isHidden ? '****' : (tx.employeeCommissionRate || 0)}%</span>
                      </div>
                   </div>
                </td>
                <td className={`px-6 py-5 text-center font-bold text-base tabular-nums ${tx.category === 'FLIGHT_REFUND' ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {tx.category === 'FLIGHT_REFUND' ? '+' : '-'}{shouldMaskAggregate ? '****' : formatCurrency((tx.purchasePrice || 0) * (tx.exchangeRate || 1))}
                </td>
                <td className={`px-6 py-5 text-center font-bold text-base tabular-nums ${tx.category === 'FLIGHT_REFUND' ? 'text-rose-600' : 'text-emerald-600'}`}>
                   {tx.category === 'FLIGHT_REFUND' ? '-' : '+'}{isHidden ? '****' : formatCurrency((tx.sellingPrice || 0) * (tx.exchangeRate || 1))}
                </td>
                <td className="px-6 py-5 text-center">
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 group-hover:bg-white transition-all">
                      <span className="font-bold text-xl text-slate-900 tabular-nums">
                        {shouldMaskAggregate ? '****' : formatCurrency(((tx.category === 'FLIGHT_REFUND' ? (tx.purchasePrice || 0) - (tx.sellingPrice || 0) : (tx.sellingPrice || 0) - (tx.purchasePrice || 0))) * (tx.exchangeRate || 1))}
                      </span>
                   </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex justify-center gap-2">
                    {tx.category === 'FLIGHT' && (
                      <>
                        <button onClick={() => startRefund(tx)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90" title="استرجاع (Refund)"><Undo2 size={18}/></button>
                        <button onClick={() => startReissue(tx)} className="p-2.5 bg-amber-50 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all active:scale-90" title="إعادة إصدار (Reissue)"><RefreshCw size={18}/></button>
                      </>
                    )}
                    <button onClick={() => handleEdit(tx)} className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white transition-all active:scale-90"><Edit2 size={18}/></button>
                    {currentUser.role === 'ADMIN' && (
                      <button onClick={() => deleteTransaction(tx.id)} className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all active:scale-90"><Ban size={18}/></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FlightView;
