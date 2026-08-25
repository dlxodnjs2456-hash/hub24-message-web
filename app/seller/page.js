'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {api} from '../../lib/api';

const money=n=>Number(n||0).toLocaleString('ko-KR')+' P';

export default function SellerPage(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null),[seller,setSeller]=useState(null),[categories,setCategories]=useState([]),[wallet,setWallet]=useState(null);
 const [sellerName,setSellerName]=useState(''),[sellerIntro,setSellerIntro]=useState('');
 const [product,setProduct]=useState({category_id:'',title:'',description:'',price:'',stock:''});
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
 async function load(){try{const [me,c,w]=await Promise.all([api.sellerMe(),api.marketCategories(),api.wallet()]);setSeller(me.item||null);setCategories(c.items||[]);setWallet(w.wallet||null)}catch(e){alert(e.message)}}
 useEffect(()=>{if(session)load()},[session]);
 if(!ready)return <div className="authPage"><div className="authCard">판매자센터를 불러오는 중...</div></div>;
 if(!session)return <div className="authPage"><div className="authCard"><h1>HUB24 <span>SELLER</span></h1><p>먼저 로그인하세요.</p><a className="btn primary" href="/">로그인 화면</a></div></div>;
 async function apply(){if(!sellerName.trim())return alert('판매자명을 입력하세요.');try{await api.sellerApply({seller_name:sellerName.trim(),introduction:sellerIntro||null});await load();alert('판매자 등록 신청이 접수되었습니다.')}catch(e){alert(e.message)}}
 async function addProduct(){if(!product.title.trim()||Number(product.price)<0)return alert('상품명과 가격을 확인하세요.');try{await api.createProduct({category_id:product.category_id?Number(product.category_id):null,title:product.title,description:product.description||null,price:Number(product.price),stock:product.stock===''?null:Number(product.stock)});setProduct({category_id:'',title:'',description:'',price:'',stock:''});alert('판매상품을 등록했습니다.')}catch(e){alert(e.message)}}
 const approved=seller?.status==='APPROVED';
 return <main className="sellerCenterPage">
   <div className="sectionTitle sellerTitle"><div><span className="eyebrow">SELLER CENTER</span><h1>판매자센터</h1><p>판매상품 등록과 판매대금 관리를 위한 전용 공간입니다.</p></div><a className="softButton" href="/market">자유시장으로</a></div>
   {!seller?<section className="sellerApplyCard"><div><h2>판매자 등록</h2><p>관리자 승인 후 상품 등록과 직접 거래 판매자로 노출됩니다.</p></div><div className="sellerForm"><label><span>판매자명</span><input value={sellerName} onChange={e=>setSellerName(e.target.value)} placeholder="상점 또는 판매자 이름"/></label><label><span>판매자 소개</span><textarea value={sellerIntro} onChange={e=>setSellerIntro(e.target.value)} placeholder="주요 판매 분야와 안내사항을 적어주세요."/></label><button onClick={apply}>판매자 등록 신청</button></div></section>:!approved?<section className="sellerApplyCard"><div><h2>판매자 심사 상태</h2><p>현재 상태: <b>{seller.status}</b></p><div className="escrowNotice">관리자 승인 후 판매상품 등록과 직접 거래 기능이 활성화됩니다.</div></div></section>:<>
    <section className="sellerDashboard">
      <div className="sellerSummary"><span>판매자</span><strong>{seller.seller_name}</strong><small>Lv.{seller.level||1}</small></div>
      <div><span>완료 거래</span><strong>{Number(seller.completed_sales||0).toLocaleString()}건</strong></div>
      <div><span>누적 판매</span><strong>{money(seller.total_sales_amount)}</strong></div>
      <div><span>출금 가능</span><strong>{money(wallet?.settlement_balance)}</strong><a href="/wallet?tab=withdraw">출금 관리</a></div>
    </section>
    <section className="sellerProductBox"><div className="sectionTitle"><h2>새 상품 등록</h2><p>등록된 상품은 자유시장 전체보기와 선택한 카테고리에 노출됩니다.</p></div><div className="sellerProductForm"><label><span>카테고리</span><select value={product.category_id} onChange={e=>setProduct({...product,category_id:e.target.value})}><option value="">기타</option>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label><span>가격</span><input type="number" value={product.price} onChange={e=>setProduct({...product,price:e.target.value})} placeholder="10000"/></label><label className="wide"><span>상품명</span><input value={product.title} onChange={e=>setProduct({...product,title:e.target.value})} placeholder="판매 상품명을 입력하세요."/></label><label><span>재고</span><input type="number" value={product.stock} onChange={e=>setProduct({...product,stock:e.target.value})} placeholder="빈 값 = 제한 없음"/></label><label className="wide"><span>상품 설명</span><textarea value={product.description} onChange={e=>setProduct({...product,description:e.target.value})} placeholder="구매자가 알아야 할 내용을 입력하세요."/></label><button onClick={addProduct}>상품 등록</button></div></section>
   </>}
 </main>
}
