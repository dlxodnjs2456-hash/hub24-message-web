'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../../lib/supabase';
import {api} from '../../../lib/api';
export default function AdminLogs(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[items,setItems]=useState([]);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
 async function load(){try{const r=await api.adminLogs();setItems(r.items||[])}catch(e){alert(e.message)}}
 useEffect(()=>{if(session?.user?.app_metadata?.role==='admin')load()},[session]);
 if(!ready)return <div className="authPage"><div className="authCard">권한 확인 중...</div></div>;
 if(session?.user?.app_metadata?.role!=='admin')return <div className="authPage"><div className="authCard">관리자 권한이 없습니다.</div></div>;
 return <main className="content" style={{maxWidth:1500,margin:'0 auto'}}><div className="head"><div><h1>관리자 활동 로그</h1><p>재무·거래·판매자·광고 주요 변경사항을 추적합니다.</p></div><button className="btn" onClick={load}>새로고침</button></div><section className="card"><div className="table"><table><thead><tr><th>시간</th><th>작업</th><th>대상</th><th>대상 ID</th><th>관리자</th><th>상세</th></tr></thead><tbody>{items.length?items.map(x=><tr key={x.id}><td>{x.created_at?.replace('T',' ').slice(0,19)}</td><td>{x.action}</td><td>{x.target_type||'-'}</td><td>{x.target_id||'-'}</td><td>{x.admin_user_id?String(x.admin_user_id).slice(0,8)+'...':'SYSTEM'}</td><td><code style={{whiteSpace:'pre-wrap',fontSize:9}}>{JSON.stringify(x.detail||{})}</code></td></tr>):<tr><td colSpan="6" className="empty">로그가 없습니다.</td></tr>}</tbody></table></div></section></main>;
}
