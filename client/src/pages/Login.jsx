import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBranding } from '../utils/brandingConfig';
import { Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, isAuthenticated } = useAuth();
  const { branding } = useBranding();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // If already authenticated, bypass login
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Check if session has expired from route query parameters
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setError('Your admin session has expired. Please login again.');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credential fields.');
      return;
    }

    setError('');
    setSubmitting(true);
    const toastId = toast.loading('Verifying admin credentials...');
    try {
      await login(email, password);
      toast.success('Login successful! Welcome back.', { id: toastId });
      navigate('/');
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Invalid email or password';
      setError(errMsg);
      toast.error('Authentication failed', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header Branding section */}
        <div className="flex flex-col items-center text-center">
          <div className="h-16 w-16 bg-navy-900 rounded-full flex items-center justify-center p-2 border-2 border-white shadow-premium">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="h-full w-full object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
          <h2 className="mt-4 text-2xl font-black text-navy-900 tracking-wider">
            {branding.schoolName.toUpperCase()}
          </h2>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-widest mt-1">
            School Administration Portal
          </p>
        </div>

        {/* Form login card */}
        <div className="rounded-card border border-gray-200 bg-white p-8 shadow-premium">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 rounded-lg bg-red-50 p-3.5 text-xs font-semibold text-red-800 border border-red-100">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-650" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Admin Email Address
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Mail className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-xs outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    placeholder={`admin@${branding.schoolCode ? branding.schoolCode.toLowerCase() : 'mbps'}.com`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    <Lock className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-xs outline-hidden focus:border-navy-900 focus:ring-1 focus:ring-navy-900"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy-900 py-3 text-sm font-bold text-white shadow-premium transition-colors hover:bg-navy-800 disabled:opacity-50"
            >
              <ShieldCheck className="h-4.5 w-4.5" />
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center text-[10px] text-gray-400 font-medium">
          Authorized personnel access only. Actions are monitored and logged.
        </div>
      </div>
    </div>
  );
};

export default Login;
