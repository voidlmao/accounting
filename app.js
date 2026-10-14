'use strict';

const STORAGE_KEY = 'accounting.app.data.v1';
const EXPENSE_CATEGORIES = [
  {name:'餐飲', icon:'🍜', color:'#6B987D', bg:'#EAF4EB'},
  {name:'交通', icon:'🚇', color:'#E5B26C', bg:'#FFF4E2'},
  {name:'購物', icon:'🛍️', color:'#A49BC9', bg:'#F2EFFA'},
  {name:'娛樂', icon:'🎮', color:'#DF9777', bg:'#FFF0E9'},
  {name:'學習', icon:'📚', color:'#79A9BA', bg:'#EDF7FA'},
  {name:'生活', icon:'🏡', color:'#B3AB7A', bg:'#F8F5E6'},
  {name:'其他', icon:'✨', color:'#B6BFB8', bg:'#F0F3EF'}
];
const INCOME_CATEGORIES = [
  {name:'零用錢', icon:'🪙', color:'#70AC88', bg:'#ECF6EE'},
  {name:'薪資', icon:'💼', color:'#70AC88', bg:'#ECF6EE'},
  {name:'獎金', icon:'🏅', color:'#70AC88', bg:'#ECF6EE'},
  {name:'禮物', icon:'🎁', color:'#70AC88', bg:'#ECF6EE'},
  {name:'其他', icon:'✨', color:'#70AC88', bg:'#ECF6EE'}
];
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const moneyFormatter = new Intl.NumberFormat('zh-TW',{maximumFractionDigits:2});
const state = { data: loadData(), month: new Date(new Date().getFullYear(), new Date().getMonth(), 1), filter: 'all', search: '' };
let toastTimer;

