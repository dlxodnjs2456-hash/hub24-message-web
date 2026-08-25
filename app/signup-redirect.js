'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

export default function SignupRedirect(){
 const p=usePathname();
 useEffect(()=>{
   if(p!=='/')return;
   const go=()=>{location.href='/signup'};
   const click=e=>{
     const b=e.target?.closest?.('button');
     if(!b)return;
     if(b.textContent?.trim()==='회원가입'&&b.closest('.authTabs')){
       e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();go();
     }
   };
   const key=e=>{
     if(e.key!=='Enter')return;
     const active=document.querySelector('.authTabs button.active');
     if(active?.textContent?.trim()==='회원가입'){
       e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();go();
     }
   };
   document.addEventListener('click',click,true);
   document.addEventListener('keydown',key,true);
   return()=>{document.removeEventListener('click',click,true);document.removeEventListener('keydown',key,true)};
 },[p]);
 return null;
}
