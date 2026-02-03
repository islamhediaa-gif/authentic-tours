import React, { useState } from 'react';
import { Globe, LogOut, Terminal, ChevronDown } from 'lucide-react';
import { ViewState, User } from '../types';
import { NAV_GROUPS } from '../constants';
import { useTranslation } from 'react-i18next';
import pkg from '../package.json';

interface SidebarProps {
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  appName: string;
  logo: string;
  user: User;
  onLogout: () => void;
  licenseInfo?: { isActivated: boolean };
  daysLeft?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, onViewChange, appName, logo, user, onLogout,
  licenseInfo, daysLeft 
}) => {
  const { t, i18n } = useTranslation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['DASHBOARD_GROUP', 'CRM_GROUP', 'TOURISM_GROUP']);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId) 
        : [...prev, groupId]
    );
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = newLang;
  };

  const filteredGroups = NAV_GROUPS.map(group => {
    const filteredItems = group.items.filter(item => {
      const it = item as any;
      if (it.hidden) return false;
      if (user.role === 'ADMIN') return true;
      if (it.id === 'DASHBOARD' && user.role === 'BOOKING_EMPLOYEE') return false;
      if (it.permission === 'ADMIN_ONLY') return false;
      return !it.permission || user.permissions.includes(it.permission);
    });
    return { ...group, items: filteredItems };
  }).filter(group => group.items.length > 0);

  return (
    <div className={`w-64 bg-slate-900 text-white flex flex-col h-full shadow-2xl border-slate-800 z-20 relative overflow-hidden no-print ${i18n.language === 'ar' ? 'border-l' : 'border-r'}`}>
      {/* Background Decorative Elements */}
      <div className={`absolute top-0 w-32 h-32 bg-indigo-500 bg-opacity-10 rounded-full blur-[80px] -translate-y-16 ${i18n.language === 'ar' ? 'right-0 translate-x-16' : 'left-0 -translate-x-16'}`}></div>
      
      <div className="p-8 flex flex-col items-center relative z-10 border-b border-white/5">
        <button 
          onClick={toggleLanguage}
          className="absolute top-4 left-4 p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
          title={t('language')}
        >
          <Globe size={16} className="text-slate-400 group-hover:text-white" />
          <span className="absolute top-full mt-1 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {i18n.language === 'ar' ? 'English' : 'العربية'}
          </span>
        </button>

        <div className="relative group cursor-pointer mb-5">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
          {logo ? (
            <img src={logo} alt="Logo" className="w-16 h-16 rounded-2xl border border-white/10 object-cover shadow-2xl relative z-10 transform transition group-hover:scale-105 duration-500" />
          ) : (
            <div className="w-16 h-16 bg-slate-800 rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl relative z-10 transform transition group-hover:scale-105 duration-500">
               <Terminal size={32} className="text-indigo-500" />
            </div>
          )}
        </div>
        <h1 className="text-base font-bold text-center tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">{appName}</h1>
        <div className="mt-2 px-3 py-0.5 bg-indigo-500 bg-opacity-10 border border-indigo-500 border-opacity-20 rounded-full">
           <p className="text-[8px] text-indigo-400 font-bold uppercase tracking-[0.2em]">النسخة الاحترافية</p>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-6 custom-scrollbar space-y-4 px-4 relative z-10">
        {filteredGroups.map((group) => (
          <div key={group.id} className="space-y-1">
            {group.id !== 'DASHBOARD_GROUP' ? (
              <button
                onClick={() => toggleGroup(group.id)}
                className="w-full flex items-center justify-between px-4 py-2 text-slate-500 hover:text-indigo-400 transition-colors group"
              >
                <div className="flex items-center gap-3">
                   {group.icon && React.cloneElement(group.icon as React.ReactElement<any>, { size: 16, className: "opacity-70 group-hover:opacity-100" })}
                   <span className="text-[10px] font-bold uppercase tracking-widest">{group.label}</span>
                </div>
                <ChevronDown 
                  size={14} 
                  className={`transition-transform duration-300 ${expandedGroups.includes(group.id) ? 'rotate-180' : ''}`} 
                />
              </button>
            ) : null}

            {(group.id === 'DASHBOARD_GROUP' || expandedGroups.includes(group.id)) && (
              <div className="space-y-1">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onViewChange(item.id as ViewState)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group relative ${
                      currentView === item.id 
                        ? 'bg-indigo-500 text-slate-900 shadow-lg shadow-indigo-500/20' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {currentView === item.id && (
                      <div className={`absolute top-1/2 -translate-y-1/2 w-1 h-5 bg-slate-900 rounded-full ${i18n.language === 'ar' ? '-right-1' : '-left-1'}`}></div>
                    )}
                    <span className={`${currentView === item.id ? 'text-slate-900' : 'text-slate-500 group-hover:text-indigo-400 group-hover:scale-110'} transition-all duration-300`}>
                      {React.cloneElement(item.icon as React.ReactElement<{ size: number }>, { size: 16 })}
                    </span>
                    <span className={`text-[11px] font-bold transition-transform duration-300 ${
                      currentView === item.id 
                        ? (i18n.language === 'ar' ? '-translate-x-1' : 'translate-x-1') 
                        : (i18n.language === 'ar' ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1')
                    }`}>
                      {t((item as any).translationKey) || item.label}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
      
      <div className="p-6 border-t border-white/5 bg-slate-900 bg-opacity-20 relative z-10">
        <div 
          onClick={() => onViewChange(ViewState.PROFILE)}
          className="flex items-center gap-3 mb-4 p-3 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors duration-300 cursor-pointer"
        >
           <div className="w-9 h-9 bg-slate-800 text-indigo-400 rounded-lg flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-105 transition-transform duration-500 border border-indigo-500 border-opacity-20">
              {user.name.charAt(0)}
           </div>
           <div className={`flex-1 min-w-0 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
              <p className="text-[10px] text-white font-bold truncate">{user.name}</p>
              <p className="text-[8px] text-slate-500 font-bold uppercase tracking-tighter">جلسة آمنة ومحمية</p>
           </div>
           <button 
             onClick={onLogout}
             className="p-2 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all duration-300"
             title="تسجيل الخروج"
           >
             <LogOut size={16} />
           </button>
        </div>

        {licenseInfo && !licenseInfo.isActivated && (
          <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
              <span className="text-[10px] font-bold text-amber-500">فترة تجريبية</span>
            </div>
            <p className="text-[9px] text-amber-200 font-bold">متبقي {daysLeft} أيام على انتهاء التجربة</p>
          </div>
        )}

        <p className="text-[9px] text-slate-600 font-medium text-center opacity-50 tracking-widest uppercase mb-1">نِـبـراس ERP - إصدار {pkg.version}</p>
        <p className="text-[8px] text-slate-600 text-opacity-40 font-bold text-center">م / إسلام هديه © 2026</p>
      </div>
    </div>
  );
};

export default Sidebar;
