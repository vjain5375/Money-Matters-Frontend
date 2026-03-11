import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const onFinish = async ({ email, password }) => {
        setLoading(true);
        const { error } = await signUp(email, password);
        setLoading(false);

        if (error) {
            message.error({ content: error.message, duration: 4 });
        } else {
            message.success({
                content: '🎉 Account created! Check your email to confirm.',
                duration: 5,
            });
            navigate('/login');
        }
    };

    return (
        <div style={styles.page}>
            {/* Left panel — branding */}
            <div style={styles.left}>
                <div style={styles.leftInner}>
                    {/* Logo */}
                    <div style={styles.logoRow}>
                        <div style={styles.logoIcon}>
                            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                                <path d="M3 15V5l7 7 7-7v10" stroke="#fff"
                                    strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div style={styles.logoText}>Money<span style={{ color: '#a78bfa' }}>Matters</span></div>
                    </div>

                    <div style={styles.headline}>
                        Take control of<br />your money today.
                    </div>
                    <div style={styles.subline}>
                        Join thousands of Indians who track smarter with MoneyMatters AI.
                    </div>

                    {/* Stats */}
                    <div style={styles.statsRow}>
                        {[
                            { value: '2,400+', label: 'Active users' },
                            { value: '₹12Cr+', label: 'Expenses tracked' },
                            { value: '4.9★', label: 'User rating' },
                        ].map((s) => (
                            <div key={s.label} style={styles.statBox}>
                                <div style={styles.statValue}>{s.value}</div>
                                <div style={styles.statLabel}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Testimonial */}
                    <div style={styles.testimonial}>
                        <div style={styles.testimonialText}>
                            "MoneyMatters helped me save ₹8,000 extra last month just by showing me where I was overspending."
                        </div>
                        <div style={styles.testimonialAuthor}>— Priya S., Bangalore</div>
                    </div>
                </div>
            </div>

            {/* Right panel — form */}
            <div style={styles.right}>
                <div style={styles.formCard}>
                    <div style={{ marginBottom: 28 }}>
                        <div style={styles.formTitle}>Create your account</div>
                        <div style={styles.formSub}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#5b52f0', fontWeight: 600 }}>
                                Sign in →
                            </Link>
                        </div>
                    </div>

                    <Form layout="vertical" onFinish={onFinish} requiredMark={false}>

                        <Form.Item
                            name="name"
                            label={<span style={styles.label}>Full name</span>}
                            rules={[{ required: true, message: 'Please enter your name.' }]}
                        >
                            <Input
                                id="signup-name"
                                prefix={<UserOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="Vansh Jain"
                                style={styles.input}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            label={<span style={styles.label}>Email address</span>}
                            rules={[
                                { required: true, message: 'Please enter your email.' },
                                { type: 'email', message: 'Enter a valid email.' },
                            ]}
                        >
                            <Input
                                id="signup-email"
                                prefix={<MailOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="vansh@example.com"
                                style={styles.input}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            label={<span style={styles.label}>Password</span>}
                            rules={[
                                { required: true, message: 'Please enter a password.' },
                                { min: 8, message: 'Minimum 8 characters.' },
                            ]}
                        >
                            <Input.Password
                                id="signup-password"
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="Min. 8 characters"
                                style={styles.input}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item
                            name="confirm"
                            label={<span style={styles.label}>Confirm password</span>}
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Please confirm your password.' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value)
                                            return Promise.resolve();
                                        return Promise.reject(new Error('Passwords do not match.'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password
                                id="signup-confirm"
                                prefix={<LockOutlined style={{ color: '#9ca3af' }} />}
                                placeholder="Re-enter password"
                                style={styles.input}
                                size="large"
                            />
                        </Form.Item>

                        <Form.Item style={{ marginTop: 8 }}>
                            <Button
                                id="signup-submit"
                                type="primary"
                                htmlType="submit"
                                loading={loading}
                                icon={!loading && <ArrowRightOutlined />}
                                iconPosition="end"
                                size="large"
                                style={styles.submitBtn}
                                block
                            >
                                {loading ? 'Creating account…' : 'Create free account'}
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={styles.footerNote}>
                        By signing up you agree to our{' '}
                        <span style={{ color: '#5b52f0', cursor: 'pointer' }}>Terms</span> &{' '}
                        <span style={{ color: '#5b52f0', cursor: 'pointer' }}>Privacy Policy</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ─── Styles ─── */
const styles = {
    page: {
        display: 'flex',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
    },
    left: {
        flex: 1,
        background: 'linear-gradient(145deg, #0f0e24 0%, #1a1540 50%, #0f172a 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px',
        position: 'relative',
        overflow: 'hidden',
    },
    leftInner: {
        position: 'relative',
        zIndex: 1,
        maxWidth: 420,
    },
    logoRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 48,
    },
    logoIcon: {
        width: 34,
        height: 34,
        background: 'linear-gradient(145deg, #5b52f0 0%, #7c6ffa 100%)',
        borderRadius: 9,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 16px rgba(91,82,240,0.45)',
    },
    logoText: {
        fontSize: 16,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: '-0.4px',
    },
    headline: {
        fontSize: 36,
        fontWeight: 800,
        color: '#ffffff',
        lineHeight: 1.2,
        letterSpacing: '-1px',
        marginBottom: 14,
    },
    subline: {
        fontSize: 14.5,
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 36,
        lineHeight: 1.6,
    },
    statsRow: {
        display: 'flex',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10,
        padding: '12px 14px',
        backdropFilter: 'blur(8px)',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 800,
        color: '#fff',
        letterSpacing: '-0.5px',
    },
    statLabel: {
        fontSize: 11,
        color: 'rgba(255,255,255,0.45)',
        marginTop: 2,
        fontWeight: 500,
    },
    testimonial: {
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: '16px 18px',
        backdropFilter: 'blur(8px)',
    },
    testimonialText: {
        fontSize: 13.5,
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1.6,
        fontStyle: 'italic',
        marginBottom: 8,
    },
    testimonialAuthor: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 600,
    },
    right: {
        width: '460px',
        flexShrink: 0,
        background: '#f9fafb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
    },
    formCard: {
        width: '100%',
        maxWidth: 380,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 800,
        color: '#111827',
        letterSpacing: '-0.5px',
        marginBottom: 6,
    },
    formSub: {
        fontSize: 13.5,
        color: '#6b7280',
    },
    label: {
        fontSize: 13,
        fontWeight: 600,
        color: '#374151',
    },
    input: {
        height: 44,
        borderRadius: 9,
        border: '1.5px solid #e5e7eb',
        fontSize: 14,
    },
    submitBtn: {
        height: 46,
        borderRadius: 10,
        background: 'linear-gradient(135deg, #5b52f0 0%, #7c6ffa 100%)',
        border: 'none',
        fontWeight: 700,
        fontSize: 14,
        boxShadow: '0 4px 16px rgba(91,82,240,0.35)',
    },
    footerNote: {
        fontSize: 12,
        color: '#9ca3af',
        textAlign: 'center',
        marginTop: 20,
    },
};
