import { Link } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const T = {
    bg: '#0B0F19', surface: '#131720', surfaceUp: '#1A202E',
    border: '#252D3D', borderSub: '#1E2535',
    primary: '#6366F1', text1: '#F1F5F9', text2: '#64748B', text3: '#3D4A5C',
    sans: "'IBM Plex Sans', system-ui, sans-serif",
    serif: "'Plus Jakarta Sans', system-ui, sans-serif",
    mono: "'JetBrains Mono', monospace",
};

const TECH = ['React 18', 'Supabase', 'Python ML', 'Google OAuth', 'Vite', 'Ant Design', 'Framer Motion', 'YFinance'];

const MILESTONES = [
    { date: 'Dec 2025', label: 'Idea born — tired of not knowing where my money was going' },
    { date: 'Feb 2026', label: 'First working version with manual transaction logging' },
    { date: 'Mar 2026', label: 'AI categorization engine — 90%+ accuracy on Indian transactions' },
    { date: 'Apr 2026', label: 'Stock analysis dashboard, budgeting & 2,400+ users' },
];

export default function About() {
    return (
        <div style={S.page}>
            <PublicNavbar />

            {/* Hero */}
            <section style={S.hero}>
                <div style={S.heroInner}>
                    <div style={S.pill}>OUR STORY</div>
                    <h1 style={S.heroTitle}>
                        Built by someone who got tired of not knowing<br />
                        <em>where their money went.</em>
                    </h1>
                    <p style={S.heroSub}>A solo project born out of frustration with generic finance apps that don't understand India — no UPI, no Swiggy, no kirana stores.</p>
                </div>
            </section>

            <div style={S.body}>

                {/* Mission */}
                <div style={S.missionCard}>
                    <div style={S.missionQuote}>"</div>
                    <blockquote style={S.missionText}>
                        MoneyMatters exists to bring <span style={{ color: T.primary, fontStyle: 'normal' }}>clarity to personal finance</span> for everyday Indians. Every rupee should be accounted for — effortlessly.
                    </blockquote>
                </div>

                {/* Creator */}
                <div style={S.section}>
                    <h2 style={S.sectionTitle}>Meet the Creator</h2>
                    <div style={S.creatorCard}>
                        <img src="https://github.com/vjain5375.png" alt="Vansh Jain" style={{ width: 72, height: 72, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: `1px solid ${T.borderSub}` }} />
                        <div style={S.creatorInfo}>
                            <div style={S.creatorName}>Vansh Jain</div>
                            <div style={S.creatorRole}>Founder & Developer</div>
                            <p style={S.creatorBio}>
                                A developer who built MoneyMatters out of a personal pain point — spending hours each month manually reconciling bank statements with zero insight into patterns.
                                Built the entire stack from scratch: React frontend, Python ML backend, Supabase for secure data, and a custom NLP model for Indian transaction categorization.
                            </p>
                            <div style={S.creatorLinks}>
                                <a href="https://github.com/vjain5375" target="_blank" rel="noopener noreferrer" style={S.creatorLink}>↗ GitHub</a>
                                <a href="https://linkedin.com/in/vanshjain24" target="_blank" rel="noopener noreferrer" style={S.creatorLink}>↗ LinkedIn</a>
                                <a href="mailto:vjain5375@gmail.com" style={S.creatorLink}>↗ Email</a>
                            </div>
                        </div>
                    </div>
                </div>


                {/* Tech */}
                <div style={S.section}>
                    <h2 style={S.sectionTitle}>Built With</h2>
                    <p style={S.sectionSub}>A modern, production-grade stack designed for performance and security.</p>
                    <div style={S.techGrid}>
                        {TECH.map(t => <div key={t} style={S.techBadge}>{t}</div>)}
                    </div>
                </div>

                {/* Timeline */}
                <div style={S.section}>
                    <h2 style={S.sectionTitle}>Milestones</h2>
                    <div style={S.timeline}>
                        {MILESTONES.map((m, i) => (
                            <div key={i} style={S.timelineItem}>
                                <div style={S.timelineDot} />
                                <div style={S.timelineDate}>{m.date}</div>
                                <div style={S.timelineLabel}>{m.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div style={S.ctaCard}>
                    <h2 style={S.ctaTitle}>Ready to know where your money goes?</h2>
                    <p style={S.ctaSub}>Join thousands of Indians who track smarter with MoneyMatters.</p>
                    <div style={S.ctaBtns}>
                        <Link to="/signup" style={S.ctaPrimary}>Get Started Free →</Link>
                        <Link to="/contact" style={S.ctaGhost}>Contact us</Link>
                    </div>
                </div>
            </div>

            <PublicFooter />
        </div>
    );
}

const S = {
    page: { background: T.bg, minHeight: '100vh', fontFamily: T.sans, color: T.text2 },
    hero: { paddingTop: 140, paddingBottom: 80 },
    heroInner: { maxWidth: 900, margin: '0 auto', padding: '0 24px' },
    pill: { display: 'inline-block', padding: '4px 12px', background: T.surfaceUp, border: `1px solid ${T.border}`, borderRadius: 99, fontSize: 11, fontWeight: 600, color: T.primary, letterSpacing: '0.08em', marginBottom: 24 },
    heroTitle: { fontFamily: T.serif, fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 800, color: T.text1, margin: '0 0 20px', lineHeight: 1.1 },
    heroSub: { fontSize: 17, color: T.text2, lineHeight: 1.7, maxWidth: 560 },
    body: { maxWidth: 900, margin: '0 auto', padding: '0 24px 96px' },
    missionCard: { background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.primary}`, borderRadius: 12, padding: '36px 40px', marginBottom: 64 },
    missionQuote: { fontSize: 64, lineHeight: 0.8, color: T.primary, opacity: 0.4, fontFamily: 'Georgia, serif', marginBottom: 16 },
    missionText: { fontFamily: T.serif, fontSize: 20, fontWeight: 600, color: '#94A3B8', lineHeight: 1.7, margin: 0 },
    section: { marginBottom: 64 },
    sectionTitle: { fontSize: 26, fontWeight: 700, color: T.text1, margin: '0 0 20px', fontFamily: T.sans },
    sectionSub: { fontSize: 14, color: T.text2, lineHeight: 1.6, marginBottom: 20 },
    creatorCard: { display: 'flex', gap: 28, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 28 },
    creatorAvatar: { width: 72, height: 72, borderRadius: 12, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0 },
    creatorInfo: { flex: 1 },
    creatorName: { fontSize: 18, fontWeight: 700, color: T.text1, marginBottom: 2 },
    creatorRole: { fontSize: 13, color: T.text2, marginBottom: 12 },
    creatorBio: { fontSize: 14, color: T.text2, lineHeight: 1.8, marginBottom: 16 },
    creatorLinks: { display: 'flex', gap: 16 },
    creatorLink: { fontSize: 13, fontWeight: 500, color: T.primary, textDecoration: 'none' },
    statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, border: `1px solid ${T.borderSub}`, borderRadius: 12, overflow: 'hidden', marginBottom: 64, background: T.borderSub },
    statBox: { background: T.surface, padding: 24, textAlign: 'center' },
    statVal: { fontFamily: T.mono, fontSize: 26, fontWeight: 600, color: T.text1, marginBottom: 4 },
    statLabel: { fontSize: 12, color: T.text2 },
    techGrid: { display: 'flex', flexWrap: 'wrap', gap: 8 },
    techBadge: { padding: '7px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 99, fontSize: 13, fontWeight: 500, color: '#94A3B8' },
    timeline: { display: 'flex', flexDirection: 'column', gap: 0 },
    timelineItem: { display: 'flex', alignItems: 'flex-start', gap: 16, paddingBottom: 28, paddingLeft: 8 },
    timelineDot: { width: 8, height: 8, borderRadius: '50%', background: T.primary, flexShrink: 0, marginTop: 6 },
    timelineDate: { fontSize: 12, fontFamily: T.mono, fontWeight: 600, color: T.primary, width: 80, flexShrink: 0, paddingTop: 1 },
    timelineLabel: { fontSize: 14.5, color: T.text2, lineHeight: 1.6 },
    ctaCard: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 48, textAlign: 'center' },
    ctaTitle: { fontFamily: T.serif, fontSize: 32, fontWeight: 800, color: T.text1, margin: '0 0 12px' },
    ctaSub: { fontSize: 15, color: T.text2, lineHeight: 1.6, marginBottom: 28 },
    ctaBtns: { display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' },
    ctaPrimary: { padding: '12px 24px', background: T.primary, borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none', transition: 'background 150ms' },
    ctaGhost: { padding: '12px 24px', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 14, fontWeight: 500, color: T.text2, textDecoration: 'none', transition: 'border-color 150ms' },
};
