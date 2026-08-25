'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {api} from '../../lib/api';

const fmt=n=>Number(n||0).toLocaleString('ko-KR')+' P';

export default function ReferralPage(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[me,setMe]=useState(null),[board,setBoard]=useState({month:'',items:[],king:null}),[busy,setBusy]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
 async function load(){try{const [m,b]=await Promise.all([api.referralMe(),api.referralLeaderboard()]);setMe(m);setBoard(b)}catch(e){alert(e.message)}}
 useEffect(()=>{if(session)load()},[session]);
 async function issue(){setBusy(true);try{const r=await api.issueReferralCode();await load();alert(`추천코드가 발급되었습니다.\n${r.code}`)}catch(e){alert(e.message)}finally{setBusy(false)}}
 async function copy(){if(!me?.code)return;try{await navigator.clipboard.writeText(me.code);alert('추천코드를 복사했습니다.')}catch{alert(me.code)}}
 if(!ready)return <div className="authPage"><div className="authCard">추천인 정보를 불러오는 중...</div></div>;
 if(!session)return <div className="authPage"><div className="authCard"><h1>ANGEL PAY</h1><p>먼저 로그인하세요.</p><a className="btn primary" href="/">로그인 화면</a></div></div>;
 return <main className="content" style={{maxWidth:1250,margin:'0 auto',paddingTop:34}}>
   <div className="head"><div><span className="eyebrow">N PAY REFERRAL</span><h1 style={{margin:'7px 0 5px'}}>추천인</h1><p>추천 회원의 충전 승인 및 출금 지급완료 금액의 1%가 자동으로 포인트 지급됩니다.</p></div><button className="btn" onClick={load}>새로고침</button></div>
   <section className="card" style={{marginTop:18}}><div className="head"><div><h2>내 추천코드</h2><p>신규 회원은 유효한 추천코드가 있어야 가입할 수 있습니다.</p></div>{me?.code?<button className="btn primary" onClick={copy}>코드 복사</button>:<button className="btn primary" disabled={busy} onClick={issue}>{busy?'발급 중...':'추천코드 발급'}</button>}</div>{me?.code?<div style={{fontSize:28,fontWeight:950,letterSpacing:2,padding:'20px 0'}}>{me.code}</div>:<div className="note">아직 발급된 추천코드가 없습니다.</div>}</section>
   <div className="stats" style={{marginTop:14}}>{[['이번달 추천',me?.monthly_referrals||0+'명'],['누적 추천',me?.total_referrals||0+'명'],['이번달 보상',fmt(me?.monthly_reward)],['누적 보상',fmt(me?.total_reward)]].map(([l,v])=><div className="stat" key={l}><small>{l}</small><strong>{typeof v==='number'?v.toLocaleString():v}</strong></div>)}</div>
   <section className="card" style={{marginTop:14}}><div className="head"><div><h2>{board.month} 추천왕</h2><p>매월 1일 새 달 집계가 자동으로 시작됩니다. 이전 달 기록은 삭제되지 않습니다.</p></div>{board.king&&<span className="badge ok">현재 1위 · {board.king.name}</span>}</div><div className="table"><table><thead><tr><th>순위</th><th>회원</th><th>추천 가입</th><th>이번달 추천보상</th></tr></thead><tbody>{board.items?.length?board.items.map(r=><tr key={r.user_id} style={r.is_me?{fontWeight:900}:null}><td>{r.rank===1?'👑 1':r.rank}</td><td>{r.name}{r.is_me?' (나)':''}</td><td>{Number(r.referral_count||0).toLocaleString()}명</td><td>{fmt(r.reward_amount)}</td></tr>):<tr><td colSpan="4" className="empty">이번달 추천 실적이 없습니다.</td></tr>}</tbody></table></div></section>
   <section className="card" style={{marginTop:14}}><h2>추천 보상 기준</h2><div className="note">추천 회원의 충전이 관리자 승인되면 승인 금액의 1%, 출금이 지급완료 처리되면 출금 신청 금액의 1%가 추천인에게 자동 지급됩니다. 같은 충전·출금 건은 한 번만 보상됩니다.</div></section>
 </main>;
}
