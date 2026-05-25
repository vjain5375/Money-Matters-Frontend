import { useState, useRef } from 'react';
import { Form, Input, Button, message, Divider } from 'antd';
import { MailOutlined, LockOutlined, ArrowRightOutlined, ArrowLeftOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const getAuthEmailErrorMessage = (error) => {
    const msg = error?.message || '';
    const isProviderIssue = error?.code === 'unexpected_failure' &&
        (msg.includes('Error sending magic link email') || msg.includes('Error sending recovery email'));
    if (!isProviderIssue) return msg || 'Something went wrong.';
    return 'Email delivery is currently unavailable.';
};

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

export default function Login() {
    const { signIn, sendOtp, verifyOtp } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [googleLoad, setGoogleLoad] = useState(false);
    const [forgotMode, setForgotMode] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [otpMode, setOtpMode] = useState(false);
    const [otpEmail, setOtpEmail] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otpDigits, setOtpDigits] = useState(['','','','','','']);
    const [otpSending, setOtpSending] = useState(false);
    const [otpVerifying, setOtpVerifying] = useState(false);
    const [otpResendTimer, setOtpResendTimer] = useState(0);
    const otpRefs = useRef([]);
    const timerRef = useRef(null);

    const onFinish = async ({ email, password }) => {
        setLoading(true);
        const { error } = await signIn(email, password);
        setLoading(false);
        if (error) {
            const msg = error.message.includes('Invalid login credentials') ? 'Wrong email or password.' : error.message;
            message.error({ content: msg, duration: 5 });
        } else navigate('/');
    };

    const handleGoogle = async () => {
        setGoogleLoad(true);
        const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/` } });
        if (error) { message.error({ content: error.message, duration: 4 }); setGoogleLoad(false); }
    };

    const startResendTimer = () => {
        setOtpResendTimer(60);
        clearInterval(timerRef.current);
        timerRef.current = setInterval(() => setOtpResendTimer(t => { if (t<=1){clearInterval(timerRef.current);return 0;} return t-1; }), 1000);
    };

    const handleSendOtp = async () => {
        if (!otpEmail.trim()) { message.warning('Please enter your email.'); return; }
        setOtpSending(true);
        const { error } = await sendOtp(otpEmail.trim());
        setOtpSending(false);
        if (error) message.error({ content: getAuthEmailErrorMessage(error), duration: 5 });
        else { setOtpSent(true); setOtpDigits(['','','','','','']); startResendTimer(); setTimeout(()=>otpRefs.current[0]?.focus(),100); }
    };

    const handleOtpDigit = (val, idx) => {
        const digit = val.replace(/\D/g,'').slice(-1);
        const next = [...otpDigits]; next[idx] = digit; setOtpDigits(next);
        if (digit && idx<5) otpRefs.current[idx+1]?.focus();
        if (next.every(d=>d!=='') && next.join('').length===6) handleVerifyOtp(next.join(''));
    };

    const handleVerifyOtp = async (code) => {
        setOtpVerifying(true);
        const { error } = await verifyOtp(otpEmail.trim(), code);
        setOtpVerifying(false);
        if (error) { message.error({ content: 'Invalid or expired code.', duration: 4 }); setOtpDigits(['','','','','','']); setTimeout(()=>otpRefs.current[0]?.focus(),100); }
        else navigate('/');
    };

    const handleReset = async () => {
        if (!resetEmail.trim()) { message.warning('Please enter your email.'); return; }
        setResetLoading(true);
        const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), { redirectTo: `${window.location.origin}/reset-password` });
        setResetLoading(false);
        if (error) message.error({ content: getAuthEmailErrorMessage(error), duration: 4 });
        else setResetSent(true);
    };

    const resetOtpMode = () => { setOtpMode(false); setOtpSent(false); setOtpEmail(''); setOtpDigits(['','','','','','']); setOtpResendTimer(0); clearInterval(timerRef.current); };

    const otpPanel = (
        <>
            <button style={S.backBtn} className="auth-back-btn" onClick={resetOtpMode}><ArrowLeftOutlined style={{marginRight:6}}/> Back to sign in</button>
            {!otpSent ? (
                <>
                    <div style={S.formTitle} className="auth-title">Sign in with OTP</div>
                    <div style={{...S.formSub,marginBottom:24}} className="auth-subtitle">We'll email you a 6-digit code — no password needed.</div>
                    <label style={S.fieldLabel} className="auth-label">Email address</label>
                    <Input prefix={<MailOutlined style={{color:'#9CA3AF'}}/>} placeholder="you@example.com" size="large" style={S.input} className="auth-input" value={otpEmail} onChange={e=>setOtpEmail(e.target.value)} onPressEnter={handleSendOtp} autoFocus/>
                    <Button type="primary" loading={otpSending} onClick={handleSendOtp} block style={{...S.submitBtn,marginTop:20}} className="auth-submit-btn" size="large">{otpSending?'Sending…':'Send OTP'}</Button>
                </>
            ) : (
                <>
                    <div style={S.formTitle} className="auth-title">Enter your code</div>
                    <div style={{...S.formSub,marginBottom:24}} className="auth-subtitle">Sent to <strong className="auth-strong">{otpEmail}</strong></div>
                    <div style={S.otpRow} onPaste={e=>{e.preventDefault();const p=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);if(p.length===6){setOtpDigits(p.split(''));otpRefs.current[5]?.focus();handleVerifyOtp(p);}}}>
                        {otpDigits.map((d,i)=>(
                            <input key={i} ref={el=>(otpRefs.current[i]=el)} type="text" inputMode="numeric" maxLength={1} value={d}
                                onChange={e=>handleOtpDigit(e.target.value,i)}
                                onKeyDown={e=>{if(e.key==='Backspace'&&!otpDigits[i]&&i>0)otpRefs.current[i-1]?.focus();}}
                                style={{...S.otpBox,borderColor:d?'#6366F1':'#E5E7EB'}} className="auth-otp-box" />
                        ))}
                    </div>
                    {otpVerifying&&<div style={{textAlign:'center',color:'#6366F1',fontSize:13,marginTop:16}}>Verifying…</div>}
                    <div style={{textAlign:'center',marginTop:20,fontSize:13,color:'#9CA3AF'}} className="auth-subtitle">
                        Didn't receive it?{' '}{otpResendTimer>0?<span>Resend in {otpResendTimer}s</span>:<span style={{color:'#6366F1',cursor:'pointer'}} className="auth-link" onClick={()=>{setOtpSent(false);handleSendOtp();}}>Resend code</span>}
                    </div>
                </>
            )}
        </>
    );

    const forgotPanel = (
        <>
            <button style={S.backBtn} className="auth-back-btn" onClick={()=>{setForgotMode(false);setResetSent(false);setResetEmail('');}}><ArrowLeftOutlined style={{marginRight:6}}/> Back to sign in</button>
            {resetSent ? (
                <div style={{textAlign:'center',paddingTop:12}}>
                    <CheckCircleOutlined style={{fontSize:36,color:'#16a34a',marginBottom:14}}/>
                    <div style={S.formTitle} className="auth-title">Check your inbox</div>
                    <div style={{...S.formSub,marginTop:8}} className="auth-subtitle">Reset link sent to <strong className="auth-strong">{resetEmail}</strong>.</div>
                    <div style={{marginTop:16,fontSize:12.5,color:'#9CA3AF'}} className="auth-subtitle">Didn't get it?{' '}<span style={{color:'#6366F1',cursor:'pointer'}} className="auth-link" onClick={()=>setResetSent(false)}>Try again</span></div>
                </div>
            ) : (
                <>
                    <div style={S.formTitle} className="auth-title">Reset password</div>
                    <div style={{...S.formSub,marginBottom:24}} className="auth-subtitle">Enter your email and we'll send you a reset link.</div>
                    <label style={S.fieldLabel} className="auth-label">Email address</label>
                    <Input prefix={<MailOutlined style={{color:'#9CA3AF'}}/>} placeholder="you@example.com" size="large" style={S.input} className="auth-input" value={resetEmail} onChange={e=>setResetEmail(e.target.value)} onPressEnter={handleReset}/>
                    <Button type="primary" loading={resetLoading} onClick={handleReset} block style={{...S.submitBtn,marginTop:20}} className="auth-submit-btn" size="large">{resetLoading?'Sending…':'Send reset link'}</Button>
                </>
            )}
        </>
    );

    const loginPanel = (
        <>
            <div style={S.formTitle} className="auth-title">Sign in</div>
            <div style={S.formSub} className="auth-subtitle">No account?{' '}<Link to="/signup" style={S.link} className="auth-link">Create one free →</Link></div>
            <div style={{marginTop:28}}>
                <button style={{...S.googleBtn,...(googleLoad?{opacity:0.7,cursor:'wait'}:{})}} onClick={handleGoogle} disabled={googleLoad} className="auth-google-btn">
                    {googleLoad ? <span style={{fontSize:13,color:'#6B7280'}}>Redirecting…</span> : <>
                        <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        <span style={{fontWeight:500,fontSize:14,color:S.googleBtn.color}} className="auth-google-text">Continue with Google</span>
                    </>}
                </button>
            </div>
            <div style={S.orDivider} className="auth-divider"><div style={S.orLine} className="auth-divider-line"/><span style={S.orText} className="auth-divider-text">or</span><div style={S.orLine} className="auth-divider-line"/></div>
            <button style={S.otpBtn} onClick={()=>setOtpMode(true)} className="auth-otp-btn">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span style={{fontWeight:500,fontSize:14,color:'#6366F1'}}>Sign in with OTP</span>
            </button>
            <div style={S.orEmailLabel} className="auth-or-label">or sign in with email</div>
            <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
                <Form.Item name="email" label={<span style={S.fieldLabel} className="auth-label">Email address</span>} rules={[{required:true,message:'Please enter your email.'},{type:'email',message:'Enter a valid email.'}]} style={{marginBottom:16}}>
                    <Input id="login-email" prefix={<MailOutlined style={{color:'#9CA3AF'}}/>} placeholder="you@example.com" style={S.input} size="large" className="auth-input"/>
                </Form.Item>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={S.fieldLabel} className="auth-label">Password</span>
                    <span style={S.forgotLink} className="auth-link" onClick={()=>setForgotMode(true)}>Forgot password?</span>
                </div>
                <Form.Item name="password" rules={[{required:true,message:'Please enter your password.'}]} style={{marginBottom:0}}>
                    <Input.Password id="login-password" prefix={<LockOutlined style={{color:'#9CA3AF'}}/>} placeholder="••••••••" style={S.input} size="large" className="auth-input"/>
                </Form.Item>
                <Form.Item style={{marginTop:24,marginBottom:0}}>
                    <Button id="login-submit" type="primary" htmlType="submit" loading={loading} icon={!loading&&<ArrowRightOutlined/>} iconPosition="end" block size="large" style={S.submitBtn} className="auth-submit-btn">{loading?'Signing in…':'Sign in to dashboard'}</Button>
                </Form.Item>
            </Form>
            <p style={S.footerNote} className="auth-footer-note">By signing in you agree to our{' '}<Link to="/terms" style={S.link} className="auth-link">Terms</Link>{' '}&{' '}<Link to="/privacy" style={S.link} className="auth-link">Privacy Policy</Link></p>
        </>
    );

    return (
        <div style={S.page} className="auth-page">
            <LeftPanel/>
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
                    <h1 style={S.mobileHeadline}>Stop wondering where<br/>your money went.</h1>
                    <p style={S.mobileTaglineSub}>Track every rupee, spot leaks instantly, and actually stay on budget — all in one place.</p>
                </div>
                <div style={S.formWrap} className="auth-form-wrap">
                    {otpMode ? otpPanel : forgotMode ? forgotPanel : loginPanel}
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
    forgotLink: { fontSize:14, color:'#6366F1', fontWeight:500, cursor:'pointer', userSelect:'none' },
    input: { padding:'13px 16px', height:'auto', borderRadius:10, border:'1px solid #E2E8F0', fontSize:15, background:'#ffffff', color:'#0F172A', transition: 'border 0.2s' },
    googleBtn: { width:'100%', padding:'14px 16px', height:'auto', display:'flex', alignItems:'center', justifyContent:'center', gap:10, background:'#ffffff', border:'1px solid #E2E8F0', borderRadius:10, cursor:'pointer', fontFamily:"'IBM Plex Sans', system-ui, sans-serif", transition:'background 150ms', boxShadow:'none', fontSize:15, fontWeight:600, color:'#0F172A' },
    orDivider: { display:'flex', alignItems:'center', gap:12, margin:'24px 0' },
    orLine: { flex:1, height:1, background:'#E2E8F0' },
    orText: { fontSize:13, color:'#94A3B8', whiteSpace:'nowrap', textTransform: 'uppercase', letterSpacing: '0.5px' },
    otpBtn: { width:'100%', padding:'14px 16px', height:'auto', display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'rgba(99, 102, 241, 0.05)', border:'1px solid rgba(99, 102, 241, 0.1)', borderRadius:10, cursor:'pointer', fontFamily:"'IBM Plex Sans', system-ui, sans-serif", transition:'background 150ms', fontSize:15, fontWeight:600, color:'#6366F1' },
    orEmailLabel: { textAlign:'center', fontSize:13, color:'#94A3B8', margin:'16px 0 20px', letterSpacing: '0.2px' },
    submitBtn: { padding:'14px 20px', height:'auto', borderRadius:10, background:'#6366F1', border:'none', fontWeight:600, fontSize:15, boxShadow:'none', transition:'background 150ms', color:'#ffffff' },
    footerNote: { fontSize:13, color:'#64748B', textAlign:'center', marginTop:24 },
    backBtn: { display:'flex', alignItems:'center', background:'none', border:'none', cursor:'pointer', fontSize:14, color:'#64748B', fontWeight:500, padding:'0 0 24px', fontFamily:"'IBM Plex Sans', system-ui, sans-serif" },
    otpRow: { display:'flex', gap:8, justifyContent:'center', marginTop:4 },
    otpBox: { width:46, height:54, textAlign:'center', fontSize:24, fontWeight:600, color:'#0F172A', border:'1px solid #E2E8F0', borderRadius:10, outline:'none', caretColor:'#6366F1', background:'#ffffff', transition:'border-color 150ms', fontFamily:"'JetBrains Mono', monospace" },
    // Mobile-only header (hidden on desktop, shown on mobile via CSS media query)
    mobileHeader: { width:'100%', display:'none' },
    mobileLogoRow: { display:'flex', flexDirection:'row', alignItems:'center', gap:12, marginBottom:20 },
    mobileLogoIcon: { width:40, height:40, background:'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 16px rgba(99,102,241,0.4)', flexShrink:0 },
    mobileLogoText: { fontSize:22, fontWeight:800, color:'#ffffff', letterSpacing:'-0.3px', lineHeight:1 },
    mobileHeadline: { fontFamily:"'IBM Plex Sans', system-ui, sans-serif", fontSize:32, fontWeight:700, color:'#ffffff', lineHeight:1.15, margin:'0 0 12px', letterSpacing:'-0.5px' },
    mobileTaglineSub: { fontSize:15, color:'#94A3B8', lineHeight:1.6, margin:'0 0 36px', fontWeight:400, maxWidth:320 },
    mobileTagline: { display:'none' },
};
