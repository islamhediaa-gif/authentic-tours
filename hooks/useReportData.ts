import { useMemo } from 'react';
import { Transaction, CostCenter, Program, JournalEntry, Customer, Supplier, Partner, Employee, Treasury, Currency, MasterTrip } from '../types';
import { getEffectiveRate } from '../utils/finance';
import { compareArabic } from '../utils/arabicUtils';

export const useCostCenterStats = (
  transactions: Transaction[],
  costCenters: CostCenter[],
  costCenterId: string,
  fromDate: string,
  toDate: string
) => {
  return useMemo(() => {
    const selectedCC = (costCenters || []).find(cc => cc.id === costCenterId);
    if (!selectedCC) return null;

    const ccTx = (transactions || []).filter(t => t && !t.isVoided && t.costCenterId === selectedCC.id && t.date >= fromDate && t.date <= toDate);
    
    const revenue = ccTx.filter(t => t && (t.type === 'INCOME' || t.type === 'REVENUE_ONLY')).reduce((s, t) => s + Number(t.amountInBase || 0), 0);
    const cost = ccTx.filter(t => t && (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY')).reduce((s, t) => s + Number(t.amountInBase || 0), 0) + 
                 ccTx.filter(t => t && t.type === 'INCOME').reduce((s, t) => s + Number(t.purchasePriceInBase || t.purchasePrice || 0), 0);
    
    const bookings = ccTx.filter(t => t && (t.type === 'INCOME' || t.type === 'REVENUE_ONLY')).reduce((s, t) => s + Number(t.adultCount || 0) + Number(t.childCount || 0) + Number(t.infantCount || 0) + Number(t.supervisorCount || 0) || 1, 0);
    const supervisors = ccTx.filter(t => t && (t.type === 'INCOME' || t.type === 'REVENUE_ONLY')).reduce((s, t) => s + Number(t.supervisorCount || 0), 0);

    const programData: Record<string, { id: string, name: string, revenue: number, cost: number, bookings: number, supervisors: number }> = {};
    ccTx.forEach(t => {
      const pid = t.programId || 'GENERAL';
      const pname = t.programName || (pid === 'GENERAL' ? 'عمليات عامة' : pid);
      if (!programData[pid]) programData[pid] = { id: pid, name: pname, revenue: 0, cost: 0, bookings: 0, supervisors: 0 };
      
      const amount = Number(t.amountInBase || 0);
      if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
        programData[pid].revenue += amount;
        programData[pid].cost += Number(t.purchasePriceInBase || t.purchasePrice || 0);
        programData[pid].bookings += Number(t.adultCount || 0) + Number(t.childCount || 0) + Number(t.infantCount || 0) + Number(t.supervisorCount || 0) || 1;
        programData[pid].supervisors += Number(t.supervisorCount || 0);
      } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
        programData[pid].cost += amount;
      }
    });

    return {
      revenue,
      cost,
      profit: revenue - cost,
      bookings,
      supervisors,
      programs: Object.values(programData)
    };
  }, [transactions, costCenters, fromDate, toDate]);
};

