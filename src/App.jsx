import { useState } from 'react';
import { Layout, message, Tooltip, Spin } from 'antd';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import {
  DashboardOutlined,
  SwapOutlined,
  SettingOutlined,
  BarChartOutlined,
  WalletOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  LogoutOutlined,
  DownOutlined,
  MoreOutlined,
} from '@ant-design/icons';
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
  { key: 'overview', path: '/', icon: <DashboardOutlined />, label: 'Overview', badge: null },
  { key: 'transactions', path: '/transactions', icon: <SwapOutlined />, label: 'Transactions', badge: null },
  { key: 'analytics', path: '/analytics', icon: <BarChartOutlined />, label: 'Analytics', badge: null },
  { key: 'budgets', path: '/budgets', icon: <WalletOutlined />, label: 'Budgets', badge: null },
  { key: 'settings', path: '/settings', icon: <SettingOutlined />, label: 'Settings', badge: null },
];

const HEADER_MAP = {
  '/': { title: 'Financial Overview', subtitle: 'Your money at a glance' },
  '/transactions': { title: 'Transactions', subtitle: 'Log expenses and income — synced live' },
  '/analytics': { title: 'Analytics', subtitle: 'Deep dive into your spending patterns' },
  '/budgets': { title: 'Budgets', subtitle: 'Set monthly limits and track spending' },
  '/settings': { title: 'Settings', subtitle: 'Account & notification preferences' },
};

/* ─────────────────── Sidebar ─────────────────── */

// Derive display name + initials from Supabase user object
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
      {/* ── Logo lockup ── */}
      <div className="mm-logo-wrap">
        <div className="mm-logo-icon">
          {/* Stylised ‘M’ monogram */}
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
            <path
              d="M3 15V5l7 7 7-7v10"
              stroke="#fff"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <div>
          <div className="mm-logo-text">
            Money<span>Matters</span>
          </div>
          <div className="mm-logo-version">Personal Finance</div>
        </div>
      </div>

      {/* ── Main nav ── */}
      <div style={{ padding: '8px 0', marginTop: 4 }}>
        <div className="mm-nav-section-label">Menu</div>
        {NAV_ITEMS.map((item) => (
          <div
            key={item.key}
            id={`nav-${item.key}`}
            role="button"
            tabIndex={0}
            className={`mm-menu-item ${activeKey === item.key ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(item.path)}
          >
            <span className="mm-menu-icon">{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && <span className="mm-menu-badge">{item.badge}</span>}
          </div>
        ))}
      </div>

      {/* ── Footer: user profile card + quick actions ── */}
      <div className="mm-sidebar-footer">

        {/* User chip */}
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
            <MoreOutlined style={{ fontSize: 14, color: '#9ca3af' }} />
          </div>
        </Tooltip>

        {/* Quick actions */}
        <div
          className="mm-sidebar-action"
          onClick={() => message.info('Help & documentation')}
        >
          <span className="mm-menu-icon"><QuestionCircleOutlined /></span>
          Help & Docs
        </div>
        <div
          className="mm-sidebar-action danger"
          onClick={async () => {
            await signOut();
            message.success('Signed out successfully');
          }}
        >
          <span className="mm-menu-icon"><LogoutOutlined /></span>
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
    <div
      className="mm-header"
      style={{
        position: 'fixed', top: 0, left: 224, right: 0, zIndex: 150,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 28px', height: 62,
        background: '#fff',
        borderBottom: '1px solid #eaecf0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Left: page title */}
      <div className="mm-header-left">
        <div className="mm-header-title">{title}</div>
        <div className="mm-header-subtitle">{subtitle}</div>
      </div>

      {/* Right: controls */}
      <div className="mm-header-right">
        {/* Notification bell */}
        <button
          className="mm-notif-btn"
          id="header-notifications"
          onClick={() => message.info('No new notifications')}
          title="Notifications"
        >
          <BellOutlined />
        </button>

        {/* User chip + dropdown */}
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
          <DownOutlined style={{ fontSize: 10, color: '#98a2b3', marginLeft: 2 }} />

          {showDropdown && (
            <div
              style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#fff', border: '1px solid #eaecf0', borderRadius: 12,
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)', padding: '6px',
                minWidth: 200, zIndex: 999,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* User info header */}
              <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid #f2f4f7', marginBottom: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#101828' }}>{display}</div>
                <div style={{ fontSize: 12, color: '#667085', marginTop: 1 }}>{email}</div>
              </div>

              {/* Menu items */}
              {[
                { label: '👤 Profile', action: () => message.info('Settings coming soon!') },
                { label: '🔔 Notifications', action: () => message.info('No new notifications') },
                { label: '💳 Billing', action: () => message.info('Free plan — upgrade coming soon!') },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() => { item.action(); setShowDropdown(false); }}
                  style={{
                    padding: '9px 12px', fontSize: 13, color: '#344054',
                    fontWeight: 500, borderRadius: 8, cursor: 'pointer', transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  {item.label}
                </div>
              ))}

              {/* Sign out */}
              <div style={{ borderTop: '1px solid #f2f4f7', marginTop: 4, paddingTop: 4 }}>
                <div
                  onClick={handleSignOut}
                  style={{
                    padding: '9px 12px', fontSize: 13, color: '#f04438',
                    fontWeight: 500, borderRadius: 8, cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fff1f3')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  🚪 Sign Out
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─────────────────── Placeholder ─────────────────── */
function PlaceholderPage({ emoji, title, subtitle }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 12, textAlign: 'center',
    }}>
      <div style={{ fontSize: 48 }}>{emoji}</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: '#101828' }}>{title}</div>
      <div style={{ fontSize: 14, color: '#667085', maxWidth: 320 }}>{subtitle}</div>
    </div>
  );
}

/* ─────────────────── Protected layout wrapper ─────────────────── */
function DashboardLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div style={{ marginLeft: 224, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main
          className="mm-content"
          style={{
            flex: 1, marginTop: 62, padding: '28px 40px',
            background: '#f4f5f7', minHeight: 'calc(100vh - 62px)',
            width: 'calc(100vw - 224px)', overflowX: 'hidden'
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<AddTransaction />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Layout>
  );
}

/* ─────────────────── App root ─────────────────── */
export default function App() {
  const { user, loading } = useAuth();

  // Show spinner while Supabase resolves the session
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: '#f4f5f7',
      }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <Signup />}
      />
      {/* Always public — Supabase password-reset links land here */}
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Protected routes — redirect to /login if not logged in */}
      <Route
        path="/*"
        element={user ? <DashboardLayout /> : <Navigate to="/login" replace />}
      />
    </Routes>
  );
}

