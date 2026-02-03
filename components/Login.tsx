
import React, { useState } from 'react';
import { Lock, User, ShieldCheck, Sparkles, Eye, EyeOff, Terminal } from 'lucide-react';
import pkg from '../package.json';

interface LoginProps {
  onLogin: (user: string, pass: string) => void;
  appName: string;
  logo?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, appName, logo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(username, password);
  };

  return (
    <div className="flex-1 bg-[#020617] flex items-center justify-center p-4 font-['Cairo'] relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 bg-opacity-20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500 bg-opacity-10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-[0.03]" 
             style={{ backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>
      </div>

      <div className="max-w-[900px] w-full flex flex-col md:flex-row bg-slate-900 bg-opacity-40 backdrop-blur-3xl rounded-3xl shadow-2xl border border-white/10 overflow-hidden relative z-10">
        
        {/* Left Branding Panel */}
        <div className="md:w-5/12 bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-900 p-10 text-white flex flex-col justify-between relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute inset-0" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")` }}></div>
          </div>
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full border border-white/10 mb-8">
               <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping"></div>
               <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-100">نظام ذكي متصل</span>
            </div>
            
            <div className="mb-10">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-6 shadow-xl overflow-hidden border border-white/20">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Terminal size={28} className="text-indigo-600" />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-4 tracking-tighter leading-tight">
                {appName || 'نِـبـراس'} <span className="text-indigo-200">PRO</span>
              </h1>
              <p className="text-indigo-100 text-opacity-70 text-sm font-bold leading-relaxed">
                قوة التكنولوجيا في خدمة أعمالكم. النسخة الاحترافية الأكثر ذكاءً وأماناً لعام 2026.
              </p>
            </div>
          </div>

          <div className="relative z-10 space-y-4">
             <div className="flex items-center gap-4 bg-black/20 p-4 rounded-xl border border-white/5">
                <ShieldCheck className="text-indigo-400" size={24} />
                <span className="text-xs font-bold">حماية بيانات عسكرية 256-bit</span>
             </div>
             <p className="text-[9px] text-indigo-300 text-opacity-50 font-bold tracking-widest text-center uppercase">Integrated Enterprise Architecture</p>
             <p className="text-[10px] text-indigo-200 text-opacity-40 font-bold text-center mt-2">تطوير وبرمجة: م / إسلام هديه © 2026</p>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="md:w-7/12 p-10 flex flex-col justify-center relative">
          <div className="max-w-md mx-auto w-full">
            <div className="mb-10 text-right md:text-right">
              <div className="flex items-center gap-2 mb-2 justify-end">
                <h2 className="text-2xl font-bold text-white tracking-tighter">تسجيل الدخول</h2>
                <Sparkles className="text-amber-400" size={20} />
              </div>
              <p className="text-slate-400 font-bold text-sm">أهلاً بك مجدداً، برجاء إدخال بيانات الوصول</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] block pr-1">هوية المستخدم</label>
                <div className="relative group">
                  <User className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    type="text"
                    required
                    className="w-full pr-14 pl-5 py-3.5 bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-white font-bold text-sm placeholder-slate-600"
                    placeholder="اسم المستخدم"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] block pr-1">كلمة المرور</label>
                <div className="relative group">
                  <Lock className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="w-full pr-14 pl-14 py-3.5 bg-slate-800 bg-opacity-50 border border-slate-700 rounded-xl focus:border-indigo-500 outline-none transition-all text-white font-bold text-sm placeholder-slate-600"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-bold text-base transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-3 mt-4"
              >
                دخول النظام
              </button>
            </form>

            <div className="mt-10 pt-8 border-t border-slate-800 flex justify-between items-center opacity-50">
               <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Version {pkg.version}</p>
               <div className="flex gap-4">
                  <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                  <div className="w-1 h-1 rounded-full bg-slate-600"></div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
