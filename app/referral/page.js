'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {api} from '../../lib/api';
const fmt=n=>Number(n||0).toLocaleString('ko-KR')+' P';
export default function ReferralPage(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[me,setMe]=useState(null),[board,setBoard]=useState({month:'',items:[],king:null}),[busy,setBusy]=useState(false),[customCode,setCustomCode]=useState('');
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
 async function load(){try{const [m,b]=await Promise.all([api.referralMe(),api.referralLeaderboard()]);setMe(m);setBoard(b)}catch(e){alert(e.message)}}
 useEffect(()=>{if(session)load()},[session]);
 async function issue(){
   const code=customCode.trim().toUpperCase();
   if(!/^[A-Z0-9]{4,10}$/.test(code))return alert('추천코드는 영문/숫자 4~10자로 입력하세요.');
   setBusy(true);try{const r=await api.issueReferralCode(code);await load();setCustomCode('');alert(`추천코드가 생성되었습니다.\n${r.code}`)}catch(e){const m=String(e.message||'');if(m.includes('ALREADY_USED'))alert('이미 사용 중인 추천코드입니다. 다른 코드를 입력하세요.');else alert(m)}finally{setBusy(false)}
 }
 async function copy(){if(!me?.code)return;try{await navigator.clipboard.writeText(me.code);alert('추천코드를 복사했습니다.')}catch{alert(me.code)}}
 if(!ready)return <div className="authPage"><div className="authCard">추천인 정보를 불러오는 중...</div></div>;
 if(!session)return <div className="authPage"><div className="authCard"><h1>ANGEL PAY</h1><p>먼저 로그인하세요.</p><a className="btn primary" href="/">로그인 화면</a></div></div>;
 const stats=[['이번달 유효추천',`${Number(me?.monthly_referrals||0).toLocaleString()}명`],['누적 가입추천',`${Number(me?.total_referrals||0).toLocaleString()}명`],['유효 추천',`${Number(me?.valid_referrals||0).toLocaleString()}명`],['누적 보상',fmt(me?.total_reward)]];
 return <main className="content" style={{maxWidth:1250,margin:'0 auto',paddingTop:34}}><div className="head"><div><span className="eyebrow">N PAY REFERRAL</span><h1 style={{margin:'7px 0 5px'}}>추천인</h1><p>추천 회원의 관리자 승인 입금 금액을 기준으로 2% 추천 보상이 지급됩니다.</p></div><button className="btn" onClick={load}>새로고침</button></div>
 <section className="card" style={{marginTop:18}}><div className="head"><div><h2>내 추천코드</h2><p>원하는 코드를 직접 만들어 사용할 수 있습니다. 최초 생성 후에는 변경할 수 없습니다.</p></div>{me?.code&&<button className="btn primary" onClick={copy}>코드 복사</button>}</div>{me?.code?<div style={{fontSize:28,fontWeight:950,letterSpacing:2,padding:'20px 0'}}>{me.code}</div>:<div style={{display:'flex',gap:8,alignItems:'end',maxWidth:520,marginTop:16}}><label className="field" style={{flex:1}}><span>추천코드 만들기</span><input className="input" value={customCode} maxLength={10} onChange={e=>setCustomCode(e.target.value.replace(/[^a-zA-Z0-9]/g,'').toUpperCase())} onKeyDown={e=>e.key==='Enter'&&issue()} placeholder="예: ANGEL7"/></label><button className="btn primary" disabled={busy} onClick={issue}>{busy?'생성 중...':'추천코드 생성'}</button></div>} {!me?.code&&<div className="note" style={{marginTop:10}}>영문/숫자 4~10자 · 소문자는 자동으로 대문자 변환 · 이미 사용 중인 코드는 생성할 수 없습니다.</div>}</section>
 <div className="stats" style={{marginTop:14}}>{stats.map(([l,v])=><div className="stat" key={l}><small>{l}</small><strong>{v}</strong></div>)}</div>
 <section className="card" style={{marginTop:14}}><div className="head"><div><h2>{board.month} 추천왕</h2><p>첫 승인 입금 기준을 충족한 유효 추천회원만 집계합니다. 매월 1일 새 집계가 자동 시작됩니다.</p></div>{board.king&&<span className="badge ok">현재 1위 · {board.king.name}</span>}</div><div className="table"><table><thead><tr><th>순위</th><th>회원</th><th>유효 추천</th><th>이번달 추천보상</th></tr></thead><tbody>{board.items?.length?board.items.map(r=><tr key={r.user_id} style={r.is_me?{fontWeight:900}:null}><td>{r.rank===1?'👑 1':r.rank}</td><td>{r.name}{r.is_me?' (나)':''}</td><td>{Number(r.referral_count||0).toLocaleString()}명</td><td>{fmt(r.reward_amount)}</td></tr>):<tr><td colSpan="4" className="empty">이번달 유효 추천 실적이 없습니다.</td></tr>}</tbody></table></div></section>
 <section className="card" style={{marginTop:14}}><h2>추천 보상 기준</h2><div className="note">유효 추천 인정 기준: 첫 승인 입금 {fmt(me?.qualification_charge||10000)} 이상. 추천 회원의 승인 입금 금액의 {Number(me?.reward_rate_percent||2)}%만 추천인에게 지급되며 출금에는 추천 보상이 없습니다. 동일 입금 건은 중복 지급되지 않고, 추천회원 1명당 월 보상 상한은 {fmt(me?.monthly_reward_cap_per_referred||100000)}입니다.</div></section></main>;
}
