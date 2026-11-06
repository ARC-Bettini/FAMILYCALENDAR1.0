export const STORAGE_KEY = 'familycalendar.prototype.v1';
export const DAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
export const CATEGORIES = ['Mercado', 'Hortifruti', 'Limpeza', 'Higiene', 'Outros'];
export const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export function dateKey(d) { return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function asDate(key) { const [y,m,d] = key.split('-').map(Number); return new Date(y,m-1,d,12); }
export function addDays(key,n) { const d=asDate(key); d.setDate(d.getDate()+n); return dateKey(d); }
export function monday(key) { const d=asDate(key); return addDays(key,-((d.getDay()+6)%7)); }
export function weekDays(key) { const start=monday(key); return Array.from({length:7},(_,i)=>addDays(start,i)); }
export function todayKey() { const p=new Intl.DateTimeFormat('en-US',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()); return `${p.find(x=>x.type==='year').value}-${p.find(x=>x.type==='month').value}-${p.find(x=>x.type==='day').value}`; }
export function isFor(record,member) { return !member || member==='all' || record.members.includes('all') || record.members.includes(member); }
export function recordsInWeek(records,anchor,member='all') { const start=monday(anchor),end=addDays(start,6); return records.filter(r=>r.date>=start&&r.date<=end&&isFor(r,member)); }
export function upsert(state,collection,record) { const exists=state[collection].some(r=>r.id===record.id); return {...state,[collection]:exists?state[collection].map(r=>r.id===record.id?record:r):[...state[collection],record]}; }
export function removeRecord(state,collection,id) { return {...state,[collection]:state[collection].filter(r=>r.id!==id)}; }
export function calendarNotice(state,record,action) {
  if (!state.settings.emailPreviews) return state;
  const recipients=state.members.filter(m=>m.notify&&m.email).map(m=>m.email);
  if(!recipients.length) return state;
  const notice={id:uid(),title:`Compromisso ${action}: ${record.title}`,eventTitle:record.title,date:record.date,time:record.time,end:record.end,recipients,action,createdAt:new Date().toISOString(),read:false,preview:true};
  return {...state,notices:[notice,...state.notices].slice(0,100)};
}
export function seedState(today=todayKey()) {
  const days=weekDays(today), make=(title,date,members,extra={})=>({id:uid(),title,date,members,...extra});
  return {version:1,members:[
    {id:'ana',name:'Ana',email:'ana@example.com',avatar:'ana',color:'peach',notify:true},
    {id:'carlos',name:'Carlos',email:'carlos@example.com',avatar:'carlos',color:'blue',notify:true},
    {id:'sofia',name:'Sofia',email:'sofia@example.com',avatar:'sofia',color:'lavender',notify:true},
    {id:'pedro',name:'Pedro',email:'pedro@example.com',avatar:'pedro',color:'sage',notify:true}
  ],events:[
    make('Caminhada',days[0],['ana','carlos'],{time:'18:00',end:'19:00',notes:'Uma volta no parque, sem pressa.'}),
    make('Futebol',days[1],['pedro'],{time:'16:00',end:'17:00',notes:'Levar a garrafinha de água.'}),
    make('Reunião escolar',days[2],['ana'],{time:'19:00',end:'20:00',notes:'Na escola da Sofia.'}),
    make('Aula de inglês',days[3],['sofia'],{time:'15:00',end:'16:00',notes:''}),
    make('Consulta de rotina',days[4],['pedro'],{time:'08:00',end:'09:00',notes:'Levar os documentos.'}),
    make('Jantar em família',days[4],['all'],{time:'19:30',end:'20:30',notes:'Cada um ajuda com um prato.'}),
    make('Passeio no parque',days[5],['all'],{time:'10:00',end:'12:00',notes:'Se chover, sessão de cinema em casa.'}),
    make('Almoço em família',days[6],['all'],{time:'12:00',end:'14:00',notes:''})
  ],tasks:[
    make('Regar as plantas',days[0],['ana'],{done:true}),make('Tirar o lixo',days[0],['carlos'],{done:true}),
    make('Guardar os brinquedos',days[1],['pedro'],{done:true}),make('Dobrar as roupas',days[1],['ana'],{done:true}),
    make('Lavar a louça',days[2],['sofia'],{done:true}),make('Organizar os livros',days[3],['sofia'],{done:false}),
    make('Passear com o cão',days[4],['carlos'],{done:false}),make('Buscar encomenda',days[4],['ana'],{done:false}),
    make('Organizar os quartos',days[5],['sofia','pedro'],{done:false}),make('Limpar o quintal',days[5],['carlos'],{done:false}),
    make('Organizar a despensa',days[5],['ana'],{done:false}),make('Separar uniformes',days[6],['sofia','pedro'],{done:false})
  ],shopping:[
    make('Leite',days[0],['all'],{qty:'2 litros',category:'Mercado',done:true}),make('Pão',days[0],['all'],{qty:'1 pacote',category:'Mercado',done:true}),
    make('Frutas',days[2],['all'],{qty:'1 kg',category:'Hortifruti',done:true}),make('Iogurte',days[2],['all'],{qty:'4 unidades',category:'Mercado',done:true}),
    make('Arroz',days[4],['all'],{qty:'5 kg',category:'Mercado',done:false}),make('Feijão',days[4],['all'],{qty:'1 kg',category:'Mercado',done:false}),make('Café',days[4],['all'],{qty:'500 g',category:'Mercado',done:false}),
    make('Legumes',days[5],['all'],{qty:'2 kg',category:'Hortifruti',done:false}),make('Ovos',days[5],['all'],{qty:'1 dúzia',category:'Mercado',done:false}),make('Sabão',days[5],['all'],{qty:'1 unidade',category:'Limpeza',done:false}),make('Papel higiênico',days[5],['all'],{qty:'1 pacote',category:'Higiene',done:false}),
    make('Queijo',days[6],['all'],{qty:'300 g',category:'Mercado',done:false}),make('Pão',days[6],['all'],{qty:'1 pacote',category:'Mercado',done:true}),make('Tomate',days[6],['all'],{qty:'1 kg',category:'Hortifruti',done:false})
  ],notices:[],settings:{emailPreviews:true,largeText:false},currentMember:'ana'};
}
const str=(s,max=500)=>typeof s==='string'&&s.length<=max;
const validDate=d=>str(d,10)&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(asDate(d).getTime())&&dateKey(asDate(d))===d;
const validTime=t=>str(t,5)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t);
export function validateState(s) {
  if(!s||s.version!==1||!Array.isArray(s.members)||s.members.length<1||s.members.length>50||!s.settings||typeof s.settings.emailPreviews!=='boolean'||typeof s.settings.largeText!=='boolean') throw new Error('O arquivo não é uma cópia válida do FamilyCalendar.');
  const ids=new Set();
  for(const m of s.members) {
    if(!str(m.id,100)||!m.id||ids.has(m.id)||!str(m.name,50)||!m.name.trim()||!str(m.email,254)||typeof m.notify!=='boolean'||!['peach','sage','blue','lavender'].includes(m.color)||!['ana','carlos','sofia','pedro','initials'].includes(m.avatar)) throw new Error('Há um integrante inválido no arquivo.');
    ids.add(m.id);
  }
  if(!ids.has(s.currentMember)) throw new Error('O perfil selecionado não foi encontrado.');
  for(const col of ['events','tasks','shopping']) {
    if(!Array.isArray(s[col])||s[col].length>10000) throw new Error('A lista de itens é inválida ou muito grande.');
    const recordIds=new Set();
    for(const r of s[col]) {
      if(!str(r.id,100)||!r.id||recordIds.has(r.id)||!str(r.title,120)||!r.title.trim()||!validDate(r.date)||!Array.isArray(r.members)||!r.members.length||!r.members.every(id=>id==='all'||ids.has(id))) throw new Error('Há um item inválido no arquivo.');
      recordIds.add(r.id);
      if(col==='events'&&(!validTime(r.time)||!validTime(r.end)||r.end<=r.time||!str(r.notes,2000))) throw new Error('Há um compromisso com horário inválido.');
      if(col!=='events'&&typeof r.done!=='boolean') throw new Error('Há um item com situação inválida.');
      if(col==='shopping'&&(!str(r.qty,50)||!CATEGORIES.includes(r.category))) throw new Error('Há um item de compra inválido.');
    }
  }
  if(!Array.isArray(s.notices)||s.notices.length>100||s.notices.some(n=>!str(n.id,100)||!str(n.title,200)||!str(n.eventTitle,120)||!validDate(n.date)||!validTime(n.time)||!validTime(n.end)||!str(n.action,30)||!str(n.createdAt,40)||!Array.isArray(n.recipients)||n.recipients.some(e=>!str(e,254))||typeof n.read!=='boolean'||n.preview!==true)) throw new Error('As prévias de avisos são inválidas.');
  return s;
}
export function calendarICS(events) {
  const escape=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
  const stamp=(date,time)=>date.replaceAll('-','')+'T'+time.replace(':','')+'00';
  const dtstamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  return ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//FamilyCalendar//PT-BR','CALSCALE:GREGORIAN',...events.flatMap(e=>['BEGIN:VEVENT',`UID:${escape(e.id)}@familycalendar`,`DTSTAMP:${dtstamp}`,`DTSTART:${stamp(e.date,e.time)}`,`DTEND:${stamp(e.date,e.end)}`,`SUMMARY:${escape(e.title)}`,`DESCRIPTION:${escape(e.notes||'')}`,'END:VEVENT']),'END:VCALENDAR'].join('\r\n');
}
