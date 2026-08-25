'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {api} from '../../lib/api';

const BOARDS={
 FREE:{label:'자유게시판',desc:'자유롭게 이야기를 나누는 공간입니다.',cooldown:'글 작성 1시간 간격'},
 JOBS:{label:'구인구직',desc:'구인·구직 정보를 공유하는 게시판입니다.',cooldown:'글 작성 24시간 간격'},
 BLACKLIST:{label:'블랙리스트',desc:'운영자가 확인한 주의 대상과 안내를 공유합니다.',cooldown:'관리자만 글 작성'},
};
const date=v=>v?String(v).replace('T',' ').slice(0,16):'-';

export default function CommunityPage(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[board,setBoard]=useState('FREE'),[posts,setPosts]=useState([]),[selected,setSelected]=useState(null),[comments,setComments]=useState([]),[permissions,setPermissions]=useState({board_admin:false}),[banners,setBanners]=useState([]);
 const [writeOpen,setWriteOpen]=useState(false),[title,setTitle]=useState(''),[content,setContent]=useState(''),[comment,setComment]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
 useEffect(()=>{if(session)load(board)},[session,board]);
 async function load(type){try{const calls=[api.communityPosts(type),api.communityPermissions()];if(type==='FREE')calls.push(api.marketBanners());const r=await Promise.all(calls);setPosts(r[0].items||[]);setPermissions(r[1]||{});if(type==='FREE')setBanners(r[2]?.items||[]);else setBanners([]);setSelected(null);setComments([])}catch(e){alert(e.message)}}
 async function openPost(p){try{const r=await api.communityPost(p.id);setSelected(r.item);setComments(r.comments||[])}catch(e){alert(e.message)}}
 function friendly(e){const m=e?.message||String(e);if(m.startsWith('POST_COOLDOWN:')){const mins=Number(m.split(':')[1]||1);return `아직 새 글을 작성할 수 없습니다. 약 ${mins}분 후 다시 작성할 수 있습니다.`}if(m==='BOARD_ADMIN_ONLY')return '블랙리스트 게시판은 게시판 관리자만 글을 작성할 수 있습니다.';return m}
 async function submitPost(){if(!title.trim()||!content.trim())return alert('제목과 내용을 입력하세요.');setBusy(true);try{await api.createCommunityPost({board_type:board,title:title.trim(),content:content.trim()});setTitle('');setContent('');setWriteOpen(false);await load(board);alert('글이 등록되었습니다.')}catch(e){alert(friendly(e))}finally{setBusy(false)}}
 async function submitComment(){if(!selected||!comment.trim())return;setBusy(true);try{await api.addCommunityComment(selected.id,comment.trim());setComment('');await openPost(selected);await loadPostsOnly()}catch(e){alert(e.message)}finally{setBusy(false)}}
 async function loadPostsOnly(){try{const r=await api.communityPosts(board);setPosts(r.items||[])}catch{}}
 const canWrite=board!=='BLACKLIST'||permissions.board_admin;
 const slots=Array.from({length:6},(_,i)=>banners.find(b=>Number(b.sort_order)===i+1)||null);
 if(!ready)return <div className="authPage"><div className="authCard">커뮤니티를 불러오는 중...</div></div>;
 if(!session)return <div className="authPage"><div className="authCard"><h1>ANGEL PAY</h1><p>먼저 로그인하세요.</p><a className="btn primary" href="/">로그인 화면</a></div></div>;
 return <main className="communityPage">
   <section className="communityHero"><div><span className="eyebrow">N PAY COMMUNITY</span><h1>커뮤니티</h1><p>엔페이 사용자들이 정보를 나누는 공간입니다.</p></div></section>
   <div className="communityTabs">{Object.entries(BOARDS).map(([k,v])=><button key={k} className={board===k?'active':''} onClick={()=>setBoard(k)}>{v.label}</button>)}</div>
   {board==='FREE'&&<section className="communityBannerGrid">{slots.map((b,i)=>b?(b.target_url?<a href={b.target_url} target="_blank" rel="noreferrer" key={i}><img src={b.image_url} alt={b.title||`광고 ${i+1}`}/></a>:<div className="communityBannerSlot" key={i}><img src={b.image_url} alt={b.title||`광고 ${i+1}`}/></div>):<div className="communityBannerEmpty" key={i}><b>AD {i+1}</b><span>광고 영역</span></div>)}</section>}
   <section className="boardHeader"><div><h2>{BOARDS[board].label}</h2><p>{BOARDS[board].desc} · {BOARDS[board].cooldown}</p></div>{canWrite?<button onClick={()=>setWriteOpen(true)}>글쓰기</button>:<span className="adminOnlyBadge">관리자 작성 전용</span>}</section>
   <section className="boardWorkspace">
    <div className="postList">{posts.length?posts.map(p=><button key={p.id} className={selected?.id===p.id?'active':''} onClick={()=>openPost(p)}><div><b>{p.title}</b><span>{p.author_name||'회원'} · {date(p.created_at)}</span></div><div><span>댓글 {p.comment_count||0}</span><span>조회 {p.view_count||0}</span></div></button>):<div className="boardEmpty">등록된 글이 없습니다.</div>}</div>
    <div className="postDetail">{selected?<><div className="postTitle"><h2>{selected.title}</h2><div>{selected.author_name||'회원'} · {date(selected.created_at)} · 조회 {selected.view_count||0}</div></div><div className="postBody">{selected.content}</div><div className="commentSection"><h3>댓글 {comments.length}</h3><div className="commentList">{comments.length?comments.map(c=><div className="commentItem" key={c.id}><div><b>{c.author_name||'회원'}</b><span>{date(c.created_at)}</span></div><p>{c.content}</p></div>):<div className="commentEmpty">첫 댓글을 남겨보세요.</div>}</div><div className="commentComposer"><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="댓글을 입력하세요."/><button disabled={busy} onClick={submitComment}>댓글 등록</button></div></div></>:<div className="boardEmpty large">왼쪽에서 글을 선택하세요.</div>}</div>
   </section>
   {writeOpen&&<div className="modalBack"><div className="modal communityWrite"><div className="head"><div><h2>{BOARDS[board].label} 글쓰기</h2><p>{BOARDS[board].cooldown}</p></div><button className="x" onClick={()=>setWriteOpen(false)}>×</button></div><label className="field"><span>제목</span><input className="input" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/></label><label className="field" style={{marginTop:10}}><span>내용</span><textarea className="textarea" value={content} onChange={e=>setContent(e.target.value)} style={{minHeight:240}}/></label><div className="actions"><button className="btn" onClick={()=>setWriteOpen(false)}>취소</button><button className="btn primary" disabled={busy} onClick={submitPost}>{busy?'등록 중...':'글 등록'}</button></div></div></div>}
 </main>;
}
