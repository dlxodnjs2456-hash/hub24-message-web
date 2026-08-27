import {NextResponse} from 'next/server';

const WORKER=process.env.NEXT_PUBLIC_WORKER_URL||'https://hub24-message-worker.onrender.com';

export async function POST(req){
  try{
    const authorization=req.headers.get('authorization')||'';
    const body=await req.text();
    const r=await fetch(`${WORKER}/v1/image-jobs`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':authorization},
      body,
      cache:'no-store',
    });
    const text=await r.text();
    return new NextResponse(text,{status:r.status,headers:{'Content-Type':r.headers.get('content-type')||'application/json'}});
  }catch(e){
    return NextResponse.json({detail:`IMAGE_JOB_PROXY_FAILED:${String(e?.message||e)}`},{status:502});
  }
}
