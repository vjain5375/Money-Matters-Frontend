import { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { MailOutlined, LockOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const FEATURES = [
    { text: 'Spending breakdown by category', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
    { text: 'Auto-categorises transactions with ML', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg> },
    { text: 'Row-level security — your data stays yours', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> },
    { text: 'Monthly budgets with live progress', icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> },
];

const LeftPanel = () => (
    <div style={S.left} className="auth-left">
        <div style={S.leftInner}>
            <div style={S.logoRow}>
                <div style={S.logoIcon}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M3 15V5l7 7 7-7v10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </div>
                <span style={S.logoText}>Money<span style={{color:'#a78bfa'}}>Matters</span></span>
            </div>
            <h1 style={S.headline}>Know where every<br/>rupee goes.</h1>
            <p style={S.subline}>Smart expense tracking with AI-powered insights —<br/>built for how Indians actually spend.</p>
            <div style={S.pillsList}>
                {FEATURES.map((f,i) => (
                    <div key={i} style={S.pill}>
                        <div style={S.pillIcon}>{f.icon}</div>
                        <span style={S.pillText}>{f.text}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

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
            message.success({ content: 'Account created! Check your email to confirm.', duration: 5 });
            navigate('/login');
        }
    };

    return (
        <div style={S.page} className="auth-page">
            <LeftPanel />

            <div style={S.right} className="auth-right">
                {/* Mobile-only branding header */}
                <div className="auth-mobile-header" style={S.mobileHeader}>
                    <div style={S.mobileLogoRow}>
                        <div style={S.mobileLogoIcon}>
                            <svg width="22" height="22" viewBox="0 0 20 20" fill="none">
                                <path d="M3 15V5l7 7 7-7v10" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                        <span style={S.mobileLogoText}>MoneyMatters <span style={{background:'linear-gradient(90deg,#818CF8,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', fontWeight:800}}>AI</span></span>
                    </div>
                    <h1 style={S.mobileHeadline}>Take control of<br/>your money. Finally.</h1>
                    <p style={S.mobileTaglineSub}>Join thousands who've stopped wondering and started knowing — exactly where every rupee goes.</p>
                </div>
                <div style={S.formWrap} className="auth-form-wrap">
                    <div style={S.formTitle} className="auth-title">Create your account</div>
                    <div style={S.formSub} className="auth-subtitle">
                        Already have an account?{' '}
                        <Link to="/login" style={S.link} className="auth-link">Sign in →</Link>
                    </div>

                    <Form layout="vertical" onFinish={onFinish} requiredMark={false} style={{ marginTop: 28 }}>
                        <Form.Item name="name" label={<span style={S.fieldLabel} className="auth-label">Full name</span>}
                            rules={[{ required: true, message: 'Please enter your name.' }]} style={{ marginBottom: 16 }}>
                            <Input id="signup-name" prefix={<UserOutlined style={{ color: '#9CA3AF' }} />} placeholder="Vansh Jain" style={S.input} className="auth-input"/>
                        </Form.Item>

                        <Form.Item name="email" label={<span style={S.fieldLabel} className="auth-label">Email address</span>}
                            rules={[{ required: true, message: 'Please enter your email.' }, { type: 'email', message: 'Enter a valid email.' }]} style={{ marginBottom: 16 }}>
                            <Input id="signup-email" prefix={<MailOutlined style={{ color: '#9CA3AF' }} />} placeholder="vansh@example.com" style={S.input} className="auth-input"/>
                        </Form.Item>

                        <Form.Item name="password" label={<span style={S.fieldLabel} className="auth-label">Password</span>}
                            rules={[{ required: true, message: 'Please enter a password.' }, { min: 8, message: 'Minimum 8 characters.' }]} style={{ marginBottom: 16 }}>
                            <Input.Password id="signup-password" prefix={<LockOutlined style={{ color: '#9CA3AF' }} />} placeholder="Min. 8 characters" style={S.input} className="auth-input"/>
                        </Form.Item>

                        <Form.Item name="confirm" label={<span style={S.fieldLabel} className="auth-label">Confirm password</span>}
                            dependencies={['password']}
                            rules={[{ required: true, message: 'Please confirm your password.' }, ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) return Promise.resolve();
                                    return Promise.reject(new Error('Passwords do not match.'));
                                },
                            })]} style={{ marginBottom: 24 }}>
                            <Input.Password id="signup-confirm" prefix={<LockOutlined style={{ color: '#9CA3AF' }} />} placeholder="Re-enter password" style={S.input} className="auth-input"/>
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0 }}>
                            <Button id="signup-submit" type="primary" htmlType="submit" loading={loading}
                                icon={!loading && <ArrowRightOutlined />} iconPosition="end" block style={S.submitBtn} className="auth-submit-btn">
                                {loading ? 'Creating account…' : 'Create free account →'}
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={S.footerNote} className="auth-footer-note">
                        By signing up you agree to our{' '}
                        <Link to="/terms" style={S.link} className="auth-link">Terms</Link> &{' '}
                        <Link to="/privacy" style={S.link} className="auth-link">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

