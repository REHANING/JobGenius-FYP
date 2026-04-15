import React, { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

interface GoogleSignInButtonProps {
  role: 'jobseeker' | 'recruiter' | 'admin';
  onSuccess?: () => void;
  text?: string;
}

declare global {
  interface Window {
    google: any;
  }
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({ 
  role, 
  onSuccess,
  text = 'Continue with Google' 
}) => {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isConfigured, setIsConfigured] = React.useState<boolean | null>(null);
  const { googleLogin, isLoading } = useAuth();

  useEffect(() => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Script already loaded, initialize immediately
      setTimeout(initializeGoogleSignIn, 100);
      return;
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogleSignIn;
    document.head.appendChild(script);

    return () => {
      // Note: We don't remove the script on cleanup as it might be used by other components
    };
  }, [role]); // Add role as dependency

  const initializeGoogleSignIn = () => {
    if (!window.google || !buttonRef.current) return;

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.warn('Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.');
      setIsConfigured(false);
      return;
    }

    setIsConfigured(true);

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
    });

    window.google.accounts.id.renderButton(
      buttonRef.current,
      {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        width: '100%',
      }
    );
  };

  const handleCredentialResponse = async (response: any) => {
    try {
      await googleLogin(response.credential, role);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      alert(error.response?.data?.message || 'Failed to sign in with Google. Please try again.');
    }
  };

  // Add global styles for Google button when component mounts
  React.useEffect(() => {
    const styleId = 'google-button-light-theme-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* Light Theme Google Sign-In Button Styling */
      .google-signin-wrapper iframe,
      .google-signin-wrapper div[role="button"] {
        background: white !important;
        border: 1.5px solid #cbd5e1 !important;
        border-radius: 0.75rem !important;
        color: #334155 !important;
        font-family: 'Poppins', sans-serif !important;
        font-weight: 600 !important;
        transition: all 0.3s ease !important;
        width: 100% !important;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;
      }
      .google-signin-wrapper div[role="button"]:hover {
        border-color: #9ae4cb !important;
        background: rgba(154, 228, 203, 0.05) !important;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
        transform: translateY(-1px) !important;
      }
      .google-signin-wrapper svg {
        filter: none !important;
      }
      .google-signin-wrapper span {
        color: #334155 !important;
        font-weight: 600 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  const notConfiguredPlaceholder = (
    <div className="w-full py-3 px-4 border-2 border-saas-cyan/30 rounded-xl bg-white/20 flex items-center justify-center space-x-3 cursor-not-allowed opacity-60">
      <svg className="w-5 h-5 text-saas-text-body" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
      </svg>
      <span className="text-saas-text-body text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>
        Google Sign-In (Not Configured)
      </span>
    </div>
  );

  return (
    <div className="w-full relative google-signin-wrapper" style={{ minHeight: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {isConfigured === false ? (
        notConfiguredPlaceholder
      ) : (
        <div 
          ref={buttonRef} 
          className="w-full"
          style={{ minHeight: '48px', width: '100%' }}
        />
      )}
      {isConfigured === null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex items-center space-x-3 text-saas-text-body">
            <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
            <span className="text-sm font-medium" style={{ fontFamily: 'Inter, sans-serif' }}>Loading Google Sign-In...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;

