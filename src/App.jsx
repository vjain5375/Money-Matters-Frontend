import { useState } from 'react';
import { Layout, message, Tooltip, Spin } from 'antd';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Settings,
  BarChart2,
  Wallet,
  Bell,
  HelpCircle,
  LogOut,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';
import Budgets from './pages/Budgets';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import { useAuth } from './context/AuthContext';
import './index.css';

const { Sider } = Layout;

/* ─── Navigation config ─── */
const NAV_ITEMS = [
  { key: 'overview', path: '/', icon: LayoutDashboard, label: 'Overview' },
  { key: 'transactions', path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { key: 'analytics', path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { key: 'budgets', path: '/budgets', icon: Wallet, label: 'Budgets' },
  { key: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
];

const HEADER_MAP = {
  '/': { title: 'Financial Overview', subtitle: 'Your money at a glance' },
  '/transactions': { title: 'Transactions', subtitle: 'Log expenses and income — synced live' },
  '/analytics': { title: 'Analytics', subtitle: 'Deep dive into your spending patterns' },
  '/budgets': { title: 'Budgets', subtitle: 'Set monthly limits and track spending' },
  '/settings': { title: 'Settings', subtitle: 'Account & notification preferences' },
};

/* ─── Helpers ─── */
function getUserInfo(user) {
  const meta = user?.user_metadata ?? {};
  const fullName = meta.full_name || meta.name || '';
  const email = user?.email ?? '';
  const display = fullName || email.split('@')[0] || 'User';
  const initials = fullName
    ? fullName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : email.slice(0, 2).toUpperCase();
  return { display, initials, email };
}

/* ─────────────────── Sidebar ─────────────────── */
function Sidebar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { signOut, user } = useAuth();
  const activeKey = NAV_ITEMS.find((n) => n.path === pathname)?.key ?? 'overview';
  const { display, initials, email } = getUserInfo(user);

  return (
    <Sider
      className="mm-sider"
      width={224}
      style={{ position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 200, overflow: 'hidden' }}
      trigger={null}
    >
      {/* Logo */}
      <div className="mm-logo-wrap">
        <div className="mm-logo-icon">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M3 15V5l7 7 7-7v10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div>
          <div className="mm-logo-text">Money<span>Matters</span></div>
          <div className="mm-logo-version">Personal Finance</div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ padding: '6px 0', marginTop: 4 }}>
        <div className="mm-nav-section-label">Menu</div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeKey === item.key;
          return (
            <motion.div
              key={item.key}
              id={`nav-${item.key}`}
              role="button"
              tabIndex={0}
              className={`mm-menu-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
              whileTap={{ scale: 0.97 }}
            >
              <span className="mm-menu-icon">
                <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mm-sidebar-footer">
        <Tooltip title={email} placement="right" mouseEnterDelay={0.4}>
          <div
            className="mm-sidebar-user-card"
            onClick={() => message.info('Account settings coming soon')}
          >
            <div className="mm-sidebar-avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="mm-sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {display}
              </div>
              <div className="mm-sidebar-user-plan">Free Plan</div>
            </div>
            <MoreHorizontal size={14} style={{ color: '#475569', flexShrink: 0 }} />
          </div>
        </Tooltip>

        <div className="mm-sidebar-action" onClick={() => message.info('Help & documentation')}>
          <span className="mm-menu-icon"><HelpCircle size={14} /></span>
          Help & Docs
        </div>
        <div
          className="mm-sidebar-action danger"
          onClick={async () => {
            await signOut();
            message.success('Signed out successfully');
          }}
        >
          <span className="mm-menu-icon"><LogOut size={14} /></span>
          Sign Out
        </div>
      </div>
    </Sider>
  );
}

/* ─────────────────── Header ─────────────────── */
function Header() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const { title, subtitle } = HEADER_MAP[pathname] ?? HEADER_MAP['/'];
  const { display, initials, email } = getUserInfo(user);

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
    message.success('Signed out successfully');
  };

  return (
    <div className="mm-header">
      {/* Left */}
      <div className="mm-header-left">
        <div className="mm-header-title">{title}</div>
        <div className="mm-header-subtitle">{subtitle}</div>
      </div>

      {/* Right */}
      <div className="mm-header-right">
        <button
          className="mm-notif-btn"
          id="header-notifications"
          onClick={() => message.info('No new notifications')}
          title="Notifications"
        >
          <Bell size={15} />
        </button>

        {/* User chip */}
        <div
          className="mm-user-chip"
          id="header-user-chip"
          onClick={() => setShowDropdown((p) => !p)}
          style={{ position: 'relative' }}
        >
          <div className="mm-avatar">{initials}</div>
          <div>
            <div className="mm-user-name">{display}</div>
            <div className="mm-user-role">{email}</div>
          </div>
          <ChevronDown size={12} style={{ color: '#9CA3AF', marginLeft: 2 }} />

          {showDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
                boxShadow: '0 8px 30px rgba(15,23,42,0.10)', padding: '6px',
                minWidth: 200, zIndex: 999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid #F3F4F6', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{display}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 1 }}>{email}</div>
              </div>
              {[
                { label: '👤 Profile', action: () => message.info('Settings coming soon!') },
                { label: '🔔 Notifications', action: () => message.info('No new notifications') },
                { label: '💳 Billing', action: () => message.info('Free plan — upgrade coming soon!') },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => { item.action(); setShowDropdown(false); }}
                  style={{
                    padding: '9px 12px', fontSize: 13, color: '#374151',
                    fontWeight: 500, borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {item.label}
                </div>
              ))}
              <div style={{ borderTop: '1px solid #F3F4F6', marginTop: 4, paddingTop: 4 }}>
                <div
                  onClick={handleSignOut}
                  style={{ padding: '9px 12px', fontSize: 13, color: '#DC2626', fontWeight: 500, borderRadius: 8, cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#FEF2F2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  🚪 Sign Out
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── Page Transition ─────────────────── */
const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15 } },
};

function PageTransition({ children }) {
  const { pathname } = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        className="page-transition"
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

/* ─────────────────── Protected Layout ─────────────────── */
function DashboardLayout() {
  const location = useLocation();
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 224, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main
          className="mm-content"
          style={{
            flex: 1, marginTop: 60,
            width: 'calc(100vw - 224px)', overflowX: 'hidden',
          }}
        >
          <PageTransition>
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<AddTransaction />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageTransition>
        </main>
      </div>
    </Layout>
  );
}

/* ─────────────────── App Root ─────────────────── */
export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#F8F9FB',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/*"
        element={user ? <DashboardLayout /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}
