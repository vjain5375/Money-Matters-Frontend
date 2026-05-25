import { Link } from 'react-router-dom';

const T = {
  bg: '#0B0F19', border: '#1E2535', borderSub: '#252D3D',
  primary: '#6366F1', text1: '#F1F5F9', text2: '#64748B', text3: '#3D4A5C',
  font: "'IBM Plex Sans', system-ui, sans-serif",
};

export default function PublicFooter() {
  return (
    <footer style={S.footer}>
      <div style={S.inner}>
        <div style={S.grid}>
          {/* Col 1 */}
          <div style={S.col}>
            <Link to="/" style={S.logo}>
              <div style={S.logoIcon}>
                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                  <path d="M3 15V5l7 7 7-7v10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={S.logoText}>Money<span style={{ color: T.primary }}>Matters</span></span>
            </Link>
            <p style={S.tagline}>Know where every rupee goes. AI-powered personal finance for India.</p>
            <div style={S.socials}>
              {[
                { label: 'X', href: 'https://twitter.com', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill={T.text2}><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg> },
                { label: 'LinkedIn', href: 'https://linkedin.com', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill={T.text2}><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg> },
                { label: 'Instagram', href: 'https://instagram.com', svg: <svg width="14" height="14" viewBox="0 0 24 24" fill={T.text2}><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={S.socialIcon} aria-label={s.label}>{s.svg}</a>
              ))}
            </div>
          </div>

          {/* Col 2 */}
          <div style={S.col}>
            <div style={S.colHead}>PRODUCT</div>
            <div style={S.colLinks}>
              <a href="/#features" style={S.footLink}>Features</a>
              <Link to="/login" style={S.footLink}>Dashboard</Link>
              <Link to="/signup" style={S.footLink}>Get Started</Link>
            </div>
          </div>

          {/* Col 3 */}
          <div style={S.col}>
            <div style={S.colHead}>LEGAL</div>
            <div style={S.colLinks}>
              <Link to="/terms" style={S.footLink}>Terms of Service</Link>
              <Link to="/privacy" style={S.footLink}>Privacy Policy</Link>
            </div>
          </div>

          {/* Col 4 */}
          <div style={S.col}>
            <div style={S.colHead}>COMPANY</div>
            <div style={S.colLinks}>
              <Link to="/about" style={S.footLink}>About</Link>
              <Link to="/contact" style={S.footLink}>Contact</Link>
              <a href="mailto:money.matters.ai.2026@gmail.com" style={S.footLink}>Support</a>
            </div>
          </div>
        </div>

        <div style={S.bottom}>
          <span>© 2025 MoneyMatters. All rights reserved.</span>
          <span>Made in India</span>
        </div>
      </div>
    </footer>
  );
}

const S = {
  footer: { background: T.bg, borderTop: `1px solid ${T.border}`, padding: '64px 0 0', fontFamily: T.font },
  inner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 32, marginBottom: 48 },
  col: {},
  logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 12 },
  logoIcon: { width: 26, height: 26, borderRadius: 6, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 15, fontWeight: 700, color: T.text1, letterSpacing: '-0.2px' },
  tagline: { fontSize: 13, color: T.text3, lineHeight: 1.6, marginBottom: 20, maxWidth: 220 },
  socials: { display: 'flex', gap: 8 },
  socialIcon: { width: 32, height: 32, borderRadius: 8, border: `1px solid ${T.borderSub}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' },
  colHead: { fontSize: 11, fontWeight: 600, color: T.text3, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 },
  colLinks: { display: 'flex', flexDirection: 'column', gap: 10 },
  footLink: { fontSize: 14, color: T.text2, textDecoration: 'none', transition: 'color 150ms', lineHeight: 1.5 },
  bottom: { borderTop: `1px solid ${T.border}`, padding: '24px 0', display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: T.text3 },
};
