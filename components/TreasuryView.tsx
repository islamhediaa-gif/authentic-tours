
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle,
  Plus, 
  Trash2, 
  Edit2,
  Printer, 
  Settings, 
  X, 
  Receipt,
  FileText,
  Coins,
  History,
  AlertTriangle,
  Landmark,
  CreditCard,
  User,
  Truck,
  Save,
  ArrowLeftRight
} from 'lucide-react';
import { Transaction, TransactionType, Treasury, Customer, Supplier, ServiceType, Currency, CompanySettings, Employee, User as UserType, Partner, CostCenter, JournalEntry, MasterTrip, Program } from '../types';
import SearchableSelect from './SearchableSelect';
import { normalizeArabic } from '../utils/arabicUtils';

interface TreasuryViewProps {
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  addTransaction: (tx: any) => void;
  updateTransaction: (id: string, tx: any) => void;
  deleteTransaction: (id: string) => void;
  deleteTreasury: (id: string) => void;
  treasuries: Treasury[];
  setTreasuries: React.Dispatch<React.SetStateAction<Treasury[]>>;
  customers: Customer[];
  suppliers: Supplier[];
  partners: Partner[];
  currencies: Currency[];
  settings: CompanySettings;
  employees: Employee[];
  currentUser: UserType;
  searchTerm?: string;
  formatCurrency: (amount: number) => string;
  costCenters: CostCenter[];
  masterTrips: MasterTrip[];
  programs: Program[];
  addAuditLog: (action: any, entityType: any, entityId: string, details: string, oldV?: any, newV?: any) => void;
  enableCostCenters?: boolean;
  initialEditingId?: string | null;
  onClearInitialEdit?: () => void;
}

type VoucherType = 'RECEIPT_CUST' | 'PAYMENT_SUPP' | 'REFUND_CUST' | 'MISC_EXPENSE' | 'PAYMENT_EMP' | 'PARTNER_WITHDRAWAL' | 'TRANSFER';

