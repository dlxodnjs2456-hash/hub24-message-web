import {supabase} from './supabase';

export const BASE=process.env.NEXT_PUBLIC_WORKER_URL||'https://hub24-message-worker.onrender.com';

async function request(path, options={}){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('로그인이 필요합니다.');
  const res=await fetch(BASE+path,{
    ...options,
    headers:{
      'Content-Type':'application/json',
      'Authorization':`Bearer ${session.access_token}`,
      ...(options.headers||{})
    }
  });
  if(!res.ok){
    let detail='';
    try{detail=(await res.json()).detail||''}catch{}
    throw new Error(detail||`HTTP ${res.status}`);
  }
  const ct=res.headers.get('content-type')||'';
  return ct.includes('application/json')?res.json():res.text();
}

export const api={
  health:async()=>{
    const res=await fetch(BASE+'/health');
    if(!res.ok)throw new Error(`HTTP ${res.status}`);
    return res.json();
  },
  accounts:()=>request('/v1/accounts'),
  connectStart:(payload)=>request('/v1/accounts/connect/start',{method:'POST',body:JSON.stringify(payload)}),
  connectVerify:(payload)=>request('/v1/accounts/connect/verify',{method:'POST',body:JSON.stringify(payload)}),
  deleteAccount:(id)=>request(`/v1/accounts/${id}`,{method:'DELETE'}),
  refreshAccount:(id)=>request(`/v1/accounts/${id}/status`,{method:'POST'}),
  uploadBatch:async(file)=>{
    const {data:{session}}=await supabase.auth.getSession();
    if(!session?.access_token)throw new Error('로그인이 필요합니다.');
    const fd=new FormData();fd.append('file',file);
    const res=await fetch(BASE+'/v1/batches/upload',{method:'POST',headers:{'Authorization':`Bearer ${session.access_token}`},body:fd});
    if(!res.ok){let detail='';try{detail=(await res.json()).detail||''}catch{};throw new Error(detail||`HTTP ${res.status}`)}
    return res.json();
  },
  batches:()=>request('/v1/batches'),
  jobs:()=>request('/v1/jobs'),
  createJob:(payload)=>request('/v1/jobs',{method:'POST',body:JSON.stringify(payload)}),
  job:(id)=>request(`/v1/jobs/${id}`),
  targets:(id)=>request(`/v1/jobs/${id}/targets?limit=1000`),
  startJob:(id)=>request(`/v1/jobs/${id}/start`,{method:'POST'}),
  pauseJob:(id)=>request(`/v1/jobs/${id}/pause`,{method:'POST'}),
  stopJob:(id)=>request(`/v1/jobs/${id}/stop`,{method:'POST'}),
  logs:(id)=>request(`/v1/jobs/${id}/events?limit=300`),
};
