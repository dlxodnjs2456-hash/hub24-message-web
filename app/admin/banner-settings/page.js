'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../../lib/supabase';
import {api} from '../../../lib/api';

export default function BannerSettingsAdmin(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[count,setCount]=useState(3),[saving,setSaving]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(async({data})=>{const s=data.session||null;setSession(s);setReady(true);if(s?.user?.app_metadata?.role==='admin'){try{const r=await api.bannerSlots();setCount(Number(r.slot_count||3))}catch{}}})},[]);
 if(!ready)return <main className="content"><section className="card">권한 확인 중...</section></main>;
 if(!session||session.user?.app_metadata?.role!=='admin')return <main className="content"><section className="card"><h1>관리자 권한이 필요합니다.</h1><a className="btn" href="/">사용자 화면</a></section></main>;
 async function save(){setSaving(true);try{await api.adminBannerSlotSettings(Number(count));alert(`광고 슬롯을 ${count}개로 변경했습니다.`)}catch(e){alert(e.message)}finally{setSaving(false)}}
 return <main className="content" style={{maxWidth:900,margin:'0 auto'}}>
  <div className="head"><div><h1>광고 슬롯 설정</h1><p>사용자 화면에 노출되는 광고 슬롯 수를 조정합니다.</p></div><a className="btn" href="/admin">관리자 메인</a></div>
  <section className="card"><h2>노출 광고 슬롯 수</h2><p className="note">기본값은 3개입니다. 기존 4~6번 광고 데이터는 삭제하지 않고 숨김 처리되며, 다시 슬롯 수를 늘리면 그대로 사용할 수 있습니다.</p><label className="field" style={{marginTop:14}}><span>광고 슬롯 수</span><select className="input" value={count} onChange={e=>setCount(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n} value={n}>{n}개</option>)}</select></label><div className="actions"><button className="btn primary" disabled={saving} onClick={save}>{saving?'저장 중...':'설정 저장'}</button></div></section>
 </main>;
}
