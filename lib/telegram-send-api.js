import {supabase} from './supabase';
import {BASE} from './api';

async function request(path,options={}){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('로그인이 필요합니다.');
  const res=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,...(options.headers||{})}});
  if(!res.ok){let detail='';try{detail=(await res.json()).detail||''}catch{};throw new Error(detail||`HTTP ${res.status}`)}
  return res.json();
}

export const telegramSendApi={
  preferences:()=>request('/v1/telegram-send/preferences'),
  savePreferences:p=>request('/v1/telegram-send/preferences',{method:'PUT',body:JSON.stringify(p)}),
  startContactImport:(batchId,p)=>request(`/v1/batches/${batchId}/import-contacts`,{method:'POST',body:JSON.stringify(p)}),
  contactImportStatus:batchId=>request(`/v1/batches/${batchId}/import-contacts`),
};