const S = {
    page: { display:'flex', minHeight:'100vh', fontFamily:"'IBM Plex Sans', system-ui, sans-serif" },
    left: { flex:'0 0 68%', background:'#0a0a1a', borderRight:'1px solid rgba(255,255,255,0.05)', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'60px 40px', minHeight:'100vh', position:'relative', overflow:'hidden' },
    leftInner: { width:'100%', maxWidth:560, position:'relative', zIndex:1 },
    logoRow: { display:'flex', alignItems:'center', gap:10, marginBottom:52 },
    logoIcon: { width:40, height:40, background:'#6366F1', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center' },
    logoText: { fontSize:20, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' },
    headline: { fontFamily:"'Plus Jakarta Sans', system-ui, sans-serif", fontSize:56, fontWeight:800, color:'#ffffff', lineHeight:1.05, margin:'32px 0 16px', letterSpacing:'-0.5px' },
    subline: { fontSize:17, color:'rgba(255,255,255,0.60)', lineHeight:1.6, margin:'0 0 36px' },
    pillsList: { display:'flex', flexDirection:'column', gap:12 },
    pill: { display:'flex', alignItems:'center', gap:14, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', maxWidth:440 },
    pillIcon: { width:24, height:24, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(255,255,255,0.4)' },
    pillText: { fontSize:15, color:'rgba(255,255,255,0.7)', fontWeight:400 },
    right: { flex:'0 0 32%', background:'#ffffff', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'60px 40px', minHeight:'100vh', overflowY:'auto', borderLeft:'1px solid #E2E8F0' },
    formWrap: { width:'100%', maxWidth:380 },
    formTitle: { fontSize:36, fontWeight:700, color:'#0B0F19', letterSpacing:'-0.5px', marginBottom:8 },
    formSub: { fontSize:14, color:'#64748B' },
    fieldLabel: { fontSize:14, fontWeight:500, color:'#64748B', marginBottom:6, display:'block' },
    link: { color:'#6366F1', fontWeight:500, cursor:'pointer', textDecoration:'none' },
    input: { padding:'13px 16px', height:'auto', borderRadius:10, border:'1px solid #E2E8F0', fontSize:15, background:'#ffffff', color:'#0F172A', transition: 'border 0.2s' },
    submitBtn: { padding:'14px 20px', height:'auto', borderRadius:10, background:'#6366F1', border:'none', fontWeight:600, fontSize:15, boxShadow:'none', transition:'background 150ms', color:'#ffffff' },
    footerNote: { fontSize:13, color:'#64748B', textAlign:'center', marginTop:24 },
    // Mobile-only header (hidden on desktop, shown on mobile via CSS media query)
    mobileHeader: { width:'100%', display:'none' },
    mobileLogoRow: { display:'flex', flexDirection:'row', alignItems:'center', gap:12, marginBottom:20 },
    mobileLogoIcon: { width:40, height:40, background:'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(99,102,241,0.4)', flexShrink:0 },
    mobileLogoText: { fontSize:22, fontWeight:800, color:'#ffffff', letterSpacing:'-0.3px', lineHeight:1 },
    mobileHeadline: { fontFamily:"'IBM Plex Sans', system-ui, sans-serif", fontSize:32, fontWeight:700, color:'#ffffff', lineHeight:1.15, margin:'0 0 12px', letterSpacing:'-0.5px' },
    mobileTaglineSub: { fontSize:15, color:'#94A3B8', lineHeight:1.6, margin:'0 0 36px', fontWeight:400, maxWidth:320 },
    mobileTagline: { display:'none' },
};
