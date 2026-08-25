export default function AdminLayout({children}){
 const a={color:'#b8d2ea',textDecoration:'none',fontSize:10,padding:'7px 10px',border:'1px solid #315575',borderRadius:8};
 return <><div style={{position:'sticky',top:0,zIndex:90,display:'flex',alignItems:'center',gap:8,padding:'10px 20px',background:'#09182a',borderBottom:'1px solid #294b6d',flexWrap:'wrap'}}><b style={{color:'#e9f4ff',marginRight:10,fontSize:13}}>ANGEL PAY ADMIN</b><a href="/admin" style={a}>관리자 메인</a><a href="/admin/members" style={a}>회원 관리</a><a href="/admin/banner-settings" style={a}>광고 슬롯 설정</a><a href="/admin/referrals" style={a}>추천인 설정</a><a href="/admin/usdt" style={a}>USDT 자동충전</a><a href="/admin/withdrawals" style={a}>출금 상세관리</a><a href="/admin/logs" style={a}>관리자 로그</a></div>{children}</>;
}
