import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  EyeIcon, 
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/ui/Button';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(email, password, 'admin');
      navigate('/admin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ background: '#FFFFFF' }}>
      {/* Main Content */}
      <div className="min-h-screen flex items-center justify-center p-4 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative w-full max-w-md z-10"
        >
          {/* Main Card */}
          <div className="glass-card p-8 md:p-10">
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 border border-saas-cyan/30 bg-white/20 rounded-full flex items-center justify-center">
                  <ShieldCheckIcon className="h-8 w-8 text-saas-cyan" />
                </div>
              </div>
              <h2 className="text-3xl md:text-4xl font-semibold text-saas-text-heading mb-3" style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '0.5px' }}>
                Admin Login
              </h2>
              <p className="text-saas-text-heading-secondary" style={{ fontFamily: 'Inter, sans-serif' }}>Access the admin dashboard</p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 glass-card-sm border border-red-500/30 rounded-glacier-sm flex items-center space-x-3"
              >
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                </div>
                <p className="text-red-300 text-sm flex-1" style={{ fontFamily: 'Inter, sans-serif' }}>{error}</p>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label className="block text-sm font-semibold text-saas-text-heading mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <EnvelopeIcon className={`h-5 w-5 ${focusedField === 'email' ? 'text-saas-cyan' : 'text-saas-text-heading-muted'}`} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-12 pr-4 py-3 input-glacier border-saas-border rounded-glacier-sm text-saas-text-heading focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan transition-all duration-400"
                    placeholder="admin@example.com"
                    required
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-semibold text-saas-text-heading mb-3" style={{ fontFamily: 'Inter, sans-serif' }}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <LockClosedIcon className={`h-5 w-5 ${focusedField === 'password' ? 'text-saas-cyan' : 'text-saas-text-heading-muted'}`} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-12 pr-12 py-3 input-glacier border-saas-border rounded-glacier-sm text-saas-text-heading focus:ring-2 focus:ring-saas-cyan/50 focus:border-saas-cyan transition-all duration-400"
                    placeholder="Enter your password"
                    required
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-saas-text-heading-muted hover:text-saas-cyan transition-colors duration-400"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                className="w-full py-3 text-base font-semibold"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminLogin;



