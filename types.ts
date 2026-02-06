
export type TransactionType = 'INCOME' | 'EXPENSE' | 'SETTLEMENT' | 'TRANSFER' | 'JOURNAL' | 'CLEARING' | 'PARTNER_WITHDRAWAL' | 'ADVANCE_PAYMENT' | 'ADVANCE_DEDUCTION' | 'PURCHASE_ONLY' | 'REVENUE_ONLY';
export type ServiceType = 'FLIGHT' | 'FLIGHT_REFUND' | 'FLIGHT_REISSUE' | 'HAJJ' | 'UMRAH' | 'INDIVIDUAL_UMRAH' | 'HAJJ_UMRAH' | 'GENERAL_SERVICE' | 'OTHER' | 'TRANSFER' | 'EXPENSE_GEN' | 'EXPENSE' | 'ACCOMMODATION' | 'CLEARING' | 'DOUBTFUL_DEBT' | 'REFUND' | 'JOURNAL_ENTRY' | 'CASH' | 'ACCOUNT_CLEARING' | 'PARTNER_WITHDRAWAL' | 'EMPLOYEE_ADVANCE' | 'GUARANTEE_LETTER' | 'GIFTS_AND_PRINTS' | 'REFUND_SERVICE' | 'HOTEL' | 'FLIGHT_TICKET' | 'VISA';

export interface CompanySettings {
  name: string;
  logo: string;
  accountantName: string;
  baseCurrency: string;
  autoUpdateCurrency?: boolean;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  facebook?: string;
  enableCostCenters?: boolean;
  geminiApiKey?: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  role: 'ADMIN' | 'USER' | 'BOOKING_EMPLOYEE';
  permissions: string[];
  employeeId?: string;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string;
  rateToMain: number;
  previousRate?: number;
  lastUpdated?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  openingBalance: number;
  openingBalanceCurrency: string;
  openingBalanceInBase: number;
  balance: number;
  currencyBalance: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  company: string;
  openingBalance: number;
  openingBalanceCurrency: string;
  openingBalanceInBase: number;
  balance: number;
  currencyBalance: number;
  isSaudiWallet?: boolean;
  visaQuota?: number;
}

export interface Partner {
  id: string;
  name: string;
  balance: number;
  openingBalance?: number;
}

export interface Employee {
  id: string;
  name: string;
  phone: string;
  basicSalary: number;
  commissionRate: number; 
  position: string;
  joiningDate: string;
  balance: number;
  advances: number;
  openingBalance?: number;
  openingAdvances?: number;
  fingerprintId?: string; 
  shiftId?: string; 
  departmentId?: string;
  designationId?: string;
  leaveBalance?: number;
  paidSalaries?: string[]; // Array of "YYYY-MM"
  paidCommissions?: string[]; // Array of "YYYY-MM"
}

export interface Department {
  id: string;
  name: string;
}

export interface Designation {
  id: string;
  name: string;
  departmentId: string;
}

export interface EmployeeLeave {
  id: string;
  employeeId: string;
  type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER';
  startDate: string;
  endDate: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
}

export interface EmployeeAllowance {
  id: string;
  employeeId: string;
  name: string;
  amount: number;
  type: 'FIXED' | 'PERCENTAGE'; 
  isMonthly: boolean;
}

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  name: string;
  type: string; 
  expiryDate?: string;
  filePath?: string;
}

export interface EmployeeSettlement {
  id: string;
  employeeId: string;
  amount: number;
  type: 'BONUS' | 'DEDUCTION';
  reason: string;
  date: string;
}

export interface Shift {
  id: string;
  name: string;
  startTime: string; // مثال: "09:00"
  endTime: string;   // مثال: "17:00"
  gracePeriod: number; // فترة السماح بالدقائق (مثال: 15 دقيقة)
  deductionRate: number; // قيمة الخصم لكل ساعة تأخير أو مبلغ ثابت
  deductionType: 'FIXED' | 'HOURLY_PERCENT'; 
}

export interface Treasury {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'WALLET' | 'CUSTODY';
  openingBalance: number;
  currencyCode?: string;
  exchangeRate?: number;
  balance: number;
}

