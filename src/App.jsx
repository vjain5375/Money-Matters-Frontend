import { useState, useEffect, useRef } from 'react';
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
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Mail,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import Dashboard from './components/Dashboard';
import AddTransaction from './components/AddTransaction';
import Analytics from './pages/Analytics';
import SettingsPage from './pages/Settings';
import Budgets from './pages/Budgets';
import StockAnalysis from './pages/StockAnalysis';
import Watchlist from './pages/Watchlist';
import StockComparison from './pages/StockComparison';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { safeSetItem, safeGetItem, safeSetJson, safeGetJson } from './utils/storage';
import ResetPassword from './pages/ResetPassword';
import Terms from './pages/Terms';
import PrivacyPolicy from './pages/PPolicy';
import LandingPage from './pages/LandingPage';
import About from './pages/About';
import Contact from './pages/Contact';
import { useAuth } from './context/AuthContext';
import { supabase } from './supabaseClient';
import HelpDocs from './pages/HelpDocs';
import './index.css';

const { Sider } = Layout;

const API_BASE = import.meta.env.VITE_STOCK_API_URL || 'http://localhost:8000';

/* ─── Navigation config ─── */
const NAV_ITEMS = [
  { key: 'overview', path: '/', icon: LayoutDashboard, label: 'Overview' },
  { key: 'transactions', path: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { key: 'analytics', path: '/analytics', icon: BarChart2, label: 'Analytics' },
  { key: 'budgets', path: '/budgets', icon: Wallet, label: 'Budgets' },
  { key: 'stocks', path: '/stocks', icon: TrendingUp, label: 'Stocks' },
  { key: 'settings', path: '/settings', icon: Settings, label: 'Settings' },
  { key: 'contact', path: '/contact', icon: Mail, label: 'Contact Us' },
  { key: 'privacy', path: '/privacy', icon: ShieldCheck, label: 'Privacy Policy' },
  { key: 'terms', path: '/terms', icon: FileText, label: 'Terms & Conditions' },
];

const HEADER_MAP = {
  '/': { title: 'Financial Overview', subtitle: 'Your money at a glance' },
  '/transactions': { title: 'Transactions', subtitle: 'Log expenses and income — synced live' },
  '/analytics': { title: 'Analytics', subtitle: 'Deep dive into your spending patterns' },
  '/budgets': { title: 'Budgets', subtitle: 'Set monthly limits and track spending' },
  '/stocks': { title: 'Stock Analyser', subtitle: '' },
  '/settings': { title: 'Settings', subtitle: 'Account & notification preferences' },
  '/docs': { title: 'Help & Documentation', subtitle: 'Guides, tutorials, and support for Money Matters All' },
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

        <div className="mm-sidebar-action" onClick={() => navigate('/docs')}>
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
import { Menu as MenuIcon, X } from 'lucide-react';
import { Drawer } from 'antd';

const CATEGORY_META = {
  food: { label: 'Food & Dining', icon: '🍜' },
  shopping: { label: 'Shopping', icon: '🛍️' },
  transport: { label: 'Transport', icon: '🚕' },
  utilities: { label: 'Utilities', icon: '⚡' },
  entertainment: { label: 'Entertainment', icon: '🎬' },
  subscriptions: { label: 'Subscriptions', icon: '🔁' },
  health: { label: 'Health & Medical', icon: '💊' },
  other: { label: 'Other', icon: '📌' }
};

const getMostRecentMarketSessionStart = () => {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utc + (3600000 * 5.5));
  
  const currentDay = istTime.getDay();
  const currentHour = istTime.getHours();
  
  const sessionToday = new Date(istTime);
  sessionToday.setHours(9, 0, 0, 0);

  let sessionStart = new Date(sessionToday);

  if (currentDay === 0) { // Sunday
    sessionStart.setDate(sessionToday.getDate() - 2);
  } else if (currentDay === 6) { // Saturday
    sessionStart.setDate(sessionToday.getDate() - 1);
  } else if (currentDay === 1 && currentHour < 9) { // Monday before 9:00 AM
    sessionStart.setDate(sessionToday.getDate() - 3);
  } else if (currentHour < 9) { // Weekday before 9:00 AM
    sessionStart.setDate(sessionToday.getDate() - 1);
  }
  
  const istOffset = 5.5 * 60 * 60 * 1000;
  return sessionStart.getTime() - istOffset;
};

function Header() {
  const { pathname } = useLocation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [notifications, setNotifications] = useState(() => {
    const parsed = safeGetJson('mm_notifications', []);
    // Filter out any legacy hardcoded placeholder notifications
    return parsed.filter(n => n.id !== 1 && n.id !== 2 && n.id !== 3 && n.id !== 4 && !String(n.id).includes('budget-dining'));
  });

  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef(null);

  // Initialize notifications with user specific welcome, check budgets dynamically, and fetch real stock notifications
  useEffect(() => {
    if (!user) return;

    const initializeAndFetchNotifications = async () => {
      try {
        const { display } = getUserInfo(user);
        const parsed = safeGetJson('mm_notifications', []);
        let list = parsed.filter(n => n.id !== 1 && n.id !== 2 && n.id !== 3 && n.id !== 4 && !String(n.id).includes('budget-dining'));

        // Clear stock market notifications from previous sessions
        const sessionStart = getMostRecentMarketSessionStart();
        list = list.filter(n => {
          const isStockNotif = String(n.id).startsWith('real-gainer-') ||
                               String(n.id).startsWith('real-loser-') ||
                               String(n.id).startsWith('real-nifty-');
          if (isStockNotif) {
            const itemTime = n.timestamp || 0;
            return itemTime >= sessionStart;
          }
          return true;
        });

        // Check if there is a welcome notification for this user
        const welcomeId = `welcome-${user.id}`;
        const welcomeShownKey = `mm_welcome_shown_${user.id}`;
        const welcomeShown = safeGetItem(welcomeShownKey);

        if (!welcomeShown) {
          const hasWelcome = list.some(n => n.id === welcomeId);
          if (!hasWelcome) {
            list.unshift({
              id: welcomeId,
              title: `Welcome, ${display}!`,
              description: "Welcome to Money Matters All! Let's start tracking your personal finances and investments.",
              type: "success",
              time: "Just now",
              read: false
            });
          }
          safeSetItem(welcomeShownKey, 'true');
        }

        // Fetch user budgets and transactions from Supabase
        const now = new Date();
        const thisMonth = now.getMonth() + 1;
        const thisYear = now.getFullYear();

        const [budgetRes, txnRes] = await Promise.all([
          supabase.from('budgets').select('*'),
          supabase.from('transactions').select('amount, category, date, type')
        ]);

        const budgetAlerts = [];
        if (!budgetRes.error && !txnRes.error && budgetRes.data && txnRes.data) {
          // Compute spent map
          const spentMap = {};
          txnRes.data.filter(t => {
            const d = new Date(t.date);
            return t.type === 'debit' && (d.getMonth() + 1) === thisMonth && d.getFullYear() === thisYear;
          }).forEach(t => {
            spentMap[t.category] = (spentMap[t.category] || 0) + Number(t.amount);
          });

          // Check limits
          budgetRes.data.forEach(b => {
            const spent = spentMap[b.category] || 0;
            const limit = Number(b.limit);
            if (limit > 0) {
              const pct = (spent / limit) * 100;
              const categoryLabel = CATEGORY_META[b.category]?.label || b.category;
              if (spent > limit) {
                budgetAlerts.push({
                  id: `real-budget-exceeded-${b.category}-${thisMonth}-${thisYear}`,
                  title: `⚠️ Budget Exceeded: ${categoryLabel}`,
                  description: `You have spent ₹${spent.toLocaleString('en-IN')} of your monthly limit of ₹${limit.toLocaleString('en-IN')} for ${categoryLabel}.`,
                  type: "warning",
                  time: "Just now",
                  read: false
                });
              } else if (pct >= 80) {
                budgetAlerts.push({
                  id: `real-budget-alert-${b.category}-${thisMonth}-${thisYear}`,
                  title: `⚠️ Budget Alert: ${categoryLabel}`,
                  description: `You have spent ${pct.toFixed(0)}% of your monthly limit of ₹${limit.toLocaleString('en-IN')} for ${categoryLabel}.`,
                  type: "warning",
                  time: "Just now",
                  read: false
                });
              }
            }
          });
        }

        // Filter out existing budget alert notifications that are no longer valid (e.g. limit increased, or under limit)
        const activeBudgetIds = budgetAlerts.map(ba => ba.id);
        list = list.filter(n => {
          if (String(n.id).startsWith('real-budget-exceeded-') || String(n.id).startsWith('real-budget-alert-')) {
            return activeBudgetIds.includes(n.id);
          }
          return true;
        });

        // Add new active budget alerts
        budgetAlerts.forEach(ba => {
          const exists = list.some(n => n.id === ba.id);
          if (!exists) {
            list.unshift(ba);
          }
        });

        // Fetch Stock Market Notifications
        try {
          const res = await fetch(`${API_BASE}/stock/market-overview`);
          if (res.ok) {
            const marketData = await res.json();
            const realNotifs = [];

            // Real Top Gainer
            if (marketData.top_gainers?.length > 0) {
              const gainer = marketData.top_gainers[0];
              realNotifs.push({
                id: `real-gainer-${gainer.symbol}-${Date.now()}`,
                title: `🔥 Top Gainer: ${gainer.name}`,
                description: `${gainer.symbol} surged +${gainer.change_pct?.toFixed(2)}% today, trading at ₹${gainer.price?.toLocaleString('en-IN')}.`,
                type: "success",
                time: "Market Active",
                read: false,
                timestamp: Date.now()
              });
            }

            // Real Top Loser
            if (marketData.top_losers?.length > 0) {
              const loser = marketData.top_losers[0];
              realNotifs.push({
                id: `real-loser-${loser.symbol}-${Date.now()}`,
                title: `📉 Top Loser: ${loser.name}`,
                description: `${loser.symbol} fell ${loser.change_pct?.toFixed(2)}% today, trading at ₹${loser.price?.toLocaleString('en-IN')}.`,
                type: "warning",
                time: "Market Active",
                read: false,
                timestamp: Date.now()
              });
            }

            // Real Nifty Update
            if (marketData.indices) {
              const nifty = marketData.indices['NIFTY 50'];
              if (nifty) {
                realNotifs.push({
                  id: `real-nifty-${Date.now()}`,
                  title: `📊 NIFTY 50 Update`,
                  description: `NIFTY 50 index is currently at ${nifty.price?.toLocaleString('en-IN')} (${nifty.change_pct >= 0 ? '+' : ''}${nifty.change_pct?.toFixed(2)}% today).`,
                  type: "info",
                  time: "Market Active",
                  read: false,
                  timestamp: Date.now()
                });
              }
            }

            // Append real stock notifications avoiding duplicate titles
            realNotifs.forEach(rn => {
              const exists = list.some(n => n.title === rn.title);
              if (!exists) {
                list.unshift(rn);
              }
            });
          }
        } catch (err) {
          console.error("Failed to fetch market data for notifications:", err);
        }

        // Limit maximum notifications to 15
        const finalMerged = list.slice(0, 15);
        safeSetJson('mm_notifications', finalMerged);
        setNotifications(finalMerged);

      } catch (error) {
        console.error("Error setting up notifications:", error);
      }
    };

    initializeAndFetchNotifications();

    // Listen for custom events to refresh notifications when budgets or transactions change
    window.addEventListener('refresh-notifications', initializeAndFetchNotifications);
    return () => {
      window.removeEventListener('refresh-notifications', initializeAndFetchNotifications);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target) && !e.target.closest('#header-notifications') && !e.target.closest('.mm-notif-btn')) {
        setShowNotifDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markRead = (id) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    setNotifications(updated);
    safeSetJson('mm_notifications', updated);
  };

  const markAllRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    safeSetJson('mm_notifications', updated);
    message.success('All notifications marked as read');
  };

  const clearAll = () => {
    setNotifications([]);
    safeSetJson('mm_notifications', []);
    message.success('Notifications cleared');
  };

  const clearNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    safeSetJson('mm_notifications', updated);
  };

  const { title, subtitle } = HEADER_MAP[pathname] || { title: 'Money Matters', subtitle: '' };

  const { display, initials, email } = getUserInfo(user);

  const handleSignOut = async () => {
    setShowDropdown(false);
    await signOut();
    message.success('Signed out successfully');
  };

  const activeKey = NAV_ITEMS.find((n) => n.path === pathname)?.key ?? 'overview';

  return (
    <>
      <div className="mm-header">
        {/* Left */}
        <div className="mm-header-left">
          <div className="mm-header-title">{title}</div>
          <div className="mm-header-subtitle">{subtitle}</div>
        </div>

        <div className="mm-mobile-nav-trigger" onClick={() => setMobileMenuOpen(true)}>
          <MenuIcon size={20} />
        </div>

        {/* Right */}
        <div className="mm-header-right">
          <div style={{ position: 'relative' }}>
            <button
              className="mm-notif-btn"
              id="header-notifications"
              onClick={() => setShowNotifDropdown((p) => !p)}
              title="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute', top: -2, right: -2,
                  background: '#EF4444', color: '#fff', fontSize: 9,
                  fontWeight: 700, borderRadius: '50%', minWidth: 14,
                  height: 14, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', padding: '0 2px', border: '1.5px solid #fff'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifDropdown && (
              <motion.div
                ref={notifRef}
                className="mm-notif-dropdown"
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Notifications</div>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', color: '#4F46E5', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                      Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9CA3AF', fontSize: 13 }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.map((n) => {
                      const Icon = n.type === 'warning' ? AlertTriangle : n.type === 'success' ? CheckCircle : n.type === 'info' ? Info : Bell;
                      const iconColor = n.type === 'warning' ? '#F59E0B' : n.type === 'success' ? '#10B981' : n.type === 'info' ? '#3B82F6' : '#6B7280';
                      return (
                        <div
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          style={{
                            display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid #F3F4F6',
                            cursor: 'pointer', background: n.read ? '#fff' : 'rgba(79, 70, 229, 0.02)',
                            transition: 'background 0.15s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#F9FAFB'}
                          onMouseLeave={(e) => e.currentTarget.style.background = n.read ? '#fff' : 'rgba(79, 70, 229, 0.02)'}
                        >
                          <div style={{ color: iconColor, marginTop: 2, flexShrink: 0 }}>
                            <Icon size={16} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{n.title}</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                {!n.read && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4F46E5' }} />}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    clearNotification(n.id);
                                  }}
                                  style={{
                                    background: 'none', border: 'none', padding: 2, cursor: 'pointer',
                                    color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    borderRadius: '50%', transition: 'all 0.15s',
                                  }}
                                  onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#FEE2E2'; }}
                                  onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.background = 'none'; }}
                                >
                                  <X size={13} />
                                </button>
                              </div>
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 1.4 }}>{n.description}</div>
                            <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>{n.time}</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div style={{ padding: '8px 16px', borderTop: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button onClick={clearAll} style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: 12, fontWeight: 600, cursor: 'pointer', padding: 0 }}>
                    Clear all
                  </button>
                  <button onClick={() => setShowNotifDropdown(false)} style={{ background: 'none', border: 'none', color: '#64748B', fontSize: 12, fontWeight: 500, cursor: 'pointer', padding: 0 }}>
                    Close
                  </button>
                </div>
              </motion.div>
            )}
          </div>

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
                  { label: '👤 Profile', action: () => navigate('/settings') },
                  { label: '🔔 Notifications', action: () => setShowNotifDropdown(true) },
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

      {/* Mobile Menu Drawer */}
      <Drawer
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={260}
        styles={{ body: { padding: 0, background: '#0F172A' }, header: { display: 'none' } }}
        closable={false}
      >
        <div style={{ padding: '20px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="mm-logo-text" style={{ color: '#F8FAFC' }}>Money<span>Matters</span></div>
          <X size={20} style={{ color: '#94A3B8', cursor: 'pointer' }} onClick={() => setMobileMenuOpen(false)} />
        </div>
        
        <div style={{ padding: '12px 0' }}>
          <div className="mm-nav-section-label">Menu</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <div
                key={item.key}
                className={`mm-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => { navigate(item.path); setMobileMenuOpen(false); }}
                style={{ margin: '2px 12px' }}
              >
                <span className="mm-menu-icon">
                  <Icon size={16} strokeWidth={isActive ? 2.2 : 1.8} />
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div 
            className="mm-sidebar-action" 
            onClick={() => {
              navigate('/docs');
              setMobileMenuOpen(false);
            }}
            style={{ padding: '6px 0', color: '#94A3B8' }}
          >
            <span className="mm-menu-icon" style={{ display: 'inline-flex', alignItems: 'center', marginRight: 10 }}><HelpCircle size={16} /></span>
            Help & Docs
          </div>
          <div 
            className="mm-sidebar-action danger" 
            onClick={async () => {
              await signOut();
              setMobileMenuOpen(false);
              message.success('Signed out');
            }}
            style={{ padding: '6px 0' }}
          >
            <span className="mm-menu-icon" style={{ display: 'inline-flex', alignItems: 'center', marginRight: 10 }}><LogOut size={16} /></span>
            Sign Out
          </div>
        </div>
      </Drawer>
    </>
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
      <div className="app-content-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%', boxSizing: 'border-box' }}>
        <Header />
        <main
          className="mm-content"
          style={{
            flex: 1, marginTop: 60,
            width: '100%', overflowX: 'hidden',
          }}
        >
          <PageTransition>
            <Routes location={location}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/transactions" element={<AddTransaction />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/budgets" element={<Budgets />} />
              <Route path="/stocks" element={<StockAnalysis />} />
              <Route path="/stocks/watchlist" element={<Watchlist />} />
              <Route path="/stocks/compare" element={<StockComparison />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/docs" element={<HelpDocs />} />
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
      {/* Public marketing pages */}
      <Route path="/home" element={<LandingPage />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      {/* Auth pages — redirect to dashboard if already logged in */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* Dashboard — redirect to landing if not logged in */}
      <Route
        path="/*"
        element={user ? <DashboardLayout /> : <LandingPage />}
      />
    </Routes>
  );
}
