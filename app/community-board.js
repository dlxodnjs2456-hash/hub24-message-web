'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
import {api} from '../lib/api';
import PaidBannerGrid from './paid-banner-grid';

const INFO={
 FREE:{label:'자유게시판',eyebrow:'N PAY FREE BOARD',desc:'엔페이 사용자들이 자유롭게 이야기를 나누는 공간입니다.',cooldown:'글 작성 1시간 간격'},
 JOBS:{label:'구인구직',eyebrow:'N PAY JOB BOARD',desc:'구인·구직 정보를 공유하는 공간입니다.',cooldown:'글 작성 24시간 간격'},
 BLACKLIST:{label:'블랙리스트',eyebrow:'N PAY BLACKLIST',desc:'운영자가 확인한 주의 대상과 안내를 공유합니다.',cooldown:'관리자만 글 작성'},
};
const date=v=>v?String(v).replace('T',' ').slice(0,16):'-';

export default function CommunityBoard({type}){
 const board=String(type||'FREE').toUpperCase();const meta=INFO[board]||INFO.FREE;
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[posts,setPosts]=useState([]),[selected,setSelected]=useState(null),[comments,setComments]=useState([]),[permissions,setPermissions]=useState({board_admin:false});
 const [writeOpen,setWriteOpen]=useState(false),[title,setTitle]=useState(''),[content,setContent]=useState(''),[comment,setComment]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
 useEffect(()=>{if(session)load()},[session,board]);
 async function load(){try{const [p,perm]=await Promise.all([api.communityPosts(board),api.communityPermissions()]);setPosts(p.items||[]);setPermissions(perm||{});setSelected(null);setComments([])}catch(e){alert(e.message)}}
 async function loadPostsOnly(){try{const p=await api.communityPosts(board);setPosts(p.items||[])}catch{}}
 async function openPost(p){try{const r=await api.communityPost(p.id);setSelected(r.item);setComments(r.comments||[])}catch(e){alert(e.message)}}
 function friendly(e){const m=e?.message||String(e);if(m.startsWith('POST_COOLDOWN:')){const mins=Number(m.split(':')[1]||1);return `아직 새 글을 작성할 수 없습니다. 약 ${mins}분 후 다시 작성할 수 있습니다.`}if(m==='BOARD_ADMIN_ONLY')return '블랙리스트 게시판은 관리자만 글을 작성할 수 있습니다.';return m}
 async function submitPost(){if(!title.trim()||!content.trim())return alert('제목과 내용을 입력하세요.');setBusy(true);try{await api.createCommunityPost({board_type:board,title:title.trim(),content:content.trim()});setTitle('');setContent('');setWriteOpen(false);await load();alert('글이 등록되었습니다.')}catch(e){alert(friendly(e))}finally{setBusy(false)}}
 async function submitComment(){if(!selected||!comment.trim())return;setBusy(true);try{await api.addCommunityComment(selected.id,comment.trim());setComment('');await openPost(selected);await loadPostsOnly()}catch(e){alert(e.message)}finally{setBusy(false)}}
 const canWrite=board!=='BLACKLIST'||permissions.board_admin;
 if(!ready)return <div className="authPage"><div className="authCard">게시판을 불러오는 중...</div></div>;
 if(!session)return <div className="authPage"><div className="authCard"><h1>ANGEL PAY</h1><p>먼저 로그인하세요.</p><a className="btn primary" href="/">로그인 화면</a></div></div>;
 return <main className="communityPage standaloneBoard">
   <section className="communityHero"><div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.label}</h1><p>{meta.desc}</p></div>{canWrite?<button className="boardHeroWrite" onClick={()=>setWriteOpen(true)}>글쓰기</button>:<span className="adminOnlyBadge">관리자 작성 전용</span>}</section>
   <PaidBannerGrid/>
   <section className="boardHeader"><div><h2>{meta.label}</h2><p>{meta.cooldown} · 댓글 자유</p></div></section>
   <section className="boardWorkspace">
    <div className="postList">{posts.length?posts.map(p=><button key={p.id} className={selected?.id===p.id?'active':''} onClick={()=>openPost(p)}><div><b>{p.title}</b><span>{p.author_name||'회원'} · {date(p.created_at)}</span></div><div><span>댓글 {p.comment_count||0}</span><span>조회 {p.view_count||0}</span></div></button>):<div className="boardEmpty">등록된 글이 없습니다.</div>}</div>
    <div className="postDetail">{selected?<><div className="postTitle"><h2>{selected.title}</h2><div>{selected.author_name||'회원'} · {date(selected.created_at)} · 조회 {selected.view_count||0}</div></div><div className="postBody">{selected.content}</div><div className="commentSection"><h3>댓글 {comments.length}</h3><div className="commentList">{comments.length?comments.map(c=><div className="commentItem" key={c.id}><div><b>{c.author_name||'회원'}</b><span>{date(c.created_at)}</span></div><p>{c.content}</p></div>):<div className="commentEmpty">첫 댓글을 남겨보세요.</div>}</div><div className="commentComposer"><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="댓글을 입력하세요."/><button disabled={busy} onClick={submitComment}>댓글 등록</button></div></div></>:<div className="boardEmpty large">왼쪽에서 글을 선택하세요.</div>}</div>
   </section>
   {writeOpen&&<div className="modalBack"><div className="modal communityWrite"><div className="head"><div><h2>{meta.label} 글쓰기</h2><p>{meta.cooldown}</p></div><button className="x" onClick={()=>setWriteOpen(false)}>×</button></div><label className="field"><span>제목</span><input className="input" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/></label><label className="field" style={{marginTop:10}}><span>내용</span><textarea className="textarea" value={content} onChange={e=>setContent(e.target.value)} style={{minHeight:240}}/></label><div className="actions"><button className="btn" onClick={()=>setWriteOpen(false)}>취소</button><button className="btn primary" disabled={busy} onClick={submitPost}>{busy?'등록 중...':'글 등록'}</button></div></div></div>}
 </main>;
}
