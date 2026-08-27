'use client';
import {useEffect} from 'react';

export default function ChatMediaEnhancer(){
 useEffect(()=>{
  const originalFetch=window.fetch.bind(window);
  let latest=[];
  let timer=null;

  function decorate(){
   const nodes=[...document.querySelectorAll('.messageList .chatMessage')];
   if(!nodes.length)return;
   nodes.forEach((node,index)=>{
    const item=latest[index];
    if(!item)return;
    const id=String(item.id||'');
    if(node.dataset.npayMediaMessageId!==id){
     node.querySelectorAll('[data-npay-chat-media],[data-npay-chat-buttons]').forEach(x=>x.remove());
     node.dataset.npayMediaMessageId=id;
    }
    if(item.media_data_url&&!node.querySelector('[data-npay-chat-media]')){
     const img=document.createElement('img');
     img.src=item.media_data_url;
     img.alt='Telegram 이미지';
     img.setAttribute('data-npay-chat-media','1');
     img.style.display='block';
     img.style.width='min(100%, 360px)';
     img.style.maxHeight='420px';
     img.style.objectFit='contain';
     img.style.borderRadius='10px';
     img.style.margin='8px 0 6px';
     img.style.background='#081421';
     const p=node.querySelector('p');
     if(p)node.insertBefore(img,p);else node.appendChild(img);
    }
    if(Array.isArray(item.buttons)&&item.buttons.length&&!node.querySelector('[data-npay-chat-buttons]')){
     const wrap=document.createElement('div');
     wrap.setAttribute('data-npay-chat-buttons','1');
     wrap.style.display='grid';
     wrap.style.gap='6px';
     wrap.style.marginTop='8px';
     item.buttons.forEach(btn=>{
      const el=btn.url?document.createElement('a'):document.createElement('div');
      el.textContent=btn.text||'버튼';
      if(btn.url){el.href=btn.url;el.target='_blank';el.rel='noopener noreferrer'}
      el.style.display='block';
      el.style.padding='9px 12px';
      el.style.border='1px solid #2f77b8';
      el.style.borderRadius='8px';
      el.style.background='#11365a';
      el.style.color='#e9f5ff';
      el.style.textAlign='center';
      el.style.fontWeight='700';
      el.style.textDecoration='none';
      el.style.fontSize='13px';
      wrap.appendChild(el);
     });
     node.appendChild(wrap);
    }
    const p=node.querySelector('p');
    if(p&&item.has_photo&&!item.text){p.style.display='none'}
    else if(p){p.style.display=''}
   });
  }

  window.fetch=async(...args)=>{
   const response=await originalFetch(...args);
   try{
    const input=args[0];
    const url=typeof input==='string'?input:(input?.url||'');
    if(/\/v1\/accounts\/[^/]+\/dialogs\/-?\d+\/messages(?:\?|$)/.test(url)&&response.ok){
     response.clone().json().then(body=>{
      latest=Array.isArray(body?.items)?body.items:[];
      clearTimeout(timer);timer=setTimeout(decorate,0);
     }).catch(()=>{});
    }
   }catch{}
   return response;
  };

  const observer=new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(decorate,20)});
  observer.observe(document.body,{childList:true,subtree:true});
  return()=>{window.fetch=originalFetch;observer.disconnect();clearTimeout(timer)};
 },[]);
 return null;
}
