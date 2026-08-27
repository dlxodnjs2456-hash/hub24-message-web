import {NextResponse} from 'next/server';

const WORKER=process.env.NEXT_PUBLIC_WORKER_URL||'https://hub24-message-worker.onrender.com';

export async function POST(req,{params}){
  try{
    const authorization=req.headers.get('authorization')||'';
    const id=String(params?.id||'').trim();
    if(!id)return NextResponse.json({detail:'JOB_ID_REQUIRED'},{status:400});
    const r=await fetch(`${WORKER}/v1/jobs/${encodeURIComponent(id)}/start`,{
      method:'POST',
      headers:{'Authorization':authorization},
      cache:'no-store',
    });
    const text=await r.text();
    return new NextResponse(text,{status:r.status,headers:{'Content-Type':r.headers.get('content-type')||'application/json'}});
  }catch(e){
    return NextResponse.json({detail:`IMAGE_JOB_START_PROXY_FAILED:${String(e?.message||e)}`},{status:502});
  }
}
