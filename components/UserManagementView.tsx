
import React, { useState } from 'react';
import { UserPlus, Shield, Trash2, X, Save, User as UserIcon, Lock, Edit2 } from 'lucide-react';
import { User, Employee } from '../types';
import { ALL_PERMISSIONS } from '../constants';

interface UserManagementViewProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  deleteUser: (id: string) => void;
  currentUser: User;
  addAuditLog: (action: any, entityType: any, entityId: string, details: string, oldV?: any, newV?: any) => void;
  employees: Employee[];
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ users, setUsers, deleteUser, currentUser, addAuditLog, employees }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Omit<User, 'id'>>({
    username: '',
    password: '',
    name: '',
    role: 'USER',
    permissions: [],
    employeeId: ''
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let permissions = formData.permissions;
    if (formData.role === 'BOOKING_EMPLOYEE') {
      permissions = ['MANAGE_CUSTOMERS', 'MANAGE_SUPPLIERS', 'MANAGE_TREASURY', 'MANAGE_BOOKINGS', 'VIEW_REPORTS'];
    }
    const newUser: User = {
      id: Date.now().toString(),
      ...formData,
      permissions
    };
    setUsers(prev => [...prev, newUser]);
    addAuditLog('CREATE', 'SETTINGS', newUser.id, `إضافة مستخدم جديد: ${newUser.name} (@${newUser.username})`, undefined, newUser);
    setShowAdd(false);
    setFormData({ username: '', password: '', name: '', role: 'USER', permissions: [], employeeId: '' });
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: (prev.permissions || []).includes(permId)
        ? (prev.permissions || []).filter(p => p !== permId)
        : [...(prev.permissions || []), permId]
    }));
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      username: user?.username || '',
      password: user?.password || '',
      name: user?.name || '',
      role: user?.role || 'USER',
      permissions: user?.permissions || [],
      employeeId: user?.employeeId || ''
    });
    setShowAdd(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const updatedUser = { ...editingUser, ...formData };
    setUsers(prev => (Array.isArray(prev) ? prev : []).map(u => u.id === editingUser.id ? updatedUser : u));
    addAuditLog('UPDATE', 'SETTINGS', editingUser.id, `تعديل بيانات المستخدم: ${updatedUser.name} (@${updatedUser.username})`, editingUser, updatedUser);
    setShowAdd(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', name: '', role: 'USER', permissions: [], employeeId: '' });
  };

  const toggleSelectAll = () => {
    const selectable = (Array.isArray(users) ? users : []).filter(u => u && u.id !== 'admin' && u.id !== currentUser?.id);
    if (selectedIds.length === selectable.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(selectable.map(u => u.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => 
      (prev || []).includes(id) ? prev.filter(i => i !== id) : [...(prev || []), id]
    );
  };

  const handleBulkDelete = () => {
    if (confirm(`هل أنت متأكد من حذف ${selectedIds.length} من المستخدمين المحددين؟`)) {
      selectedIds.forEach(id => deleteUser(id));
      setSelectedIds([]);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-slate-900 text-indigo-400 rounded-2xl shadow-lg shadow-slate-200">
             <Shield size={24} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">إدارة مستخدمي النظام</h2>
            <p className="text-slate-500 font-medium text-xs mt-1">التحكم في صلاحيات الوصول وأمن الحسابات</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="bg-rose-500 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 shadow-lg hover:bg-rose-600 transition-all active:scale-95 animate-in zoom-in"
            >
              <Trash2 size={18} /> حذف ({selectedIds.length})
            </button>
          )}
          <button 
            onClick={toggleSelectAll}
            className="bg-slate-100 text-slate-900 px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-slate-200 transition-all active:scale-95"
          >
            {selectedIds.length === (Array.isArray(users) ? users : []).filter(u => u && u.id !== 'admin' && u.id !== currentUser?.id).length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
          </button>
          <button 
            onClick={() => setShowAdd(true)} 
            className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-3 shadow-sm hover:bg-slate-800 transition-all active:scale-95"
          >
            <UserPlus size={18} />
            إضافة مستخدم جديد
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 border-b-4 border-b-slate-900 shadow-xl animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-900 text-indigo-400 rounded-xl">
                 <UserPlus size={20} />
              </div>
              <h3 className="text-xl font-bold text-slate-900">{editingUser ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد للنظام'}</h3>
            </div>
            <button onClick={() => { setShowAdd(false); setEditingUser(null); setFormData({ username: '', password: '', name: '', role: 'USER', permissions: [], employeeId: '' }); }} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all duration-300">
              <X size={20}/>
            </button>
          </div>
          <form onSubmit={editingUser ? handleUpdate : handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">اسم الموظف</label>
                <input required className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 ring-opacity-10 focus:border-slate-900 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">اسم المستخدم</label>
                <input required className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 ring-opacity-10 focus:border-slate-900 transition-all" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">كلمة المرور</label>
                <input required type="password" className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 ring-opacity-10 focus:border-slate-900 transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">الدور الوظيفي</label>
                <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 ring-opacity-10 focus:border-slate-900 transition-all" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value as any})}>
                  <option value="USER" className="font-bold">موظف عادي</option>
                  <option value="BOOKING_EMPLOYEE" className="font-bold">موظف حجز</option>
                  <option value="ADMIN" className="font-bold">مدير نظام (Full Access)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-500 px-1 uppercase tracking-wider">ربط بسجل موظف</label>
                <select className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none focus:ring-2 focus:ring-slate-900 ring-opacity-10 focus:border-slate-900 transition-all" value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}>
                  <option value="">غير مرتبط</option>
                  {(employees || []).map(emp => (
                    <option key={emp?.id} value={emp?.id}>{emp?.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-slate-100">
               <label className="text-sm font-bold text-slate-900 block flex items-center gap-2">
                 <Shield size={16} className="text-indigo-600"/>
                 تحديد صلاحيات الوصول والعمليات
               </label>
               <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {ALL_PERMISSIONS.map(p => (
                    <label key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${formData.permissions.includes(p.id) ? 'bg-slate-900 text-indigo-400 border-slate-900 shadow-md' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-500 hover:bg-indigo-50 bg-opacity-30'}`}>
                      <input type="checkbox" className="hidden" checked={formData.permissions.includes(p.id)} onChange={() => togglePermission(p.id)} />
                      <span className="font-bold text-[10px] uppercase tracking-tighter">{p.label}</span>
                    </label>
                  ))}
               </div>
            </div>

            <div className="flex justify-end pt-8 border-t border-slate-100 gap-4">
                <button type="button" onClick={() => { setShowAdd(false); setEditingUser(null); setFormData({ username: '', password: '', name: '', role: 'USER', permissions: [], employeeId: '' }); }} className="px-8 py-3 text-slate-400 font-bold hover:text-rose-600 transition-colors text-sm">إلغاء</button>
                <button type="submit" className="bg-slate-900 text-white px-12 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-600 transition-all active:scale-95">
                  {editingUser ? 'تحديث بيانات المستخدم' : 'إصدار حساب مستخدم جديد'}
                </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.isArray(users) && users.map(u => (
            <div key={u?.id} className={`bg-white p-6 rounded-3xl shadow-sm border relative group transition-all duration-300 hover:border-indigo-200 overflow-hidden ${(u?.id && selectedIds.includes(u.id)) ? 'ring-2 ring-indigo-500 border-indigo-500' : 'border-slate-200'}`}>
               <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    {u?.id && u.id !== 'admin' && u.id !== currentUser?.id && (
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 accent-slate-900 rounded cursor-pointer"
                        checked={selectedIds.includes(u.id)}
                        onChange={() => toggleSelect(u.id)}
                      />
                    )}
                    <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300"><UserIcon size={24}/></div>
                  </div>
                  <div className="flex gap-1">
                    {currentUser?.role === 'ADMIN' && u?.id !== currentUser?.id && u?.id !== 'admin' && (
                      <button onClick={() => handleEdit(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="تعديل"><Edit2 size={16}/></button>
                    )}
                    {u?.id && u.id !== 'admin' && (
                      <button onClick={() => deleteUser(u.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="حذف"><Trash2 size={16}/></button>
                    )}
                  </div>
               </div>
              <h4 className="text-xl font-bold text-slate-900 tracking-tight">{u?.name}</h4>
              <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">@{u?.username} • {u?.role}</p>
              <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-1.5">
                 {Array.isArray(u?.permissions) && u.permissions.map(p => (
                   <span key={p} className="text-[9px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md uppercase">{p}</span>
                 ))}
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default UserManagementView;
