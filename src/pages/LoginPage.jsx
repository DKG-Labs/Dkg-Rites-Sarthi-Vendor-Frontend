import { useState } from 'react';
import { loginUser, storeAuthData, isAuthenticated } from '../services/authService';
import './LoginPage.css';


const LoginPage = () => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loginType] = useState('Vendor');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // If already logged in, reload app to show Vendor Dashboard
  if (isAuthenticated()) {
    window.location.reload();
    return null;
  }

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

    setIsLoading(true);

    try {
      const userData = await loginUser(userId, password, loginType);

      // Store auth data
      storeAuthData(userData);

      // Reload so App.js shows appropriate Dashboard
      window.location.reload();

    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">SARTHI</div>
            <h1 className="login-title">Sign In</h1>
            <p className="login-subtitle">
              Access your inspection dashboard
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && (
              <div className="login-error">
                <span className="login-error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="login-form-group">
              <label className="login-label">
                User ID <span className="login-required">*</span>
              </label>
              <input
                type="text"
                className="login-input"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="Enter your User ID / Employee Code"
                disabled={isLoading}
              />
            </div>

            <div className="login-form-group">
              <label className="login-label">
                Password <span className="login-required">*</span>
              </label>
              <div className="login-password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="login-footer">
            <p className="login-footer-text">
              © 2025 SARTHI - Inspection Management System
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
