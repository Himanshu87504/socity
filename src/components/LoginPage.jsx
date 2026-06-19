// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, User, Shield, AlertCircle, Mail, Phone, ArrowLeft, CheckCircle, RefreshCw, UserPlus, KeyRound, Building2 } from 'lucide-react';
import { authenticate } from '../auth';
import { APP_NAME, APP_TAGLINE } from '../logo';

const THEME_COLORS = {
  dark:    { bg: '#0d1117', card: '#111827', border: 'rgba(255,255,255,0.08)', text: '#e8edf5', sub: '#8899aa', accent: '#00d4aa' },
  light:   { bg: '#f0f4f8', card: '#ffffff', border: 'rgba(0,0,0,0.10)',       text: '#1a202c', sub: '#4a5568', accent: '#00d4aa' },
  ocean:   { bg: '#020c1b', card: '#0a192f', border: 'rgba(100,255,218,0.10)', text: '#ccd6f6', sub: '#8892b0', accent: '#64ffda' },
  forest:  { bg: '#0b1a0e', card: '#122016', border: 'rgba(134,239,172,0.10)', text: '#dcfce7', sub: '#86efac', accent: '#4ade80' },
  sunset:  { bg: '#1a0a0a', card: '#241212', border: 'rgba(251,146,60,0.10)',  text: '#fff1e6', sub: '#d4a27a', accent: '#fb923c' },
};

const ROLES = ['Super Admin', 'Billing Manager', 'Tenant Manager', 'Facility Manager', 'Loans Officer'];
const SOCIETIES = ['Green Valley CHS', 'Blue Ridge Society', 'Sunrise Heights', 'Palm Grove Residency', 'Emerald Towers'];

// ── Shared Input Component ──────────────────────────────────
function FInput({ label, icon: Icon, type = 'text', value, onChange, onKeyDown, placeholder, c, isDark, right }) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', color: c.sub, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {Icon && <Icon size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: c.sub, pointerEvents: 'none' }} />}
        <input
          className="login-input"
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            border: `1px solid ${c.border}`, borderRadius: 10,
            padding: `11px ${right ? '44px' : '12px'} 11px ${Icon ? '36px' : '12px'}`,
            color: c.text, fontSize: 14, outline: 'none', fontFamily: "'Sora', sans-serif",
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
        />
        {right}
      </div>
    </div>
  );
}

function FSelect({ label, value, onChange, options, c, isDark }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', color: c.sub, fontSize: 12, fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</label>
      <select value={value} onChange={onChange} style={{
        width: '100%', boxSizing: 'border-box',
        background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
        border: `1px solid ${c.border}`, borderRadius: 10,
        padding: '11px 12px', color: c.text, fontSize: 14, outline: 'none',
        fontFamily: "'Sora', sans-serif",
      }}>
        {options.map(o => <option key={o} value={o} style={{ background: '#1a2234' }}>{o}</option>)}
      </select>
    </div>
  );
}

function PrimaryBtn({ onClick, loading, loadingText, children, c, disabled }) {
  return (
    <button
      className="login-btn"
      onClick={onClick}
      disabled={loading || disabled}
      style={{
        width: '100%', padding: '12px', borderRadius: 12, border: 'none',
        cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
        background: `linear-gradient(135deg, ${c.accent}, #6c63ff)`, color: '#fff',
        fontWeight: 700, fontSize: 15, fontFamily: "'Sora', sans-serif",
        boxShadow: `0 4px 20px ${c.accent}44`,
        transition: 'opacity 0.2s, transform 0.2s',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: (loading || disabled) ? 0.7 : 1,
      }}
    >
      {loading
        ? <><div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />{loadingText}</>
        : children}
    </button>
  );
}

function ErrorBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,107,107,0.10)', border: '1px solid rgba(255,107,107,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
      <AlertCircle size={15} color="#ff6b6b" />
      <span style={{ color: '#ff6b6b', fontSize: 13 }}>{msg}</span>
    </div>
  );
}

function SuccessBox({ msg }) {
  if (!msg) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(0,212,170,0.10)', border: '1px solid rgba(0,212,170,0.25)', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
      <CheckCircle size={15} color="#00d4aa" />
      <span style={{ color: '#00d4aa', fontSize: 13 }}>{msg}</span>
    </div>
  );
}

