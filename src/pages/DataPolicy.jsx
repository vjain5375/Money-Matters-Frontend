import { Link } from 'react-router-dom';

const T = {
    bg: '#0B0F19', surface: '#131720', surfaceUp: '#1A202E',
    border: '#252D3D', borderSub: '#1E2535',
    primary: '#6366F1', text1: '#F1F5F9', text2: '#64748B', text3: '#3D4A5C',
    sans: "'IBM Plex Sans', system-ui, sans-serif",
    serif: "'Plus Jakarta Sans', system-ui, sans-serif",
};

const SECTIONS = [
    { title: 'Information We Collect', items: [
        { h: 'Account Information', t: 'When you sign up, we collect your email address and optionally your display name.' },
        { h: 'Financial Data', t: 'You manually enter transaction details. This data is stored in your private Supabase vault — only you can access it.' },
        { h: 'Usage Data', t: 'We may collect anonymized feature usage data to improve the product. It is never linked to your identity.' },
    ]},
    { title: 'How We Use AI & Your Data', items: [
        { h: 'ML Categorization', t: 'Transaction descriptions are sent to our ML API to auto-detect categories. The API call is stateless — nothing is persisted on our ML servers.' },
        { h: 'AI Financial Advisor', t: 'Aggregated spending data (not raw descriptions) generates financial insights via an LLM, processed in real-time only.' },
        { h: 'Stock Analysis', t: 'Stock data is fetched from public market APIs. No personal data is sent to these APIs.' },
    ]},
    { title: 'Data Security', items: [
        { h: 'Row-Level Security (RLS)', t: 'All financial data uses Supabase RLS policies — every query is enforced server-side so you can only access your own data.' },
        { h: 'Encryption', t: 'Data encrypted in transit (HTTPS/TLS) and at rest (AES-256). Your password is never stored — we use Supabase Auth.' },
        { h: 'No Data Selling', t: 'We do not sell, rent, or trade your personal or financial data to any third party, ever.' },
    ]},
    { title: 'Your Rights', items: [
        { h: 'Access & Portability', t: 'You can view all your data directly within the app at any time.' },
        { h: 'Deletion', t: 'Delete individual transactions in-app. To delete your account, contact us and we will process within 30 days.' },
        { h: 'Correction', t: 'You can edit or correct any of your financial data at any time within the app.' },
    ]},
    { title: 'Changes to This Policy', items: [
        { h: 'Notification', t: 'We may update this policy periodically. We will notify you of significant changes by updating the "Last updated" date below.' },
    ]},
];

export default function DataPolicy() {
    return (
        <div style={S.page}>
            <div style={S.nav}>
                <Link to="/" style={S.logo}>
                    <div style={S.logoIcon}>
                        <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                            <path d="M3 15V5l7 7 7-7v10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span style={S.logoText}>Money<span style={{ color: T.primary }}>Matters</span></span>
                </Link>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                    <Link to="/terms" style={S.navLink}>Terms of Service</Link>
                    <Link to="/login" style={S.navBack}>← Back to Login</Link>
                </div>
            </div>

            <div style={S.container}>
                <div style={S.hero}>
                    <div style={S.badge}>DATA POLICY</div>
                    <h1 style={S.heroTitle}>Privacy Policy</h1>
                    <p style={S.heroSub}>Your financial data is deeply personal. We are committed to being transparent about how we handle your information.</p>
                    <div style={S.heroMeta}>
                        <span>Last updated: May 16, 2025</span>
                        <span>·</span>
                        <span>India-focused</span>
                    </div>
                </div>

                <div style={S.tldr}>
                    <div style={S.tldrTitle}>TL;DR — Plain English</div>
                    <div style={S.tldrGrid}>
                        {[
                            { t: 'Your data belongs to you, not us.' },
                            { t: 'We never sell your data to anyone.' },
                            { t: 'Bank-grade RLS encryption on all data.' },
                            { t: 'AI is used to help you, not profile you.' },
                            { t: 'Delete your account anytime.' },
                            { t: 'No tracking cookies, ever.' },
                        ].map((x, i) => (
                            <div key={i} style={S.tldrItem}>
                                <span style={S.tldrText}>• {x.t}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {SECTIONS.map((sec, i) => (
                    <div key={i} style={S.section}>
                        <div style={S.secHeader}>
                            <h2 style={S.secTitle}>{sec.title}</h2>
                        </div>
                        {sec.items.map((item, j) => (
                            <div key={j} style={S.subsection}>
                                <div style={S.subH}>{item.h}</div>
                                <p style={S.subT}>{item.t}</p>
                            </div>
                        ))}
                    </div>
                ))}

                <div style={S.footerCard}>
                    <div>
                        <div style={S.footerTitle}>Questions about your data?</div>
                        <div style={S.footerSub}>We believe in radical transparency. Reach out and we'll explain in plain language.</div>
                    </div>
                    <Link to="/login" style={S.footerBtn}>Open App →</Link>
                </div>
            </div>
        </div>
    );
}

const S = {
    page: { minHeight: '100vh', background: T.bg, fontFamily: T.sans, color: T.text2 },
    nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 40px', borderBottom: `1px solid ${T.borderSub}`, position: 'sticky', top: 0, background: T.bg, zIndex: 100 },
    logo: { display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' },
    logoIcon: { width: 26, height: 26, borderRadius: 6, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    logoText: { fontSize: 14, fontWeight: 700, color: T.text1 },
    navLink: { fontSize: 13, color: T.text2, textDecoration: 'none' },
    navBack: { fontSize: 13, fontWeight: 600, color: T.primary, textDecoration: 'none' },
    container: { maxWidth: 720, margin: '0 auto', padding: '80px 24px' },
    hero: { textAlign: 'left', marginBottom: 60, borderBottom: `1px solid ${T.borderSub}`, paddingBottom: 40 },
    badge: { display: 'inline-block', fontSize: 12, fontWeight: 600, color: T.text2, letterSpacing: '0.08em', marginBottom: 16 },
    heroTitle: { fontFamily: T.serif, fontSize: 48, fontWeight: 800, color: T.text1, margin: '0 0 16px' },
    heroSub: { fontSize: 16, color: T.text2, lineHeight: 1.7, maxWidth: 560, margin: '0 0 20px' },
    heroMeta: { display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: T.text3 },
    tldr: { background: 'transparent', border: `1px solid ${T.borderSub}`, borderRadius: 8, padding: 24, marginBottom: 40 },
    tldrTitle: { fontSize: 13, fontWeight: 700, color: T.text1, marginBottom: 16 },
    tldrGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
    tldrItem: { display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14 },
    tldrText: { color: '#94A3B8', lineHeight: 1.5 },
    section: { marginBottom: 60 },
    secHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingLeft: 12, borderLeft: '2px solid #333d52' },
    secTitle: { fontSize: 22, fontWeight: 700, color: T.text1, margin: 0 },
    subsection: { marginBottom: 20, paddingLeft: 0, borderLeft: 'none' },
    subH: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 6 },
    subT: { fontSize: 15, color: '#94a3b8', lineHeight: 1.8, margin: 0 },
    footerCard: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '28px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' },
    footerTitle: { fontSize: 15, fontWeight: 700, color: T.text1, marginBottom: 4 },
    footerSub: { fontSize: 13.5, color: T.text2, lineHeight: 1.5, maxWidth: 420 },
    footerBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #333d52', color: T.text1, borderRadius: 6, fontWeight: 500, fontSize: 13, textDecoration: 'none', whiteSpace: 'nowrap' },
};
