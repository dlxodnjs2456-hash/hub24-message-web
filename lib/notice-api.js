import {supabase} from './supabase';
import {BASE} from './api';

async function request(path,options={}){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('로그인이 필요합니다.');
  const res=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,...(options.headers||{})},cache:'no-store'});
  if(!res.ok){let detail='';try{detail=(await res.json()).detail||''}catch{};throw new Error(detail||`HTTP ${res.status}`)}
  return res.json();
}

export const noticeApi={
  list:()=>request('/v1/community/notices'),
  adminList:()=>request('/v1/admin/community/notices'),
  create:p=>request('/v1/admin/community/notices',{method:'POST',body:JSON.stringify(p)}),
  update:(id,p)=>request(`/v1/admin/community/notices/${id}`,{method:'PUT',body:JSON.stringify(p)}),
  remove:id=>request(`/v1/admin/community/notices/${id}`,{method:'DELETE'}),
};