function BackLink({ onClick, c }) {
  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: c.sub, fontSize: 13, cursor: 'pointer', padding: '0 0 16px', fontFamily: "'Sora', sans-serif' " }}>
      <ArrowLeft size={14} /> Back to Login
    </button>
  );
}

// ── OTP Input ───────────────────────────────────────────────
function OtpInput({ value, onChange, c, isDark }) {
  const digits = (value + '      ').slice(0, 6).split('');
  const refs = Array.from({ length: 6 }, () => useRef(null));

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1);
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = value.slice(0, i) + e.key + value.slice(i + 1);
      onChange(next.slice(0, 6));
      if (i < 5) refs[i + 1].current?.focus();
    }
  };

  const handlePaste = (e) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(text);
    refs[Math.min(text.length, 5)].current?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          style={{
            width: 44, height: 52, textAlign: 'center', fontSize: 20, fontWeight: 700,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
            border: `2px solid ${value[i] ? c.accent : c.border}`,
            borderRadius: 10, color: c.text, outline: 'none',
            fontFamily: "'Sora', sans-serif",
            transition: 'border-color 0.15s, box-shadow 0.15s',
            boxShadow: value[i] ? `0 0 0 3px ${c.accent}22` : 'none',
          }}
        />
      ))}
    </div>
  );
}

