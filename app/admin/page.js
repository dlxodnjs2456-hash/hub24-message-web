'use client';
import {useEffect,useState} from 'react';
import {supabase} from '../../lib/supabase';
import {BASE} from '../../lib/api';

export default function AdminPage(){
 const [ready,setReady]=useState(false),[session,setSession]=useState(null);
 useEffect(()=>{supabase.auth.getSession().then(({data})=>{setSession(data.session||null);setReady(true)})},[]);
 if(!ready)return <div className="authPage"><div className="authCard"><h1>HUB24 <span>ADMIN</span></h1><p>권한 확인 중...</p></div></div>;
 const isAdmin=session?.user?.app_metadata?.role==='admin';
 if(!session||!isAdmin)return <div className="authPage"><div className="authCard"><h1>HUB24 <span>ADMIN</span></h1><p>관리자 권한이 없습니다.</p><a className="btn" href="/">사용자 화면으로 이동</a></div></div>;
 return <main className="content" style={{maxWidth:900,margin:'0 auto'}}><div className="head"><div><h1>HUB24 ADMIN</h1><p>운영자 전용 시스템 정보</p></div><a className="btn" href="/">사용자 화면</a></div><section className="card"><h2>Worker 연결</h2><div className="form"><label className="field full"><span>Worker URL</span><input className="input" readOnly value={BASE}/></label><label className="field full"><span>인증 방식</span><input className="input" readOnly value="Supabase JWT"/></label></div><div className="note">service_role key, 암호화 키 등 민감정보는 이 화면에도 표시하지 않습니다.</div></section><section className="card" style={{marginTop:14}}><h2>운영 원칙</h2><ul className="list"><li>사용자별 SESSION / DB / JOB 분리</li><li>기존 stock-topic 테이블 변경 금지</li><li>Telegram 제한 감지 시 작업 중단</li><li>자동 계정교체·제한 우회 없음</li></ul></section></main>;
}
