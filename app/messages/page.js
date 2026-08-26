'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {marketChatApi} from '../../lib/market-chat-api';

const dt=v=>v?String(v).replace('T',' ').slice(0,16):'';
const roomTitle=t=>`${t?.product?.title||'상품 문의'} · ${t?.seller?.seller_name||'판매자'}`;

export default function MessagesPage(){
 const [session,setSession]=useState(null),[ready,setReady]=useState(false),[threads,setThreads]=useState([]),[selected,setSelected]=useState(null),[messages,setMessages]=useState([]),[text,setText]=useState('');
 useEffect(()=>{supabase.auth.getSession().then(async({data})=>{setSession(data.session||null);setReady(true);if(data.session){await load();const q=new URLSearchParams(window.location.search);const thread=q.get('thread'),seller=q.get('seller'),product=q.get('product');if(thread){try{await openThread({id:Number(thread)})}catch(e){alert(e.message)}}else if(seller){try{const r=await marketChatApi.open(seller,product?Number(product):null);await load();await openThread(r.item)}catch(e){alert(e.message)}}}})},[]);
 async function load(){try{const r=await marketChatApi.list();setThreads(r.items||[])}catch(e){alert(e.message)}}
 async function openThread(t){try{const r=await marketChatApi.messages(t.id);const merged={...t,...(r.thread||{})};setSelected(merged);setMessages(r.items||[])}catch(e){alert(e.message)}}
 async function send(){if(!selected||!text.trim())return;try{await marketChatApi.send(selected.id,text.trim());setText('');await openThread(selected);await load()}catch(e){alert(e.message)}}
 useEffect(()=>{if(!session)return;const id=setInterval(()=>{load();if(selected)openThread(selected)},4000);return()=>clearInterval(id)},[session,selected?.id]);
 if(!ready)return <main className="marketChatPage"><div className="card">대화를 불러오는 중...</div></main>;
 if(!session)return <main className="marketChatPage"><div className="card">로그인이 필요합니다.</div></main>;
 return <main className="marketChatPage">
  <div className="marketChatTop"><div><span className="eyebrow">N PAY MESSAGE</span><h1>1:1 대화</h1><p>구매 전 판매자와 사이트 내부에서 대화할 수 있습니다.</p></div><a className="softButton" href="/market">자유시장으로</a></div>
  <section className="marketChatWorkspace">
   <aside className="marketChatThreads">{threads.length?threads.map(t=><button key={t.id} className={selected?.id===t.id?'active':''} onClick={()=>openThread(t)}><b>{roomTitle(t)}</b><span>{t.seller?.telegram_username?`Telegram ${t.seller.telegram_username}`:'Telegram ID 미등록'}</span><small>{dt(t.updated_at)}</small></button>):<div className="marketChatEmpty">대화가 없습니다.</div>}</aside>
   <div className="marketChatRoom">{selected?<><div className="marketChatHead"><div><b>{roomTitle(selected)}</b><span>{selected.seller?.telegram_username?`Telegram ${selected.seller.telegram_username}`:'Telegram ID 미등록'}</span></div></div><div className="marketChatMessages">{messages.length?messages.map(m=><div key={m.id} className={'marketChatBubble '+(String(m.sender_id)===String(session.user.id)?'mine':'other')}><p>{m.message}</p><small>{dt(m.created_at)}</small></div>):<div className="marketChatEmpty">첫 메시지를 보내보세요.</div>}</div><div className="marketChatComposer"><input value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="메시지를 입력하세요." maxLength={4000}/><button onClick={send}>전송</button></div></>:<div className="marketChatEmpty">왼쪽에서 대화를 선택하세요.</div>}</div>
  </section>
 </main>;
}
