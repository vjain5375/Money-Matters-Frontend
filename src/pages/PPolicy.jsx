import { Link } from 'react-router-dom';

const SECTIONS = [
    {
        title: 'Information We Collect',
        subsections: [
            {
                heading: 'Account Information',
                text: 'When you sign up, we collect your email address and optionally your display name. This is used to authenticate you and personalize your experience.',
            },
            {
                heading: 'Financial Data',
                text: 'You manually enter transaction details including amounts, dates, descriptions, and categories. We also store AI-generated category predictions made on your descriptions. This data is stored in your private Supabase account vault — only you can access it.',
            },
            {
                heading: 'Usage Data',
                text: 'We may collect anonymized data about how features are used (e.g., which pages are visited most, which AI features are triggered) to improve the product. This data is never linked to your identity.',
            },
        ],
    },
    {
        title: 'How We Use AI & Your Data',
        subsections: [
            {
                heading: 'ML Categorization',
                text: 'When you type a transaction description (e.g., "Swiggy Order"), we send it to our ML classification API to auto-detect the category. This API call is stateless — we do not store your descriptions on our ML servers.',
            },
            {
                heading: 'AI Financial Advisor',
                text: 'Your aggregated spending data (not raw descriptions) is used to generate financial insights via an LLM. This data is processed in real-time and is not stored by any third-party AI provider beyond the duration of the API call.',
            },
            {
                heading: 'Stock Analysis',
                text: 'Stock data is fetched from public market APIs. No personal financial data is sent to these APIs.',
            },
        ],
    },
    {
        title: 'Data Security',
        subsections: [
            {
                heading: 'Row-Level Security (RLS)',
                text: 'All your financial data is stored in Supabase with strict Row-Level Security policies. This means every database query is enforced at the server level to ensure you can only ever read and write your own data — even if a bug existed in our frontend code.',
            },
            {
                heading: 'Encryption',
                text: 'Data is encrypted in transit using HTTPS/TLS and encrypted at rest by Supabase (using AES-256). Your password is never stored; we use Supabase Auth which handles authentication securely.',
            },
            {
                heading: 'No Third-Party Data Selling',
                text: 'We do not sell, rent, or trade your personal or financial data to any third party, ever. Your data is yours.',
            },
        ],
    },
    {
        title: 'Cookies & Local Storage',
        subsections: [
            {
                heading: 'Session Tokens',
                text: 'We store your authentication session token in your browser\'s local storage to keep you logged in. This token is used solely for authentication with Supabase.',
            },
            {
                heading: 'No Tracking Cookies',
                text: 'We do not use third-party advertising or tracking cookies. We do not use Google Analytics or any similar tracking service.',
            },
        ],
    },
    {
        title: 'Third-Party Services',
        subsections: [
            {
                heading: 'Supabase',
                text: 'Used for authentication and database storage. Supabase is SOC 2 Type 2 compliant and GDPR-ready. View their privacy policy at supabase.com/privacy.',
            },
            {
                heading: 'ML Classification API',
                text: 'Our self-hosted machine learning API on Render processes transaction descriptions to suggest categories. No data is persisted on Render beyond the duration of the request.',
            },
            {
                heading: 'Market Data APIs',
                text: 'We use public stock market APIs (Yahoo Finance) to fetch stock data. No personal data is sent to these services.',
            },
        ],
    },
    {
        title: 'Your Rights',
        subsections: [
            {
                heading: 'Access & Portability',
                text: 'You have the right to access all data we hold about you. You can view all your transactions and financial data directly within the app at any time.',
            },
            {
                heading: 'Deletion',
                text: 'You can delete individual transactions directly from the app. To delete your entire account and all associated data, please contact us and we will process your request within 30 days.',
            },
            {
                heading: 'Correction',
                text: 'You can edit or correct any of your financial data at any time directly within the app.',
            },
        ],
    },
    {
        title: 'Data Residency',
        subsections: [
            {
                heading: 'India-First',
                text: 'Our primary Supabase instance is configured for optimal performance for Indian users. Data may be processed in data centers outside India as part of Supabase\'s infrastructure. By using the app, you consent to this.',
            },
        ],
    },
    {
        title: 'Changes to This Policy',
        subsections: [
            {
                heading: 'Notification of Changes',
                text: 'We may update this Privacy Policy periodically. We will notify you of any significant changes by updating the "Last updated" date at the top of this page. We encourage you to review this policy regularly.',
            },
        ],
    },
];

