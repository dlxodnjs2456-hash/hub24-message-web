'use client';
import {useEffect} from 'react';
import {supabase} from '../lib/supabase';
import {BASE} from '../lib/api';

async function reuseCleanup(jobId){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.access_token)throw new Error('로그인이 필요합니다.');
 const r=await fetch(`${BASE}/v1/jobs/${jobId}/reuse-cleanup`,{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json'}});
 let b={};try{b=await r.json()}catch{}
 if(!r.ok)throw new Error(b.detail||`HTTP ${r.status}`);
 return b;
}

export default function ImageSendInlineLabels(){
 useEffect(()=>{
  const path=window.location.pathname;
  const patchImageLabels=()=>{
   if(path!=='/image-send')return;
   document.querySelectorAll('h1,h2,p,span,label').forEach(el=>{
    if(el.children.length)return;
    const t=el.textContent||'';
    if(t.includes('PostBot 이미지+버튼 게시물 코드'))el.textContent=t.replace('PostBot 이미지+버튼 게시물 코드','내 게시물 코드');
    else if(t.includes('PostBot 게시물'))el.textContent=t.replace('PostBot 게시물','내 Inline 게시물');
   });
   const input=[...document.querySelectorAll('input')].find(x=>(x.placeholder||'').includes('40599'));
   if(input)input.placeholder='예: STOCK001';
  };

  const patchReuseControls=()=>{
   if(path!=='/')return;
   const cards=[...document.querySelectorAll('section.card')];
   const live=cards.find(x=>x.querySelector('h2')?.textContent?.includes('실시간 작업 로그'));
   if(live){
    const actions=live.querySelector('.actions');
    if(actions&&!actions.querySelector('[data-reuse-cleanup]')){
     const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.dataset.reuseCleanup='1';btn.textContent='SENT 제외 / FAILED 재배치';
     btn.onclick=async()=>{
      const select=live.querySelector('select.input.job');const jid=Number(select?.value||0);if(!jid)return alert('JOB을 선택하세요.');
      if(!confirm('현재 JOB에서 SENT 대상은 재처리 목록에서 제거하고, 일반 FAILED는 READY 계정에 다시 배치합니다. Telegram frozen/rate limit 관련 실패는 자동 재배치하지 않고 보류합니다. 계속할까요?'))return;
      btn.disabled=true;const old=btn.textContent;btn.textContent='정리 중...';
      try{const r=await reuseCleanup(jid);alert(`정리 완료\nSENT 제외 ${Number(r.sent_removed||0)}건\nFAILED 재배치 ${Number(r.failed_requeued||0)}건\n제한 실패 보류 ${Number(r.restricted_kept||0)}건\n남은 대상 ${Number(r.remaining||0)}건\n\n재배치된 FAILED는 자동 발송하지 않습니다. 상태 확인 후 시작/재개를 누르세요.`)}catch(e){alert(e.message)}finally{btn.disabled=false;btn.textContent=old}
     };
     actions.appendChild(btn);
     const note=document.createElement('div');note.dataset.reuseCleanupNote='1';note.className='note';note.style.marginTop='10px';note.textContent='DB 재사용: SENT는 성공이력은 보존한 채 현재 JOB 대상에서 제외되고, 일반 FAILED만 WAITING으로 재배치됩니다. frozen/rate limit 실패는 제한 우회를 막기 위해 보류됩니다.';live.appendChild(note);
    }
   }

   const guide=cards.find(x=>x.querySelector('h2')?.textContent?.includes('사용방법'));
   if(guide&&!guide.querySelector('[data-reuse-guide]')){
    const list=guide.querySelector('.batches');if(list){
     const item=document.createElement('div');item.className='batch';item.dataset.reuseGuide='1';
     const b=document.createElement('b');b.textContent='9. SENT 제외 / FAILED 재배치';
     const s=document.createElement('span');s.textContent='같은 원본 DB를 다시 업로드하지 않고 이어서 사용할 때 실시간 작업 로그에서 해당 JOB을 선택한 뒤 “SENT 제외 / FAILED 재배치”를 누릅니다. SENT 대상은 현재 JOB 재처리 목록에서 제거되지만 send_history 성공이력은 유지되어 중복 발송을 막습니다. 일반 FAILED는 현재 READY 계정에 WAITING 상태로 다시 배치되며 자동 발송하지 않으므로 확인 후 시작/재개를 눌러야 합니다. frozen, rate limit, FLOOD_WAIT 등 Telegram 제한 관련 실패는 다른 계정으로 자동 전환하지 않고 FAILED 상태로 보류합니다.';
     item.appendChild(b);item.appendChild(s);list.appendChild(item);
    }
   }
  };

  const patch=()=>{patchImageLabels();patchReuseControls()};
  patch();const ob=new MutationObserver(patch);ob.observe(document.body,{childList:true,subtree:true});return()=>ob.disconnect();
 },[]);
 return null;
}
