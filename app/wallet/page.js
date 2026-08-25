'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {api} from '../../lib/api';

export default function WalletPage(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[data,setData]=useState(null),[charges,setCharges]=useState([]),[withdrawals,setWithdrawals]=useState([]),[amount,setAmount]=useState(''),[note,setNote]=useState(''),[withdrawAmount,setWithdrawAmount]=useState('');
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
 async function load(){try{const [w,c,x]=await Promise.all([api.wallet(),api.chargeRequests(),api.withdrawals()]);setData(w);setCharges(c.items||[]);setWithdrawals(x.items||[])}catch(e){alert(e.message)}}
 useEffect(()=>{if(session)load()},[session]);
 if(!ready)return <div className="authPage"><div className="authCard">포인트 정보를 불러오는 중...</div></div>;
 if(!session)return <div className="authPage"><div className="authCard"><h1>HUB24 <span>POINT</span></h1><p>먼저 로그인하세요.</p><a className="btn primary" href="/">로그인 화면</a></div></div>;
 const w=data?.wallet||{};
 const fmt=n=>Number(n||0).toLocaleString('ko-KR')+' P';
 async function charge(){if(Number(amount)<=0)return alert('충전 금액을 입력하세요.');try{await api.requestCharge({amount:Number(amount),note:note||null});setAmount('');setNote('');await load();alert('충전 신청이 접수되었습니다. 관리자 승인 후 반영됩니다.')}catch(e){alert(e.message)}}
 async function withdraw(){if(Number(withdrawAmount)<=0)return alert('출금 금액을 입력하세요.');try{await api.requestWithdrawal(Number(withdrawAmount));setWithdrawAmount('');await load();alert('출금 신청이 접수되었습니다.')}catch(e){alert(e.message)}}
 return <main className="content" style={{maxWidth:1350,margin:'0 auto'}}>
   <div className="head"><div><h1>포인트</h1><p>충전 · 에스크로 · 판매대금 · 출금</p></div><button className="btn" onClick={load}>새로고침</button></div>
   <div className="stats">
    {[['사용 가능',fmt(w.available_balance)],['에스크로 보관',fmt(w.escrow_balance)],['판매대금',fmt(w.settlement_balance)],['총 보유',fmt(Number(w.available_balance||0)+Number(w.escrow_balance||0)+Number(w.settlement_balance||0))]].map(([a,b])=><div className="stat" key={a}><small>{a}</small><strong style={{fontSize:20}}>{b}</strong></div>)}
   </div>
   <div className="two">
    <section className="card"><h2>포인트 충전</h2><div className="form"><label className="field"><span>충전 금액</span><input className="input" type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="10000"/></label><label className="field"><span>메모</span><input className="input" value={note} onChange={e=>setNote(e.target.value)} placeholder="선택 입력"/></label></div><div className="actions"><button className="btn primary" onClick={charge}>충전 신청</button></div><div className="note">현재 충전은 관리자 승인 방식입니다. 승인 시 포인트 원장에 자동 기록됩니다.</div></section>
    <section className="card"><h2>판매대금 출금</h2><label className="field"><span>출금 신청 금액</span><input className="input" type="number" value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} placeholder="10000"/></label><div className="actions"><button className="btn primary" onClick={withdraw}>출금 신청</button></div><div className="note">출금 수수료와 최소 출금액은 운영 설정값으로 자동 계산됩니다.</div></section>
   </div>
   <section className="card" style={{marginTop:14}}><h2>포인트 원장</h2><div className="table"><table><thead><tr><th>일시</th><th>구분</th><th>변동</th><th>이전</th><th>이후</th><th>내용</th></tr></thead><tbody>{(data?.ledger||[]).length?(data.ledger||[]).map(x=><tr key={x.id}><td>{x.created_at?.replace('T',' ').slice(0,19)}</td><td>{x.entry_type}</td><td>{Number(x.amount).toLocaleString()}P</td><td>{fmt(x.balance_before)}</td><td>{fmt(x.balance_after)}</td><td>{x.memo||'-'}</td></tr>):<tr><td colSpan="6" className="empty">포인트 내역이 없습니다.</td></tr>}</tbody></table></div></section>
   <div className="two" style={{marginTop:14}}><section className="card"><h2>충전 신청 내역</h2>{charges.length?charges.map(x=><div className="marketLine" key={x.id}><b>{fmt(x.amount)}</b><span>{x.status}</span><small>{x.created_at?.replace('T',' ').slice(0,19)}</small></div>):<div className="empty">신청 내역이 없습니다.</div>}</section><section className="card"><h2>출금 신청 내역</h2>{withdrawals.length?withdrawals.map(x=><div className="marketLine" key={x.id}><b>{fmt(x.requested_amount)}</b><span>{x.status} · 수수료 {fmt(x.fee_amount)}</span><small>실지급 {fmt(x.payout_amount)}</small></div>):<div className="empty">출금 내역이 없습니다.</div>}</section></div>
 </main>
}