export const useHajjUmrahProgramStats = (
  programs: Program[],
  filteredTx: Transaction[]
) => {
  return useMemo(() => {
    const programData: Record<string, { 
      id: string, name: string, type: string, revenue: number, cost: number, bookings: number,
      revenueBreakdown: { bookings: number, flight: number, other: number },
      costBreakdown: { purchase: number, expenses: number, flights: number }
    }> = {};

    (programs || []).forEach(p => {
      programData[p.id] = { 
        id: p.id, name: p.name, type: p.type, revenue: 0, cost: 0, bookings: 0,
        revenueBreakdown: { bookings: 0, flight: 0, other: 0 },
        costBreakdown: { purchase: 0, expenses: 0, flights: 0 }
      };
    });

    (filteredTx || []).forEach(t => {
      if (t && t.programId) {
        if (!programData[t.programId]) {
          programData[t.programId] = { 
            id: t.programId, name: t.programName || t.programId, type: 'UNKNOWN', revenue: 0, cost: 0, bookings: 0,
            revenueBreakdown: { bookings: 0, flight: 0, other: 0 },
            costBreakdown: { purchase: 0, expenses: 0, flights: 0 }
          };
        }
        
        const amount = Number(t.amountInBase || 0);
        
        if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
          programData[t.programId].revenue += amount;
          
          if (t.category === 'HAJJ_UMRAH') {
            programData[t.programId].revenueBreakdown.bookings += amount;
          } else if (t.category === 'FLIGHT' || t.category === 'FLIGHT_REFUND' || t.category === 'FLIGHT_REISSUE') {
            programData[t.programId].revenueBreakdown.flight += amount;
          } else {
            programData[t.programId].revenueBreakdown.other += amount;
          }

          if (t.type === 'INCOME' && !t.isSaleOnly) {
            const pCost = Number(t.purchasePriceInBase || t.purchasePrice || 0);
            programData[t.programId].cost += pCost;
            programData[t.programId].costBreakdown.purchase += pCost;
          }
          programData[t.programId].bookings += Number(t.adultCount || 0) + Number(t.childCount || 0) + Number(t.infantCount || 0) + Number(t.supervisorCount || 0) || 1;
        } else if (t.type === 'EXPENSE' || t.type === 'PURCHASE_ONLY') {
          // التكاليف المباشرة المسجلة كـ Expense أو Purchase
          programData[t.programId].cost += amount;
          
          if (t.category === 'EXPENSE_GEN' || t.category === 'DOUBTFUL_DEBT') {
            programData[t.programId].costBreakdown.expenses += amount;
          } else if (t.category === 'FLIGHT' || t.category === 'FLIGHT_REFUND' || t.category === 'FLIGHT_REISSUE') {
            programData[t.programId].costBreakdown.flights += amount;
          } else {
            programData[t.programId].costBreakdown.purchase += amount;
          }
        }
      }
    });

    return Object.values(programData).filter(p => p.revenue > 0 || p.cost > 0);
  }, [programs, filteredTx]);
};

