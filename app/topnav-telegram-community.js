'use client';
import {useEffect} from 'react';

export default function TopnavTelegramCommunity(){
 useEffect(()=>{
  const install=()=>{
   const nav=document.querySelector('header nav');
   if(!nav)return;
   const links=[...nav.querySelectorAll('a')];
   const telbal=links.find(a=>(a.textContent||'').trim()==='텔발');
   if(telbal)telbal.style.display='none';
   let community=nav.querySelector('[data-telegram-community-nav="1"]');
   if(!community){
    community=document.createElement('a');
    community.dataset.telegramCommunityNav='1';
    community.href='/telegram-community';
    community.textContent='텔레그램 커뮤니티';
    const guide=links.find(a=>(a.textContent||'').trim()==='사용방법');
    if(guide)nav.insertBefore(community,guide);else nav.appendChild(community);
   }
   const sample=links.find(a=>(a.textContent||'').trim()==='가입자 검수')||links[0];
   if(sample){
    community.style.cssText=sample.style.cssText;
    community.style.display='flex';
    if(window.location.pathname.startsWith('/telegram-community')){
     community.style.color='#fff';
     community.style.borderBottom='3px solid #69b7ff';
    }else{
     community.style.borderBottom='3px solid transparent';
    }
   }
  };
  install();
  const ob=new MutationObserver(install);ob.observe(document.body,{childList:true,subtree:true});
  return()=>ob.disconnect();
 },[]);
 return null;
}
