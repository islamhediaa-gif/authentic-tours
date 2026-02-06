import{r as E,j as e,b as F,T as ne,W as oe,d as ie,X as re}from"./index-DYzCRgaJ-v301.js";import{C as le}from"./chevron-left-DfYFhVHs-v301.js";import{P as U}from"./printer-nTHqsAMQ-v301.js";import{C as de}from"./calendar-DsJJ9rBG-v301.js";import{P as V}from"./pen-C9nJN1Z0-v301.js";import{T as ce}from"./tag-Cs7mPwau-v301.js";import{S as pe}from"./save-DyoiDrR2-v301.js";const ve=({transactions:y,journalEntries:N,masterTrips:S,programs:$,currencies:me,settings:k,formatCurrency:g,onBack:D,onUpdateTransaction:H,onUpdateJournalEntry:J,selectedTripId:W,onTripChange:_})=>{const[K,Y]=E.useState(""),x=W||K,q=s=>{Y(s),_&&_(s)},[h,P]=E.useState(null),[m,L]=E.useState({amount:0,description:"",purchasePrice:0}),Q=s=>{P(s),L({amount:s.amount,description:s.description,purchasePrice:s.originalData?.purchasePrice||0})},Z=()=>{if(h){if(h.sourceType==="TRANSACTION")H?.(h.sourceId,{amount:m.amount,description:m.description,purchasePrice:m.purchasePrice});else if(h.sourceType==="JOURNAL"){const{entry:s,lineIndex:o}=h.originalData;if(!s||!s.lines||!s.lines[o])return;const l=[...s.lines];(l[o]?.credit||0)>0?l[o].credit=m.amount:l[o].debit=m.amount,l[o].originalAmount=m.amount,J?.(s.id,{description:(m.description||"").split(" - ")[0],lines:l})}P(null)}},u=E.useMemo(()=>(S||[]).find(s=>s?.id===x),[S,x]),p=E.useMemo(()=>{if(!x)return{movements:[],stats:{totalIncome:0,totalExpense:0,netProfit:0}};const s=[],o=new Map,l=new Set;(y||[]).forEach(t=>{t&&t.refNo&&o.set(t.refNo,t)}),(N||[]).forEach(t=>{(t.lines||[]).forEach(c=>{c.transactionId&&l.add(c.transactionId)})});const d=($||[]).filter(t=>t?.masterTripId===x),n=new Set(d.map(t=>t?.id).filter(Boolean)),r=new Map(d.map(t=>[t?.id,t?.name]));(y||[]).forEach(t=>{if(!t||t.isVoided||l.has(t.id)||t.journalEntryId)return;const c=t.masterTripId===x,R=t.programId&&n.has(t.programId);if(c||R){const v=t.exchangeRate||1,j=(t.amount||0)*v,A=(t.purchasePrice||0)*v;let a=t.category||"OTHER";t.description?.includes("طيران")||a==="FLIGHT"?a="FLIGHT_INTERNAL":t.type==="EXPENSE"&&(a==="EXPENSE_GEN"||t.description?.includes("مصاريف"))&&(a="EXPENSE_INTERNAL"),s.push({date:t.date,description:t.description,refNo:t.refNo,amount:t.amount,currency:t.currencyCode,rate:v,amountBase:j,purchaseBase:A,type:t.type==="INCOME"||t.type==="REVENUE_ONLY"?"INCOME":"EXPENSE",category:a,programId:t.programId||"GENERAL",programName:t.programId?r.get(t.programId)||"برنامج غير معروف":"عام",componentId:t.componentId,componentName:t.componentId?d.flatMap(w=>w&&w.components||[]).find(w=>w&&w.id===t.componentId)?.name:void 0,sourceId:t.id,sourceType:"TRANSACTION",originalData:t})}}),(N||[]).forEach(t=>{if(!t)return;const c=t.lines||[],R=t.refNo,v=new Set;c.forEach(a=>{a.accountType==="REVENUE"&&(a.credit||0)>0&&v.add(a.credit||0)});const j=R?o.get(R):null,A=j&&(j.masterTripId===x||j.programId&&n.has(j.programId));c.forEach((a,w)=>{if(!a)return;let O=a.costCenterId===x||a.programId&&n.has(a.programId);if(!O&&A&&(O=!0),O){if(!(a.accountType==="EXPENSE"||a.accountType==="REVENUE"))return;const z=a.debit||0;if(a.accountType==="EXPENSE"&&z>0&&v.has(z))return;const X=(a.credit||0)>0,B=X?a.credit||0:z,M=a.exchangeRate||1,ae=a.originalAmount?a.originalAmount*M:B*M;let I="OTHER";a.accountName?.includes("طيران")?I="FLIGHT_INTERNAL":a.accountType==="EXPENSE"&&(a.accountName?.includes("عامة")||a.accountName?.includes("إدارية"))?I="EXPENSE_INTERNAL":a.accountType==="REVENUE"?I="REVENUE_SERVICE":a.accountType==="EXPENSE"&&(I="EXPENSE_SERVICE"),s.push({date:t.date,description:(t.description||"")+(a.accountName?` - ${a.accountName}`:""),refNo:t.refNo,amount:a.originalAmount||B,currency:a.currencyCode||k?.baseCurrency||"EGP",rate:M,amountBase:ae,type:X?"INCOME":"EXPENSE",category:I,programId:a.programId||"GENERAL",programName:a.programId?r.get(a.programId)||"برنامج غير معروف":"عام",componentId:a.componentId,componentName:a.componentId?d.flatMap(T=>T&&T.components||[]).find(T=>T&&T.id===a.componentId)?.name:void 0,sourceId:t.id,sourceType:"JOURNAL",originalData:{entry:t,lineIndex:(t.lines||[]).indexOf(a)}})}})});const i={},f="FLIGHT_GROUP",b="EXPENSE_GROUP";i[f]={name:"تكاليف الطيران",movements:[],stats:{income:0,expense:0,profit:0}},i[b]={name:"المصاريف العامة",movements:[],stats:{income:0,expense:0,profit:0}},(d||[]).forEach(t=>{i[t.id]={name:t.name,movements:[],stats:{income:0,expense:0,profit:0}}}),i.GENERAL||(i.GENERAL={name:"التعاقدات العامة",movements:[],stats:{income:0,expense:0,profit:0}}),(s||[]).forEach(t=>{let c=t.programId||"GENERAL";t.category==="FLIGHT_INTERNAL"?c=f:t.category==="EXPENSE_INTERNAL"&&(c=b),i[c]||(i[c]={name:t.programName||"عام",movements:[],stats:{income:0,expense:0,profit:0}}),i[c].movements.push(t),t.type==="INCOME"?i[c].stats.income+=t.amountBase||0:i[c].stats.expense+=t.amountBase||0,i[c].stats.profit=i[c].stats.income-i[c].stats.expense}),Object.keys(i).forEach(t=>{i[t].movements.length===0&&t!==f&&t!==b&&delete i[t]});let C=0,G=0;return Object.values(i).forEach(t=>{C+=t.stats.income||0,G+=t.stats.expense||0}),{movements:(s||[]).sort((t,c)=>(t.date||"").localeCompare(c.date||"")),programGroups:i,stats:{totalIncome:C,totalExpense:G,netProfit:C-G}}},[x,y,N,k.baseCurrency,$]),ee=()=>{if(!u)return;const s=window.open("","_blank");if(!s)return;const o=`
      <html dir="rtl">
        <head>
          <title>تحليل تكاليف - ${u.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 20px; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #1e1b4b; padding-bottom: 10px; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: right; }
            th { background: #f8fafc; font-weight: 900; }
            .income { color: #059669; }
            .expense { color: #dc2626; }
            .summary { margin-top: 30px; display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 20px; }
            .summary-box { border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; text-align: center; }
            .summary-label { font-size: 12px; color: #64748b; font-weight: bold; }
            .summary-value { font-size: 18px; font-weight: 900; margin-top: 5px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0;">${k.name}</h1>
              <p style="margin:5px 0;">تقرير تحليل تكاليف الرحلة</p>
            </div>
            <div style="text-align: left;">
              <p>الرحلة: <strong>${u.name}</strong></p>
              <p>التاريخ: ${u.date}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 100px;">التاريخ</th>
                <th style="width: 100px;">المرجع</th>
                <th>البيان والتفاصيل</th>
                <th style="text-align:center;">المبلغ بالعملة</th>
                <th style="text-align:center;">الإجمالي بالجنيه</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(p.programGroups).map(([l,d])=>d.movements.length===0?"":`
                  <tr style="background: #f1f5f9; font-weight: bold;">
                    <td colspan="5" style="padding: 12px; border-right: 4px solid #1e1b4b; font-size: 16px;">
                      ${d.name}
                    </td>
                  </tr>
                  ${d.movements.map(n=>`
                    <tr>
                      <td>${n.date}</td>
                      <td>${n.refNo||""}</td>
                      <td>
                        <div style="font-weight: bold;">${n.description}</div>
                        ${n.componentName?`<div style="font-size: 10px; color: #6366f1; margin-top: 2px;">${n.componentName}</div>`:""}
                      </td>
                      <td style="text-align:center;" class="${n.type==="INCOME"?"income":"expense"}">${n.amount.toLocaleString()} ${n.currency}</td>
                      <td style="text-align:center; font-weight:bold;">${n.amountBase.toLocaleString()}</td>
                    </tr>
                  `).join("")}
                  <tr style="background: #fafafa; font-weight: bold;">
                    <td colspan="3" style="text-align: left; padding: 10px;">إجمالي ${d.name}:</td>
                    <td colspan="2">
                      <div style="display: flex; justify-content: space-around; font-size: 13px;">
                        <span>التكلفة: <span class="expense">${d.stats.expense.toLocaleString()}</span></span>
                        <span>البيع: <span class="income">${d.stats.income.toLocaleString()}</span></span>
                        <span>الصافي: <span style="color: ${d.stats.profit>=0?"#059669":"#dc2626"}">${d.stats.profit.toLocaleString()}</span></span>
                      </div>
                    </td>
                  </tr>
                `).join("")}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-box">
              <div class="summary-label">إجمالي التحصيل</div>
              <div class="summary-value income">${p.stats.totalIncome.toLocaleString()} EGP</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">إجمالي التكلفة</div>
              <div class="summary-value expense">${p.stats.totalExpense.toLocaleString()} EGP</div>
            </div>
            <div class="summary-box" style="background: #1e1b4b; color: white;">
              <div class="summary-label" style="color: #94a3b8;">صافي الربح / الخسارة</div>
              <div class="summary-value">${p.stats.netProfit.toLocaleString()} EGP</div>
            </div>
          </div>
          
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }<\/script>
        </body>
      </html>
    `;s.document.write(o),s.document.close()},te=()=>{if(!u)return;const s=window.open("","_blank");if(!s)return;const o=n=>{const r=n.description||"";if((n.category||"").includes("FLIGHT")||r.includes("طيران")||r.includes("تذكرة"))return"تذاكر طيران";if(r.includes("تأشيرة")||r.includes("فيزا"))return"تأشيرات";if(r.includes("فندق")||r.includes("سكن")){const f=r.match(/(فندق\s+[^\s,،-]+(\s+[^\s,،-]+)?)/)||r.match(/(سكن\s+[^\s,،-]+(\s+[^\s,،-]+)?)/);return f?f[0]:"سكن وفنادق"}return r.includes("انتقال")||r.includes("توصيل")||r.includes("أتوبيس")||r.includes("باص")||r.includes("نقل")?"انتقالات وبرامج":r.includes("هدية")||r.includes("هدايا")||r.includes("شنط")?"هدايا ومطبوعات":"مصاريف وإيرادات متنوعة"},l=Object.entries(p.programGroups||{}).map(([n,r])=>{const i={};return(r.movements||[]).forEach(f=>{const b=o(f);i[b]||(i[b]={income:0,expense:0}),f.type==="INCOME"?i[b].income+=f.amountBase||0:i[b].expense+=f.amountBase||0}),{name:r.name,categories:i,stats:r.stats}}).filter(n=>Object.keys(n.categories||{}).length>0),d=`
      <html dir="rtl">
        <head>
          <title>ملخص تكاليف - ${u.name}</title>
          <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 20px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 3px solid #1e1b4b; padding-bottom: 15px; margin-bottom: 30px; }
            .program-section { margin-bottom: 40px; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
            .program-header { background: #1e1b4b; color: white; padding: 12px 20px; font-weight: 900; font-size: 18px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border-bottom: 1px solid #e2e8f0; padding: 15px; text-align: right; }
            th { background: #f8fafc; font-weight: 900; color: #64748b; text-transform: uppercase; font-size: 13px; }
            .income { color: #059669; font-weight: bold; }
            .expense { color: #dc2626; font-weight: bold; }
            .profit { font-weight: 900; }
            .summary { margin-top: 30px; display: grid; grid-template-cols: 1fr 1fr 1fr; gap: 20px; }
            .summary-box { border: 2px solid #e2e8f0; padding: 20px; border-radius: 15px; text-align: center; }
            .summary-label { font-size: 14px; color: #64748b; font-weight: bold; margin-bottom: 5px; }
            .summary-value { font-size: 24px; font-weight: 900; }
            .total-row { background: #f8fafc; font-weight: 900; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 style="margin:0; color: #1e1b4b;">${k.name}</h1>
              <p style="margin:5px 0; font-weight: bold; color: #64748b;">ملخص تحليلي لتكاليف وأرباح الرحلة</p>
            </div>
            <div style="text-align: left;">
              <p style="margin:0;">الرحلة: <strong>${u.name}</strong></p>
              <p style="margin:5px 0;">التاريخ: ${u.date}</p>
            </div>
          </div>

          ${l.map(n=>`
            <div class="program-section">
              <div class="program-header">${n.name}</div>
              <table>
                <thead>
                  <tr>
                    <th>البند / التصنيف</th>
                    <th style="text-align:center;">إجمالي التحصيل</th>
                    <th style="text-align:center;">إجمالي التكلفة</th>
                    <th style="text-align:center;">صافي الربح</th>
                  </tr>
                </thead>
                <tbody>
                  ${Object.entries(n.categories).map(([r,i])=>`
                    <tr>
                      <td style="font-weight: bold;">${r}</td>
                      <td style="text-align:center;" class="income">${i.income.toLocaleString()}</td>
                      <td style="text-align:center;" class="expense">${i.expense.toLocaleString()}</td>
                      <td style="text-align:center;" class="profit ${i.income-i.expense>=0?"income":"expense"}">
                        ${(i.income-i.expense).toLocaleString()}
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
                <tfoot>
                  <tr class="total-row">
                    <td>إجمالي ${n.name}</td>
                    <td style="text-align:center;" class="income">${n.stats.income.toLocaleString()}</td>
                    <td style="text-align:center;" class="expense">${n.stats.expense.toLocaleString()}</td>
                    <td style="text-align:center; font-size: 18px;" class="profit ${n.stats.profit>=0?"income":"expense"}">
                      ${n.stats.profit.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          `).join("")}

          <div class="summary">
            <div class="summary-box">
              <div class="summary-label">إجمالي إيرادات الرحلة</div>
              <div class="summary-value income">${p.stats.totalIncome.toLocaleString()} EGP</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">إجمالي تكاليف الرحلة</div>
              <div class="summary-value expense">${p.stats.totalExpense.toLocaleString()} EGP</div>
            </div>
            <div class="summary-box" style="background: #1e1b4b; color: white; border-color: #1e1b4b;">
              <div class="summary-label" style="color: #94a3b8;">صافي ربح الرحلة النهائي</div>
              <div class="summary-value">${p.stats.netProfit.toLocaleString()} EGP</div>
            </div>
          </div>
          
          <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }<\/script>
        </body>
      </html>
    `;s.document.write(d),s.document.close()},se=E.useMemo(()=>{const s=new Set([...(y||[]).map(o=>o?.masterTripId),...(N||[]).flatMap(o=>(o?.lines||[]).map(l=>l?.costCenterId))].filter(Boolean));return($||[]).forEach(o=>{if(o?.masterTripId){const l=(y||[]).some(n=>n?.programId===o.id),d=(N||[]).some(n=>(n?.lines||[]).some(r=>r?.programId===o.id));(l||d)&&s.add(o.masterTripId)}}),(S||[]).filter(o=>s.has(o.id))},[S,y,N,$]);return e.jsxs("div",{className:"space-y-6 pb-10",children:[e.jsxs("div",{className:"flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-200 shadow-sm",children:[e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsx("button",{onClick:D,className:"w-10 h-10 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center hover:bg-slate-100 transition-all",children:e.jsx(le,{size:20})}),e.jsxs("div",{children:[e.jsx("h2",{className:"text-xl font-bold text-slate-900",children:"تحليل تكاليف الرحلات المجمعة"}),e.jsx("p",{className:"text-xs text-slate-400 font-bold mt-1 uppercase tracking-widest",children:"مراجعة الأرباح والخسائر لكل رحلة بالتفصيل"})]})]}),e.jsxs("div",{className:"flex items-center gap-4",children:[e.jsxs("select",{value:x,onChange:s=>q(s.target.value),className:"bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-bold text-sm text-slate-700 outline-none focus:border-indigo-600 transition-all min-w-[250px]",children:[e.jsx("option",{value:"",children:"اختر الرحلة للمراجعة..."}),se.map(s=>e.jsxs("option",{value:s.id,children:[s.name," - ",s.date]},s.id))]}),x&&e.jsxs("div",{className:"flex gap-3",children:[e.jsxs("button",{onClick:te,className:"bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-md",children:[e.jsx(U,{size:18})," طباعة الملخص (ورقة واحدة)"]}),e.jsxs("button",{onClick:ee,className:"bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-3 hover:bg-slate-800 transition-all shadow-md",children:[e.jsx(U,{size:18})," تقرير تفصيلي"]})]})]})]}),x?e.jsxs("div",{className:"animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6",children:[e.jsxs("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-6",children:[e.jsxs("div",{className:"bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4",children:[e.jsx("div",{className:"w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center",children:e.jsx(F,{size:24})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-widest",children:"إجمالي الإيرادات"}),e.jsx("p",{className:"text-xl font-black text-emerald-600 tracking-tight",children:g(p.stats.totalIncome)})]})]}),e.jsxs("div",{className:"bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4",children:[e.jsx("div",{className:"w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center",children:e.jsx(ne,{size:24})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-widest",children:"إجمالي التكاليف"}),e.jsx("p",{className:"text-xl font-black text-rose-600 tracking-tight",children:g(p.stats.totalExpense)})]})]}),e.jsxs("div",{className:"bg-slate-900 p-6 rounded-3xl shadow-lg flex items-center gap-4",children:[e.jsx("div",{className:"w-12 h-12 bg-indigo-500 bg-opacity-20 text-indigo-400 rounded-2xl flex items-center justify-center",children:e.jsx(oe,{size:24})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-widest",children:"صافي الربح"}),e.jsx("p",{className:`text-xl font-black tracking-tight ${p.stats.netProfit>=0?"text-white":"text-rose-400"}`,children:g(p.stats.netProfit)})]})]})]}),e.jsxs("div",{className:"bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden",children:[e.jsxs("div",{className:"p-6 border-b border-slate-100 bg-slate-50 bg-opacity-50 flex justify-between items-center",children:[e.jsxs("h3",{className:"font-bold text-slate-900 flex items-center gap-3",children:[e.jsx(de,{size:18,className:"text-indigo-600"})," تفاصيل الحركات المالية للرحلة"]}),e.jsxs("div",{className:"flex gap-4",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-3 h-3 bg-emerald-500 rounded-full"}),e.jsx("span",{className:"text-xs font-bold text-slate-500",children:"إيرادات"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("div",{className:"w-3 h-3 bg-rose-500 rounded-full"}),e.jsx("span",{className:"text-xs font-bold text-slate-500",children:"مصروفات"})]})]})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full text-right",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-50",children:[e.jsx("th",{className:"px-6 py-4 text-[10px] font-bold uppercase text-slate-400 w-32",children:"التاريخ"}),e.jsx("th",{className:"px-6 py-4 text-[10px] font-bold uppercase text-slate-400 w-32",children:"المرجع"}),e.jsx("th",{className:"px-6 py-4 text-[10px] font-bold uppercase text-slate-400",children:"البيان والتفاصيل"}),e.jsx("th",{className:"px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-center w-40",children:"المبلغ بالعملة"}),e.jsx("th",{className:"px-6 py-4 text-[10px] font-bold uppercase text-slate-400 text-center w-40",children:"الإجمالي بالجنيه"}),e.jsx("th",{className:"px-6 py-4 text-[10px] font-bold uppercase text-slate-400 w-16"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100",children:p.movements.length>0?e.jsx(e.Fragment,{children:Object.entries(p.programGroups).map(([s,o])=>o.movements.length===0?null:e.jsxs(ie.Fragment,{children:[e.jsx("tr",{className:"bg-slate-100 bg-opacity-50",children:e.jsx("td",{colSpan:6,className:"px-6 py-2 text-sm font-black text-slate-900 border-r-4 border-slate-900",children:o.name})}),o.movements.map((l,d)=>e.jsxs("tr",{className:"hover:bg-slate-50 transition-colors group",children:[e.jsx("td",{className:"px-6 py-3 text-[11px] font-bold text-slate-500",children:l.date}),e.jsx("td",{className:"px-6 py-3",children:l.refNo&&e.jsx("button",{onClick:()=>{navigator.clipboard.writeText(l.refNo);const n=document.getElementById(`ref-trip-${s}-${d}`);if(n){const r=n.innerText;n.innerText="تم النسخ",setTimeout(()=>{n.innerText=r},1e3)}},id:`ref-trip-${s}-${d}`,className:"px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-black border border-indigo-100 hover:bg-indigo-100 transition-all",title:"اضغط للنسخ والبحث",children:l.refNo})}),e.jsxs("td",{className:"px-6 py-3 text-sm font-bold text-slate-900",children:[l.description,l.componentName&&e.jsx("span",{className:"block text-[10px] text-indigo-500 mt-1 uppercase tracking-wider",children:l.componentName})]}),e.jsxs("td",{className:`px-6 py-3 text-sm font-black text-center ${l.type==="INCOME"?"text-emerald-600":"text-rose-600"}`,children:[l.amount.toLocaleString()," ",e.jsx("span",{className:"text-[10px] opacity-70",children:l.currency})]}),e.jsx("td",{className:"px-6 py-3 text-sm font-black text-slate-900 text-center",children:g(l.amountBase)}),e.jsx("td",{className:"px-6 py-3",children:e.jsx("button",{onClick:()=>Q(l),className:"p-2 text-slate-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all",title:"تعديل سريع",children:e.jsx(V,{size:16})})})]},`${s}-${d}`)),e.jsxs("tr",{className:"bg-slate-50 bg-opacity-80 border-b-2 border-slate-200",children:[e.jsxs("td",{colSpan:3,className:"px-6 py-2 text-xs font-black text-slate-500 text-left",children:["ملخص ",o.name]}),e.jsx("td",{colSpan:3,className:"px-6 py-2",children:e.jsxs("div",{className:"flex justify-around items-center",children:[e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx("span",{className:"text-[9px] text-slate-400 uppercase font-bold",children:"التكلفة"}),e.jsx("span",{className:"text-xs font-black text-rose-600",children:g(o.stats.expense)})]}),e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx("span",{className:"text-[9px] text-slate-400 uppercase font-bold",children:"البيع"}),e.jsx("span",{className:"text-xs font-black text-emerald-600",children:g(o.stats.income)})]}),e.jsxs("div",{className:"flex flex-col items-center",children:[e.jsx("span",{className:"text-[9px] text-slate-400 uppercase font-bold",children:"الصافي"}),e.jsx("span",{className:`text-xs font-black ${o.stats.profit>=0?"text-indigo-600":"text-rose-600"}`,children:g(o.stats.profit)})]})]})})]})]},s))}):e.jsx("tr",{children:e.jsxs("td",{colSpan:5,className:"px-6 py-20 text-center",children:[e.jsx(ce,{size:48,className:"mx-auto text-slate-200 mb-4"}),e.jsx("p",{className:"text-slate-400 font-bold",children:"لا توجد حركات مالية مرتبطة بهذه الرحلة حتى الآن"})]})})})]})})]})]}):e.jsxs("div",{className:"bg-white border-2 border-dashed border-slate-200 rounded-[40px] p-20 text-center",children:[e.jsx("div",{className:"w-24 h-24 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6",children:e.jsx(F,{size:48})}),e.jsx("h3",{className:"text-2xl font-bold text-slate-900 mb-2",children:"تقرير تحليل التكاليف"}),e.jsx("p",{className:"text-slate-400 max-w-sm mx-auto font-bold text-sm",children:"برجاء اختيار الرحلة من القائمة أعلاه لعرض تحليل مفصل للتكاليف والإيرادات وصافي الأرباح"})]}),h&&e.jsx("div",{className:"fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4",children:e.jsxs("div",{className:"bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200",children:[e.jsxs("div",{className:"p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center",children:e.jsx(V,{size:20})}),e.jsxs("div",{children:[e.jsx("h4",{className:"font-bold text-slate-900",children:"تعديل سريع"}),e.jsx("p",{className:"text-[10px] font-bold text-slate-400 uppercase tracking-widest",children:h.refNo||"بدون مرجع"})]})]}),e.jsx("button",{onClick:()=>P(null),className:"text-slate-400 hover:text-slate-600",children:e.jsx(re,{size:24})})]}),e.jsxs("div",{className:"p-8 space-y-6 text-right",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-slate-400 uppercase mr-1",children:"البيان والتفاصيل"}),e.jsx("input",{type:"text",value:m.description,onChange:s=>L({...m,description:s.target.value}),className:"w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-6",children:[e.jsxs("div",{className:"space-y-2",children:[e.jsxs("label",{className:"text-xs font-black text-slate-400 uppercase mr-1",children:["المبلغ (",h.currency,")"]}),e.jsx("input",{type:"number",value:m.amount,onChange:s=>L({...m,amount:parseFloat(s.target.value)||0}),className:"w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"})]}),h.sourceType==="TRANSACTION"&&e.jsxs("div",{className:"space-y-2",children:[e.jsx("label",{className:"text-xs font-black text-slate-400 uppercase mr-1",children:"سعر الشراء / التكلفة"}),e.jsx("input",{type:"number",value:m.purchasePrice,onChange:s=>L({...m,purchasePrice:parseFloat(s.target.value)||0}),className:"w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"})]})]})]}),e.jsxs("div",{className:"p-6 bg-slate-50 border-t border-slate-100 flex gap-3",children:[e.jsxs("button",{onClick:Z,className:"flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-lg",children:[e.jsx(pe,{size:20})," حفظ التغييرات"]}),e.jsx("button",{onClick:()=>P(null),className:"px-8 bg-white border border-slate-200 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-100 transition-all",children:"إلغاء"})]})]})})]})};export{ve as default};
