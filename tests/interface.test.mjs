import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {JSDOM} from 'jsdom';
import {STORAGE_KEY,validateState,addDays,todayKey} from '../dist/model.mjs';

test('fluxos do protótipo: compromissos, prévias, tarefas, compras e perfis',async t=>{
  const html=await readFile(new URL('../dist/index.html',import.meta.url),'utf8');
  const dom=new JSDOM(html,{url:'https://familycalendar.example/#visao-geral'}),w=dom.window;
  for(const key of ['window','document','location','localStorage','FormData'])Object.defineProperty(globalThis,key,{value:key==='window'?w:w[key],configurable:true,writable:true});
  w.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  w.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new w.Event('close'));};
  w.scrollTo=()=>{};
  await import('../dist/app.js?interface-test');
  const $=s=>w.document.querySelector(s),click=s=>{const el=$(s);assert.ok(el,`Elemento encontrado: ${s}`);el.click();};
  const field=(name,value)=>{const el=$(`#modal [name="${name}"]`);assert.ok(el);el.value=value;};
  const submit=selector=>$(selector).dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
  const state=()=>validateState(JSON.parse(w.localStorage.getItem(STORAGE_KEY)));
  const go=async route=>{w.location.hash=route;await new Promise(r=>setTimeout(r,20));};
  let createdEvent,createdTask;

  await t.test('inicia com sete dias e dados de exemplo válidos',()=>{
    assert.equal($('#app h1').textContent,'Olá, família!');assert.equal(w.document.querySelectorAll('.weekly-board').length,3);
    assert.equal(w.document.querySelectorAll('.day-column').length,21);assert.equal(state().members.length,4);
  });
  await t.test('impede horários invertidos e salva compromisso com prévia de e-mail',()=>{
    click('button[data-action="new"][data-type="events"]');field('title','Cinema & pipoca <família>');field('time','18:00');field('end','17:00');
    submit('#editor-form');assert.equal(state().events.length,8);assert.match($('.form-error').textContent,/fim deve ser depois/);
    field('end','20:00');submit('#editor-form');assert.equal(state().events.length,9);assert.equal(state().notices.length,1);
    createdEvent=state().events.at(-1);assert.equal(state().notices[0].recipients.length,4);assert.equal(state().notices[0].preview,true);
    assert.ok($('#app').textContent.includes('Cinema & pipoca <família>'));assert.equal($('#modal').open,false);
  });
  await t.test('aviso abre destinatários e mensagem sem enviar e-mail',async()=>{
    await go('avisos');click('button[data-action="notice"]');assert.match($('.email-preview').textContent,/ana@example.com/);assert.match($('.email-preview').textContent,/Cinema & pipoca <família>/);assert.match($('.dialog-header').textContent,/não foi enviada/);assert.equal(state().notices[0].read,true);click('[data-action="close-dialog"]');
  });
  await t.test('edita e exclui compromisso, preservando histórico de prévias',async()=>{
    await go('calendario');click(`[data-action="edit"][data-id="${createdEvent.id}"]`);field('title','Cinema em família');submit('#editor-form');assert.equal(state().notices.length,2);
    click(`[data-action="edit"][data-id="${createdEvent.id}"]`);click('[data-action="delete"]');click('[data-action="do-delete"]');assert.equal(state().events.length,8);assert.equal(state().notices.length,3);
  });
  await t.test('cria tarefa, conclui e move para outra semana',async()=>{
    await go('tarefas');click('[data-action="new"][data-type="tasks"]');field('title','Preparar a mochila');submit('#editor-form');assert.equal(state().tasks.length,13);createdTask=state().tasks.at(-1);
    click(`input[data-action="toggle"][data-id="${createdTask.id}"]`);assert.equal(state().tasks.at(-1).done,true);
    click(`[data-action="edit"][data-id="${createdTask.id}"]`);field('date',addDays(todayKey(),8));submit('#editor-form');assert.equal(state().tasks.at(-1).date,addDays(todayKey(),8));assert.ok($('#app').textContent.includes('Preparar a mochila'));
    click('[data-action="today"]');assert.ok(!$('#app').textContent.includes('Preparar a mochila'));
  });
  await t.test('adição rápida de compra e filtros reagem à marcação',async()=>{
    await go('compras');$('#quick-add [name="title"]').value='Biscoitos';$('#quick-add [name="qty"]').value='2 pacotes';submit('#quick-add');assert.equal(state().shopping.length,15);const item=state().shopping.at(-1);
    assert.equal(item.qty,'2 pacotes');click('[data-group="status"][data-value="pending"]');assert.ok($('#app').textContent.includes('Biscoitos'));
    click(`input[data-action="toggle"][data-id="${item.id}"]`);assert.equal(state().shopping.at(-1).done,true);assert.ok(!$('#app').textContent.includes('Biscoitos'));
    click('[data-group="shoppingView"][data-value="category"]');assert.ok($('.category-grid'));
  });
  await t.test('visão individual muda com o perfil e mantém compras compartilhadas',async()=>{
    await go('visao-geral');const select=$('[data-action="profile"]');select.value='pedro';select.dispatchEvent(new w.Event('change',{bubbles:true}));click('[data-group="scope"][data-value="mine"]');
    assert.equal($('#app h1').textContent,'Minha semana');const events=$('.panel').textContent;assert.ok(events.includes('Futebol'));assert.ok(events.includes('Jantar em família'));assert.ok(!events.includes('Aula de inglês'));assert.equal(state().currentMember,'pedro');assert.ok($('#app').textContent.includes('continua compartilhada'));
  });
  await t.test('texto maior persiste sem perder os registros',async()=>{
    await go('configuracoes');click('[data-key="largeText"]');assert.equal(state().settings.largeText,true);assert.ok(w.document.documentElement.classList.contains('large-text'));assert.equal(state().tasks.length,13);assert.equal(state().shopping.length,15);
  });
  dom.window.close();
});
