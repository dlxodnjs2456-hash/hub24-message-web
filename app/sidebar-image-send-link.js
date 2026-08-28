'use client';
import {useEffect} from 'react';

export default function SidebarImageSendLink(){
 useEffect(()=>{
  const install=()=>{
   const nav=document.querySelector('.sidebar .nav');
   if(!nav)return;
   const ensure=(label,path,key,after)=>{
    if([...nav.querySelectorAll('button')].some(x=>(x.textContent||'').trim()===label)||nav.querySelector(`[data-${key}="1"]`))return;
    const b=document.createElement('button');b.type='button';b.setAttribute(`data-${key}`,'1');b.textContent=label;b.onclick=()=>{window.location.href=path};
    if(after?.nextSibling)nav.insertBefore(b,after.nextSibling);else nav.appendChild(b);
    return b;
   };
   let image=[...nav.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='이미지 발송');
   if(window.location.pathname!=='/image-send'&&!image){const first=nav.querySelector('button');image=ensure('이미지 발송','/image-send','image-send-link',first)}
   if(window.location.pathname!=='/inline-posts')ensure('게시물 관리','/inline-posts','inline-posts-link',image||nav.querySelector('button'));
  };
  install();
  const ob=new MutationObserver(install);ob.observe(document.body,{childList:true,subtree:true});
  return()=>ob.disconnect();
 },[]);
 return null;
}
