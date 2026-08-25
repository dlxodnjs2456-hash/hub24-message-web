'use client';
import {useEffect,useRef,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';
import {api} from '../lib/api';

const fmt=n=>Number(n||0).toLocaleString('ko-KR')+' P';

export default function TopNav(){
 const p=usePathname();
 const [session,setSession]=useState(null),[wallet,setWallet]=useState(null),[open,setOpen]=useState('');
 const wrap=useRef(null);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>setSession(data.session||null));const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>setSession(s||null));return()=>subscription.unsubscribe()},[]);
 useEffect(()=>{if(session)api.wallet().then(r=>setWallet(r.wallet||null)).catch(()=>{});else setWallet(null)},[session,p]);
 useEffect(()=>{const close=e=>{if(wrap.current&&!wrap.current.contains(e.target))setOpen('')};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close)},[]);
 if(p?.startsWith('/admin'))return null;
 const s={
  head:{height:68,background:'linear-gradient(90deg,#0b1730,#102a56)',borderBottom:'1px solid #315b91',position:'sticky',top:0,zIndex:100,color:'#fff',boxShadow:'0 8px 26px rgba(2,12,32,.28)'},
  inner:{maxWidth:1680,height:'100%',margin:'0 auto',padding:'0 24px',display:'flex',alignItems:'center',gap:8},
  logo:{display:'flex',alignItems:'center',gap:10,fontWeight:950,fontSize:19,color:'#fff',textDecoration:'none',marginRight:24,letterSpacing:.2},
  logoMark:{width:34,height:34,borderRadius:11,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#4d9cff,#7cd7ff)',color:'#06224d',fontWeight:1000,boxShadow:'0 8px 20px rgba(72,155,255,.3)'},
  logoSub:{display:'block',fontSize:8,color:'#9fc8ff',letterSpacing:1.4,fontWeight:800,marginTop:2},
  nav:{display:'flex',height:'100%',alignItems:'center',gap:4},
  navItem:(active)=>({height:'100%',display:'flex',alignItems:'center',padding:'0 15px',color:active?'#fff':'#b8c9df',textDecoration:'none',fontSize:13,fontWeight:800,borderBottom:active?'3px solid #69b7ff':'3px solid transparent'}),
  account:{marginLeft:'auto',display:'flex',alignItems:'center',gap:8},
  point:{height:40,border:'1px solid #4d77aa',background:'#ffffff10',color:'#fff',borderRadius:11,padding:'0 12px',display:'flex',alignItems:'center',gap:8,cursor:'pointer',backdropFilter:'blur(8px)'},
  profile:{height:40,border:'1px solid #4d77aa',background:'#ffffff10',color:'#fff',borderRadius:11,padding:'4px 8px',display:'flex',alignItems:'center',gap:7,cursor:'pointer'},
  avatar:{width:30,height:30,borderRadius:9,background:'linear-gradient(135deg,#4f9bff,#6fd9ff)',color:'#06234c',display:'grid',placeItems:'center',fontSize:12,fontWeight:950},
  wrap:{position:'relative'},
  drop:{position:'absolute',right:0,top:48,minWidth:250,background:'#f8fbff',color:'#10213d',border:'1px solid #c8d8eb',borderRadius:12,boxShadow:'0 20px 50px rgba(8,28,58,.18)',padding:8,zIndex:120},
  row:{display:'flex',justifyContent:'space-between',gap:18,padding:'9px 8px',borderBottom:'1px solid #e4edf7',fontSize:11},
  link:{display:'block',padding:'10px 9px',color:'#1a3356',textDecoration:'none',fontSize:11,borderRadius:8},
 };
 const nav=(href,label,active)=><a href={href} style={s.navItem(active)}>{label}</a>;
 const email=session?.user?.email||'';const initial=(email[0]||'U').toUpperCase();
 return <header style={s.head} ref={wrap}><div style={s.inner}>
   <a href="/market" style={s.logo}><span style={s.logoMark}>N</span><span>ANGEL PAY<span style={s.logoSub}>N PAY · 엔페이</span></span></a>
   <nav style={s.nav}>
    {nav('/market','구매',p?.startsWith('/market')||p?.startsWith('/seller'))}
    {nav('/','메시지',p==='/')}
    {nav('/wallet','자금',p?.startsWith('/wallet'))}
    {nav('/?guide=1','사용방법',false)}
   </nav>
   <div style={s.account}>
    {session&&<div style={s.wrap}>
      <button style={s.point} onClick={()=>setOpen(open==='wallet'?'':'wallet')}><span style={{fontSize:9,color:'#b7d8ff',fontWeight:900}}>N POINT</span><b style={{fontSize:12}}>{fmt(wallet?.available_balance)}</b><span>⌄</span></button>
      {open==='wallet'&&<div style={s.drop}><div style={{padding:'6px 8px 10px',fontSize:11,fontWeight:900}}>엔페이 포인트</div><div style={s.row}><span style={{color:'#6c7f99'}}>사용 가능</span><b>{fmt(wallet?.available_balance)}</b></div><div style={s.row}><span style={{color:'#6c7f99'}}>에스크로</span><b>{fmt(wallet?.escrow_balance)}</b></div><div style={s.row}><span style={{color:'#6c7f99'}}>판매 정산</span><b>{fmt(wallet?.settlement_balance)}</b></div><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,marginTop:8}}><a href="/wallet?tab=charge" style={{...s.link,textAlign:'center',background:'#edf5ff'}}>충전</a><a href="/wallet?tab=withdraw" style={{...s.link,textAlign:'center',background:'#edf5ff'}}>출금</a><a href="/wallet?tab=history" style={{...s.link,textAlign:'center',background:'#edf5ff'}}>내역</a></div></div>}
    </div>}
    {session?<div style={s.wrap}><button style={s.profile} onClick={()=>setOpen(open==='profile'?'':'profile')}><span style={s.avatar}>{initial}</span><span>⌄</span></button>{open==='profile'&&<div style={{...s.drop,minWidth:220}}><div style={{padding:'8px 9px 10px',fontSize:10,color:'#6e8098',borderBottom:'1px solid #e2ebf5',overflow:'hidden',textOverflow:'ellipsis'}}>{email}</div><a href="/market?view=trades" style={s.link}>내 거래</a><a href="/seller" style={s.link}>판매자센터</a><a href="/wallet" style={s.link}>자금 관리</a><button onClick={()=>supabase.auth.signOut()} style={{width:'100%',border:0,background:'transparent',color:'#d94b5b',textAlign:'left',padding:'10px 9px',fontSize:11,cursor:'pointer'}}>로그아웃</button></div>}</div>:<a href="/" style={{...s.link,border:'1px solid #4d77aa',background:'#ffffff12',color:'#fff'}}>로그인</a>}
   </div>
 </div></header>;
}