export const useTrialBalance = (
  filteredJournalEntries: JournalEntry[],
  customers: Customer[],
  suppliers: Supplier[],
  partners: Partner[],
  employees: Employee[],
  treasuries: Treasury[],
  currencies: Currency[],
  fromDate: string,
  toDate: string,
  transactions: Transaction[] = []
) => {
  return useMemo(() => {
    const balances: Record<string, { id: string, name: string, type: string, debit: number, credit: number, periodDebit: number, periodCredit: number, balanceInAccountCurrency: number }> = {};

    const jeToTxTypes = new Map<string, Set<string>>();
    const jeToProgramId = new Map<string, string>();
    const jeToMasterTripId = new Map<string, string>();
    const programBulkPurchases = new Set<string>();
    const categoryBulkPurchases = new Set<string>();

    (transactions || []).forEach(t => {
      if (t && t.journalEntryId) {
        if (!jeToTxTypes.has(t.journalEntryId)) jeToTxTypes.set(t.journalEntryId, new Set());
        let type = t.type || 'NORMAL';
        if (t.isSaleOnly) type = 'REVENUE_ONLY';
        if (t.isPurchaseOnly) type = 'PURCHASE_ONLY';
        jeToTxTypes.get(t.journalEntryId).add(type);
        
        if (t.programId) {
          jeToProgramId.set(t.journalEntryId, t.programId);
          if (t.isPurchaseOnly) programBulkPurchases.add(t.programId);
        }

        if (t.masterTripId) {
          jeToMasterTripId.set(t.journalEntryId, t.masterTripId);
        }
        
        if (t.isPurchaseOnly && t.category) {
          categoryBulkPurchases.add(t.category);
        }
      }
    });

    (customers || []).forEach(c => {
      const accountCurrency = c.openingBalanceCurrency || 'EGP';
      const accountRate = getEffectiveRate(c, accountCurrency, currencies);
      const obInBase = Number(c.openingBalanceInBase || 0);
      const obInCurrency = (Number(c.openingBalanceInBase || 0) || Number(c.openingBalance || 0) * accountRate) / accountRate;

      balances[`CUSTOMER-${c.id}`] = { 
        id: c.id, 
        name: c.name, 
        type: 'CUSTOMER', 
        debit: obInBase > 0 ? obInBase : 0, 
        credit: obInBase < 0 ? Math.abs(obInBase) : 0,
        periodDebit: 0,
        periodCredit: 0,
        balanceInAccountCurrency: obInCurrency
      };
    });
    (suppliers || []).forEach(s => {
      const accountCurrency = s.openingBalanceCurrency || 'EGP';
      const accountRate = getEffectiveRate(s, accountCurrency, currencies);
      const obInBase = Number(s.openingBalanceInBase || 0);
      const obInCurrency = (Number(s.openingBalanceInBase || 0) || Number(s.openingBalance || 0) * accountRate) / accountRate;

      balances[`SUPPLIER-${s.id}`] = { 
        id: s.id, 
        name: s.company || s.name, 
        type: 'SUPPLIER', 
        debit: obInBase < 0 ? Math.abs(obInBase) : 0, 
        credit: obInBase > 0 ? obInBase : 0,
        periodDebit: 0,
        periodCredit: 0,
        balanceInAccountCurrency: obInCurrency
      };
    });
    (partners || []).forEach(p => {
      const ob = Number(p.openingBalance || 0);
      balances[`PARTNER-${p.id}`] = { 
        id: p.id, 
        name: p.name, 
        type: 'PARTNER', 
        debit: ob < 0 ? Math.abs(ob) : 0, 
        credit: ob > 0 ? ob : 0,
        periodDebit: 0,
        periodCredit: 0,
        balanceInAccountCurrency: ob
      };
    });
    (employees || []).forEach(e => {
      const obPayable = Number(e.openingBalance || 0);
      const obAdvances = Number(e.openingAdvances || 0);
      if (obPayable !== 0) {
        balances[`LIABILITY-${e.id}`] = { 
          id: e.id, 
          name: `مستحقات: ${e.name}`, 
          type: 'LIABILITY', 
          debit: obPayable < 0 ? Math.abs(obPayable) : 0, 
          credit: obPayable > 0 ? obPayable : 0,
          periodDebit: 0,
          periodCredit: 0,
          balanceInAccountCurrency: obPayable
        };
      }
      if (obAdvances !== 0) {
        balances[`EMPLOYEE_ADVANCE-${e.id}`] = { 
          id: e.id, 
          name: `سلف: ${e.name}`, 
          type: 'EMPLOYEE_ADVANCE', 
          debit: obAdvances > 0 ? obAdvances : 0, 
          credit: obAdvances < 0 ? Math.abs(obAdvances) : 0,
          periodDebit: 0,
          periodCredit: 0,
          balanceInAccountCurrency: obAdvances
        };
      }
    });
    (treasuries || []).forEach(t => {
      const ob = Number(t.openingBalance || 0);
      balances[`TREASURY-${t.id}`] = { 
        id: t.id, 
        name: t.name, 
        type: 'TREASURY', 
        debit: ob > 0 ? ob : 0, 
        credit: ob < 0 ? Math.abs(ob) : 0,
        periodDebit: 0,
        periodCredit: 0,
        balanceInAccountCurrency: ob
      };
    });

    (filteredJournalEntries || []).forEach(entry => {
      // التحقق من التاريخ بشكل مرن للتعامل مع تنسيق PostgreSQL
      const entryDateStr = entry.date ? new Date(entry.date).toISOString().split('T')[0] : '';
      if (entryDateStr && entryDateStr <= toDate) {
        (entry.lines || []).forEach(line => {
          processLine(line, entryDateStr);
        });
      }
    });

    // Also process lines from transactions that are NOT linked to a journal entry
    (transactions || []).forEach(tx => {
      const txDateStr = tx.date ? new Date(tx.date).toISOString().split('T')[0] : '';
      if (txDateStr && txDateStr <= toDate && !tx.isVoided) {
        (tx.lines || []).forEach(line => {
          processLine(line, txDateStr);
        });
      }
    });

    function processLine(line: any, date: string) {
      const key = `${line.accountType}-${line.accountId}`;
      if (!balances[key]) {
        balances[key] = { 
          id: line.accountId, 
          name: line.accountName || line.accountId, 
          type: line.accountType, 
          debit: 0, 
          credit: 0,
          periodDebit: 0,
          periodCredit: 0,
          balanceInAccountCurrency: 0
        };
      }
      
      balances[key].debit += Number(line.debit || 0);
      balances[key].credit += Number(line.credit || 0);

      const entity = line.accountType === 'CUSTOMER' ? customers.find(c => String(c.id) === String(line.accountId)) :
                     line.accountType === 'SUPPLIER' ? suppliers.find(s => String(s.id) === String(line.accountId)) :
                     line.accountType === 'PARTNER' ? partners.find(p => String(p.id) === String(line.accountId)) :
                     (line.accountType === 'LIABILITY' || line.accountType === 'EMPLOYEE_ADVANCE') ? employees.find(e => String(e.id) === String(line.accountId)) :
                     line.accountType === 'TREASURY' ? treasuries.find(t => String(t.id) === String(line.accountId)) : null;
      
      if (entity) {
         const accountCurrency = (entity as any).openingBalanceCurrency || 'EGP';
         const accountRate = getEffectiveRate(entity, accountCurrency, currencies);
         const amount = (line.currencyCode === accountCurrency && line.originalAmount) 
           ? (Number(line.debit) > 0 ? Math.abs(Number(line.originalAmount)) : -Math.abs(Number(line.originalAmount))) 
           : (Number(line.debit || 0) - Number(line.credit || 0)) / accountRate;
         
         if (['CUSTOMER', 'TREASURY', 'EMPLOYEE_ADVANCE', 'ASSET'].includes(line.accountType)) {
           balances[key].balanceInAccountCurrency += amount;
         } else {
           balances[key].balanceInAccountCurrency -= amount;
         }
      }

      if (date >= fromDate) {
        balances[key].periodDebit += Number(line.debit || 0);
        balances[key].periodCredit += Number(line.credit || 0);
      }
    }

    return Object.values(balances).filter(b => b.debit !== 0 || b.credit !== 0);
  }, [filteredJournalEntries, customers, suppliers, partners, employees, treasuries, currencies, fromDate, toDate, transactions]);
};

