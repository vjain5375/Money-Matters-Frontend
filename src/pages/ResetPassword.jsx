import { useState, useEffect } from 'react';
import { Input, Button, message } from 'antd';
import { LockOutlined, CheckCircleOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function ResetPassword() {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [validSession, setValidSession] = useState(false);
    const [checking, setChecking] = useState(true);

    // Supabase puts tokens in the URL hash on redirect — process them
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setValidSession(!!session);
            setChecking(false);
        });

        // Also listen for the session change triggered by the hash token
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY') {
                setValidSession(true);
                setChecking(false);
            } else if (session) {
                setValidSession(true);
                setChecking(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleReset = async () => {
        if (password.length < 8) {
            message.warning('Password must be at least 8 characters.');
            return;
        }
        if (password !== confirm) {
            message.error('Passwords do not match.');
            return;
        }

        setLoading(true);
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            message.error({ content: error.message, duration: 4 });
        } else {
            setDone(true);
            // Auto redirect after 3 seconds
            setTimeout(() => navigate('/'), 3000);
        }
    };

    // ── Loading state
    if (checking) {
        return (
            <div style={S.page}>
                <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                    Verifying reset link…
                </div>
            </div>
        );
    }

    // ── Invalid / expired link
    if (!validSession) {
        return (
            <div style={S.page}>
                <div style={S.card}>
                    <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
                    <div style={S.formTitle}>Link expired</div>
                    <div style={{ ...S.sub, marginTop: 8, marginBottom: 24 }}>
                        This reset link has expired or is invalid.<br />
                        Please request a new one.
                    </div>
                    <Link to="/login">
                        <Button type="primary" block style={S.btn}>
                            Back to login
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    // ── Success state
    if (done) {
        return (
            <div style={S.page}>
                <div style={S.card}>
                    <CheckCircleOutlined style={{ fontSize: 40, color: '#16a34a', marginBottom: 16 }} />
                    <div style={S.formTitle}>Password updated!</div>
                    <div style={{ ...S.sub, marginTop: 8, marginBottom: 24 }}>
                        Your new password has been set successfully.<br />
                        Redirecting you to the dashboard…
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: '#e5e7eb', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%', width: '100%',
                            background: 'linear-gradient(90deg, #5b52f0, #7c6ffa)',
                            animation: 'shrink 3s linear forwards',
                        }} />
                    </div>
                </div>
            </div>
        );
    }

    // ── Main reset form
    return (
        <div style={S.page}>
            <div style={S.card}>
                {/* Logo */}
                <div style={S.logoRow}>
                    <div style={S.logoIcon}>
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                            <path d="M3 15V5l7 7 7-7v10" stroke="#fff"
                                strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <span style={S.logoText}>Money<span style={{ color: '#5b52f0' }}>Matters</span></span>
                </div>

                <div style={{ marginBottom: 28 }}>
                    <div style={S.formTitle}>Set new password</div>
                    <div style={S.sub}>Choose a strong password — at least 8 characters.</div>
                </div>

                {/* New password */}
                <div style={{ marginBottom: 6 }}>
                    <span style={S.label}>New password</span>
                </div>
                <Input.Password
                    prefix={<LockOutlined style={{ color: '#d1d5db' }} />}
                    placeholder="Min. 8 characters"
                    size="large"
                    style={S.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {/* Confirm */}
                <div style={{ margin: '18px 0 6px' }}>
                    <span style={S.label}>Confirm password</span>
                </div>
                <Input.Password
                    prefix={<LockOutlined style={{ color: '#d1d5db' }} />}
                    placeholder="Re-enter password"
                    size="large"
                    style={S.input}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onPressEnter={handleReset}
                />

                {/* Strength indicator */}
                {password.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} style={{
                                flex: 1, height: 3, borderRadius: 2,
                                background: password.length >= i * 3
                                    ? i <= 1 ? '#ef4444' : i <= 2 ? '#f59e0b' : i <= 3 ? '#3b82f6' : '#16a34a'
                                    : '#e5e7eb',
                                transition: 'background 0.2s',
                            }} />
                        ))}
                        <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6, whiteSpace: 'nowrap' }}>
                            {password.length < 4 ? 'Weak' : password.length < 7 ? 'Fair' : password.length < 10 ? 'Good' : 'Strong'}
                        </span>
                    </div>
                )}

                <Button
                    type="primary"
                    loading={loading}
                    icon={!loading && <ArrowRightOutlined />}
                    iconPosition="end"
                    onClick={handleReset}
                    block
                    size="large"
                    style={{ ...S.btn, marginTop: 28 }}
                >
                    {loading ? 'Updating…' : 'Update password'}
                </Button>

                <div style={{ textAlign: 'center', marginTop: 20 }}>
                    <Link to="/login" style={{ fontSize: 12.5, color: '#9ca3af' }}>← Back to login</Link>
                </div>
            </div>

            <style>{`@keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } transform-origin: left; }`}</style>
        </div>
    );
}

const S = {
    page: {
        minHeight: '100vh', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(145deg, #f0f0ff 0%, #f9fafb 100%)',
        fontFamily: "'Inter', sans-serif", padding: 24,
    },
    card: {
        background: '#fff', borderRadius: 20, padding: '40px 44px',
        width: '100%', maxWidth: 400,
        boxShadow: '0 8px 40px rgba(91,82,240,0.10), 0 1px 4px rgba(0,0,0,0.05)',
    },
    logoRow: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 32 },
    logoIcon: {
        width: 32, height: 32,
        background: 'linear-gradient(145deg, #5b52f0, #7c6ffa)',
        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 3px 12px rgba(91,82,240,0.4)',
    },
    logoText: { fontSize: 16, fontWeight: 800, color: '#111827', letterSpacing: '-0.4px' },
    formTitle: { fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.5px' },
    sub: { fontSize: 13.5, color: '#6b7280', lineHeight: 1.6 },
    label: { fontSize: 13, fontWeight: 600, color: '#374151' },
    input: { height: 44, borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14 },
    btn: {
        height: 46, borderRadius: 10,
        background: 'linear-gradient(135deg, #5b52f0 0%, #7c6ffa 100%)',
        border: 'none', fontWeight: 700, fontSize: 14,
        boxShadow: '0 4px 16px rgba(91,82,240,0.35)',
    },
};
