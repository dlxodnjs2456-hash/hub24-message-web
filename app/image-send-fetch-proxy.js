'use client';
import {useEffect} from 'react';

export default function ImageSendFetchProxy(){
 useEffect(()=>{
  const original=window.fetch.bind(window);
  window.fetch=async(input,init={})=>{
   try{
    if(window.location.pathname==='/image-send'){
     const raw=typeof input==='string'?input:(input?.url||'');
     const u=new URL(raw,window.location.origin);
     if(u.pathname==='/v1/image-jobs'){
      return original('/api/image-jobs',init);
     }
     const m=u.pathname.match(/^\/v1\/jobs\/(\d+)\/start$/);
     if(m){
      return original(`/api/image-jobs/${m[1]}/start`,init);
     }
    }
   }catch{}
   return original(input,init);
  };
  return()=>{window.fetch=original};
 },[]);
 return null;
}
