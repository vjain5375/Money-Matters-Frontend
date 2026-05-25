import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const T = {
  bg: '#0B0F19', surface: '#131720', surfaceUp: '#1A202E',
  border: '#252D3D', borderSub: '#1E2535',
  primary: '#6366F1', primaryHov: '#4F46E5',
  text1: '#F1F5F9', text2: '#64748B', text3: '#3D4A5C', green: '#10B981',
  serif: "'Plus Jakarta Sans', system-ui, sans-serif",
  sans: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
};

const FEATURES = [
  { icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>, title: 'AI Auto-Categorization', desc: 'Every transaction tagged automatically — groceries, EMIs, Swiggy, PhonePe. No manual work.' },
  { icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, title: 'Spending Analytics', desc: 'Breakdowns by category, merchant, and month. See patterns you\'ve never noticed.' },
  { icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>, title: 'Bank-Level Security', desc: 'Supabase Row-Level Security. Your data is yours. Not even a frontend bug can expose it.' },
  { icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>, title: 'Budget Tracking', desc: 'Set monthly limits per category. See live progress before you overspend.' },
];

const STEPS = [
  { num: '01', title: 'Add your transactions', desc: 'Log manually or paste from your bank SMS. Takes under 10 seconds.' },
  { num: '02', title: 'AI categorizes everything', desc: 'Our ML model tags every entry — groceries, rent, UPI, streaming, and more.' },
  { num: '03', title: 'Get actionable insights', desc: 'See where money goes. Get concrete suggestions on where to cut back.' },
];

const TESTIMONIALS = [
  { quote: "MoneyMatters showed me I was spending ₹4,200/month on food delivery alone. Cut it in half.", name: "Priya S.", role: "Software Engineer, Bangalore", init: "PS" },
  { quote: "First app that actually gets Indian spending — Swiggy, Zepto, PhonePe all recognized instantly.", name: "Arjun M.", role: "Product Manager, Mumbai", init: "AM" },
  { quote: "I finally know where my salary goes. Set up in 5 minutes, saved ₹8k in the first month.", name: "Tanvi R.", role: "Freelancer, Delhi", init: "TR" },
];

export default function LandingPage() {
  return (
    <div style={S.page}>
      <div style={{ position: 'relative', zIndex: 1 }}>
      <PublicNavbar />

      {/* ── Hero ── */}
      <section style={S.hero}>
        <motion.div style={S.heroInner} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <h1 style={S.heroTitle}>
            Start knowing where your<br />
            <span style={{ color: T.text1 }}>money goes.</span>
          </h1>
          <p style={S.heroSub}>
            Smart expense tracking & AI auto-categorization.<br />
            Built for how Indians actually spend.
          </p>
          <Link to="/login" style={S.heroCta}>Create Free Account →</Link>
          <p style={S.heroProof}>2,400+ Indians already tracking smarter</p>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section id="features" style={S.section}>
        <div style={S.sectionInner}>
          <div style={S.pill}>FEATURES</div>
          <h2 style={S.sectionTitle}>Everything you need to<br />manage money smarter</h2>
          <div style={S.featGrid}>
            {FEATURES.map((f, i) => (
              <motion.div key={f.title} style={S.featCard} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.2, ease: 'easeOut' }} whileHover={{ backgroundColor: T.surfaceUp }}>
                <div style={S.featIcon}>{f.icon}</div>
                <div style={S.featTitle}>{f.title}</div>
                <div style={S.featDesc}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ ...S.section, borderTop: `1px solid ${T.borderSub}` }}>
        <div style={S.sectionInner}>
          <div style={S.pill}>HOW IT WORKS</div>
          <h2 style={S.sectionTitle}>From transaction to insight<br />in seconds</h2>
          <div style={S.stepsGrid}>
            {STEPS.map((step, i) => (
              <motion.div key={step.num} style={S.stepItem} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.2, ease: 'easeOut' }}>
                <div style={S.stepNum}>{step.num}</div>
                <div style={S.stepTitle}>{step.title}</div>
                <div style={S.stepDesc}>{step.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section style={{ ...S.section, borderTop: `1px solid ${T.borderSub}` }}>
        <div style={S.sectionInner}>
          <div style={S.pill}>TESTIMONIALS</div>
          <h2 style={S.sectionTitle}>Trusted by Indians who<br />value their money</h2>
          <div style={S.testiGrid}>
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} style={S.testiCard} initial={{ opacity: 0, y: 6 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.2, ease: 'easeOut' }} whileHover={{ borderColor: T.border }}>
                <p style={S.testiQuote}>"{t.quote}"</p>
                <div style={S.testiAuthor}>
                  <div style={S.testiAvatar}>{t.init}</div>
                  <div>
                    <div style={S.testiName}>{t.name}</div>
                    <div style={S.testiRole}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Card ── */}
      <section style={S.ctaSection}>
        <motion.div style={S.ctaCard} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.2, ease: 'easeOut' }}>
          <h2 style={S.ctaTitle}>Start knowing where your money goes.</h2>
          <p style={S.ctaSub}>Join 2,400+ Indians tracking their finances with MoneyMatters.</p>
          <Link to="/login" style={S.heroCta}>Create Free Account →</Link>
        </motion.div>
      </section>

      <PublicFooter />
      </div>
    </div>
  );
}

