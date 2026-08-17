// =====================================================================
// REGISTRATION PAGE — the multi-step alumni sign-up form.
// =====================================================================

// -- React & routing ---------------------------------------------------
import React, { useState } from 'react';
import { useNavigate } from 'react-router';

// -- Icons (lucide-react) ------------------------------------------------
import {
  GraduationCap, ArrowLeft, ArrowRight, Camera, User, BookOpen,
  Lock, Eye, EyeOff, Mail, CheckCircle,
  Users, Heart, Award, Shield, TrendingUp, ChevronLeft
} from 'lucide-react';

// -- App-wide context/state ----------------------------------------------
import { useAuth } from './AuthContext';
import { isValidStudentId, STUDENT_ID_PLACEHOLDER, STUDENT_ID_HINT } from '../../lib/validators';

// -- Local image assets --------------------------------------------------
import asianCollegeLogo from '../../imports/asiancollege_logo.jpg';

/* --- helpers --- */
const PROGRAMS_BY_DEPT: Record<string, { code: string; name: string }[]> = {
  CSE: [
    { code: 'BSIT', name: 'BS in Information Technology (BSIT)' },
    { code: 'BSCS', name: 'BS in Computer Science (BSCS)' },
    { code: 'BSCOE', name: 'BS in Computer Engineering (BSCpE)' },
    { code: 'BSIS', name: 'BS in Information Systems (BSIS)' },
  ],
  CTHM: [
    { code: 'BSHM', name: 'BS in Hospitality Management (BSHM)' },
    { code: 'BSTM', name: 'BS in Tourism Management (BSTM)' },
    { code: 'BSHRM', name: 'BS in Hotel & Restaurant Management (BSHRM)' },
  ],
  BAA: [
    { code: 'BSA', name: 'BS in Accountancy (BSA)' },
    { code: 'BSBA', name: 'BS in Business Administration (BSBA)' },
    { code: 'BSAIS', name: 'BS in Accounting Information System (BSAIS)' },
    { code: 'BSE', name: 'BS in Entrepreneurship (BSE)' },
  ],
};

const STEPS = [
  { label: 'Personal Info', icon: <User className="w-4 h-4" />, color: '#b91c1c' },
  { label: 'Academic Info', icon: <BookOpen className="w-4 h-4" />, color: '#c2410c' },
  { label: 'Account Setup', icon: <Lock className="w-4 h-4" />, color: '#ea580c' },
];

const LEFT_PANEL_ITEMS = [
  { icon: <Users className="w-5 h-5" />, text: 'Connect with 1,247+ alumni across the Philippines' },
  { icon: <Heart className="w-5 h-5" />, text: 'Support student scholarships through donations' },
  { icon: <TrendingUp className="w-5 h-5" />, text: 'Track & showcase your career milestones' },
  { icon: <Award className="w-5 h-5" />, text: 'Access exclusive alumni events & homecomings' },
  { icon: <Shield className="w-5 h-5" />, text: 'RA 10173 & RA 10175 data privacy compliant' },
];

