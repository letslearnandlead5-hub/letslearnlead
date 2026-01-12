import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToastStore } from '../../store/useToastStore';

const GoogleCallback: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addToast } = useToastStore();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            addToast({ type: 'error', message: 'Google authentication failed. Please try again.' });
            navigate('/login');
            return;
        }

        if (token) {
            // Store token in auth store
            localStorage.setItem('auth-storage', JSON.stringify({
                state: { token },
                version: 0
            }));

            // Fetch user data and redirect
            addToast({ type: 'success', message: 'Successfully signed in with Google!' });

            // Redirect to dashboard
            navigate('/dashboard');

            // Reload to update auth state
            window.location.reload();
        } else {
            addToast({ type: 'error', message: 'Authentication failed. Please try again.' });
            navigate('/login');
        }
    }, [searchParams, navigate, addToast]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-blue-950 dark:to-purple-950">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Completing Google sign in...</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
