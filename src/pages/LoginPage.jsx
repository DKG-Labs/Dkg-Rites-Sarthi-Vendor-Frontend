import React, { useState, useEffect, useRef } from 'react';
import { loginUser, verifyOtp, storeAuthData, isAuthenticated, setActiveRole, getStoredUser, getActiveRole, resetPassword } from '../services/authService';
import './LoginPage.css';

// Import Assets
import logoSarthi from '../assets/login/logo-sarthi.png';
import slide1 from '../assets/login/slide1.jpeg';
import slide2 from '../assets/login/slide2.jpeg';

/**
 * Redesigned LoginPage for SARTHI Vendor Frontend with MFA Support
 */
const LoginPage = () => {
  // Original Logic States
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginType] = useState('Vendor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // MFA OTP States
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [mfaTransactionId, setMfaTransactionId] = useState('');
  const [otpInfoMessage, setOtpInfoMessage] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);

  // Redesign Specific States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [pointerRatio, setPointerRatio] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [availableRoles, setAvailableRoles] = useState(null); // New state for multiple roles

  const heroRef = useRef(null);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer;
    if (showOtpScreen && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpScreen, resendCountdown]);

  const slides = [
    {
      kicker: 'Automated QA Platform',
      title: 'Build quality at source.',
      highlight: 'Deliver safety on track.',
      description: 'Smart checks from material approval to final dispatch with complete digital traceability.',
      image: slide2
    },
    {
      kicker: 'Inspection Intelligence',
      title: 'Catch issues early',
      highlight: 'with real-time inspection.',
      description: 'Drive compliance decisions faster with live alerts, clear records, and accountable workflows.',
      image: slide1
    }
  ];

  // Slider Autoplay
  useEffect(() => {
    if (isInteracting) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, [isInteracting, slides.length]);

  // Header Scroll Effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const user = getStoredUser();
  const activeRole = getActiveRole();

  // If already logged in AND (single role OR role already selected), then reload to show Dashboard
  if (isAuthenticated() && (user?.roleName?.length <= 1 || activeRole)) {
    window.location.reload();
    return null;
  }

  const handlePointerMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setPointerRatio({ x: Math.max(-0.5, Math.min(0.5, x)), y: Math.max(-0.5, Math.min(0.5, y)) });
  };

  const processLoginSuccess = (userData) => {
    // Store auth data with canonical vendor login ID
    storeAuthData(userData, userId);

    // Check for multiple roles
    const roles = Array.isArray(userData.roleName) ? userData.roleName : [userData.roleName];

    if (roles.length > 1) {
      setAvailableRoles(roles);
    } else {
      // Single role, set it as active and reload
      setActiveRole(roles[0]);
      window.location.reload();
    }
  };

  // Submit Credentials (MFA Step 1)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!userId.trim()) {
      setError('Please enter User ID');
      return;
    }
    if (!password.trim()) {
      setError('Please enter Password');
      return;
    }

    try {
      setIsLoading(true);
      const response = await loginUser(userId, password, loginType);

      // If MFA required, transition to OTP Screen
      if (response && response.mfaRequired) {
        setMfaTransactionId(response.transactionId);
        setOtpInfoMessage(response.message || 'OTP sent to your registered mobile number.');
        setShowOtpScreen(true);
        setResendCountdown(30);
        setOtpValue('');
        return;
      }

      // Fallback direct login (if non-MFA response)
      processLoginSuccess(response);

    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Submit OTP (MFA Step 2)
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpValue.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setIsVerifyingOtp(true);

    try {
      const userData = await verifyOtp(mfaTransactionId, otpValue);
      setShowOtpScreen(false);
      processLoginSuccess(userData);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await resetPassword(userId, newPassword);
      setResetSuccess('Password reset successfully! Please log in.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setActiveRole(role);
    window.location.reload();
  };

  const parallaxX = pointerRatio.x * 16;
  const parallaxY = (pointerRatio.y * 12) + Math.max(-16, Math.min(22, -scrollY * 0.08));

  return (
    <div className="login-redesign-wrapper">
      <header className={`site-header ${scrollY > 8 ? 'is-compact' : ''}`}>
        <div className="header-shell">
          <a className="brand" href="/#">
            <span className="brand-mark">
              <img className="brand-rites-logo" src={logoSarthi} alt="SARTHI logo" />
            </span>
            <span className="brand-text">
              <span className="brand-title-row"><span className="brand-title">SARTHI</span></span>
              <span className="brand-fullform">System for Automated Review Tracking & Holistic Inspection</span>
            </span>
          </a>
        </div>
      </header>

      <main>
        <section className="hero" ref={heroRef} onPointerMove={handlePointerMove} onPointerLeave={() => setPointerRatio({ x: 0, y: 0 })}>
          <div className="hero-slider" onMouseEnter={() => setIsInteracting(true)} onMouseLeave={() => setIsInteracting(false)}>
            {slides.map((slide, index) => (
              <article key={index} className={`hero-slide ${index === currentSlide ? 'is-active' : ''}`}>
                <img src={slide.image} alt={slide.title} style={{
                  '--parallax-x': `${index === currentSlide ? parallaxX : 0}px`,
                  '--parallax-y': `${index === currentSlide ? parallaxY : 0}px`
                }} />
              </article>
            ))}
          </div>

          <div className="hero-overlay"></div>

          <div className="hero-content-shell">
            <div className="hero-grid">
              <article className="hero-copy-card is-revealed reveal-up">
                <p className="slide-kicker">{slides[currentSlide].kicker}</p>
                <h2 className="slide-title">
                  {slides[currentSlide].title} <span>{slides[currentSlide].highlight}</span>
                </h2>
                <p className="slide-description">{slides[currentSlide].description}</p>
              </article>

              <aside className="dashboard-panel is-revealed reveal-up">
                <div className="dashboard-login-chip">LOGIN</div>
                <div className="dashboard-header">
                  <div className="dashboard-logo-wrap">
                    <span className="dashboard-logo-glow"></span>
                    <img className="dashboard-rites-mark" src={logoSarthi} alt="SARTHI logo" />
                  </div>
                  <h2>SARTHI</h2>
                  <p className="dashboard-fullform">System for Automated Review Tracking & Holistic Inspection</p>
                </div>

                {showForgotPassword ? (
                  <form className="dashboard-form forgot-password-form" onSubmit={handleForgotPasswordSubmit}>
                    <div className="form-header" style={{marginBottom: '20px'}}>
                      <h2 style={{fontSize: '1.25rem', color: '#1a1a1a'}}>Reset Password</h2>
                      <p style={{fontSize: '0.875rem', color: '#666'}}>Enter your details to change your password</p>
                    </div>

                    {error && (
                      <div className="login-error-toast">
                        <span>⚠️ {error}</span>
                      </div>
                    )}
                    {resetSuccess && (
                      <div className="login-error-toast" style={{ backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #c8e6c9' }}>
                        <span>✓ {resetSuccess}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label>User ID</label>
                      <div className="input-field-shell">
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.1 0-8 2.1-8 5v1h16v-1c0-2.9-3.9-5-8-5Z" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          placeholder="Enter your User ID"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>New Password</label>
                      <div className="input-field-shell">
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Zm2 10.75A1.75 1.75 0 1 1 13.75 16 1.75 1.75 0 0 1 12 17.75Z" />
                          </svg>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <button type="button" className="password-toggle-redesign" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Confirm Password</label>
                      <div className="input-field-shell">
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Zm2 10.75A1.75 1.75 0 1 1 13.75 16 1.75 1.75 0 0 1 12 17.75Z" />
                          </svg>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                        <button type="button" className="password-toggle-redesign" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                      {isLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                    
                    <div className="dashboard-options" style={{ justifyContent: 'center', marginTop: '1rem' }}>
                      <button type="button" className="forgot-link" style={{background: 'none', border: 'none', cursor: 'pointer'}} onClick={() => { setShowForgotPassword(false); setError(''); setResetSuccess(''); }}>Back to Login</button>
                    </div>
                  </form>
                ) : showOtpScreen ? (
                  <form className="dashboard-form otp-form" onSubmit={handleOtpSubmit}>
                    <div className="form-header" style={{ marginBottom: '16px' }}>
                      <h2 style={{ fontSize: '1.25rem', color: '#1a1a1a', fontWeight: '800' }}>Security Verification</h2>
                      <div style={{
                        marginTop: '8px',
                        padding: '10px 14px',
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '10px',
                        fontSize: '0.85rem',
                        color: '#1e40af',
                        lineHeight: '1.4',
                        fontWeight: '600'
                      }}>
                        📱 {otpInfoMessage || 'OTP sent to your registered mobile number.'}
                      </div>
                    </div>

                    {error && (
                      <div className="login-error-toast">
                        <span>⚠️ {error}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label style={{ fontWeight: '700', color: '#334155' }}>Enter 6-Digit OTP</label>
                      <div className="input-field-shell">
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                          </svg>
                        </span>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 123456"
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                          disabled={isVerifyingOtp}
                          style={{ letterSpacing: '4px', fontSize: '1.15rem', fontWeight: '800', textAlign: 'center' }}
                          autoFocus
                          required
                        />
                      </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isVerifyingOtp} style={{ marginTop: '12px' }}>
                      {isVerifyingOtp ? 'Verifying OTP...' : 'Verify & Proceed'}
                    </button>

                    <div className="dashboard-options" style={{ justifyContent: 'space-between', marginTop: '1rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="forgot-link"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                        onClick={() => { setShowOtpScreen(false); setError(''); }}
                      >
                        ← Back to Login
                      </button>

                      <button
                        type="button"
                        className="forgot-link"
                        disabled={resendCountdown > 0}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: resendCountdown > 0 ? 'not-allowed' : 'pointer',
                          color: resendCountdown > 0 ? '#94a3b8' : '#2563eb',
                          fontWeight: '700'
                        }}
                        onClick={handleSubmit}
                      >
                        {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                ) : !availableRoles ? (
                  <form className="dashboard-form" onSubmit={handleSubmit}>
                    {error && (
                      <div className="login-error-toast">
                        <span>⚠️ {error}</span>
                      </div>
                    )}

                    <div className="form-group">
                      <label>User ID</label>
                      <div className="input-field-shell">
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.1 0-8 2.1-8 5v1h16v-1c0-2.9-3.9-5-8-5Z" />
                          </svg>
                        </span>
                        <input
                          type="text"
                          placeholder="Enter your User ID"
                          value={userId}
                          onChange={(e) => setUserId(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Password</label>
                      <div className="input-field-shell">
                        <span className="input-icon">
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                            <path d="M17 9h-1V7a4 4 0 1 0-8 0v2H7a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-7-2a2 2 0 1 1 4 0v2h-4Zm2 10.75A1.75 1.75 0 1 1 13.75 16 1.75 1.75 0 0 1 12 17.75Z" />
                          </svg>
                        </span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Enter your password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={isLoading}
                          required
                        />
                        <button type="button" className="password-toggle-redesign" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <div className="dashboard-options">
                      <label className="remember-me">
                        <input type="checkbox" /> <span>Remember me</span>
                      </label>
                      <a href="/#" className="forgot-link" onClick={(e) => { e.preventDefault(); setShowForgotPassword(true); setError(''); setResetSuccess(''); }}>Forgot password?</a>
                    </div>

                    <button type="submit" className="submit-btn" disabled={isLoading}>
                      {isLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                    <p className="dashboard-footnote">Protected session with active security monitoring</p>
                  </form>
                ) : (
                  <div className="role-selection-container">
                    <h3 className="selection-title">Select Dashboard</h3>
                    <p className="selection-subtitle">Multiple roles detected. Please choose a workspace to continue.</p>
                    {availableRoles.map((role, idx) => (
                      <div key={idx} className="role-option-card" onClick={() => handleRoleSelect(role)}>
                        <div className="role-name">
                          {role === 'Vendor' ? 'ERC Vendor' : (role === 'Rail Vendor' ? 'Railpad Vendor' : role)}
                        </div>
                        <div className="role-arrow">
                          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                            <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                          </svg>
                        </div>
                      </div>
                    ))}
                    <button className="back-to-login" onClick={() => setAvailableRoles(null)}>
                      Back to Login
                    </button>
                  </div>
                )}
              </aside>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