function loadData() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (value && Array.isArray(value.transactions)) {
      return {
        budget: Number.isFinite(value.budget) && value.budget >= 0 ? value.budget : 0,
        transactions: value.transactions.filter(validTransaction)
      };
    }
  } catch (err) { console.warn('載入資料失敗',err); }
  return {budget:0, transactions:[]};
}
function saveData() {
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state.data)); return true; }
  catch(err) { toast('無法儲存，請確認瀏覽器儲存空間及隱私模式設定'); return false; }
}
function validDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y,m,d] = value.split('-').map(Number);
  const date = new Date(y,m-1,d);
  return y>=2000 && y<=2100 && date.getFullYear()===y && date.getMonth()+1===m && date.getDate()===d;
}
function validTransaction(t) {
  if (!t || typeof t !== 'object' || typeof t.id !== 'string' || t.id.length > 100) return false;
  if (t.type !== 'expense' && t.type !== 'income') return false;
  if (typeof t.amount !== 'number' || !Number.isFinite(t.amount) || t.amount <= 0 || t.amount > 999999999) return false;
  if (!validDate(t.date) || typeof t.category !== 'string' || t.category.length > 32) return false;
  if (typeof t.note !== 'string' || t.note.length > 90) return false;
  return true;
}
function amount(value) { return `NT$ ${moneyFormatter.format(value)}`; }
function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function isCurrentMonth(dateStr) { return dateStr.slice(0,7) === `${state.month.getFullYear()}-${String(state.month.getMonth()+1).padStart(2,'0')}`; }
function monthEntries() { return state.data.transactions.filter(t=>isCurrentMonth(t.date)); }
function totals(entries) {
  return entries.reduce((result,t)=>{result[t.type]+=t.amount;return result;},{income:0,expense:0});
}
function toast(message) {
  const el=$('#toast'); el.textContent=message;el.classList.add('show');
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3200);
}
function svg(name) {
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg');
  const u=document.createElementNS('http://www.w3.org/2000/svg','use');
  u.setAttribute('href',`#i-${name}`);s.appendChild(u);return s;
}
function el(tag, className, text) {
  const node=document.createElement(tag);
  if(className) node.className=className;
  if(text!==undefined) node.textContent=text;
  return node;
}
function render() {
  const entries = monthEntries();
  const {income,expense}=totals(entries);
  $('#monthLabel').textContent = new Intl.DateTimeFormat('zh-TW',{year:'numeric',month:'long'}).format(state.month);
  $('#balanceAmount').textContent=amount(income-expense);
  $('#incomeAmount').textContent=amount(income);
  $('#expenseAmount').textContent=amount(expense);
  $('#incomeCount').textContent=`${entries.filter(e=>e.type==='income').length} 筆收入記錄`;
  $('#expenseCount').textContent=`${entries.filter(e=>e.type==='expense').length} 筆支出記錄`;
  renderCategories(entries,expense);
  renderBudget(expense);
  renderTransactions(entries);
}
function renderCategories(entries,totalExpense) {
  const legend=$('#categoryLegend');legend.replaceChildren();
  if(totalExpense===0) {
    $('#spendingDonut').style.background='conic-gradient(#e8ede7 0 100%)';
    $('#donutTotal').textContent=amount(0);
    legend.appendChild(el('p','muted-empty','還沒有支出記錄。新增第一筆，這裡就會顯示分類統計。'));
    return;
  }
  const grouped=new Map();
  for(const t of entries.filter(t=>t.type==='expense')) grouped.set(t.category,(grouped.get(t.category)||0)+t.amount);
  const sorted=[...grouped].sort((a,b)=>b[1]-a[1]);
  let start=0;
  const segments=[];
  for(const [name,value] of sorted) {
    const cat=EXPENSE_CATEGORIES.find(c=>c.name===name)||EXPENSE_CATEGORIES.at(-1);
    const end=start+value/totalExpense*100;
    segments.push(`${cat.color} ${start.toFixed(3)}% ${end.toFixed(3)}%`);
    start=end;
    const row=el('div','legend-row');
    const square=el('span','legend-color');square.style.background=cat.color;
    row.append(square,el('span','legend-name',name),el('strong','legend-money',moneyFormatter.format(value)));
    legend.appendChild(row);
  }
  $('#spendingDonut').style.background=`conic-gradient(${segments.join(', ')})`;
  $('#donutTotal').textContent=amount(totalExpense);
}
function renderBudget(expense) {
  const budget=state.data.budget;
  $('#budgetSpent').textContent=amount(expense);
  $('#budgetLimit').textContent=budget?amount(budget):'尚未設定';
  if(!budget) {
    $('#budgetPercent').innerHTML='—<span>%</span>';
    $('#budgetDescription').textContent='設定每月預算，看看花費是否在掌握中。';
    $('#budgetTip').textContent='小習慣，也能帶來大改變。';
    $('#budgetProgress').style.width='0%';
    $('#budgetProgress').classList.remove('over');
    return;
  }
  const ratio=expense/budget*100;
  const number=Math.round(ratio);
  $('#budgetPercent').replaceChildren(document.createTextNode(String(number)),el('span','', '%'));
  $('#budgetDescription').textContent=ratio>100?'本月已超出設定的預算。':`本月還可使用 ${amount(Math.max(0,budget-expense))}`;
  $('#budgetProgress').style.width=`${Math.min(100,Math.max(0,ratio))}%`;
  $('#budgetProgress').classList.toggle('over',ratio>100);
  $('#budgetTip').textContent=ratio>100?'不必有壓力，下次記得回顧較大的支出。':ratio>=80?'接近本月預算，記帳時可以多留意。':'照自己的步調，持續掌握每一筆。';
}
function renderTransactions(entries) {
  const query=state.search.trim().toLocaleLowerCase();
  const filtered=entries.filter(t=>(state.filter==='all'||t.type===state.filter) && (!query||`${t.note} ${t.category} ${t.amount}`.toLocaleLowerCase().includes(query)))
    .sort((a,b)=>b.date.localeCompare(a.date) || String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
  $('#transactionCount').textContent=String(filtered.length);
  const list=$('#transactionList');list.replaceChildren();
  if(!filtered.length) {
    const empty=el('div','list-empty');
    empty.append(el('div','empty-art','🧾'),el('h3','',entries.length?'找不到符合條件的記錄':'你的記帳，從第一筆開始'),el('p','',entries.length?'試試其他分類或搜尋字詞吧。':'咖啡、午餐、車票，生活中的每一筆都值得記下來。'));
    if(!entries.length) {const btn=el('button','button button-primary','＋ 新增第一筆');btn.type='button';btn.addEventListener('click',()=>openTransaction());empty.appendChild(btn);}
    list.appendChild(empty);return;
  }
  let previousDate='';
  for(const t of filtered) {
    if(previousDate!==t.date) {
      previousDate=t.date;
      const [y,m,d]=t.date.split('-').map(Number);
      const display=new Intl.DateTimeFormat('zh-TW',{month:'long',day:'numeric',weekday:'long'}).format(new Date(y,m-1,d));
      list.appendChild(el('div','date-group',display));
    }
    const iconDef=(t.type==='expense'?EXPENSE_CATEGORIES:INCOME_CATEGORIES).find(c=>c.name===t.category)||(t.type==='expense'?EXPENSE_CATEGORIES:INCOME_CATEGORIES).at(-1);
    const row=el('article','transaction-item');
    const icon=el('div','tx-icon',iconDef.icon);icon.style.background=iconDef.bg;
    const info=el('div','tx-info');info.append(el('div','tx-title',t.note.trim()||t.category),el('div','tx-meta',t.category+(t.note.trim()?' · '+(t.type==='expense'?'支出':'收入') :'')));
    const value=el('div',`tx-amount ${t.type}`,`${t.type==='expense'?'−':'+'}${amount(t.amount)}`);
    const actions=el('div','tx-actions');
    const edit=el('button','tx-action');edit.type='button';edit.title='編輯記錄';edit.setAttribute('aria-label',`編輯 ${t.note||t.category}`);edit.appendChild(svg('edit'));edit.addEventListener('click',()=>openTransaction(t.id));
    const del=el('button','tx-action delete');del.type='button';del.title='刪除記錄';del.setAttribute('aria-label',`刪除 ${t.note||t.category}`);del.appendChild(svg('trash'));del.addEventListener('click',()=>deleteTransaction(t.id));
    actions.append(edit,del);row.append(icon,info,value,actions);list.appendChild(row);
  }
}
function setType(type,selectedCategory) {
  if(type!=='income'&&type!=='expense') return;
  $('#entryType').value=type;
  $$('[data-type]').forEach(b=>{const active=b.dataset.type===type;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  const select=$('#entryCategory');select.replaceChildren();
  for(const c of type==='expense'?EXPENSE_CATEGORIES:INCOME_CATEGORIES) {
    const option=document.createElement('option');option.value=c.name;option.textContent=`${c.icon}  ${c.name}`;select.appendChild(option);
  }
  if(selectedCategory && [...select.options].some(opt=>opt.value===selectedCategory)) select.value=selectedCategory;
}
function openTransaction(id) {
  const t=typeof id==='string'?state.data.transactions.find(t=>t.id===id):undefined;
  $('#transactionForm').reset();$('#editId').value=t?.id||'';
  $('#formError').hidden=true;
  setType(t?.type||'expense',t?.category);
  $('#entryAmount').value=t?t.amount:'';
  $('#entryDate').value=t?.date||(isCurrentMonth(todayString())?todayString():`${state.month.getFullYear()}-${String(state.month.getMonth()+1).padStart(2,'0')}-01`);
  $('#entryNote').value=t?.note||'';
  $('#transactionDialogTitle').textContent=t?'編輯記錄':'新增一筆記錄';
  $('#transactionDialog').showModal();
  // Focus amount without invoking iOS automatic keyboard unexpectedly.
}
function closeDialog(button) { button.closest('dialog').close(); }
function submitTransaction(event) {
  event.preventDefault();
  const amountValue=Number($('#entryAmount').value);
  const date=$('#entryDate').value;
  const type=$('#entryType').value;
  const category=$('#entryCategory').value;
  const note=$('#entryNote').value.trim();
  const error=$('#formError');
  if(!Number.isFinite(amountValue)||amountValue<=0||amountValue>999999999) {error.textContent='請輸入大於 0 的有效金額。';error.hidden=false;return;}
  if(!validDate(date)) {error.textContent='請選擇有效日期。';error.hidden=false;return;}
  if(!(type==='expense'?EXPENSE_CATEGORIES:INCOME_CATEGORIES).some(c=>c.name===category)) {error.textContent='請選擇有效分類。';error.hidden=false;return;}
  const id=$('#editId').value;
  const prev=id?state.data.transactions.find(t=>t.id===id):undefined;
  const roundedAmount=Math.round(amountValue*100)/100;
  if(roundedAmount<=0) {error.textContent='最小記帳金額為 NT$ 0.01。';error.hidden=false;return;}
  const entry={id:prev?.id||makeId(),type,amount:roundedAmount,date,category,note,createdAt:prev?.createdAt||new Date().toISOString()};
  if(prev) state.data.transactions=state.data.transactions.map(t=>t.id===id?entry:t);
  else state.data.transactions.push(entry);
  if(!saveData()) return;
  const [y,m]=date.split('-').map(Number);
  state.month=new Date(y,m-1,1);
  $('#transactionDialog').close();render();toast(prev?'已更新記錄':'已新增記錄');
}
function makeId() {return typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():`${Date.now()}-${Math.random().toString(36).slice(2)}`;}
function deleteTransaction(id) {
  const t=state.data.transactions.find(t=>t.id===id);
  if(!t||!confirm(`確定刪除「${t.note||t.category}」這筆 ${amount(t.amount)} 的記錄嗎？`)) return;
  const previous=state.data.transactions;
  state.data.transactions=previous.filter(item=>item.id!==id);
  if(!saveData()) {state.data.transactions=previous;return;}
  render();toast('已刪除記錄');
}
function downloadFile(contents,filename,mime) {
  const url=URL.createObjectURL(new Blob([contents],{type:mime}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;
  document.body.appendChild(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function exportJson() {
  const payload={format:'accounting-backup',version:1,exportedAt:new Date().toISOString(),budget:state.data.budget,transactions:state.data.transactions};
  downloadFile(JSON.stringify(payload,null,2),`accounting-backup-${todayString()}.json`,'application/json;charset=utf-8');
  toast('JSON 備份已下載');
}
function csvSafe(input) {
  const value=String(input??'');
  const safe=/^[\s\r\n]*[=+@-]/.test(value)?`'${value}`:value;
  return `"${safe.replaceAll('"','""')}"`;
}
function exportCsv() {
  const rows=[['日期','類型','分類','金額（NTD）','備註']];
  for(const t of [...state.data.transactions].sort((a,b)=>b.date.localeCompare(a.date))) rows.push([t.date,t.type==='expense'?'支出':'收入',t.category,t.amount,t.note]);
  downloadFile('\ufeff'+rows.map(r=>r.map(csvSafe).join(',')).join('\r\n'),`accounting-records-${todayString()}.csv`,'text/csv;charset=utf-8');
  toast('CSV 已下載');
}
async function importJson(event) {
  const file=event.target.files?.[0];event.target.value='';
  if(!file) return;
  if(file.size>5*1024*1024){toast('備份檔過大（上限 5 MB）');return;}
  let parsed;
  try{parsed=JSON.parse(await file.text());}catch(err){toast('檔案不是有效 JSON');return;}
  if(!parsed||!Array.isArray(parsed.transactions)||parsed.transactions.length>30000||typeof parsed.budget!=='number'||!Number.isFinite(parsed.budget)||parsed.budget<0||parsed.budget>999999999||!parsed.transactions.every(validTransaction)) {
    toast('備份格式不正確，匯入已取消');return;
  }
  const ids=new Set(parsed.transactions.map(t=>t.id));
  if(ids.size!==parsed.transactions.length) {toast('備份檔含有重複記錄，匯入已取消');return;}
  if(!confirm(`這份備份有 ${parsed.transactions.length} 筆記錄。匯入將取代目前的 ${state.data.transactions.length} 筆記錄與預算，確定繼續嗎？`)) return;
  const old=state.data;
  state.data={budget:parsed.budget,transactions:parsed.transactions.map(t=>({...t,note:t.note.slice(0,90)}))};
  if(!saveData()) {state.data=old;return;}
  $('#settingsDialog').close();render();toast(`已匯入 ${state.data.transactions.length} 筆記錄`);
}
function setup() {
  $$('[data-open-add]').forEach(b=>b.addEventListener('click',()=>openTransaction()));
  $('#openSettings').addEventListener('click',()=>{$('#budgetInput').value=state.data.budget;$('#settingsDialog').showModal();});
  $('#openBudget').addEventListener('click',()=>{$('#budgetInput').value=state.data.budget;$('#settingsDialog').showModal();$('#budgetInput').focus();});
  $$('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>closeDialog(b)));
  $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));
  $$('[data-type]').forEach(b=>b.addEventListener('click',()=>setType(b.dataset.type)));
  $('#transactionForm').addEventListener('submit',submitTransaction);
  $('#prevMonth').addEventListener('click',()=>{state.month=new Date(state.month.getFullYear(),state.month.getMonth()-1,1);render();});
  $('#nextMonth').addEventListener('click',()=>{state.month=new Date(state.month.getFullYear(),state.month.getMonth()+1,1);render();});
  $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{
    state.filter=b.dataset.filter;
    $$('[data-filter]').forEach(item=>{const active=item===b;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active));});
    renderTransactions(monthEntries());
  }));
  $('#searchInput').addEventListener('input',e=>{state.search=e.target.value;renderTransactions(monthEntries());});
  $('#budgetForm').addEventListener('submit',e=>{
    e.preventDefault();const value=Number($('#budgetInput').value);
    if(!Number.isFinite(value)||value<0||value>999999999||!Number.isInteger(value)) {toast('請輸入有效的整數預算');return;}
    const old=state.data.budget;state.data.budget=value;
    if(!saveData()) {state.data.budget=old;return;}
    render();$('#settingsDialog').close();toast('預算已儲存');
  });
  $('#exportJson').addEventListener('click',exportJson);
  $('#exportCsv').addEventListener('click',exportCsv);
  $('#importFile').addEventListener('change',importJson);
  $('#clearData').addEventListener('click',()=>{
    if(!confirm('確定要永久清除所有記帳資料和預算嗎？此動作無法復原。'))return;
    const old=state.data;state.data={budget:0,transactions:[]};
    if(!saveData()){state.data=old;return;}
    render();$('#settingsDialog').close();toast('資料已清除');
  });
  render();
  if('serviceWorker' in navigator && location.protocol==='https:') navigator.serviceWorker.register('./sw.js').catch(()=>{});
}
setup();
