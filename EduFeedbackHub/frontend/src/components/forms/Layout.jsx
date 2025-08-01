/**
 * This component allows users to view content within a consistent page layout.
 * It provides a navigation bar and handles logout.
 */
import React, { useState, useEffect, useRef } from 'react';
import {useNavigate, Link} from 'react-router-dom';// Import router hooks and components

export default function Layout({children}) {
    const navigate = useNavigate();

    // State for notification dropdown
    const [showNotifications, setShowNotifications] = useState(false);
    const notificationRef = useRef(null);

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

    // Toggle notification dropdown
    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
    };

    // Close notification dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };

        if (showNotifications) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showNotifications]);

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
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                pointerEvents: 'none',
            }}>
                {/* Left side: Logo and navigation items */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 32,
                    marginLeft: 32,
                    pointerEvents: 'auto'
                }}>
                    {/* Site logo / title */}
                    <Link to="/" style={{
                        color: '#1976d2',
                        textDecoration: 'none',
                        fontWeight: 700,
                        fontSize: 22,
                        letterSpacing: 1
                    }}>
                        EduFeedbackHub
                    </Link>

                    {/* Quick Search & Add New Item navigation */}
                    <Link to="/search" style={{
                        color: '#1976d2',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: 14,
                        padding: '6px 12px',
                        borderRadius: 4,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                    }}>
                        Quick Search & Add New Item
                    </Link>

                    {/* View QS Rankings navigation */}
                    <Link to="/years" style={{
                        color: '#1976d2',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: 14,
                        padding: '6px 12px',
                        borderRadius: 4,
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.background = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.background = 'transparent';
                    }}>
                        View QS Rankings
                    </Link>
                </div>

                {/* Right-side user section: notification, profile, and auth controls */}
                <div style={{
                    marginRight: 32,
                    pointerEvents: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16
                }}>
                    {username ? (
                        <>
                            {/* Notification icon */}
                            <div ref={notificationRef} style={{ position: 'relative' }}>
                                <button
                                    onClick={toggleNotifications}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        padding: '6px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#666',
                                        fontSize: 18,
                                        transition: 'background-color 0.2s',
                                    }}
                                    onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                                    onMouseLeave={(e) => e.target.style.background = 'none'}
                                >
                                    🔔
                                </button>

                                {/* Notification dropdown */}
                                {showNotifications && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        background: 'white',
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 8,
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                        minWidth: 250,
                                        maxHeight: 300,
                                        overflowY: 'auto',
                                        zIndex: 1001,
                                        marginTop: 8,
                                    }}>
                                        <div style={{
                                            padding: '16px',
                                            borderBottom: '1px solid #e0e0e0',
                                            fontWeight: 600,
                                            color: '#333',
                                        }}>
                                            Notifications
                                        </div>
                                        <div style={{
                                            padding: '16px',
                                            color: '#666',
                                            textAlign: 'center',
                                        }}>
                                            No new notifications
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Profile link */}
                            <Link to="/profile" style={{
                                color: '#1976d2',
                                textDecoration: 'none',
                                fontWeight: 500,
                                fontSize: 14,
                                padding: '6px 12px',
                                borderRadius: 4,
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.background = '#f5f5f5';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.background = 'transparent';
                            }}>
                                Profile
                            </Link>

                            {/* Display logged-in user's name and role badge */}
                            <span style={{
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

