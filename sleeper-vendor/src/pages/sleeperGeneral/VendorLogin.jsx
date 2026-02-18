import React, { useState } from 'react';

const VendorLogin = ({ onLogin }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            if (formData.username === '1' && formData.password === 'password') {
                onLogin();
            } else {
                setError('Invalid username or password');
            }
        }, 1000);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
            padding: '20px',
            fontFamily: 'var(--font-primary)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative element */}
                <div style={{
                    position: 'absolute',
                    top: '-50px',
                    right: '-50px',
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    background: 'rgba(33, 128, 141, 0.1)',
                    zIndex: 0
                }} />

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h1 style={{
                            fontSize: '2rem',
                            color: '#0d3b3f',
                            marginBottom: '8px',
                            fontWeight: '800',
                            letterSpacing: '-0.02em'
                        }}> SARTHI </h1>
                        <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '500' }}>
                            Sleeper-Vendor Portal
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {error && (
                            <div style={{
                                backgroundColor: '#fef2f2',
                                color: '#991b1b',
                                padding: '12px',
                                borderRadius: '12px',
                                marginBottom: '20px',
                                fontSize: '0.875rem',
                                textAlign: 'center',
                                border: '1px solid #fee2e2'
                            }}>
                                {error}
                            </div>
                        )}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: '#1e293b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                placeholder="Enter your username"
                                onFocus={(e) => e.target.style.borderColor = '#21808d'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: '#1e293b',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    border: '1.5px solid #e2e8f0',
                                    fontSize: '1rem',
                                    transition: 'all 0.2s',
                                    outline: 'none'
                                }}
                                placeholder="••••••••"
                                onFocus={(e) => e.target.style.borderColor = '#21808d'}
                                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '12px',
                                background: '#21808d',
                                color: 'white',
                                border: 'none',
                                fontSize: '1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(33, 128, 141, 0.25)'
                            }}
                            onMouseOver={(e) => e.target.style.background = '#1a6670'}
                            onMouseOut={(e) => e.target.style.background = '#21808d'}
                        >
                            {isLoading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <div style={{ marginTop: '32px', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            © 2026 Rites Ltd. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorLogin;
