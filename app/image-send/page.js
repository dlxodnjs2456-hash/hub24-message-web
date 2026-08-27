'use client';
import {useEffect,useMemo,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {api,BASE} from '../../lib/api';
import {telegramSendApi} from '../../lib/telegram-send-api';

const clamp=n=>Math.max(1,Math.min(1000,Number(n||1)));

async function request(path,options={}){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.access_token)throw new Error('로그인이 필요합니다.');
 const r=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,...(options.headers||{})}});
 let body={};try{body=await r.json()}catch{}
 if(!r.ok)throw new Error(body.detail||`HTTP ${r.status}`);
 return body;
}

export default function ImageSendPage(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null);
 const [accounts,setAccounts]=useState([]),[batches,setBatches]=useState([]),[selected,setSelected]=useState([]);
 const [batchId,setBatchId]=useState(''),[postCode,setPostCode]=useState(''),[perAccount,setPerAccount]=useState(50);
 const [delayMin,setDelayMin]=useState(2),[delayMax,setDelayMax]=useState(5),[globalDedupe,setGlobalDedupe]=useState(true);
 const [importStatus,setImportStatus]=useState(null),[busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[jobId,setJobId]=useState(null);

 useEffect(()=>{let alive=true;supabase.auth.getSession().then(async({data})=>{if(!alive)return;const s=data.session||null;setSession(s);setReady(true);if(!s)return;try{const [a,b,p]=await Promise.all([api.accounts(),api.batches(),telegramSendApi.preferences()]);if(!alive)return;const ac=(a.items||[]).filter(x=>String(x.status||'').toUpperCase()==='READY');setAccounts(ac);setSelected(ac.map(x=>Number(x.id)));setBatches(b.items||[]);if((b.items||[])[0])setBatchId(String(b.items[0].id));setPerAccount(clamp(p.max_contacts_per_account||50))}catch(e){setMsg(e.message)}});return()=>{alive=false}},[]);

 useEffect(()=>{if(!batchId||!session)return;let alive=true;const poll=async()=>{try{const s=await telegramSendApi.contactImportStatus(Number(batchId));if(alive)setImportStatus(s)}catch{}};poll();const id=setInterval(poll,1500);return()=>{alive=false;clearInterval(id)}},[batchId,session]);

 const capacity=useMemo(()=>selected.length*perAccount,[selected,perAccount]);
 const toggle=id=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 const go=p=>{window.location.href=p};

 async function saveMax(){setBusy(true);setMsg('');try{const prev=await telegramSendApi.preferences();await telegramSendApi.savePreferences({message_text:prev.message_text||'',button_text:prev.button_text||'',button_url:prev.button_url||'',max_contacts_per_account:clamp(perAccount)});setMsg(`계정당 최대 연락처 추가 ${clamp(perAccount)}건 저장 완료`)}catch(e){setMsg(e.message)}finally{setBusy(false)}}

 async function addContacts(){
  if(!batchId)return alert('발송 DB를 선택하세요.');
  if(!selected.length)return alert('READY 계정을 1개 이상 선택하세요.');
  const importAccountIds=[...selected];
  setBusy(true);setMsg(`연락처 추가 작업 시작 중... 선택 계정 ${importAccountIds.length}개`);
  try{await telegramSendApi.startContactImport(Number(batchId),{account_ids:importAccountIds,max_contacts_per_account:clamp(perAccount)});const s=await telegramSendApi.contactImportStatus(Number(batchId));setImportStatus(s);setMsg('연락처 추가를 시작했습니다. 완료 후 실제 발송할 계정만 체크한 상태에서 이미지 발송 시작을 누르세요.')}catch(e){alert(e.message);setMsg(e.message)}finally{setBusy(false)}
 }

 async function startSend(){
  if(!batchId)return alert('발송 DB를 선택하세요.');
  if(!postCode.trim())return alert('PostBot 이미지+버튼 게시물 코드를 입력하세요.');
  if(!selected.length)return alert('발송할 READY 계정을 1개 이상 체크하세요.');
  let s;try{s=await telegramSendApi.contactImportStatus(Number(batchId));setImportStatus(s)}catch(e){return alert(e.message)}
  if(String(s.status||'')!=='COMPLETED')return alert('먼저 연락처 추가 작업을 완료하세요.');

  // Snapshot the exact checkbox state at Start. Later UI changes cannot add
  // another account to this job.
  const sendAccountIds=[...selected].map(Number);
  const progress=Object.values(s.account_progress||{});
  const zeroResolved=sendAccountIds.filter(id=>{const p=progress.find(x=>Number(x.account_id)===Number(id));return p&&Number(p.resolved||0)<=0});

  setBusy(true);setMsg(`이미지 발송 JOB 생성 중... 체크 계정 ${sendAccountIds.length}개`);setJobId(null);
  try{
   const j=await request('/v1/image-jobs',{method:'POST',body:JSON.stringify({batch_id:Number(batchId),post_code:postCode.trim(),account_ids:sendAccountIds,contacts_per_account:clamp(perAccount),delay_min:Number(delayMin||0),delay_max:Number(delayMax||0),global_dedupe:globalDedupe})});
   setJobId(j.id);
   try{
    await api.startJob(j.id);
   }catch(startError){
    const text=`JOB #${j.id} 생성은 완료됐지만 시작 요청 확인이 필요합니다: ${startError.message}`;
    setMsg(text);alert(text);return;
   }
   const excluded=(j.excluded_zero_target_account_ids||[]).length;
   const actual=Number(j.selected_account_count||0);
   const total=Number(j.assigned_count||j.total_count||0);
   setMsg(`이미지+버튼 발송 시작 / 실제 작업 계정 ${actual}개 · 대상 ${total.toLocaleString()}건${excluded?` · 확인 0건 계정 ${excluded}개 제외`:zeroResolved.length?` · 확인 0건 계정 ${zeroResolved.length}개 자동 제외`:''} · JOB #${j.id}`);
  }catch(e){alert(e.message);setMsg(e.message)}finally{setBusy(false)}
 }

 if(!ready)return <div className="shell"><aside className="sidebar"><div className="brand">ANGEL PAY</div></aside><main className="content"><section className="card">불러오는 중...</section></main></div>;
 if(!session)return <main className="content"><section className="card">로그인이 필요합니다.</section></main>;
 const s=importStatus||{};const total=Number(s.total_count||0),processed=Number(s.processed||0),resolved=Number(s.resolved||0),failed=Number(s.failed||0);const accountProgress=Object.values(s.account_progress||{});
 const progressByAccount=new Map(accountProgress.map(p=>[Number(p.account_id),p]));

 return <div className="shell"><aside className="sidebar"><div className="brand">ANGEL PAY</div><div className="sub">N PAY · 엔페이</div><div className="nav"><button onClick={()=>go('/')}>메시지 발송</button><button className="active">이미지 발송</button><button onClick={()=>go('/?tab=accounts')}>Telegram 계정</button><button onClick={()=>go('/?tab=database')}>DB 관리</button><button onClick={()=>go('/?tab=live')}>실시간 작업 로그</button><button onClick={()=>go('/?tab=history')}>작업 이력</button><button onClick={()=>go('/?tab=guide')}>사용방법</button></div></aside><main className="content">
  <header className="top"><div><h1>이미지 발송</h1><p>이미지 + 본문 + 인라인 버튼이 포함된 PostBot 게시물을 배정 DB에 정식 발송합니다.</p></div></header>
  <div className="stats"><div className="stat"><small>READY 계정</small><strong>{accounts.length}</strong></div><div className="stat"><small>현재 발송 선택</small><strong>{selected.length}</strong></div><div className="stat"><small>현재 최대 배정</small><strong>{capacity.toLocaleString()}</strong></div><div className="stat"><small>연락처 확인</small><strong>{resolved.toLocaleString()}</strong></div></div>

  <section className="card">
   <div className="head"><div><h2>이미지 + 버튼 발송 작업</h2><p>① DB/계정 배정 → ② 연락처 추가 → ③ 실제 발송할 계정만 체크 → ④ 이미지 발송 시작</p></div><div className="actions compact"><button className="btn" onClick={()=>go('/?tab=database')}>DB 관리</button><button className="btn" onClick={()=>go('/?tab=accounts')}>계정 관리 / 추가</button></div></div>
   <div className="form">
    <label className="field"><span>발송 DB</span><select className="input" value={batchId} onChange={e=>{setBatchId(e.target.value);setImportStatus(null);setJobId(null)}}><option value="">DB 선택</option>{batches.map(b=><option key={b.id} value={b.id}>{b.name} · {Number(b.total_count||0).toLocaleString()}건</option>)}</select></label>
    <label className="field"><span>PostBot 이미지+버튼 게시물 코드</span><input className="input" value={postCode} onChange={e=>setPostCode(e.target.value)} placeholder="예: 40599y1mszb005s"/></label>
    <label className="field"><span>최소 간격</span><input className="input" type="number" min="0" step="0.5" value={delayMin} onChange={e=>setDelayMin(e.target.value)}/></label>
    <label className="field"><span>최대 간격</span><input className="input" type="number" min="0" step="0.5" value={delayMax} onChange={e=>setDelayMax(e.target.value)}/></label>
   </div>
   <label className="check"><input type="checkbox" checked={globalDedupe} onChange={e=>setGlobalDedupe(e.target.checked)}/> 전화번호/Telegram UID 전체 성공이력 중복 방지</label>

   <div style={{marginTop:16,border:'1px solid #294a6d',borderRadius:12,padding:14,background:'#0b1b2f'}}>
    <div style={{display:'grid',gridTemplateColumns:'1fr 220px',gap:12,alignItems:'start'}}>
     <div><div style={{fontSize:12,color:'#9bb0c6',marginBottom:7}}>발송 시작 시 <b style={{color:'#fff'}}>현재 체크되어 있는 계정만</b> 실제 JOB에 포함됩니다.</div><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:7}}>{accounts.length?accounts.map(a=>{const id=Number(a.id),on=selected.includes(id),p=progressByAccount.get(id);return <label key={a.id} style={{display:'flex',alignItems:'center',gap:8,border:`1px solid ${on?'#3187dc':'#273d57'}`,borderRadius:9,padding:'9px 10px',cursor:'pointer',background:on?'#102b49':'#0d1827'}}><input type="checkbox" checked={on} onChange={()=>toggle(id)}/><span style={{minWidth:0}}><b style={{display:'block',fontSize:12}}>{a.label||a.phone_masked||`계정 #${a.id}`}</b><small style={{color:on?'#61adff':'#71869c'}}>{on?'발송 선택':'발송 제외'}{p?` · 확인 ${Number(p.resolved||0).toLocaleString()} · 실패 ${Number(p.failed||0).toLocaleString()}`:' · READY'}</small></span></label>}):<div style={{fontSize:12,color:'#d29a62'}}>READY 계정이 없습니다.</div>}</div></div>
     <div><label className="field"><span>계정당 최대 연락처 추가</span><input className="input" type="number" min="1" max="1000" value={perAccount} onChange={e=>setPerAccount(clamp(e.target.value))}/></label><button type="button" className="btn" style={{width:'100%',marginTop:7}} onClick={saveMax} disabled={busy}>최대 처리개수 저장</button><div style={{marginTop:8,padding:10,borderRadius:9,background:'#0e2239',fontSize:11,lineHeight:1.65,color:'#9fb4ca'}}>발송 선택 <b style={{color:'#fff'}}>{selected.length}개</b><br/>현재 최대 처리 <b style={{color:'#61adff'}}>{capacity.toLocaleString()}건</b><br/><span style={{color:'#6f8aa6'}}>연락처 추가 API는 계정별 10개씩 묶음 처리</span></div></div>
    </div>

    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}><button type="button" className="btn" onClick={addContacts} disabled={busy}>① 연락처 추가</button><button type="button" className="btn primary" onClick={startSend} disabled={busy||String(s.status||'')!=='COMPLETED'}>② 이미지 발송 시작</button>{jobId&&<button type="button" className="btn" onClick={()=>go('/?tab=live')}>JOB #{jobId} 작업 로그</button>}</div>

    <div style={{marginTop:10,padding:10,borderRadius:9,background:'#0c1929',fontSize:11,color:'#9fb4ca'}}>연락처 추가 상태: <b style={{color:s.status==='COMPLETED'?'#62d69f':s.status==='RUNNING'?'#61adff':'#fff'}}>{s.status||'NOT_STARTED'}</b>{total>0&&<> · 진행 <b>{processed.toLocaleString()} / {total.toLocaleString()}</b> · 확인 <b style={{color:'#62d69f'}}>{resolved.toLocaleString()}</b> · 미확인/실패 <b style={{color:'#e6a66b'}}>{failed.toLocaleString()}</b></>}{s.error&&<div style={{color:'#ff9b9b',marginTop:5}}>{s.error}</div>}{msg&&<div style={{color:'#8fc5ff',marginTop:5}}>{msg}</div>}</div>

    {accountProgress.length>0&&<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8,marginTop:9}}>{accountProgress.map(p=>{const pct=p.total?Math.round((Number(p.processed||0)/Number(p.total))*100):100;const on=selected.includes(Number(p.account_id));return <div key={p.account_id} style={{border:`1px solid ${on?'#315c87':'#263f59'}`,borderRadius:9,padding:9,background:on?'#0d2239':'#0d1d2f',opacity:on?1:.65}}><div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:11}}><b>{p.label||`계정 #${p.account_id}`}</b><span>{on?'발송 선택':'발송 제외'} · {p.status}</span></div><div style={{height:6,borderRadius:4,background:'#142a40',overflow:'hidden',margin:'7px 0'}}><div style={{height:'100%',width:`${Math.max(0,Math.min(100,pct))}%`,background:'currentColor',color:'#4da3ff'}}/></div><div style={{fontSize:10,color:'#8fa7bf'}}>진행 {Number(p.processed||0).toLocaleString()} / {Number(p.total||0).toLocaleString()} · 확인 {Number(p.resolved||0).toLocaleString()} · 실패 {Number(p.failed||0).toLocaleString()}</div></div>})}</div>}
   </div>
   <div className="note" style={{marginTop:12}}>이미지 발송 시작을 누르는 순간 체크된 계정만 JOB에 고정됩니다. 체크했더라도 연락처 확인 성공 대상이 0건인 계정은 자동 제외됩니다. 성공 처리된 대상만 기존 정책대로 15P가 차감됩니다.</div>
  </section>
 </main></div>;
}