// ── Card Shell (defined OUTSIDE LoginPage to prevent re-mount on every keystroke) ──
function Card({ children, title, subtitle, icon: Icon, maxW = 440, c, isDark, mounted }) {
  return (
    <div style={{
      position: 'relative', zIndex: 1, width: '100%', maxWidth: maxW,
      opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 58, height: 58, borderRadius: 16,
          background: `linear-gradient(135deg, ${c.accent}, #6c63ff)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 14px', boxShadow: `0 8px 32px ${c.accent}33`,
          fontSize: 24, fontWeight: 700, color: '#fff',
        }}>S</div>
        <h1 style={{ color: c.text, fontSize: 22, fontWeight: 700, margin: 0 }}>{APP_NAME}</h1>
        <p style={{ color: c.sub, fontSize: 12, marginTop: 4 }}>{APP_TAGLINE}</p>
      </div>
      <div style={{
        background: c.card, border: `1px solid ${c.border}`, borderRadius: 20,
        padding: 28, boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.5)' : '0 8px 40px rgba(0,0,0,0.10)',
      }}>
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
            {Icon && <div style={{ width: 36, height: 36, borderRadius: 10, background: `${c.accent}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={16} color={c.accent} /></div>}
            <div>
              <h2 style={{ color: c.text, fontSize: 16, fontWeight: 700, margin: 0 }}>{title}</h2>
              {subtitle && <p style={{ color: c.sub, fontSize: 12, margin: 0 }}>{subtitle}</p>}
            </div>
          </div>
        )}
        {children}
      </div>
      <p style={{ textAlign: 'center', color: c.sub, fontSize: 11, marginTop: 18, opacity: 0.6 }}>
        Society Management System · v3.0
      </p>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────
export default function LoginPage({ onLogin, theme }) {
  const [view, setView] = useState('login'); // 'login' | 'register' | 'forgot' | 'otp' | 'reset'
  const [mounted, setMounted] = useState(false);

  // Login
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Register
  const [reg, setReg] = useState({ name: '', email: '', phone: '', role: ROLES[0], society: SOCIETIES[0], username: '', password: '', confirmPassword: '' });
  const [showRegPass, setShowRegPass] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [regLoading, setRegLoading] = useState(false);

  // Forgot
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState('');

  // OTP
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const DEMO_OTP = '123456';

  // Reset
  const [newPass, setNewPass] = useState('');
  const [confirmNewPass, setConfirmNewPass] = useState('');
  const [showNewPass, setShowNewPass] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const c = THEME_COLORS[theme] ?? THEME_COLORS.dark;
  const isDark = theme !== 'light';

  useEffect(() => { setTimeout(() => setMounted(true), 50); }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const go = (v) => {
    setView(v);
    setLoginError(''); setRegError(''); setRegSuccess('');
    setForgotError(''); setOtpError(''); setResetError('');
  };

  // ── Login ──────────────────────────────────────────────────
  const handleLogin = async () => {
    if (!username || !password) { setLoginError('Please enter username and password.'); return; }
    setLoginLoading(true); setLoginError('');
    await new Promise(r => setTimeout(r, 600));
    const user = await authenticate(username, password);
    if (user) { onLogin(user); }
    else { setLoginError('Invalid username or password.'); setLoginLoading(false); }
  };

  // ── Register ───────────────────────────────────────────────
  const handleRegister = async () => {
    setRegError(''); setRegSuccess('');
    if (!reg.name || !reg.email || !reg.phone || !reg.username || !reg.password) {
      setRegError('Please fill all required fields.'); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)) {
      setRegError('Please enter a valid email address.'); return;
    }
    if (!/^\d{10}$/.test(reg.phone.replace(/\s/g, ''))) {
      setRegError('Phone number must be 10 digits.'); return;
    }
    if (reg.password.length < 6) {
      setRegError('Password must be at least 6 characters.'); return;
    }
    if (reg.password !== reg.confirmPassword) {
      setRegError('Passwords do not match.'); return;
    }
    setRegLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setRegLoading(false);
    setRegSuccess('Account created! Awaiting admin approval. You can login once approved.');
    setTimeout(() => { go('login'); setUsername(reg.username); }, 2500);
  };

  // ── Forgot Password ────────────────────────────────────────
  const handleForgot = async () => {
    if (!forgotEmail) { setForgotError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      setForgotError('Please enter a valid email address.'); return;
    }
    setForgotLoading(true); setForgotError('');
    await new Promise(r => setTimeout(r, 800));
    setForgotLoading(false);
    setOtpSentTo(forgotEmail);
    setOtp('');
    setResendCooldown(30);
    go('otp');
  };

  // ── OTP Verify ─────────────────────────────────────────────
  const handleOtpVerify = async () => {
    if (otp.length < 6) { setOtpError('Please enter the complete 6-digit OTP.'); return; }
    setOtpLoading(true); setOtpError('');
    await new Promise(r => setTimeout(r, 700));
    if (otp === DEMO_OTP) {
      setOtpLoading(false);
      go('reset');
    } else {
      setOtpError('Invalid OTP. (Demo hint: use 123456)');
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setResendCooldown(30);
    setOtp('');
    setOtpError('');
  };

  // ── Reset Password ─────────────────────────────────────────
  const handleReset = async () => {
    if (!newPass || !confirmNewPass) { setResetError('Please fill both fields.'); return; }
    if (newPass.length < 6) { setResetError('Password must be at least 6 characters.'); return; }
    if (newPass !== confirmNewPass) { setResetError('Passwords do not match.'); return; }
    setResetLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setResetLoading(false);
    go('login');
    setLoginError('');
    // Brief success indicator
    setTimeout(() => setLoginError(''), 100);
  };

  // Card is defined outside LoginPage (see above) to prevent re-mount on every keystroke

  const passToggleBtn = (show, setShow) => (
    <button onClick={() => setShow(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: c.sub, padding: 4 }}>
      {show ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  // ── VIEWS ──────────────────────────────────────────────────

  // LOGIN
  if (view === 'login') return (
    <Shell c={c} isDark={isDark}>
      <Card c={c} isDark={isDark} mounted={mounted}>
        <ErrorBox msg={loginError} />
        <FInput label="Username" icon={User} value={username} onChange={e => { setUsername(e.target.value); setLoginError(''); }} onKeyDown={e => e.key === 'Enter' && handleLogin()} placeholder="Enter username" c={c} isDark={isDark} />
        <div style={{ marginBottom: 8 }}>
          <FInput
            label="Password"
            icon={Lock}
            type={showPass ? 'text' : 'password'}
            value={password}
            onChange={e => { setPassword(e.target.value); setLoginError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Enter password"
            c={c} isDark={isDark}
            right={passToggleBtn(showPass, setShowPass)}
          />
        </div>
        {/* Forgot link */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20, marginTop: -8 }}>
          <button onClick={() => go('forgot')} style={{ background: 'none', border: 'none', color: c.accent, fontSize: 12, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
            Forgot Password?
          </button>
        </div>

        <PrimaryBtn onClick={handleLogin} loading={loginLoading} loadingText="Signing in..." c={c}>
          <Shield size={15} /> Sign In
        </PrimaryBtn>

        {/* Create Account */}
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <span style={{ color: c.sub, fontSize: 13 }}>Don't have an account? </span>
          <button onClick={() => go('register')} style={{ background: 'none', border: 'none', color: c.accent, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Sora', sans-serif" }}>
            Create Account
          </button>
        </div>

      </Card>
    </Shell>
  );

  // REGISTER
  if (view === 'register') return (
    <Shell c={c} isDark={isDark}>
      <Card c={c} isDark={isDark} mounted={mounted} title="Create Account" subtitle="Register a new society account" icon={UserPlus} maxW={500}>
        <BackLink onClick={() => go('login')} c={c} />
        <ErrorBox msg={regError} />
        <SuccessBox msg={regSuccess} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <FInput label="Full Name *" icon={User} value={reg.name} onChange={e => setReg(r => ({ ...r, name: e.target.value }))} placeholder="Your full name" c={c} isDark={isDark} />
          <FInput label="Email *" icon={Mail} type="email" value={reg.email} onChange={e => setReg(r => ({ ...r, email: e.target.value }))} placeholder="email@example.com" c={c} isDark={isDark} />
          <FInput label="Phone *" icon={Phone} value={reg.phone} onChange={e => setReg(r => ({ ...r, phone: e.target.value }))} placeholder="10-digit mobile" c={c} isDark={isDark} />
          <FInput label="Username *" icon={User} value={reg.username} onChange={e => setReg(r => ({ ...r, username: e.target.value }))} placeholder="Choose username" c={c} isDark={isDark} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <FSelect label="Role *" value={reg.role} onChange={e => setReg(r => ({ ...r, role: e.target.value }))} options={ROLES} c={c} isDark={isDark} />
          <FSelect label="Society *" value={reg.society} onChange={e => setReg(r => ({ ...r, society: e.target.value }))} options={SOCIETIES} c={c} isDark={isDark} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 14px' }}>
          <FInput label="Password *" icon={Lock} type={showRegPass ? 'text' : 'password'} value={reg.password}
            onChange={e => setReg(r => ({ ...r, password: e.target.value }))} placeholder="Min 6 characters" c={c} isDark={isDark}
            right={passToggleBtn(showRegPass, setShowRegPass)} />
          <FInput label="Confirm Password *" icon={Lock} type={showRegPass ? 'text' : 'password'} value={reg.confirmPassword}
            onChange={e => setReg(r => ({ ...r, confirmPassword: e.target.value }))} placeholder="Repeat password" c={c} isDark={isDark} />
        </div>

        {/* Password strength */}
        {reg.password && (
          <div style={{ marginBottom: 16, marginTop: -8 }}>
            {[
              { label: '6+ characters', ok: reg.password.length >= 6 },
              { label: 'Has number', ok: /\d/.test(reg.password) },
              { label: 'Has letter', ok: /[a-zA-Z]/.test(reg.password) },
            ].map(r => (
              <span key={r.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: r.ok ? '#00d4aa' : c.sub, marginRight: 12 }}>
                {r.ok ? '✓' : '○'} {r.label}
              </span>
            ))}
          </div>
        )}

        <PrimaryBtn onClick={handleRegister} loading={regLoading} loadingText="Creating account..." c={c}>
          <UserPlus size={15} /> Create Account
        </PrimaryBtn>

        <p style={{ textAlign: 'center', color: c.sub, fontSize: 12, marginTop: 14 }}>
          Your account will be active after admin approval.
        </p>
      </Card>
    </Shell>
  );

  // FORGOT PASSWORD
  if (view === 'forgot') return (
    <Shell c={c} isDark={isDark}>
      <Card c={c} isDark={isDark} mounted={mounted} title="Forgot Password" subtitle="We'll send an OTP to your email" icon={KeyRound}>
        <BackLink onClick={() => go('login')} c={c} />
        <ErrorBox msg={forgotError} />
        <p style={{ color: c.sub, fontSize: 13, marginBottom: 20 }}>
          Enter your registered email address and we'll send you a 6-digit OTP to reset your password.
        </p>
        <FInput label="Registered Email" icon={Mail} type="email" value={forgotEmail}
          onChange={e => { setForgotEmail(e.target.value); setForgotError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleForgot()}
          placeholder="email@example.com" c={c} isDark={isDark} />
        <PrimaryBtn onClick={handleForgot} loading={forgotLoading} loadingText="Sending OTP..." c={c}>
          <Mail size={15} /> Send OTP
        </PrimaryBtn>
      </Card>
    </Shell>
  );

  // OTP VERIFICATION
  if (view === 'otp') return (
    <Shell c={c} isDark={isDark}>
      <Card c={c} isDark={isDark} mounted={mounted} title="Enter OTP" subtitle={`Sent to ${otpSentTo}`} icon={Shield}>
        <BackLink onClick={() => go('forgot')} c={c} />
        <ErrorBox msg={otpError} />

        <p style={{ color: c.sub, fontSize: 13, marginBottom: 20, textAlign: 'center' }}>
          Enter the 6-digit OTP sent to <strong style={{ color: c.text }}>{otpSentTo}</strong>
        </p>

        <OtpInput value={otp} onChange={setOtp} c={c} isDark={isDark} />

        {/* Demo hint */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span style={{ background: `${c.accent}15`, color: c.accent, fontSize: 11, padding: '4px 12px', borderRadius: 20, fontWeight: 600 }}>
            Demo OTP: 123456
          </span>
        </div>

        <PrimaryBtn onClick={handleOtpVerify} loading={otpLoading} loadingText="Verifying..." c={c} disabled={otp.length < 6}>
          <CheckCircle size={15} /> Verify OTP
        </PrimaryBtn>

        {/* Resend */}
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          {resendCooldown > 0 ? (
            <span style={{ color: c.sub, fontSize: 13 }}>Resend OTP in <strong style={{ color: c.text }}>{resendCooldown}s</strong></span>
          ) : (
            <button onClick={handleResendOtp} style={{ background: 'none', border: 'none', color: c.accent, fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Sora', sans-serif" }}>
              <RefreshCw size={13} /> Resend OTP
            </button>
          )}
        </div>
      </Card>
    </Shell>
  );

  // RESET PASSWORD
  if (view === 'reset') return (
    <Shell c={c} isDark={isDark}>
      <Card c={c} isDark={isDark} mounted={mounted} title="Reset Password" subtitle="Set your new password" icon={Lock}>
        <ErrorBox msg={resetError} />
        <SuccessBox msg={!resetError && newPass && newPass === confirmNewPass && newPass.length >= 6 ? 'Passwords match ✓' : ''} />

        <FInput label="New Password" icon={Lock} type={showNewPass ? 'text' : 'password'} value={newPass}
          onChange={e => { setNewPass(e.target.value); setResetError(''); }}
          placeholder="Min 6 characters" c={c} isDark={isDark}
          right={passToggleBtn(showNewPass, setShowNewPass)} />

        <FInput label="Confirm New Password" icon={Lock} type={showNewPass ? 'text' : 'password'} value={confirmNewPass}
          onChange={e => { setConfirmNewPass(e.target.value); setResetError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleReset()}
          placeholder="Repeat new password" c={c} isDark={isDark} />

        <PrimaryBtn onClick={handleReset} loading={resetLoading} loadingText="Resetting..." c={c}>
          <Lock size={15} /> Reset Password
        </PrimaryBtn>
      </Card>
    </Shell>
  );

  return null;
}

// Background shell with animated blobs
function Shell({ c, isDark, children }) {
  return (
    <div style={{
      minHeight: '100vh', background: c.bg, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: "'Sora', sans-serif", padding: 16,
      transition: 'background 0.3s',
    }}>
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: c.accent, opacity: 0.04, top: '10%', left: '15%', filter: 'blur(80px)', animation: 'blobFloat 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: '#6c63ff', opacity: 0.04, bottom: '15%', right: '10%', filter: 'blur(60px)', animation: 'blobFloat 12s ease-in-out infinite reverse' }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: '#ffb347', opacity: 0.03, top: '50%', right: '30%', filter: 'blur(50px)', animation: 'blobFloat 10s ease-in-out infinite 2s' }} />
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');
        @keyframes blobFloat { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.05)} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        .login-input:focus { border-color: ${c.accent} !important; box-shadow: 0 0 0 3px ${c.accent}22 !important; }
        .login-btn:hover   { opacity: 0.92; transform: translateY(-1px); }
        .login-btn:active  { transform: translateY(0); }
        .cred-row:hover    { background: ${isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} !important; cursor: pointer; }
      `}</style>

      <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}
