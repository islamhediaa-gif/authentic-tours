
import React, { useState, useEffect } from 'react';
import { History, Search, User, Calendar, Database, Eye, ArrowLeft, Filter, AlertTriangle } from 'lucide-react';
import { SupabaseService } from '../SupabaseService';
import { DataService } from '../DataService';

const AuditLogView: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const tenantId = DataService.getTenantId();
    const res = await DataService.fetchAuditLogs(tenantId, 200);
    if (res.success) {
      setLogs(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.record_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'UPDATE': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'DELETE': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatJSON = (data: any) => {
    if (!data) return 'لا يوجد بيانات';
    return JSON.stringify(data, null, 2);
  };

  if (selectedLog) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-500">
        <button 
          onClick={() => setSelectedLog(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold transition-colors"
        >
          <ArrowLeft size={20} /> العودة للسجل
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className={`px-4 py-1.5 rounded-full border text-xs font-bold ${getActionColor(selectedLog.action)}`}>
                {selectedLog.action}
              </div>
              <h3 className="text-xl font-bold text-slate-900">تفاصيل العملية: {selectedLog.table_name}</h3>
            </div>
            <span className="text-sm text-slate-400 font-bold">{new Date(selectedLog.timestamp).toLocaleString('ar-EG')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            <div className="space-y-4">
              <h4 className="font-bold text-rose-600 flex items-center gap-2">
                <AlertTriangle size={18} /> البيانات السابقة
              </h4>
              <pre className="bg-slate-900 text-indigo-300 p-6 rounded-2xl text-xs overflow-auto max-h-[400px] font-mono leading-relaxed border border-slate-800">
                {formatJSON(selectedLog.old_data)}
              </pre>
            </div>
            <div className="space-y-4">
              <h4 className="font-bold text-emerald-600 flex items-center gap-2">
                <Database size={18} /> البيانات الجديدة
              </h4>
              <pre className="bg-slate-900 text-emerald-300 p-6 rounded-2xl text-xs overflow-auto max-h-[400px] font-mono leading-relaxed border border-slate-800">
                {formatJSON(selectedLog.new_data)}
              </pre>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <History size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">سجل الرقابة والأمان (Audit Logs)</h2>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">مراقبة كافة التغييرات المالية والإدارية</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="البحث في العمليات أو المستخدمين..."
            className="w-full pr-12 pl-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm focus:border-indigo-600 focus:bg-white transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">التوقيت</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">المستخدم</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">النوع</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">الجدول</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-slate-400 font-bold">جاري تحميل سجل الأمان من السحاب...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <p className="text-slate-400 font-bold">لا توجد سجلات مطابقة للبحث</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-sm">
                        <Calendar size={14} className="text-slate-400" />
                        {new Date(log.timestamp).toLocaleString('ar-EG')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                        <User size={14} className="text-indigo-500" />
                        {log.user_id || 'نظام آلي'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full border text-[10px] font-bold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-600 font-bold text-xs uppercase tracking-tight">
                        <Database size={12} />
                        {log.table_name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => setSelectedLog(log)}
                        className="p-2 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogView;
