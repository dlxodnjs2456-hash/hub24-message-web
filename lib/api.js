import {supabase} from './supabase';

export const BASE=process.env.NEXT_PUBLIC_WORKER_URL||'https://hub24-message-worker.onrender.com';

async function request(path, options={}){
  const {data:{session}}=await supabase.auth.getSession();
  if(!session?.access_token)throw new Error('로그인이 필요합니다.');
  const res=await fetch(BASE+path,{...options,headers:{'Content-Type':'application/json','Authorization':`Bearer ${session.access_token}`,...(options.headers||{})}});
  if(!res.ok){let detail='';try{detail=(await res.json()).detail||''}catch{};throw new Error(detail||`HTTP ${res.status}`)}
  const ct=res.headers.get('content-type')||'';return ct.includes('application/json')?res.json():res.text();
}

export const api={
  health:async()=>{const res=await fetch(BASE+'/health');if(!res.ok)throw new Error(`HTTP ${res.status}`);return res.json()},
  accounts:()=>request('/v1/accounts'),connectStart:(payload)=>request('/v1/accounts/connect/start',{method:'POST',body:JSON.stringify(payload)}),connectVerify:(payload)=>request('/v1/accounts/connect/verify',{method:'POST',body:JSON.stringify(payload)}),deleteAccount:(id)=>request(`/v1/accounts/${id}`,{method:'DELETE'}),refreshAccount:(id)=>request(`/v1/accounts/${id}/status`,{method:'POST'}),updateProxy:(id,proxy_url)=>request(`/v1/accounts/${id}/proxy`,{method:'PUT',body:JSON.stringify({proxy_url})}),dialogs:(id)=>request(`/v1/accounts/${id}/dialogs?limit=100`),messages:(id,peerId)=>request(`/v1/accounts/${id}/dialogs/${peerId}/messages?limit=100`),
  uploadSessions:async(files,apiId,apiHash)=>{const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token)throw new Error('로그인이 필요합니다.');const fd=new FormData();[...files].forEach(f=>fd.append('files',f));fd.append('api_id',String(apiId));fd.append('api_hash',apiHash);const res=await fetch(BASE+'/v1/accounts/sessions/upload',{method:'POST',headers:{'Authorization':`Bearer ${session.access_token}`},body:fd});if(!res.ok){let detail='';try{detail=(await res.json()).detail||''}catch{};throw new Error(detail||`HTTP ${res.status}`)}return res.json()},
  uploadBatch:async(file)=>{const {data:{session}}=await supabase.auth.getSession();if(!session?.access_token)throw new Error('로그인이 필요합니다.');const fd=new FormData();fd.append('file',file);const res=await fetch(BASE+'/v1/batches/upload',{method:'POST',headers:{'Authorization':`Bearer ${session.access_token}`},body:fd});if(!res.ok){let detail='';try{detail=(await res.json()).detail||''}catch{};throw new Error(detail||`HTTP ${res.status}`)}return res.json()},
  batches:()=>request('/v1/batches'),batchContacts:(id)=>request(`/v1/batches/${id}/contacts?limit=5000`),deleteBatchContacts:(id,ids)=>request(`/v1/batches/${id}/contacts/delete`,{method:'POST',body:JSON.stringify({ids})}),deleteAllBatchContacts:(id)=>request(`/v1/batches/${id}/contacts`,{method:'DELETE'}),deleteBatch:(id)=>request(`/v1/batches/${id}`,{method:'DELETE'}),
  jobs:()=>request('/v1/jobs'),createJob:(payload)=>request('/v1/jobs',{method:'POST',body:JSON.stringify(payload)}),job:(id)=>request(`/v1/jobs/${id}`),targets:(id)=>request(`/v1/jobs/${id}/targets?limit=1000`),startJob:(id)=>request(`/v1/jobs/${id}/start`,{method:'POST'}),pauseJob:(id)=>request(`/v1/jobs/${id}/pause`,{method:'POST'}),stopJob:(id)=>request(`/v1/jobs/${id}/stop`,{method:'POST'}),resetProcessing:(id)=>request(`/v1/jobs/${id}/reset-processing`,{method:'POST'}),reassignJob:(id)=>request(`/v1/jobs/${id}/reassign`,{method:'POST'}),logs:(id)=>request(`/v1/jobs/${id}/events?limit=300`),

  communityPosts:(board='FREE')=>request(`/v1/community/posts?board_type=${encodeURIComponent(board)}`),
  communityPost:(id)=>request(`/v1/community/posts/${id}`),
  createCommunityPost:(payload)=>request('/v1/community/posts',{method:'POST',body:JSON.stringify(payload)}),
  addCommunityComment:(id,content)=>request(`/v1/community/posts/${id}/comments`,{method:'POST',body:JSON.stringify({content})}),
  communityPermissions:()=>request('/v1/community/permissions'),

  marketCategories:()=>request('/v1/market/categories'),
  marketBanners:()=>request('/v1/market/banners'),
  marketSellers:(search='')=>request(`/v1/market/sellers?search=${encodeURIComponent(search)}`),
  sellerMe:()=>request('/v1/market/seller/me'),sellerApply:(payload)=>request('/v1/market/seller/apply',{method:'POST',body:JSON.stringify(payload)}),updateSellerProfile:(payload)=>request('/v1/market/seller/profile',{method:'PUT',body:JSON.stringify(payload)}),
  vipInfo:()=>request('/v1/market/vip-info'),purchaseVip:()=>request('/v1/market/seller/vip',{method:'POST'}),
  marketProducts:(categoryId='')=>request(`/v1/market/products${categoryId?`?category_id=${categoryId}`:''}`),
  createProduct:(payload)=>request('/v1/market/products-v2',{method:'POST',body:JSON.stringify(payload)}),
  buyProduct:(id,quantity=1)=>request(`/v1/market/products/${id}/buy`,{method:'POST',body:JSON.stringify({quantity})}),
  directEscrow:(payload)=>request('/v1/market/direct-escrow',{method:'POST',body:JSON.stringify(payload)}),
  marketTrades:()=>request('/v1/market/trades'),tradeMessages:(id)=>request(`/v1/market/trades/${id}/messages`),sendTradeMessage:(id,message)=>request(`/v1/market/trades/${id}/messages`,{method:'POST',body:JSON.stringify({message})}),sellerComplete:(id)=>request(`/v1/market/trades/${id}/seller-complete`,{method:'POST'}),buyerComplete:(id)=>request(`/v1/market/trades/${id}/buyer-complete`,{method:'POST'}),cancelTrade:(id)=>request(`/v1/market/trades/${id}/cancel-request`,{method:'POST'}),disputeTrade:(id)=>request(`/v1/market/trades/${id}/dispute`,{method:'POST'}),

  wallet:()=>request('/v1/wallet'),chargeRequests:()=>request('/v1/wallet/charge-requests'),requestCharge:(payload)=>request('/v1/wallet/charge-requests',{method:'POST',body:JSON.stringify(payload)}),withdrawals:()=>request('/v1/wallet/withdrawals'),requestWithdrawal:(amount)=>request('/v1/wallet/withdrawals',{method:'POST',body:JSON.stringify({amount})}),

  adminMarketOverview:()=>request('/v1/admin/market/overview'),adminAddCategory:(payload)=>request('/v1/admin/market/categories',{method:'POST',body:JSON.stringify(payload)}),adminUpdateCategory:(id,payload)=>request(`/v1/admin/market/categories/${id}`,{method:'PUT',body:JSON.stringify(payload)}),adminMarketSettings:(payload)=>request('/v1/admin/market/settings',{method:'PUT',body:JSON.stringify(payload)}),adminVipSettings:(payload)=>request('/v1/admin/market/vip-settings',{method:'PUT',body:JSON.stringify(payload)}),adminSellerStatus:(id,status)=>request(`/v1/admin/market/sellers/${id}`,{method:'PUT',body:JSON.stringify({status})}),adminResolveTrade:(id,action)=>request(`/v1/admin/market/trades/${id}/resolve`,{method:'POST',body:JSON.stringify({action})}),adminResolveCharge:(id,action)=>request(`/v1/admin/market/charges/${id}/resolve`,{method:'POST',body:JSON.stringify({action})}),adminResolveWithdrawal:(id,action)=>request(`/v1/admin/market/withdrawals/${id}/resolve`,{method:'POST',body:JSON.stringify({action})}),
  adminBanners:()=>request('/v1/admin/market/banners'),adminAddBanner:(payload)=>request('/v1/admin/market/banners',{method:'POST',body:JSON.stringify(payload)}),adminUpdateBanner:(id,payload)=>request(`/v1/admin/market/banners/${id}`,{method:'PUT',body:JSON.stringify(payload)}),adminDeleteBanner:(id)=>request(`/v1/admin/market/banners/${id}`,{method:'DELETE'}),
};