const TreasuryView: React.FC<TreasuryViewProps> = ({ 
  transactions, 
  journalEntries,
  addTransaction, 
  updateTransaction,
  deleteTransaction, 
  deleteTreasury,
  treasuries, 
  setTreasuries,
  customers,
  suppliers,
  partners,
  currencies,
  settings,
  employees,
  currentUser,
  searchTerm = '',
  formatCurrency,
  costCenters,
  masterTrips,
  programs,
  addAuditLog,
  enableCostCenters,
  initialEditingId,
  onClearInitialEdit
}) => {
  const [activeTab, setActiveTab] = useState<'OPERATIONS' | 'MANAGE' | 'HISTORY'>('OPERATIONS');
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [showTreasuryForm, setShowTreasuryForm] = useState(false);
  const [editingTreasuryId, setEditingTreasuryId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialEditingId) {
      const tx = (transactions || []).find(t => t && t.id === initialEditingId);
      if (tx) {
        setActiveTab('HISTORY');
        setHighlightedId(tx.id);
        setTimeout(() => {
          const element = document.getElementById(`transaction-${tx.id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(() => setHighlightedId(null), 3000);
          }
        }, 500);
      }
      onClearInitialEdit?.();
    }
  }, [initialEditingId, transactions, onClearInitialEdit]);

  const isHidden = currentUser?.permissions?.includes('HIDE_FINANCIAL_AMOUNTS');
  const isBookingEmployee = currentUser?.role === 'BOOKING_EMPLOYEE';
  const shouldMaskAggregate = isHidden || isBookingEmployee;

  const calculatedBalances = useMemo(() => {
    const balances: Record<string, number> = {};
    (treasuries || []).forEach(t => {
      if (t && t.id) {
        balances[t.id] = t.openingBalance || 0;
      }
    });

    (journalEntries || []).forEach(entry => {
      (entry?.lines || []).forEach(line => {
        if (line && line.accountType === 'TREASURY' && line.accountId && balances[line.accountId] !== undefined) {
          const debit = typeof line.debit === 'number' ? line.debit : parseFloat(line.debit as any) || 0;
          const credit = typeof line.credit === 'number' ? line.credit : parseFloat(line.credit as any) || 0;
          balances[line.accountId] += debit - credit;
        }
      });
    });
    return balances;
  }, [treasuries, journalEntries]);

  const otherBalances = useMemo(() => {
    const cust: Record<string, number> = {};
    const supp: Record<string, number> = {};
    const emp: Record<string, number> = {};
    const part: Record<string, number> = {};

    (customers || []).forEach(c => { if (c && c.id) cust[c.id] = c.openingBalanceInBase || 0; });
    (suppliers || []).forEach(s => { if (s && s.id) supp[s.id] = s.openingBalanceInBase || 0; });
    (employees || []).forEach(e => { if (e && e.id) emp[e.id] = e.openingBalance || 0; });
    (partners || []).forEach(p => { if (p && p.id) part[p.id] = p.openingBalance || 0; });

    (journalEntries || []).forEach(entry => {
      (entry?.lines || []).forEach(line => {
        if (!line || !line.accountId) return;
        const debit = typeof line.debit === 'number' ? line.debit : parseFloat(line.debit as any) || 0;
        const credit = typeof line.credit === 'number' ? line.credit : parseFloat(line.credit as any) || 0;
        
        if (line.accountType === 'CUSTOMER' && cust[line.accountId] !== undefined) {
          cust[line.accountId] += debit - credit;
        } else if (line.accountType === 'SUPPLIER' && supp[line.accountId] !== undefined) {
          supp[line.accountId] += credit - debit;
        } else if (line.accountType === 'EMPLOYEE_ADVANCE' && emp[line.accountId] !== undefined) {
          emp[line.accountId] += debit - credit;
        } else if (line.accountType === 'PARTNER' && part[line.accountId] !== undefined) {
          part[line.accountId] += credit - debit;
        }
      });
    });

    return { customers: cust, suppliers: supp, employees: emp, partners: part };
  }, [customers, suppliers, employees, partners, journalEntries]);

  const stats = useMemo(() => {
    const cash = (treasuries || []).filter(t => t && t.type === 'CASH').reduce((s, t) => s + (calculatedBalances[t.id] || 0), 0);
    const bank = (treasuries || []).filter(t => t && t.type === 'BANK').reduce((s, t) => s + (calculatedBalances[t.id] || 0), 0);
    const wallet = (treasuries || []).filter(t => t && t.type === 'WALLET').reduce((s, t) => s + (calculatedBalances[t.id] || 0), 0);
    const today = new Date().toISOString().split('T')[0];
    const incomeToday = (transactions || []).filter(t => t && t.date === today && t.type === 'INCOME' && !!t.treasuryId).reduce((s, t) => s + (t.amountInBase || 0), 0);
    return { cash, bank, wallet, incomeToday };
  }, [treasuries, transactions, calculatedBalances]);

  const sortedTreasuries = useMemo(() => {
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

    return [...(treasuries || [])].sort((a, b) => {
      const normA = normalizeArabic(a?.name || '');
      const normB = normalizeArabic(b?.name || '');
      const indexA = preferredOrder.indexOf(normA);
      const indexB = preferredOrder.indexOf(normB);
      if (indexA === -1 && indexB === -1) return normA.localeCompare(normB);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [treasuries]);

  const [voucherData, setVoucherData] = useState({
    type: 'RECEIPT_CUST' as VoucherType,
    description: '',
    amount: '',
    currencyCode: settings.baseCurrency,
    exchangeRate: '',
    treasuryId: (sortedTreasuries || [])[0]?.id || '',
    relatedEntityId: '',
    date: new Date().toISOString().split('T')[0],
    costCenterId: '',
    programId: '',
    componentId: ''
  });

  const [treasuryFormData, setTreasuryFormData] = useState({
    name: '',
    type: 'CASH' as 'CASH' | 'BANK' | 'WALLET' | 'CUSTODY',
    openingBalance: '0',
    currencyCode: settings.baseCurrency,
    exchangeRate: '1'
  });

  const selectedCurrency = (currencies || []).find(c => c.code === voucherData.currencyCode);

  const handleVoucherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(voucherData.amount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    let txType: TransactionType = 'INCOME';
    let txCategory: ServiceType = 'CASH';
    let relType: 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'PARTNER' | undefined = undefined;
    let finalDesc = voucherData.description || '';

    switch(voucherData.type) {
      case 'RECEIPT_CUST':
        txType = 'INCOME';
        relType = 'CUSTOMER';
        finalDesc = `سند قبض من عميل: ${(customers || []).find(c => c && c.id === voucherData.relatedEntityId)?.name || 'غير معروف'} - ${voucherData.description || ''}`;
        break;
      case 'PAYMENT_SUPP':
        txType = 'EXPENSE';
        relType = 'SUPPLIER';
        finalDesc = `سند صرف لمورد: ${(suppliers || []).find(s => s && s.id === voucherData.relatedEntityId)?.company || 'غير معروف'} - ${voucherData.description || ''}`;
        break;
      case 'PAYMENT_EMP':
        txType = 'EXPENSE';
        relType = 'EMPLOYEE';
        finalDesc = `سداد مستحقات موظف: ${(employees || []).find(e => e && e.id === voucherData.relatedEntityId)?.name || 'غير معروف'} - ${voucherData.description || ''}`;
        break;
      case 'REFUND_CUST':
        txType = 'EXPENSE';
        relType = 'CUSTOMER';
        finalDesc = `رد نقدية لعميل: ${(customers || []).find(c => c && c.id === voucherData.relatedEntityId)?.name || 'غير معروف'} - ${voucherData.description || ''}`;
        break;
      case 'PARTNER_WITHDRAWAL':
        txType = 'PARTNER_WITHDRAWAL';
        txCategory = 'PARTNER_WITHDRAWAL';
        relType = 'PARTNER';
        finalDesc = `مسحوبات شريك: ${(partners || []).find(p => p && p.id === voucherData.relatedEntityId)?.name || 'غير معروف'} - ${voucherData.description || ''}`;
        break;
      case 'MISC_EXPENSE':
        txType = 'EXPENSE';
        txCategory = 'EXPENSE_GEN';
        finalDesc = `مصروف نثري: ${voucherData.description || ''}`;
        break;
      case 'TRANSFER':
        txType = 'TRANSFER';
        txCategory = 'TRANSFER';
        const fromT = (treasuries || []).find(t => t && t.id === voucherData.treasuryId)?.name || 'غير معروف';
        const toT = (treasuries || []).find(t => t && t.id === voucherData.relatedEntityId)?.name || 'غير معروف';
        finalDesc = `تحويل نقدية من ${fromT} إلى ${toT} - ${voucherData.description || ''}`;
        break;
    }

    const isMasterTrip = (masterTrips || []).some(mt => mt && mt.id === voucherData.costCenterId);
    
    const payload = {
      description: finalDesc,
      amount: amountNum,
      currencyCode: voucherData.currencyCode || settings.baseCurrency,
      exchangeRate: parseFloat(voucherData.exchangeRate) || 1,
      type: txType,
      date: voucherData.date || new Date().toISOString().split('T')[0],
      category: txCategory,
      treasuryId: voucherData.treasuryId,
      relatedEntityId: voucherData.type === 'TRANSFER' ? undefined : (voucherData.relatedEntityId || undefined),
      targetEntityId: voucherData.type === 'TRANSFER' ? voucherData.relatedEntityId : undefined,
      relatedEntityType: relType,
      expenseCategory: voucherData.type === 'MISC_EXPENSE' ? 'نثريات' : undefined,
      costCenterId: voucherData.costCenterId || undefined,
      masterTripId: isMasterTrip ? voucherData.costCenterId : undefined,
      programId: voucherData.programId || undefined,
      componentId: voucherData.componentId || undefined
    };

    if (editingTransactionId) {
      updateTransaction(editingTransactionId, payload);
    } else {
      addTransaction(payload);
    }

    setVoucherData({ ...voucherData, description: '', amount: '', relatedEntityId: '', programId: '', componentId: '' });
    setShowVoucherForm(false);
    setEditingTransactionId(null);
  };

  const startEditTransaction = (tx: Transaction) => {
    if (!tx) return;
    setEditingTransactionId(tx.id);
    let vType: VoucherType = 'MISC_EXPENSE';
    if (tx.category === 'PARTNER_WITHDRAWAL') vType = 'PARTNER_WITHDRAWAL';
    else if (tx.relatedEntityType === 'CUSTOMER' && tx.type === 'INCOME') vType = 'RECEIPT_CUST';
    else if (tx.relatedEntityType === 'SUPPLIER') vType = 'PAYMENT_SUPP';
    else if (tx.relatedEntityType === 'EMPLOYEE') vType = 'PAYMENT_EMP';
    else if (tx.relatedEntityType === 'CUSTOMER' && tx.type === 'EXPENSE') vType = 'REFUND_CUST';
    else if (tx.type === 'TRANSFER') vType = 'TRANSFER';

    setVoucherData({
      type: vType,
      description: (tx.description || '').includes(' - ') ? tx.description.split(' - ')[1] : (tx.description || ''),
      amount: (tx.amount || 0).toString(),
      currencyCode: tx.currencyCode || settings.baseCurrency,
      exchangeRate: tx.exchangeRate?.toString() || '1',
      treasuryId: tx.treasuryId || '',
      relatedEntityId: tx.type === 'TRANSFER' ? (tx.targetEntityId || '') : (tx.relatedEntityId || ''),
      date: tx.date || new Date().toISOString().split('T')[0],
      costCenterId: tx.costCenterId || '',
      programId: tx.programId || '',
      componentId: tx.componentId || ''
    });
    setShowVoucherForm(true);
  };

  const handleTreasurySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ob = parseFloat(treasuryFormData.openingBalance) || 0;
    const er = parseFloat(treasuryFormData.exchangeRate) || 1;

    if (editingTreasuryId) {
      const oldT = (treasuries || []).find(t => t && t.id === editingTreasuryId);
      if (!oldT) return;
      const updatedT = {
        ...oldT,
        name: treasuryFormData.name || 'خزينة بدون اسم',
        type: treasuryFormData.type || 'CASH',
        openingBalance: ob,
        currencyCode: treasuryFormData.currencyCode || settings.baseCurrency,
        exchangeRate: er,
        balance: (oldT.balance || 0) - (oldT.openingBalance || 0) + ob
      };
      setTreasuries(prev => (prev || []).map(t => t && t.id === editingTreasuryId ? updatedT : t));
      addAuditLog('UPDATE', 'SETTINGS', editingTreasuryId, `تعديل بيانات الخزينة: ${updatedT.name}`, oldT, updatedT);
    } else {
      const newT: Treasury = {
        id: Date.now().toString(),
        name: treasuryFormData.name || 'خزينة جديدة',
        type: treasuryFormData.type || 'CASH',
        openingBalance: ob,
        currencyCode: treasuryFormData.currencyCode || settings.baseCurrency,
        exchangeRate: er,
        balance: ob
      };
      setTreasuries(prev => [...(prev || []), newT]);
      addAuditLog('CREATE', 'SETTINGS', newT.id, `إضافة خزينة جديدة: ${newT.name}`, undefined, newT);
    }
    setTreasuryFormData({ name: '', type: 'CASH', openingBalance: '0', currencyCode: settings.baseCurrency, exchangeRate: '1' });
    setShowTreasuryForm(false);
    setEditingTreasuryId(null);
  };

  const startEditTreasury = (t: Treasury) => {
    if (!t) return;
    setEditingTreasuryId(t.id);
    setTreasuryFormData({
      name: t.name || '',
      type: t.type || 'CASH',
      openingBalance: (t.openingBalance || 0).toString(),
      currencyCode: t.currencyCode || settings.baseCurrency,
      exchangeRate: (t.exchangeRate || 1).toString()
    });
    setShowTreasuryForm(true);
  };

  const startSettleCustody = (t: Treasury) => {
    if (!t) return;
    setActiveTab('OPERATIONS');
    setShowVoucherForm(true);
    setVoucherData({
      type: 'TRANSFER',
      description: `تسوية عهدة: ${t.name || 'غير معروف'}`,
      amount: Math.abs(calculatedBalances[t.id] || 0).toString(),
      currencyCode: t.currencyCode || settings.baseCurrency,
      exchangeRate: (t.exchangeRate || 1).toString(),
      treasuryId: t.id,
      relatedEntityId: (treasuries || []).find(x => x && x.type === 'CASH')?.id || '',
      date: new Date().toISOString().split('T')[0],
      costCenterId: '',
      programId: '',
      componentId: ''
    });
  };


  const handlePrint = (tx: Transaction) => {
    if (!tx) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('يرجى السماح بالنوافذ المنبثقة للطباعة');
      return;
    }

    const voucherContent = `
      <div class="voucher">
        <div class="header">
          <div>
            <h1 style="margin:0; color:#1e1b4b;">${settings?.name || 'الشركة'}</h1>
            <p style="margin:5px 0; color:#64748b; font-weight:bold;">إدارة الحسابات والشؤون المالية</p>
          </div>
          <div style="text-align: left;">
            <p style="margin:0;">التاريخ: ${tx.date || ''}</p>
            <p style="margin:5px 0;">رقم السند: <span style="font-family:monospace; font-weight:bold;">#${tx.refNo || (tx.id || '').slice(-6).toUpperCase()}</span></p>
          </div>
        </div>
        
        <div class="content">
          <div className="title-container" style="margin-bottom: 20px;">
            <h2 style="display:inline-block; border-bottom: 4px solid ${tx.type === 'INCOME' ? '#10b981' : '#f43f5e'}; padding-bottom: 5px; margin: 0;">سند ${tx.type === 'INCOME' ? 'قبض نقدية' : 'صرف نقدية'}</h2>
          </div>
          
          <div class="amount-box">
            <span style="font-size: 14px; color: #64748b;">المبلغ:</span>
            <span style="font-size: 28px; font-weight: 900;">${isHidden ? '****' : (tx.amount || 0).toLocaleString()} ${tx.currencyCode || ''}</span>
          </div>

          <div class="details-grid">
            <div class="row">
              <span class="label">يصرف لـ / يستلم من:</span>
              <span class="value">${(tx.description || '').split(':')[1] || '____________________'}</span>
            </div>
            <div class="row">
              <span class="label">وذلك عن:</span>
              <span class="value">${(tx.description || '').split(':')[0] || tx.description || ''}</span>
            </div>
            <div class="row">
              <span class="label">طريقة السداد:</span>
              <span class="value">${(treasuries || []).find(t => t && t.id === tx.treasuryId)?.name || 'نقدًا'}</span>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="signature-box">
            <p style="margin: 0 0 10px 0;">توقيع المستلم</p>
            <p style="font-weight:bold; margin:5px 0 0 0;">${currentUser?.role === 'ADMIN' ? 'إسلام حامد' : (currentUser?.name || '____________________')}</p>
            <div style="margin-top:10px; border-bottom: 1px solid #000; width: 150px; margin-right: auto; margin-left: auto;"></div>
          </div>
          <div class="signature-box">
            <p style="margin: 0 0 10px 0;">المحاسب</p>
            <p style="font-weight:bold; margin:5px 0 0 0;">إسلام حامد</p>
            <div style="margin-top:10px; border-bottom: 1px solid #000; width: 150px; margin-right: auto; margin-left: auto;"></div>
          </div>
        </div>

        <div class="disclaimer">
          * يعتبر هذا الإيصال ملغياً بمجرد تقديم الخدمة المتفق عليها، ولا يعتد به في أي مطالبات أخرى خارج نطاق هذا السند.
        </div>
        <div class="copy-label">__COPY_TYPE__</div>
      </div>
    `;

    const html = `
      <html dir="rtl">
        <head>
          <title>سند مالي - ${tx.id}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            @media print {
              @page { size: A4; margin: 0; }
              html, body { height: 100%; margin: 0 !important; padding: 0 !important; overflow: hidden; }
              .page-container { 
                width: 210mm;
                height: 297mm; 
                padding: 10mm 5mm !important; 
                gap: 0; 
                display: flex;
                flex-direction: column;
                justify-content: flex-start;
                box-sizing: border-box;
                overflow: hidden;
              }
              .voucher { 
                height: 130mm !important; 
                max-height: 130mm !important;
                border: 1.5px solid #cbd5e1 !important;
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
                padding: 10px !important;
                margin-bottom: 2mm !important;
                box-sizing: border-box !important;
              }
              .divider { 
                height: 10mm;
                margin: 0 !important; 
                padding: 0 !important; 
                border: none !important;
                border-top: 1.5px dashed #94a3b8 !important;
                position: relative;
                page-break-inside: avoid !important;
              }
              .divider::after {
                top: -8px !important;
                background: white !important;
                font-size: 9px !important;
              }
              .amount-box { margin-bottom: 5px !important; padding: 5px 15px !important; }
              .title-container { margin-bottom: 5px !important; }
              .details-grid { margin-top: 5px !important; }
              .row { margin-bottom: 5px !important; padding-bottom: 3px !important; }
              .footer { margin-top: 10px !important; }
              .disclaimer { margin-top: 5px !important; padding: 3px !important; font-size: 9px !important; }
              h1 { font-size: 18px !important; margin-bottom: 2px !important; }
              h2 { font-size: 16px !important; }
              p { font-size: 11px !important; }
              .amount-box span:last-child { font-size: 20px !important; }
            }
            body { 
              font-family: 'Cairo', sans-serif; 
              margin: 0; 
              padding: 20px;
              background: #f1f5f9;
            }
            .page-container {
              width: 210mm;
              margin: 0 auto;
              background: white;
              padding: 10mm;
              box-sizing: border-box;
              min-height: 297mm;
              display: flex;
              flex-direction: column;
              gap: 10px;
              box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .voucher {
              border: 2px solid #e2e8f0;
              padding: 25px;
              position: relative;
              background: #fff;
              border-radius: 10px;
              flex: 1;
              max-height: 130mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
            .amount-box { 
              background: #f8fafc;
              border: 2px solid #1e1b4b;
              padding: 12px 25px;
              display: inline-flex;
              align-items: center;
              gap: 20px;
              border-radius: 15px;
              margin-bottom: 20px;
            }
            .details-grid { margin-top: 10px; }
            .row { display: flex; margin-bottom: 12px; border-bottom: 1px dotted #cbd5e1; padding-bottom: 6px; }
            .label { font-weight: 900; color: #475569; min-width: 150px; font-size: 13px; }
            .value { font-weight: 700; color: #1e1b4b; font-size: 15px; flex: 1; }
            .footer { display: flex; justify-content: space-between; margin-top: 30px; text-align: center; }
            .signature-box { flex: 1; }
            .disclaimer { 
              margin-top: 20px; 
              font-size: 10px; 
              color: #64748b; 
              text-align: center; 
              font-weight: bold;
              padding: 8px;
              background: #f8fafc;
              border-radius: 8px;
            }
            .copy-label {
              position: absolute;
              top: 10px;
              left: 10px;
              background: #1e1b4b;
              color: #f59e0b;
              padding: 4px 12px;
              border-radius: 5px;
              font-size: 10px;
              font-weight: 900;
              transform: rotate(-5deg);
            }
            .divider {
              border-top: 2px dashed #94a3b8;
              margin: 15px 0;
              padding: 10px 0;
              position: relative;
            }
            .divider::after {
              content: '✂ قـص هـنـا لـفـصـل الـنـسـخ';
              position: absolute;
              top: -10px;
              left: 50%;
              transform: translateX(-50%);
              background: white;
              padding: 0 20px;
              font-size: 10px;
              color: #94a3b8;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="page-container">
            ${voucherContent.replace('__COPY_TYPE__', 'نسخة الحسابات')}
            <div class="divider"></div>
            ${voucherContent.replace('__COPY_TYPE__', 'نسخة العميل')}
          </div>
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 500);
            }
          </script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredHistory = useMemo(() => {
    return (transactions || [])
      .filter(t => t && !!t.treasuryId && t.category !== 'ACCOUNT_CLEARING')
      .filter(t => {
        if (!searchTerm) return true;
        const s = searchTerm.toLowerCase();
        return (t.description || '').toLowerCase().includes(s) || (t.refNo || '').toLowerCase().includes(s);
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [transactions, searchTerm]);

  const toggleSelectAll = () => {
    const history = filteredHistory || [];
    if (selectedIds.length === history.length && history.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(history.map(tx => tx.id).filter(id => !!id));
    }
  };

  const toggleSelect = (id: string) => {
    if (!id) return;
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} من السندات المختارة؟`)) {
      selectedIds.forEach(id => deleteTransaction(id));
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 no-print">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Coins size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي النقدية</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(stats.cash || 0)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <Landmark size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">إجمالي البنوك</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{shouldMaskAggregate ? '****' : formatCurrency(stats.bank || 0)}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-md">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">المحافظ الإلكترونية</p>
            <p className="text-2xl font-bold text-slate-900 tracking-tight">{shouldMaskAggregate ? '****' : (stats.wallet || 0).toLocaleString()} <span className="text-[10px] font-bold text-slate-300">{settings.baseCurrency}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all duration-300">
          <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-2xl flex items-center justify-center shadow-md">
            <ArrowUpCircle size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">تحصيلات اليوم</p>
            <p className="text-2xl font-bold text-emerald-600 tracking-tight">{shouldMaskAggregate ? '****' : (stats.incomeToday || 0).toLocaleString()} <span className="text-[10px] font-bold opacity-50">{settings.baseCurrency}</span></p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-fit no-print">
        <button 
          onClick={() => setActiveTab('OPERATIONS')} 
          className={`px-8 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${activeTab === 'OPERATIONS' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}
        >
          <Receipt size={18}/> السندات المالية
        </button>
        {currentUser.role === 'ADMIN' && (
          <button 
            onClick={() => setActiveTab('MANAGE')} 
            className={`px-8 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${activeTab === 'MANAGE' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}
          >
            <Settings size={18}/> إدارة الخزائن
          </button>
        )}
        <button 
          onClick={() => setActiveTab('HISTORY')} 
          className={`px-8 py-2.5 rounded-xl font-bold text-xs flex items-center gap-3 transition-all ${activeTab === 'HISTORY' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-400 hover:text-indigo-600'}`}
        >
          <History size={18}/> الأرشيف المالي
        </button>
      </div>

      {activeTab === 'MANAGE' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-8 rounded-3xl shadow-sm border border-slate-200 gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-900 text-indigo-400 rounded-2xl flex items-center justify-center shadow-lg">
                <Wallet size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 tracking-tight">تعريف الخزائن والبنوك</h3>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest mt-1">إدارة طرق السداد والحسابات المالية</p>
              </div>
            </div>
            <button 
              onClick={() => { setEditingTreasuryId(null); setTreasuryFormData({name: '', type: 'CASH', openingBalance: '0', currencyCode: '', exchangeRate: '1'}); setShowTreasuryForm(true); }} 
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-indigo-600 transition-all shadow-md active:scale-95"
            >
              <Plus size={18} /> إضافة حساب جديد
            </button>
          </div>

          {showTreasuryForm && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-lg animate-in fade-in slide-in-from-top-4 duration-500 relative overflow-hidden">
               <form onSubmit={handleTreasurySubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">اسم الخزينة / البنك</label>
                       <input 
                         required 
                         className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" 
                         placeholder="مثال: الخزينة الرئيسية..." 
                         value={treasuryFormData.name} 
                         onChange={e => setTreasuryFormData({...treasuryFormData, name: e.target.value})} 
                       />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">نوع الحساب</label>
                       <select 
                         className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" 
                         value={treasuryFormData.type} 
                         onChange={e => setTreasuryFormData({...treasuryFormData, type: e.target.value as any})}
                       >
                          <option value="CASH">نقدية (Cash)</option>
                          <option value="BANK">بنك (Bank)</option>
                          <option value="WALLET">محفظة إلكترونية (Wallet)</option>
                          <option value="CUSTODY">عهدة (Custody)</option>
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">عملة الخزينة</label>
                       <select 
                         className="p-3 bg-amber-50 border border-amber-100 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-amber-700 transition-all focus:bg-white" 
                         value={treasuryFormData.currencyCode} 
                         onChange={e => {
                            const code = e.target.value;
                            const rate = currencies?.find(c => c.code === code)?.rateToMain || 1;
                            setTreasuryFormData({...treasuryFormData, currencyCode: code, exchangeRate: rate.toString()});
                         }}
                       >
                          {(currencies || []).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">سعر الصرف</label>
                       <input 
                         type="number" 
                         step="any"
                         disabled={treasuryFormData.currencyCode === settings.baseCurrency}
                         className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-center text-slate-900 disabled:opacity-50 transition-all focus:bg-white" 
                         value={treasuryFormData.currencyCode === settings.baseCurrency ? '1' : treasuryFormData.exchangeRate} 
                         onChange={e => setTreasuryFormData({...treasuryFormData, exchangeRate: e.target.value})} 
                       />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">الرصيد الافتتاحي (بالعملة المختارة)</label>
                       <input 
                         type="number" 
                         required 
                         className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-center text-slate-900 transition-all focus:bg-white" 
                         value={treasuryFormData.openingBalance} 
                         onChange={e => setTreasuryFormData({...treasuryFormData, openingBalance: e.target.value})} 
                       />
                    </div>
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 ml-1">المعادل بالعملة المحلية</label>
                       <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-sm text-center text-indigo-700">
                          {((parseFloat(treasuryFormData.openingBalance) || 0) * (parseFloat(treasuryFormData.currencyCode === settings.baseCurrency ? '1' : treasuryFormData.exchangeRate) || 1)).toLocaleString(undefined, {minimumFractionDigits: 2})} {settings.baseCurrency}
                       </div>
                    </div>
                    <div className="lg:col-span-3 flex justify-end gap-4 mt-6 pt-6 border-t border-slate-100">
                      <button type="button" onClick={() => setShowTreasuryForm(false)} className="px-6 py-2.5 text-slate-400 font-bold text-sm hover:text-rose-600 transition-colors">إلغاء</button>
                      <button type="submit" className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all active:scale-95">حفظ البيانات</button>
                    </div>
               </form>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(sortedTreasuries || []).map(t => (
              <div key={t.id} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 relative group hover:border-indigo-200 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      {t.type === 'CASH' && <Wallet size={24}/>}
                      {t.type === 'BANK' && <Landmark size={24}/>}
                      {t.type === 'WALLET' && <CreditCard size={24}/>}
                      {t.type === 'CUSTODY' && <User size={24}/>}
                   </div>
                   <div className="flex gap-1">
                      {t.type === 'CUSTODY' && (
                        <button 
                          onClick={() => startSettleCustody(t)} 
                          className="flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-all text-[10px] font-bold"
                          title="تسوية العهدة"
                        >
                          <ArrowLeftRight size={14}/>
                          <span>تسوية</span>
                        </button>
                      )}
                      <button onClick={() => startEditTreasury(t)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 size={16}/></button>
                      <button onClick={() => deleteTreasury(t.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={16}/></button>
                   </div>
                </div>
                
                <div>
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">{t.name}</h4>
                  <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100">
                    <div className={`w-1.5 h-1.5 rounded-full ${t.type === 'CASH' ? 'bg-indigo-600' : t.type === 'BANK' ? 'bg-indigo-600' : 'bg-indigo-600'}`}></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {t.type === 'CASH' ? 'خزينة نقدية' : 
                       t.type === 'BANK' ? 'حساب بنكي' : 
                       t.type === 'WALLET' ? 'محفظة إلكترونية' : 'عهدة موظف'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-end relative z-10">
                   <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">الرصيد المتاح</p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-2xl font-bold tracking-tight ${(calculatedBalances[t.id] || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {shouldMaskAggregate ? '****' : (calculatedBalances[t.id] || 0).toLocaleString()}
                        </p>
                        <span className="text-[10px] font-bold text-slate-300 uppercase">{settings.baseCurrency}</span>
                      </div>
                   </div>
                   <div className="text-left bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight text-right">أول المدة</p>
                      <p className="text-sm font-bold text-slate-500">{shouldMaskAggregate ? '****' : (t.openingBalance || 0).toLocaleString()}</p>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'OPERATIONS' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 p-8 rounded-3xl shadow-lg border-b-4 border-indigo-600 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 bg-opacity-10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10 flex items-center gap-6">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-lg">
                <Receipt size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">العمليات والسندات النقدية</h3>
                <p className="text-indigo-400 font-bold mt-1 tracking-widest uppercase text-[10px]">تحرير وإصدار السندات المالية الرسمية</p>
              </div>
            </div>
            {!showVoucherForm && (
              <button 
                onClick={() => setShowVoucherForm(true)} 
                className="relative z-10 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-white hover:text-indigo-600 transition-all shadow-lg active:scale-95"
              >
                <Plus size={20} /> تحرير سند جديد
              </button>
            )}
          </div>

          {showVoucherForm && (
            <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl animate-in fade-in slide-in-from-top-4 duration-500 relative">
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-1.5 h-8 rounded-full ${voucherData.type.includes('RECEIPT') ? 'bg-emerald-500' : (voucherData.type.includes('PAYMENT') || voucherData.type.includes('EXPENSE') || voucherData.type.includes('WITHDRAWAL') || voucherData.type.includes('REFUND')) ? 'bg-rose-500' : 'bg-indigo-600'}`}></div>
                  <h4 className="text-xl font-bold text-slate-900 tracking-tight">تحرير سند {voucherData.type.includes('RECEIPT') ? 'قبض' : 'صرف'} مالي</h4>
                </div>
                <button onClick={() => setShowVoucherForm(false)} className="text-slate-400 hover:text-rose-500 transition-all bg-slate-50 hover:bg-rose-50 p-2 rounded-xl">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleVoucherSubmit} className="space-y-8 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">نوع السند</label>
                    <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={voucherData.type} onChange={e => setVoucherData({...voucherData, type: e.target.value as any, relatedEntityId: ''})}>
                      <option value="RECEIPT_CUST">قبض من عميل (Receipt)</option>
                      <option value="PAYMENT_SUPP">صرف لمورد (Payment)</option>
                      <option value="PAYMENT_EMP">سداد مستحقات موظف (Payroll)</option>
                      {currentUser.role === 'ADMIN' && <option value="PARTNER_WITHDRAWAL">مسحوبات شركاء (Withdrawal)</option>}
                      <option value="REFUND_CUST">رد نقدية لعميل (Refund)</option>
                      <option value="MISC_EXPENSE">مصروف نثري عام (Expense)</option>
                      {currentUser.role === 'ADMIN' && <option value="TRANSFER">تحويل بين الخزائن (Transfer)</option>}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">{voucherData.type === 'TRANSFER' ? 'من الخزينة' : 'الحساب المالي'}</label>
                    <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={voucherData.treasuryId} onChange={e => setVoucherData({...voucherData, treasuryId: e.target.value})}>
                      {(sortedTreasuries || []).map(t => (
                        <option key={t.id} value={t.id}>
                          {t.type === 'CUSTODY' ? '📦 ' : t.type === 'BANK' ? '🏦 ' : '💰 '}
                          {t.name} ({t.type === 'CUSTODY' ? 'عهدة' : t.type === 'BANK' ? 'بنك' : 'خزينة'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">العملة</label>
                    <select 
                      className="p-3 bg-amber-50 border border-amber-100 rounded-xl focus:border-amber-500 outline-none font-bold text-sm text-amber-700 transition-all focus:bg-white" 
                      value={voucherData.currencyCode} 
                      onChange={e => {
                        const code = e.target.value;
                        const rate = currencies?.find(c => c.code === code)?.rateToMain || 1;
                        setVoucherData({...voucherData, currencyCode: code, exchangeRate: rate.toString()});
                      }}
                    >
                      {(currencies || []).map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">المبلغ</label>
                    <input type="number" step="any" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-center text-slate-900 transition-all focus:bg-white" value={voucherData.amount} onChange={e => setVoucherData({...voucherData, amount: e.target.value})} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">سعر الصرف</label>
                    <input 
                      type="number" 
                      step="any"
                      disabled={voucherData.currencyCode === settings.baseCurrency}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-center text-slate-900 disabled:opacity-50 transition-all focus:bg-white" 
                      value={voucherData.currencyCode === settings.baseCurrency ? '1' : voucherData.exchangeRate} 
                      onChange={e => setVoucherData({...voucherData, exchangeRate: e.target.value})} 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 ml-1">المعادل ({settings.baseCurrency})</label>
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-sm text-center text-indigo-700">
                      {((parseFloat(voucherData.amount) || 0) * (parseFloat(voucherData.currencyCode === settings.baseCurrency ? '1' : voucherData.exchangeRate) || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">التاريخ</label>
                    <input type="date" required className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-sm text-slate-900 transition-all focus:bg-white" value={voucherData.date} onChange={e => setVoucherData({...voucherData, date: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner relative">
                  {voucherData.type !== 'MISC_EXPENSE' && (
                    <div className="flex flex-col gap-2">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1 flex items-center gap-2">
                          {voucherData.type === 'PAYMENT_EMP' ? 'الموظف' : voucherData.type === 'PAYMENT_SUPP' ? 'المورد' : voucherData.type === 'TRANSFER' ? 'إلى الخزينة' : 'العميل'}
                       </label>
                       <SearchableSelect
                          options={
                            voucherData.type === 'PAYMENT_EMP' 
                              ? (employees || []).map(e => ({ id: e.id, name: e.name, subtext: `${(otherBalances.employees[e.id] || 0).toLocaleString()} ${settings.baseCurrency}` }))
                              : voucherData.type === 'PAYMENT_SUPP'
                              ? (suppliers || []).map(s => ({ id: s.id, name: s.company || s.name, subtext: `${(otherBalances.suppliers[s.id] || 0).toLocaleString()} ${settings.baseCurrency}` }))
                              : voucherData.type === 'PARTNER_WITHDRAWAL'
                              ? (partners || []).map(p => ({ id: p.id, name: p.name, subtext: `${(otherBalances.partners[p.id] || 0).toLocaleString()} ${settings.baseCurrency}` }))
                              : voucherData.type === 'TRANSFER'
                              ? (sortedTreasuries || []).filter(t => t.id !== voucherData.treasuryId).map(t => ({ 
                                  id: t.id, 
                                  name: `${t.type === 'CUSTODY' ? '📦 ' : t.type === 'BANK' ? '🏦 ' : '💰 '}${t.name}`, 
                                  subtext: `${t.type === 'CUSTODY' ? 'عهدة' : t.type === 'BANK' ? 'بنك' : 'خزينة'} | ${(calculatedBalances[t.id] || 0).toLocaleString()} ${settings.baseCurrency}` 
                                }))
                              : (customers || []).map(c => ({ id: c.id, name: c.name, subtext: `${(otherBalances.customers[c.id] || 0).toLocaleString()} ${settings.baseCurrency}` }))
                          }
                          value={voucherData.relatedEntityId}
                          onChange={val => setVoucherData({...voucherData, relatedEntityId: val})}
                          placeholder="اختر الطرف المعني..."
                       />
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">الرحلة المربوطة (مركز تكلفة)</label>
                    <select 
                      className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 outline-none focus:border-indigo-600 transition-all shadow-sm"
                      value={voucherData.costCenterId}
                      onChange={e => setVoucherData({...voucherData, costCenterId: e.target.value})}
                    >
                      <option value="">بدون رحلة</option>
                      {(costCenters || []).length > 0 && (
                        <optgroup label="مراكز التكلفة">
                          {(costCenters || []).filter(cc => cc && cc.isActive).map(cc => (
                            <option key={cc.id} value={cc.id}>{cc.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {(masterTrips || []).length > 0 && (
                        <optgroup label="الرحلات النشطة">
                          {(masterTrips || []).map(trip => (
                            <option key={trip.id} value={trip.id}>{trip.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 ml-1">برنامج العمرة/الحج</label>
                    <select 
                      className="p-3 bg-white border border-indigo-200 rounded-xl font-bold text-sm text-slate-900 outline-none focus:border-indigo-600 transition-all shadow-sm"
                      value={voucherData.programId}
                      onChange={e => setVoucherData({...voucherData, programId: e.target.value, componentId: ''})}
                    >
                      <option value="">اختر البرنامج (اختياري)</option>
                      {(programs || []).map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {voucherData.programId && (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-right-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 ml-1">المكون المرتبط</label>
                      <select 
                        className="p-3 bg-white border border-emerald-200 rounded-xl font-bold text-sm text-slate-900 outline-none focus:border-emerald-600 transition-all shadow-sm"
                        value={voucherData.componentId}
                        onChange={e => setVoucherData({...voucherData, componentId: e.target.value})}
                      >
                        <option value="">اختر المكون...</option>
                        {((programs || []).find(p => p && p.id === voucherData.programId)?.components || []).map(c => (
                          <option key={c?.id} value={c?.id}>{c?.name} ({c?.type})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={`${(voucherData.type === 'MISC_EXPENSE' || !voucherData.type) ? 'md:col-span-3' : 'md:col-span-2'} flex flex-col gap-2`}>
                     <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">البيان / التفاصيل</label>
                     <input required className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-900 shadow-sm focus:border-indigo-600 outline-none transition-all" placeholder="اكتب تفاصيل العملية..." value={voucherData.description} onChange={e => setVoucherData({...voucherData, description: e.target.value})} />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-slate-100">
                  <button type="button" onClick={() => setShowVoucherForm(false)} className="px-6 py-2.5 font-bold text-sm text-slate-400 hover:text-rose-600 transition-colors">إلغاء</button>
                  <button type="submit" className="bg-indigo-600 text-white px-10 py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95">
                    <Save size={18} />
                    {editingTransactionId ? 'تحديث السند' : 'ترحيل السند'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between border-b-4 border-b-emerald-500 transition-all">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">مقبوضات اليوم</p>
                  <p className="text-xl font-bold text-emerald-600 tracking-tight">
                    {shouldMaskAggregate ? '****' : ((transactions || []).filter(t => t && t.date === new Date().toISOString().split('T')[0] && t.type === 'INCOME' && !!t.treasuryId).reduce((s,x)=>s+(x.amountInBase || 0),0)).toLocaleString()} <span className="text-[10px] opacity-50">{settings?.baseCurrency}</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
                  <ArrowUpCircle size={20}/>
                </div>
             </div>
             <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-between border-b-4 border-b-rose-500 transition-all">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">مدفوعات اليوم</p>
                  <p className="text-xl font-bold text-rose-600 tracking-tight">
                    {shouldMaskAggregate ? '****' : ((transactions || []).filter(t => t && t.date === new Date().toISOString().split('T')[0] && t.type === 'EXPENSE' && !!t.treasuryId).reduce((s,x)=>s+(x.amountInBase || 0),0)).toLocaleString()} <span className="text-[10px] opacity-50">{settings?.baseCurrency}</span>
                  </p>
                </div>
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                  <ArrowDownCircle size={20}/>
                </div>
             </div>
             <div className="bg-slate-900 p-6 rounded-3xl shadow-lg flex items-center justify-between md:col-span-2 text-white relative overflow-hidden transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 bg-opacity-10 rounded-full blur-2xl -mr-16 -mt-16"></div>
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">إجمالي السيولة المجمعة</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-4xl font-bold text-amber-500 tracking-tighter tabular-nums">
                      {shouldMaskAggregate ? '****' : ((treasuries || []).reduce((s,x)=>s+(calculatedBalances[x?.id] || 0),0)).toLocaleString()}
                    </p>
                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{settings?.baseCurrency}</span>
                  </div>
                </div>
                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-slate-900 shadow-lg relative z-10">
                  <Coins size={32}/>
                </div>
             </div>
          </div>
        </div>
      )}

      {(activeTab === 'HISTORY' || activeTab === 'OPERATIONS' && !showVoucherForm) && (
        <div id="treasury-report-to-print" className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="p-8 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-6">
             <div className="flex items-center gap-4">
               <div className="w-1.5 h-8 bg-slate-900 rounded-full"></div>
               <div>
                 <h3 className="text-xl font-bold text-slate-900 tracking-tight">أرشيف السندات والعمليات النقدية</h3>
                 <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">السجل التاريخي للتحركات المالية</p>
               </div>
             </div>
             <div className="flex items-center gap-3">
               {selectedIds.length > 0 && currentUser.role === 'ADMIN' && (
                 <button 
                   onClick={handleBulkDelete}
                   className="flex items-center justify-center gap-3 px-6 py-2.5 bg-rose-500 text-white rounded-xl shadow-lg hover:bg-rose-600 transition-all font-bold text-sm animate-in zoom-in"
                 >
                   <Trash2 size={18} /> حذف ({selectedIds.length})
                 </button>
               )}
              <button 
                  onClick={() => {
                    const previewContent = document.getElementById('treasury-report-to-print');
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
                      window.print();
                    }
                  }} 
                  className="flex items-center justify-center gap-3 px-6 py-2.5 bg-white text-slate-900 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all font-bold text-sm"
                >
                  <Printer size={18} /> طباعة السجل
                </button>
             </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                      checked={filteredHistory.length > 0 && selectedIds.length === filteredHistory.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">المرجع</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">البيان والتصنيف</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">الحساب المالي</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">القيمة</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">التاريخ</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">التحكم</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.map(tx => (
                  <tr 
                    key={tx.id} 
                    id={`transaction-${tx.id}`}
                    className={`hover:bg-slate-50 bg-opacity-50 transition-all group ${highlightedId === tx.id ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/30 scale-[1.002] z-10 shadow-2xl' : ''}`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                        checked={selectedIds.includes(tx.id)}
                        onChange={() => toggleSelect(tx.id)}
                      />
                    </td>
                    <td className="px-6 py-4">
                      {tx.refNo ? (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(tx.refNo);
                            const btn = document.getElementById(`ref-tr-${tx.id}`);
                            if (btn) {
                              const originalText = btn.innerText;
                              btn.innerText = 'تم النسخ';
                              setTimeout(() => { btn.innerText = originalText; }, 1000);
                            }
                          }}
                          id={`ref-tr-${tx.id}`}
                          className="text-[10px] font-bold text-indigo-600 font-mono bg-indigo-50 px-2 py-1 rounded-md border border-indigo-100 hover:bg-indigo-100 transition-all"
                          title="اضغط للنسخ والبحث"
                        >
                          #{tx.refNo}
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 font-mono bg-slate-50 px-2 py-1 rounded-md">
                          #{tx.id.slice(-6).toUpperCase()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-relaxed max-w-md">{tx.description}</p>
                        <div className="flex items-center gap-2">
                           <span className={`text-[8px] font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter ${tx.type === 'INCOME' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {tx.type === 'INCOME' ? 'إيداع' : 'سحب'}
                           </span>
                           {tx.expenseCategory && (
                             <span className="text-[8px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 uppercase tracking-tighter">
                               {tx.expenseCategory}
                             </span>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-600">{(treasuries || []).find(t => t && t.id === tx.treasuryId)?.name || '---'}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <p className={`text-base font-bold tracking-tight ${tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {isHidden ? '****' : (tx.amount || 0).toLocaleString()} <span className="text-[10px] opacity-40 ml-1">{tx.currencyCode}</span>
                        </p>
                        {tx.currencyCode !== settings.baseCurrency && (
                          <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">≈ {isHidden ? '****' : (tx.amountInBase || 0).toLocaleString()} {settings.baseCurrency}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs font-bold text-slate-500">{tx.date}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        {currentUser.role === 'ADMIN' && (
                          <button onClick={() => startEditTransaction(tx)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="تعديل"><Edit2 size={14}/></button>
                        )}
                        <button onClick={() => handlePrint(tx)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all" title="طباعة"><Printer size={14}/></button>
                        {currentUser.role === 'ADMIN' && (
                          <button onClick={() => deleteTransaction(tx.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="حذف"><Trash2 size={14}/></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredHistory.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6 border border-dashed border-slate-200">
                <FileText size={40} className="text-slate-200" />
              </div>
              <h4 className="text-lg font-bold text-slate-400 mb-1">الأرشيف المالي فارغ</h4>
              <p className="text-slate-300 font-bold text-sm">لم يتم تسجيل أي سندات حتى الآن</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TreasuryView;