/* --- custom select --- */
function NativeSelect({ label, value, onChange, disabled, children, required }: {
  label: string; value: string; onChange: (v: string) => void;
  disabled?: boolean; children: React.ReactNode; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-sm text-gray-800 outline-none transition-all duration-200 disabled:bg-gray-50 disabled:text-gray-400 ${focused ? 'border-red-600 shadow-sm shadow-red-100' : 'border-gray-200 hover:border-gray-300'}`}
      >
        {children}
      </select>
    </div>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder, required, hint, rows }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; hint?: string; rows?: number;
}) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const isPw = type === 'password';
  const Tag = rows ? 'textarea' : 'input';
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}{required && <span className="text-red-500 ml-0.5">*</span>}</label>
      <div className={`relative rounded-xl border-2 bg-white transition-all duration-200 ${focused ? 'border-red-600 shadow-sm shadow-red-100' : 'border-gray-200 hover:border-gray-300'}`}>
        {Tag === 'textarea' ? (
          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            rows={rows}
            className="w-full px-4 py-3 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none rounded-xl resize-none"
          />
        ) : (
          <input
            type={isPw && showPw ? 'text' : type}
            value={value}
            onChange={e => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            required={required}
            className="w-full px-4 pr-10 py-3 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none rounded-xl"
          />
        )}
        {isPw && (
          <button type="button" onClick={() => setShowPw(!showPw)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

/* --- main --- */
export default function RegistrationPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [profileImage, setProfileImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    studentId: '', department: '', program: '', batchYear: '', graduationDate: '',
    password: '', confirmPassword: '', agreeToTerms: false,
  });

  const set = (field: string, value: any) => {
    setError('');
    if (field === 'department') setForm(f => ({ ...f, department: value, program: '' }));
    else setForm(f => ({ ...f, [field]: value }));
  };

  const validate = (s: number) => {
    if (s === 0) {
      if (!form.firstName || !form.lastName) return 'First and last name are required.';
      if (!form.email || !form.email.includes('@')) return 'A valid email address is required.';
      if (!form.phone) return 'Phone number is required.';
    }
    if (s === 1) {
      if (!form.studentId) return 'Student ID is required.';
      if (!isValidStudentId(form.studentId)) return `Student ID must be in the format YYYY-NNNNNNN (${STUDENT_ID_PLACEHOLDER}).`;
      if (!form.department) return 'Please select a department.';
      if (!form.program) return 'Please select a program.';
      if (!form.batchYear) return 'Please select your batch year.';
      if (!form.graduationDate) return 'Graduation date is required.';
    }
    if (s === 2) {
      if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters.';
      if (form.password !== form.confirmPassword) return 'Passwords do not match.';
      if (!form.agreeToTerms) return 'You must agree to the terms and conditions.';
    }
    return '';
  };

  const next = () => {
    const err = validate(step);
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    const err = validate(step);
    if (err) { setError(err); return; }
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 800));
    const ok = await register({
      firstName: form.firstName, lastName: form.lastName,
      email: form.email, password: form.password, phone: form.phone,
      studentId: form.studentId, department: form.department,
      program: form.program, batchYear: Number(form.batchYear),
      profileImage,
    });
    setSubmitting(false);
    if (ok) setSuccess(true);
    else setError('This email is already registered. Please use a different email or sign in.');
  };

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setProfileImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  /* -- Success screen -- */
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-10 text-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg"
            style={{ background: 'linear-gradient(135deg,#b91c1c,#ea580c)' }}>
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl text-gray-900 mb-2">Registration Successful!</h2>
          <p className="text-gray-500 mb-6 text-sm leading-relaxed">
            Welcome, <span className="font-bold text-red-700">{form.firstName}</span>! Your alumni account has been created. The Alumni Office will review your registration shortly.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-amber-700 leading-relaxed">
              <span className="font-bold">Note:</span> You can now log in using <span className="font-semibold">{form.email}</span> and your chosen password. Your account is pending admin approval.
            </p>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 text-white font-bold rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg,#b91c1c,#ea580c)' }}
          >
            Go to Sign In
          </button>
        </div>
      </div>
    );
  }

  /* -- Main form -- */
  return (
    <div className="min-h-screen flex">

      {/* -- Left Panel -- */}
      <div className="hidden lg:flex lg:w-2/5 xl:w-1/3 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 35%, #c2410c 70%, #ea580c 100%)' }}>

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-80 h-80 rounded-full bg-white/5" style={{ top: '-10%', right: '-15%', animation: 'float 9s ease-in-out infinite' }} />
          <div className="absolute w-60 h-60 rounded-full bg-white/5" style={{ bottom: '5%', left: '-10%', animation: 'float 11s ease-in-out infinite reverse' }} />
          <div className="absolute inset-0 opacity-5"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <img src={asianCollegeLogo} alt="Asian College" className="w-12 h-12 object-contain rounded-xl bg-white/10 p-1" />
          <div>
            <div className="text-white font-extrabold text-lg leading-tight">Asian College</div>
            <div className="text-white/60 text-xs">Dumaguete City, Philippines</div>
          </div>
        </div>

        {/* Center */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-full text-white/80 text-xs font-semibold mb-6">
            <GraduationCap className="w-3.5 h-3.5" /> Join the Alumni Network
          </div>
          <h1 className="text-3xl xl:text-4xl text-white mb-5 leading-tight">
            Start Your<br />
            <span className="text-orange-300">Alumni Journey</span>
          </h1>
          <p className="text-white/70 text-sm leading-relaxed mb-8">
            Register today and become part of a thriving community of Asian College graduates making a difference across the Philippines and beyond.
          </p>
          <ul className="space-y-4">
            {LEFT_PANEL_ITEMS.map((item, i) => (
              <li key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0 text-white">
                  {item.icon}
                </div>
                <span className="text-white/75 text-xs leading-snug">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-orange-300" />
            <span className="text-white text-xs font-bold">Privacy Protected</span>
          </div>
          <p className="text-white/60 text-xs leading-relaxed">
            Your data is protected under the Data Privacy Act of 2012 (RA 10173). We will never share your information without your consent.
          </p>
        </div>
      </div>

      {/* -- Right Panel -- */}
      <div className="w-full lg:w-3/5 xl:w-2/3 bg-gray-50 flex items-start justify-center py-8 px-6 md:px-12 overflow-y-auto">
        <div className="w-full max-w-2xl">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img src={asianCollegeLogo} alt="Asian College" className="w-10 h-10 object-contain rounded-lg" />
            <div>
              <div className="font-extrabold text-red-800 text-base leading-tight">Asian College</div>
              <div className="text-gray-400 text-xs">Alumni Registration</div>
            </div>
          </div>

          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center items-start justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl text-gray-900">Create Your Account</h2>
              <p className="text-gray-500 text-sm mt-0.5">Step {step + 1} of {STEPS.length} — {STEPS[step].label}</p>
            </div>
            <button
              onClick={() => step === 0 ? navigate('/login') : setStep(s => s - 1)}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-red-700 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? 'Sign In' : 'Back'}
            </button>
          </div>

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    i < step ? 'bg-green-500 text-white' :
                    i === step ? 'text-white shadow-lg' : 'bg-gray-200 text-gray-400'
                  }`} style={i === step ? { background: 'linear-gradient(135deg,#b91c1c,#ea580c)' } : {}}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:block ${i === step ? 'text-red-700' : i < step ? 'text-green-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 rounded-full mx-1" style={{ background: i < step ? '#22c55e' : '#e5e7eb' }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Personal Info */}
          {step === 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#b91c1c,#c2410c)' }}>
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold">Personal Information</h3>
                  <p className="text-xs text-gray-400">Tell us a bit about yourself</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name" value={form.firstName} onChange={v => set('firstName', v)} placeholder="Maria" required />
                <Field label="Last Name" value={form.lastName} onChange={v => set('lastName', v)} placeholder="Santos" required />
              </div>
              <Field label="Email Address" type="email" value={form.email} onChange={v => set('email', v)} placeholder="maria@email.com" required hint="Use a personal email you check regularly" />
              <Field label="Phone Number" type="tel" value={form.phone} onChange={v => set('phone', v)} placeholder="+63 912 345 6789" required />
              <Field label="Current Address" value={form.address} onChange={v => set('address', v)} placeholder="Street, City, Province" rows={2} />
            </div>
          )}

          {/* Step 2: Academic Info */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#c2410c,#ea580c)' }}>
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold">Academic Information</h3>
                  <p className="text-xs text-gray-400">Your Asian College educational background</p>
                </div>
              </div>

              <Field label="Student ID Number" value={form.studentId} onChange={v => set('studentId', v)} placeholder={STUDENT_ID_PLACEHOLDER} required />
              <p className="text-xs text-gray-400 -mt-3">{STUDENT_ID_HINT}</p>
              <NativeSelect label="Department / College" value={form.department} onChange={v => set('department', v)} required>
                <option value="">Select Department</option>
                <option value="CSE">Computer Science & Engineering (CSE)</option>
                <option value="CTHM">College of Tourism & Hospitality Management (CTHM)</option>
                <option value="BAA">Business Administration & Accountancy (BAA)</option>
              </NativeSelect>
              <NativeSelect label="Program / Course" value={form.program} onChange={v => set('program', v)} disabled={!form.department} required>
                <option value="">{form.department ? 'Select Program' : 'Select department first'}</option>
                {(PROGRAMS_BY_DEPT[form.department] || []).map(p => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </NativeSelect>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <NativeSelect label="Batch Year" value={form.batchYear} onChange={v => set('batchYear', v)} required>
                  <option value="">Select Year</option>
                  {Array.from({ length: new Date().getFullYear() - 1975 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </NativeSelect>
                <Field label="Graduation Date" type="date" value={form.graduationDate} onChange={v => set('graduationDate', v)} required />
              </div>
            </div>
          )}

          {/* Step 3: Account Setup */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-5">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}>
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-gray-900 font-bold">Create Your Account</h3>
                  <p className="text-xs text-gray-400">Almost there! Set up your login credentials</p>
                </div>
              </div>

              {/* Profile photo */}
              <div className="flex flex-col items-center py-4">
                <div className="relative group mb-3">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-white shadow-lg bg-gray-100">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl font-bold"
                        style={{ background: 'linear-gradient(135deg,#b91c1c22,#ea580c22)' }}>
                        {form.firstName ? form.firstName[0].toUpperCase() : <User className="w-10 h-10 text-gray-300" />}
                      </div>
                    )}
                  </div>
                  <label htmlFor="profile-upload"
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer text-white shadow-lg hover:shadow-xl transition-all hover:scale-110"
                    style={{ background: 'linear-gradient(135deg,#b91c1c,#ea580c)' }}>
                    <Camera className="w-4 h-4" />
                    <input id="profile-upload" type="file" accept="image/*" onChange={handleImage} className="hidden" />
                  </label>
                </div>
                <p className="text-xs text-gray-400">Profile photo (optional)</p>
              </div>

              <Field label="Password" type="password" value={form.password} onChange={v => set('password', v)} placeholder="Minimum 8 characters" required hint="Use letters, numbers and symbols for a stronger password" />
              <Field label="Confirm Password" type="password" value={form.confirmPassword} onChange={v => set('confirmPassword', v)} placeholder="Re-enter your password" required />

              {/* Password strength */}
              {form.password && (
                <div className="space-y-1.5">
                  <p className="text-xs text-gray-500 font-medium">Password strength</p>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                        form.password.length >= i * 2
                          ? i <= 1 ? 'bg-red-400' : i <= 2 ? 'bg-orange-400' : i <= 3 ? 'bg-yellow-400' : 'bg-green-500'
                          : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Terms */}
              <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <div className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-all duration-200 ${form.agreeToTerms ? 'border-red-600 bg-red-600' : 'border-gray-300'}`}
                    onClick={() => set('agreeToTerms', !form.agreeToTerms)}>
                    {form.agreeToTerms && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className="text-sm text-gray-700 leading-relaxed">
                    I agree to the <a href="#" className="text-red-600 font-semibold hover:underline">Terms & Conditions</a> and <a href="#" className="text-red-600 font-semibold hover:underline">Privacy Policy</a>. I consent to the processing of my personal data in accordance with <strong>RA 10173</strong> (Data Privacy Act of 2012).
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 gap-4">
            <button
              onClick={() => step === 0 ? navigate('/login') : setStep(s => s - 1)}
              className="flex items-center gap-2 px-5 py-3 text-sm font-semibold text-gray-600 bg-white border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:text-gray-800 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 0 ? 'Sign In Instead' : 'Previous'}
            </button>

            {step < STEPS.length - 1 ? (
              <button
                onClick={next}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg,#b91c1c,#ea580c)' }}
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed"
                style={{ background: submitting ? '#9ca3af' : 'linear-gradient(135deg,#b91c1c,#ea580c)' }}
              >
                {submitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Creating account…
                  </>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Complete Registration</>
                )}
              </button>
            )}
          </div>

          {/* Help footer */}
          <div className="mt-8 p-4 bg-white rounded-xl border border-gray-100 shadow-sm flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-orange-600" />
            </div>
            <div className="text-xs text-gray-500 leading-relaxed">
              <span className="font-semibold text-gray-700">Need help?</span> Contact the Alumni Admin Office at{' '}
              <a href="mailto:admin@asiancollege.edu.ph" className="text-red-600 font-medium hover:underline">admin@asiancollege.edu.ph</a> or call <span className="font-medium text-gray-700">(035) 523-5373</span>.
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
}
