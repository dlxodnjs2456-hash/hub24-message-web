'use client';
import {useEffect,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';
import {BASE} from '../lib/api';

const normalize=v=>String(v||'').trim().toLowerCase();
const emailFor=id=>id.includes('@')?id:`${id}@users.npay.local`;

export default function UsernameAuthOverlay(){
 const path=usePathname();const [ready,setReady]=useState(false),[session,setSession]=useState(null),[mode,setMode]=useState('login'),[id,setId]=useState(''),[pw,setPw]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)});const {data:{subscription}}=supabase.auth.onAuthStateChange((_e,s)=>{setSession(s||null);setReady(true)});return()=>subscription.unsubscribe()},[]);
 if(path!=='/'||!ready||session)return null;
 async function submit(){const u=normalize(id);if(!u||!pw)return alert('아이디와 비밀번호를 입력하세요.');setBusy(true);try{if(mode==='signup'){
   if(u.includes('@'))throw new Error('신규 가입은 이메일이 아닌 아이디만 입력하세요.');
   const r=await fetch(`${BASE}/v1/auth/username-signup`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:pw})});let b={};try{b=await r.json()}catch{};if(!r.ok)throw new Error(b.detail||`HTTP ${r.status}`);
   const {error}=await supabase.auth.signInWithPassword({email:emailFor(u),password:pw});if(error)throw error;
 }else{const {error}=await supabase.auth.signInWithPassword({email:emailFor(u),password:pw});if(error)throw new Error('아이디 또는 비밀번호를 확인하세요.');}}catch(e){alert(e.message)}finally{setBusy(false)}}
 return <div style={{position:'fixed',inset:0,zIndex:10000,background:'#0b1017',display:'grid',placeItems:'center',padding:20}}><div className="authCard" style={{width:'min(430px,100%)'}}><h1>ANGEL PAY <span>N PAY</span></h1><p>아이디로 간편하게 로그인하세요.</p><div className="authTabs"><button className={mode==='login'?'active':''} onClick={()=>setMode('login')}>로그인</button><button className={mode==='signup'?'active':''} onClick={()=>setMode('signup')}>회원가입</button></div><label className="field"><span>아이디</span><input className="input" autoComplete="username" value={id} onChange={e=>setId(e.target.value)} placeholder={mode==='signup'?'영문 소문자·숫자·_ 4~20자':'아이디'} /></label><label className="field"><span>비밀번호</span><input className="input" type="password" autoComplete={mode==='signup'?'new-password':'current-password'} value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==='Enter'&&submit()} placeholder="6자 이상"/></label><button className="btn primary authSubmit" disabled={busy} onClick={submit}>{busy?'처리 중...':mode==='login'?'로그인':'가입하기'}</button><div className="note">신규 가입은 이메일 인증 없이 아이디와 비밀번호만 사용합니다. 기존 이메일 계정은 로그인 칸에 기존 이메일을 입력해 계속 사용할 수 있습니다.</div></div></div>;
}