export const useIncomeStatement = (trialBalance: any[], filteredJournalEntries: JournalEntry[] = []) => {
  return useMemo(() => {
    // الفئات الإدارية باللغتين لضمان التغطية الكاملة
    const ADMIN_CATEGORIES = [
      'SALARY', 'RENT', 'OFFICE', 'EXPENSE_GEN', 'MARKETING', 
      'COMMISSION_EXP', 'UTILITIES', 'MAINTENANCE', 'INTERNET', 
      'HOSPITALITY', 'STATIONERY', 'FEES', 'TAXES', 'INSURANCE',
      'رواتب', 'أجور', 'إيجار', 'كهرباء', 'مياه', 'غاز',
      'هاتف', 'اتصالات', 'دعاية', 'إعلان', 'مكتبية', 'مطبوعات',
      'بوفيه', 'ضيافة', 'نثريات', 'أخرى', 'صيانة', 'عمولات موظفين',
      'بريد', 'انترنت'
    ];

    let flightRev = 0, hajjUmrahRev = 0, serviceRev = 0;
    let flightCost = 0, hajjUmrahCost = 0, serviceCost = 0;
    let adminExpenses = 0;

    // لإصلاح التقرير الحالي، سنقوم بحساب التكلفة الحقيقية من القيود مباشرة
    // متجاوزين "القيود المرآتية" الناتجة عن الخطأ
    (filteredJournalEntries || []).forEach(entry => {
      const lines = entry.lines || [];
      const revLines = lines.filter(l => l.accountType === 'REVENUE');
      const revAmounts = revLines.map(r => Number(r.credit || 0)).filter(a => a > 0);

      lines.forEach(line => {
        const balance = Number(line.credit || 0) - Number(line.debit || 0);
        const costBalance = Number(line.debit || 0) - Number(line.credit || 0);
        const sid = (line.accountId || '').toUpperCase();
        const sname = (line.accountName || '');

        const isExcluded = sid.includes('CUSTOMER') || 
                           sid.includes('SUPPLIER') || 
                           sid.includes('TREASURY') || 
                           sid.includes('PARTNER') ||
                           sid.includes('CASH') ||
                           sid.includes('SETTLEMENT') ||
                           sname.includes('تسوية') ||
                           sname.includes('نقدية');

        if (isExcluded) return;

        if (line.accountType === 'REVENUE') {
          if (sid.includes('FLIGHT') || sname.includes('طيران')) flightRev += balance;
          else if (sid.includes('HAJJ') || sid.includes('UMRAH') || sname.includes('حج') || sname.includes('عمرة')) hajjUmrahRev += balance;
          else serviceRev += balance;
        } else if (line.accountType === 'EXPENSE') {
          const isAdmin = ADMIN_CATEGORIES.some(cat => sid.includes(cat.toUpperCase()) || sname.includes(cat));
          
          if (isAdmin) {
            adminExpenses += costBalance;
          } else {
            if (sid.includes('FLIGHT') || sname.includes('طيران')) flightCost += costBalance;
            else if (sid.includes('HAJJ') || sid.includes('UMRAH') || sname.includes('حج') || sname.includes('عمرة')) hajjUmrahCost += costBalance;
            else serviceCost += costBalance;
          }
        }
      });
    });

    const totalRevenue = flightRev + hajjUmrahRev + serviceRev;
    let totalDirectCost = flightCost + hajjUmrahCost + serviceCost;
    
    const grossProfit = totalRevenue - totalDirectCost;
    const netProfit = grossProfit - adminExpenses;

    return {
      totalRevenues: totalRevenue,
      totalDirectCosts: totalDirectCost,
      grossProfit,
      adminExpenses,
      netProfit,
      totalSales: totalRevenue,
      totalCost: totalDirectCost + adminExpenses,
      expenses: adminExpenses,
      flightRevenue: flightRev,
      hajjUmrahRevenue: hajjUmrahRev,
      serviceRevenue: serviceRev,
      flightCost,
      hajjUmrahCost,
      serviceCost,
      operatingProfit: netProfit
    };
  }, [trialBalance, filteredJournalEntries]);
};

