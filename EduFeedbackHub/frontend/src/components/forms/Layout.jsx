/**
 * This component allows users to view content within a consistent page layout.
 * It provides a navigation bar and handles logout.
 */
import React from 'react';
import {useNavigate, Link} from 'react-router-dom';// Import router hooks and components

export default function Layout({children}) {
    const navigate = useNavigate();

    // Retrieve username and role from localStorage
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    // Handle user logout: clear user info and redirect to login
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        navigate('/login');
    };

    return (
        <div style={{
            minHeight: '100vh',
            width: '100vw',
            background: '#f7f7fa',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
        }}>
            {/* Main content container with max width and padding */}
            <div style={{
                width: '100%',
                maxWidth: 900,
                background: 'white',
                borderRadius: 12,
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                padding: 32,
                minHeight: 600,
                marginTop: 48
            }}>
                {children}
            </div>

            {/* Fixed top navigation bar with logo and auth controls */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: 48,
                background: 'transparent',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pointerEvents: 'none',
            }}>
                {/* Site logo / title */}
                <div style={{marginLeft: 32, pointerEvents: 'auto'}}>
                    <Link to="/" style={{
                        color: '#1976d2',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 22,
                        letterSpacing: 1
                    }}>
                        EduFeedbackHub
                    </Link>
                </div>

                {/* Right-side user section: greeting or login/register button */}
                <div style={{
                    marginRight: 32,
                    pointerEvents: 'auto',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    {username ? (
                        <>
                            {/* Display logged-in user's name and role badge */}
                            <span style={{
                                marginRight: 16,
                                color: '#1976d2',
                                fontWeight: 500,
                                display: 'flex',
                                alignItems: 'center'
                            }}>
                                Hello, {username}
                                {role && (
                                    <span style={{
                                        display: 'inline-block',
                                        background: role === 'lecturer' ? '#ede7f6' : '#eaf7ff',
                                        color: role === 'lecturer' ? '#6c3fc5' : '#1976d2',
                                        borderRadius: 4,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        padding: '2px 7px',
                                        marginLeft: 6,
                                    }}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                    </span>
                                )}
                            </span>

                            {/* Logout button */}
                            <button onClick={handleLogout} style={{
                                background: '#1976d2',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                padding: '4px 12px',
                                cursor: 'pointer',
                                fontWeight: 500
                            }}>
                                Logout
                            </button>
                        </>
                    ) : (
                        // Show login/register button if not logged in
                        <Link to="/login" style={{
                            color: '#1976d2',
                            fontWeight: 500,
                            fontSize: 16,
                            textDecoration: 'none',
                            padding: '7px 15px',
                            borderRadius: 4,
                            border: '1px solid #1976d2',
                            background: 'white',
                            marginLeft: 8
                        }}>
                            Register / Login
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

