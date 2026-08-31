'use client';

import {useEffect,useMemo,useState} from 'react';
import {createPortal} from 'react-dom';
import {usePathname} from 'next/navigation';

const STEPS=[
 {n:1,title:'계정 연결',desc:'Telegram 계정과 API를 준비합니다.',href:'/?tab=accounts'},
 {n:2,title:'DB 준비',desc:'DB를 올리고 연락처 추가를 완료합니다.',href:'/?tab=database'},
 {n:3,title:'게시물 만들기',desc:'내 봇에 이미지·본문·버튼·코드를 저장합니다.',href:'/inline-posts'},
 {n:4,title:'이미지 발송',desc:'DB와 계정을 선택하고 게시물 코드로 발송합니다.',href:'/image-send'},
 {n:5,title:'결과 확인',desc:'SENT·FAILED를 확인하고 필요한 건만 정리합니다.',href:'/?tab=live'},
];

function currentStep(path){
 if(path==='/inline-posts')return 3;
 if(path==='/image-send')return 4;
 if(path!=='/')return 0;
 if(typeof window==='undefined')return 1;
 const tab=new URLSearchParams(window.location.search).get('tab')||'';
 if(tab==='accounts')return 1;
 if(tab==='database')return 2;
 if(tab==='live'||tab==='history'||tab==='guide')return 5;
 return 1;
}

export default function BeginnerFlowGuide(){
 const pathname=usePathname();
 const [host,setHost]=useState(null);
 const [step,setStep]=useState(0);
 const [open,setOpen]=useState(true);
 const allowed=useMemo(()=>pathname==='/'||pathname==='/image-send'||pathname==='/inline-posts',[pathname]);

 useEffect(()=>{
  if(!allowed){setHost(null);return}
  setStep(currentStep(pathname));
  let stopped=false;
  const place=()=>{
   if(stopped)return;
   const main=document.querySelector('main.content');
   if(!main){setTimeout(place,250);return}
   let node=main.querySelector('[data-beginner-flow-host]');
   if(!node){
    node=document.createElement('div');node.dataset.beginnerFlowHost='1';
    const top=main.querySelector('header.top');
    if(top)main.insertBefore(node,top);else main.prepend(node);
   }
   setHost(node);
  };
  place();
  return()=>{stopped=true};
 },[allowed,pathname]);

 if(!allowed||!host)return null;
 const now=STEPS.find(x=>x.n===step)||STEPS[0];
 const next=STEPS.find(x=>x.n===Math.min(5,(step||1)+1));

 return createPortal(
  <section style={{border:'1px solid #2b4d72',background:'linear-gradient(180deg,#102239,#0b1726)',borderRadius:14,padding:14,marginBottom:16}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap'}}>
    <div><b style={{fontSize:15}}>처음 사용하나요? 이 순서만 따라가세요.</b><div style={{fontSize:11,color:'#91a8c1',marginTop:4}}>기존 기능은 그대로이며, 아래 단계는 사용 순서만 쉽게 보여줍니다.</div></div>
    <button type="button" className="btn" onClick={()=>setOpen(v=>!v)}>{open?'간단히 보기':'전체 순서 보기'}</button>
   </div>
   {open&&<>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:8,marginTop:12}}>
     {STEPS.map(x=>{const active=x.n===step;return <button key={x.n} type="button" onClick={()=>{window.location.href=x.href}} style={{border:`1px solid ${active?'#4b9cff':'#29405c'}`,background:active?'#12365b':'#0d1a2a',color:'#eef5ff',borderRadius:11,padding:'11px 10px',textAlign:'left',cursor:'pointer',minHeight:82}}><span style={{display:'inline-grid',placeItems:'center',width:22,height:22,borderRadius:999,background:active?'#2879d8':'#1b2b3f',fontSize:11,fontWeight:900}}>{x.n}</span><b style={{display:'block',fontSize:12,marginTop:7}}>{x.title}{active?' · 현재 단계':''}</b><small style={{display:'block',color:'#8fa7c0',fontSize:10,lineHeight:1.45,marginTop:4}}>{x.desc}</small></button>})}
    </div>
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',marginTop:10,padding:'10px 11px',background:'#091521',borderRadius:10}}>
     <div style={{fontSize:11,color:'#9fb4ca'}}><b style={{color:'#fff'}}>지금 할 일:</b> {now.desc}</div>
     {step<5&&next&&<button type="button" className="btn primary" onClick={()=>{window.location.href=next.href}}>다음 단계: {next.n}. {next.title}</button>}
    </div>
   </>}
  </section>,host
 );
}
