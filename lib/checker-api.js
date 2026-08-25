import {supabase} from './supabase';
import {BASE} from './api';

export async function uploadCheckerFile(file,activityDays=0){
 const {data:{session}}=await supabase.auth.getSession();
 if(!session?.access_token)throw new Error('로그인이 필요합니다.');
 const fd=new FormData();fd.append('file',file);fd.append('activity_days',String(activityDays));
 const res=await fetch(BASE+'/v1/checker/upload',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`},body:fd});
 if(!res.ok){let detail='';try{detail=(await res.json()).detail||''}catch{};throw new Error(detail||`HTTP ${res.status}`)}
 return res.json();
}
