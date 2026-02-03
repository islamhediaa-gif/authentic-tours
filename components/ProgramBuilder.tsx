import React, { useState, useRef, useMemo } from 'react';
import { 
  Calculator, FileText, Image as ImageIcon, Plus, Trash2, Download, Printer, 
  MapPin, Hotel, Plane, ShieldCheck, Users, Info, DollarSign, Palette, Layout, Save, CheckCircle2,
  Calendar, Phone, Mail, Facebook, Globe, Share2, Star
} from 'lucide-react';
import { CompanySettings, Currency } from '../types';
import SearchableSelect from './SearchableSelect';

interface HotelCosting {
  id: string;
  name: string;
  location: 'MECCA' | 'MEDINA';
  nights: number;
  singlePrice: number;
  doublePrice: number;
  triplePrice: number;
  quadPrice: number;
  imageUrl?: string;
  stars: number;
}

interface ProgramPlan {
  name: string;
  type: 'HAJJ' | 'UMRAH';
  startDate: string;
  airline: string;
  flightCost: number;
  visaCost: number;
  transportCost: number;
  otherCosts: number;
  marginType: 'PERCENTAGE' | 'FIXED';
  margin: number;
  hotels: HotelCosting[];
  childCost: number;
  infantCost: number;
  contactPhone?: string;
  contactEmail?: string;
}

interface ProgramBuilderProps {
  settings: CompanySettings;
  currencies: Currency[];
  formatCurrency: (amount: number) => string;
}

