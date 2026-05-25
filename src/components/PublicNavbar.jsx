import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const T = {
  bg: '#0B0F19', border: '#1E2535', primary: '#6366F1', primaryHov: '#4F46E5',
  text1: '#F1F5F9', text2: '#64748B', text3: '#3D4A5C', surface: '#131720', surfaceUp: '#1A202E',
  font: "'IBM Plex Sans', system-ui, sans-serif",
};

export default function PublicNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 900);
  const location = useLocation();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const navLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav style={S.nav}>
      <div style={S.inner}>
        <Link to="/" style={S.logo}>
          <div style={S.logoIcon}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 15V5l7 7 7-7v10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span style={S.logoText}>Money<span style={{ color: T.primary }}>Matters</span></span>
        </Link>

        {!isMobile && (
          <div style={S.links}>
            {navLinks.map(l => <a key={l.label} href={l.href} style={S.link}>{l.label}</a>)}
          </div>
        )}

        {!isMobile && (
          <div style={S.actions}>
            <Link to="/login" style={S.signIn}>Sign In</Link>
            <Link to="/login" style={S.cta}>Get Started →</Link>
          </div>
        )}

        {isMobile && (
          <button style={S.hamburger} onClick={() => setMenuOpen(v => !v)} aria-label="Toggle menu">
            <span style={{ ...S.bar, transform: menuOpen ? 'rotate(45deg) translateY(6px)' : 'none' }} />
            <span style={{ ...S.bar, opacity: menuOpen ? 0 : 1 }} />
            <span style={{ ...S.bar, transform: menuOpen ? 'rotate(-45deg) translateY(-6px)' : 'none' }} />
          </button>
        )}
      </div>

      {/* Slide-down mobile menu */}
      {isMobile && menuOpen && (
        <div style={S.dropdown}>
          {navLinks.map(l => <a key={l.label} href={l.href} style={S.dropLink}>{l.label}</a>)}
          <div style={S.dropDivider} />
          <Link to="/login" style={S.dropLink}>Sign In</Link>
          <Link to="/login" style={S.dropCta}>Get Started →</Link>
        </div>
      )}
    </nav>
  );
}

const S = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
    background: T.bg, borderBottom: `1px solid ${T.border}`,
    fontFamily: T.font,
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 24px',
    height: 80, display: 'flex', alignItems: 'center', gap: 32,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 },
  logoIcon: {
    width: 36, height: 36, borderRadius: 10,
    background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 18, fontWeight: 700, color: T.text1, letterSpacing: '-0.2px' },
  links: { display: 'flex', alignItems: 'center', gap: 32, flex: 1 },
  link: { fontSize: 16, fontWeight: 500, color: T.text2, textDecoration: 'none', transition: 'color 150ms' },
  actions: { display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 },
  signIn: { fontSize: 16, fontWeight: 500, color: T.text2, textDecoration: 'none', transition: 'color 150ms' },
  cta: {
    fontSize: 16, fontWeight: 600, color: '#fff', textDecoration: 'none',
    padding: '12px 24px', borderRadius: 8, background: T.primary,
    transition: 'background 150ms',
  },
  hamburger: {
    display: 'flex', flexDirection: 'column', gap: 4,
    background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginLeft: 'auto',
  },
  bar: { display: 'block', width: 20, height: 1.5, background: T.text1, borderRadius: 1, transition: 'all 200ms' },
  dropdown: {
    borderTop: `1px solid ${T.border}`,
    background: T.bg, padding: '16px 24px',
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  dropLink: { fontSize: 15, fontWeight: 500, color: T.text2, textDecoration: 'none', padding: '10px 0', borderBottom: `1px solid ${T.border}` },
  dropDivider: { height: 1, background: T.border, margin: '4px 0' },
  dropCta: {
    marginTop: 12, padding: '12px 20px', background: T.primary,
    borderRadius: 8, fontSize: 15, fontWeight: 600, color: '#fff',
    textDecoration: 'none', textAlign: 'center', transition: 'background 150ms',
  },
};
