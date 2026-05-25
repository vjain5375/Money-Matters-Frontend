import { useState } from 'react';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const SUBJECTS = ['General Inquiry', 'Bug Report', 'Feature Request', 'Billing', 'Partnership'];

export default function Contact() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (!form.email.trim()) e.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email';
        if (!form.subject) e.subject = 'Please select a subject';
        if (!form.message.trim()) e.message = 'Message is required';
        return e;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length > 0) { setErrors(errs); return; }
        
        setIsSubmitting(true);
        try {
            const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    service_id: import.meta.env.VITE_EMAILJS_SERVICE_ID,
                    template_id: import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
                    user_id: import.meta.env.VITE_EMAILJS_PUBLIC_KEY,
                    template_params: {
                        name: form.name,
                        email: form.email,
                        subject: form.subject,
                        message: form.message
                    }
                })
            });
            
            if (response.ok) {
                setSubmitted(true);
            } else {
                alert("Something went wrong! Please try again later.");
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong! Please try again later.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={S.page}>
            <PublicNavbar />
            <div style={S.hero}>
                <div style={S.heroBg} />
                <div style={S.heroInner}>
                    <div style={S.badge}>Contact Us</div>
                    <h1 style={S.heroTitle}>Get in touch</h1>
                    <p style={S.heroSub}>Have a question or feedback? We'd love to hear from you. Usually respond within 24 hours.</p>
                </div>
            </div>

            <div style={S.body}>
                <div style={S.grid}>
                    {/* Form */}
                    <div style={S.formCard}>
                        {submitted ? (
                            <div style={S.successBox}>
                                <h2 style={S.successTitle}>Message sent!</h2>
                                <p style={S.successSub}>Thanks for reaching out. We'll get back to you at <strong>{form.email}</strong> within 24 hours.</p>
                                <button style={S.resetBtn} onClick={() => { setForm({ name: '', email: '', subject: '', message: '' }); setSubmitted(false); }}>
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} noValidate>
                                <h2 style={S.formTitle}>Send us a message</h2>

                                <div style={S.field}>
                                    <label style={S.label}>Full Name</label>
                                    <input
                                        style={{ ...S.input, ...(errors.name ? S.inputError : {}) }}
                                        placeholder="Vansh Jain"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                    />
                                    {errors.name && <span style={S.errMsg}>{errors.name}</span>}
                                </div>

                                <div style={S.field}>
                                    <label style={S.label}>Email Address</label>
                                    <input
                                        type="email"
                                        style={{ ...S.input, ...(errors.email ? S.inputError : {}) }}
                                        placeholder="you@example.com"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                    />
                                    {errors.email && <span style={S.errMsg}>{errors.email}</span>}
                                </div>

                                <div style={S.field}>
                                    <label style={S.label}>Subject</label>
                                    <select
                                        style={{ ...S.input, ...(errors.subject ? S.inputError : {}) }}
                                        value={form.subject}
                                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                    >
                                        <option value="">Select a subject...</option>
                                        {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                    {errors.subject && <span style={S.errMsg}>{errors.subject}</span>}
                                </div>

                                <div style={S.field}>
                                    <label style={S.label}>Message</label>
                                    <textarea
                                        style={{ ...S.textarea, ...(errors.message ? S.inputError : {}) }}
                                        placeholder="Tell us how we can help..."
                                        rows={5}
                                        value={form.message}
                                        onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                    />
                                    {errors.message && <span style={S.errMsg}>{errors.message}</span>}
                                </div>

                                <button type="submit" style={{ ...S.submitBtn, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
                                    {isSubmitting ? 'Sending...' : 'Send Message →'}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Info */}
                    <div style={S.infoCol}>
                        <div style={S.infoCard}>
                            <div style={S.infoTitle}>Email Support</div>
                            <a href="mailto:money.matters.ai.2026@gmail.com" style={S.infoLink}>money.matters.ai.2026@gmail.com</a>
                            <p style={S.infoNote}>We respond within 24 hours on business days.</p>
                        </div>
                        <div style={S.infoCard}>
                            <div style={S.infoTitle}>Based in India</div>
                            <p style={S.infoNote}>Built specifically for Indian users and Indian spending patterns.</p>
                        </div>
                    </div>
                </div>
            </div>

            <PublicFooter />
        </div>
    );
}

const S = {
    page: { background: '#0B0F19', minHeight: '100vh', fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: '#64748B' },
    hero: { position: 'relative', paddingTop: 130, paddingBottom: 64, textAlign: 'center', overflow: 'hidden' },
    heroBg: { display: 'none' },
    heroInner: { position: 'relative', zIndex: 1, maxWidth: 640, margin: '0 auto', padding: '0 24px' },
    badge: { display: 'inline-block', padding: '4px 12px', background: '#1A202E', border: '1px solid #252D3D', borderRadius: 99, fontSize: 11, fontWeight: 600, color: '#6366F1', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 20 },
    heroTitle: { fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800, color: '#F1F5F9', margin: '0 0 16px', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" },
    heroSub: { fontSize: 17, color: '#64748b', lineHeight: 1.7, margin: 0 },
    body: { maxWidth: 1100, margin: '0 auto', padding: '0 24px 96px' },
    grid: { display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' },
    formCard: { flex: '1.5 1 320px', background: '#131720', border: '1px solid #252D3D', borderRadius: 12, padding: '40px 36px', boxSizing: 'border-box' },
    formTitle: { fontSize: 20, fontWeight: 700, color: '#F1F5F9', margin: '0 0 28px' },
    field: { marginBottom: 20 },
    label: { display: 'block', fontSize: 13, fontWeight: 500, color: '#94A3B8', marginBottom: 8 },
    input: { width: '100%', padding: '12px 14px', background: '#0B0F19', border: '1px solid #252D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 14, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", outline: 'none', boxSizing: 'border-box' },
    textarea: { width: '100%', padding: '12px 14px', background: '#0B0F19', border: '1px solid #252D3D', borderRadius: 8, color: '#F1F5F9', fontSize: 14, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", outline: 'none', resize: 'vertical', boxSizing: 'border-box' },
    inputError: { borderColor: '#ef4444' },
    errMsg: { display: 'block', fontSize: 12, color: '#ef4444', marginTop: 6 },
    submitBtn: { width: '100%', padding: '14px', background: '#6366F1', border: 'none', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'IBM Plex Sans', system-ui, sans-serif", transition: 'background 150ms' },
    successBox: { textAlign: 'center', padding: '40px 0' },
    successTitle: { fontSize: 22, fontWeight: 700, color: '#F1F5F9', margin: '0 0 12px' },
    successSub: { fontSize: 15, color: '#64748B', lineHeight: 1.7, marginBottom: 28 },
    resetBtn: { padding: '12px 24px', background: '#1A202E', border: '1px solid #252D3D', borderRadius: 8, color: '#6366F1', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'IBM Plex Sans', system-ui, sans-serif" },
    infoCol: { flex: '1 1 240px', display: 'flex', flexDirection: 'column', gap: 16, boxSizing: 'border-box' },
    infoCard: { background: '#131720', border: '1px solid #252D3D', borderRadius: 12, padding: '20px 24px' },
    infoTitle: { fontSize: 14, fontWeight: 700, color: '#F1F5F9', marginBottom: 6 },
    infoLink: { fontSize: 13.5, color: '#6366F1', textDecoration: 'none', wordBreak: 'break-all' },
    infoNote: { fontSize: 13, color: '#64748B', lineHeight: 1.6, margin: '6px 0 0' },
};