export const useBalanceSheet = (trialBalance: any[]) => {
  return useMemo(() => {
    const assets = trialBalance.filter(b => 
      ['TREASURY', 'CUSTOMER', 'EMPLOYEE_ADVANCE', 'ASSET'].includes(b.type)
    ).reduce((s, b) => s + (Number(b.debit || 0) - Number(b.credit || 0)), 0);

    const liabilities = trialBalance.filter(b => 
      ['SUPPLIER', 'LIABILITY'].includes(b.type)
    ).reduce((s, b) => s + (Number(b.credit || 0) - Number(b.debit || 0)), 0);

    const partnersEquity = trialBalance.filter(b => 
      ['PARTNER', 'EQUITY'].includes(b.type)
    ).reduce((s, b) => s + (Number(b.credit || 0) - Number(b.debit || 0)), 0);

    const netProfitFromTB = trialBalance.reduce((s, b) => {
      if (b.type === 'REVENUE') return s + (Number(b.credit || 0) - Number(b.debit || 0));
      if (b.type === 'EXPENSE') return s - (Number(b.debit || 0) - Number(b.credit || 0));
      return s;
    }, 0);

    return { 
      assets, 
      liabilities, 
      partnersEquity, 
      currentNetProfit: netProfitFromTB,
      totalEquity: partnersEquity + netProfitFromTB
    };
  }, [trialBalance]);
};

export const useMasterTripStats = (
  masterTrips: MasterTrip[],
  filteredJournalEntries: JournalEntry[],
  transactions: Transaction[]
) => {
  return useMemo(() => {
    const tripData: Record<string, { id: string, name: string, type: string, revenue: number, cost: number, bookings: number, programs: string[] }> = {};

    (masterTrips || []).forEach(mt => {
      tripData[mt.id] = { id: mt.id, name: mt.name, type: mt.type, revenue: 0, cost: 0, bookings: 0, programs: [] };
    });

    const jeToTripId = new Map<string, string>();
    (transactions || []).forEach(t => {
      if (t.journalEntryId && t.masterTripId) {
        jeToTripId.set(t.journalEntryId, t.masterTripId);
      }
    });

    (filteredJournalEntries || []).forEach(je => {
      const tripId = jeToTripId.get(je.id);
      if (tripId && tripData[tripId]) {
        je.lines.forEach(l => {
          if (l.accountType === 'REVENUE') {
            tripData[tripId].revenue += (Number(l.credit || 0) - Number(l.debit || 0));
          } else if (l.accountType === 'EXPENSE' && !['SALARY', 'RENT', 'OFFICE'].includes(l.accountId)) {
            tripData[tripId].cost += (Number(l.debit || 0) - Number(l.credit || 0));
          } else if (l.accountType === 'ASSET' && l.accountId === 'ASSET_GUARANTEES') {
            tripData[tripId].cost += (Number(l.debit || 0) - Number(l.credit || 0));
          }
        });
      }
    });

    // Add booking counts from transactions
    (transactions || []).forEach(t => {
      if (t && t.masterTripId && tripData[t.masterTripId]) {
        if (t.type === 'INCOME' || t.type === 'REVENUE_ONLY') {
          tripData[t.masterTripId].bookings += Number((t.adultCount || 0) + (t.childCount || 0) + (t.infantCount || 0) + (t.supervisorCount || 0) || 1);
        }
        if (t.programId && !tripData[t.masterTripId].programs.includes(t.programId)) {
          tripData[t.masterTripId].programs.push(t.programId);
        }
      }
    });

    return Object.values(tripData).filter(p => p.revenue > 0 || p.cost > 0);
  }, [masterTrips, filteredJournalEntries, transactions]);
};

