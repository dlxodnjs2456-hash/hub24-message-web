'use client';
import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

export default function SignupRedirect(){
 const p=usePathname();
 useEffect(()=>{
   if(p!=='/')return;
   const h=e=>{
     const b=e.target?.closest?.('button');
     if(!b)return;
     if(b.textContent?.trim()==='회원가입'&&b.closest('.authTabs')){
       e.preventDefault();e.stopPropagation();e.stopImmediatePropagation?.();location.href='/signup';
     }
   };
   document.addEventListener('click',h,true);
   return()=>document.removeEventListener('click',h,true);
 },[p]);
 return null;
}
