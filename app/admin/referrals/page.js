'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../../lib/supabase';
import {BASE} from '../../../lib/api';
const fmt=n=>Number(n||0).toLocaleString('ko-KR')+' P';
export default function AdminReferralSettings(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[qualification,setQualification]=useState('10000'),[cap,setCap]=useState('100000'),[busy,setBusy]=useState(false);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{const s=data.session||null;setSession(s);setReady(true);if(s?.user?.app_metadata?.role==='admin')load(s)})},[]);
 async function call(path,opts={},s=session){const token=s?.access_token||(await supabase.auth.getSession()).data.session?.access_token;const r=await fetch(BASE+path,{...opts,headers:{'Content-Type':'application/json','Authorization':`Bearer ${token}`,...(opts.headers||{})}});if(!r.ok){let d={};try{d=await r.json()}catch{};throw new Error(d.detail||`HTTP ${r.status}`)}return r.json()}
 async function load(s=session){try{const r=await call('/v1/admin/referral-settings',{},s);setQualification(String(r.referral_qualification_charge??10000));setCap(String(r.referral_monthly_reward_cap??100000))}catch(e){alert(e.message)}}
 async function save(){setBusy(true);try{await call('/v1/admin/referral-settings',{method:'PUT',body:JSON.stringify({referral_qualification_charge:Number(qualification),referral_monthly_reward_cap:Number(cap)})});alert('추천인 보호 기준을 저장했습니다.')}catch(e){alert(e.message)}finally{setBusy(false)}}
 if(!ready)return <main className="content"><section className="card">권한 확인 중...</section></main>;
 if(session?.user?.app_metadata?.role!=='admin')return <main className="content"><section className="card">관리자 권한이 없습니다.</section></main>;
 return <main className="content" style={{maxWidth:900,margin:'0 auto'}}><div className="head"><div><h1>추천인 설정</h1><p>추천왕 유효회원 기준과 반복 입금 보상 상한을 관리합니다.</p></div></div><section className="card"><div className="form"><label className="field"><span>유효추천 인정 최소 첫 승인 입금</span><input className="input" type="number" min="0" value={qualification} onChange={e=>setQualification(e.target.value)}/></label><label className="field"><span>추천회원 1명당 월 보상 상한</span><input className="input" type="number" min="0" value={cap} onChange={e=>setCap(e.target.value)}/></label></div><div className="note" style={{marginTop:12}}>추천보상은 <b>승인 입금 금액의 2%</b>만 지급하며 출금에는 추천보상이 없습니다. 첫 승인 입금 {fmt(qualification)} 이상이면 추천왕 유효회원으로 인정되고, 해당 추천회원으로부터 발생하는 추천보상은 월 {fmt(cap)}까지 지급됩니다.</div><div className="actions"><button className="btn primary" disabled={busy} onClick={save}>{busy?'저장 중...':'설정 저장'}</button></div></section></main>;
}
