import React, { useMemo, useState } from 'react';
import { Printer, TrendingUp, TrendingDown, Wallet, Calendar, Tag, ChevronLeft, ArrowLeftRight, Edit2, X, Save } from 'lucide-react';
import { Transaction, MasterTrip, Currency, CompanySettings, JournalEntry, Program } from '../types';

interface TripAnalysisViewProps {
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  masterTrips: MasterTrip[];
  programs: Program[];
  currencies: Currency[];
  settings: CompanySettings;
  formatCurrency: (amount: number) => string;
  onBack: () => void;
  onUpdateTransaction?: (id: string, updates: Partial<Transaction>) => void;
  onUpdateJournalEntry?: (id: string, updates: Partial<JournalEntry>) => void;
  selectedTripId?: string | null;
  onTripChange?: (id: string) => void;
}

const TripAnalysisView: React.FC<TripAnalysisViewProps> = ({
  transactions,
  journalEntries,
  masterTrips,
  programs,
  currencies,
  settings,
  formatCurrency,
  onBack,
  onUpdateTransaction,
  onUpdateJournalEntry,
  selectedTripId: externalSelectedTripId,
  onTripChange
}) => {
  const [internalSelectedTripId, setInternalSelectedTripId] = useState<string>('');
  const selectedTripId = externalSelectedTripId || internalSelectedTripId;

  const setSelectedTripId = (id: string) => {
    setInternalSelectedTripId(id);
    if (onTripChange) onTripChange(id);
  };

  const [editingMovement, setEditingMovement] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    amount: 0,
    description: '',
    purchasePrice: 0
  });

  const handleEdit = (m: any) => {
    setEditingMovement(m);
    setEditForm({
      amount: m.amount,
      description: m.description,
      purchasePrice: m.originalData?.purchasePrice || 0
    });
  };

  const handleSave = () => {
    if (!editingMovement) return;

    if (editingMovement.sourceType === 'TRANSACTION') {
      onUpdateTransaction?.(editingMovement.sourceId, {
        amount: editForm.amount,
        description: editForm.description,
        purchasePrice: editForm.purchasePrice
      });
    } else if (editingMovement.sourceType === 'JOURNAL') {
      const { entry, lineIndex } = editingMovement.originalData;
      if (!entry || !entry.lines || !entry.lines[lineIndex]) return;
      const newLines = [...entry.lines];
      const isIncome = (newLines[lineIndex]?.credit || 0) > 0;
      
      if (isIncome) {
        newLines[lineIndex].credit = editForm.amount;
      } else {
        newLines[lineIndex].debit = editForm.amount;
      }
      newLines[lineIndex].originalAmount = editForm.amount;

      onUpdateJournalEntry?.(entry.id, {
        description: (editForm.description || '').split(' - ')[0],
        lines: newLines
      });
    }

    setEditingMovement(null);
  };

  const selectedTrip = useMemo(() => 
    (masterTrips || []).find(t => t?.id === selectedTripId),
    [masterTrips, selectedTripId]
  );

  const tripData = useMemo(() => {
    if (!selectedTripId) return { movements: [], stats: { totalIncome: 0, totalExpense: 0, netProfit: 0 } };

    const movements: any[] = [];
    let totalIncome = 0;
    let totalExpense = 0;

    // 0. Create maps for tag recovery and deduplication
    const txByRef = new Map<string, Transaction>();
    const transactionsInJs = new Set<string>();
    
    (transactions || []).forEach(tx => {
      if (tx && tx.refNo) txByRef.set(tx.refNo, tx);
    });

    (journalEntries || []).forEach(je => {
      (je.lines || []).forEach(l => {
        if (l.transactionId) transactionsInJs.add(l.transactionId);
      });
    });

    // Get all programs linked to this master trip
    const tripPrograms = (programs || []).filter(p => p?.masterTripId === selectedTripId);
    const linkedProgramIds = new Set(tripPrograms.map(p => p?.id).filter(Boolean));
    const programMap = new Map(tripPrograms.map(p => [p?.id, p?.name]));
    
    // 1. Get Transactions that DON'T have Journal Entries yet
    (transactions || []).forEach(tx => {
      if (!tx || tx.isVoided || transactionsInJs.has(tx.id) || tx.journalEntryId) return;
      
      const isDirectlyLinked = tx.masterTripId === selectedTripId;
      const isLinkedViaProgram = tx.programId && linkedProgramIds.has(tx.programId);

      if (isDirectlyLinked || isLinkedViaProgram) {
        const rate = tx.exchangeRate || 1;
        const amountBase = (tx.amount || 0) * rate;
        const purchaseBase = (tx.purchasePrice || 0) * rate;

        let category = tx.category || 'OTHER';
        if (tx.description?.includes('طيران') || category === 'FLIGHT') category = 'FLIGHT_INTERNAL';
        else if (tx.type === 'EXPENSE' && (category === 'EXPENSE_GEN' || tx.description?.includes('مصاريف'))) category = 'EXPENSE_INTERNAL';

        movements.push({
          date: tx.date,
          description: tx.description,
          refNo: tx.refNo,
          amount: tx.amount,
          currency: tx.currencyCode,
          rate: rate,
          amountBase: amountBase,
          purchaseBase: purchaseBase,
          type: tx.type === 'INCOME' || tx.type === 'REVENUE_ONLY' ? 'INCOME' : 'EXPENSE',
          category: category,
          programId: tx.programId || 'GENERAL',
          programName: tx.programId ? (programMap.get(tx.programId) || 'برنامج غير معروف') : 'عام',
          componentId: tx.componentId,
          componentName: tx.componentId ? (tripPrograms.flatMap(p => (p && p.components) || []).find(c => c && c.id === tx.componentId)?.name) : undefined,
          sourceId: tx.id,
          sourceType: 'TRANSACTION',
          originalData: tx
        });
      }
    });

    // 2. Get Journal Entries (The Financial Truth)
    (journalEntries || []).forEach(entry => {
      if (!entry) return;

      const lines = entry.lines || [];
      const entryRef = entry.refNo;
      
      // Identify mirror costs (Revenue/Expense pairs in same entry with same amount)
      // This happens with 'Accommodation' which records both sales and costs in the same JE.
      const revenueAmounts = new Set<number>();
      lines.forEach(l => {
        if (l.accountType === 'REVENUE' && (l.credit || 0) > 0) {
          revenueAmounts.add(l.credit || 0);
        }
      });

      // Recover trip context from associated transactions if missing from ledger line
      const linkedTx = entryRef ? txByRef.get(entryRef) : null;
      const isEntryLinkedViaTx = linkedTx && (
        linkedTx.masterTripId === selectedTripId || 
        (linkedTx.programId && linkedProgramIds.has(linkedTx.programId))
      );

      lines.forEach((line, lineIndex) => {
        if (!line) return;
        
        let isLinked = line.costCenterId === selectedTripId || 
                       (line.programId && linkedProgramIds.has(line.programId));
        
        // Recover tags
        if (!isLinked && isEntryLinkedViaTx) {
          isLinked = true;
        }

        if (isLinked) {
          // Only include P&L accounts
          const isPLAccount = line.accountType === 'EXPENSE' || line.accountType === 'REVENUE';
          if (!isPLAccount) return;
          
          // FILTER MIRROR COSTS: If it's an expense that exactly matches a revenue line in the same JE,
          // it's a mirror cost (Accommodation Sale vs Cost) and should be excluded for net profit analysis.
          const debitAmount = line.debit || 0;
          if (line.accountType === 'EXPENSE' && debitAmount > 0 && revenueAmounts.has(debitAmount)) {
            return;
          }

          const isIncome = (line.credit || 0) > 0;
          const amount = isIncome ? (line.credit || 0) : debitAmount;
          const rate = line.exchangeRate || 1;
          const amountBase = line.originalAmount ? (line.originalAmount * rate) : (amount * rate);

          let category = 'OTHER';
          if (line.accountName?.includes('طيران')) {
            category = 'FLIGHT_INTERNAL';
          } else if (line.accountType === 'EXPENSE' && (line.accountName?.includes('عامة') || line.accountName?.includes('إدارية'))) {
            category = 'EXPENSE_INTERNAL';
          } else if (line.accountType === 'REVENUE') {
            category = 'REVENUE_SERVICE';
          } else if (line.accountType === 'EXPENSE') {
            category = 'EXPENSE_SERVICE';
          }

          movements.push({
            date: entry.date,
            description: (entry.description || '') + (line.accountName ? ` - ${line.accountName}` : ''),
            refNo: entry.refNo,
            amount: line.originalAmount || amount,
            currency: line.currencyCode || (settings?.baseCurrency || 'EGP'),
            rate: rate,
            amountBase: amountBase,
            type: isIncome ? 'INCOME' : 'EXPENSE',
            category: category,
            programId: line.programId || 'GENERAL',
            programName: line.programId ? (programMap.get(line.programId) || 'برنامج غير معروف') : 'عام',
            componentId: line.componentId,
            componentName: line.componentId ? (tripPrograms.flatMap(p => (p && p.components) || []).find(c => c && c.id === line.componentId)?.name) : undefined,
            sourceId: entry.id,
            sourceType: 'JOURNAL',
            originalData: { entry, lineIndex: (entry.lines || []).indexOf(line) }
          });
        }
      });
    });

    // Grouping by Program for the UI
    const programGroups: Record<string, { name: string, movements: any[], stats: { income: number, expense: number, profit: number } }> = {};
    
    // Specific groups for Flights and General Expenses
    const FLIGHT_GROUP_ID = 'FLIGHT_GROUP';
    const EXPENSE_GROUP_ID = 'EXPENSE_GROUP';

    programGroups[FLIGHT_GROUP_ID] = { name: 'تكاليف الطيران', movements: [], stats: { income: 0, expense: 0, profit: 0 } };
    programGroups[EXPENSE_GROUP_ID] = { name: 'المصاريف العامة', movements: [], stats: { income: 0, expense: 0, profit: 0 } };
    
    (tripPrograms || []).forEach(p => {
      programGroups[p.id] = { name: p.name, movements: [], stats: { income: 0, expense: 0, profit: 0 } };
    });
    
    if (!programGroups['GENERAL']) {
      programGroups['GENERAL'] = { name: 'التعاقدات العامة', movements: [], stats: { income: 0, expense: 0, profit: 0 } };
    }

    (movements || []).forEach(m => {
      let pid = m.programId || 'GENERAL';
      
      // Strict categorization
      if (m.category === 'FLIGHT_INTERNAL') pid = FLIGHT_GROUP_ID;
      else if (m.category === 'EXPENSE_INTERNAL') pid = EXPENSE_GROUP_ID;

      if (!programGroups[pid]) {
        programGroups[pid] = { name: m.programName || 'عام', movements: [], stats: { income: 0, expense: 0, profit: 0 } };
      }
      
      programGroups[pid].movements.push(m);
      if (m.type === 'INCOME') {
        programGroups[pid].stats.income += (m.amountBase || 0);
      } else {
        programGroups[pid].stats.expense += (m.amountBase || 0);
      }
      programGroups[pid].stats.profit = programGroups[pid].stats.income - programGroups[pid].stats.expense;
    });

    // Remove empty groups except Flights and Expenses if user expects them
    Object.keys(programGroups).forEach(key => {
      if (programGroups[key].movements.length === 0 && key !== FLIGHT_GROUP_ID && key !== EXPENSE_GROUP_ID) {
        delete programGroups[key];
      }
    });

    // Calculate final totals based on grouped data to ensure consistency
    let finalTotalIncome = 0;
    let finalTotalExpense = 0;
    Object.values(programGroups).forEach(group => {
      finalTotalIncome += (group.stats.income || 0);
      finalTotalExpense += (group.stats.expense || 0);
    });


    return {
      movements: (movements || []).sort((a, b) => (a.date || '').localeCompare(b.date || '')),
      programGroups,
      stats: {
        totalIncome: finalTotalIncome,
        totalExpense: finalTotalExpense,
        netProfit: finalTotalIncome - finalTotalExpense
      }
    };
  }, [selectedTripId, transactions, journalEntries, settings.baseCurrency, programs]);

  const handlePrint = () => {
    if (!selectedTrip) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const html = `
      <html dir="rtl">
        <head>
          <title>تحليل تكاليف - ${selectedTrip.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 20px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e1b4b; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; }
            th { background: #f8fafc; font-weight: 900; }
            .income { color: #059669; }
            .expense { color: #dc2626; }
            .summary { margin-top: 30px; display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 20px; }
            .summary-box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; text-align: center; }
            .summary-label { font-size: 12px; color: #64748b; font-weight: bold; }
            .summary-value { font-size: 18px; font-weight: 900; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0;">${settings.name}</h1>
              <p style="margin:5px 0;">تقرير تحليل تكاليف الرحلة</p>
            </div>
            <div style="text-align: left;">
              <p>الرحلة: <strong>${selectedTrip.name}</strong></p>
              <p>التاريخ: ${selectedTrip.date}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 100px;">التاريخ</th>
                <th style="width: 100px;">المرجع</th>
                <th>البيان والتفاصيل</th>
                <th style="text-align:center;">المبلغ بالعملة</th>
                <th style="text-align:center;">الإجمالي بالجنيه</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(tripData.programGroups).map(([pid, group]) => {
                if (group.movements.length === 0) return '';
                
                return `
                  <tr style="background: #f1f5f9; font-weight: bold;">
                    <td colspan="5" style="padding: 12px; border-right: 4px solid #1e1b4b; font-size: 16px;">
                      ${group.name}
                    </td>
                  </tr>
                  ${group.movements.map(m => `
                    <tr>
                      <td>${m.date}</td>
                      <td>${m.refNo || ''}</td>
                      <td>
                        <div style="font-weight: bold;">${m.description}</div>
                        ${m.componentName ? `<div style="font-size: 10px; color: #6366f1; margin-top: 2px;">${m.componentName}</div>` : ''}
                      </td>
                      <td style="text-align:center;" class="${m.type === 'INCOME' ? 'income' : 'expense'}">${m.amount.toLocaleString()} ${m.currency}</td>
                      <td style="text-align:center; font-weight:bold;">${m.amountBase.toLocaleString()}</td>
                    </tr>
                  `).join('')}
                  <tr style="background: #fafafa; font-weight: bold;">
                    <td colspan="3" style="text-align: left; padding: 10px;">إجمالي ${group.name}:</td>
                    <td colspan="2">
                      <div style="display: flex; justify-content: space-around; font-size: 13px;">
                        <span>التكلفة: <span class="expense">${group.stats.expense.toLocaleString()}</span></span>
                        <span>البيع: <span class="income">${group.stats.income.toLocaleString()}</span></span>
                        <span>الصافي: <span style="color: ${group.stats.profit >= 0 ? '#059669' : '#dc2626'}">${group.stats.profit.toLocaleString()}</span></span>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-box">
              <div class="summary-label">إجمالي التحصيل</div>
              <div class="summary-value income">${tripData.stats.totalIncome.toLocaleString()} EGP</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">إجمالي التكلفة</div>
              <div class="summary-value expense">${tripData.stats.totalExpense.toLocaleString()} EGP</div>
            </div>
            <div class="summary-box" style="background: #1e1b4b; color: white;">
              <div class="summary-label" style="color: #94a3b8;">صافي الربح / الخسارة</div>
              <div class="summary-value">${tripData.stats.netProfit.toLocaleString()} EGP</div>
            </div>
          </div>
          
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const handlePrintSummary = () => {
    if (!selectedTrip) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const getGroupingKey = (m: any) => {
      const desc = m.description || '';
      const cat = m.category || '';
      
      if (cat.includes('FLIGHT') || desc.includes('طيران') || desc.includes('تذكرة')) return 'تذاكر طيران';
      if (desc.includes('تأشيرة') || desc.includes('فيزا')) return 'تأشيرات';
      if (desc.includes('فندق') || desc.includes('سكن')) {
        const hotelMatch = desc.match(/(فندق\s+[^\s,،-]+(\s+[^\s,،-]+)?)/) || desc.match(/(سكن\s+[^\s,،-]+(\s+[^\s,،-]+)?)/);
        return hotelMatch ? hotelMatch[0] : 'سكن وفنادق';
      }
      if (desc.includes('انتقال') || desc.includes('توصيل') || desc.includes('أتوبيس') || desc.includes('باص') || desc.includes('نقل')) return 'انتقالات وبرامج';
      if (desc.includes('هدية') || desc.includes('هدايا') || desc.includes('شنط')) return 'هدايا ومطبوعات';
      
      return 'مصاريف وإيرادات متنوعة';
    };

    const summarizedData = Object.entries(tripData.programGroups || {}).map(([pid, group]) => {
      const categories: Record<string, { income: number, expense: number }> = {};
      
      (group.movements || []).forEach(m => {
        const key = getGroupingKey(m);
        if (!categories[key]) categories[key] = { income: 0, expense: 0 };
        if (m.type === 'INCOME') categories[key].income += (m.amountBase || 0);
        else categories[key].expense += (m.amountBase || 0);
      });

      return {
        name: group.name,
        categories,
        stats: group.stats
      };
    }).filter(g => Object.keys(g.categories || {}).length > 0);

    const html = `
      <html dir="rtl">
        <head>
          <title>ملخص تكاليف - ${selectedTrip.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 20px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e1b4b; padding-bottom: 15px; margin-bottom: 30px; }
            .program-section { margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            .program-header { background: #1e1b4b; color: white; padding: 12px 20px; font-weight: 900; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 15px; text-align: right; }
            th { background: #f8fafc; font-weight: 900; color: #64748b; text-transform: uppercase; font-size: 13px; }
            .income { color: #059669; font-weight: bold; }
            .expense { color: #dc2626; font-weight: bold; }
            .profit { font-weight: 900; }
            .summary { margin-top: 30px; display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 20px; }
            .summary-box { border: 2px solid #e2e8f0; padding: 20px; border-radius: 15px; text-align: center; }
            .summary-label { font-size: 14px; color: #64748b; font-weight: bold; margin-bottom: 5px; }
            .summary-value { font-size: 24px; font-weight: 900; }
            .total-row { background: #f8fafc; font-weight: 900; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0; color: #1e1b4b;">${settings.name}</h1>
              <p style="margin:5px 0; font-weight: bold; color: #64748b;">ملخص تحليلي لتكاليف وأرباح الرحلة</p>
            </div>
            <div style="text-align: left;">
              <p style="margin:0;">الرحلة: <strong>${selectedTrip.name}</strong></p>
              <p style="margin:5px 0;">التاريخ: ${selectedTrip.date}</p>
            </div>
          </div>

          ${summarizedData.map(group => `
            <div class="program-section">
              <div class="program-header">${group.name}</div>
              <table>
                <thead>
                  <tr>
                    <th>البند / التصنيف</th>
                    <th style="text-align:center;">إجمالي التحصيل</th>
                    <th style="text-align:center;">إجمالي التكلفة</th>
                    <th style="text-align:center;">صافي الربح</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(group.categories).map(([catName, stats]) => `
                    <tr>
                      <td style="font-weight: bold;">${catName}</td>
                      <td style="text-align:center;" class="income">${stats.income.toLocaleString()}</td>
                      <td style="text-align:center;" class="expense">${stats.expense.toLocaleString()}</td>
                      <td style="text-align:center;" class="profit ${stats.income - stats.expense >= 0 ? 'income' : 'expense'}">
                        ${(stats.income - stats.expense).toLocaleString()}
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td>إجمالي ${group.name}</td>
                    <td style="text-align:center;" class="income">${group.stats.income.toLocaleString()}</td>
                    <td style="text-align:center;" class="expense">${group.stats.expense.toLocaleString()}</td>
                    <td style="text-align:center; font-size: 18px;" class="profit ${group.stats.profit >= 0 ? 'income' : 'expense'}">
                      ${group.stats.profit.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          `).join('')}

          <div class="summary">
            <div class="summary-box">
              <div class="summary-label">إجمالي إيرادات الرحلة</div>
              <div class="summary-value income">${tripData.stats.totalIncome.toLocaleString()} EGP</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">إجمالي تكاليف الرحلة</div>
              <div class="summary-value expense">${tripData.stats.totalExpense.toLocaleString()} EGP</div>
            </div>
            <div class="summary-box" style="background: #1e1b4b; color: white; border-color: #1e1b4b;">
              <div class="summary-label" style="color: #94a3b8;">صافي ربح الرحلة النهائي</div>
              <div class="summary-value">${tripData.stats.netProfit.toLocaleString()} EGP</div>
            </div>
          </div>
          
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const filteredMasterTrips = useMemo(() => {
    const activeTripIds = new Set([
      ...(transactions || []).map(tx => tx?.masterTripId),
      ...(journalEntries || []).flatMap(e => (e?.lines || []).map(l => l?.costCenterId))
    ].filter(Boolean));

    // Also include trips linked via programs
    (programs || []).forEach(p => {
      if (p?.masterTripId) {
        const hasTx = (transactions || []).some(tx => tx?.programId === p.id);
        const hasJl = (journalEntries || []).some(e => (e?.lines || []).some(l => l?.programId === p.id));
        if (hasTx || hasJl) {
          activeTripIds.add(p.masterTripId);
        }
      }
    });

    return (masterTrips || []).filter(trip => activeTripIds.has(trip.id));
  }, [masterTrips, transactions, journalEntries, programs]);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-bold text-slate-900">تحليل تكاليف الرحلات المجمعة</h2>
            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest">مراجعة الأرباح والخسائر لكل رحلة بالتفصيل</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedTripId}
            onChange={(e) => setSelectedTripId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm text-slate-700 outline-none focus:border-indigo-600 transition-all min-w-[250px]"
          >
            <option value="">اختر الرحلة للمراجعة...</option>
            {filteredMasterTrips.map(trip => (
              <option key={trip.id} value={trip.id}>{trip.name} - {trip.date}</option>
            ))}
          </select>
          
          {selectedTripId && (
            <div className="flex gap-3">
              <button 
                onClick={handlePrintSummary}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-md"
              >
                <Printer size={18} /> طباعة الملخص (ورقة واحدة)
              </button>
              <button 
                onClick={handlePrint}
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-slate-800 transition-all shadow-md"
              >
                <Printer size={18} /> تقرير تفصيلي
              </button>
            </div>
          )}
        </div>
      </div>

      {selectedTripId ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">إجمالي الإيرادات</p>
                <p className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(tripData.stats.totalIncome)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                <TrendingDown size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">إجمالي التكاليف</p>
                <p className="text-xl font-black text-rose-600 tracking-tight">{formatCurrency(tripData.stats.totalExpense)}</p>
              </div>
            </div>
            <div className="bg-slate-900 p-6 rounded-3xl shadow-lg flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500 bg-opacity-20 text-indigo-400 rounded-2xl flex items-center justify-center">
                <Wallet size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">صافي الربح</p>
                <p className={`text-xl font-black tracking-tight ${tripData.stats.netProfit >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {formatCurrency(tripData.stats.netProfit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50 bg-opacity-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-900 flex items-center gap-3">
                <Calendar size={18} className="text-indigo-600" /> تفاصيل الحركات المالية للرحلة
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-xs font-bold text-slate-500">إيرادات</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-rose-500 rounded-full"></div>
                  <span className="text-xs font-bold text-slate-500">مصروفات</span>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 w-32">التاريخ</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 w-32">المرجع</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400">البيان والتفاصيل</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-center w-40">المبلغ بالعملة</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-center w-40">الإجمالي بالجنيه</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tripData.movements.length > 0 ? (
                    <>
                      {Object.entries(tripData.programGroups).map(([pid, group]) => {
                        if (group.movements.length === 0) return null;
                        
                        return (
                          <React.Fragment key={pid}>
                            <tr className="bg-slate-100 bg-opacity-50">
                              <td colSpan={6} className="px-6 py-2 text-sm font-black text-slate-900 border-r-4 border-slate-900">
                                {group.name}
                              </td>
                            </tr>
                            {group.movements.map((move, idx) => (
                              <tr key={`${pid}-${idx}`} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-6 py-3 text-[11px] font-bold text-slate-500">{move.date}</td>
                                <td className="px-6 py-3">
                                  {move.refNo && (
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(move.refNo);
                                        const btn = document.getElementById(`ref-trip-${pid}-${idx}`);
                                        if (btn) {
                                          const originalText = btn.innerText;
                                          btn.innerText = 'تم النسخ';
                                          setTimeout(() => { btn.innerText = originalText; }, 1000);
                                        }
                                      }}
                                      id={`ref-trip-${pid}-${idx}`}
                                      className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black border border-indigo-100 hover:bg-indigo-100 transition-all"
                                      title="اضغط للنسخ والبحث"
                                    >
                                      {move.refNo}
                                    </button>
                                  )}
                                </td>
                                <td className="px-6 py-3 text-sm font-bold text-slate-900">
                                  {move.description}
                                  {move.componentName && (
                                    <span className="block text-[10px] text-indigo-500 mt-1 uppercase tracking-wider">
                                      {move.componentName}
                                    </span>
                                  )}
                                </td>
                                <td className={`px-6 py-3 text-sm font-black text-center ${move.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                  {move.amount.toLocaleString()} <span className="text-[10px] opacity-70">{move.currency}</span>
                                </td>
                                <td className="px-6 py-3 text-sm font-black text-slate-900 text-center">{formatCurrency(move.amountBase)}</td>
                                <td className="px-6 py-3">
                                  <button 
                                    onClick={() => handleEdit(move)}
                                    className="p-2 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"
                                    title="تعديل سريع"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            <tr className="bg-slate-50 bg-opacity-80 border-b-2 border-slate-200">
                              <td colSpan={3} className="px-6 py-2 text-xs font-black text-slate-500 text-left">
                                ملخص {group.name}
                              </td>
                              <td colSpan={3} className="px-6 py-2">
                                <div className="flex justify-around items-center">
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">التكلفة</span>
                                    <span className="text-xs font-black text-rose-600">{formatCurrency(group.stats.expense)}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">البيع</span>
                                    <span className="text-xs font-black text-emerald-600">{formatCurrency(group.stats.income)}</span>
                                  </div>
                                  <div className="flex flex-col items-center">
                                    <span className="text-[9px] text-slate-400 uppercase font-bold">الصافي</span>
                                    <span className={`text-xs font-black ${group.stats.profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                                      {formatCurrency(group.stats.profit)}
                                    </span>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </>
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-20 text-center">
                        <Tag size={48} className="mx-auto text-slate-200 mb-4" />
                        <p className="text-slate-400 font-bold">لا توجد حركات مالية مرتبطة بهذه الرحلة حتى الآن</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center">
          <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <TrendingUp size={48} />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-2">تقرير تحليل التكاليف</h3>
          <p className="text-slate-400 max-w-sm mx-auto font-bold text-sm">برجاء اختيار الرحلة من القائمة أعلاه لعرض تحليل مفصل للتكاليف والإيرادات وصافي الأرباح</p>
        </div>
      )}

      {/* نافذة التعديل السريع */}
      {editingMovement && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">تعديل سريع</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{editingMovement.refNo || 'بدون مرجع'}</p>
                </div>
              </div>
              <button onClick={() => setEditingMovement(null)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8 space-y-6 text-right">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase mr-1">البيان والتفاصيل</label>
                <input 
                  type="text"
                  value={editForm.description}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase mr-1">المبلغ ({editingMovement.currency})</label>
                  <input 
                    type="number"
                    value={editForm.amount}
                    onChange={(e) => setEditForm({...editForm, amount: parseFloat(e.target.value) || 0})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                  />
                </div>
                {editingMovement.sourceType === 'TRANSACTION' && (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase mr-1">سعر الشراء / التكلفة</label>
                    <input 
                      type="number"
                      value={editForm.purchasePrice}
                      onChange={(e) => setEditForm({...editForm, purchasePrice: parseFloat(e.target.value) || 0})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={handleSave}
                className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg"
              >
                <Save size={20} /> حفظ التغييرات
              </button>
              <button 
                onClick={() => setEditingMovement(null)}
                className="px-8 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripAnalysisView;
