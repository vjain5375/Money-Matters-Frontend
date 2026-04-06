import { useState, useEffect } from 'react';
import { Form, Input, Button, message, Spin, Tag, Divider, Avatar } from 'antd';
import {
    UserOutlined, MailOutlined, LockOutlined,
    CheckCircleOutlined, EditOutlined, SaveOutlined,
} from '@ant-design/icons';
import { supabase } from '../supabaseClient';

const SECTION = ({ title, subtitle, children }) => (
    <div className="mm-card" style={{ padding: '22px 26px', marginBottom: 18 }}>
        <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#101828' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: '#98a2b3', marginTop: 3 }}>{subtitle}</div>}
        </div>
        {children}
    </div>
);

export default function Settings() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [pwdSaving, setPwdSaving] = useState(false);
    const [pwdSent, setPwdSent] = useState(false);
    const [profileForm] = Form.useForm();
    const [pwdForm] = Form.useForm();

    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setUser(data.user);
            const meta = data.user?.user_metadata ?? {};
            const full = meta.full_name || meta.name || '';
            profileForm.setFieldsValue({ full_name: full, email: data.user?.email });
            setLoading(false);
        });
    }, [profileForm]);

    const meta = user?.user_metadata ?? {};
    const fullName = meta.full_name || meta.name || '';
    const email = user?.email ?? '';
    const initials = fullName
        ? fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : email.slice(0, 2).toUpperCase();
    const provider = user?.app_metadata?.provider ?? 'email';
    const createdAt = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    const saveProfile = async (values) => {
        setSaving(true);
        const { error } = await supabase.auth.updateUser({ data: { full_name: values.full_name } });
        setSaving(false);
        if (error) { message.error('Failed to update name: ' + error.message); return; }
        setUser(prev => ({ ...prev, user_metadata: { ...prev?.user_metadata, full_name: values.full_name } }));
        message.success('Name updated!');
    };

    const sendPasswordReset = async () => {
        setPwdSaving(true);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        setPwdSaving(false);
        if (error) { message.error('Error: ' + error.message); return; }
        setPwdSent(true);
        message.success('Password reset link sent to your email!');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
                <Spin size="large" tip="Loading settings…" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 680, margin: '0 auto', width: '100%', paddingTop: 10 }}>

            {/* Profile card */}
            <SECTION title="Profile" subtitle="Your public display information">
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
                    <Avatar
                        size={64}
                        style={{ background: 'linear-gradient(135deg,#6c63ff,#3ecf8e)', color: '#fff', fontSize: 22, fontWeight: 700, flexShrink: 0 }}
                    >
                        {initials}
                    </Avatar>
                    <div>
                        <div style={{ fontSize: 17, fontWeight: 700, color: '#101828' }}>{fullName || 'No name set'}</div>
                        <div style={{ fontSize: 13, color: '#667085' }}>{email}</div>
                        <div style={{ marginTop: 5, display: 'flex', gap: 6 }}>
                            <Tag color="purple" style={{ fontSize: 10 }}>Free Plan</Tag>
                            <Tag color={provider === 'google' ? 'red' : 'blue'} style={{ fontSize: 10 }}>
                                {provider === 'google' ? '🔵 Google' : '📧 Email'}
                            </Tag>
                        </div>
                    </div>
                </div>

                <Divider style={{ margin: '14px 0' }} />

                <Form form={profileForm} layout="vertical" onFinish={saveProfile} requiredMark={false}>
                    <Form.Item
                        name="full_name"
                        label={<span style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>Display Name</span>}
                        rules={[{ required: true, message: 'Enter your name.' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#6c63ff' }} />}
                            placeholder="Your full name"
                            style={{ height: 42, borderRadius: 9, borderColor: '#6c63ff', fontSize: 14 }}
                        />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        label={<span style={{ fontSize: 13, fontWeight: 600, color: '#344054' }}>Email</span>}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#98a2b3' }} />}
                            disabled
                            style={{ height: 42, borderRadius: 9, fontSize: 14, background: '#f9fafb' }}
                            suffix={<CheckCircleOutlined style={{ color: '#3ecf8e' }} />}
                        />
                    </Form.Item>

                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={saving}
                        style={{ borderRadius: 8, height: 38, fontWeight: 600, background: 'linear-gradient(135deg,#6c63ff,#7c6ffa)' }}
                    >
                        Save Name
                    </Button>
                </Form>
            </SECTION>

            {/* Security */}
            <SECTION title="Security" subtitle="Password and login settings">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #f2f4f7' }}>
                    <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#101828' }}>Password</div>
                        <div style={{ fontSize: 12, color: '#98a2b3', marginTop: 2 }}>
                            {provider === 'google' ? 'You signed in with Google — no password set' : 'Change your account password'}
                        </div>
                    </div>
                    {provider !== 'google' && (
                        pwdSent ? (
                            <Tag color="green" icon={<CheckCircleOutlined />} style={{ padding: '5px 12px', fontSize: 12 }}>
                                Reset link sent!
                            </Tag>
                        ) : (
                            <Button
                                icon={<LockOutlined />}
                                loading={pwdSaving}
                                onClick={sendPasswordReset}
                                style={{ borderRadius: 8, height: 36, fontSize: 12.5, fontWeight: 600 }}
                            >
                                Send Reset Link
                            </Button>
                        )
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' }}>
                    <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: '#101828' }}>Account created</div>
                        <div style={{ fontSize: 12, color: '#98a2b3', marginTop: 2 }}>{createdAt}</div>
                    </div>
                </div>
            </SECTION>

            {/* About */}
            <SECTION title="About" subtitle="App information">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    {[
                        { l: 'App', v: 'Money Matters AI' },
                        { l: 'Version', v: '1.0.0 · Alpha' },
                        { l: 'Stack', v: 'React + Supabase' },
                        { l: 'Plan', v: 'Free' },
                    ].map(({ l, v }) => (
                        <div key={l} style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px' }}>
                            <div style={{ fontSize: 11, color: '#98a2b3', fontWeight: 600 }}>{l}</div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: '#344054', marginTop: 2 }}>{v}</div>
                        </div>
                    ))}
                </div>
            </SECTION>
        </div>
    );
}
