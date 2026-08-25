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
  inner:{maxWidth:1720,height:'100%',margin:'0 auto',padding:'0 18px',display:'flex',alignItems:'center',gap:4},
  logo:{display:'flex',alignItems:'center',gap:9,fontWeight:950,fontSize:18,color:'#fff',textDecoration:'none',marginRight:14,letterSpacing:.2,flex:'0 0 auto'},
  logoMark:{width:34,height:34,borderRadius:11,display:'grid',placeItems:'center',background:'linear-gradient(135deg,#4d9cff,#7cd7ff)',color:'#06224d',fontWeight:1000,boxShadow:'0 8px 20px rgba(72,155,255,.3)'},
  logoSub:{display:'block',fontSize:8,color:'#9fc8ff',letterSpacing:1.4,fontWeight:800,marginTop:2},
  nav:{display:'flex',height:'100%',alignItems:'center',gap:1,minWidth:0},
  navItem:(active)=>({height:'100%',display:'flex',alignItems:'center',padding:'0 11px',color:active?'#fff':'#b8c9df',textDecoration:'none',fontSize:12,fontWeight:850,borderBottom:active?'3px solid #69b7ff':'3px solid transparent',whiteSpace:'nowrap'}),
  account:{marginLeft:'auto',display:'flex',alignItems:'center',gap:7,flex:'0 0 auto'},
  point:{height:40,border:'1px solid #4d77aa',background:'#ffffff10',color:'#fff',borderRadius:11,padding:'0 10px',display:'flex',alignItems:'center',gap:7,cursor:'pointer',backdropFilter:'blur(8px)'},
  profile:{height:40,border:'1px solid #4d77aa',background:'#ffffff10',color:'#fff',borderRadius:11,padding:'4px 8px',display:'flex',alignItems:'center',gap:7,cursor:'pointer'},
  avatar:{width:30,height:30,borderRadius:9,background:'linear-gradient(135deg,#4f9bff,#6fd9ff)',color:'#06234c',display:'grid',placeItems:'center',fontSize:12,fontWeight:950},
  wrap:{position:'relative'},
  drop:{position:'absolute',right:0,top:48,minWidth:250,background:'#0f2036',color:'#edf6ff',border:'1px solid #315174',borderRadius:12,boxShadow:'0 20px 50px rgba(3,14,30,.38)',padding:8,zIndex:120},
  row:{display:'flex',justifyContent:'space-between',gap:18,padding:'9px 8px',borderBottom:'1px solid #294867',fontSize:11},
  link:{display:'block',padding:'10px 9px',color:'#d9eaff',textDecoration:'none',fontSize:11,borderRadius:8},
 };
 const nav=(href,label,active)=><a href={href} style={s.navItem(active)}>{label}</a>;
 const email=session?.user?.email||'';const initial=(email[0]||'U').toUpperCase();
 return <header style={s.head} ref={wrap}><div style={s.inner}>
   <a href="/market" style={s.logo}><span style={s.logoMark}>N</span><span>ANGEL PAY<span style={s.logoSub}>N PAY · 엔페이</span></span></a>
   <nav style={s.nav}>
    {nav('/market','자유시장',p?.startsWith('/market')||p?.startsWith('/seller'))}
    {nav('/free','자유게시판',p?.startsWith('/free'))}
    {nav('/jobs','구인구직',p?.startsWith('/jobs'))}
    {nav('/blacklist','블랙리스트',p?.startsWith('/blacklist'))}
    {nav('/wallet','자금',p?.startsWith('/wallet'))}
    {nav('/referral','추천인',p?.startsWith('/referral'))}
    {nav('/','텔발',p==='/')}
    {nav('/?guide=1','사용방법',false)}
   </nav>
   <div style={s.account}>
    {session&&<div style={s.wrap}>
      <button style={s.point} onClick={()=>setOpen(open==='wallet'?'':'wallet')}><span style={{fontSize:9,color:'#b7d8ff',fontWeight:900}}>N POINT</span><b style={{fontSize:12}}>{fmt(wallet?.available_balance)}</b><span>⌄</span></button>
      {open==='wallet'&&<div style={s.drop}><div style={{padding:'6px 8px 10px',fontSize:11,fontWeight:900}}>엔페이 포인트</div><div style={s.row}><span style={{color:'#8da7c5'}}>사용 가능</span><b>{fmt(wallet?.available_balance)}</b></div><div style={s.row}><span style={{color:'#8da7c5'}}>에스크로</span><b>{fmt(wallet?.escrow_balance)}</b></div><div style={s.row}><span style={{color:'#8da7c5'}}>판매 정산</span><b>{fmt(wallet?.settlement_balance)}</b></div><div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,marginTop:8}}><a href="/wallet?tab=charge" style={{...s.link,textAlign:'center',background:'#17304f'}}>충전</a><a href="/wallet?tab=withdraw" style={{...s.link,textAlign:'center',background:'#17304f'}}>출금</a><a href="/wallet?tab=history" style={{...s.link,textAlign:'center',background:'#17304f'}}>내역</a></div></div>}
    </div>}
    {session?<div style={s.wrap}><button style={s.profile} onClick={()=>setOpen(open==='profile'?'':'profile')}><span style={s.avatar}>{initial}</span><span>⌄</span></button>{open==='profile'&&<div style={{...s.drop,minWidth:220}}><div style={{padding:'8px 9px 10px',fontSize:10,color:'#8ca3bd',borderBottom:'1px solid #294867',overflow:'hidden',textOverflow:'ellipsis'}}>{email}</div><a href="/market?view=trades" style={s.link}>내 거래</a><a href="/seller" style={s.link}>판매자센터</a><a href="/wallet" style={s.link}>자금 관리</a><button onClick={()=>supabase.auth.signOut()} style={{width:'100%',border:0,background:'transparent',color:'#ff8f9d',textAlign:'left',padding:'10px 9px',fontSize:11,cursor:'pointer'}}>로그아웃</button></div>}</div>:<a href="/" style={{...s.link,border:'1px solid #4d77aa',background:'#ffffff12',color:'#fff'}}>로그인</a>}
   </div>
 </div></header>;
}
