'use client';

import {useEffect} from 'react';
import {usePathname} from 'next/navigation';

function enhance(){
  const tables=[...document.querySelectorAll('table')];
  for(const table of tables){
    const headers=[...table.querySelectorAll('thead th')].map(x=>(x.textContent||'').trim());
    const progressIndex=headers.indexOf('진행');
    const statusIndex=headers.indexOf('상태');
    if(progressIndex<0||statusIndex<0)continue;

    for(const row of table.querySelectorAll('tbody tr')){
      const cells=[...row.querySelectorAll('td')];
      if(cells.length<=Math.max(progressIndex,statusIndex))continue;
      const cell=cells[progressIndex];
      const raw=(cell.dataset.progressRaw||cell.textContent||'').trim();
      if(!cell.dataset.progressRaw)cell.dataset.progressRaw=raw;
      const m=raw.match(/([\d,]+)\s*\/\s*([\d,]+)/);
      if(!m)continue;
      const done=Number(m[1].replace(/,/g,''))||0;
      const total=Number(m[2].replace(/,/g,''))||0;
      const status=(cells[statusIndex].textContent||'').trim();
      const pct=total>0?Math.max(0,Math.min(100,Math.round(done/total*100))):0;
      const running=status.includes('검수중')||status.toUpperCase().includes('RUNNING');
      const complete=status.includes('완료')||status.toUpperCase().includes('COMPLETED');
      const cls=running&&done===0?'npay-check-progress-fill indeterminate':'npay-check-progress-fill';
      const width=running&&done===0?28:(complete?100:pct);
      cell.innerHTML=`<div class="npay-check-progress-wrap"><div class="npay-check-progress-track"><div class="${cls}" style="width:${width}%"></div></div><div class="npay-check-progress-text"><b>${complete?100:pct}%</b><span>${done.toLocaleString('ko-KR')} / ${total.toLocaleString('ko-KR')}</span></div></div>`;
    }
  }
}

export default function CheckerProgressEnhancer(){
  const pathname=usePathname();
  useEffect(()=>{
    if(pathname!=='/checker')return;
    enhance();
    const observer=new MutationObserver(()=>enhance());
    observer.observe(document.body,{subtree:true,childList:true,characterData:true});
    const timer=setInterval(enhance,1000);
    return()=>{observer.disconnect();clearInterval(timer)};
  },[pathname]);
  if(pathname!=='/checker')return null;
  return <style jsx global>{`
    .npay-check-progress-wrap{min-width:150px;display:flex;flex-direction:column;gap:5px}
    .npay-check-progress-track{height:8px;border-radius:999px;background:#14283e;overflow:hidden;border:1px solid #24435f}
    .npay-check-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#2f88ff,#5db8ff);transition:width .45s ease}
    .npay-check-progress-fill.indeterminate{animation:npayCheckerMove 1.15s ease-in-out infinite;transform-origin:left center}
    .npay-check-progress-text{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#8fa7c0;white-space:nowrap}
    .npay-check-progress-text b{color:#dcecff;font-size:11px}
    @keyframes npayCheckerMove{0%{transform:translateX(-105%)}50%{transform:translateX(145%)}100%{transform:translateX(350%)}}
  `}</style>;
}