export interface UmrahComponent {
  id: string;
  type: 'FLIGHT' | 'VISA' | 'HOTEL' | 'INTERNAL_TRANSPORT' | 'SAUDI_TRANSPORT' | 'EXPENSE' | 'GUARANTEE_LETTER' | 'GIFTS_AND_PRINTS';
  name: string;
  pricingMode?: 'PER_PERSON' | 'TOTAL';
  quantity?: number;
  purchasePrice: number;
  sellingPrice: number;
  adultPurchasePrice?: number;
  childPurchasePrice?: number;
  infantPurchasePrice?: number;
  singlePurchasePrice?: number;
  singleChildPurchasePrice?: number;
  singleInfantPurchasePrice?: number;
  doublePurchasePrice?: number;
  doubleChildPurchasePrice?: number;
  doubleInfantPurchasePrice?: number;
  triplePurchasePrice?: number;
  tripleChildPurchasePrice?: number;
  tripleInfantPurchasePrice?: number;
  quadPurchasePrice?: number;
  quadChildPurchasePrice?: number;
  quadInfantPurchasePrice?: number;
  adultSellingPrice?: number;
  childSellingPrice?: number;
  infantSellingPrice?: number;
  singleSellingPrice?: number;
  singleChildSellingPrice?: number;
  singleInfantSellingPrice?: number;
  doubleSellingPrice?: number;
  doubleChildSellingPrice?: number;
  doubleInfantSellingPrice?: number;
  tripleSellingPrice?: number;
  tripleChildSellingPrice?: number;
  tripleInfantSellingPrice?: number;
  quadSellingPrice?: number;
  quadChildSellingPrice?: number;
  quadInfantSellingPrice?: number;
  originalPurchasePrice: number;
  originalSellingPrice: number;
  originalAdultPurchasePrice?: number;
  originalChildPurchasePrice?: number;
  originalInfantPurchasePrice?: number;
  originalSinglePurchasePrice?: number;
  originalSingleChildPurchasePrice?: number;
  originalSingleInfantPurchasePrice?: number;
  originalDoublePurchasePrice?: number;
  originalDoubleChildPurchasePrice?: number;
  originalDoubleInfantPurchasePrice?: number;
  originalTriplePurchasePrice?: number;
  originalTripleChildPurchasePrice?: number;
  originalTripleInfantPurchasePrice?: number;
  originalQuadPurchasePrice?: number;
  originalQuadChildPurchasePrice?: number;
  originalQuadInfantPurchasePrice?: number;
  originalAdultSellingPrice?: number;
  originalChildSellingPrice?: number;
  originalInfantSellingPrice?: number;
  originalSingleSellingPrice?: number;
  originalSingleChildSellingPrice?: number;
  originalSingleInfantSellingPrice?: number;
  originalDoubleSellingPrice?: number;
  originalDoubleChildSellingPrice?: number;
  originalDoubleInfantSellingPrice?: number;
  originalTripleSellingPrice?: number;
  originalTripleChildSellingPrice?: number;
  originalTripleInfantSellingPrice?: number;
  originalQuadSellingPrice?: number;
  originalQuadChildSellingPrice?: number;
  originalQuadInfantSellingPrice?: number;
  currencyCode: string;
  exchangeRate: number;
  supplierId?: string;
  supplierType?: 'SUPPLIER' | 'CUSTOMER' | 'TREASURY';
  isCommissionable?: boolean;
  employeeId?: string;
  commissionAmount?: number;
  discount?: number;
  details?: string;
  isPosted?: boolean;
}

export interface Program {
  id: string;
  name: string;
  masterTripId?: string;
  customerId?: string;
  supplierId: string;
  supplierType?: 'SUPPLIER' | 'CUSTOMER' | 'TREASURY';
  purchasePrice: number;
  sellingPrice: number;
  adultPurchasePrice?: number;
  childPurchasePrice?: number;
  infantPurchasePrice?: number;
  singlePurchasePrice?: number;
  singleChildPurchasePrice?: number;
  singleInfantPurchasePrice?: number;
  doublePurchasePrice?: number;
  doubleChildPurchasePrice?: number;
  doubleInfantPurchasePrice?: number;
  triplePurchasePrice?: number;
  tripleChildPurchasePrice?: number;
  tripleInfantPurchasePrice?: number;
  quadPurchasePrice?: number;
  quadChildPurchasePrice?: number;
  quadInfantPurchasePrice?: number;
  adultSellingPrice?: number;
  childSellingPrice?: number;
  infantSellingPrice?: number;
  singleSellingPrice?: number;
  singleChildSellingPrice?: number;
  singleInfantSellingPrice?: number;
  doubleSellingPrice?: number;
  doubleChildSellingPrice?: number;
  doubleInfantSellingPrice?: number;
  tripleSellingPrice?: number;
  tripleChildSellingPrice?: number;
  tripleInfantSellingPrice?: number;
  quadSellingPrice?: number;
  quadChildSellingPrice?: number;
  quadInfantSellingPrice?: number;
  
