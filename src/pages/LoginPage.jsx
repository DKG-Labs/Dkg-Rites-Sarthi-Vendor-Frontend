import React, { useState, useEffect, useRef } from 'react';
import { loginUser, storeAuthData, isAuthenticated, setActiveRole, getStoredUser, getActiveRole } from '../services/authService';
import './LoginPage.css';

// Import Assets
import logoSarthi from '../assets/login/logo-sarthi.png';
import slide1 from '../assets/login/slide1.jpeg';
import slide2 from '../assets/login/slide2.jpeg';

/**
 * Redesigned LoginPage for SARTHI Vendor Frontend
 */
const LoginPage = () => {
  // Original Logic States
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginType] = useState('Vendor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redesign Specific States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [pointerRatio, setPointerRatio] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [availableRoles, setAvailableRoles] = useState(null); // New state for multiple roles

  const heroRef = useRef(null);

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
    // Only reload if we are not already on the dashboard (indicated by some state)
    // Actually window.location.reload() is fine as a simple redirect trigger for this app's architecture
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

  // Original Submit Logic
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

    // Static credentials for RailPad application
    if (userId.toLowerCase() === 'railpad' && password === 'password') {
      const railpadUser = {
        roleName: ['RAILPAD_USER'],
        userId: 'railpad',
        email: 'railpad@sarthi.com'
      };
      storeAuthData(railpadUser);
      window.location.reload();
      return;
    }

    try {
      const userData = await loginUser(userId, password, loginType);

      // Store basic auth data first
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

    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
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

                {!availableRoles ? (
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
                      <a href="/#" className="forgot-link">Forgot password?</a>
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
                        <div className="role-name">{role}</div>
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
