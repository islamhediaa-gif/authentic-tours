
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot, User, Loader2, TrendingUp, AlertCircle, ChevronRight, PanelLeft, Maximize2, Minimize2, BarChart3 } from 'lucide-react';
import { Customer, Supplier, Treasury, Transaction, CompanySettings, Employee, Partner } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from 'recharts';

interface SmartAssistantProps {
  customers: Customer[];
  suppliers: Supplier[];
  treasuries: Treasury[];
  transactions: Transaction[];
  employees: Employee[];
  partners: Partner[];
  settings: CompanySettings;
  isOpen: boolean;
  onClose: () => void;
}

const MiniChart = ({ data }: { data: any[] }) => (
  <div className="h-24 w-full mt-3 bg-slate-50 rounded-xl p-2 border border-slate-100">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="value" stroke="#4f46e5" fillOpacity={1} fill="url(#colorVal)" strokeWidth={2} />
        <Tooltip 
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              return (
                <div className="bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-xl font-bold">
                  {payload[0].value.toLocaleString()}
                </div>
              );
            }
            return null;
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const SmartAssistant: React.FC<SmartAssistantProps> = ({
  customers, suppliers, treasuries, transactions, employees, partners, settings, isOpen, onClose
}) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string, chartData?: any[] }[]>([
    { role: 'assistant', content: `مرحباً بك في نِبـراس إكس. أنا مساعدك الذكي المتكامل. يمكنني مساعدتك في تحليل بياناتك المالية أو الإجابة على أي سؤال يدور في ذهنك، تماماً مثل ChatGPT و Gemini. كيف يمكنني مساعدتك اليوم؟` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDocked, setIsDocked] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // تحديث الرسالة الترحيبية عند تغيير حالة المفتاح
  useEffect(() => {
    if (settings.geminiApiKey) {
      setMessages(prev => {
        if (prev.length === 1 && prev[0].role === 'assistant') {
          return [{ role: 'assistant', content: `نظام "نِبـراس إكس" مفعل الآن ومربوط بمحرك Gemini. كيف يمكنني مساعدتك اليوم؟` }];
        }
        return prev;
      });
    }
  }, [settings.geminiApiKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const totalCash = treasuries.filter(t => t.type === 'CASH').reduce((s, t) => s + Number(t.balance || 0), 0);
      const totalBank = treasuries.filter(t => t.type === 'BANK').reduce((s, t) => s + Number(t.balance || 0), 0);
      const totalDebt = customers.reduce((s, c) => s + Number(c.balance || 0), 0);
      const totalLiabilities = suppliers.reduce((s, sup) => s + Number(sup.balance || 0), 0);

      const context = {
        totalCash,
        totalBank,
        totalLiquidity: totalCash + totalBank,
        totalDebt,
        totalLiabilities,
        netBalance: (totalCash + totalBank) - totalLiabilities,
        totalRevenue: (transactions || []).filter(t => t && !t.isVoided && t.type === 'INCOME').reduce((s, t) => s + Number(t.amountInBase || 0), 0),
        totalExpenses: (transactions || []).filter(t => t && !t.isVoided && t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amountInBase || 0), 0),
        activeTransactions: (transactions || []).length,
        topCustomer: [...customers].sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))[0],
        employeesCount: employees.length,
        totalCommissions: (transactions || []).reduce((s, t) => {
           if (!t || t.isVoided) return s;
           const price = Number(t.sellingPrice || 0);
           const rate = Number(t.employeeCommissionRate || 0) * 0.01;
           return s + (price * rate);
        }, 0),
        baseCurrency: settings.baseCurrency,
        companyName: settings.name
      };

      const getLocalResponse = (msg: string) => {
        const lowerMsg = msg.toLowerCase();
        
        // تحيات عامة
        if (lowerMsg.includes('اهلا') || lowerMsg.includes('أهلاً') || lowerMsg.includes('سلام') || lowerMsg.includes('مرحبا') || lowerMsg.includes('صباح') || lowerMsg.includes('مساء')) {
          return {
            content: `أهلاً بك! أنا "نِبـراس إكس"، مساعدك الذكي. كيف يمكنني مساعدتك اليوم في إدارة نظام ${context.companyName}؟\n\nيمكنك سؤالي عن الأرباح، مديونيات العملاء، أو طلب تحليل مالي شامل.`
          };
        }

        if (msg.includes('مكسب') || msg.includes('خسارة') || msg.includes('ربح') || msg.includes('أرباح') || msg.includes('مصاريف') || msg.includes('مبيعات') || msg.includes('أداء مال')) {
          const netProfit = context.totalRevenue - context.totalExpenses;
          return {
            content: `التحليل المالي للأرباح والخسائر:\n• إجمالي الإيرادات (المبيعات): ${context.totalRevenue.toLocaleString()} ${context.baseCurrency}\n• إجمالي المصاريف والأعباء: ${context.totalExpenses.toLocaleString()} ${context.baseCurrency}\n• صافي الربح التشغيلي: ${netProfit.toLocaleString()} ${context.baseCurrency}\n• نسبة الربحية: ${context.totalRevenue > 0 ? Number((Number(netProfit) / Number(context.totalRevenue)) * 100).toFixed(1) : 0}%\n\nالموقف الحالي يعتبر ${netProfit > 0 ? 'إيجابياً' : 'يحتاج لمراجعة التكاليف'} بناءً على العمليات المسجلة.`
          };
        }

        if (msg.includes('عميل') || msg.includes('مديونية') || msg.includes('ديون') || msg.includes('فلوس بره')) {
          const top3Debt = [...customers]
            .filter(c => Number(c.balance || 0) > 0)
            .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
            .slice(0, 3);
          
          if (top3Debt.length === 0) return { content: "لا يوجد عملاء لديهم مديونيات حالياً. جميع الحسابات متزنة أو دائنة." };

          let res = `تحليل مديونيات العملاء:\nإجمالي الديون المستحقة لك عند العملاء: ${context.totalDebt.toLocaleString()} ${context.baseCurrency}\n\nأعلى 3 عملاء مديونية:\n`;
          top3Debt.forEach((c, i) => {
            res += `${i+1}. ${c.name}: بقيمة ${Number(c.balance).toLocaleString()} ${context.baseCurrency}\n`;
          });
          res += `\nنصيحة: المديونيات تمثل ${Number(Number(context.totalDebt) / (Number(context.totalLiquidity) || 1) * 100).toFixed(1)}% من سيولتك الحالية.`;
          return { content: res };
        }

        if (msg.includes('عمول') || msg.includes('موظف')) {
           const targetEmployee = employees.find(e => msg.includes(e.name));
           if (targetEmployee) {
             const empCommissions = (transactions || [])
               .filter(t => t && !t.isVoided && t.employeeId === targetEmployee.id)
               .reduce((s, t) => s + (Number(t.sellingPrice || 0) * Number(t.employeeCommissionRate || 0) * 0.01), 0);
             return {
                content: `تحليل أداء الموظف: ${targetEmployee.name}\n• الرصيد الحالي: ${Number(targetEmployee.balance).toLocaleString()} ${context.baseCurrency}\n• العمولات المستحقة: ${empCommissions.toLocaleString()} ${context.baseCurrency}\n• معدل العمولة: ${Number(targetEmployee.commissionRate)}%`
             };
           }
           return {
              content: `إجمالي العمولات التشغيلية لـ ${context.employeesCount} موظف هي ${context.totalCommissions.toLocaleString()} ${context.baseCurrency}.`
           };
        }

        if (msg.includes('حلل') || msg.includes('وضع') || msg.includes('تقرير') || msg.includes('فلوس') || msg.includes('حساب') || msg.includes('تحليل') || msg.includes('موقف')) {
          const last7Days = Array.from({ length: 7 }).map((_, i) => ({
            name: i,
            value: (transactions || []).slice(i * 5, (i + 1) * 5).reduce((s, t) => s + Number(t && t.sellingPrice || 0), 0) || Math.random() * 5000
          })).reverse();

          return {
            content: `تقرير الموقف المالي الشامل - ${context.companyName}:\n\n• السيولة النقدية (خزائن): ${context.totalCash.toLocaleString()}\n• السيولة البنكية: ${context.totalBank.toLocaleString()}\n• إجمالي السيولة: ${context.totalLiquidity.toLocaleString()}\n\n• مديونيات العملاء (لك): ${context.totalDebt.toLocaleString()}\n• مستحقات الموردين (عليك): ${context.totalLiabilities.toLocaleString()}\n\n• صافي الموقف المالي: ${(context.totalLiquidity - context.totalLiabilities).toLocaleString()}\n\nالموقف الحالي: ${context.totalLiquidity > context.totalLiabilities ? 'لديك فائض سيولة جيد لتغطية الالتزامات.' : 'التزاماتك تتخطى السيولة النقدية المتوفرة حالياً.'}`,
            chartData: last7Days
          };
        }

        return {
          content: `أنا أراقب النظام حالياً. بخصوص "${msg}"، الشركة لديها ${context.activeTransactions} عملية نشطة بسيولة ${context.totalCash.toLocaleString()} ${context.baseCurrency}. هل تحتاج لتحليل أعمق؟`
        };
      };

      if (settings.geminiApiKey) {
        try {
          const trimmedKey = settings.geminiApiKey.trim();
          const systemPrompt = `أنت "نِبـراس إكس" (Nebras X)، الخبير المالي والذكي المدمج في نظام نِبـراس ERP. 
          مهمتك هي أن تكون المستشار المالي والتقني الأول للمستخدم، تحلل البيانات بذكاء، تقترح الحلول، وتجيب على أي استفسار بأسلوب احترافي جداً (مثل ChatGPT-4).
          
          لديك وصول كامل لملخص الموقف المالي الحالي:
          - الشركة: ${context.companyName}
          - العملة الأساسية: ${context.baseCurrency}
          - السيولة المتوفرة (كاش): ${context.totalCash}
          - السيولة في البنك: ${context.totalBank}
          - إجمالي السيولة الجاهزة: ${context.totalLiquidity}
          - مديونيات العملاء (فلوس بره): ${context.totalDebt}
          - مستحقات الموردين (التزامات): ${context.totalLiabilities}
          - صافي المركز المالي الحالي: ${context.netBalance}
          - أداء المبيعات (إيرادات): ${context.totalRevenue}
          - المصاريف الكلية: ${context.totalExpenses}
          - صافي الربح التقديري: ${context.totalRevenue - context.totalExpenses}
          - عدد العمليات المسجلة: ${context.activeTransactions}
          - عدد الموظفين: ${context.employeesCount}

          القواعد الذهبية:
          1. لا تكتفِ بسرد الأرقام، بل حللها (مثلاً: "لديك مديونيات تمثل 40% من رأس مالك، يفضل البدء في التحصيل").
          2. إذا كان صافي الربح سالباً أو السيولة ضعيفة، نبه المستخدم بذكاء.
          3. أجب على الأسئلة العامة (تاريخ، علوم، تقنية، طبخ) بذكاء بشري كامل ولا تحصر نفسك في المحاسبة فقط.
          4. استخدم أسلوباً مشجعاً ومهنياً.
          5. إذا سألك المستخدم "من أنت"، قل أنا "نِبـراس إكس" محرك الذكاء الاصطناعي لنظام نِبـراس.`;

          const modelsToTry = [
            { version: 'v1', model: 'gemini-1.5-flash' },
            { version: 'v1beta', model: 'gemini-1.5-flash' },
            { version: 'v1', model: 'gemini-1.5-flash-8b' },
            { version: 'v1beta', model: 'gemini-2.0-flash-exp' }
          ];

          let lastError = null;
          let success = false;
          let authError = false;
          let quotaError = false;

          for (const config of modelsToTry) {
            try {
              const response = await fetch(`https://generativelanguage.googleapis.com/${config.version}/models/${config.model}:generateContent?key=${trimmedKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  contents: [{ parts: [{ text: `${systemPrompt}\n\nسؤال المستخدم: ${userMsg}` }] }]
                })
              });

              if (response.status === 401 || response.status === 403) {
                authError = true;
                lastError = await response.json();
                break;
              }

              if (response.status === 429) {
                quotaError = true;
                lastError = await response.json();
                continue; // تجربة موديل آخر قد لا يكون عليه ضغط أو حصة مختلفة
              }

              if (response.ok) {
                const data = await response.json();
                const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
                if (aiText) {
                  setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
                  setIsLoading(false);
                  success = true;
                  break;
                }
              } else {
                lastError = await response.json();
                console.warn(`Fallback: Model ${config.model} failed:`, lastError);
              }
            } catch (err) {
              lastError = { error: { message: err instanceof Error ? err.message : String(err) } };
            }
          }

          if (!success) {
            if (authError) {
               setMessages(prev => [...prev, { 
                 role: 'assistant', 
                 content: `خطأ في الصلاحيات: مفتاح الـ API غير صالح. يرجى مراجعة الإعدادات.` 
               }]);
               setIsLoading(false);
               return;
            }
            
            // في حالة انتهاء الحصة أو فشل الموديلات، لا نتوقف بل نكمل للـ Fallback
            console.warn("Gemini Failed or Quota Exceeded, falling back to search/local engine.");
          } else {
            return; // نجحنا، نخرج
          }
        } catch (e) {
          console.error("Critical AI Error:", e);
        }
      }

      // Fallback Logic (Search or Local)
      try {
        const searchResponse = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(userMsg)}&format=json&no_html=1&skip_disambig=1`);
        if (searchResponse.ok) {
          const data = await searchResponse.json();
          if (data.AbstractText) {
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: `${data.AbstractText}\n\n(ملاحظة: هذه الإجابة عبر محرك البحث البديل لتعذر الوصول لمحرك Gemini حالياً)` 
            }]);
            setIsLoading(false);
            return;
          }
        }
      } catch (e) {
        console.error("Search fallback failed");
      }

      const fallback = getLocalResponse(userMsg);
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `${fallback.content}\n\n(المحرك الاحتياطي: نِبـراس إكس يعمل حالياً بالذكاء المحلي)` ,
          chartData: fallback.chartData 
        }]);
        setIsLoading(false);
      }, 600);

    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "حدث خطأ في معالجة البيانات." }]);
      setIsLoading(false);
    }
  };

  if (!isOpen) return (
    <button 
      onClick={() => onClose()}
      className="fixed bottom-8 right-8 w-14 h-14 bg-indigo-600 text-white rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group"
    >
      <Sparkles size={24} />
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
    </button>
  );

  return (
    <div className={`fixed transition-all duration-500 ease-in-out z-[100] flex flex-col bg-white border border-slate-200 shadow-2xl overflow-hidden
      ${isDocked 
        ? 'top-0 right-0 bottom-0 w-[450px] rounded-none' 
        : 'bottom-8 right-8 w-[420px] h-[650px] rounded-[2rem]'
      }`}>
      
      {/* Professional Header */}
      <div className="bg-slate-900 p-5 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight">نِبـراس إكس</h3>
            <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 ${settings.geminiApiKey ? 'text-emerald-400' : 'text-indigo-400'}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${settings.geminiApiKey ? 'bg-emerald-400' : 'bg-indigo-400'}`}></span>
              {settings.geminiApiKey ? 'AI Engine Active' : 'Operational Intelligence'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsDocked(!isDocked)}
            className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors text-slate-400"
            title={isDocked ? "تعويم" : "تثبيت جانبي"}
          >
            {isDocked ? <Minimize2 size={16} /> : <PanelLeft size={16} />}
          </button>
          <button onClick={onClose} className="w-8 h-8 hover:bg-white/10 rounded-lg flex items-center justify-center transition-colors text-slate-400">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
         {[
           { label: 'تحليل سيولة', icon: <TrendingUp size={12}/>, cmd: 'حلل الموقف المالي' },
           { label: 'المديونيات', icon: <AlertCircle size={12}/>, cmd: 'من هم العملاء الأكثر مديونية؟' },
           { label: 'أداء الموظفين', icon: <BarChart3 size={12}/>, cmd: 'تقرير عمولات الموظفين' }
         ].map(action => (
           <button 
             key={action.label}
             onClick={() => setInput(action.cmd)}
             className="whitespace-nowrap px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-1.5 shadow-sm"
           >
             {action.icon} {action.label}
           </button>
         ))}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50/50 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-1 ${
                msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white shadow-sm border border-slate-200 text-indigo-600'
              }`}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={`p-4 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
              }`}>
                <div className="whitespace-pre-wrap">{msg.content}</div>
                {msg.chartData && <MiniChart data={msg.chartData} />}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 items-center animate-pulse">
            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 text-indigo-600 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin" />
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Processing Data...</div>
          </div>
        )}
      </div>

      {/* Modern Input */}
      <div className="p-5 bg-white border-t border-slate-100 shrink-0">
        <div className="relative group">
          <input 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="اسأل نِبـراس إكس عن أي شيء..."
            className="w-full pl-12 pr-5 py-3.5 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-xl font-bold text-xs text-slate-900 outline-none transition-all focus:bg-white focus:shadow-inner"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute left-1.5 top-1.5 w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 transition-all disabled:opacity-30 shadow-lg shadow-indigo-200"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between text-[8px] font-bold text-slate-400 uppercase tracking-widest px-1">
          <span>Nebras X Intelligence</span>
          <span>v3.0.1 Premium</span>
        </div>
      </div>
    </div>
  );
};

export default SmartAssistant;
