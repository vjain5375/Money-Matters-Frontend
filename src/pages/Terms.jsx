import { Link } from 'react-router-dom';

const SECTIONS = [
    {
        title: 'Acceptance of Terms',
        content: `By creating an account or accessing Money Matters AI ("the App"), you confirm that you are at least 18 years old and agree to be bound by these Terms of Service. If you do not agree, please do not use the App.

These terms constitute a legally binding agreement between you and Money Matters AI. We reserve the right to update these terms at any time, and your continued use of the App after changes constitutes acceptance of the new terms.`,
    },
    {
        title: 'AI-Powered Services & Disclaimers',
        content: `Money Matters AI uses machine learning models to automatically categorize your transactions and generate financial insights. Please note:

• AI categorizations are suggestions, not guarantees. Always review and correct them if needed.
• Financial insights are generated for informational purposes only and do not constitute professional financial advice.
• We strongly recommend consulting a certified financial advisor before making major investment or financial decisions.
• Stock analysis features are for educational purposes only. Past performance is not indicative of future results.`,
    },
    {
        title: 'Your Account & Data',
        content: `You are responsible for maintaining the confidentiality of your account credentials. You agree to:

• Provide accurate and complete information when creating your account.
• Notify us immediately of any unauthorized access to your account.
• Not share your login credentials with any third party.
• Not use the App for any illegal or unauthorized purpose.

All financial data you enter into Money Matters AI is stored securely via Supabase with Row-Level Security (RLS). Only you can access your own data.`,
    },
    {
        title: 'Prohibited Activities',
        content: `When using Money Matters AI, you agree not to:

• Attempt to reverse-engineer, hack, or disrupt the App or its services.
• Upload malicious code, viruses, or any harmful content.
• Use automated bots or scrapers to extract data from the App.
• Use the App to store or transmit data that is fraudulent, illegal, or violates anyone's rights.
• Impersonate any person or entity or misrepresent your affiliation with any person or entity.`,
    },
    {
        title: 'Intellectual Property',
        content: `All content within Money Matters AI, including but not limited to the user interface design, source code, AI models, graphics, and branding, is the exclusive property of Money Matters AI and is protected by applicable intellectual property laws.

You are granted a limited, non-exclusive, non-transferable license to use the App for personal, non-commercial purposes. You may not copy, modify, distribute, sell, or lease any part of our services or software.`,
    },
    {
        title: 'Limitation of Liability',
        content: `To the maximum extent permitted by applicable law, Money Matters AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising from:

• Your use of or inability to use the App.
• Any unauthorized access to or use of our servers and/or any personal information stored therein.
• Any errors or inaccuracies in the AI-generated financial insights.
• Any interruption or cessation of transmission to or from the App.`,
    },
    {
        title: 'Termination',
        content: `We reserve the right to suspend or terminate your account at our sole discretion, without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties, or for any other reason.

Upon termination, your right to use the App will immediately cease. You may also request deletion of your account and data at any time by contacting us.`,
    },
    {
        title: 'Governing Law',
        content: `These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts located in India.`,
    },
];

export default function Terms() {
    return (
        <div style={S.page}>
            {/* Top bar */}
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
                            <path d="M3 15V5l7 7 7-7v10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span style={S.logoText}>Money<span style={{ color: '#6366F1' }}>Matters</span></span>
                </div>
                <div style={{ width: 40 }}></div>
            </div>

            <div style={S.container}>
                {/* Hero */}
                <div style={S.hero}>
                    <div style={S.heroBadge}>Terms of Service</div>
                    <h1 style={S.heroTitle}>Terms of Service</h1>
                    <p style={S.heroSub}>
                        Please read these terms carefully before using Money Matters AI. By using our app, you agree to these terms.
                    </p>
                    <div style={S.heroMeta}>
                        <span style={S.metaItem}>Last updated: May 16, 2025</span>
                        <span style={S.metaDot}>·</span>
                        <span style={S.metaItem}>Governed by Indian law</span>
                    </div>
                </div>

                {/* Sections */}
                <div style={S.sectionsGrid}>
                    {SECTIONS.map((section, i) => (
                        <div key={i} style={S.sectionCard}>
                            <div style={S.sectionHeader}>
                                <h2 style={S.sectionTitle}>{section.title}</h2>
                            </div>
                            <div style={S.sectionContent}>
                                {section.content.split('\n\n').map((para, j) => (
                                    <p key={j} style={S.para}>{para}</p>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div style={S.footerCard}>
                    <div>
                        <div style={S.footerTitle}>Have questions about our terms?</div>
                        <div style={S.footerSub}>
                            We're happy to clarify anything. Our terms are written to be fair and transparent.
                        </div>
                    </div>
                    <Link to="/login" style={S.footerBtn}>Go to App →</Link>
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
    logoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
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
    logoText: {
        fontSize: 24,
        fontWeight: 800,
        color: '#F1F5F9',
        letterSpacing: '-0.5px',
    },
    navLink: {
        fontSize: 13,
        color: '#64748B',
        textDecoration: 'none',
    },
    backBtn: {
        fontSize: 13,
        fontWeight: 600,
        color: '#6366F1',
        textDecoration: 'none',
    },
    container: {
        maxWidth: 820,
        margin: '0 auto',
        padding: '48px 24px 80px',
    },
    hero: {
        textAlign: 'left',
        marginBottom: 60,
        borderBottom: '1px solid #1E2535',
        paddingBottom: 40,
    },
    heroBadge: {
        display: 'inline-block',
        fontSize: 12,
        fontWeight: 600,
        color: '#64748B',
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        marginBottom: 16,
    },
    heroTitle: {
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        fontSize: 40,
        fontWeight: 800,
        color: '#F1F5F9',
        margin: '0 0 16px',
        letterSpacing: '-1px',
    },
    heroSub: {
        fontSize: 16,
        color: '#64748B',
        lineHeight: 1.6,
        maxWidth: 640,
        margin: '0 0 20px',
    },
    heroMeta: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    metaItem: {
        fontSize: 13,
        color: '#64748B',
        fontWeight: 500,
    },
    metaDot: {
        color: '#1E2535',
    },
    sectionsGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: 40,
        marginBottom: 60,
    },
    sectionCard: {
        background: 'transparent',
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingLeft: 12,
        borderLeft: '2px solid #333d52',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 700,
        color: '#F1F5F9',
        margin: 0,
    },
    sectionContent: {},
    para: {
        fontSize: 15,
        color: '#94a3b8',
        lineHeight: 1.8,
        margin: '0 0 16px',
        whiteSpace: 'pre-line',
    },
    footerCard: {
        background: '#131720',
        border: '1px solid #1E2535',
        borderRadius: 8,
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    footerTitle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#F1F5F9',
        marginBottom: 4,
    },
    footerSub: {
        fontSize: 14,
        color: '#64748B',
        lineHeight: 1.5,
        maxWidth: 420,
    },
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
