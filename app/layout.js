import './globals.css';
import './marketplace.css';
import './ui-hotfix.css';
import './market-vip.css';
import './angel-theme.css';
import TopNav from './topnav';

export const metadata={title:'ANGEL PAY · N PAY',description:'ANGEL PAY marketplace, escrow and messaging platform'};

export default function RootLayout({children}){
  return <html lang="ko"><body><TopNav/>{children}</body></html>;
}