  // Agent Pricing (Net Rates)
  adultAgentPrice?: number;
  childAgentPrice?: number;
  infantAgentPrice?: number;
  singleAgentPrice?: number;
  doubleAgentPrice?: number;
  tripleAgentPrice?: number;
  quadAgentPrice?: number;

  type: 'HAJJ' | 'UMRAH' | 'INDIVIDUAL_UMRAH' | 'GENERAL';
  date: string;
  currencyCode: string;
  exchangeRate: number;
  components?: UmrahComponent[];
  adultCount?: number;
  childCount?: number;
  infantCount?: number;
  // Counts for all room types
  singleAdultCount?: number;
  singleChildCount?: number;
  singleInfantCount?: number;
  doubleAdultCount?: number;
  doubleChildCount?: number;
  doubleInfantCount?: number;
  tripleAdultCount?: number;
  tripleChildCount?: number;
  tripleInfantCount?: number;
  quadAdultCount?: number;
  quadChildCount?: number;
  quadInfantCount?: number;
  roomType?: 'DEFAULT' | 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD';
  isAgent?: boolean;
  employeeId?: string;
  employeeCommissionRate?: number;
  commissionAmount?: number;
  applyCommission?: boolean;
}

export interface MasterTrip {
  id: string;
  name: string;
  date: string;
  type: 'HAJJ' | 'UMRAH' | 'GENERAL';
  details?: string;
  isVoided?: boolean;
  components?: UmrahComponent[];
  accommodation?: {
    mecca: {
      hotelName: string;
      rooms: Room[];
    };
    medina: {
      hotelName: string;
      rooms: Room[];
    };
  };
}

export interface Room {
  id: string;
  roomNumber: string;
  roomType: string;
  names: string[];
  occupantEntities?: {
    [index: number]: {
      agentId?: string;
      agentName?: string;
      customerType?: 'DIRECT' | 'AGENT' | 'SUPERVISOR' | 'SUPPLIER';
      sellingPrice?: number;
      purchasePrice?: number;
      discount?: number;
      personType?: 'ADULT' | 'CHILD' | 'INFANT';
    };
  };
  programId?: string;
  customerType?: 'DIRECT' | 'AGENT' | 'SUPERVISOR';
  agentId?: string;
  agentName?: string;
  supervisorName?: string;
  pricingMode?: 'PER_PERSON' | 'TOTAL' | 'INDIVIDUAL';
  purchasePrice?: number;
  sellingPrice?: number;
  totalAmount?: number;
  employeeId?: string;
  employeeCommissionRate?: number;
  commissionAmount?: number;
  costCenterId?: string;
  isPosted?: boolean;
  postedAmount?: number;
  postingDate?: string;
  discount?: number;
  exchangeRate?: number;
}

export interface CostCenter {
  id: string;
  name: string;
  code?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export interface JournalLine {
  id: string;
  accountId: string;
  accountType: 'CUSTOMER' | 'SUPPLIER' | 'TREASURY' | 'EXPENSE' | 'REVENUE' | 'ASSET' | 'LIABILITY' | 'EQUITY' | 'PARTNER' | 'EMPLOYEE_ADVANCE';
  accountName: string;
  debit: number;
  credit: number;
  currencyCode?: string;
  exchangeRate?: number;
  originalAmount?: number;
  costCenterId?: string;
  programId?: string;
  componentId?: string;
}

export interface JournalEntry {
  id: string;
  refNo?: string;
  date: string;
  description: string;
  lines: JournalLine[];
  totalAmount: number;
}

export interface Transaction {
  id: string;
  refNo?: string;
  date: string;
  description: string;
  amount: number;
  amountInBase: number;
  currencyCode: string;
  exchangeRate: number;
  type: TransactionType;
  category: ServiceType;
  relatedEntityId?: string; 
  relatedEntityType?: 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'PARTNER';
  treasuryId?: string;
  targetEntityId?: string; 
  targetEntityType?: 'CUSTOMER' | 'SUPPLIER' | 'EMPLOYEE' | 'PARTNER';
  isVoided?: boolean; 
  
