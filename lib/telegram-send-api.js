import {supabase} from './supabase';
import {BASE} from './api';

const PREF_KEY='npay_telegram_send_preferences_v1';
const DEFAULT_PREFS={message_text:'',button_text:'',button_url:'',max_contacts_per_account:50};

async function request(path,options={}){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('로그인이 필요합니다.');
  const res=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,...(options.headers||{})}});
  if(!res.ok){let detail='';try{detail=(await res.json()).detail||''}catch{};throw new Error(detail||`HTTP ${res.status}`)}
  return res.json();
}

function readLocalPrefs(){
  if(typeof window==='undefined')return {...DEFAULT_PREFS};
  try{return {...DEFAULT_PREFS,...JSON.parse(localStorage.getItem(PREF_KEY)||'{}')}}catch{return {...DEFAULT_PREFS}}
}
function writeLocalPrefs(p){
  const next={...readLocalPrefs(),...(p||{})};
  if(typeof window!=='undefined')localStorage.setItem(PREF_KEY,JSON.stringify(next));
  return next;
}

export const telegramSendApi={
  preferences:async()=>{
    try{
      const r=await request('/v1/telegram-send/preferences');
      return writeLocalPrefs(r);
    }catch(e){
      return {...readLocalPrefs(),_local_fallback:true,_server_error:e?.message||String(e)};
    }
  },
  savePreferences:async p=>{
    const local=writeLocalPrefs(p);
    try{
      const r=await request('/v1/telegram-send/preferences',{method:'PUT',body:JSON.stringify(p)});
      return {...writeLocalPrefs(r),saved_local:false};
    }catch(e){
      return {...local,saved_local:true,_server_error:e?.message||String(e)};
    }
  },
  startContactImport:(batchId,p)=>request(`/v1/batches/${batchId}/import-contacts`,{method:'POST',body:JSON.stringify(p)}),
  contactImportStatus:batchId=>request(`/v1/batches/${batchId}/import-contacts`),
};
