'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';
import {noticeApi} from '../lib/notice-api';

const BOARD_PATHS=['/market','/free','/jobs','/blacklist'];
const date=v=>v?String(v).replace('T',' ').slice(0,16):'';

export default function BoardNotices(){
  const p=usePathname();
  const [items,setItems]=useState([]);
  const isBoard=BOARD_PATHS.some(x=>p===x||p?.startsWith(x+'/')||p?.startsWith(x+'?'));
  useEffect(()=>{
    if(!isBoard){setItems([]);return}
    let alive=true;
    const load=async()=>{try{const {data:{session}}=await supabase.auth.getSession();if(!session||!alive)return;const r=await noticeApi.list();if(alive)setItems(r.items||[])}catch{}};
    load();const id=setInterval(load,30000);return()=>{alive=false;clearInterval(id)};
  },[isBoard,p]);
  if(!isBoard||!items.length)return null;
  return <div style={{maxWidth:1720,margin:'18px auto 0',padding:'0 18px'}}>
    <section style={{border:'1px solid #2f5f91',background:'linear-gradient(180deg,#10243c,#0c1b2e)',borderRadius:14,overflow:'hidden',boxShadow:'0 10px 28px rgba(2,12,28,.22)'}}>
      <div style={{padding:'11px 14px',borderBottom:'1px solid #294b6d',fontSize:12,fontWeight:950,color:'#eaf5ff'}}>📢 공지사항</div>
      {items.map((n,i)=><div key={n.id} style={{padding:'12px 14px',borderTop:i?'1px solid #203c58':'0'}}><div style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'center'}}><b style={{fontSize:13,color:'#fff'}}><span style={{display:'inline-block',marginRight:8,padding:'3px 7px',borderRadius:7,background:'#2d7fd3',fontSize:9}}>공지</span>{n.title}</b><small style={{color:'#7692ae',whiteSpace:'nowrap'}}>{date(n.created_at)}</small></div><div style={{marginTop:7,color:'#b8ccdf',fontSize:11,lineHeight:1.65,whiteSpace:'pre-wrap'}}>{n.content}</div></div>)}
    </section>
  </div>;
}
