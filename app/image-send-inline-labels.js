'use client';
import {useEffect} from 'react';

export default function ImageSendInlineLabels(){
 useEffect(()=>{
  if(window.location.pathname!=='/image-send')return;
  const patch=()=>{
   document.querySelectorAll('h1,h2,p,span,label').forEach(el=>{
    if(el.children.length)return;
    const t=el.textContent||'';
    if(t.includes('PostBot 이미지+버튼 게시물 코드'))el.textContent=t.replace('PostBot 이미지+버튼 게시물 코드','내 게시물 코드');
    else if(t.includes('PostBot 게시물'))el.textContent=t.replace('PostBot 게시물','내 Inline 게시물');
   });
   const input=[...document.querySelectorAll('input')].find(x=>(x.placeholder||'').includes('40599'));
   if(input)input.placeholder='예: STOCK001';
  };
  patch();const ob=new MutationObserver(patch);ob.observe(document.body,{childList:true,subtree:true});return()=>ob.disconnect();
 },[]);
 return null;
}