export default function PPolicy() {
    return (
        <div style={S.page}>
            {/* Top Bar */}
            <div style={S.topBar}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Link to="/login" style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        color: '#F1F5F9',
                        fontSize: 20,
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                        cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                    }}>
                        ←
                    </Link>
                </div>
                <div style={{...S.logoRow, position: 'absolute', left: '50%', transform: 'translateX(-50%)'}}>
                    <div style={S.logoIcon}>
                        <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
                            <path d="M3 15V5l7 7 7-7v10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span style={S.logoText}>Money<span style={{ color: '#a78bfa' }}>Matters</span></span>
                </div>
                <div style={{ width: 40 }}></div>
            </div>

            <div style={S.container}>
                {/* Hero */}
                <div style={S.hero}>
                    <div style={S.heroBadge}>Privacy Policy</div>
                    <h1 style={S.heroTitle}>Privacy Policy</h1>
                    <p style={S.heroSub}>
                        Your financial data is deeply personal. We take your privacy seriously and are committed to being transparent about how we handle your information.
                    </p>
                    <div style={S.heroMeta}>
                        <span style={S.metaItem}>Last updated: May 16, 2025</span>
                        <span style={S.metaDot}>·</span>
                        <span style={S.metaItem}>India-focused app</span>
                    </div>
                </div>

                {/* TL;DR Summary */}
                <div style={S.tldr}>
                    <div style={S.tldrTitle}>Summary</div>
                    <div style={S.tldrGrid}>
                        {[
                            { text: 'Your data belongs to you, not us.' },
                            { text: 'We never sell your data to anyone.' },
                            { text: 'Bank-grade RLS encryption on all data.' },
                            { text: 'AI is used to help you, not profile you.' },
                            { text: 'Delete your account anytime, no questions.' },
                            { text: 'No tracking cookies, ever.' },
                        ].map((item, i) => (
                            <div key={i} style={S.tldrItem}>
                                <span style={S.tldrText}>• {item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Sections */}
                <div style={S.sectionsGrid}>
                    {SECTIONS.map((section, i) => (
                        <div key={i} style={S.sectionCard}>
                            <div style={S.sectionHeader}>
                                <h2 style={S.sectionTitle}>{section.title}</h2>
                            </div>
                            <div style={S.subsections}>
                                {section.subsections.map((sub, j) => (
                                    <div key={j} style={S.subsection}>
                                        <div style={S.subHeading}>{sub.heading}</div>
                                        <p style={S.subText}>{sub.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Footer */}
                <div style={S.footerCard}>
                    <div style={S.footerLeft}>
                        <div>
                            <div style={S.footerTitle}>Questions about your privacy?</div>
                            <div style={S.footerSub}>
                                We believe in radical transparency. If anything is unclear, reach out — we\'ll explain it in plain language.
                            </div>
                        </div>
                    </div>
                    <Link to="/login" style={S.footerBtn}>Open App →</Link>
                </div>
            </div>
        </div>
    );
}

const S = {
    page: {
        minHeight: '100vh',
        background: '#0B0F19',
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    },
    topBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 16px',
        background: '#0B0F19',
        borderBottom: '1px solid #1E2535',
        position: 'sticky',
        top: 0,
        zIndex: 100,
    },
    logoRow: { display: 'flex', alignItems: 'center', gap: 10 },
    logoIcon: {
        width: 44,
        height: 44,
        borderRadius: 10,
        background: '#6366F1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
    },
    logoText: { fontSize: 24, fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px' },
    navLink: { fontSize: 13, fontWeight: 500, color: '#64748B', textDecoration: 'none' },
    backBtn: { fontSize: 13, fontWeight: 600, color: '#6366F1', textDecoration: 'none' },

    container: { maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' },

    hero: { textAlign: 'left', marginBottom: 60, borderBottom: '1px solid #1E2535', paddingBottom: 40 },
    heroBadge: {
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 600,
        color: '#64748B',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    heroTitle: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: 40, fontWeight: 800, color: '#F1F5F9', margin: '0 0 16px', letterSpacing: '-1px' },
    heroSub: { fontSize: 16, color: '#64748B', lineHeight: 1.6, maxWidth: 640, margin: '0 0 20px' },
    heroMeta: { display: 'flex', alignItems: 'center', gap: 10 },
    metaItem: { fontSize: 13, color: '#64748B', fontWeight: 500 },
    metaDot: { color: '#1E2535' },

    tldr: {
        background: 'transparent',
        border: '1px solid #1E2535',
        borderRadius: 8,
        padding: '24px 28px',
        marginBottom: 40,
    },
    tldrTitle: { fontSize: 15, fontWeight: 600, color: '#F1F5F9', marginBottom: 16 },
    tldrGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 },
    tldrItem: { display: 'flex', alignItems: 'center', gap: 10 },
    tldrText: { fontSize: 14, color: '#cbd5e1', fontWeight: 400 },

    sectionsGrid: { display: 'flex', flexDirection: 'column', gap: 40, marginBottom: 60 },
    sectionCard: {
        background: 'transparent',
    },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, paddingLeft: 12, borderLeft: '2px solid #333d52' },
    sectionTitle: { fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: 0 },
    subsections: { display: 'flex', flexDirection: 'column', gap: 28 },
    subsection: {
        paddingLeft: 0,
        borderLeft: 'none',
    },
    subHeading: { fontSize: 16, fontWeight: 700, color: '#e2e8f0', marginBottom: 8 },
    subText: { fontSize: 15, color: '#94a3b8', lineHeight: 1.6, margin: 0 },

    footerCard: {
        background: '#131720',
        borderRadius: 8,
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 20,
        flexWrap: 'wrap',
        border: '1px solid #1E2535',
    },
    footerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    footerTitle: { fontSize: 16, fontWeight: 600, color: '#F1F5F9', marginBottom: 4 },
    footerSub: { fontSize: 14, color: '#64748B', lineHeight: 1.5, maxWidth: 420 },
    footerBtn: {
        padding: '8px 16px',
        background: 'transparent',
        border: '1px solid #333d52',
        color: '#F1F5F9',
        borderRadius: 6,
        fontWeight: 500,
        fontSize: 13,
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
    },
};
