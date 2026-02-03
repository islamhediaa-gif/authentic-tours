
const fs = require('fs');
const path = require('path');

const filePath = 'D:/authentic_clean/App.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add missing refs at the start of the component
const componentStartMatch = content.match(/const App: React\.FC = \(\) => \{/);
if (componentStartMatch) {
    const insertIndex = componentStartMatch.index + componentStartMatch[0].length;
    const missingRefs = `
  const sessionId = useRef('session-' + Math.random().toString(36).substr(2, 9));
  const prevDataRef = useRef<any>({});
  const lastCloudTimestampRef = useRef<string | null>(null);
  const skipNextAutoSaveRef = useRef(false);`;
    content = content.slice(0, insertIndex) + missingRefs + content.slice(insertIndex);
}

// 2. Remove cloud state
content = content.replace(/const \[syncStatus, setSyncStatus\] = useState<.*?>\('idle'\);/g, '');

// 3. Remove manualPull and manualPush
content = content.replace(/const manualPull = useCallback\(async \(\) => \{[\s\S]*?\}, \[applyData, notify\]\);/g, '');
content = content.replace(/const manualPush = async \(force = false\) => \{[\s\S]*?\};/g, '');

// 4. Simplify applyData
content = content.replace(/const applyData = useCallback\(\(d: any, fromCloud = false, isDelta = false\) => \{[\s\S]*?\}, \[settings\.baseCurrency\]\);/g, 
`const applyData = useCallback((d: any) => {
    if (!d) return;
    
    if (d.settings) {
      setSettings(prev => ({ ...INITIAL_SETTINGS, ...prev, ...d.settings }));
      if (d.settings.baseCurrency) setDisplayCurrency(d.settings.baseCurrency);
    }
    
    if (d.transactions) setTransactions(d.transactions);
    if (d.customers) setCustomers(d.customers);
    if (d.suppliers) setSuppliers(d.suppliers);
    if (d.partners) setPartners(d.partners);
    if (d.treasuries) setTreasuries(d.treasuries);
    if (d.journalEntries) setJournalEntries(d.journalEntries);
    if (d.users) setUsers(d.users);
    if (d.currencies) setCurrencies(d.currencies);
    if (d.employees) setEmployees(d.employees);
    if (d.costCenters) setCostCenters(d.costCenters);
    if (d.shifts) setShifts(d.shifts);
    if (d.programs) setPrograms(d.programs);
    if (d.masterTrips) setMasterTrips(d.masterTrips);
    if (d.auditLogs) setAuditLogs(d.auditLogs);
    if (d.attendanceLogs) setAttendanceLogs(d.attendanceLogs);
    if (d.leaves) setLeaves(d.leaves);
    if (d.allowances) setAllowances(d.allowances);
    if (d.documents) setDocuments(d.documents);
    if (d.departments) setDepartments(d.departments);
    if (d.designations) setDesignations(d.designations);
    
    if (d.licenseInfo) setLicenseInfo(d.licenseInfo);
    
    prevDataRef.current = d;
  }, []);`);

// 5. Remove realtime subscription if exists
content = content.replace(/useEffect\(\(\) => \{[\s\S]*?DataService\.subscribeToBackups[\s\S]*?\}, \[applyData, currentUser\]\);/g, '');

// 6. Fix auto-save to be purely local
content = content.replace(/const autoSave = async \(\) => \{[\s\S]*?\};/g, 
`const autoSave = async () => {
    if (!isDataLoaded) return;
    
    const data = { 
      settings, transactions, customers, suppliers, partners, treasuries, programs, masterTrips,
      journalEntries, users, currencies, employees, costCenters, shifts, auditLogs, attendanceLogs,
      leaves, allowances, documents, departments, designations, licenseInfo,
      lastUpdated: new Date().toISOString(),
      senderSessionId: sessionId.current
    };
    
    await DataService.saveData(data, sessionId.current, true);
    setLastSaved(new Date().toLocaleTimeString());
  };`);

// 0. Always activated license info
content = content.replace(/licenseInfo,\s*setLicenseInfo\]\s*=\s*useState\(\{[\s\S]*?\}\);/g, 
`licenseInfo, setLicenseInfo] = useState({
    isActivated: true,
    licenseKey: 'NEBRAS-PRO-2026-PERPETUAL',
    machineId: getBrowserMachineId(),
    installationDate: new Date().toISOString()
  });`);

// Remove daysLeft
content = content.replace(/const \[daysLeft, setDaysLeft\] = useState\(3\);/g, '');

// Simplify handleStartApp to be purely local
content = content.replace(/const handleStartApp = async \(companyName\?: string\) => \{[\s\S]*?const verifyOTP =/g, 
`const handleStartApp = async (companyName?: string) => {
    setShowLanding(false);
  };

  const verifyOTP =`);

fs.writeFileSync(filePath, content);
console.log('App.tsx cleaned successfully');
