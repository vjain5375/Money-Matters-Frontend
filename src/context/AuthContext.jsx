import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext(null);

const mapAuthEmailError = (error) => {
    if (!error) return null;

    const msg = error.message || '';
    const isProviderIssue =
        error.code === 'unexpected_failure' &&
        (
            msg.includes('Error sending magic link email') ||
            msg.includes('Error sending recovery email')
        );

    if (!isProviderIssue) return error;

    return {
        ...error,
        message: 'Email delivery is currently unavailable. Check Supabase Auth email settings (SMTP/templates) and ensure the project is active.',
    };
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(undefined); // undefined = loading
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get current session on mount
        supabase?.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes (login, logout, token refresh)
        const { data: { subscription } } = supabase?.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
                setLoading(false);
            }
        ) ?? { data: { subscription: { unsubscribe: () => { } } } };

        return () => subscription.unsubscribe();
    }, []);

    const signUp = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({ email, password });
        return { data, error };
    };

    const signIn = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        return { data, error };
    };

    const sendOtp = async (email) => {
        const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: true },
        });
        return { data, error: mapAuthEmailError(error) };
    };

    const verifyOtp = async (email, token) => {
        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'email',
        });
        return { data, error: mapAuthEmailError(error) };
    };

    const updateProfile = async (updates) => {
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        });
        return { data, error };
    };

    const signOut = async () => {
        await supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signUp, signIn, sendOtp, verifyOtp, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
    return ctx;
};