export const useAgingData = (
  customers: Customer[],
  suppliers: Supplier[],
  filteredJournalEntries: JournalEntry[],
  balanceMap: Record<string, { base: number, currency: number }>,
  toDate: string
) => {
  return useMemo(() => {
    const referenceDate = new Date(toDate);
    const calculateAging = (entities: any[], type: 'CUSTOMER' | 'SUPPLIER') => {
      return (entities || []).map(entity => {
        const balanceData = balanceMap[`${type}-${entity.id}`];
        const balance = balanceData?.base || 0;
        const aging = { current: 0, 30: 0, 60: 0, over90: 0, total: balance };
        if (balance <= 0) return { ...entity, ...aging };

        const movements = (filteredJournalEntries || [])
          .filter(je => je.date <= toDate && je.lines && je.lines.some(l => l.accountId === entity.id && l.accountType === type))
          .map(je => {
            const line = je.lines.find(l => l.accountId === entity.id && l.accountType === type);
            return { date: new Date(je.date), amount: line ? Number(type === 'CUSTOMER' ? (line.debit || 0) : (line.credit || 0)) : 0 };
          })
          .filter(m => m.amount > 0)
          .sort((a, b) => b.date.getTime() - a.date.getTime());

        let remainingBalance = balance;
        
        movements.forEach(m => {
          if (remainingBalance <= 0) return;
          const diffDays = Math.floor((referenceDate.getTime() - m.date.getTime()) / (1000 * 60 * 60 * 24));
          const allocated = Math.min(m.amount, remainingBalance);
          
          if (diffDays <= 30) aging.current += allocated;
          else if (diffDays <= 60) aging[30] += allocated;
          else if (diffDays <= 90) aging[60] += allocated;
          else aging.over90 += allocated;
          
          remainingBalance -= allocated;
        });

        if (remainingBalance > 0) aging.over90 += remainingBalance;

        return { ...entity, ...aging };
      }).filter(e => (e.total || 0) > 0);
    };

    return {
      customers: calculateAging(customers, 'CUSTOMER'),
      suppliers: calculateAging(suppliers, 'SUPPLIER')
    };
  }, [customers, suppliers, filteredJournalEntries, balanceMap, toDate]);
};

export const useAnalytics = (
  stats: any,
  employees: Employee[],
  filteredTx: Transaction[],
  currentUser: any
) => {
  return useMemo(() => {
    const profitByService = [
      { name: 'الطيران', profit: stats.flightRevenue - stats.flightCost },
      { name: 'الحج والعمرة', profit: stats.hajjUmrahRevenue - stats.hajjUmrahCost },
      { name: 'الخدمات العامة', profit: stats.serviceRevenue - stats.serviceCost }
    ];

    const employeePerf = (employees || [])
      .filter(emp => currentUser.role === 'ADMIN' || compareArabic(emp.name, currentUser.name))
      .map(emp => {
        const empTx = (filteredTx || []).filter(t => t && t.employeeId === emp.id);
        const totalVolume = empTx.reduce((s, t) => s + Number(t.amountInBase || (t.sellingPrice || 0) * (t.exchangeRate || 1)), 0);
        const totalCommission = empTx.reduce((s, t) => {
          if (t.commissionAmount && t.commissionAmount > 0) {
            return s + Number(t.commissionAmount);
          }
          if (t.applyCommission === false) return s;
          
          const empRate = Number((t.employeeCommissionRate && t.employeeCommissionRate !== 0) 
                          ? t.employeeCommissionRate 
                          : (employees.find(e => e.id === t.employeeId)?.commissionRate || 0));
          if (!empRate) return s;

          const rate = Number(t.exchangeRate || 1);
          const sellBase = (Number(t.sellingPrice || 0) - Number(t.discount || 0)) * rate;
          const buyBase = Number(t.purchasePrice || (t.type === 'PURCHASE_ONLY' || t.isPurchaseOnly ? t.amount : 0) || 0) * rate;
          
          let commission = 0;
          const profit = sellBase - buyBase;
          
          if (profit > 0) {
            commission = profit * (empRate / 100);
          } else if (buyBase > 0 && (t.type === 'PURCHASE_ONLY' || t.isPurchaseOnly)) {
            commission = buyBase * (empRate / 100);
          }
          
          return s + commission;
        }, 0);
        return { id: emp.id, name: emp.name, volume: totalVolume, commission: totalCommission };
      }).sort((a, b) => b.volume - a.volume);

    return { profitByService, employeePerf };
  }, [stats, employees, filteredTx, currentUser]);
};

