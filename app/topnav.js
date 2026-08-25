'use client';
import {usePathname} from 'next/navigation';

export default function TopNav(){
 const p=usePathname();
 if(p?.startsWith('/admin'))return null;
 const item=(href,label,active)=> <a href={href} style={{padding:'9px 14px',borderRadius:9,textDecoration:'none',fontSize:12,fontWeight:800,color:active?'#fff':'#9fb0c5',background:active?'#1d4ed8':'transparent',border:'1px solid '+(active?'#2563eb':'transparent')}}>{label}</a>;
 return <div style={{height:54,display:'flex',alignItems:'center',gap:6,padding:'0 18px',background:'#080c12',borderBottom:'1px solid #243246',position:'sticky',top:0,zIndex:50}}>
   <b style={{marginRight:12}}>HUB24</b>
   {item('/','메시지',p==='/')}
   {item('/wallet','포인트',p?.startsWith('/wallet'))}
   {item('/market','자유시장',p?.startsWith('/market'))}
   <a href="/?guide=1" style={{padding:'9px 14px',textDecoration:'none',fontSize:12,fontWeight:800,color:'#9fb0c5'}}>사용방법</a>
 </div>
}
