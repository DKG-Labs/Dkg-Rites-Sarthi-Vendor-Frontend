import React, { useState } from 'react';
import { loginUser, storeAuthData } from '../../services/authService.js';
import { plantMappingService } from '../../services/plantMappingService.js';

const RailPadVendorLogin = ({ onLogin, onPlantsFetched }) => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Real Login
            const userData = await loginUser(formData.username, formData.password, 'VENDOR');
            storeAuthData(userData, formData.username);

            // Login successful, proceed to app
            onLogin();
        } catch (err) {
            console.error('Login failed:', err);
            setError(err.message || 'Invalid username or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0d3b3f 0%, #21808d 100%)',
            padding: '20px'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                borderRadius: '24px',
                padding: '40px',
                boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                position: 'relative'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2.5rem', color: '#0d3b3f', marginBottom: '4px', fontWeight: '900' }}>SARTHI</h1>
                    <p style={{ color: '#64748b', fontSize: '1rem', fontWeight: '600' }}>Rail Pad Vendor Portal</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && (
                        <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '12px', borderRadius: '12px', marginBottom: '20px', fontSize: '0.875rem', textAlign: 'center', border: '1px solid #fee2e2' }}>
                            {error}
                        </div>
                    )}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase' }}>Username</label>
                        <input
                            type="text"
                            required
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '1rem' }}
                            placeholder="Enter your username"
                        />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.75rem', fontWeight: '700', color: '#1e293b', textTransform: 'uppercase' }}>Password</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #e2e8f0', fontSize: '1rem' }}
                            placeholder="••••••••"
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
                            opacity: isLoading ? 0.7 : 1
                        }}
                    >
                        {isLoading ? 'Processing...' : 'Sign In'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RailPadVendorLogin;
