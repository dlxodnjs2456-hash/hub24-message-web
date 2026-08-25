import './globals.css';
import './marketplace.css';
import TopNav from './topnav';

export const metadata={title:'HUB24 MESSAGE',description:'Telegram messaging operations dashboard'};

export default function RootLayout({children}){
  return <html lang="ko"><body><TopNav/>{children}</body></html>;
}