const S = {
  page: { background: T.bg, minHeight: '100vh', fontFamily: T.sans, color: T.text2, overflowX: 'hidden', width: '100%', maxWidth: '100vw', position: 'relative' },

  hero: { paddingTop: 160, paddingBottom: 100, textAlign: 'center' },
  heroInner: { maxWidth: 680, margin: '0 auto', padding: '0 24px' },
  heroTitle: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: 'clamp(40px, 6vw, 64px)',
    lineHeight: 1.05, color: T.text1, margin: '0 0 20px',
    fontWeight: 800,
  },
  heroSub: { fontSize: 22, color: T.text2, lineHeight: 1.6, marginBottom: 36, maxWidth: 560, margin: '0 auto 40px' },
  heroCta: {
    display: 'inline-block', padding: '16px 32px',
    background: T.primary, color: '#fff', borderRadius: 8,
    fontSize: 18, fontWeight: 600, textDecoration: 'none',
    transition: 'background 150ms',
    marginBottom: 16,
    whiteSpace: 'nowrap',
  },
  heroProof: { fontSize: 15, color: T.text3, marginTop: 12 },

  section: { padding: '100px 0' },
  sectionInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px' },
  pill: {
    display: 'inline-block', padding: '4px 12px',
    background: 'transparent', border: `1px solid ${T.border}`,
    borderRadius: 4, fontSize: 13, fontWeight: 500,
    color: T.text2, letterSpacing: '0.04em', textTransform: 'uppercase',
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: 'clamp(28px, 4vw, 44px)',
    fontWeight: 800, color: T.text1, margin: '0 0 52px',
    lineHeight: 1.2,
  },

  featGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 16 },
  featCard: { background: T.surface, padding: 32, border: `1px solid ${T.borderSub}`, borderRadius: 8, transition: 'background 150ms' },
  featIcon: { color: T.text2, marginBottom: 16 },
  featTitle: { fontSize: 18, fontWeight: 600, color: T.text1, marginBottom: 10 },
  featDesc: { fontSize: 16, color: T.text2, lineHeight: 1.65 },

  stepsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: 32 },
  stepItem: { paddingTop: 24, borderTop: `1px solid ${T.borderSub}` },
  stepNum: { fontFamily: T.mono, fontSize: 14, color: T.text3, fontWeight: 500, marginBottom: 12 },
  stepTitle: { fontSize: 20, fontWeight: 600, color: T.text1, marginBottom: 10 },
  stepDesc: { fontSize: 16, color: T.text2, lineHeight: 1.7 },

  testiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: 20 },
  testiCard: { background: T.surface, border: `1px solid ${T.borderSub}`, borderRadius: 12, padding: 32 },
  testiQuote: { fontSize: 16, color: '#94A3B8', lineHeight: 1.7, marginBottom: 20, fontStyle: 'italic' },
  testiAuthor: { display: 'flex', alignItems: 'center', gap: 12 },
  testiAvatar: {
    width: 40, height: 40, borderRadius: 6,
    background: T.surfaceUp, display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, fontWeight: 500, color: T.text1, flexShrink: 0, border: `1px solid ${T.borderSub}`
  },
  testiName: { fontSize: 16, fontWeight: 600, color: T.text1 },
  testiRole: { fontSize: 14, color: T.text2 },

  ctaSection: { padding: '0 24px 100px' },
  ctaCard: {
    maxWidth: 800, margin: '0 auto',
    background: T.surface, border: `1px solid ${T.borderSub}`,
    borderRadius: 8, padding: 64, textAlign: 'center',
  },
  ctaTitle: { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontSize: 'clamp(26px, 3.5vw, 40px)', fontWeight: 800, color: T.text1, margin: '0 0 16px' },
  ctaSub: { fontSize: 18, color: T.text2, lineHeight: 1.6, marginBottom: 32 },
};
