import {supabase} from './supabase';
import {BASE} from './api';

async function request(path,options={}){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('로그인이 필요합니다.');
  const res=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,...(options.headers||{})},cache:'no-store'});
  if(!res.ok){let detail='';try{detail=(await res.json()).detail||''}catch{};throw new Error(detail||`HTTP ${res.status}`)}
  return res.json();
}

export const marketChatApi={
  open:(seller_id,product_id)=>request('/v1/market/chats',{method:'POST',body:JSON.stringify({seller_id,product_id})}),
  list:()=>request('/v1/market/chats'),
  messages:id=>request(`/v1/market/chats/${id}/messages`),
  send:(id,message)=>request(`/v1/market/chats/${id}/messages`,{method:'POST',body:JSON.stringify({message})}),
};
