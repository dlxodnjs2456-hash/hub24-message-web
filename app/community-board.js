'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../lib/supabase';
import {api} from '../lib/api';
import {noticeApi} from '../lib/notice-api';
import PaidBannerGrid from './paid-banner-grid';

const INFO={
 FREE:{label:'자유게시판',eyebrow:'N PAY FREE BOARD',desc:'엔페이 사용자들이 자유롭게 이야기를 나누는 공간입니다.',cooldown:'글 작성 1시간 간격'},
 JOBS:{label:'구인구직',eyebrow:'N PAY JOB BOARD',desc:'구인·구직 정보를 공유하는 공간입니다.',cooldown:'글 작성 24시간 간격'},
 BLACKLIST:{label:'블랙리스트',eyebrow:'N PAY BLACKLIST',desc:'운영자가 확인한 주의 대상과 안내를 공유합니다.',cooldown:'관리자만 글 작성'},
};
const date=v=>v?String(v).replace('T',' ').slice(0,16):'-';

export default function CommunityBoard({type}){
 const board=String(type||'FREE').toUpperCase();const meta=INFO[board]||INFO.FREE;
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[posts,setPosts]=useState([]),[notices,setNotices]=useState([]),[selected,setSelected]=useState(null),[comments,setComments]=useState([]),[permissions,setPermissions]=useState({board_admin:false});
 const [writeOpen,setWriteOpen]=useState(false),[title,setTitle]=useState(''),[content,setContent]=useState(''),[comment,setComment]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
 useEffect(()=>{if(session)load()},[session,board]);
 async function load(){try{const [p,perm,n]=await Promise.all([api.communityPosts(board),api.communityPermissions(),noticeApi.list()]);setPosts(p.items||[]);setPermissions(perm||{});setNotices(n.items||[]);setSelected(null);setComments([])}catch(e){alert(e.message)}}
 async function loadPostsOnly(){try{const p=await api.communityPosts(board);setPosts(p.items||[])}catch{}}
 async function openPost(p){if(p?._notice){setSelected(p);setComments([]);window.scrollTo({top:0,behavior:'smooth'});return}try{const r=await api.communityPost(p.id);setSelected(r.item);setComments(r.comments||[]);window.scrollTo({top:0,behavior:'smooth'})}catch(e){alert(e.message)}}
 function friendly(e){const m=e?.message||String(e);if(m.startsWith('POST_COOLDOWN:')){const mins=Number(m.split(':')[1]||1);return `아직 새 글을 작성할 수 없습니다. 약 ${mins}분 후 다시 작성할 수 있습니다.`}if(m==='BOARD_ADMIN_ONLY')return '관리자 권한이 필요합니다.';return m}
 async function submitPost(){if(!title.trim()||!content.trim())return alert('제목과 내용을 입력하세요.');setBusy(true);try{await api.createCommunityPost({board_type:board,title:title.trim(),content:content.trim()});setTitle('');setContent('');setWriteOpen(false);await load();alert('글이 등록되었습니다.')}catch(e){alert(friendly(e))}finally{setBusy(false)}}
 async function submitComment(){if(!selected||selected._notice||!comment.trim())return;setBusy(true);try{await api.addCommunityComment(selected.id,comment.trim());setComment('');await openPost(selected);await loadPostsOnly()}catch(e){alert(e.message)}finally{setBusy(false)}}
 async function togglePin(){if(!selected||selected._notice||!permissions.board_admin)return;const next=!selected.is_pinned;try{await api.pinCommunityPost(selected.id,next);await loadPostsOnly();setSelected({...selected,is_pinned:next});alert(next?'게시글을 상단에 고정했습니다.':'게시글 고정을 해제했습니다.')}catch(e){alert(friendly(e))}}
 const canWrite=board!=='BLACKLIST'||permissions.board_admin;
 const noticePosts=notices.map(n=>({...n,_notice:true,author_name:'ANGEL PAY 운영팀',comment_count:0,view_count:0}));
 const listItems=[...noticePosts,...posts];
 if(!ready)return <div className="authPage"><div className="authCard">게시판을 불러오는 중...</div></div>;
 if(!session)return <div className="authPage"><div className="authCard"><h1>ANGEL PAY</h1><p>먼저 로그인하세요.</p><a className="btn primary" href="/">로그인 화면</a></div></div>;
 return <main className="communityPage standaloneBoard">
   <section className="communityHero"><div><span className="eyebrow">{meta.eyebrow}</span><h1>{meta.label}</h1><p>{meta.desc}</p></div>{canWrite?<button className="boardHeroWrite" onClick={()=>setWriteOpen(true)}>글쓰기</button>:<span className="adminOnlyBadge">관리자 작성 전용</span>}</section>
   <PaidBannerGrid/>
   {!selected?<section className="card" style={{marginTop:14,padding:0,overflow:'hidden'}}>
     <div className="head" style={{padding:'16px 18px',margin:0}}><div><h2>{meta.label}</h2><p>{meta.cooldown} · 제목을 눌러 내용을 확인하세요.</p></div>{canWrite&&<button className="btn primary" onClick={()=>setWriteOpen(true)}>글쓰기</button>}</div>
     <div className="table" style={{margin:0}}><table><thead><tr><th style={{width:90}}>구분</th><th>제목</th><th style={{width:150}}>작성자</th><th style={{width:150}}>작성일</th><th style={{width:80}}>조회</th></tr></thead><tbody>{listItems.length?listItems.map(p=><tr key={(p._notice?'notice-':'post-')+p.id} style={p._notice||p.is_pinned?{background:'rgba(45,127,211,.07)'}:undefined}><td>{p._notice?<span className="pinBadge">공지</span>:p.is_pinned?<span className="pinBadge">고정</span>:board==='JOBS'?'구인·구직':board==='BLACKLIST'?'주의':'일반'}</td><td><button type="button" onClick={()=>openPost(p)} style={{border:0,background:'transparent',padding:0,color:'#eaf4ff',fontWeight:800,cursor:'pointer',textAlign:'left'}}>{p.title}{!p._notice&&Number(p.comment_count||0)>0&&<span style={{marginLeft:7,color:'#65b5ff',fontSize:11}}>[{p.comment_count}]</span>}</button></td><td>{p.author_name||'회원'}</td><td>{date(p.created_at)}</td><td>{p._notice?'-':Number(p.view_count||0).toLocaleString()}</td></tr>):<tr><td colSpan="5" className="empty">등록된 글이 없습니다.</td></tr>}</tbody></table></div>
   </section>:<section className="card" style={{marginTop:14}}>
     <div className="actions" style={{marginTop:0,marginBottom:12,justifyContent:'space-between'}}><button className="btn" onClick={()=>{setSelected(null);setComments([])}}>← 목록으로</button>{!selected._notice&&permissions.board_admin&&<button className="btn" onClick={togglePin}>{selected.is_pinned?'고정해제':'상단 고정'}</button>}</div>
     <div style={{borderTop:'1px solid #24415f',borderBottom:'1px solid #24415f',padding:'18px 4px'}}><h2 style={{margin:0,color:'#f3f8ff',fontSize:22}}>{selected._notice&&<span className="pinBadge" style={{marginRight:8}}>공지</span>}{!selected._notice&&selected.is_pinned&&<span className="pinBadge" style={{marginRight:8}}>고정</span>}{selected.title}</h2><div style={{marginTop:10,color:'#819bb4',fontSize:12}}>{selected._notice?'ANGEL PAY 운영팀':(selected.author_name||'회원')} · {date(selected.created_at)}{!selected._notice&&` · 조회 ${selected.view_count||0}`}</div></div>
     <article style={{minHeight:260,padding:'26px 6px',whiteSpace:'pre-wrap',lineHeight:1.8,color:'#dce8f5'}}>{selected.content}</article>
     {!selected._notice&&<div className="commentSection" style={{borderTop:'1px solid #24415f',paddingTop:18}}><h3>댓글 {comments.length}</h3><div className="commentList">{comments.length?comments.map(c=><div className="commentItem" key={c.id}><div><b>{c.author_name||'회원'}</b><span>{date(c.created_at)}</span></div><p>{c.content}</p></div>):<div className="commentEmpty">첫 댓글을 남겨보세요.</div>}</div><div className="commentComposer"><textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="댓글을 입력하세요."/><button disabled={busy} onClick={submitComment}>댓글 등록</button></div></div>}
     <div className="actions" style={{justifyContent:'center',marginTop:20}}><button className="btn" onClick={()=>{setSelected(null);setComments([])}}>목록으로</button></div>
   </section>}
   {writeOpen&&<div className="modalBack"><div className="modal communityWrite"><div className="head"><div><h2>{meta.label} 글쓰기</h2><p>{meta.cooldown}</p></div><button className="x" onClick={()=>setWriteOpen(false)}>×</button></div><label className="field"><span>제목</span><input className="input" value={title} onChange={e=>setTitle(e.target.value)} maxLength={120}/></label><label className="field" style={{marginTop:10}}><span>내용</span><textarea className="textarea" value={content} onChange={e=>setContent(e.target.value)} style={{minHeight:240}}/></label><div className="actions"><button className="btn" onClick={()=>setWriteOpen(false)}>취소</button><button className="btn primary" disabled={busy} onClick={submitPost}>{busy?'등록 중...':'글 등록'}</button></div></div></div>}
 </main>;
}
