'use client';
import {useEffect,useState} from 'react';
import {api} from '../lib/api';
import {supabase} from '../lib/supabase';

const fmt=n=>Number(n||0).toLocaleString('ko-KR')+' P';
const endText=s=>s?.is_lifetime?'서비스 종료 시까지':s?.expires_at?String(s.expires_at).replace('T',' ').slice(0,16):'-';

export default function PaidBannerGrid(){
 const [data,setData]=useState({items:[],plans:[],image_guide:'권장 1200×360px (10:3), JPG/PNG/WebP, 최대 5MB'});
 const [selected,setSelected]=useState(null),[mode,setMode]=useState('purchase'),[plan,setPlan]=useState('1M');
 const [file,setFile]=useState(null),[preview,setPreview]=useState(''),[targetUrl,setTargetUrl]=useState(''),[title,setTitle]=useState(''),[busy,setBusy]=useState(false);
 async function load(){try{const r=await api.bannerSlots();setData(r)}catch{}}
 useEffect(()=>{load()},[]);
 const slots=Array.from({length:6},(_,i)=>data.items?.find(x=>Number(x.slot)===i+1)||{slot:i+1,available:true});
 function openPurchase(s){if(!s.available&&!s.owned_by_me)return;setSelected(s);setMode(s.owned_by_me?'edit':'purchase');setTargetUrl(s.target_url||'');setTitle(s.title||`광고 ${s.slot}`);setFile(null);setPreview(s.image_url||'')}
 function friendly(e){const m=e?.message||String(e);if(m.includes('INSUFFICIENT_POINT'))return '포인트가 부족합니다.';if(m.includes('SLOT_UNAVAILABLE'))return '이미 다른 사용자가 이용 중인 광고칸입니다.';if(m.includes('BANNER_LIMIT_2'))return '계정 1개당 동시에 최대 2개 광고칸만 이용할 수 있습니다.';return m}
 async function purchase(){if(!selected)return;const p=data.plans?.find(x=>x.code===plan);if(!p)return;if(!confirm(`${selected.slot}번 광고칸을 ${p.label} / ${fmt(p.price)}에 구매할까요?`))return;setBusy(true);try{await api.purchaseBannerSlot(selected.slot,plan);await load();setMode('edit');alert('광고칸 구매가 완료되었습니다. 이제 이미지를 등록하세요.')}catch(e){alert(friendly(e))}finally{setBusy(false)}}
 async function saveCreative(){if(!selected)return;if(!file&&!preview)return alert('광고 이미지를 등록하세요.');if(file&&file.size>5*1024*1024)return alert('이미지는 최대 5MB까지 등록할 수 있습니다.');if(file&&!file.type?.startsWith('image/'))return alert('이미지 파일만 등록할 수 있습니다.');setBusy(true);try{let imageUrl=preview;if(file){const {data:{session}}=await supabase.auth.getSession();if(!session)throw new Error('로그인이 필요합니다.');const ext=(file.name.split('.').pop()||'jpg').replace(/[^a-zA-Z0-9]/g,'').toLowerCase();const path=`${session.user.id}/paid-banners/slot-${selected.slot}-${Date.now()}.${ext}`;const {error}=await supabase.storage.from('market-media').upload(path,file,{cacheControl:'3600',upsert:false,contentType:file.type});if(error)throw error;const {data:pub}=supabase.storage.from('market-media').getPublicUrl(path);imageUrl=pub.publicUrl}await api.updateBannerCreative(selected.slot,{title:title.trim()||`광고 ${selected.slot}`,image_url:imageUrl,target_url:targetUrl.trim()||null});await load();setSelected(null);alert('광고 이미지를 저장했습니다.')}catch(e){alert(friendly(e))}finally{setBusy(false)}}
 return <>
  <section className="paidBannerGrid">
   {slots.map(s=><article key={s.slot} className={'paidBannerSlot '+(s.owned_by_me?'mine ':'')+(s.available?'available':'occupied')}>
    <div className="paidBannerMedia">{s.image_url?(s.target_url?<a href={s.target_url} target="_blank" rel="noreferrer"><img src={s.image_url} alt={s.title||`광고 ${s.slot}`}/></a>:<img src={s.image_url} alt={s.title||`광고 ${s.slot}`}/>):<button className="bannerEmptyButton" onClick={()=>openPurchase(s)} disabled={!s.available&&!s.owned_by_me}><b>AD SLOT {s.slot}</b><span>{s.owned_by_me?'내 광고 · 이미지 등록 필요':s.available?'광고 신청 가능':'이용 중'}</span></button>}
      {s.owned_by_me&&<button className="bannerEditButton" onClick={()=>openPurchase(s)}>내 광고 수정</button>}
    </div>
    <footer><span>광고 {s.slot}번</span><b>이용종료기간 - {s.available&&!s.owned_by_me?'-':endText(s)}</b>{s.available&&!s.owned_by_me&&<button onClick={()=>openPurchase(s)}>구매하기</button>}</footer>
   </article>)}
  </section>
  <div className="bannerGuideLine"><b>광고 이미지 권장 사이즈</b> · {data.image_guide} · 계정당 최대 {data.max_slots_per_user||2}개</div>
  {selected&&<div className="modalBack"><div className="modal paidBannerModal"><div className="head"><div><h2>광고 {selected.slot}번 {mode==='purchase'?'구매':'관리'}</h2><p>{data.image_guide}</p></div><button className="x" onClick={()=>setSelected(null)}>×</button></div>
   {mode==='purchase'?<><div className="bannerPlanGrid">{(data.plans||[]).map(p=><button key={p.code} className={plan===p.code?'active':''} onClick={()=>setPlan(p.code)}><b>{p.label}</b><span>{fmt(p.price)}</span></button>)}</div><div className="escrowNotice">결제 즉시 포인트가 차감되며 선택한 광고칸의 수정 권한이 계정에 부여됩니다. 계정당 동시에 최대 2개까지 구매할 수 있습니다.</div><div className="actions"><button className="btn" onClick={()=>setSelected(null)}>취소</button><button className="btn primary" disabled={busy} onClick={purchase}>{busy?'결제 중...':'포인트로 구매'}</button></div></>:<><div className="bannerOwnerInfo">이용종료기간 - <b>{endText(selected)}</b></div><div className="form"><label className="field"><span>광고 제목</span><input className="input" value={title} onChange={e=>setTitle(e.target.value)}/></label><label className="field"><span>클릭 링크</span><input className="input" value={targetUrl} onChange={e=>setTargetUrl(e.target.value)} placeholder="https://..."/></label><label className="field full"><span>광고 이미지 · 1200×360px 권장 / 최대 5MB</span><input className="input" type="file" accept="image/png,image/jpeg,image/webp" onChange={e=>{const f=e.target.files?.[0]||null;setFile(f);setPreview(f?URL.createObjectURL(f):selected.image_url||'')}}/></label></div>{preview&&<img className="bannerCreativePreview" src={preview} alt="미리보기"/>}<div className="actions"><button className="btn" onClick={()=>setSelected(null)}>닫기</button><button className="btn primary" disabled={busy} onClick={saveCreative}>{busy?'저장 중...':'광고 저장'}</button></div></>}
  </div></div>}
 </>;
}
