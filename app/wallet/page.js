'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {api} from '../../lib/api';

const fmt=n=>Number(n||0).toLocaleString('ko-KR')+' P';

export default function WalletPage(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[data,setData]=useState(null),[charges,setCharges]=useState([]),[withdrawals,setWithdrawals]=useState([]),[tab,setTab]=useState('overview');
 const [amount,setAmount]=useState(''),[note,setNote]=useState(''),[withdrawAmount,setWithdrawAmount]=useState('');
 useEffect(()=>{
   supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)});
   if(typeof window!=='undefined'){
     const t=new URLSearchParams(window.location.search).get('tab');
     setTab(['charge','withdraw','history'].includes(t)?t:'overview');
   }
 },[]);
 async function load(){try{const [w,c,x]=await Promise.all([api.wallet(),api.chargeRequests(),api.withdrawals()]);setData(w);setCharges(c.items||[]);setWithdrawals(x.items||[])}catch(e){alert(e.message)}}
 useEffect(()=>{if(session)load()},[session]);
 if(!ready)return <div className="authPage"><div className="authCard">자금 정보를 불러오는 중...</div></div>;
 if(!session)return <div className="authPage"><div className="authCard"><h1>HUB24 <span>FUNDS</span></h1><p>먼저 로그인하세요.</p><a className="btn primary" href="/">로그인 화면</a></div></div>;
 const w=data?.wallet||{};
 async function charge(){if(Number(amount)<=0)return alert('충전 금액을 입력하세요.');try{await api.requestCharge({amount:Number(amount),note:note||null});setAmount('');setNote('');await load();alert('충전 신청이 접수되었습니다. 관리자 승인 후 반영됩니다.')}catch(e){alert(e.message)}}
 async function withdraw(){if(Number(withdrawAmount)<=0)return alert('출금 금액을 입력하세요.');try{await api.requestWithdrawal(Number(withdrawAmount));setWithdrawAmount('');await load();alert('출금 신청이 접수되었습니다.')}catch(e){alert(e.message)}}
 return <main className="fundsPage">
   <section className="fundsHero"><div><span className="eyebrow">HUB24 FUNDS</span><h1>자금 관리</h1><p>충전, 에스크로, 판매대금, 출금을 한곳에서 관리합니다.</p></div><button className="softButton" onClick={load}>새로고침</button></section>
   <section className="balancePanel"><div><span>사용 가능</span><strong>{fmt(w.available_balance)}</strong></div><div><span>에스크로 보관</span><strong>{fmt(w.escrow_balance)}</strong></div><div><span>판매 정산</span><strong>{fmt(w.settlement_balance)}</strong></div><div><span>총 보유</span><strong>{fmt(Number(w.available_balance||0)+Number(w.escrow_balance||0)+Number(w.settlement_balance||0))}</strong></div></section>
   <div className="fundTabs"><button className={tab==='overview'?'active':''} onClick={()=>setTab('overview')}>요약</button><button className={tab==='charge'?'active':''} onClick={()=>setTab('charge')}>충전</button><button className={tab==='withdraw'?'active':''} onClick={()=>setTab('withdraw')}>출금</button><button className={tab==='history'?'active':''} onClick={()=>setTab('history')}>포인트 내역</button></div>
   {tab==='overview'&&<section className="fundOverviewGrid"><button onClick={()=>setTab('charge')}><span>포인트 충전</span><b>충전 신청하기</b><small>승인 후 사용 가능 포인트에 반영됩니다.</small></button><button onClick={()=>setTab('withdraw')}><span>판매대금 출금</span><b>{fmt(w.settlement_balance)}</b><small>출금 가능 판매대금을 확인하세요.</small></button><button onClick={()=>setTab('history')}><span>거래 원장</span><b>{(data?.ledger||[]).length}건</b><small>모든 포인트 변동 기록을 확인합니다.</small></button><a href="/market?view=trades"><span>에스크로 거래</span><b>{fmt(w.escrow_balance)}</b><small>진행 중인 거래 상태를 확인합니다.</small></a></section>}
   {tab==='charge'&&<section className="fundActionCard"><div className="sectionTitle"><h2>포인트 충전</h2><p>현재는 충전 신청 후 관리자 승인을 통해 포인트가 반영됩니다.</p></div><div className="fundForm"><label><span>충전 금액</span><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="10000"/></label><label><span>메모</span><input value={note} onChange={e=>setNote(e.target.value)} placeholder="선택 입력"/></label><button onClick={charge}>충전 신청</button></div><div className="simpleHistory"><h3>최근 충전 신청</h3>{charges.length?charges.slice(0,10).map(x=><div key={x.id}><b>{fmt(x.amount)}</b><span>{x.status}</span><small>{x.created_at?.replace('T',' ').slice(0,19)}</small></div>):<p>신청 내역이 없습니다.</p>}</div></section>}
   {tab==='withdraw'&&<section className="fundActionCard"><div className="sectionTitle"><h2>판매대금 출금</h2><p>출금 수수료와 최소 출금액은 운영자 설정에 따라 자동 계산됩니다.</p></div><div className="withdrawAvailable"><span>현재 출금 가능</span><strong>{fmt(w.settlement_balance)}</strong></div><div className="fundForm one"><label><span>출금 신청 금액</span><input type="number" value={withdrawAmount} onChange={e=>setWithdrawAmount(e.target.value)} placeholder="10000"/></label><button onClick={withdraw}>출금 신청</button></div><div className="simpleHistory"><h3>최근 출금 신청</h3>{withdrawals.length?withdrawals.slice(0,10).map(x=><div key={x.id}><b>{fmt(x.requested_amount)}</b><span>{x.status}</span><small>실지급 {fmt(x.payout_amount)} · 수수료 {fmt(x.fee_amount)}</small></div>):<p>출금 내역이 없습니다.</p>}</div></section>}
   {tab==='history'&&<section className="ledgerCard"><div className="sectionTitle"><h2>포인트 내역</h2><p>충전, 에스크로, 판매대금, 환불, 출금 등 모든 변동 기록입니다.</p></div><div className="table"><table><thead><tr><th>일시</th><th>구분</th><th>변동</th><th>이전</th><th>이후</th><th>내용</th></tr></thead><tbody>{(data?.ledger||[]).length?(data.ledger||[]).map(x=><tr key={x.id}><td>{x.created_at?.replace('T',' ').slice(0,19)}</td><td>{x.entry_type}</td><td>{Number(x.amount).toLocaleString()}P</td><td>{fmt(x.balance_before)}</td><td>{fmt(x.balance_after)}</td><td>{x.memo||'-'}</td></tr>):<tr><td colSpan="6" className="empty">포인트 내역이 없습니다.</td></tr>}</tbody></table></div></section>}
 </main>
}
