// src/components/LoginComponent.js
import React, { useState } from 'react';
import { DollarSign, Lock, User } from 'lucide-react';
import { usersService } from '../firebase/services';

const LoginComponent = ({ onLoginSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Verify login credentials using the service
            const user = await usersService.verifyLogin(username, password);

            if (user) {
                // Login successful
                onLoginSuccess(user);
            } else {
                setError('Invalid username or password');
            }

        } catch (err) {
            console.error('Login error:', err);

            // Provide more specific error messages
            if (err.message.includes('Firebase')) {
                setError('Firebase connection error. Please check your configuration.');
            } else if (err.message.includes('services')) {
                setError('Services not found. Please ensure usersService is exported from services.js');
            } else {
                setError('Login failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(to bottom right, #4f46e5, #7c3aed, #ec4899)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                width: '100%',
                maxWidth: '448px',
                padding: '32px'
            }}>
                {/* Logo/Header */}
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{
                        background: '#4f46e5',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <DollarSign color="white" size={32} />
                    </div>
                    <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1f2937' }}>
                        Class Payment
                    </h1>
                    <p style={{ color: '#6b7280', marginTop: '8px' }}>
                        Management System
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div style={{
                        background: '#fee2e2',
                        border: '1px solid #fca5a5',
                        color: '#991b1b',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        fontSize: '14px'
                    }}>
                        <p style={{ fontWeight: '500', marginBottom: '4px' }}>Error</p>
                        <p>{error}</p>
                    </div>
                )}

                {/* Login Form */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Username Field */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            Username
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none'
                            }}>
                                <User color="#9ca3af" size={20} />
                            </div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                                style={{
                                    width: '100%',
                                    paddingLeft: '40px',
                                    paddingRight: '16px',
                                    paddingTop: '12px',
                                    paddingBottom: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                                placeholder="Enter your username"
                                disabled={loading}
                                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>
                    </div>

                    {/* Password Field */}
                    <div>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '500',
                            color: '#374151',
                            marginBottom: '8px'
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                position: 'absolute',
                                left: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                pointerEvents: 'none'
                            }}>
                                <Lock color="#9ca3af" size={20} />
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin(e)}
                                style={{
                                    width: '100%',
                                    paddingLeft: '40px',
                                    paddingRight: '16px',
                                    paddingTop: '12px',
                                    paddingBottom: '12px',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                                placeholder="Enter your password"
                                disabled={loading}
                                onFocus={(e) => e.target.style.borderColor = '#4f46e5'}
                                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                            />
                        </div>
                    </div>

                    {/* Login Button */}
                    <button
                        onClick={handleLogin}
                        disabled={loading || !username || !password}
                        style={{
                            width: '100%',
                            background: loading || !username || !password ? '#a5b4fc' : '#4f46e5',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            border: 'none',
                            cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (!loading && username && password) {
                                e.target.style.background = '#4338ca';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!loading && username && password) {
                                e.target.style.background = '#4f46e5';
                            }
                        }}
                    >
                        {loading ? (
                            <>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    border: '2px solid white',
                                    borderTopColor: 'transparent',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                Logging in...
                            </>
                        ) : (
                            'Login'
                        )}
                    </button>
                </div>



                <style>
                    {`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}
                </style>
            </div>
        </div>
    );
};

export default LoginComponent;