  pnr?: string;
  ticketNumber?: string;
  passengerName?: string;
  route?: string;
  airlineCode?: string;
  purchasePrice?: number;
  purchasePriceInBase?: number;
  sellingPrice?: number;
  sellingPriceInBase?: number;
  discount?: number; 
  discountInBase?: number;
  supplierId?: string; 
  supplierType?: 'SUPPLIER' | 'CUSTOMER' | 'TREASURY';
  isSaleOnly?: boolean;
  isPurchaseOnly?: boolean;
  
  programId?: string;
  programName?: string;
  masterTripId?: string;
  bookingType?: 'DIRECT' | 'AGENT' | 'SUPERVISOR';
  agentId?: string;
  adultCount?: number;
  childCount?: number;
  infantCount?: number;
  supervisorCount?: number;
  supervisorName?: string;
  roomType?: 'DEFAULT' | 'SINGLE' | 'DOUBLE' | 'TRIPLE' | 'QUAD';
  accommodation?: string; 
  expenseCategory?: string; 
  journalEntryId?: string;
  
  employeeId?: string; 
  employeeCommissionRate?: number;
  commissionAmount?: number;
  accommodationEmployeeId?: string;
  parentTransactionId?: string;
  bookingGroupId?: string;
  visaStatus?: 'PENDING' | 'IN_PROCESS' | 'ISSUED' | 'CANCELLED';
  visaIssuedCount?: number;
  costCenterId?: string;
  applyCommission?: boolean;
  roomId?: string;
  occupantIndex?: number;
  componentId?: string;
  names?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VOID' | 'LOGIN' | 'EXPORT';
  entityType: 'TRANSACTION' | 'JOURNAL_ENTRY' | 'CUSTOMER' | 'SUPPLIER' | 'TREASURY' | 'EMPLOYEE' | 'SETTINGS' | 'MASTER_TRIP' | 'LEAVE' | 'ALLOWANCE' | 'DOCUMENT' | 'DEPARTMENT' | 'DESIGNATION' | 'SETTLEMENT';
  entityId: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  CUSTOMERS = 'CUSTOMERS',
  SUPPLIERS = 'SUPPLIERS',
  EMPLOYEES = 'EMPLOYEES',
  TREASURY = 'TREASURY',
  FLIGHTS = 'FLIGHTS',
  HAJJ_UMRAH = 'HAJJ_UMRAH',
  SERVICES = 'SERVICES',
  EXPENSES = 'EXPENSES',
  JOURNAL = 'JOURNAL',
  REPORTS = 'REPORTS',
  SETTINGS = 'SETTINGS',
  USERS = 'USERS',
  YEAR_END = 'YEAR_END',
  CLEARING = 'CLEARING',
  TRIP_COST_ANALYSIS = 'TRIP_COST_ANALYSIS',
  ACCOMMODATION = 'ACCOMMODATION',
  PROGRAM_BUILDER = 'PROGRAM_BUILDER',
  FINGERPRINT = 'FINGERPRINT',
  PROFILE = 'PROFILE'
}

export interface AttendanceLog {
  id?: string;
  userSn: number;
  deviceUserId: string;
  recordTime: string;
  ip: string;
}

export interface CompanyData {
  customers: Customer[];
  suppliers: Supplier[];
  partners: Partner[];
  employees: Employee[];
  treasuries: Treasury[];
  currencies: Currency[];
  transactions: Transaction[];
  journalEntries: JournalEntry[];
  costCenters: CostCenter[];
  departments: Department[];
  designations: Designation[];
  attendanceLogs: AttendanceLog[];
  shifts: Shift[];
  leaves: EmployeeLeave[];
  allowances: EmployeeAllowance[];
  documents: EmployeeDocument[];
  settlements: EmployeeSettlement[];
  auditLogs: AuditLog[];
  masterTrips: MasterTrip[];
  settings: CompanySettings;
  lastUpdated?: string;
}
