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
 const nav=(href,label,active)=><a href={href} className={'mainNavItem '+(active?'active':'')}>{label}</a>;
 const email=session?.user?.email||'';const initial=(email[0]||'U').toUpperCase();
 return <header className="hubHeader" ref={wrap}>
   <div className="hubHeaderInner">
    <a href="/market" className="hubLogo">HUB24</a>
    <nav className="mainNav">
      {nav('/market','구매',p?.startsWith('/market')||p?.startsWith('/seller'))}
      {nav('/','메시지',p==='/')}
      {nav('/wallet','자금',p?.startsWith('/wallet'))}
      {nav('/?guide=1','사용방법',false)}
    </nav>
    <div className="headerAccount">
      {session&&<div className="headerDropWrap">
        <button className="pointSummary" onClick={()=>setOpen(open==='wallet'?'':'wallet')}><span>POINT</span><b>{fmt(wallet?.available_balance)}</b><i>⌄</i></button>
        {open==='wallet'&&<div className="headerDropdown walletDrop">
          <div className="dropTitle">내 포인트</div>
          <div className="balanceRows">
            <div><span>사용 가능</span><b>{fmt(wallet?.available_balance)}</b></div>
            <div><span>에스크로</span><b>{fmt(wallet?.escrow_balance)}</b></div>
            <div><span>판매 정산</span><b>{fmt(wallet?.settlement_balance)}</b></div>
          </div>
          <div className="dropQuick"><a href="/wallet?tab=charge">충전</a><a href="/wallet?tab=withdraw">출금</a><a href="/wallet?tab=history">내역</a></div>
        </div>}
      </div>}
      {session?<div className="headerDropWrap">
        <button className="profileButton" onClick={()=>setOpen(open==='profile'?'':'profile')}><span>{initial}</span><i>⌄</i></button>
        {open==='profile'&&<div className="headerDropdown profileDrop">
          <div className="profileMail">{email}</div>
          <a href="/market?view=trades">내 거래</a>
          <a href="/seller">판매자센터</a>
          <a href="/wallet">자금 관리</a>
          <button onClick={()=>supabase.auth.signOut()}>로그아웃</button>
        </div>}
      </div>:<a className="headerLogin" href="/">로그인</a>}
    </div>
   </div>
 </header>
}
