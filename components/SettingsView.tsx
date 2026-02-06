
import React, { useState, useRef } from 'react';
import { Save, Briefcase, UserCheck, Upload, Trash2, Coins, Plus, Download, RefreshCw, Key, Shield, Info, Image as ImageIcon, CheckCircle2, AlertCircle, Mail, Phone, Globe, MapPin, Facebook, Clock, Building2, Award, Sparkles, Eye, CloudUpload, CloudDownload } from 'lucide-react';
import { CompanySettings, Currency, User, Partner, CostCenter, AuditLog, Shift, Department, Designation } from '../types';

interface SettingsViewProps {
  settings: CompanySettings;
  setSettings: React.Dispatch<React.SetStateAction<CompanySettings>>;
  currencies: Currency[];
  setCurrencies: React.Dispatch<React.SetStateAction<Currency[]>>;
  deleteCurrency: (code: string) => void;
  partners: Partner[];
  setPartners: React.Dispatch<React.SetStateAction<Partner[]>>;
  deletePartner: (id: string) => void;
  fullData: any;
  onRestore: (data: any) => void;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  currentUser: User | null;
  formatCurrency: (amount: number) => string;
  costCenters: CostCenter[];
  addCostCenter: (center: Omit<CostCenter, 'id' | 'createdAt'>) => void;
  updateCostCenter: (id: string, updates: Partial<CostCenter>) => void;
  deleteCostCenter: (id: string) => void;
  auditLogs: AuditLog[];
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  deleteShift: (id: string) => void;
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
  deleteDepartment: (id: string) => void;
  designations: Designation[];
  setDesignations: React.Dispatch<React.SetStateAction<Designation[]>>;
  deleteDesignation: (id: string) => void;
  licenseInfo?: any;
  onActivate?: (key: string) => void;
  onRepairAttribution?: () => void;
  onManualPull?: () => Promise<void>;
  onManualPush?: () => Promise<void>;
  onNavigate?: (view: string, entityId?: string) => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  settings, setSettings, currencies, setCurrencies, deleteCurrency, 
  partners, setPartners, deletePartner, fullData, onRestore, 
  users, setUsers, currentUser, formatCurrency,
  costCenters, addCostCenter, updateCostCenter, deleteCostCenter, auditLogs,
  shifts, setShifts, deleteShift,
  departments, setDepartments, deleteDepartment,
  designations, setDesignations, deleteDesignation,
  licenseInfo, onActivate, onRepairAttribution, onManualPull, onManualPush, onNavigate
}) => {
  const [formData, setFormData] = useState<CompanySettings>(settings);
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'CURRENCIES' | 'SECURITY' | 'BACKUP' | 'PARTNERS' | 'COST_CENTERS' | 'AUDIT' | 'SHIFTS' | 'DEPARTMENTS' | 'DESIGNATIONS' | 'LICENSE' | 'AI'>('IDENTITY');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [securityStatus, setSecurityStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState('');
  const [newCurrency, setNewCurrency] = useState({ code: '', name: '', symbol: '', rate: 1 });
  const [newShift, setNewShift] = useState<Omit<Shift, 'id'>>({
    name: '',
    startTime: '09:00',
    endTime: '17:00',
    gracePeriod: 15,
    deductionRate: 0,
    deductionType: 'FIXED'
  });

  const handleAddShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShift.name) return;
    const ns: Shift = {
      ...newShift,
      id: `SH-${Date.now()}`
    };
    setShifts([...shifts, ns]);
    setNewShift({
      name: '',
      startTime: '09:00',
      endTime: '17:00',
      gracePeriod: 15,
      deductionRate: 0,
      deductionType: 'FIXED'
    });
  };
  
  const handleAddCurrency = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCurrency.code || !newCurrency.name || !newCurrency.symbol) return;
    if (currencies.find(c => c.code.toUpperCase() === newCurrency.code.toUpperCase())) {
      alert('العملة موجودة بالفعل!');
      return;
    }
    const nc: Currency = {
      code: newCurrency.code.toUpperCase(),
      name: newCurrency.name,
      symbol: newCurrency.symbol,
      rateToMain: newCurrency.rate
    };
    setCurrencies([...currencies, nc]);
    setNewCurrency({ code: '', name: '', symbol: '', rate: 1 });
  };

  const setAsBaseCurrency = (code: string) => {
    if (confirm(`هل أنت متأكد من تعيين ${code} كعملة أساسية للنظام؟\nتنبيه: هذا قد يؤثر على الحسابات إذا كانت هناك عمليات مسجلة.`)) {
      setSettings({ ...settings, baseCurrency: code });
    }
  };
  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) return;
    const newP: Partner = {
      id: `P-${Date.now()}`,
      name: newPartnerName,
      balance: 0
    };
    setPartners([...partners, newP]);
    setNewPartnerName('');
  };

  const [newDeptName, setNewDeptName] = useState('');
  const [newDesigName, setNewDesigName] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    const newDept: Department = {
      id: `DEPT-${Date.now()}`,
      name: newDeptName.trim()
    };
    setDepartments([...departments, newDept]);
    setNewDeptName('');
  };

  const handleAddDesignation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDesigName.trim() || !selectedDeptId) return;
    const newDesig: Designation = {
      id: `DESIG-${Date.now()}`,
      name: newDesigName.trim(),
      departmentId: selectedDeptId
    };
    setDesignations([...designations, newDesig]);
    setNewDesigName('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    alert('✅ تم تحديث بيانات الشركة بنجاح!');
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    if (passwords.current !== currentUser.password) {
      setSecurityStatus({ msg: 'كلمة المرور الحالية غير صحيحة!', type: 'error' });
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setSecurityStatus({ msg: 'كلمة المرور الجديدة غير متطابقة!', type: 'error' });
      return;
    }
    if (passwords.new.length < 4) {
      setSecurityStatus({ msg: 'كلمة المرور يجب أن تكون 4 رموز على الأقل', type: 'error' });
      return;
    }

    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, password: passwords.new } : u));
    setSecurityStatus({ msg: 'تم تغيير كلمة المرور بنجاح!', type: 'success' });
    setPasswords({ current: '', new: '', confirm: '' });
  };

  const updateCurrencyRate = (code: string, rate: number) => {
    setCurrencies(prev => prev.map(c => c.code === code ? { ...c, previousRate: c.rateToMain, rateToMain: rate } : c));
  };

  const handleDownloadBackup = () => {
    const blob = new Blob([JSON.stringify(fullData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Backup_Nebras_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    // تحديث تاريخ آخر عملية نسخ احتياطي يدوية
    localStorage.setItem('last_manual_backup', Date.now().toString());
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (confirm('⚠️ تنبيه: استعادة البيانات ستحذف كافة السجلات الحالية. هل أنت متأكد؟')) {
            onRestore(data);
          }
        } catch (err) {
          alert('❌ فشل في قراءة الملف');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Navigation Tabs */}
        <div className="bg-slate-50 p-2 flex gap-2 overflow-x-auto border-b border-slate-200 no-scrollbar">
           <button onClick={() => setActiveTab('IDENTITY')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'IDENTITY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>هوية الشركة</button>
           <button onClick={() => setActiveTab('CURRENCIES')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'CURRENCIES' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>العملات والصرف</button>
           {settings.enableCostCenters && (
             <button onClick={() => setActiveTab('COST_CENTERS')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'COST_CENTERS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>مراكز التكلفة</button>
           )}
           <button onClick={() => setActiveTab('SHIFTS')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'SHIFTS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>أنظمة الدوام</button>
           <button onClick={() => setActiveTab('DEPARTMENTS')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'DEPARTMENTS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>الأقسام الإدارية</button>
           <button onClick={() => setActiveTab('DESIGNATIONS')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'DESIGNATIONS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>المسميات الوظيفية</button>
           <button onClick={() => setActiveTab('PARTNERS')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'PARTNERS' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>حسابات الشركاء</button>
           <button onClick={() => setActiveTab('AUDIT')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'AUDIT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>سجل العمليات</button>
           <button onClick={() => setActiveTab('AI')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'AI' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>الذكاء الاصطناعي</button>
           <button onClick={() => setActiveTab('SECURITY')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'SECURITY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>أمن النظام</button>
           <button onClick={() => setActiveTab('LICENSE')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'LICENSE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>التفعيل والترخيص</button>
           <button onClick={() => setActiveTab('BACKUP')} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'BACKUP' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200 bg-opacity-50'}`}>النسخ الاحتياطي</button>
        </div>

        {activeTab === 'IDENTITY' && (
          <form onSubmit={handleSave} className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
              <div className="space-y-6">
                <div className="space-y-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <Briefcase size={16} className="text-indigo-600"/> اسم البرنامج أو الشركة
                   </label>
                   <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-bold text-xl text-slate-900 outline-none shadow-sm transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck size={16} className="text-indigo-600"/> اسم المحاسب / المدير المالي
                   </label>
                   <input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-bold text-lg text-slate-900 outline-none shadow-sm transition-all" value={formData.accountantName} onChange={e => setFormData({...formData, accountantName: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <MapPin size={16} className="text-indigo-600"/> العنوان
                    </label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-bold text-sm text-slate-900 outline-none" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Phone size={16} className="text-indigo-600"/> أرقام الهاتف
                    </label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-bold text-sm text-slate-900 outline-none" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Mail size={16} className="text-indigo-600"/> البريد الإلكتروني
                    </label>
                    <input type="email" className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-bold text-sm text-slate-900 outline-none" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                        <Facebook size={16} className="text-indigo-600"/> فيسبوك
                    </label>
                    <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-bold text-sm text-slate-900 outline-none" value={formData.facebook || ''} onChange={e => setFormData({...formData, facebook: e.target.value})} />
                  </div>
                  <div className="space-y-3 md:col-span-2">
                    <label className="flex items-center gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100 cursor-pointer hover:bg-indigo-100 bg-opacity-50 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-6 h-6 rounded-md border-indigo-500 text-indigo-600 focus:ring-indigo-500"
                        checked={formData.enableCostCenters || false}
                        onChange={e => setFormData({...formData, enableCostCenters: e.target.checked})}
                      />
                      <div>
                        <p className="font-bold text-indigo-900 text-lg">تفعيل نظام الفروع / مراكز التكلفة</p>
                        <p className="text-indigo-600 text-sm">يسمح بفصل الحسابات والتقارير لكل فرع أو نشاط بشكل مستقل.</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-center bg-slate-50 p-8 rounded-3xl border border-dashed border-slate-200 relative group">
                 <div className="relative mb-6">
                    <img src={formData.logo} className="w-48 h-48 rounded-2xl border-2 border-white shadow-lg object-cover relative z-10" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute -bottom-4 -right-4 bg-indigo-600 text-white p-4 rounded-xl shadow-xl z-20 hover:scale-110 transition-transform"><Upload size={20}/></button>
                 </div>
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => {
                   const file = e.target.files?.[0];
                   if (file) {
                     const reader = new FileReader();
                     reader.onloadend = () => setFormData({ ...formData, logo: reader.result as string });
                     reader.readAsDataURL(file);
                   }
                 }} />
                 <p className="text-slate-400 text-xs font-bold">شعار الشركة (يفضل خلفية شفافة)</p>
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-indigo-600 transition-all transform active:scale-[0.98] border-b-4 border-slate-900 hover:border-indigo-700">حفظ الإعدادات</button>
          </form>
        )}


        {activeTab === 'AI' && (
          <div className="p-8 space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-between bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-600 rounded-full blur-[80px] -mr-16 -mt-16 opacity-10 group-hover:opacity-20 transition-opacity"></div>
              <div className="flex items-center gap-6 relative z-10">
                 <div className="w-16 h-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 transform group-hover:scale-105 transition-transform">
                    <Sparkles size={32}/>
                 </div>
                 <div>
                    <h3 className="text-2xl font-bold text-slate-900 tracking-tight">إعدادات المساعد الذكي (نِبـراس إكس)</h3>
                    <p className="text-indigo-600 font-bold text-sm">اربط النظام بمحرك Google Gemini للحصول على تحليلات مالية متقدمة مجاناً.</p>
                 </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-8">
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                       GOOGLE GEMINI API KEY <Key size={12}/>
                    </label>
                  </div>
                  <input 
                    type="password" 
                    placeholder="أدخل مفتاح API الخاص بك هنا..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-2xl font-mono text-center text-lg outline-none transition-all focus:bg-white focus:shadow-inner"
                    value={formData.geminiApiKey || ''}
                    onChange={e => setFormData({...formData, geminiApiKey: e.target.value})}
                  />
                  
                  <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                     <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                        <Info size={18}/>
                     </div>
                     <p className="text-xs font-bold text-amber-800 leading-relaxed">
                        يمكنك الحصول على مفتاح مجاني تماماً من <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline text-indigo-600">Google AI Studio</a>. هذا المفتاح يسمح للمساعد بتحليل بياناتك والرد على استفساراتك المالية بدقة عالية.
                     </p>
                  </div>
               </div>

               <button 
                 onClick={handleSave}
                 className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-[0.98]"
               >
                 <Save size={20}/> حفظ إعدادات الذكاء الاصطناعي
               </button>
            </div>
          </div>
        )}

        {activeTab === 'SECURITY' && (
          <div className="p-8 space-y-8">
             <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div className="p-3 bg-slate-900 text-indigo-400 rounded-xl shadow-sm"><Shield size={20}/></div>
                <div>
                   <h3 className="text-lg font-bold text-slate-900">تغيير كلمة المرور الشخصية</h3>
                   <p className="text-slate-500 font-medium text-xs">تأكد من اختيار كلمة مرور قوية لحماية بيانات الشركة المالية</p>
                </div>
             </div>

             {securityStatus && (
               <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${securityStatus.type === 'success' ? 'bg-indigo-50 text-indigo-700' : 'bg-rose-50 text-rose-700'}`}>
                  {securityStatus.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
                  {securityStatus.msg}
               </div>
             )}

             <form onSubmit={handlePasswordChange} className="max-w-md mx-auto space-y-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">كلمة المرور الحالية</label>
                   <input type="password" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg" value={passwords.current} onChange={e => setPasswords({...passwords, current: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">كلمة المرور الجديدة</label>
                   <input type="password" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase">تأكيد كلمة المرور الجديدة</label>
                   <input type="password" required className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-lg" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-lg shadow-sm hover:bg-indigo-600 transition-all">تحديث كلمة المرور الآن</button>
             </form>
          </div>
        )}

        {activeTab === 'CURRENCIES' && (
          <div className="p-8 space-y-8">
             <div className="flex items-center justify-between bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-sm">
                      <RefreshCw size={20} className={formData.autoUpdateCurrency ? 'animate-spin-slow' : ''}/>
                   </div>
                   <div>
                      <h3 className="text-lg font-bold text-indigo-900">التحديث التلقائي لأسعار الصرف</h3>
                      <p className="text-indigo-700 font-medium text-xs">جلب أحدث الأسعار آلياً من سوق الصرف عند فتح البرنامج</p>
                   </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.autoUpdateCurrency || false}
                    onChange={e => {
                      const newVal = e.target.checked;
                      setFormData(prev => ({ ...prev, autoUpdateCurrency: newVal }));
                    }}
                  />
                  <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
             </div>

             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Plus size={20} className="text-indigo-600"/> إضافة عملة جديدة</h3>
                <form onSubmit={handleAddCurrency} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">كود العملة (مثل USD)</label>
                      <input type="text" required placeholder="USD" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold uppercase" value={newCurrency.code} onChange={e => setNewCurrency({...newCurrency, code: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">اسم العملة</label>
                      <input type="text" required placeholder="دولار" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold" value={newCurrency.name} onChange={e => setNewCurrency({...newCurrency, name: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">الرمز</label>
                      <input type="text" required placeholder="$" className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-center" value={newCurrency.symbol} onChange={e => setNewCurrency({...newCurrency, symbol: e.target.value})} />
                   </div>
                   <div className="flex items-end">
                      <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all h-[50px]">
                        <Plus size={18} /> إضافة
                      </button>
                   </div>
                </form>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {currencies.map(c => (
                  <div key={c.code} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative overflow-hidden group">
                     {c.code === settings.baseCurrency && (
                       <div className="absolute top-0 left-0 bg-indigo-600 text-white px-3 py-0.5 rounded-br-xl text-[9px] font-bold uppercase tracking-wider z-10">
                         الأساسية
                       </div>
                     )}
                     <div className="absolute top-0 right-0 w-1.5 h-full bg-indigo-600"></div>
                     <div className="flex justify-between items-start mb-0.5">
                        <p className="text-2xl font-bold text-slate-900">{c.symbol}</p>
                        <div className="flex gap-1">
                          {c.code !== settings.baseCurrency && (
                            <button onClick={() => setAsBaseCurrency(c.code)} className="p-1.5 text-slate-300 hover:text-indigo-600 transition-colors" title="تعيين كعملة أساسية"><Coins size={14}/></button>
                          )}
                          {c.code !== settings.baseCurrency && (
                            <button onClick={() => deleteCurrency(c.code)} className="p-1.5 text-slate-300 hover:text-rose-600 transition-colors" title="حذف"><Trash2 size={14}/></button>
                          )}
                        </div>
                     </div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mb-4">{c.name} ({c.code})</p>
                     <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-slate-400 uppercase">سعر الصرف (مقابل {settings.baseCurrency})</label>
                        <input 
                          type="number" 
                          disabled={c.code === settings.baseCurrency}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-base text-center" 
                          value={c.rateToMain} 
                          onChange={e => updateCurrencyRate(c.code, parseFloat(e.target.value))} 
                        />
                     </div>
                  </div>
                ))}
             </div>
             <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex items-start gap-3">
                <Info size={18} className="text-amber-600 shrink-0" />
                <p className="text-xs font-bold text-amber-800 leading-relaxed">تنبيه: تغيير أسعار الصرف يؤثر فقط على العمليات الجديدة. العمليات القديمة ستحتفظ بسعر الصرف الذي تمت به وقت تسجيلها لضمان ثبات الدفاتر المحاسبية.</p>
             </div>
          </div>
        )}

        {activeTab === 'PARTNERS' && (
          <div className="p-8 space-y-8">
             <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">إضافة شريك جديد</h3>
                <form onSubmit={handleAddPartner} className="flex gap-4">
                   <input 
                     type="text" required
                     placeholder="اسم الشريك..."
                     className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-600"
                     value={newPartnerName}
                     onChange={e => setNewPartnerName(e.target.value)}
                   />
                   <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all">
                      <Plus size={18} /> إضافة الشريك
                   </button>
                </form>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {partners.map(p => (
                  <div key={p.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                     <button onClick={() => deletePartner(p.id)} className="absolute top-3 left-3 p-1.5 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                     <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">حساب جاري شريك</p>
                     <h4 className="text-xl font-bold text-slate-900 mb-4">{p.name}</h4>
                     <div className="pt-4 border-t border-slate-100 flex justify-between items-end">
                        <div>
                           <p className="text-[9px] font-bold text-slate-400 uppercase">الرصيد الجاري</p>
                           <p className={`text-xl font-bold ${p.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(p.balance)}</p>
                        </div>
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                           <UserCheck size={16}/>
                        </div>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'LICENSE' && (
          <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-5">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                  <Key size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">تنشيط وترخيص النظام</h3>
                  <p className="text-slate-500 font-medium text-xs">عرض كود الجهاز الخاص بك وإدخال مفتاح التفعيل</p>
                </div>
              </div>

              {licenseInfo && licenseInfo.isActivated ? (
                <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-emerald-800 font-bold text-lg">النظام مفعل بنجاح</p>
                    <p className="text-emerald-600 text-xs font-bold">تاريخ التثبيت: {new Date(licenseInfo.installationDate).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                    <AlertCircle size={24} />
                  </div>
                  <div>
                    <p className="text-amber-800 font-bold text-lg">النظام في الفترة التجريبية</p>
                    <p className="text-amber-600 text-xs font-bold">يرجى تفعيل النسخة الاحترافية للحصول على الدعم الكامل والتحديثات.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">كود الماكينة الفريد (Machine ID)</label>
                <div className="flex gap-2">
                  <code className="flex-1 bg-slate-100 p-4 rounded-xl font-mono text-indigo-600 text-center text-lg tracking-wider border border-slate-200 select-all">
                    {licenseInfo?.machineId || 'جاري التحميل...'}
                  </code>
                  <button 
                    type="button"
                    onClick={() => {
                      if (licenseInfo?.machineId) {
                        navigator.clipboard.writeText(licenseInfo.machineId);
                        alert('تم نسخ كود الماكينة');
                      }
                    }}
                    className="p-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
                  >
                    <Plus size={20} className="text-slate-400 rotate-45" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  هذا الكود فريد لجهازك أو حسابك. برجاء إرساله للمطور للحصول على مفتاح التفعيل الخاص بك.
                </p>
                <div className="pt-4 flex flex-col gap-2">
                   <button 
                    type="button"
                    onClick={() => window.open(`https://wa.me/201148820573?text=أريد تفعيل النسخة الاحترافية - كود الجهاز: ${licenseInfo?.machineId}`, '_blank')}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-sm"
                   >
                     تواصل عبر واتساب للتفعيل
                   </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">مفتاح التفعيل (Activation Key)</label>
                <input 
                  type="text" 
                  id="settings-activation-input"
                  placeholder="NBR-XXXX-XXXX-XXXX"
                  className="w-full bg-white p-4 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none font-bold text-center text-xl tracking-[0.2em] placeholder:text-slate-300 placeholder:tracking-normal shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => {
                    const input = document.getElementById('settings-activation-input') as HTMLInputElement;
                    if (onActivate) onActivate(input.value.trim());
                  }}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-lg"
                >
                  تفعيل المفتاح الآن
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'BACKUP' && (
          <div className="p-8 py-12 text-center space-y-8">
             <div className="max-w-md mx-auto space-y-4">
                <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto border border-indigo-100 shadow-sm"><Download size={32} className="text-indigo-600" /></div>
                <h3 className="text-2xl font-bold text-slate-900">أرشيف والنسخ الاحتياطي</h3>
                <p className="text-slate-500 text-xs font-medium">قم بحماية بياناتك عن طريق تصدير نسخة احتياطية دورية أو استرجاع بيانات سابقة.</p>
             </div>
             <div className="flex flex-wrap justify-center gap-4">
                <button onClick={handleDownloadBackup} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-3 shadow-sm hover:bg-indigo-600 transition-all active:scale-95"><Download size={20}/> تصدير نسخة (JSON)</button>
                <input type="file" ref={restoreInputRef} className="hidden" accept=".json" onChange={handleRestore} />
                <button onClick={() => restoreInputRef.current?.click()} className="bg-white text-slate-600 border border-slate-200 px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-3 shadow-sm hover:bg-slate-50 transition-all active:scale-95"><RefreshCw size={20}/> استيراد ملف خارجي</button>
                
                <div className="w-full h-px bg-slate-100 my-4"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mx-auto">
                  {onManualPush && (
                    <button 
                      disabled={isSyncing}
                      onClick={async () => {
                        setIsSyncing(true);
                        try {
                          await onManualPush?.();
                        } finally {
                          setIsSyncing(false);
                        }
                      }} 
                      className={`bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-indigo-600/20 transition-all active:scale-95 ${isSyncing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                    >
                      <CloudUpload size={22} className={isSyncing ? 'animate-bounce' : ''}/> 
                      <div className="text-right">
                         <p className="text-sm">دفع البيانات للسحابة</p>
                         <p className="text-[10px] opacity-70 font-normal">رفع التعديلات المحلية إلى قاعدة البيانات السحابية</p>
                      </div>
                    </button>
                  )}

                  {onManualPull && (
                    <button 
                      disabled={isSyncing}
                      onClick={async () => {
                        if (confirm('⚠️ تنبيه: سحب البيانات سيعوض البيانات المحلية بالبيانات الموجودة في السحابة. هل تريد الاستمرار؟')) {
                          setIsSyncing(true);
                          try {
                            await onManualPull();
                          } finally {
                            setIsSyncing(false);
                          }
                        }
                      }} 
                      className={`bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-emerald-600/20 transition-all active:scale-95 ${isSyncing ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-700'}`}
                    >
                      <CloudDownload size={22} className={isSyncing ? 'animate-bounce' : ''}/> 
                      <div className="text-right">
                         <p className="text-sm">سحب البيانات من السحابة</p>
                         <p className="text-[10px] opacity-70 font-normal">تحديث البيانات المحلية من قاعدة البيانات السحابية</p>
                      </div>
                    </button>
                  )}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'COST_CENTERS' && (
          <div className="p-8 space-y-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">إضافة مركز تكلفة جديد</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const name = (e.target as any).ccName.value;
                const code = (e.target as any).ccCode.value;
                if (!name) return;
                addCostCenter({ name, code, isActive: true });
                (e.target as any).reset();
              }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input name="ccName" type="text" required placeholder="اسم المركز (مثل: رحلة عمرة رجب)..." className="md:col-span-2 p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-600" />
                <input name="ccCode" type="text" placeholder="الكود (اختياري)..." className="p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-600" />
                <button type="submit" className="md:col-span-3 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all">
                  <Plus size={18} /> إضافة مركز التكلفة
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {costCenters.map(cc => (
                <div key={cc.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                  <button onClick={() => deleteCostCenter(cc.id)} className="absolute top-3 left-3 p-1.5 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">مركز تكلفة</p>
                  <h4 className="text-xl font-bold text-slate-900 mb-1">{cc.name}</h4>
                  {cc.code && <p className="text-xs font-bold text-indigo-600 mb-4">كود: {cc.code}</p>}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${cc.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500'}`}>
                      {cc.isActive ? 'نشط' : 'معطل'}
                    </span>
                    <p className="text-[9px] text-slate-400 font-bold">{new Date(cc.createdAt).toLocaleDateString('ar-EG')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'AUDIT' && (
          <div className="p-8 space-y-6">
            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-200">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-indigo-400 rounded-xl shadow-sm"><Shield size={20}/></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">سجل الرقابة والعمليات</h3>
                    <p className="text-slate-500 font-medium text-xs">تتبع كافة التحركات والتعديلات التي تمت على النظام لضمان الشفافية</p>
                  </div>
               </div>
               {currentUser?.role === 'ADMIN' && (
                 <button 
                   onClick={onRepairAttribution}
                   className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                 >
                   <RefreshCw size={18} />
                   إصلاح ربط العمليات بالموظفين
                 </button>
               )}
            </div>

            <div className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
               <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                     <thead>
                        <tr className="bg-slate-900 text-white">
                           <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">الوقت والتاريخ</th>
                           <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">المستخدم</th>
                           <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">العملية</th>
                           <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">النوع</th>
                           <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider">التفاصيل</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {auditLogs.slice(0, 100).map(log => (
                           <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                 <p className="text-xs font-bold text-slate-900">{new Date(log.timestamp).toLocaleDateString('ar-EG')}</p>
                                 <p className="text-[10px] text-slate-400 font-bold">{new Date(log.timestamp).toLocaleTimeString('ar-EG')}</p>
                              </td>
                              <td className="px-6 py-4">
                                 <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold text-xs">
                                       {log.userName?.charAt(0) || 'U'}
                                    </div>
                                    <span className="font-bold text-xs text-slate-700">{log.userName || 'User'}</span>
                                 </div>
                              </td>
                              <td className="px-6 py-4">
                                 <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    log.action === 'CREATE' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                                    log.action === 'UPDATE' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    log.action === 'DELETE' || log.action === 'VOID' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                                    'bg-indigo-50 text-indigo-600 border border-indigo-100'
                                 }`}>
                                    {log.action}
                                 </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-[10px] text-slate-500 uppercase">{log.entityType}</td>
                              <td className="px-6 py-4">
                                 <div className="flex flex-col gap-1">
                                   <p className="text-xs font-bold text-slate-900 mb-1">{log.details}</p>
                                   <div className="flex items-center gap-3">
                                     {(log.oldValue || log.newValue) && (
                                        <button 
                                          onClick={() => {
                                            console.log('Old:', log.oldValue ? JSON.parse(log.oldValue) : 'N/A');
                                            console.log('New:', log.newValue ? JSON.parse(log.newValue) : 'N/A');
                                            alert('تمت طباعة تفاصيل القيم القديمة والجديدة في Console للمطورين');
                                          }}
                                          className="text-[9px] text-indigo-600 hover:text-indigo-700 font-bold"
                                        >
                                          عرض القيم البرمجية (JSON)
                                        </button>
                                     )}
                                     {onNavigate && (log.entityType === 'TRANSACTION' || log.entityType === 'JOURNAL_ENTRY') && (
                                       <button 
                                         onClick={() => {
                                           let view = 'JOURNAL';
                                           if (log.entityType === 'TRANSACTION') {
                                             const tx = (fullData?.transactions || []).find((t: any) => t.id === log.entityId);
                                             if (tx) {
                                               if (['FLIGHT', 'FLIGHT_REFUND', 'FLIGHT_REISSUE'].includes(tx.category)) view = 'FLIGHTS';
                                               else if (['HAJJ', 'UMRAH', 'HAJJ_UMRAH', 'INDIVIDUAL_UMRAH'].includes(tx.category) || tx.programId) view = 'HAJJ_UMRAH';
                                               else if (['EXPENSE_GEN', 'EXPENSE'].includes(tx.category)) view = 'EXPENSES';
                                               else if (tx.category === 'GENERAL_SERVICE') view = 'SERVICES';
                                               else if (['CASH', 'TRANSFER', 'RECEIPT', 'PAYMENT'].includes(tx.category)) view = 'TREASURY';
                                               else if (tx.category === 'ACCOUNT_CLEARING') view = 'CLEARING';
                                               else if (['CLEARING', 'DOUBTFUL_DEBT'].includes(tx.category)) view = 'JOURNAL';
                                               else if (tx.category === 'ACCOMMODATION') view = 'ACCOMMODATION';
                                               else if (tx.category === 'EMPLOYEE_ADVANCE') view = 'EMPLOYEES';
                                               else view = 'FLIGHTS';
                                             } else {
                                               view = 'FLIGHTS';
                                             }
                                           }
                                           onNavigate(view, log.entityId);
                                         }}
                                         className="flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors font-bold"
                                       >
                                         <Eye size={12} />
                                         مراجعة العملية
                                       </button>
                                     )}
                                   </div>
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
        {activeTab === 'SHIFTS' && (
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-200">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-indigo-400 rounded-xl shadow-sm"><Clock size={20}/></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">إدارة أنظمة الدوام</h3>
                    <p className="text-slate-500 font-medium text-xs">تعريف مواعيد الحضور والانصراف وفترات السماح وقواعد الخصم</p>
                  </div>
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <form onSubmit={handleAddShift} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">اسم النظام (مثلاً: دوام صباحي)</label>
                    <input type="text" required className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none" value={newShift.name} onChange={e => setNewShift({...newShift, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">وقت الحضور</label>
                    <input type="time" required className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none" value={newShift.startTime} onChange={e => setNewShift({...newShift, startTime: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">وقت الانصراف</label>
                    <input type="time" required className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none" value={newShift.endTime} onChange={e => setNewShift({...newShift, endTime: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">فترة السماح (بالدقائق)</label>
                    <input type="number" required className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none" value={newShift.gracePeriod} onChange={e => setNewShift({...newShift, gracePeriod: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">قيمة الخصم</label>
                    <input type="number" required className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none" value={newShift.deductionRate} onChange={e => setNewShift({...newShift, deductionRate: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">نوع الخصم</label>
                    <select className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none" value={newShift.deductionType} onChange={e => setNewShift({...newShift, deductionType: e.target.value as any})}>
                      <option value="FIXED">مبلغ ثابت لكل تأخير</option>
                      <option value="HOURLY_PERCENT">نسبة من راتب الساعة</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all">
                  <Plus size={18} /> إضافة نظام الدوام
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {shifts && shifts.map(shift => (
                <div key={shift.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                  <button onClick={() => deleteShift(shift.id)} className="absolute top-3 left-3 p-1.5 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">{shift.name}</h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">المواعيد:</span>
                      <span className="text-slate-900 font-bold">{shift.startTime} - {shift.endTime}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400 font-bold">فترة السماح:</span>
                      <span className="text-slate-900 font-bold">{shift.gracePeriod} دقيقة</span>
                    </div>
                    <div className="flex justify-between text-xs pt-2 border-t border-slate-50">
                      <span className="text-slate-400 font-bold">قاعدة الخصم:</span>
                      <span className="text-rose-600 font-bold">{shift.deductionRate} {shift.deductionType === 'FIXED' ? 'مبلغ ثابت' : '% لكل ساعة'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'DEPARTMENTS' && (
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-200">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-indigo-400 rounded-xl shadow-sm"><Building2 size={20}/></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">إدارة الأقسام الإدارية</h3>
                    <p className="text-slate-500 font-medium text-xs">تعريف الهيكل التنظيمي للشركة وتوزيع الإدارات</p>
                  </div>
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <form onSubmit={handleAddDepartment} className="flex gap-4">
                 <input 
                   type="text" required
                   placeholder="اسم القسم (مثلاً: إدارة الحسابات، الموارد البشرية)..."
                   className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-600"
                   value={newDeptName}
                   onChange={e => setNewDeptName(e.target.value)}
                 />
                 <button type="submit" className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-600 transition-all">
                    <Plus size={18} /> إضافة القسم
                 </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departments.map(dept => (
                <div key={dept.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                  <button onClick={() => deleteDepartment(dept.id)} className="absolute top-3 left-3 p-1.5 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                    <h4 className="text-lg font-bold text-slate-900">{dept.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'DESIGNATIONS' && (
          <div className="p-8 space-y-8">
            <div className="flex items-center justify-between bg-slate-50 p-6 rounded-2xl border border-slate-200">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-900 text-indigo-400 rounded-xl shadow-sm"><Award size={20}/></div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">إدارة المسميات الوظيفية</h3>
                    <p className="text-slate-500 font-medium text-xs">تعريف المسميات الوظيفية وربطها بالأقسام المعنية</p>
                  </div>
               </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <form onSubmit={handleAddDesignation} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">اسم المسمى الوظيفي</label>
                    <input 
                      type="text" required
                      placeholder="مثلاً: محاسب أول، مدير مكتب..."
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-600"
                      value={newDesigName}
                      onChange={e => setNewDesigName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">القسم التابع له</label>
                    <select 
                      required
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold outline-none focus:border-indigo-600"
                      value={selectedDeptId}
                      onChange={e => setSelectedDeptId(e.target.value)}
                    >
                      <option value="">اختر القسم...</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button type="submit" className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all">
                  <Plus size={18} /> إضافة المسمى الوظيفي
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {designations.map(desig => {
                const dept = departments.find(d => d.id === desig.departmentId);
                return (
                  <div key={desig.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative group">
                    <button onClick={() => deleteDesignation(desig.id)} className="absolute top-3 left-3 p-1.5 text-slate-300 hover:text-rose-600 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                        <Award size={20} />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">{desig.name}</h4>
                    </div>
                    <p className="text-xs font-bold text-slate-400 pr-[52px]">قسم: {dept?.name || '---'}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsView;
