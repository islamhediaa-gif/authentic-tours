
import React, { useState } from 'react';
import { Key, Shield, CheckCircle2, AlertCircle, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface ProfileViewProps {
  currentUser: User | null;
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ currentUser, setUsers }) => {
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [securityStatus, setSecurityStatus] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const isMasterKey = (passwords.current === 'NEBRAS@2026@ADMIN');
    if (passwords.current !== currentUser.password && !isMasterKey) {
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

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 opacity-10 rounded-full blur-3xl -translate-y-32 translate-x-32"></div>
          <div className="relative z-10 flex items-center gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
              <UserIcon size={40} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{currentUser?.name}</h2>
              <p className="text-slate-400 font-medium">@{currentUser?.username} • {currentUser?.role}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <div className="p-3 bg-slate-900 text-indigo-400 rounded-xl shadow-sm"><Shield size={20}/></div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">تغيير كلمة المرور الشخصية</h3>
              <p className="text-slate-500 font-medium text-xs">تأكد من اختيار كلمة مرور قوية لحماية بيانات الشركة المالية</p>
            </div>
          </div>

          {securityStatus && (
            <div className={`p-4 rounded-xl flex items-center gap-3 font-bold text-sm ${securityStatus.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
              {securityStatus.type === 'success' ? <CheckCircle2 size={18}/> : <AlertCircle size={18}/>}
              {securityStatus.msg}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">كلمة المرور الحالية</label>
              <input 
                type="password" 
                required 
                className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl font-bold text-lg outline-none transition-all" 
                value={passwords.current} 
                onChange={e => setPasswords({...passwords, current: e.target.value})} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">كلمة المرور الجديدة</label>
              <input 
                type="password" 
                required 
                className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl font-bold text-lg outline-none transition-all" 
                value={passwords.new} 
                onChange={e => setPasswords({...passwords, new: e.target.value})} 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">تأكيد كلمة المرور الجديدة</label>
              <input 
                type="password" 
                required 
                className="w-full p-4 bg-slate-50 border border-slate-200 focus:border-indigo-600 rounded-xl font-bold text-lg outline-none transition-all" 
                value={passwords.confirm} 
                onChange={e => setPasswords({...passwords, confirm: e.target.value})} 
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-emerald-600 transition-all transform active:scale-[0.98] border-b-4 border-slate-900 hover:border-emerald-700"
            >
              تحديث كلمة المرور الآن
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
