'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../../lib/supabase';
import {noticeApi} from '../../../lib/notice-api';

export default function AdminNoticesPage(){
  const [ready,setReady]=useState(false),[session,setSession]=useState(null),[items,setItems]=useState([]),[form,setForm]=useState({title:'',content:'',sort_order:0,is_active:true}),[editing,setEditing]=useState(null),[busy,setBusy]=useState(false);
  useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
  const isAdmin=session?.user?.app_metadata?.role==='admin';
  async function load(){try{const r=await noticeApi.adminList();setItems(r.items||[])}catch(e){alert(e.message)}}
  useEffect(()=>{if(isAdmin)load()},[isAdmin]);
  async function save(){if(!form.title.trim()||!form.content.trim())return alert('제목과 내용을 입력하세요.');setBusy(true);try{if(editing)await noticeApi.update(editing,form);else await noticeApi.create(form);setForm({title:'',content:'',sort_order:0,is_active:true});setEditing(null);await load();alert(editing?'공지를 수정했습니다.':'공지를 등록했습니다.')}catch(e){alert(e.message)}finally{setBusy(false)}}
  function edit(n){setEditing(n.id);setForm({title:n.title||'',content:n.content||'',sort_order:Number(n.sort_order||0),is_active:n.is_active!==false});window.scrollTo({top:0,behavior:'smooth'})}
  async function toggle(n){try{await noticeApi.update(n.id,{is_active:!n.is_active});await load()}catch(e){alert(e.message)}}
  async function remove(n){if(!confirm('이 공지를 삭제할까요?'))return;try{await noticeApi.remove(n.id);if(editing===n.id){setEditing(null);setForm({title:'',content:'',sort_order:0,is_active:true})}await load()}catch(e){alert(e.message)}}
  if(!ready)return <div className="authPage"><div className="authCard">권한 확인 중...</div></div>;
  if(!session||!isAdmin)return <div className="authPage"><div className="authCard"><h1>ANGEL PAY ADMIN</h1><p>관리자 권한이 없습니다.</p><a className="btn" href="/">사용자 화면</a></div></div>;
  return <main className="content" style={{maxWidth:1200,margin:'0 auto'}}>
    <div className="head"><div><h1>공지사항 관리</h1><p>활성 공지는 자유시장 · 자유게시판 · 구인구직 · 블랙리스트 최상단에 공통 노출됩니다.</p></div><div className="actions compact"><a className="btn" href="/admin">관리자 홈</a><button className="btn" onClick={load}>새로고침</button></div></div>
    <section className="card"><h2>{editing?'공지 수정':'새 공지 작성'}</h2><div className="form" style={{marginTop:12}}><label className="field full"><span>제목</span><input className="input" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} maxLength={160}/></label><label className="field full"><span>내용</span><textarea className="textarea" style={{minHeight:180}} value={form.content} onChange={e=>setForm({...form,content:e.target.value})}/></label><label className="field"><span>노출 우선순위</span><input className="input" type="number" value={form.sort_order} onChange={e=>setForm({...form,sort_order:Number(e.target.value||0)})}/></label><label className="check" style={{marginTop:28}}><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})}/> 즉시 노출</label></div><div className="actions"><button className="btn primary" disabled={busy} onClick={save}>{busy?'저장 중...':editing?'수정 저장':'공지 등록'}</button>{editing&&<button className="btn" onClick={()=>{setEditing(null);setForm({title:'',content:'',sort_order:0,is_active:true})}}>취소</button>}</div></section>
    <section className="card" style={{marginTop:14}}><h2>등록 공지</h2><div className="table" style={{marginTop:12}}><table><thead><tr><th>ID</th><th>제목</th><th>우선순위</th><th>상태</th><th>등록일</th><th>관리</th></tr></thead><tbody>{items.length?items.map(n=><tr key={n.id}><td>#{n.id}</td><td><b>{n.title}</b><small style={{display:'block',color:'#879db4',marginTop:4,maxWidth:560,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{n.content}</small></td><td>{n.sort_order||0}</td><td>{n.is_active?'노출중':'숨김'}</td><td>{String(n.created_at||'').replace('T',' ').slice(0,16)}</td><td className="nowrap"><button className="btn" onClick={()=>edit(n)}>수정</button> <button className="btn" onClick={()=>toggle(n)}>{n.is_active?'숨기기':'노출'}</button> <button className="btn danger" onClick={()=>remove(n)}>삭제</button></td></tr>):<tr><td colSpan="6" className="empty">등록된 공지가 없습니다.</td></tr>}</tbody></table></div></section>
  </main>;
}
