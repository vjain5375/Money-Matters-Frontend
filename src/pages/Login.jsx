import { useState } from 'react';
import { Form, Input, Button, message, Divider } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

export default function Login() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [googleLoad, setGoogleLoad] = useState(false);
    const [forgotMode, setForgotMode] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    /* ── Email sign in ── */
    const onFinish = async ({ email, password }) => {
        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);
        if (error) {
            const msg = error.message.includes('Invalid login credentials')
                ? '❌ Wrong email or password. Please try again.'
                : error.message.includes('Email not confirmed')
                    ? '📧 Please confirm your email first — check your inbox!'
                    : error.message;
            message.error({ content: msg, duration: 5 });
        } else {
            navigate('/');
        }
    };

    /* ── Google OAuth ── */
    const handleGoogle = async () => {
        setGoogleLoad(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/` },
        });
        if (error) {
            message.error({ content: error.message, duration: 4 });
            setGoogleLoad(false);
        }
    };

    /* ── Forgot password ── */
    const handleReset = async () => {
        if (!resetEmail.trim()) {
            message.warning('Please enter your email address.');
            return;
        }
        setResetLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setResetLoading(false);
        if (error) {
            message.error({ content: error.message, duration: 4 });
        } else {
            setResetSent(true);
        }
    };

    /* ══════════════════════════════════════════
       FORGOT PASSWORD PANEL
    ══════════════════════════════════════════ */
    const forgotPanel = (
        <div style={S.formWrap}>
            <button style={S.backBtn} onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail(''); }}>
                <ArrowLeftOutlined style={{ marginRight: 6 }} /> Back to sign in
            </button>

            {resetSent ? (
                <div style={S.resetSuccess}>
                    <CheckCircleOutlined style={{ fontSize: 36, color: '#16a34a', marginBottom: 14 }} />
                    <div style={S.formTitle}>Check your inbox</div>
                    <div style={{ ...S.formSub, marginTop: 8, lineHeight: 1.6 }}>
                        We sent a password reset link to <strong>{resetEmail}</strong>.<br />
                        Click the link in that email to set a new password.
                    </div>
                    <div style={{ marginTop: 20, fontSize: 12.5, color: '#9ca3af' }}>
                        Didn't receive it?{' '}
                        <span style={S.link} onClick={() => { setResetSent(false); }}>Try again</span>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 28 }}>
                        <div style={S.formTitle}>Reset password</div>
                        <div style={S.formSub}>
                            Enter your email and we'll send you a reset link.
                        </div>
                    </div>

                    <div style={{ marginBottom: 6 }}>
                        <span style={S.label}>Email address</span>
                    </div>
                    <Input
                        prefix={<MailOutlined style={{ color: '#d1d5db', fontSize: 14 }} />}
                        placeholder="you@example.com"
                        size="large"
                        style={S.input}
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        onPressEnter={handleReset}
                    />
                    <Button
                        type="primary"
                        loading={resetLoading}
                        onClick={handleReset}
                        block
                        style={{ ...S.submitBtn, marginTop: 20 }}
                        size="large"
                    >
                        {resetLoading ? 'Sending…' : 'Send reset link'}
                    </Button>
                </>
            )}
        </div>
    );

    /* ══════════════════════════════════════════
       MAIN LOGIN FORM
    ══════════════════════════════════════════ */
    const loginPanel = (
        <div style={S.formWrap}>
            <div style={{ marginBottom: 32 }}>
                <div style={S.formTitle}>Sign in</div>
                <div style={S.formSub}>
                    No account?{' '}
                    <Link to="/signup" style={S.link}>Create one free →</Link>
                </div>
            </div>

            {/* Google */}
            <button
                style={{ ...S.googleBtn, ...(googleLoad ? { opacity: 0.7, cursor: 'wait' } : {}) }}
                onClick={handleGoogle}
                disabled={googleLoad}
            >
                {googleLoad ? (
                    <span style={{ fontSize: 13, color: '#6b7280' }}>Redirecting to Google…</span>
                ) : (
                    <>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        <span style={{ fontWeight: 600, fontSize: 13.5, color: '#374151' }}>Continue with Google</span>
                    </>
                )}
            </button>

            <Divider style={{ margin: '20px 0', borderColor: '#f3f4f6' }}>
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>or sign in with email</span>
            </Divider>

            <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
                <Form.Item
                    name="email"
                    label={<span style={S.label}>Email address</span>}
                    rules={[
                        { required: true, message: 'Please enter your email.' },
                        { type: 'email', message: 'Enter a valid email.' },
                    ]}
                    style={{ marginBottom: 18 }}
                >
                    <Input
                        id="login-email"
                        prefix={<MailOutlined style={{ color: '#d1d5db', fontSize: 14 }} />}
                        placeholder="you@example.com"
                        style={S.input}
                    />
                </Form.Item>

                {/* Password label row — outside Form.Item to avoid merge bug */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={S.label}>Password</span>
                    <span style={S.forgotLink} onClick={() => setForgotMode(true)}>
                        Forgot password?
                    </span>
                </div>
                <Form.Item
                    name="password"
                    rules={[{ required: true, message: 'Please enter your password.' }]}
                    style={{ marginBottom: 24 }}
                >
                    <Input.Password
                        id="login-password"
                        prefix={<LockOutlined style={{ color: '#d1d5db', fontSize: 14 }} />}
                        placeholder="••••••••"
                        style={S.input}
                    />
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                        id="login-submit"
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        icon={!loading && <ArrowRightOutlined />}
                        iconPosition="end"
                        block
                        style={S.submitBtn}
                    >
                        {loading ? 'Signing in…' : 'Sign in to dashboard'}
                    </Button>
                </Form.Item>
            </Form>

            <p style={S.footerNote}>
                By signing in you agree to our{' '}
                <span style={S.link}>Terms</span> &{' '}
                <span style={S.link}>Privacy Policy</span>
            </p>
        </div>
    );

    /* ══════════════════════════════════════════
       PAGE SHELL
    ══════════════════════════════════════════ */
    return (
        <div style={S.page}>
            {/* Left branding panel */}
            <div style={S.left}>
                <div style={S.blob1} />
                <div style={S.blob2} />
                <div style={S.leftInner}>
                    <div style={S.logoRow}>
                        <div style={S.logoIcon}>
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M3 15V5l7 7 7-7v10" stroke="#fff"
                                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span style={S.logoText}>Money<span style={{ color: '#a78bfa' }}>Matters</span></span>
                    </div>
                    <h1 style={S.headline}>Your finances,<br />finally under control.</h1>
                    <p style={S.subline}>Track every rupee. Spot patterns. Hit your goals — all in one place.</p>
                    <div style={S.features}>
                        {[
                            { icon: '📊', text: 'Real-time spending insights' },
                            { icon: '🤖', text: 'ML-powered categorisation' },
                            { icon: '🔐', text: 'Bank-grade security (RLS)' },
                            { icon: '📈', text: 'Monthly budget tracking' },
                        ].map((f) => (
                            <div key={f.text} style={S.featureRow}>
                                <span style={{ fontSize: 18 }}>{f.icon}</span>
                                <span style={S.featureText}>{f.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right form panel */}
            <div style={S.right}>
                {forgotMode ? forgotPanel : loginPanel}
            </div>
        </div>
    );
}

/* ─── Styles ─── */
const S = {
    page: { display: 'flex', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    left: {
        flex: 1,
        background: 'linear-gradient(145deg, #0d0c1d 0%, #1a1540 55%, #111827 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 56px', position: 'relative', overflow: 'hidden',
    },
    blob1: {
        position: 'absolute', top: -80, left: -80, width: 320, height: 320,
        background: 'radial-gradient(circle, rgba(91,82,240,0.25) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
    },
    blob2: {
        position: 'absolute', bottom: -60, right: -60, width: 280, height: 280,
        background: 'radial-gradient(circle, rgba(62,207,142,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none',
    },
    leftInner: { position: 'relative', zIndex: 1, maxWidth: 400 },
    logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 52 },
    logoIcon: {
        width: 36, height: 36,
        background: 'linear-gradient(145deg, #5b52f0, #7c6ffa)',
        borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 4px 18px rgba(91,82,240,0.5)',
    },
    logoText: { fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' },
    headline: { fontSize: 38, fontWeight: 800, color: '#fff', lineHeight: 1.18, letterSpacing: '-1px', margin: '0 0 16px' },
    subline: { fontSize: 15, color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 40px' },
    features: { display: 'flex', flexDirection: 'column', gap: 12 },
    featureRow: {
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 10, padding: '11px 16px', backdropFilter: 'blur(6px)',
    },
    featureText: { fontSize: 13.5, color: 'rgba(255,255,255,0.72)', fontWeight: 500 },

    right: {
        width: 460, flexShrink: 0, background: '#f9fafb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '60px 48px',
    },
    formWrap: { width: '100%', maxWidth: 360 },
    formTitle: { fontSize: 26, fontWeight: 800, color: '#111827', letterSpacing: '-0.6px', marginBottom: 6 },
    formSub: { fontSize: 13.5, color: '#6b7280' },
    label: { fontSize: 13, fontWeight: 600, color: '#374151' },
    link: { color: '#5b52f0', fontWeight: 600, cursor: 'pointer', textDecoration: 'none' },
    forgotLink: { fontSize: 12.5, color: '#5b52f0', fontWeight: 500, cursor: 'pointer', userSelect: 'none' },
    input: { height: 46, borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, background: '#fff' },
    submitBtn: {
        height: 48, borderRadius: 11,
        background: 'linear-gradient(135deg, #5b52f0 0%, #7c6ffa 100%)',
        border: 'none', fontWeight: 700, fontSize: 14.5,
        boxShadow: '0 4px 18px rgba(91,82,240,0.38)',
    },
    googleBtn: {
        width: '100%', height: 48,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
        background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 11,
        cursor: 'pointer', fontFamily: "'Inter', sans-serif",
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', transition: 'box-shadow 0.15s',
    },
    footerNote: { fontSize: 12, color: '#9ca3af', textAlign: 'center', marginTop: 24 },
    backBtn: {
        display: 'flex', alignItems: 'center',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: 13, color: '#6b7280', fontWeight: 500,
        padding: '0 0 28px', fontFamily: "'Inter', sans-serif",
    },
    resetSuccess: { textAlign: 'center', paddingTop: 12 },
};
