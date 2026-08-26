import './globals.css';
import './marketplace.css';
import './ui-hotfix.css';
import './market-vip.css';
import './angel-theme.css';
import './brand-overrides.css';
import './community.css';
import './paid-banners.css';
import './banner-board-tweaks.css';
import TopNav from './topnav';
import SignupRedirect from './signup-redirect';
import SendAssignmentControls from './send-assignment-controls';
import BoardNotices from './board-notices';

export const metadata={title:'ANGEL PAY · N PAY',description:'ANGEL PAY marketplace, escrow, community and messaging platform'};

export default function RootLayout({children}){
  return <html lang="ko"><body><SignupRedirect/><TopNav/><BoardNotices/><SendAssignmentControls/>{children}</body></html>;
}
