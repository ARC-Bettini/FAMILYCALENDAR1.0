import test from 'node:test';
import assert from 'node:assert/strict';
import {seedState,validateState,monday,weekDays,addDays,isFor,recordsInWeek,upsert,removeRecord,calendarNotice,calendarICS} from '../dist/model.mjs';

test('a semana começa na segunda, inclusive na virada do ano e no domingo',()=>{
  assert.equal(monday('2027-01-03'),'2026-12-28');
  assert.deepEqual(weekDays('2026-11-06'),['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08']);
  assert.equal(addDays('2028-02-28',1),'2028-02-29');
});
test('a visão individual inclui eventos familiares e exclui compromissos de outros integrantes',()=>{
  const s=seedState('2026-11-06'),events=recordsInWeek(s.events,'2026-11-06','ana');
  assert.equal(events.length,5);assert.ok(events.some(e=>e.title==='Jantar em família'));assert.ok(!events.some(e=>e.title==='Futebol'));
  assert.equal(isFor({members:['all']},'ana'),true);
  assert.equal(recordsInWeek(s.tasks,'2026-11-06','ana').length,4);
  assert.equal(recordsInWeek(s.events,'2026-11-16').length,0);
});
test('criar, editar e excluir preserva os demais registros',()=>{
  const s=seedState('2026-11-06'),r={...s.tasks[0],id:'new-task',done:false};
  const added=upsert(s,'tasks',r);assert.equal(added.tasks.length,s.tasks.length+1);assert.equal(s.tasks.length,12);
  const edited=upsert(added,'tasks',{...r,title:'Novo título',done:true});assert.equal(edited.tasks.length,13);assert.equal(edited.tasks.find(t=>t.id===r.id).done,true);
  assert.deepEqual(removeRecord(edited,'tasks',r.id).tasks,s.tasks);
});
test('alteração do calendário gera apenas uma prévia com destinatários optantes',()=>{
  const s=seedState('2026-11-06');s.members[0].notify=false;
  const changed=calendarNotice(s,s.events[0],'alterado');
  assert.equal(changed.notices.length,1);assert.equal(changed.notices[0].preview,true);
  assert.equal(changed.notices[0].recipients.length,3);assert.ok(!changed.notices[0].recipients.includes('ana@example.com'));
  assert.equal(s.notices.length,0);
  s.settings.emailPreviews=false;assert.equal(calendarNotice(s,s.events[0],'criado').notices.length,0);
});
test('backup válido é aceito e arquivos incompletos, horários e datas impossíveis são rejeitados',()=>{
  const s=seedState('2026-11-06');assert.equal(validateState(JSON.parse(JSON.stringify(s))).version,1);
  for(const change of [x=>x.members=[],x=>x.tasks[0].members=['inexistente'],x=>x.tasks[0].date='2026-02-30',x=>x.events[0].end='01:00',x=>x.shopping[0].category='inválida',x=>x.settings={}]){
    const bad=structuredClone(s);change(bad);assert.throws(()=>validateState(bad));
  }
});
test('exportação de calendário contém horários e escapa texto do usuário',()=>{
  const ics=calendarICS([{id:'a',title:'Jantar; família, juntos',date:'2026-11-06',time:'19:30',end:'20:30',notes:'Linha 1\nLinha 2'}]);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));assert.ok(ics.includes('DTSTART:20261106T193000'));assert.ok(ics.includes('SUMMARY:Jantar\\; família\\, juntos'));assert.ok(ics.includes('Linha 1\\nLinha 2'));
});
