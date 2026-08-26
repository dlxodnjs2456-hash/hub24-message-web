'use client';

import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import {api} from '../lib/api';
import {telegramSendApi} from '../lib/telegram-send-api';

const limitValue=n=>Math.max(1,Math.min(1000,Number(n||1)));

export default function DbAssignmentControls(){
  const pathname=usePathname();
  const [host,setHost]=useState(null);
  const [accounts,setAccounts]=useState([]);
  const [batches,setBatches]=useState([]);
  const [batchId,setBatchId]=useState('');
  const [selected,setSelected]=useState([]);
  const [perAccount,setPerAccount]=useState(50);
  const [status,setStatus]=useState(null);
  const [busy,setBusy]=useState(false);
  const [msg,setMsg]=useState('');

  useEffect(()=>{
    if(pathname!=='/')return;
    let stopped=false;
    const place=()=>{
      if(stopped)return;
      const card=[...document.querySelectorAll('section.card')].find(x=>x.querySelector('h2')?.textContent?.trim()==='DB 관리');
      if(!card){setHost(null);return}
      let node=card.querySelector('[data-db-assignment-host]');
      if(!node){node=document.createElement('div');node.dataset.dbAssignmentHost='1';node.style.marginTop='14px';card.appendChild(node)}
      setHost(node);
    };
    place();const id=setInterval(place,500);
    return()=>{stopped=true;clearInterval(id)};
  },[pathname]);

  useEffect(()=>{
    if(!host)return;
    let alive=true;
    const load=async()=>{
      try{
        const [a,b,p]=await Promise.all([api.accounts(),api.batches(),telegramSendApi.preferences()]);
        if(!alive)return;
        const ready=(a.items||[]).filter(x=>String(x.status).toUpperCase()==='READY');
        setAccounts(ready);setBatches(b.items||[]);setPerAccount(limitValue(p.max_contacts_per_account||50));
        setSelected(v=>{const valid=new Set(ready.map(x=>Number(x.id)));const kept=v.filter(x=>valid.has(x));return kept.length?kept:ready.map(x=>Number(x.id))});
        setBatchId(v=>v||String(b.items?.[0]?.id||''));
      }catch(e){setMsg(e.message||String(e))}
    };
    load();const id=setInterval(load,6000);return()=>{alive=false;clearInterval(id)};
  },[host]);

  useEffect(()=>{
    if(!host||!batchId)return;
    let alive=true;
    const poll=async()=>{try{const r=await telegramSendApi.contactImportStatus(batchId);if(alive)setStatus(r)}catch{}};
    poll();const id=setInterval(poll,1500);return()=>{alive=false;clearInterval(id)};
  },[host,batchId]);

  const batch=batches.find(x=>String(x.id)===String(batchId));
  const capacity=useMemo(()=>selected.length*limitValue(perAccount),[selected,perAccount]);
  const remaining=Number(status?.remaining_count ?? batch?.total_count ?? 0);
  const planned=Math.min(remaining,capacity);
  const assigned=Number(status?.assigned_count||0);
  const toggle=id=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);

  async function saveMax(){
    setBusy(true);setMsg('');
    try{
      const p=await telegramSendApi.preferences();
      await telegramSendApi.savePreferences({message_text:p.message_text||'',button_text:p.button_text||'',button_url:p.button_url||'',max_contacts_per_account:limitValue(perAccount)});
      setMsg(`최대 연락처 추가 ${limitValue(perAccount)}건 저장 완료`);
    }catch(e){setMsg(e.message||String(e))}finally{setBusy(false)}
  }

  async function assign(){
    if(!batchId)return alert('DB를 선택하세요.');
    if(!selected.length)return alert('READY 계정을 1개 이상 선택하세요.');
    if(planned<=0)return alert('현재 미배정 연락처가 없습니다.');
    setBusy(true);setMsg('배정된 연락처 추가를 시작합니다...');
    try{
      const r=await telegramSendApi.startContactImport(batchId,{account_ids:selected,max_contacts_per_account:limitValue(perAccount)});
      setStatus(r);setMsg(`이번 배정 ${Number(r.total_count||0).toLocaleString()}건 연락처 추가 시작`);
    }catch(e){alert(e.message);setMsg(e.message||String(e))}finally{setBusy(false)}
  }

  function goSend(){
    const target=batches.find(x=>String(x.id)===String(batchId));
    if(!target)return;
    const cards=[...document.querySelectorAll('.batch')];
    const card=cards.find(x=>(x.querySelector('b')?.textContent||'').trim()===String(target.name||'').trim());
    const btn=[...(card?.querySelectorAll('button')||[])].find(x=>x.textContent?.includes('이 DB로 작업'));
    if(btn)btn.click();
  }

  if(!host)return null;
  const total=Number(batch?.total_count||status?.batch_total_count||0);
  return createPortal(
    <div style={{border:'1px solid #294a6d',borderRadius:12,padding:14,background:'#0b1b2f'}}>
      <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',marginBottom:12}}>
        <div><b>DB 계정 배정</b><div style={{fontSize:11,color:'#8ea6bf',marginTop:3}}>DB 전체가 아니라 이번에 지정한 수량만 계정에 배정합니다.</div></div>
        <button type="button" className="btn" onClick={goSend} disabled={!batchId}>발송 화면으로 이동</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'minmax(220px,1fr) 220px',gap:12}}>
        <div>
          <label className="field"><span>배정할 DB</span><select className="input" value={batchId} onChange={e=>{setBatchId(e.target.value);setStatus(null)}}><option value="">DB 선택</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name} · {Number(b.total_count||0).toLocaleString()}건</option>)}</select></label>
          <div style={{fontSize:12,color:'#9bb0c6',margin:'10px 0 7px'}}>배정할 READY 계정</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:7}}>
            {accounts.length?accounts.map(a=>{const id=Number(a.id),on=selected.includes(id);return <label key={a.id} style={{display:'flex',gap:8,alignItems:'center',padding:'9px 10px',border:`1px solid ${on?'#3187dc':'#273d57'}`,borderRadius:9,background:on?'#102b49':'#0d1827',cursor:'pointer'}}><input type="checkbox" checked={on} onChange={()=>toggle(id)}/><span><b style={{display:'block',fontSize:12}}>{a.label||a.phone_masked||`계정 #${a.id}`}</b><small style={{color:'#7fa2c4'}}>READY</small></span></label>}):<div style={{color:'#d29a62',fontSize:12}}>READY 계정이 없습니다.</div>}
          </div>
        </div>
        <div>
          <label className="field"><span>계정당 최대 연락처 추가</span><input className="input" type="number" min="1" max="1000" value={perAccount} onChange={e=>setPerAccount(limitValue(e.target.value))}/></label>
          <button type="button" className="btn" style={{width:'100%',marginTop:7}} onClick={saveMax} disabled={busy}>최대 처리개수 저장</button>
          <div style={{marginTop:8,padding:10,borderRadius:9,background:'#0e2239',fontSize:11,lineHeight:1.7,color:'#9fb4ca'}}>
            DB 총수량 <b style={{color:'#fff'}}>{total.toLocaleString()}건</b><br/>
            전체 배정완료 <b style={{color:'#62d69f'}}>{assigned.toLocaleString()}건</b><br/>
            현재 미배정 <b style={{color:'#fff'}}>{remaining.toLocaleString()}건</b><br/>
            이번 배정 예정 <b style={{color:'#61adff'}}>{planned.toLocaleString()}건</b>
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:12}}>
        <button type="button" className="btn primary" onClick={assign} disabled={busy||!batchId||!selected.length||planned<=0}>선택 계정에 배정 · 연락처 추가</button>
        <span style={{fontSize:11,color:'#7f9ab7'}}>연락처 추가 API는 기존대로 10개씩 묶음 처리됩니다.</span>
      </div>
      {status&&<div style={{marginTop:10,padding:10,borderRadius:9,background:'#0c1929',fontSize:11,color:'#a7bbcf'}}>이번 작업: <b>{status.status||'NOT_STARTED'}</b> · 진행 <b>{Number(status.processed||0).toLocaleString()} / {Number(status.total_count||0).toLocaleString()}</b> · 확인 <b style={{color:'#62d69f'}}>{Number(status.resolved||0).toLocaleString()}</b> · 실패 <b style={{color:'#e6a66b'}}>{Number(status.failed||0).toLocaleString()}</b>{status.error&&<div style={{color:'#ff9b9b',marginTop:4}}>{status.error}</div>}</div>}
      {msg&&<div style={{fontSize:11,color:'#8fc5ff',marginTop:8}}>{msg}</div>}
    </div>,host
  );
}
