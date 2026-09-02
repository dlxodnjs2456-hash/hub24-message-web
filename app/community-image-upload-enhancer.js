'use client';
import {useEffect} from 'react';
import {supabase} from './lib/supabase';
import {BASE} from './lib/api';

function setReactInputValue(input,value){
  const setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value')?.set;
  if(setter)setter.call(input,value);else input.value=value;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
}

async function uploadFile(file){
  if(!file)return null;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw new Error('JPG, PNG, WEBP 이미지만 업로드할 수 있습니다.');
  if(file.size>5*1024*1024)throw new Error('이미지는 5MB 이하만 업로드할 수 있습니다.');
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('로그인이 필요합니다.');
  const fd=new FormData();fd.append('file',file);
  const r=await fetch(BASE+'/v1/telegram-communities/image-upload',{method:'POST',headers:{Authorization:`Bearer ${session.access_token}`},body:fd});
  let b={};try{b=await r.json()}catch{}
  if(!r.ok)throw new Error(b.detail||`업로드 실패 (${r.status})`);
  return b.image_url;
}

function enhance(label){
  if(label.dataset.communityUploadEnhanced==='1')return;
  const span=label.querySelector('span');
  const input=label.querySelector('input');
  if(!span||!input)return;
  const text=(span.textContent||'').trim();
  if(!text.includes('대표 이미지 URL'))return;
  label.dataset.communityUploadEnhanced='1';
  span.textContent='대표 이미지 · 선택';
  input.style.display='none';

  const wrap=document.createElement('div');
  wrap.style.cssText='display:grid;gap:8px';
  const file=document.createElement('input');
  file.type='file';file.accept='image/jpeg,image/png,image/webp';file.className='input';
  const status=document.createElement('div');
  status.style.cssText='font-size:10px;color:#7894b1;min-height:16px';
  status.textContent=input.value?'현재 이미지가 등록되어 있습니다. 새 파일을 선택하면 교체됩니다.':'JPG · PNG · WEBP / 최대 5MB';
  const preview=document.createElement('div');
  preview.style.cssText='display:none;width:100%;max-width:260px;height:140px;border-radius:10px;background-position:center;background-size:cover;border:1px solid #284869';
  if(input.value){preview.style.display='block';preview.style.backgroundImage=`url("${input.value}")`;}
  file.addEventListener('change',async()=>{
    const selected=file.files?.[0];if(!selected)return;
    file.disabled=true;status.textContent='이미지 업로드 중...';
    try{
      const url=await uploadFile(selected);
      setReactInputValue(input,url||'');
      preview.style.display='block';preview.style.backgroundImage=`url("${url}")`;
      status.textContent='업로드 완료 · 등록 시 자동 저장됩니다.';
    }catch(e){status.textContent=e.message||String(e);file.value='';}
    finally{file.disabled=false;}
  });
  wrap.append(file,status,preview);input.after(wrap);
}

export default function CommunityImageUploadEnhancer(){
  useEffect(()=>{
    const scan=()=>document.querySelectorAll('label.field').forEach(enhance);
    scan();
    const mo=new MutationObserver(scan);mo.observe(document.body,{childList:true,subtree:true});
    return()=>mo.disconnect();
  },[]);
  return null;
}