const ProgramBuilder: React.FC<ProgramBuilderProps> = ({ settings, currencies, formatCurrency }) => {
  const [activeTab, setActiveTab] = useState<'CALC' | 'DESIGN'>('CALC');
  const [plan, setPlan] = useState<ProgramPlan>({
    name: 'برنامج عمرة مميز - شهر رجب',
    type: 'UMRAH',
    startDate: new Date().toISOString().split('T')[0],
    airline: 'مصر للطيران',
    flightCost: 15000,
    visaCost: 5500,
    transportCost: 1200,
    otherCosts: 500,
    marginType: 'FIXED',
    margin: 2000,
    hotels: [],
    childCost: 12000,
    infantCost: 6500,
    contactPhone: settings?.phone || '',
    contactEmail: settings?.email || ''
  });

  const brochureRef = useRef<HTMLDivElement>(null);

  const addHotel = () => {
    const newHotel: HotelCosting = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      location: plan.hotels.some(h => h.location === 'MECCA') ? 'MEDINA' : 'MECCA',
      nights: 5,
      singlePrice: 0,
      doublePrice: 0,
      triplePrice: 0,
      quadPrice: 0,
      stars: 5
    };
    setPlan({ ...plan, hotels: [...plan.hotels, newHotel] });
  };

  const updateHotel = (id: string, updates: Partial<HotelCosting>) => {
    setPlan({
      ...plan,
      hotels: plan.hotels.map(h => h.id === id ? { ...h, ...updates } : h)
    });
  };

  const removeHotel = (id: string) => {
    setPlan({ ...plan, hotels: plan.hotels.filter(h => h.id !== id) });
  };

  const handleImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateHotel(id, { imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const results = useMemo(() => {
    const baseFixed = (plan?.flightCost || 0) + (plan?.visaCost || 0) + (plan?.transportCost || 0) + (plan?.otherCosts || 0);
    
    // Calculate total hotel costs per person
    let hotelSingle = 0, hotelDouble = 0, hotelTriple = 0, hotelQuad = 0;
    
    (plan?.hotels || []).forEach(h => {
      hotelSingle += ((h?.singlePrice || 0) * (h?.nights || 0));
      hotelDouble += ((h?.doublePrice || 0) * (h?.nights || 0));
      hotelTriple += ((h?.triplePrice || 0) * (h?.nights || 0));
      hotelQuad += ((h?.quadPrice || 0) * (h?.nights || 0));
    });

    const calcFinal = (cost: number) => {
      const totalCost = baseFixed + cost;
      if (plan?.marginType === 'PERCENTAGE') {
        return totalCost * (1 + ((plan?.margin || 0) * 0.01));
      }
      return totalCost + (plan?.margin || 0);
    };

    return {
      single: calcFinal(hotelSingle),
      double: calcFinal(hotelDouble),
      triple: calcFinal(hotelTriple),
      quad: calcFinal(hotelQuad),
      child: plan?.childCost || 0,
      infant: plan?.infantCost || 0
    };
  }, [plan]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 font-['Cairo'] pb-20 animate-in fade-in duration-500">
      {/* Header Navigation */}
      <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-center no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-rose-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-200">
            <Layout size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">مصمم البرامج والعروض التسويقية</h2>
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">Program costing & brochure builder</p>
          </div>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          <button 
            onClick={() => setActiveTab('CALC')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'CALC' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:bg-white hover:bg-opacity-50'}`}
          >
            <Calculator size={14}/> حساب التكاليف
          </button>
          <button 
            onClick={() => setActiveTab('DESIGN')}
            className={`px-6 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'DESIGN' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-500 hover:bg-white hover:bg-opacity-50'}`}
          >
            <Palette size={14}/> التصميم الإعلاني
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Configuration (Always visible on desktop, hidden on print unless in design mode) */}
        <div className={`lg:col-span-5 space-y-6 no-print ${activeTab === 'DESIGN' ? 'hidden lg:block' : ''}`}>
          {/* Basic Info */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3 mb-2">
              <Info size={18} className="text-rose-500"/>
              <span className="font-bold text-sm">معلومات البرنامج الأساسية</span>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">اسم البرنامج التسويقي</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-500 transition-all"
                  value={plan.name}
                  onChange={e => setPlan({...plan, name: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">تاريخ البدء المتوقع</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-500 transition-all"
                    value={plan.startDate}
                    onChange={e => setPlan({...plan, startDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">شركة الطيران</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-500 transition-all"
                    value={plan.airline}
                    onChange={e => setPlan({...plan, airline: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">أرقام التواصل للعرض</label>
                  <input 
                    type="text" 
                    placeholder="مثال: 010xxxxxxxx"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-500 transition-all"
                    value={plan.contactPhone}
                    onChange={e => setPlan({...plan, contactPhone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">البريد الإلكتروني للعرض</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:border-rose-500 transition-all"
                    value={plan.contactEmail}
                    onChange={e => setPlan({...plan, contactEmail: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hotel Costs */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
              <div className="flex items-center gap-2 text-slate-900">
                <Hotel size={18} className="text-rose-500"/>
                <span className="font-bold text-sm">تكاليف السكن (لكل ليلة للفرد)</span>
              </div>
              <button 
                onClick={addHotel}
                className="bg-rose-50 text-rose-600 p-2 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm"
              >
                <Plus size={16}/>
              </button>
            </div>

            <div className="space-y-6">
              {plan.hotels.map((hotel, idx) => (
                <div key={hotel.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 relative group">
                  <button 
                    onClick={() => removeHotel(hotel.id)}
                    className="absolute -top-2 -left-2 bg-rose-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                  >
                    <Trash2 size={12}/>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-[9px] font-bold text-slate-400 mb-1 block">اسم الفندق</label>
                      <input 
                        type="text" 
                        placeholder="مثال: فندق موفنبيك هاجر"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-rose-500"
                        value={hotel.name}
                        onChange={e => updateHotel(hotel.id, { name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 mb-1 block">الموقع</label>
                      <select 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer"
                        value={hotel.location}
                        onChange={e => updateHotel(hotel.id, { location: e.target.value as any })}
                      >
                        <option value="MECCA">مكة المكرمة</option>
                        <option value="MEDINA">المدينة المنورة</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 mb-1 block">الليالي</label>
                      <input 
                        type="number" 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none"
                        value={hotel.nights}
                        onChange={e => updateHotel(hotel.id, { nights: Number(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 mb-1 block">تصنيف الفندق</label>
                      <select 
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer"
                        value={hotel.stars}
                        onChange={e => updateHotel(hotel.id, { stars: Number(e.target.value) })}
                      >
                        <option value={5}>5 نجوم</option>
                        <option value={4}>4 نجوم</option>
                        <option value={3}>3 نجوم</option>
                        <option value={2}>نجمتان</option>
                        <option value={1}>نجمة واحدة</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'سنجل', field: 'singlePrice' },
                      { label: 'ثنائي', field: 'doublePrice' },
                      { label: 'ثلاثي', field: 'triplePrice' },
                      { label: 'رباعي', field: 'quadPrice' }
                    ].map(type => (
                      <div key={type.field}>
                        <label className="text-[8px] font-bold text-slate-400 mb-1 block text-center">{type.label}</label>
                        <input 
                          type="number" 
                          className="w-full px-2 py-2 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-center outline-none focus:border-rose-500"
                          value={(hotel as any)[type.field]}
                          onChange={e => updateHotel(hotel.id, { [type.field]: Number(e.target.value) })}
                        />
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 mb-1 block">صورة الفندق (اختياري)</label>
                    <div className="flex items-center gap-3">
                      <input 
                        type="file" 
                        accept="image/*"
                        className="hidden"
                        id={`img-${hotel.id}`}
                        onChange={e => handleImageUpload(hotel.id, e)}
                      />
                      <label 
                        htmlFor={`img-${hotel.id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-rose-400 hover:bg-rose-50 transition-all"
                      >
                        {hotel.imageUrl ? <ImageIcon size={14} className="text-rose-500"/> : <Plus size={14} className="text-slate-400"/>}
                        <span className="text-[10px] font-bold text-slate-500">{hotel.imageUrl ? 'تغيير الصورة' : 'رفع صورة الفندق'}</span>
                      </label>
                      {hotel.imageUrl && (
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200">
                          <img src={hotel.imageUrl} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {plan.hotels.length === 0 && (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-3xl text-slate-400">
                  <p className="text-xs font-bold">لا توجد فنادق مضافة</p>
                  <p className="text-[10px]">اضغط على (+) لإضافة فندق مكة أو المدينة</p>
                </div>
              )}
            </div>
          </div>

          {/* Fixed Costs & Margins */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 border-b border-slate-100 pb-3 mb-2">
              <DollarSign size={18} className="text-rose-500"/>
              <span className="font-bold text-sm">التكاليف الثابتة وهامش الربح</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="text-[9px] font-bold text-slate-400 mb-1 block">سعر تذكرة الطيران</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  value={plan.flightCost}
                  onChange={e => setPlan({...plan, flightCost: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1 block">تكلفة التأشيرة</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  value={plan.visaCost}
                  onChange={e => setPlan({...plan, visaCost: Number(e.target.value)})}
                />
              </div>
              <div>
                <label className="text-[9px] font-bold text-slate-400 mb-1 block">تكلفة الباص أو النقل</label>
                <input 
                  type="number" 
                  className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none"
                  value={plan.transportCost}
                  onChange={e => setPlan({...plan, transportCost: Number(e.target.value)})}
                />
              </div>
              <div className="col-span-2">
                <div className="flex gap-4 p-3 bg-rose-50 rounded-2xl border border-rose-100">
                  <div className="flex-1">
                    <label className="text-[9px] font-bold text-rose-700 mb-1 block">هامش الربح لكل فرد</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                      value={plan.margin}
                      onChange={e => setPlan({...plan, margin: Number(e.target.value)})}
                    />
                  </div>
                  <div className="w-1/3">
                    <label className="text-[9px] font-bold text-rose-700 mb-1 block">النوع</label>
                    <select 
                      className="w-full px-3 py-2 bg-white border border-rose-200 rounded-xl text-[10px] font-bold outline-none cursor-pointer"
                      value={plan.marginType}
                      onChange={e => setPlan({...plan, marginType: e.target.value as any})}
                    >
                      <option value="FIXED">مبلغ ثابت</option>
                      <option value="PERCENTAGE">نسبة %</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100">
                  <label className="text-[9px] font-bold text-sky-700 mb-1 block">سعر الطفل النهائي</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-bold outline-none focus:border-sky-500"
                    value={plan.childCost}
                    onChange={e => setPlan({...plan, childCost: Number(e.target.value)})}
                  />
                </div>
                <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100">
                  <label className="text-[9px] font-bold text-sky-700 mb-1 block">سعر الرضيع النهائي</label>
                  <input 
                    type="number" 
                    className="w-full px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-bold outline-none focus:border-sky-500"
                    value={plan.infantCost}
                    onChange={e => setPlan({...plan, infantCost: Number(e.target.value)})}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Results & Preview */}
        <div className="lg:col-span-7 space-y-6">
          {activeTab === 'CALC' ? (
            <div className="space-y-6">
              {/* Pricing Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'سعر السنجل', value: results.single, color: 'slate' },
                  { label: 'سعر الثنائي', value: results.double, color: 'rose' },
                  { label: 'سعر الثلاثي', value: results.triple, color: 'rose' },
                  { label: 'سعر الرباعي', value: results.quad, color: 'rose' },
                  { label: 'سعر الطفل', value: results.child, color: 'amber' },
                  { label: 'سعر الرضيع', value: results.infant, color: 'rose' },
                ].map(card => (
                  <div key={card.label} className={`bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center gap-1 hover:shadow-md transition-all`}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{card.label}</p>
                    <p className={`text-xl font-black ${card.color === 'rose' ? 'text-rose-600' : 'text-slate-900'}`}>
                      {card.value > 0 ? card.value.toLocaleString() : '---'}
                    </p>
                    <span className="text-[8px] font-bold text-slate-300">جنية مصري</span>
                  </div>
                ))}
              </div>

              {/* Cost Summary Table */}
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Calculator size={18} className="text-rose-400"/>
                    <span className="font-bold text-sm">تفصيل التكاليف (تحليل مالي داخلي)</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Profit Analysis</div>
                </div>
                <table className="w-full text-right">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-200">
                    <tr>
                      <th className="p-4">البند</th>
                      <th className="p-4 text-center">التكلفة الفعلية</th>
                      <th className="p-4 text-center">هامش الربح</th>
                      <th className="p-4 text-center">سعر البيع النهائي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-bold">
                    <tr>
                      <td className="p-4 text-slate-600 italic">سعر الفرد في الثنائي (فنادق + تأشيرة + باص + إضافي)</td>
                      <td className="p-4 text-center text-slate-900">
                        {results.double > 0 ? (results.double - (plan.marginType === 'FIXED' ? plan.margin : (results.double * (1 / (1 + ((plan.margin * 0.01)))) * ((plan.margin * 0.01))))).toLocaleString() : '0'}
                      </td>
                      <td className="p-4 text-center text-rose-600">
                        {plan.marginType === 'FIXED' ? `+ ${plan.margin.toLocaleString()}` : `% ${plan.margin}`}
                      </td>
                      <td className="p-4 text-center text-slate-900 bg-slate-50 bg-opacity-50">{results.double.toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Brochure Preview Toolbar */}
              <div className="flex justify-between items-center no-print">
                 <p className="text-xs font-bold text-slate-500 flex items-center gap-2">
                   <Star size={14} className="text-amber-500 fill-amber-500"/>
                   معاينة التصميم الإعلاني للعميل
                 </p>
                 <div className="flex gap-2">
                   <button 
                    onClick={handlePrint}
                    className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                   >
                    <Printer size={14}/> طباعة العرض - PDF
                   </button>
                 </div>
              </div>

              {/* The Real Brochure - Designed to look amazing */}
              <div 
                ref={brochureRef}
                className="bg-white w-full shadow-2xl rounded-3xl overflow-hidden border border-slate-100 print:shadow-none print:rounded-none print:border-0 font-['Cairo'] relative"
              >
                {/* Visual Header - Hero Section */}
                <div className="relative h-96 bg-slate-900">
                  {plan.hotels.find(h => h.imageUrl) ? (
                    <img 
                      src={plan.hotels.find(h => h.imageUrl)?.imageUrl} 
                      className="w-full h-full object-cover opacity-60"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-900 via-rose-900 to-slate-900 flex items-center justify-center">
                      <Hotel size={80} className="text-white text-opacity-10" />
                    </div>
                  )}
                  
                  {/* Company Info Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/40 p-10 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="bg-white bg-opacity-95 p-4 rounded-3xl shadow-2xl backdrop-blur-md">
                        {settings?.logo ? <img src={settings.logo} className="h-16 w-16 object-cover" /> : <div className="h-16 w-16 bg-rose-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl">{settings?.name?.[0] || 'A'}</div>}
                      </div>
                      <div className="text-right text-white drop-shadow-lg">
                        <h1 className="text-3xl font-black mb-1">{settings?.name || 'شركة الأصيل'}</h1>
                        <p className="text-rose-400 font-bold tracking-widest text-[10px] uppercase">نسعد بخدمتكم دائماً</p>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                       <span className="inline-block px-4 py-1 bg-rose-500 text-white rounded-full text-[10px] font-bold uppercase tracking-widest mb-2 shadow-lg animate-pulse">
                         {plan?.type === 'HAJJ' ? 'برامج الحج المتميزة' : 'برامج العمرة الاقتصادية والمميزة'}
                       </span>
                       <h2 className="text-4xl font-black text-white leading-tight">{plan?.name}</h2>
                       <div className="flex items-center gap-6 justify-end pt-2">
                          <div className="flex items-center gap-2 text-white text-opacity-80 font-bold text-xs">
                             <Calendar size={14} className="text-rose-400"/>
                             تاريخ الرحلة: {plan?.startDate ? new Date(plan.startDate).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '---'}
                          </div>
                          <div className="flex items-center gap-2 text-white text-opacity-80 font-bold text-xs">
                             <Plane size={14} className="text-rose-400"/>
                             طيران: {plan?.airline || '---'}
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-10 grid grid-cols-1 md:grid-cols-12 print-grid gap-10">
                  {/* Details Column */}
                  <div className="md:col-span-8 print-col-8 space-y-8">
                    {/* Hotels Display */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                        <Hotel className="text-rose-600" size={20}/>
                        <h3 className="text-lg font-bold text-slate-900">الإقامة والفنادق</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {(plan?.hotels || []).map(hotel => (
                          <div key={hotel?.id} className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-3 hover:shadow-md transition-all">
                             {hotel?.imageUrl && <img src={hotel.imageUrl} className="w-full h-32 object-cover rounded-2xl mb-2 shadow-sm"/>}
                             <div className="flex justify-between items-start">
                               <div>
                                 <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest">{hotel?.location === 'MECCA' ? 'مكة المكرمة' : 'المدينة المنورة'}</p>
                                 <h4 className="font-bold text-slate-900">{hotel?.name || 'لم يتم تحديد الفندق'}</h4>
                               </div>
                               <div className="flex gap-0.5">
                                 {[...Array(hotel?.stars || 0)].map((_, i) => <Star key={i} size={10} className="fill-amber-400 text-amber-400"/>)}
                               </div>
                             </div>
                             <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px]">
                                <Users size={12}/> {hotel?.nights || 0} ليالي إقامة متميزة
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Features section */}
                    <div className="bg-rose-50 bg-opacity-50 p-6 rounded-3xl border border-rose-100 border-opacity-50 space-y-4">
                       <h3 className="font-bold text-rose-800 text-sm flex items-center gap-2">
                         <CheckCircle2 size={16}/> البرنامج يشمل:
                       </h3>
                       <div className="grid grid-cols-2 gap-y-3">
                          {[
                            'استخراج التأشيرة والباركود الرسمي',
                            'تذاكر الطيران الدولية (ذهاب وعودة)',
                            'الانتقالات الداخلية بأحدث الباصات',
                            'مشرف مرافق متخصص طوال الرحلة',
                            'شنطة هدايا وكتب مناسك',
                            'جولات ومزارات دينية مجانية'
                          ].map(item => (
                            <div key={item} className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                               <div className="w-1.5 h-1.5 bg-rose-500 rounded-full"></div>
                               {item}
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>

                  {/* Pricing Sidebar */}
                  <div className="md:col-span-4 print-col-4 space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 bg-opacity-10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                       <div className="relative z-10 space-y-6">
                          <div className="text-center border-b border-white border-opacity-10 pb-4">
                            <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-1">أسعار الفرد بالبرنامج</p>
                            <h3 className="text-lg font-bold">باقات الإقامة</h3>
                          </div>

                          <div className="space-y-4">
                            {[
                              { label: 'الغرفة الرباعية', value: results.quad, icon: '4', highlight: false },
                              { label: 'الغرفة الثلاثية', value: results.triple, icon: '3', highlight: false },
                              { label: 'الغرفة الثنائية', value: results.double, icon: '2', highlight: true },
                              { label: 'الغرفة السنجل', value: results.single, icon: '1', highlight: false },
                              { label: 'سعر الطفل', value: results.child, icon: 'طفل', highlight: false },
                              { label: 'سعر الرضيع', value: results.infant, icon: 'رضيع', highlight: false },
                            ].filter(r => r.value > 0).map(rate => (
                              <div key={rate.label} className={`flex flex-col gap-1 p-4 rounded-[1.8rem] border transition-all ${rate.highlight ? 'bg-gradient-to-br from-rose-600 to-rose-700 border-rose-400 shadow-xl scale-105' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                                <div className="flex justify-between items-center">
                                  <span className={`text-[9px] font-bold uppercase tracking-wider ${rate.highlight ? 'text-rose-100' : 'text-white text-opacity-50'}`}>{rate.label}</span>
                                  <div className={`px-2 py-0.5 rounded-full flex items-center justify-center text-[7px] font-black uppercase ${rate.highlight ? 'bg-white text-rose-600' : 'bg-slate-700 text-white text-opacity-40'}`}>
                                    {rate.icon}
                                  </div>
                                </div>
                                <div className="flex items-baseline gap-1">
                                   <p className="text-xl font-black leading-none tracking-tight">{rate.value.toLocaleString()}</p>
                                   <p className={`text-[7px] font-bold ${rate.highlight ? 'text-rose-200' : 'text-white text-opacity-40'}`}>جنية مصري</p>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="pt-2 text-[9px] text-white text-opacity-50 text-center font-bold">
                            * الأسعار متغيرة طبقاً لتغيرات سعر الصرف
                          </div>
                       </div>
                    </div>

                    {/* Contact Info Inside Sidebar */}
                    <div className="bg-white rounded-3xl p-6 shadow-xl space-y-4">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">للحجز والاستفسار</p>
                       <div className="space-y-3">
                          {plan.contactPhone && (
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                               <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                                  <Phone size={14}/>
                               </div>
                               {plan.contactPhone}
                            </div>
                          )}
                          {plan.contactEmail && (
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                               <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                                  <Mail size={14}/>
                               </div>
                               <span className="truncate">{plan.contactEmail}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3 text-xs font-bold text-slate-700">
                             <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                                <MapPin size={14}/>
                             </div>
                             <span className="truncate">{settings.address}</span>
                          </div>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Footer Bar */}
                <div className="bg-slate-900 p-8 flex justify-between items-center text-white relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-rose-600 bg-opacity-10 to-transparent"></div>
                   <div className="relative z-10 flex flex-col gap-1">
                      <div className="flex gap-6 text-[10px] font-bold uppercase tracking-widest text-white text-opacity-60">
                        {settings.facebook && <span className="flex items-center gap-2 hover:text-rose-400 transition-colors cursor-pointer"><Facebook size={12} className="text-rose-500"/> {settings.facebook}</span>}
                        {settings.website && <span className="flex items-center gap-2 hover:text-rose-400 transition-colors cursor-pointer"><Globe size={12} className="text-rose-500"/> {settings.website}</span>}
                      </div>
                      <p className="text-[8px] text-white text-opacity-30 font-medium">© 2026 {settings.name}. All rights reserved.</p>
                   </div>
                   <div className="relative z-10 text-right">
                      <div className="text-[10px] font-black tracking-widest text-rose-500 mb-1">NEBRAS ERP PRO</div>
                      <div className="text-[8px] text-white text-opacity-20 font-bold uppercase">Professional Travel Management System</div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramBuilder;
