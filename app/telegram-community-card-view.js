'use client';
import {useEffect,useMemo,useState} from 'react';
import {usePathname} from 'next/navigation';
import {supabase} from '../lib/supabase';
import {BASE} from '../lib/api';

const medal=r=>r===1?'🥇':r===2?'🥈':r===3?'🥉':r<=10?`🏅 ${r}`:`#${r}`;

async function api(path,opts={}){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token) throw new Error('로그인이 필요합니다.');
  const r=await fetch(BASE+path,{...opts,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,...(opts.headers||{})}});
  const b=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error(b.detail||`HTTP ${r.status}`);
  return b;
}

export default function TelegramCommunityCardView(){
  const pathname=usePathname();
  const [items,setItems]=useState([]);
  const [search,setSearch]=useState('');
  const [category,setCategory]=useState('');

  async function load(){
    try{const r=await api('/v1/telegram-communities');setItems(r.items||[])}catch{}
  }

  useEffect(()=>{
    if(pathname!=='/telegram-community')return;
    load();
    const timer=setInterval(load,15000);
    return()=>clearInterval(timer);
  },[pathname]);

  useEffect(()=>{
    if(pathname!=='/telegram-community')return;
    const sync=()=>{
      const inputs=[...document.querySelectorAll('main input')];
      const q=inputs.find(x=>(x.placeholder||'').includes('커뮤니티명'));
      if(q)setSearch(q.value||'');
      const sels=[...document.querySelectorAll('main select')];
      const s=sels.find(x=>[...x.options].some(o=>o.textContent==='전체 카테고리'));
      if(s)setCategory(s.value||'');
    };
    const h=()=>setTimeout(sync,0);
    document.addEventListener('input',h,true);document.addEventListener('change',h,true);sync();
    return()=>{document.removeEventListener('input',h,true);document.removeEventListener('change',h,true)};
  },[pathname]);

  const filtered=useMemo(()=>items.filter(x=>{
    const q=search.trim().toLowerCase();
    const text=[x.community_name,x.description,...(x.tags||[])].join(' ').toLowerCase();
    return(!category||x.category===category)&&(!q||text.includes(q));
  }),[items,search,category]);

  if(pathname!=='/telegram-community')return null;

  function openDetail(x){
    const buttons=[...document.querySelectorAll('main button')];
    const b=buttons.find(el=>(el.textContent||'').trim()===String(x.community_name||'').trim());
    if(b)b.click();
  }
  async function like(x,e){
    e.stopPropagation();
    try{await api(`/v1/telegram-communities/${x.id}/like`,{method:'POST'});await load()}catch(err){alert(err.message)}
  }

  return <div className="tc-card-overlay" style={{maxWidth:1180,margin:'0 auto 14px',padding:'0 0'}}>
    <style>{`
      body.tc-card-mode main section[data-tc-original-list="1"]{display:none!important}
      .tc-card-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
      .tc-card{position:relative;overflow:hidden;border:1px solid #284869;border-radius:14px;background:#0d1d31;cursor:pointer;transition:.16s ease;min-width:0}
      .tc-card:hover{transform:translateY(-2px);border-color:#4b79a5;box-shadow:0 12px 28px rgba(0,0,0,.22)}
      .tc-thumb{height:150px;background:#10243a center/cover no-repeat;display:flex;align-items:center;justify-content:center;color:#52708e;font-size:12px;border-bottom:1px solid #203952}
      .tc-rank{position:absolute;top:10px;left:10px;background:rgba(5,15,28,.88);border:1px solid #3b5c7d;border-radius:999px;padding:5px 9px;font-size:11px;font-weight:900;color:#fff;z-index:2}
      .tc-body{padding:13px}
      .tc-name{font-size:15px;font-weight:900;color:#edf6ff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px}
      .tc-cat{font-size:10px;color:#7ea4c8;margin-bottom:9px}
      .tc-desc{font-size:11px;line-height:1.5;color:#93abc2;height:34px;overflow:hidden;margin-bottom:12px}
      .tc-stats{display:flex;gap:12px;color:#7f9ab4;font-size:10px;border-top:1px solid #203952;padding-top:10px;align-items:center}
      .tc-like{border:0;background:transparent;padding:0;color:inherit;cursor:pointer;font-size:10px}
      .tc-like.on{color:#ff8197}
      .tc-go{margin-left:auto;color:#80c8ff;text-decoration:none;font-weight:800}
      @media(max-width:1000px){.tc-card-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
      @media(max-width:720px){.tc-card-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.tc-thumb{height:120px}}
      @media(max-width:430px){.tc-card-grid{grid-template-columns:1fr}}
    `}</style>
    <div className="tc-card-grid">
      {filtered.map((x,i)=><article className="tc-card" key={x.id} onClick={()=>openDetail(x)}>
        <div className="tc-rank">{medal(Number(x.rank||i+1))}</div>
        <div className="tc-thumb" style={x.image_url?{backgroundImage:`url(${x.image_url})`}:{}}>{!x.image_url&&'대표 이미지 없음'}</div>
        <div className="tc-body">
          <div className="tc-name">{x.community_name}</div>
          <div className="tc-cat">{x.category}</div>
          <div className="tc-desc">{x.description||'커뮤니티 소개가 없습니다.'}</div>
          <div className="tc-stats">
            <span>👁 {Number(x.view_count||0).toLocaleString()}</span>
            <button className={'tc-like '+(x.liked_by_me?'on':'')} onClick={e=>like(x,e)}>♥ {Number(x.like_count||0).toLocaleString()}</button>
            <span>💬 {Number(x.comment_count||0).toLocaleString()}</span>
            <a className="tc-go" href={x.telegram_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}>입장 ↗</a>
          </div>
        </div>
      </article>)}
    </div>
    {!filtered.length&&<div style={{padding:34,textAlign:'center',border:'1px solid #284869',borderRadius:12,background:'#0d1d31',color:'#7189a3'}}>등록된 커뮤니티가 없습니다.</div>}
  </div>;
}