export const useLedgerData = (
  activeReport: string,
  selectedId: string,
  filteredJournalEntries: JournalEntry[],
  fromDate: string,
  toDate: string,
  effectiveSearchTerm: string,
  customers: Customer[],
  suppliers: Supplier[],
  employees: Employee[],
  partners: Partner[],
  treasuries: Treasury[],
  currencies: Currency[],
  transactions: Transaction[] = []
) => {
  const getOpeningBalance = () => {
    if (!selectedId) return 0;
    
    if (activeReport === 'TREASURY_REPORT') {
      const treasury = (treasuries || []).find(t => t.id === selectedId);
      if (!treasury) return 0;
      let priorNet = 0;
      (filteredJournalEntries || []).forEach(entry => {
        if (entry.date < fromDate) {
          (entry.lines || []).forEach(line => {
            if (line.accountId === selectedId && line.accountType === 'TREASURY') {
              priorNet += (Number(line.debit || 0) - Number(line.credit || 0));
            }
          });
        }
      });
      return Number(treasury.openingBalance || 0) + priorNet;
    }

    const isCustomer = activeReport === 'CUSTOMER_LEDGER';
    const isEmployee = activeReport === 'EMPLOYEE_LEDGER';
    const isPartner = activeReport === 'PARTNER_LEDGER';
    const isAdvance = activeReport === 'EMPLOYEE_ADVANCE';
    const accountType = isCustomer ? 'CUSTOMER' : isEmployee ? 'LIABILITY' : isPartner ? 'PARTNER' : isAdvance ? 'EMPLOYEE_ADVANCE' : 'SUPPLIER';

    const entity = isCustomer 
      ? (customers || []).find(x => x.id === selectedId) 
      : (isEmployee || isAdvance)
        ? (employees || []).find(x => x.id === selectedId) 
        : isPartner
          ? (partners || []).find(x => x.id === selectedId)
          : (suppliers || []).find(x => x.id === selectedId);
    
    if (!entity) return 0;

    const accountCurrency = (entity as any).openingBalanceCurrency || 'EGP';
    const accountRate = getEffectiveRate(entity, accountCurrency, currencies);

    let priorNetInAccountCurrency = 0;

    (filteredJournalEntries || []).forEach(entry => {
      if (entry && entry.date < fromDate) {
        (entry.lines || []).forEach(line => {
          if (line && line.accountId === selectedId && line.accountType === accountType) {
            const amount = (line.currencyCode === accountCurrency && line.originalAmount) 
              ? Number(line.originalAmount) 
              : Number(line.debit || line.credit) / accountRate;
            
            if (Number(line.debit) > 0) priorNetInAccountCurrency += amount;
            else priorNetInAccountCurrency -= amount;
          }
        });
      }
    });

    let openingInAccountCurrency = 0;
    if (accountType === 'CUSTOMER' || accountType === 'SUPPLIER') {
      openingInAccountCurrency = Number((entity as any).openingBalanceInBase || (entity as any).openingBalance || 0) / accountRate;
    } else if (accountType === 'PARTNER' || accountType === 'LIABILITY') {
      openingInAccountCurrency = Number((entity as any).openingBalance || 0) / accountRate;
    } else if (accountType === 'EMPLOYEE_ADVANCE') {
      openingInAccountCurrency = Number((entity as any).openingAdvances || 0) / accountRate;
    }
    
    if (accountType === 'CUSTOMER' || accountType === 'EMPLOYEE_ADVANCE') {
      return openingInAccountCurrency + priorNetInAccountCurrency;
    } else {
      return openingInAccountCurrency - priorNetInAccountCurrency;
    }
  };

  return useMemo(() => {
    if (!selectedId) return { entries: [], openingBalance: 0 };
    
    const openingBalance = getOpeningBalance();
    const isTreasury = activeReport === 'TREASURY_REPORT';
    const entries: any[] = [];
    
    if (isTreasury) {
      (filteredJournalEntries || []).forEach(entry => {
        if (entry && entry.date >= fromDate && entry.date <= toDate) {
          const line = (entry.lines || []).find(l => l.accountId === selectedId && l.accountType === 'TREASURY');
          if (line) {
            if (effectiveSearchTerm) {
              const s = effectiveSearchTerm.toLowerCase();
              if (!((entry.description || '').toLowerCase().includes(s) || (entry.refNo || '').toLowerCase().includes(s))) return;
            }
            entries.push({
              date: entry.date || '',
              description: entry.description || '',
              refNo: entry.refNo || '',
              debit: Number(line.debit || 0),
              credit: Number(line.credit || 0),
              id: entry.id,
              type: Number(line.debit || 0) > 0 ? 'INCOME' : 'EXPENSE',
              costCenterId: line.costCenterId,
              programId: line.programId
            });
          }
        }
      });
    } else {
      const isCustomer = activeReport === 'CUSTOMER_LEDGER';
      const isEmployee = activeReport === 'EMPLOYEE_LEDGER';
      const isPartner = activeReport === 'PARTNER_LEDGER';
      const isAdvance = activeReport === 'EMPLOYEE_ADVANCE';
      const accountType = isCustomer ? 'CUSTOMER' : isEmployee ? 'LIABILITY' : isPartner ? 'PARTNER' : isAdvance ? 'EMPLOYEE_ADVANCE' : 'SUPPLIER';

      const entity = isCustomer ? (customers || []).find(x => x.id === selectedId) :
                     (isEmployee || isAdvance) ? (employees || []).find(x => x.id === selectedId) :
                     isPartner ? (partners || []).find(x => x.id === selectedId) :
                     (suppliers || []).find(x => x.id === selectedId);

      const accountCurrency = (entity as any)?.openingBalanceCurrency || 'EGP';
      const accountRate = getEffectiveRate(entity, accountCurrency, currencies);

      (filteredJournalEntries || []).forEach(entry => {
        if (entry && entry.date >= fromDate && entry.date <= toDate) {
          const line = (entry.lines || []).find(l => l.accountId === selectedId && l.accountType === accountType);
          if (line) {
            if (effectiveSearchTerm) {
              const s = effectiveSearchTerm.toLowerCase();
              if (!((entry.description || '').toLowerCase().includes(s) || (entry.refNo || '').toLowerCase().includes(s))) return;
            }
            
            const amountInAccountCurrency = (line.currencyCode === accountCurrency && line.originalAmount)
              ? Number(line.originalAmount)
              : Number(line.debit || line.credit) / accountRate;

            entries.push({
              date: entry.date || '',
              description: entry.description || '',
              refNo: entry.refNo || '',
              debit: Number(line.debit) > 0 ? amountInAccountCurrency : 0,
              credit: Number(line.credit) > 0 ? amountInAccountCurrency : 0,
              id: entry.id,
              type: Number(line.debit) > 0 ? 'DEBIT' : 'CREDIT',
              costCenterId: line.costCenterId,
              programId: line.programId
            });
          }
        }
      });
    }

    const sorted = entries.sort((a, b) => (a?.date || '').localeCompare(b?.date || ''));
    let runningBalance = openingBalance;
    const isCustomer = activeReport === 'CUSTOMER_LEDGER';
    const isAdvance = activeReport === 'EMPLOYEE_ADVANCE';

    const mappedEntries = sorted.map(e => {
      if (isTreasury || isCustomer || isAdvance) runningBalance += (e.debit - e.credit);
      else runningBalance += (e.credit - e.debit);
      return { ...e, runningBalance };
    });

    return { entries: mappedEntries, openingBalance };
  }, [filteredJournalEntries, selectedId, fromDate, toDate, activeReport, effectiveSearchTerm, currencies, customers, suppliers, employees, partners, treasuries, transactions]);
};
