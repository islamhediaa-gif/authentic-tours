import React, { useState, useEffect } from 'react';
import { Fingerprint, RefreshCw, Wifi, WifiOff, Users, History, Settings, Play, CheckCircle2, AlertCircle, Trash2, Download, LayoutList, CalendarRange } from 'lucide-react';
import { AttendanceLog, Employee, Shift } from '../types';

const isElectron = typeof window !== 'undefined' && !!(window as any).process && (window as any).process.type === 'renderer';

const getIpcRenderer = () => {
  try {
    if (isElectron && (window as any).require) {
      return (window as any).require('electron').ipcRenderer;
    }
  } catch (e) {
    // Silent fail for web
  }
  return null;
};

const ipcRenderer = getIpcRenderer();

interface FingerprintViewProps {
  logs: AttendanceLog[];
  setLogs: React.Dispatch<React.SetStateAction<AttendanceLog[]>>;
  employees: Employee[];
  shifts: Shift[];
}

const FingerprintView: React.FC<FingerprintViewProps> = ({ logs, setLogs, employees, shifts }) => {
  const [config, setConfig] = useState({ ip: '192.168.1.201', port: 4370 });
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [deviceUsers, setDeviceUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [realTimeActive, setRealTimeActive] = useState(false);
  const [viewMode, setViewMode] = useState<'RAW' | 'SUMMARY'>('SUMMARY');
  const [filterDates, setFilterDates] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (ipcRenderer) {
      const handleRealTimeLog = (event: any, data: any) => {
        // نضمن عدم التكرار إذا كان الـ App.tsx سيعالج الحفظ أيضاً
        setLogs(prev => {
           const exists = prev.some(l => l.deviceUserId == data.deviceUserId && l.recordTime === data.recordTime);
           if (exists) return prev;
           return [data, ...prev];
        });
      };
      ipcRenderer.on('fp-realtime-log', handleRealTimeLog);
      return () => {
        ipcRenderer.removeListener('fp-realtime-log', handleRealTimeLog);
      };
    }
  }, [setLogs]);

  const connectDevice = async () => {
    if (!ipcRenderer) return;
    setStatus('CONNECTING');
    const result = await ipcRenderer.invoke('fp-connect', config);
    if (result.success) {
      setStatus('CONNECTED');
    } else {
      setStatus('DISCONNECTED');
      alert('فشل الاتصال: ' + result.error);
    }
  };

  const disconnectDevice = async () => {
    if (!ipcRenderer) return;
    await ipcRenderer.invoke('fp-disconnect');
    setStatus('DISCONNECTED');
    setRealTimeActive(false);
  };

  const fetchLogs = async () => {
    if (!ipcRenderer || status !== 'CONNECTED') return;
    setIsLoading(true);
    const result = await ipcRenderer.invoke('fp-get-logs');
    if (result.success) {
      // الـ main.js يقوم بحفظها في الـ dbFile
      // نحتاج لإعادة تحميلها في الـ App state
      const dbRes = await ipcRenderer.invoke('db-load');
      if (dbRes.success && dbRes.data.attendanceLogs) {
        setLogs(dbRes.data.attendanceLogs);
      }
    } else {
      alert('خطأ في سحب السجلات: ' + result.error);
    }
    setIsLoading(false);
  };

  const fetchUsers = async () => {
    if (!ipcRenderer || status !== 'CONNECTED') return;
    setIsLoading(true);
    const result = await ipcRenderer.invoke('fp-get-users');
    if (result.success) {
      setDeviceUsers(result.data);
    } else {
      alert('خطأ في سحب المستخدمين: ' + result.error);
    }
    setIsLoading(false);
  };

  const toggleRealTime = () => {
    if (!ipcRenderer || status !== 'CONNECTED') return;
    if (!realTimeActive) {
      ipcRenderer.send('fp-setup-realtime');
      setRealTimeActive(true);
    } else {
      setRealTimeActive(false);
    }
  };

  const getUserName = (deviceUserId: string) => {
    if (!deviceUserId) return '---';
    // 1. البحث في قاعدة بيانات الموظفين المسجلين في النظام أولاً (باستخدام رقم البصمة)
    const systemEmployee = (employees || []).find(e => e?.fingerprintId === deviceUserId.toString());
    if (systemEmployee) return systemEmployee.name || '---';

    // 2. إذا لم يوجد، البحث في الأسماء المسحوبة من جهاز البصمة مباشرة
    const deviceUser = (deviceUsers || []).find(u => u?.uid == deviceUserId);
    if (deviceUser) return deviceUser.name || '---';

    // 3. كحل أخير، عرض "موظف" مع الرقم
    return 'موظف ' + deviceUserId;
  };

  const filteredLogs = (logs || []).filter(log => {
    if (!log?.recordTime) return false;
    try {
      const logDate = new Date(log.recordTime).toISOString().split('T')[0];
      const userName = getUserName(log.deviceUserId);
      const matchesDate = logDate >= (filterDates?.from || '') && logDate <= (filterDates?.to || '');
      const matchesName = (userName || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || (log.deviceUserId || '').toString().includes(searchQuery || '');
      return matchesDate && matchesName;
    } catch (e) {
      return false;
    }
  });

  const sortedLogs = [...(filteredLogs || [])].sort((a, b) => {
    const timeA = a?.recordTime ? new Date(a.recordTime).getTime() : 0;
    const timeB = b?.recordTime ? new Date(b.recordTime).getTime() : 0;
    return timeB - timeA;
  });

  const getDailySummary = () => {
    const groups: Record<string, any> = {};
    (filteredLogs || []).forEach(log => {
      if (!log?.recordTime || !log?.deviceUserId) return;
      try {
        const dateObj = new Date(log.recordTime);
        if (isNaN(dateObj.getTime())) return;
        const date = dateObj.toLocaleDateString('en-CA');
        const key = `${log.deviceUserId}_${date}`;
        if (!groups[key]) {
          const emp = (employees || []).find(e => e?.fingerprintId === log.deviceUserId.toString());
          const shift = emp && emp.shiftId ? (shifts || []).find(s => s?.id === emp.shiftId) : null;
          
          groups[key] = {
            userId: log.deviceUserId,
            userName: getUserName(log.deviceUserId),
            date: date,
            times: [],
            ip: log.ip,
            shift: shift
          };
        }
        groups[key].times.push(dateObj);
      } catch (e) {
        // Ignore invalid dates
      }
    });

    return Object.values(groups || {}).sort((a: any, b: any) => {
      const timeA = a?.date ? new Date(a.date).getTime() : 0;
      const timeB = b?.date ? new Date(b.date).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      return (b?.userId || '').toString().localeCompare((a?.userId || '').toString());
    });
  };

  const exportToExcel = () => {
    let csv = "\ufeff";
    csv += "الموظف,رقم البصمة,التاريخ,تسجيل الحضور,تسجيل الخروج,الجهاز\n";
    
    const summary = getDailySummary();
    (summary || []).forEach((g: any) => {
      const sortedTimes = (g.times || []).sort((a: any, b: any) => a - b);
      if (sortedTimes.length === 0) return;
      const checkIn = sortedTimes[0].toLocaleTimeString('ar-EG');
      const checkOut = sortedTimes.length > 1 ? sortedTimes[sortedTimes.length - 1].toLocaleTimeString('ar-EG') : '---';
      csv += `"${g.userName}","${g.userId}","${g.date}","${checkIn}","${checkOut}","${g.ip}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 text-right" dir="rtl">
      {!isElectron && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-4 text-amber-800 shadow-sm">
          <AlertCircle className="text-amber-500 shrink-0" size={24} />
          <div>
            <p className="font-black text-sm">تنبيه: أنت تستخدم نسخة الويب</p>
            <p className="text-xs font-bold opacity-80">الاتصال المباشر بجهاز البصمة (K14 Pro) يتطلب تشغيل البرنامج من خلال تطبيق سطح المكتب.</p>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
            <Fingerprint size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">إدارة جهاز البصمة</h2>
            <p className="text-sm font-bold text-slate-500">التحكم في جهاز K14 Pro وسحب بيانات الحضور</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
            status === 'CONNECTED' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
            status === 'CONNECTING' ? 'bg-amber-50 border-amber-100 text-amber-600' :
            'bg-slate-50 border-slate-100 text-slate-400'
          }`}>
            {status === 'CONNECTED' ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span className="text-xs font-black">
              {status === 'CONNECTED' ? 'متصل بالجهاز' : status === 'CONNECTING' ? 'جاري الاتصال...' : 'غير متصل'}
            </span>
          </div>
          
          {status === 'CONNECTED' ? (
            <button onClick={disconnectDevice} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs hover:bg-rose-100 transition-colors">
              قطع الاتصال
            </button>
          ) : (
            <button 
              onClick={connectDevice} 
              disabled={status === 'CONNECTING' || !isElectron} 
              className={`px-6 py-2 rounded-xl font-bold text-xs transition-colors disabled:opacity-50 ${
                !isElectron ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {!isElectron ? 'غير متاح بالمتصفح' : 'اتصال الآن'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Config & Controls */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Settings size={18} className="text-slate-400" />
              <h3 className="text-sm font-black text-slate-800">إعدادات الاتصال</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 mr-1">عنوان IP الجهاز</label>
                <input 
                  type="text" 
                  value={config.ip}
                  onChange={(e) => setConfig({...config, ip: e.target.value})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 mr-1">المنفذ (Port)</label>
                <input 
                  type="number" 
                  value={config.port}
                  onChange={(e) => setConfig({...config, port: parseInt(e.target.value)})}
                  className="w-full bg-slate-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Play size={18} className="text-slate-400" />
              <h3 className="text-sm font-black text-slate-800">عمليات سريعة</h3>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              <button 
                onClick={fetchLogs}
                disabled={status !== 'CONNECTED' || isLoading}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:border-indigo-100">
                    <History size={18} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">سحب السجلات</p>
                    <p className="text-[10px] font-bold text-slate-400">تحميل حركات الحضور</p>
                  </div>
                </div>
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>

              <button 
                onClick={fetchUsers}
                disabled={status !== 'CONNECTED' || isLoading}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:border-indigo-100">
                    <Users size={18} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">المستخدمين</p>
                    <p className="text-[10px] font-bold text-slate-400">قائمة الأسماء على الجهاز</p>
                  </div>
                </div>
                <CheckCircle2 size={16} />
              </button>

              <button 
                onClick={toggleRealTime}
                disabled={status !== 'CONNECTED'}
                className={`flex items-center justify-between p-4 rounded-2xl transition-all group disabled:opacity-50 ${
                  realTimeActive ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 hover:bg-amber-50 hover:text-amber-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm group-hover:border-amber-100">
                    <Wifi size={18} className={realTimeActive ? 'animate-pulse' : ''} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black">المراقبة اللحظية</p>
                    <p className="text-[10px] font-bold text-slate-400">
                      {realTimeActive ? 'قيد التشغيل الآن' : 'تشغيل المراقبة المباشرة'}
                    </p>
                  </div>
                </div>
                <div className={`w-2 h-2 rounded-full ${realTimeActive ? 'bg-amber-500 animate-ping' : 'bg-slate-300'}`}></div>
              </button>
            </div>
          </div>
        </div>

        {/* Logs Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
                    <History size={20} className="text-slate-400" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">حركات الحضور</h3>
                </div>

                <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                   <div className="flex items-center gap-2">
                      <label className="text-[9px] font-black text-slate-400">من</label>
                      <input 
                        type="date" 
                        value={filterDates.from}
                        onChange={(e) => setFilterDates({...filterDates, from: e.target.value})}
                        className="text-[10px] font-bold border-none p-0 focus:ring-0 cursor-pointer"
                      />
                   </div>
                   <div className="w-px h-4 bg-slate-200 mx-1"></div>
                   <div className="flex items-center gap-2">
                      <label className="text-[9px] font-black text-slate-400">إلى</label>
                      <input 
                        type="date" 
                        value={filterDates.to}
                        onChange={(e) => setFilterDates({...filterDates, to: e.target.value})}
                        className="text-[10px] font-bold border-none p-0 focus:ring-0 cursor-pointer"
                      />
                   </div>
                </div>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                  <button 
                    onClick={() => setViewMode('SUMMARY')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${viewMode === 'SUMMARY' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <CalendarRange size={14} /> ملخص الحضور والاصراف
                  </button>
                  <button 
                    onClick={() => setViewMode('RAW')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${viewMode === 'RAW' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <LayoutList size={14} /> الحركات الخام
                  </button>
                </div>

                <div className="relative group">
                  <Users className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={14} />
                  <input 
                    type="text" 
                    placeholder="بحث باسم الموظف أو الرقم..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10 pl-4 py-1.5 bg-white border border-slate-200 rounded-xl focus:border-indigo-600 outline-none font-bold text-[10px] shadow-sm transition-all placeholder:text-slate-400 w-48"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={exportToExcel}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-700 transition-all shadow-sm"
                >
                  <Download size={16} /> تصدير إكسل (CSV)
                </button>
                <span className="text-[10px] font-black bg-white px-3 py-1 rounded-full border border-slate-200 text-slate-500">
                  {viewMode === 'RAW' ? (logs || []).length : (getDailySummary() || []).length} {viewMode === 'RAW' ? 'حركة' : 'يوم عمل'}
                </span>
              </div>
            </div>
            
            <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-right">
                <thead>
                  <tr className="bg-white text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">المستخدم</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">رقم البصمة</th>
                    {viewMode === 'RAW' ? (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">التاريخ والوقت</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-left">الجهاز</th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">التاريخ</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">تسجيل الحضور</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-center">تسجيل الخروج</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-left">الحالة</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {viewMode === 'RAW' ? (
                    (sortedLogs || []).length > 0 ? (
                      (sortedLogs || []).map((log, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-4">
                            <span className="text-xs font-black text-slate-900">
                              {getUserName(log.deviceUserId)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">ID: {log.deviceUserId}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className="text-xs font-bold text-slate-500">
                              {new Date(log.recordTime || 0).toLocaleString('ar-EG')}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-left">
                            <span className="text-[10px] font-bold text-slate-400">{log.ip}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <EmptyState />
                    )
                  ) : (
                    (getDailySummary() || []).length > 0 ? (
                      (getDailySummary() || []).map((g: any, idx) => {
                        const sortedTimes = (g.times || []).sort((a: any, b: any) => a - b);
                        if (sortedTimes.length === 0) return null;
                        const checkIn = sortedTimes[0];
                        const checkOut = sortedTimes.length > 1 ? sortedTimes[sortedTimes.length - 1] : null;

                        let statusLabel = checkOut ? 'مكتمل' : 'حضور فقط';
                        let statusColor = checkOut ? 'bg-indigo-500' : 'bg-amber-500';

                        if (g?.shift) {
                          const startTimeStr = g.shift.startTime || '00:00';
                          const parts = startTimeStr.split(':');
                          const sH = parseInt(parts[0]) || 0;
                          const sM = parseInt(parts[1]) || 0;
                          const checkInH = checkIn.getHours();
                          const checkInM = checkIn.getMinutes();
                          const delay = (checkInH * 60 + checkInM) - (sH * 60 + sM);

                          if (delay > (g.shift.gracePeriod || 0)) {
                            statusLabel = 'تأخير';
                            statusColor = 'bg-rose-500';
                          }
                        }

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="text-xs font-black text-slate-900">{g.userName}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md">ID: {g.userId}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xs font-bold text-slate-500">{g.date}</span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                {checkIn.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              {checkOut ? (
                                <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                                  {checkOut.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-slate-300 italic">لا يوجد خروج</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-left">
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full text-white ${statusColor}`}>
                                {statusLabel}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <EmptyState />
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <tr>
    <td colSpan={6} className="px-6 py-20 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
          <History size={32} />
        </div>
        <p className="text-slate-400 font-bold text-sm">لا توجد سجلات لعرضها حالياً</p>
      </div>
    </td>
  </tr>
);

export default FingerprintView;
