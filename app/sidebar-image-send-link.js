'use client';
import {useEffect} from 'react';

export default function SidebarImageSendLink(){
 useEffect(()=>{
  const install=()=>{
   if(window.location.pathname==='/image-send')return;
   const nav=document.querySelector('.sidebar .nav');
   if(!nav)return;
   const already=[...nav.querySelectorAll('button')].some(x=>(x.textContent||'').trim()==='이미지 발송');
   if(already||nav.querySelector('[data-image-send-link="1"]'))return;
   const first=nav.querySelector('button');
   const b=document.createElement('button');
   b.type='button';
   b.dataset.imageSendLink='1';
   b.textContent='이미지 발송';
   b.onclick=()=>{window.location.href='/image-send'};
   if(first&&first.nextSibling)nav.insertBefore(b,first.nextSibling);else nav.appendChild(b);
  };
  install();
  const ob=new MutationObserver(install);ob.observe(document.body,{childList:true,subtree:true});
  return()=>ob.disconnect();
 },[]);
 return null;
}
