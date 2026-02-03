import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AuditLog as AuditLogType } from '../../types';

interface AuditLogProps {
  auditLogs: AuditLogType[];
  fromDate: string;
  toDate: string;
  searchTerm: string;
  isPrint?: boolean;
}

const AuditLog: React.FC<AuditLogProps> = ({ 
  auditLogs, 
  fromDate, 
  toDate, 
  searchTerm,
  isPrint = false
}) => {
  const { t } = useTranslation();

  const filteredLogs = (auditLogs || [])
    .filter(log => log && log.timestamp && log.timestamp >= fromDate && log.timestamp <= toDate)
    .filter(log => 
      !searchTerm || 
      (log.details || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (log.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

  return (
    <div className={`space-y-8 ${!isPrint ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''}`}>
      {!isPrint && (
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 transform group-hover:rotate-6 transition-transform duration-500">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-2xl font-bold text-slate-900 tracking-tight">
                {t('audit_trail')}
              </h4>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5">
                {t('system_activity_monitor')} • {fromDate} - {toDate}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-lg relative z-10">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span className="text-xs font-bold tabular-nums">{filteredLogs.length}</span>
            <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">{t('recorded_actions')}</span>
          </div>
        </div>
      )}
      
      <div className={`overflow-hidden transition-all duration-500 ${isPrint ? 'rounded-xl border border-slate-200' : 'rounded-3xl bg-white border border-slate-100 shadow-sm'}`}>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 border-b border-white/5">{t('timestamp')}</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 border-b border-white/5">{t('operator')}</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 border-b border-white/5">{t('event_type')}</th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] opacity-60 border-b border-white/5">{t('detailed_log')}</th>
            </tr>
          </thead>
          <tbody className="text-[11px] font-medium bg-white">
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-all duration-300 group border-b border-slate-50 last:border-0">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 tabular-nums">{(log.timestamp || '').split(' ')[0]}</span>
                      <span className="text-[9px] text-slate-400 font-medium tabular-nums">{(log.timestamp || '').split(' ')[1] || ''}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shadow-inner border border-white group-hover:scale-110 transition-transform duration-500">
                        {log.userName?.charAt(0) || 'U'}
                      </div>
                      <span className="font-bold text-slate-900 tracking-tight">{log.userName || '-'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase tracking-wider shadow-sm border ${
                      (log.action || '').includes('حذف') || (log.action || '').includes('DELETE') ? 'bg-rose-500/10 text-rose-700 border-rose-200/30' :
                      (log.action || '').includes('تعديل') || (log.action || '').includes('UPDATE') ? 'bg-amber-500/10 text-amber-700 border-amber-200/30' :
                      'bg-emerald-500/10 text-emerald-700 border-emerald-200/30'
                    }`}>
                      {log.action || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-600 font-medium leading-relaxed max-w-xl group-hover:text-slate-900 transition-colors">
                      {log.details || '-'}
                    </p>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-10 text-center">
                  <div className="flex flex-col items-center gap-3 opacity-20">
                    <ShieldCheck size={48} className="text-slate-400" />
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                      {t('no_logs_found')}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(AuditLog);
