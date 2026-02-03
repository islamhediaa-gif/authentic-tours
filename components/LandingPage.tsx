
import React, { useState } from 'react';
import { 
  ShieldCheck, Zap, BarChart3, Users, Globe, CheckCircle2, 
  MessageSquare, ArrowLeft, ArrowRight, LayoutDashboard, 
  Database, Lock, Smartphone, Headphones, Building2, X,
  Sparkles, RefreshCw, 
} from 'lucide-react';

const SparkleIcon = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

interface LandingPageProps {
  onStart: (companyName?: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const isMaintenance = false; // تحويل الموقع إلى وضع التحديث

  const handleSubscriberLogin = async () => {
    if (companyName.trim()) {
      setIsLoading(true);
      try {
        await onStart(companyName.trim().toLowerCase());
      } finally {
        setIsLoading(false);
      }
    }
  };

  const plans = [
    {
      name: "الباقة الأساسية",
      price: "15,000 ج.م",
      description: "نسخة سطح المكتب",
      features: ["إدارة العملاء والموردين", "الحسابات الختامية", "إدارة الخزينة والبنك", "تقارير أساسية"],
      icon: <Zap className="text-amber-500" />,
      recommended: false
    },
    {
      name: "الباقة الاحترافية",
      price: "20,000 ج.م",
      description: "سطح مكتب + دعم فني كامل",
      features: ["كل مميزات الأساسية", "نظام السياحة والطيران", "إدارة الموظفين والرواتب", "دعم فني شامل 24/7"],
      icon: <ShieldCheck className="text-indigo-500" />,
      recommended: true
    },
    {
      name: "باقة المؤسسات",
      price: "30,000 ج.م",
      description: "سطح مكتب + نسخة سحابية + دعم كامل",
      features: ["ربط فروع متعددة", "نسخة سحابية متزامنة", "خادم خاص للبيانات", "تدريب ميداني للفريق", "دعم فني متميز"],
      icon: <Database className="text-indigo-400" />,
      recommended: false
    }
  ];

  const contactPhone = "201148820573";
  const contactEmail = "islam.hediaa@gmail.com";
  const contactName = "إسلام هديه";

  return (
    <div className="min-h-screen bg-[#020617] text-white font-['Cairo'] overflow-x-hidden selection:bg-indigo-500/30">
      {isMaintenance ? (
        /* Maintenance Mode UI */
        <div className="min-h-screen flex items-center justify-center p-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-30">
            <div className="absolute top-[20%] right-[10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] animate-pulse"></div>
            <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[150px] animate-pulse"></div>
          </div>
          
          <div className="max-w-2xl w-full text-center relative z-10 space-y-12">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 animate-bounce">
                <RefreshCw size={48} className="animate-spin duration-[3000ms]" />
              </div>
            </div>
            
            <div className="space-y-6">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                نحن نطور <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">نِـبـراس ERP</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-xl font-bold leading-relaxed">
                الموقع والخدمات السحابية حالياً تحت التحديث لتقديم تجربة أسرع وأكثر ذكاءً. سنعود للعمل قريباً جداً.
              </p>
            </div>

            <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.open(`https://wa.me/${contactPhone}`, '_blank')}
                className="px-8 py-4 bg-white text-slate-950 rounded-2xl font-black transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
              >
                <MessageSquare size={20} />
                تواصل مع الدعم الفني
              </button>
              <button 
                onClick={() => window.open(`tel:${contactPhone}`, '_self')}
                className="px-8 py-4 bg-slate-900 border border-white/10 rounded-2xl font-black transition-all hover:bg-slate-800 flex items-center justify-center gap-3"
              >
                <Headphones size={20} />
                اتصل بنا
              </button>
            </div>

            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
              نأسف لهذا الإزعاج المؤقت - فريق عمل نِـبـراس 2026
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Navigation */}
      <nav className="fixed top-0 w-full z-[100] bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <span className="text-xl font-bold tracking-tighter">نِـبـراس ERP</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({top: 0, behavior: 'smooth'}); }} className="hover:text-white transition-colors">الرئيسية</a>
            <a href="#features" className="hover:text-white transition-colors">المميزات</a>
            <a href="#testimonials" className="hover:text-white transition-colors">قالوا عنا</a>
            <a href="#pricing" className="hover:text-white transition-colors">الأسعار</a>
            <a href="#contact" className="hover:text-white transition-colors">اتصل بنا</a>
          </div>
          <button 
            onClick={() => setShowPrompt(true)}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
          >
            دخول النظام
            <ArrowLeft size={16} />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-30">
          <div className="absolute top-[-10%] right-[10%] w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[150px] animate-pulse"></div>
          <div className="absolute bottom-[10%] left-[10%] w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-8 animate-bounce">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-xs font-bold text-indigo-300 uppercase tracking-widest">إصدار 2026 الاحترافي</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight tracking-tighter">
            أدِر أعمالك بذكاء مع <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-500">نظام نِـبـراس المتكامل</span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 font-bold leading-relaxed">
            الحل الأمثل لإدارة شركات السياحة والمؤسسات التجارية. دقة محاسبية، سهولة في الاستخدام، وأمان عسكري لبياناتك.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button 
              onClick={() => window.open(`https://wa.me/${contactPhone}`, '_blank')}
              className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-white/10 flex items-center gap-3"
            >
              <MessageSquare size={24} />
              اطلب تجربتك المجانية
            </button>
            <button 
              onClick={() => setShowPrompt(true)}
              className="px-10 py-5 bg-slate-900 border border-white/10 rounded-2xl font-black text-lg transition-all hover:bg-slate-800 flex items-center gap-3"
            >
              دخول المشتركين
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-white/5 bg-slate-950/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "عميل يثق بنا", value: "+500" },
              { label: "عملية يومية", value: "+100k" },
              { label: "دقة محاسبية", value: "100%" },
              { label: "دعم فني", value: "24/7" }
            ].map((stat, i) => (
              <div key={i} className="text-center group">
                <div className="text-3xl md:text-4xl font-black text-white mb-1 group-hover:text-indigo-400 transition-colors">{stat.value}</div>
                <div className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-6 bg-slate-950/50">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter">لماذا يختار المحترفون نبراس؟</h2>
          <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {[
            { title: "هندسة محاسبية ذكية", desc: "نظام قيود مزدوجة آلي يضمن توازن حساباتك بدقة متناهية وفقاً للمعايير الدولية.", icon: <BarChart3 /> },
            { title: "محرك قطاع السياحة", desc: "حلول متكاملة لإدارة الطيران، حجز الفنادق، وعمليات الحج والعمرة برؤية احترافية.", icon: <Globe /> },
            { title: "سيادة وأمان البيانات", desc: "تشفير متطور ونسخ احتياطي متعدد الطبقات يضمن بقاء بياناتك ملكاً لك وحدك.", icon: <Lock /> },
            { title: "لوحة تحكم استراتيجية", desc: "تحليلات لحظية ومؤشرات أداء (KPIs) تمنحك الرؤية الكاملة لاتخاذ قراراتك بثقة.", icon: <LayoutDashboard /> },
            { title: "رأس المال البشري", desc: "نظام متطور لإدارة الموارد البشرية، الرواتب، والتقييمات لتعزيز إنتاجية فريقك.", icon: <Users /> },
            { title: "دعم فني فائق", desc: "التزام كامل بالاستجابة السريعة والدعم التقني الميداني وعن بعد على مدار الساعة.", icon: <Headphones /> },
            { title: "تكنولوجيا عابرة للأجهزة", desc: "وصول كامل لنظامك عبر سطح المكتب، الويب، وتطبيقات الجوال بمرونة تامة.", icon: <Smartphone /> },
            { title: "مزامنة كونية", desc: "ربط لحظي بين كافة فروعك ومخازنك مهما تباعدت المسافات بفضل تقنية السحاب.", icon: <Zap /> }
          ].map((feat, i) => (
            <div key={i} className="group p-8 bg-slate-900/40 border border-white/5 rounded-[2.5rem] hover:border-indigo-500/30 transition-all duration-500">
              <div className="w-14 h-14 bg-indigo-600/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold mb-3">{feat.title}</h3>
              <p className="text-slate-400 text-sm font-bold leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter">قالوا عن نبراس</h2>
            <p className="text-slate-400 font-bold mb-8">ثقة شركاء النجاح هي محركنا الدائم للتطوير</p>
            <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "نظام نبراس نقل شركتنا لمستوى آخر من الاحترافية، الدقة في الحسابات وتقارير الطيران وفرت علينا مجهود كبير.",
                author: "أحمد منصور",
                role: "مدير شركة سياحة"
              },
              {
                quote: "أفضل ما في النظام هو سهولة الاستخدام والدعم الفني المتواصل. فريق العمل دائم الاستجابة لأي استفسار.",
                author: "سارة محمود",
                role: "رئيسة حسابات"
              },
              {
                quote: "استخدمنا العديد من البرامج، لكن نبراس هو الوحيد الذي استطاع تلبية كافة احتياجاتنا في إدارة الفروع والربط السحابي.",
                author: "محمد علي",
                role: "مدير عمليات"
              },
              {
                quote: "دقة التقارير المالية في نبراس مذهلة، لم نعد نخشى أخطاء الحسابات اليدوية، كل شيء يتم بضغطة زر.",
                author: "إبراهيم خالد",
                role: "محاسب قانوني"
              },
              {
                quote: "نظام الموظفين والرواتب وفر علينا الكثير من الوقت، الالتزام بمواعيد الرواتب أصبح أسهل بكثير.",
                author: "منى السعيد",
                role: "مديرة موارد بشرية"
              },
              {
                quote: "القدرة على العمل أونلاين ومتابعة كافة الفروع من مكاني جعلت إدارة العمل أكثر مرونة واحترافية.",
                author: "حسن يوسف",
                role: "صاحب مجموعة شركات"
              }
            ].map((t, i) => (
              <div key={i} className="p-8 bg-slate-900/60 border border-white/5 rounded-[2.5rem] backdrop-blur-sm shadow-xl hover:border-indigo-500/20 transition-all group">
                <div className="flex gap-1 mb-6 group-hover:scale-110 transition-transform origin-right">
                  {[...Array(5)].map((_, i) => <SparkleIcon key={i} size={14} className="text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-slate-300 font-bold mb-8 leading-relaxed italic text-lg">"{t.quote}"</p>
                <div>
                  <div className="font-black text-white text-lg">{t.author}</div>
                  <div className="text-indigo-400 text-sm font-bold">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6">
        <div className="max-w-7xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter">استثمر في مستقبل شركتك</h2>
          <p className="text-slate-400 font-bold">باقات مرنة تناسب كافة أحجام الأعمال</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div key={i} className={`relative p-8 rounded-[2.5rem] border ${plan.recommended ? 'bg-indigo-600 border-indigo-400 shadow-2xl shadow-indigo-600/20 scale-105 z-10' : 'bg-slate-900/40 border-white/5'} flex flex-col transition-transform hover:scale-[1.07]`}>
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-white text-indigo-600 text-[10px] font-black rounded-full uppercase tracking-widest shadow-xl">الموصى بها</div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${plan.recommended ? 'bg-white/20 text-white' : 'bg-indigo-600/10'}`}>
                {React.cloneElement(plan.icon as React.ReactElement<any>, { size: 24 })}
              </div>
              <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
              <div className="text-2xl font-black mb-1">{plan.price}</div>
              <p className={`text-[9px] font-bold mb-6 uppercase tracking-wider ${plan.recommended ? 'text-indigo-200' : 'text-slate-500'}`}>
                {plan.description}
              </p>
              <div className="space-y-3 mb-8 flex-1">
                {plan.features.map((f, j) => (
                  <div key={j} className="flex items-center gap-2">
                    <CheckCircle2 size={16} className={plan.recommended ? 'text-indigo-200' : 'text-indigo-500'} />
                    <span className={`text-xs font-bold ${plan.recommended ? 'text-indigo-50' : 'text-slate-300'}`}>{f}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => window.open(`https://wa.me/${contactPhone}`, '_blank')}
                className={`w-full py-3.5 rounded-xl font-black transition-all active:scale-95 text-sm ${plan.recommended ? 'bg-white text-indigo-600 hover:bg-indigo-50' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
              >
                اطلبها الآن
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 px-6 relative">
        <div className="max-w-4xl mx-auto bg-slate-900/40 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl relative z-10 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            <div>
              <h2 className="text-4xl font-black mb-6 tracking-tighter">تواصل معنا مباشرة</h2>
              <p className="text-slate-400 font-bold mb-8 leading-relaxed text-lg">
                لديك استفسار خاص؟ أو ترغب في تخصيص نظام لشركتك؟ فريقنا جاهز للرد على كافة استفساراتكم على مدار الساعة.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.open(`mailto:${contactEmail}`, '_blank')}>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all"><MessageSquare size={24} /></div>
                  <div>
                    <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">البريد الإلكتروني</div>
                    <div className="font-bold text-slate-200">{contactEmail}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.open(`https://wa.me/${contactPhone}`, '_blank')}>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all"><Smartphone size={24} /></div>
                  <div>
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">واتساب / هاتف</div>
                    <div className="font-bold text-slate-200">{contactPhone.replace('20', '0')}</div>
                  </div>
                </div>
              </div>

              <div className="mt-12 p-6 bg-indigo-600/10 border border-indigo-500/20 rounded-3xl">
                <h4 className="text-indigo-300 font-black mb-2 flex items-center gap-2">
                  <ShieldCheck size={18} />
                  نظام نبراس المعتمد
                </h4>
                <p className="text-xs text-slate-400 font-bold leading-relaxed">
                  يتم معالجة كافة طلبات التواصل بسرية تامة وتوجيهها للقسم المختص لضمان أفضل خدمة عملاء.
                </p>
              </div>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = formData.get('name');
                const phone = formData.get('phone');
                const message = formData.get('message');
                window.location.href = `mailto:${contactEmail}?subject=طلب استفسار من ${name}&body=الاسم: ${name}%0D%0Aالهاتف: ${phone}%0D%0Aالرسالة: ${message}`;
              }}
              className="space-y-4"
            >
              <input 
                name="name"
                type="text" 
                required
                placeholder="اسمك الكريم" 
                className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
              />
              <input 
                name="phone"
                type="tel" 
                required
                placeholder="رقم الهاتف" 
                className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold"
              />
              <textarea 
                name="message"
                required
                placeholder="كيف يمكننا مساعدتك؟" 
                rows={4}
                className="w-full px-6 py-4 bg-slate-950 border border-white/5 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold resize-none"
              ></textarea>
              <button 
                type="submit"
                className="w-full py-5 bg-white text-slate-950 rounded-2xl font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-white/10"
              >
                إرسال الطلب الآن
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-6 bg-slate-950/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tighter">الأسئلة الشائعة</h2>
            <div className="w-20 h-1.5 bg-indigo-600 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-6">
            {[
              {
                q: "هل النظام يعمل بدون إنترنت؟",
                a: "نعم، الباقة الأساسية والاحترافية تعمل بشكل كامل على جهازك دون الحاجة لاتصال بالإنترنت. باقة المؤسسات تتطلب إنترنت فقط لمزامنة البيانات بين الفروع."
              },
              {
                q: "كيف يتم الحصول على الدعم الفني؟",
                a: "نوفر دعماً فنياً عبر الهاتف، واتساب، ومن خلال برامج التحكم عن بعد (TeamViewer / AnyDesk) لضمان حل أي مشكلة في أسرع وقت."
              },
              {
                q: "هل يمكنني تجربة النظام قبل الشراء؟",
                a: "بالطبع، يمكنك التواصل معنا لطلب نسخة تجريبية مجانية تتيح لك استكشاف كافة مميزات النظام لمدة محدودة."
              },
              {
                q: "هل يدعم النظام ضريبة القيمة المضافة (VAT)؟",
                a: "نعم، النظام مصمم بالكامل ليدعم القوانين الضريبية المصرية والعربية، مع إمكانية استخراج تقارير الإقرار الضريبي بسهولة."
              }
            ].map((faq, i) => (
              <div key={i} className="p-8 bg-slate-900/40 border border-white/5 rounded-3xl hover:border-indigo-500/30 transition-all group">
                <h3 className="text-xl font-bold mb-4 text-white group-hover:text-indigo-400 transition-colors flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center text-sm">؟</span>
                  {faq.q}
                </h3>
                <p className="text-slate-400 font-bold leading-relaxed pr-11">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-white/5 bg-slate-950">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <div className="flex items-center gap-3 cursor-pointer group" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <span className="text-2xl font-black tracking-tighter">نِـبـراس ERP</span>
            </div>
            <p className="text-slate-400 font-bold max-w-sm leading-relaxed">
              نظام متكامل لإدارة الموارد والمؤسسات، صُمم بأحدث التقنيات ليلبي تطلعات السوق العربي ويحقق الكفاءة المطلوبة.
            </p>
          </div>
          <div>
            <h4 className="font-black mb-6 text-indigo-400 uppercase tracking-widest text-xs">تواصل معنا</h4>
            <div className="space-y-4 text-sm font-bold text-slate-400">
              <p>{contactName}</p>
              <p>هاتف: {contactPhone.replace('20', '0')}</p>
              <p>إيميل: {contactEmail}</p>
            </div>
          </div>
          <div>
            <h4 className="font-black mb-6 text-indigo-400 uppercase tracking-widest text-xs">روابط سريعة</h4>
            <div className="space-y-4 text-sm font-bold text-slate-400">
              <p className="cursor-pointer hover:text-white transition-colors" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>الرئيسية</p>
              <p className="cursor-pointer hover:text-white transition-colors" onClick={() => setShowPrompt(true)}>دخول النظام</p>
              <p className="cursor-pointer hover:text-white transition-colors">سياسة الخصوصية</p>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 text-center">
          <p className="text-xs text-slate-500 font-bold">تطوير وبرمجة: {contactName} © 2026. جميع الحقوق محفوظة.</p>
        </div>
      </footer>

      {/* Company Name Prompt Modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-slate-950/60 animate-in fade-in duration-300">
          <div className="bg-slate-900 border border-white/10 p-10 rounded-[2.5rem] max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-indigo-300 to-indigo-600"></div>
            
            <button 
              onClick={() => setShowPrompt(false)}
              className="absolute top-6 left-6 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-indigo-400">
                <Building2 size={32} />
              </div>
              <h3 className="text-2xl font-black mb-2 tracking-tighter">مرحباً بك في نِـبـراس</h3>
              <p className="text-slate-400 font-bold text-sm">برجاء إدخال اسم الشركة الخاص بك للدخول</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2 text-right">
                <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest pr-1">معرف النطاق / اسم الشركة</label>
                <input 
                  type="text"
                  autoFocus
                  placeholder="مثال: authentic"
                  className="w-full px-6 py-4 bg-slate-950 border border-white/10 rounded-2xl focus:border-indigo-500 outline-none transition-all text-white font-bold text-lg text-center tracking-wider placeholder:opacity-30"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubscriberLogin()}
                />
              </div>

              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={handleSubscriberLogin}
                  disabled={!companyName.trim() || isLoading}
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      دخول النظام
                      <ArrowLeft size={24} />
                    </>
                  )}
                </button>

                <button 
                  onClick={() => onStart('default')}
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={14} />
                  الدخول في وضع التجربة
                </button>
              </div>
            </div>

            <p className="mt-8 text-[10px] text-slate-500 text-center font-bold">
              ليس لديك حساب؟ <span className="text-indigo-400 cursor-pointer hover:underline" onClick={() => window.open(`https://wa.me/${contactPhone}`, '_blank')}>تواصل معنا للتفعيل</span>
            </p>
          </div>
        </div>
      )}
      </>
    )}
    </div>
  );
};

export default LandingPage;
