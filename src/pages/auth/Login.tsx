import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  EyeIcon, 
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  UserIcon,
  BriefcaseIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';
import GoogleSignInButton from '../../components/auth/GoogleSignInButton';
import UserStatusModal from '../../components/auth/UserStatusModal';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'jobseeker' | 'recruiter'>('jobseeker');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [userStatus, setUserStatus] = useState<{ status: 'suspended' | 'terminated'; warnings?: number; reason?: string } | null>(null);
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password, role);
      
      // Navigate based on role
      switch (role) {
        case 'jobseeker':
          navigate('/home');
          break;
        case 'recruiter':
          navigate('/recruiter');
          break;
        default:
          navigate('/home');
      }
    } catch (err: any) {
      const errorData = err.response?.data || {};
      const errorMessage = errorData.message || 'Invalid credentials. Please try again.';
      
      // Check if user is suspended or terminated
      if (errorData.status === 'suspended' || errorData.status === 'terminated') {
        setUserStatus({
          status: errorData.status,
          warnings: errorData.warnings,
          reason: errorData.reason
        });
        setShowStatusModal(true);
        setError(''); // Clear error message since modal will show it
      } else {
        setError(errorMessage);
      }
    }
  };

  const roleOptions: Array<{ value: 'jobseeker' | 'recruiter'; label: string; icon: any }> = [
    { value: 'jobseeker', label: 'Job Seeker', icon: UserIcon },
    { value: 'recruiter', label: 'Recruiter', icon: BriefcaseIcon },
  ];

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ background: '#FFFFFF' }}>
      {/* Navigation */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 navbar-glass" 
        style={{ 
          background: '#FFFFFF',
          borderBottom: '1px solid rgba(15, 23, 42, 0.08)',
          height: '68px'
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8" style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
          <div className="flex justify-between items-center w-full">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 flex items-center justify-center transition-all duration-300">
                <span className="text-saas-text-heading font-semibold text-xl" style={{ fontFamily: 'Poppins, sans-serif' }}>JG</span>
              </div>
              <span className="text-2xl font-semibold text-saas-text-heading" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Job Genius
              </span>
            </Link>
            <div className="flex items-center space-x-6">
              <Link
                to="/"
                className="hidden md:block text-sm font-semibold text-saas-text-heading-secondary hover:text-saas-cyan transition-colors duration-300"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                Home
              </Link>
              <Link
                to="/signup"
                className="btn-primary-glacier text-sm"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-full max-w-md z-10"
        >
          {/* Main Card */}
          <div className="card-base p-8 md:p-10">
            <div className="mb-8 text-center">
              <h2 className="text-3xl md:text-4xl font-semibold text-saas-text-heading mb-3" style={{ fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px' }}>
                Welcome Back
              </h2>
              <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>Sign in to continue your journey</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 card-base-sm border border-red-500/30 rounded-md flex items-center space-x-3"
              >
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
                <p className="text-red-300 text-sm flex-1" style={{ fontFamily: 'Poppins, sans-serif' }}>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-semibold text-saas-text-heading mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  I am a...
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = role === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        type="button"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRole(option.value)}
                        className={`relative p-4 rounded-md border-2 transition-all duration-300 ${
                          isSelected
                            ? `border-saas-cyan bg-saas-cyan/20 text-saas-text-heading shadow-lg`
                            : 'border-saas-border bg-saas-bg-secondary/20 hover:border-saas-cyan/40 text-saas-text-heading-secondary'
                        }`}
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-saas-cyan' : 'text-saas-text-heading-secondary'}`} />
                        <div className={`text-sm font-semibold ${isSelected ? 'text-saas-text-heading' : 'text-saas-text-heading-secondary'}`} style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {option.label}
                        </div>
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-saas-cyan rounded-full flex items-center justify-center shadow-lg"
                          >
                            <svg className="w-4 h-4 text-saas-text-heading" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'email' ? 'text-saas-cyan' : 'text-saas-text-heading-muted group-hover:text-saas-cyan'}`} />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="input-glacier pl-12"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-saas-text-heading mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className={`h-5 w-5 transition-colors duration-300 ${focusedField === 'password' ? 'text-saas-cyan' : 'text-saas-text-heading-muted group-hover:text-saas-cyan'}`} />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="input-glacier pl-12 pr-12"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-saas-text-heading-muted hover:text-saas-cyan transition-colors duration-300"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
                size="lg"
              >
                <span style={{ fontFamily: 'Poppins, sans-serif' }}>Sign In</span>
                <ArrowRightIcon className="h-5 w-5" />
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-saas-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-transparent text-saas-text-heading-muted font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>Or continue with</span>
              </div>
            </div>

            {/* Google Sign-In Button */}
            <div className="mb-6">
              <GoogleSignInButton
                role={role}
                onSuccess={() => {
                  switch (role) {
                    case 'jobseeker':
                      navigate('/home');
                      break;
                    case 'recruiter':
                      navigate('/recruiter');
                      break;
                    default:
                      navigate('/home');
                  }
                }}
              />
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-saas-text-heading-secondary" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="font-semibold text-saas-cyan hover:opacity-80 transition-all duration-300"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* User Status Modal */}
      {userStatus && (
        <UserStatusModal
          isOpen={showStatusModal}
          status={userStatus.status}
          warnings={userStatus.warnings}
          reason={userStatus.reason}
          onClose={() => {
            setShowStatusModal(false);
            setUserStatus(null);
          }}
        />
      )}
    </div>
  );
};

export default Login;
