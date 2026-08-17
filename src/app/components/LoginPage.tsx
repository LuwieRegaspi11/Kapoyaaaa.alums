import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useAuth } from './AuthContext';
import {
  GraduationCap, Mail, Lock, Eye, EyeOff, ArrowRight,
  Users, Award, Heart, TrendingUp, ChevronRight, Shield
} from 'lucide-react';
import asianCollegeLogo from '../../imports/asiancollege_logo.jpg';

const FLOATING_ICONS = [
  { icon: <GraduationCap className="w-6 h-6" />, x: '10%', y: '15%', delay: '0s', color: 'text-white/20' },
  { icon: <Users className="w-5 h-5" />, x: '80%', y: '10%', delay: '1s', color: 'text-white/15' },
  { icon: <Award className="w-7 h-7" />, x: '15%', y: '70%', delay: '2s', color: 'text-white/20' },
  { icon: <Heart className="w-5 h-5" />, x: '75%', y: '75%', delay: '0.5s', color: 'text-white/15' },
  { icon: <TrendingUp className="w-6 h-6" />, x: '60%', y: '30%', delay: '1.5s', color: 'text-white/10' },
  { icon: <Shield className="w-5 h-5" />, x: '30%', y: '85%', delay: '2.5s', color: 'text-white/15' },
];

const STATS = [
  { value: '1,247+', label: 'Alumni' },
  { value: '₱500K+', label: 'Donated' },
  { value: '36+', label: 'Years' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'alumni') navigate('/alumni');
      else if (user.role === 'faculty') navigate('/user');
      else if (user.role === 'representative') navigate('/representative');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const success = login(email, password);
    if (!success) {
      setError('Invalid email or password. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 35%, #c2410c 70%, #ea580c 100%)' }}>

        {/* Animated blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute w-96 h-96 rounded-full opacity-20 bg-white/10"
            style={{ top: '-5%', left: '-10%', animation: 'float 8s ease-in-out infinite' }} />
          <div className="absolute w-72 h-72 rounded-full opacity-10 bg-white/10"
            style={{ bottom: '5%', right: '-5%', animation: 'float 10s ease-in-out infinite reverse' }} />
          <div className="absolute w-48 h-48 rounded-full opacity-15 bg-orange-400/20"
            style={{ top: '40%', right: '15%', animation: 'float 7s ease-in-out infinite 1s' }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </div>

        {/* Floating icons */}
        {FLOATING_ICONS.map((f, i) => (
          <div key={i} className={`absolute ${f.color}`}
            style={{ left: f.x, top: f.y, animation: `float ${5 + i}s ease-in-out infinite ${f.delay}` }}>
            {f.icon}
          </div>
        ))}

        {/* Top: Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={asianCollegeLogo} alt="Asian College" className="w-12 h-12 object-contain rounded-xl bg-white/10 p-1 backdrop-blur-sm" />
          <div>
            <div className="text-white font-extrabold text-lg leading-tight">Asian College</div>
            <div className="text-white/60 text-xs">Dumaguete City, Philippines</div>
          </div>
        </div>

        {/* Center: Main content */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-white/80 text-xs font-semibold mb-6">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            Alumni Tracer & Donation System
          </div>
          <h1 className="text-4xl xl:text-5xl text-white mb-5 leading-tight">
            Welcome Back to<br />
            <span className="text-orange-300">Your Community</span>
          </h1>
          <p className="text-white/70 leading-relaxed mb-10 max-w-sm">
            Sign in to connect with fellow alumni, track your career journey, manage donations, and stay updated with Asian College events.
          </p>

          {/* Stats row */}
          <div className="flex items-center gap-6">
            {STATS.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl text-white">{s.value}</div>
                <div className="text-white/50 text-xs">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Testimonial card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-300 to-red-400 flex items-center justify-center text-white text-sm font-bold">JD</div>
            <div>
              <div className="text-white text-sm font-semibold">Juan Dela Cruz</div>
              <div className="text-white/50 text-xs">BSIT Batch 2018 · CSE Alumni</div>
            </div>
            <div className="ml-auto flex gap-0.5">
              {[...Array(5)].map((_, i) => <span key={i} className="text-orange-300 text-xs">★</span>)}
            </div>
          </div>
          <p className="text-white/70 text-xs leading-relaxed italic">
            "This platform made it so easy to reconnect with my batchmates and give back to my alma mater. Truly proud to be an Asian College alumna!"
          </p>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-6 md:p-12">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <img src={asianCollegeLogo} alt="Asian College" className="w-10 h-10 object-contain rounded-lg" />
            <div>
              <div className="font-extrabold text-red-800 text-base leading-tight">Asian College</div>
              <div className="text-gray-400 text-xs">Alumni Tracer & Donation System</div>
            </div>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h2 className="text-3xl text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-500 text-sm">Enter your credentials to access your alumni portal</p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
              <div className={`relative rounded-xl border-2 transition-all duration-200 bg-white ${focused === 'email' ? 'border-red-600 shadow-sm shadow-red-100' : 'border-gray-200 hover:border-gray-300'}`}>
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  placeholder="you@asiancollege.edu.ph"
                  required
                  className="w-full bg-transparent pl-11 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none rounded-xl"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-gray-700">Password</label>
                <button type="button" className="text-xs text-red-600 hover:text-red-700 font-medium">Forgot password?</button>
              </div>
              <div className={`relative rounded-xl border-2 transition-all duration-200 bg-white ${focused === 'password' ? 'border-red-600 shadow-sm shadow-red-100' : 'border-gray-200 hover:border-gray-300'}`}>
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-transparent pl-11 pr-12 py-3.5 text-sm text-gray-900 placeholder-gray-400 outline-none rounded-xl"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-200 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              style={{ background: loading ? '#9ca3af' : 'linear-gradient(135deg, #b91c1c, #ea580c)' }}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register CTA */}
          <Link to="/register" className="block">
            <div className="w-full flex items-center justify-between px-5 py-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all duration-200 group cursor-pointer">
              <div>
                <div className="text-sm font-bold text-gray-800 group-hover:text-red-700">New Alumni? Create Account</div>
                <div className="text-xs text-gray-400 mt-0.5">Register to join the alumni network</div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-amber-600">🔑</span>
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Demo Admin Account</span>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              <p className="text-xs text-gray-600 leading-relaxed">
                <span className="font-semibold text-gray-800">Email:</span> admin@asiancollege.edu<br />
                <span className="font-semibold text-gray-800">Password:</span> admin123
              </p>
            </div>
            <p className="text-xs text-amber-600 mt-2">💡 Just registered? Use your own email & password.</p>
          </div>

          {/* Back to home */}
          <p className="text-center text-xs text-gray-400 mt-6">
            <button onClick={() => navigate('/')} className="hover:text-red-600 transition-colors font-medium">← Back to Home</button>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(5deg); }
        }
      `}</style>
    </div>
  );
}
