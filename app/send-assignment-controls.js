'use client';

import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import {api} from '../lib/api';
import {telegramSendApi} from '../lib/telegram-send-api';

const clamp=n=>Math.max(1,Math.min(1000,Number(n||1)));

function fieldNode(label){
  const fields=[...document.querySelectorAll('label.field')];
  const f=fields.find(x=>(x.querySelector('span')?.textContent||'').trim()===label);
  return f?.querySelector('input,textarea,select')||null;
}
function value(label){return fieldNode(label)?.value||''}
function setControlled(node,val){
  if(!node)return;
  const proto=node instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:node instanceof HTMLSelectElement?HTMLSelectElement.prototype:HTMLInputElement.prototype;
  const setter=Object.getOwnPropertyDescriptor(proto,'value')?.set;
  if(setter)setter.call(node,val);else node.value=val;
  node.dispatchEvent(new Event('input',{bubbles:true}));node.dispatchEvent(new Event('change',{bubbles:true}));
}
function checkboxByText(text){
  return [...document.querySelectorAll('label')].find(x=>x.textContent?.includes(text))?.querySelector('input[type="checkbox"]')||null;
}

export default function SendAssignmentControls(){
  const pathname=usePathname();
  const [host,setHost]=useState(null);
  const [accounts,setAccounts]=useState([]),[selected,setSelected]=useState([]);
  const [perAccount,setPerAccount]=useState(50),[prefsLoaded,setPrefsLoaded]=useState(false);
  const [importStatus,setImportStatus]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState('');

  useEffect(()=>{
    if(pathname!=='/')return;
    let stopped=false;
    const place=()=>{
      if(stopped)return;
      const cards=[...document.querySelectorAll('section.card')];
      const c=cards.find(x=>x.querySelector('h2')?.textContent?.includes('새 발송 작업'));
      if(!c){setTimeout(place,350);return}
      let node=c.querySelector('[data-send-assignment-host]');
      if(!node){node=document.createElement('div');node.dataset.sendAssignmentHost='1';const form=c.querySelector('.form');if(form)form.insertAdjacentElement('afterend',node);else c.appendChild(node)}
      setHost(node);
      [...c.querySelectorAll('button')].filter(b=>b.textContent?.trim()==='발송 시작').forEach(b=>{b.style.display='none'});
    };
    place();const id=setInterval(place,1000);
    return()=>{stopped=true;clearInterval(id)};
  },[pathname]);

  useEffect(()=>{
    if(pathname!=='/')return;
    let alive=true;
    const load=async()=>{
      try{
        const [a,p]=await Promise.all([api.accounts(),telegramSendApi.preferences()]);if(!alive)return;
        const items=(a.items||[]).filter(x=>String(x.status).toUpperCase()==='READY');setAccounts(items);
        setSelected(v=>{const valid=new Set(items.map(x=>Number(x.id)));const kept=v.filter(x=>valid.has(x));return kept.length?kept:items.map(x=>Number(x.id))});
        setPerAccount(clamp(p.max_contacts_per_account||50));
        if(!prefsLoaded){
          const apply=()=>{
            setControlled(fieldNode('본문 텍스트'),p.message_text||'');setControlled(fieldNode('버튼명'),p.button_text||'');setControlled(fieldNode('버튼 URL'),p.button_url||'');
          };
          setTimeout(apply,300);setPrefsLoaded(true);
        }
      }catch(e){setMsg(e.message||String(e))}
    };
    load();const id=setInterval(load,6000);return()=>{alive=false;clearInterval(id)};
  },[pathname,prefsLoaded]);

  useEffect(()=>{
    if(!host||pathname!=='/')return;
    let id;
    const poll=async()=>{
      const bid=Number(value('발송 DB')||0);if(!bid)return;
      try{const s=await telegramSendApi.contactImportStatus(bid);setImportStatus(s)}catch{}
    };
    poll();id=setInterval(poll,1500);return()=>clearInterval(id);
  },[host,pathname]);

  const capacity=useMemo(()=>selected.length*perAccount,[selected,perAccount]);
  const toggle=id=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  const openAccounts=()=>[...document.querySelectorAll('.sidebar .nav button')].find(x=>x.textContent?.includes('Telegram 계정'))?.click();

  async function saveContent(){
    setBusy(true);setMsg('');
    try{
      const prev=await telegramSendApi.preferences();
      await telegramSendApi.savePreferences({message_text:value('본문 텍스트'),button_text:value('버튼명'),button_url:value('버튼 URL'),max_contacts_per_account:clamp(prev.max_contacts_per_account||perAccount)});
      setMsg('발송 내용 저장 완료');
    }catch(e){setMsg(e.message)}finally{setBusy(false)}
  }
  async function saveMax(){
    setBusy(true);setMsg('');
    try{
      const prev=await telegramSendApi.preferences();
      await telegramSendApi.savePreferences({message_text:prev.message_text||value('본문 텍스트'),button_text:prev.button_text||value('버튼명'),button_url:prev.button_url||value('버튼 URL'),max_contacts_per_account:clamp(perAccount)});
      setMsg(`계정당 최대 연락처 추가 ${clamp(perAccount)}건 저장 완료`);
    }catch(e){setMsg(e.message)}finally{setBusy(false)}
  }
  async function addContacts(){
    const bid=Number(value('발송 DB')||0);if(!bid)return alert('발송 DB를 선택하세요.');if(!selected.length)return alert('READY 계정을 1개 이상 선택하세요.');
    setBusy(true);setMsg('연락처 추가 작업 시작 중...');
    try{
      await telegramSendApi.startContactImport(bid,{account_ids:selected,max_contacts_per_account:clamp(perAccount)});
      const s=await telegramSendApi.contactImportStatus(bid);setImportStatus(s);setMsg('연락처 추가를 시작했습니다. 계정별 진행률은 아래에서 확인할 수 있습니다.');
    }catch(e){alert(e.message);setMsg(e.message)}finally{setBusy(false)}
  }
  async function startSend(){
    const bid=Number(value('발송 DB')||0);if(!bid)return alert('발송 DB를 선택하세요.');
    if(!selected.length)return alert('READY 계정을 1개 이상 선택하세요.');
    let s;try{s=await telegramSendApi.contactImportStatus(bid);setImportStatus(s)}catch(e){return alert(e.message)}
    if(s.status!=='COMPLETED')return alert('먼저 연락처 추가 작업을 완료하세요.');
    const text=value('본문 텍스트'),button_text=value('버튼명'),button_url=value('버튼 URL'),bot_token=value('Bot Token'),bot_username=value('@Bot').replace(/^@/,'');
    if(!text||!button_text||!button_url||!bot_token||!bot_username)return alert('본문/버튼/Bot 설정을 확인하세요.');
    setBusy(true);setMsg('발송 작업 생성 중...');
    try{
      const j=await api.createJob({batch_id:bid,operation_mode:'SEND_RESOLVED_CONTACTS',message_text:text,button_text,button_url,bot_username,bot_token,delay_min:Number(value('최소 간격')||2),delay_max:Number(value('최대 간격')||5),global_dedupe:checkboxByText('중복 방지')?.checked!==false,account_ids:selected,contacts_per_account:clamp(perAccount)});
      await api.startJob(j.id);setMsg(`발송 시작 / ${Number(j.assigned_count||j.total_count||0).toLocaleString()}건`);
      [...document.querySelectorAll('.sidebar .nav button')].find(x=>x.textContent?.includes('실시간 작업 로그'))?.click();
    }catch(e){alert(e.message);setMsg(e.message)}finally{setBusy(false)}
  }

  if(pathname!=='/'||!host)return null;
  const s=importStatus||{};const total=Number(s.total_count||0),processed=Number(s.processed||0),resolved=Number(s.resolved||0),failed=Number(s.failed||0);
  const accountProgress=Object.values(s.account_progress||{});
  return createPortal(
    <div style={{marginTop:14,border:'1px solid #294a6d',borderRadius:12,padding:14,background:'#0b1b2f'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:12}}>
        <div><b style={{fontSize:14}}>계정 · DB 연락처 추가</b><div style={{fontSize:11,color:'#8ba3bd',marginTop:3}}>① 연락처 추가를 먼저 완료한 뒤 ② 발송 시작을 누르는 방식입니다.</div></div>
        <button type="button" className="btn" onClick={openAccounts}>계정 관리 / 추가</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 210px',gap:12,alignItems:'start'}}>
        <div>
          <div style={{fontSize:12,color:'#9bb0c6',marginBottom:7}}>연락처를 추가할 READY 계정</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:7}}>
            {accounts.length?accounts.map(a=>{const id=Number(a.id),on=selected.includes(id);return <label key={a.id} style={{display:'flex',alignItems:'center',gap:8,border:`1px solid ${on?'#3187dc':'#273d57'}`,borderRadius:9,padding:'9px 10px',cursor:'pointer',background:on?'#102b49':'#0d1827'}}><input type="checkbox" checked={on} onChange={()=>toggle(id)}/><span><b style={{display:'block',fontSize:12}}>{a.label||a.phone_masked||`계정 #${a.id}`}</b><small style={{color:'#7fa2c4'}}>READY</small></span></label>}):<div style={{fontSize:12,color:'#d29a62'}}>READY 계정이 없습니다.</div>}
          </div>
        </div>
        <div>
          <label className="field"><span>계정당 최대 연락처 추가</span><input className="input" type="number" min="1" max="1000" value={perAccount} onChange={e=>setPerAccount(clamp(e.target.value))}/></label>
          <button type="button" className="btn" style={{width:'100%',marginTop:7}} onClick={saveMax} disabled={busy}>최대 처리개수 저장</button>
          <div style={{marginTop:8,padding:10,borderRadius:9,background:'#0e2239',fontSize:11,lineHeight:1.65,color:'#9fb4ca'}}>선택 계정 <b style={{color:'#fff'}}>{selected.length}개</b><br/>현재 최대 처리 <b style={{color:'#61adff'}}>{capacity.toLocaleString()}건</b><br/><span style={{color:'#6f8aa6'}}>연락처 추가 API는 10개씩 묶음 처리</span></div>
        </div>
      </div>
      <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
        <button type="button" className="btn" onClick={saveContent} disabled={busy}>본문 · 버튼명 · URL 저장</button>
        <button type="button" className="btn" onClick={addContacts} disabled={busy}>① 연락처 추가</button>
        <button type="button" className="btn primary" onClick={startSend} disabled={busy||s.status!=='COMPLETED'}>② 발송 시작</button>
      </div>
      <div style={{marginTop:10,padding:10,borderRadius:9,background:'#0c1929',fontSize:11,color:'#9fb4ca'}}>
        연락처 추가 상태: <b style={{color:s.status==='COMPLETED'?'#62d69f':s.status==='RUNNING'?'#61adff':'#fff'}}>{s.status||'NOT_STARTED'}</b>
        {total>0&&<> · 진행 <b>{processed.toLocaleString()} / {total.toLocaleString()}</b> · 확인 <b style={{color:'#62d69f'}}>{resolved.toLocaleString()}</b> · 미확인/실패 <b style={{color:'#e6a66b'}}>{failed.toLocaleString()}</b></>}
        {s.error&&<div style={{color:'#ff9b9b',marginTop:5}}>{s.error}</div>}
        {msg&&<div style={{color:'#8fc5ff',marginTop:5}}>{msg}</div>}
      </div>
      {accountProgress.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8,marginTop:9}}>
        {accountProgress.map(p=>{const pct=p.total?Math.round((Number(p.processed||0)/Number(p.total))*100):100;return <div key={p.account_id} style={{border:'1px solid #263f59',borderRadius:9,padding:9,background:'#0d1d2f'}}>
          <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:11}}><b>{p.label||`계정 #${p.account_id}`}</b><span>{p.status}</span></div>
          <div style={{height:6,borderRadius:4,background:'#142a40',overflow:'hidden',margin:'7px 0'}}><div style={{height:'100%',width:`${Math.max(0,Math.min(100,pct))}%`,background:'currentColor',color:'#4da3ff'}}/></div>
          <div style={{fontSize:10,color:'#8fa7bf'}}>진행 {Number(p.processed||0).toLocaleString()} / {Number(p.total||0).toLocaleString()} · 확인 {Number(p.resolved||0).toLocaleString()} · 실패 {Number(p.failed||0).toLocaleString()}</div>
        </div>})}
      </div>}
    </div>,host
  );
}
