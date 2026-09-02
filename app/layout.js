import './globals.css';
import './marketplace.css';
import './ui-hotfix.css';
import './market-vip.css';
import './angel-theme.css';
import './brand-overrides.css';
import './community.css';
import './paid-banners.css';
import './banner-board-tweaks.css';
import './market-chat.css';
import TopNav from './topnav';
import SignupRedirect from './signup-redirect';
import UsernameAuthOverlay from './username-auth-overlay';
import SendAssignmentControls from './send-assignment-controls';
import SidebarImageSendLink from './sidebar-image-send-link';
import ChatMediaEnhancer from './chat-media-enhancer';
import ImageSendFetchProxy from './image-send-fetch-proxy';
import ImageSendInlineLabels from './image-send-inline-labels';
import BeginnerFlowGuide from './beginner-flow-guide';
import TopnavTelegramCommunity from './topnav-telegram-community';

export const metadata={title:'ANGEL PAY · N PAY',description:'ANGEL PAY marketplace, escrow, community and messaging platform'};

export default function RootLayout({children}){
  return <html lang="ko"><body><SignupRedirect/><UsernameAuthOverlay/><TopNav/><TopnavTelegramCommunity/><SendAssignmentControls/><SidebarImageSendLink/><ChatMediaEnhancer/><ImageSendFetchProxy/><ImageSendInlineLabels/><BeginnerFlowGuide/>{children}</body></html>;
}
