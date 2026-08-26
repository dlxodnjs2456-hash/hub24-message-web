'use client';

import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';
import {api,BASE} from '../lib/api';

const KEY='npay_send_assignment_v1';

export default function SendAssignmentControls(){
  const pathname=usePathname();
  const [host,setHost]=useState(null);
  const [accounts,setAccounts]=useState([]);
  const [selected,setSelected]=useState([]);
  const [perAccount,setPerAccount]=useState(50);
  const [loaded,setLoaded]=useState(false);

  useEffect(()=>{
    if(pathname!=='/')return;
    let stopped=false;
    const place=()=>{
      if(stopped)return;
      const cards=[...document.querySelectorAll('section.card')];
      const card=cards.find(x=>x.querySelector('h2')?.textContent?.includes('새 발송 작업'));
      if(!card){setTimeout(place,400);return}
      let node=card.querySelector('[data-send-assignment-host]');
      if(!node){
        node=document.createElement('div');
        node.dataset.sendAssignmentHost='1';
        const form=card.querySelector('.form');
        if(form)form.insertAdjacentElement('afterend',node);else card.appendChild(node);
      }
      setHost(node);
    };
    place();
    return()=>{stopped=true};
  },[pathname]);

  useEffect(()=>{
    if(pathname!=='/')return;
    let alive=true;
    const load=async()=>{
      try{
        const r=await api.accounts();
        if(!alive)return;
        const items=(r.items||[]).filter(a=>String(a.status).toUpperCase()==='READY');
        setAccounts(items);
        let saved=null;
        try{saved=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
        const valid=new Set(items.map(a=>Number(a.id)));
        const wanted=(saved?.account_ids||[]).map(Number).filter(id=>valid.has(id));
        const next=wanted.length?wanted:items.map(a=>Number(a.id));
        setSelected(next);
        const n=Number(saved?.contacts_per_account||50);
        setPerAccount(Math.max(1,Math.min(60,Number.isFinite(n)?n:50)));
        setLoaded(true);
      }catch{setLoaded(true)}
    };
    load();
    const id=setInterval(load,6000);
    return()=>{alive=false;clearInterval(id)};
  },[pathname]);

  useEffect(()=>{
    if(!loaded)return;
    localStorage.setItem(KEY,JSON.stringify({account_ids:selected,contacts_per_account:perAccount}));
  },[loaded,selected,perAccount]);

  useEffect(()=>{
    if(pathname!=='/')return;
    const original=window.fetch;
    window.fetch=async(input,init={})=>{
      try{
        const url=typeof input==='string'?input:input?.url||'';
        const method=String(init?.method||'GET').toUpperCase();
        if(method==='POST'&&(url===BASE+'/v1/jobs'||url.endsWith('/v1/jobs'))&&init?.body){
          const current=JSON.parse(init.body);
          let saved={};
          try{saved=JSON.parse(localStorage.getItem(KEY)||'{}')}catch{}
          current.account_ids=Array.isArray(saved.account_ids)?saved.account_ids.map(Number):[];
          current.contacts_per_account=Math.max(1,Math.min(60,Number(saved.contacts_per_account||50)));
          init={...init,body:JSON.stringify(current)};
        }
      }catch{}
      return original(input,init);
    };
    return()=>{window.fetch=original};
  },[pathname]);

  const capacity=useMemo(()=>selected.length*Number(perAccount||0),[selected,perAccount]);
  const toggle=id=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
  const openAccounts=()=>{
    const btn=[...document.querySelectorAll('.sidebar .nav button')].find(x=>x.textContent?.includes('Telegram 계정'));
    btn?.click();
  };

  if(pathname!=='/'||!host)return null;
  return createPortal(
    <div style={{marginTop:14,border:'1px solid #294a6d',borderRadius:12,padding:14,background:'#0b1b2f'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:10}}>
        <div><b style={{fontSize:14}}>계정 · DB 배정</b><div style={{fontSize:11,color:'#8ba3bd',marginTop:3}}>위에서 선택한 발송 DB를 아래 READY 계정에 고정 배정합니다.</div></div>
        <button type="button" className="btn" onClick={openAccounts}>계정 관리 / 추가</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 190px',gap:12,alignItems:'start'}}>
        <div>
          <div style={{fontSize:12,color:'#9bb0c6',marginBottom:7}}>사용할 Telegram 계정</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:7}}>
            {accounts.length?accounts.map(a=>{
              const id=Number(a.id),on=selected.includes(id);
              return <label key={a.id} style={{display:'flex',alignItems:'center',gap:8,border:`1px solid ${on?'#3187dc':'#273d57'}`,borderRadius:9,padding:'9px 10px',cursor:'pointer',background:on?'#102b49':'#0d1827'}}>
                <input type="checkbox" checked={on} onChange={()=>toggle(id)}/>
                <span style={{minWidth:0}}><b style={{display:'block',fontSize:12,overflow:'hidden',textOverflow:'ellipsis'}}>{a.label||a.phone_masked||`계정 #${a.id}`}</b><small style={{color:'#7fa2c4'}}>READY · 성공 {Number(a.sent_count||0).toLocaleString()}건</small></span>
              </label>
            }):<div style={{fontSize:12,color:'#d29a62'}}>READY 계정이 없습니다. 계정 관리 / 추가에서 먼저 등록하세요.</div>}
          </div>
        </div>
        <div>
          <label className="field"><span>계정당 연락처 처리 개수</span><input className="input" type="number" min="1" max="60" value={perAccount} onChange={e=>setPerAccount(Math.max(1,Math.min(60,Number(e.target.value||1))))}/></label>
          <div style={{marginTop:8,padding:10,borderRadius:9,background:'#0e2239',fontSize:11,lineHeight:1.65,color:'#9fb4ca'}}>
            선택 계정 <b style={{color:'#fff'}}>{selected.length}개</b><br/>
            이번 작업 최대 배정 <b style={{color:'#61adff'}}>{capacity.toLocaleString()}건</b><br/>
            <span style={{color:'#6f8aa6'}}>계정별 최대 60건 / 제한 계정 자동 우회 없음</span>
          </div>
        </div>
      </div>
    </div>,host
  );
}
