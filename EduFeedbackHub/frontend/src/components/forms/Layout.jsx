/**
 * This component allows users to view content within a consistent page layout.
 * It provides a navigation bar and handles logout.
 */
import React, { useState, useEffect, useRef } from 'react';
import {useNavigate, Link} from 'react-router-dom';// Import router hooks and components
import { getApiUrlWithPrefix } from '../../config/api.js'; // Import API configuration

export default function Layout({children}) {
    const navigate = useNavigate();

    // State for notification dropdown and data
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const notificationRef = useRef(null);

    // Retrieve username and role from localStorage
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');

    // Handle user logout: clear user info and redirect to login
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        navigate('/login');
    };

    // Fetch notifications from API
    const fetchNotifications = async () => {
        if (!token) return;
        
        try {
            setLoading(true);
            const response = await fetch(getApiUrlWithPrefix('notifications/'), {
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                setNotifications(data.notifications);
                setUnreadCount(data.unread_count);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mark notifications as read
    const markAsRead = async (notificationIds) => {
        if (!token) return;
        
        try {
            const response = await fetch(getApiUrlWithPrefix('notifications/'), {
                method: 'PUT',
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ notification_ids: notificationIds }),
            });
            
            if (response.ok) {
                // Update local state
                setNotifications(prev => 
                    prev.map(notification => 
                        notificationIds.includes(notification.id) 
                            ? { ...notification, is_read: true }
                            : notification
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
            }
        } catch (error) {
            console.error('Error marking notifications as read:', error);
        }
    };

    // Toggle notification dropdown and fetch notifications
    const toggleNotifications = () => {
        if (!showNotifications) {
            fetchNotifications();
        }
        setShowNotifications(!showNotifications);
    };

    // Fetch unread count periodically and when component mounts
    useEffect(() => {
        if (!token) return;
        
        const fetchUnreadCount = async () => {
            try {
                const response = await fetch(getApiUrlWithPrefix('notifications/count/'), {
                    headers: {
                        'Authorization': `Token ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.unread_count);
                }
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        // Fetch immediately
        fetchUnreadCount();
        
        // Set up interval to fetch every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        
        return () => clearInterval(interval);
    }, [token]);

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
                        color: '#388e3c',
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
                                        padding: '8px',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#666',
                                        fontSize: 20,
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        width: '40px',
                                        height: '40px',
                                    }}
                                    onMouseEnter={(e) => {
                                        e.target.style.background = '#f5f5f5';
                                        e.target.style.color = '#1976d2';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.target.style.background = 'none';
                                        e.target.style.color = '#666';
                                    }}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                                    </svg>
                                    {/* Unread notification badge */}
                                    {unreadCount > 0 && (
                                        <span style={{
                                            position: 'absolute',
                                            top: '-2px',
                                            right: '-2px',
                                            background: '#f44336',
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '18px',
                                            height: '18px',
                                            fontSize: '11px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                        }}>
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
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
                                        minWidth: 300,
                                        maxHeight: 400,
                                        overflowY: 'auto',
                                        zIndex: 1001,
                                        marginTop: 8,
                                    }}>
                                        <div style={{
                                            padding: '16px',
                                            borderBottom: '1px solid #e0e0e0',
                                            fontWeight: 600,
                                            color: '#333',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}>
                                            <span>Notifications</span>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={() => {
                                                        const unreadIds = notifications
                                                            .filter(n => !n.is_read)
                                                            .map(n => n.id);
                                                        markAsRead(unreadIds);
                                                    }}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#1976d2',
                                                        cursor: 'pointer',
                                                        fontSize: '12px',
                                                        textDecoration: 'underline',
                                                    }}
                                                >
                                                    Mark all as read
                                                </button>
                                            )}
                                        </div>
                                        
                                        {loading ? (
                                            <div style={{
                                                padding: '16px',
                                                color: '#666',
                                                textAlign: 'center',
                                            }}>
                                                Loading...
                                            </div>
                                        ) : notifications.length === 0 ? (
                                        <div style={{
                                            padding: '16px',
                                            color: '#666',
                                            textAlign: 'center',
                                        }}>
                                                No notifications
                                            </div>
                                        ) : (
                                            <div>
                                                {notifications.map((notification) => (
                                                    <div
                                                        key={notification.id}
                                                        onClick={() => {
                                                            if (!notification.is_read) {
                                                                markAsRead([notification.id]);
                                                            }
                                                        }}
                                                        style={{
                                                            padding: '12px 16px',
                                                            borderBottom: '1px solid #f0f0f0',
                                                            cursor: 'pointer',
                                                            background: notification.is_read ? 'white' : '#f8f9ff',
                                                            transition: 'background-color 0.2s',
                                                        }}
                                                        onMouseEnter={(e) => e.target.style.background = '#f5f5f5'}
                                                        onMouseLeave={(e) => e.target.style.background = notification.is_read ? 'white' : '#f8f9ff'}
                                                    >
                                                        <div style={{
                                                            fontSize: '13px',
                                                            color: '#666',
                                                            marginBottom: '4px',
                                                        }}>
                                                            {notification.is_follow_notification 
                                                                ? `${notification.reply.user || 'Anonymous'} commented on a page you follow`
                                                                : `${notification.reply.user || 'Anonymous'} replied to your comment`
                                                            }
                                                        </div>
                                                        <div style={{
                                                            fontSize: '12px',
                                                            color: '#999',
                                                            marginBottom: '4px',
                                                        }}>
                                                            {/* Create clickable link using entity type and ID from backend */}
                                                            {(() => {
                                                                const { entity_type, entity_id, target } = notification.original_comment;
                                                                
                                                                // Create link if we have entity type and ID
                                                                if (entity_type && entity_id) {
                                                                    const routeMap = {
                                                                        'university': `/university/${entity_id}`,
                                                                        'college': `/college/${entity_id}`,
                                                                        'school': `/school/${entity_id}`,
                                                                        'module': `/module/${entity_id}`,
                                                                        'teaching': `/teaching/${entity_id}`,
                                                                        'lecturer': `/lecturer/${entity_id}`,
                                                                    };
                                                                    
                                                                    const route = routeMap[entity_type];
                                                                    if (route) {
                                                                        // For follow notifications, show entity type and name
                                                                        // For reply notifications, show module information
                                                                        let displayText = target;
                                                                        if (notification.is_follow_notification) {
                                                                            // For follow notifications, target already contains the full format
                                                                            // Just use the target as is since it already has the entity type
                                                                            displayText = target;
                                                                        } else {
                                                                            // For reply notifications, format as "Module: ModuleName"
                                                                            if (entity_type === 'teaching') {
                                                                                // Extract module name from teaching target
                                                                                // Target format: "Teaching: Jack Doe - Painting (Drawing (Arts)) (2025)"
                                                                                const moduleMatch = target.match(/^Teaching: (.+?) - (.+?) \((\d{4})\)$/);
                                                                                if (moduleMatch) {
                                                                                    displayText = `Module: ${moduleMatch[2]}`;
                                                                                }
                                                                            } else if (entity_type === 'module') {
                                                                                // Target format: "Module: ModuleName"
                                                                                const moduleMatch = target.match(/^Module: (.+)$/);
                                                                                if (moduleMatch) {
                                                                                    displayText = `Module: ${moduleMatch[1]}`;
                                                                                }
                                                                            }
                                                                        }
                                                                        
                                                                        return (
                                                                            <Link 
                                                                                to={route}
                                                                                style={{ color: '#1976d2', textDecoration: 'none' }}
                                                                                onClick={() => setShowNotifications(false)}
                                                                            >
                                                                                {displayText}
                                                                            </Link>
                                                                        );
                                                                    }
                                                                }
                                                                
                                                                // Fallback to plain text if no valid link
                                                                return target;
                                                            })()}
                                                        </div>
                                                        <div style={{
                                                            fontSize: '14px',
                                                            color: '#333',
                                                            fontWeight: notification.is_read ? 'normal' : '600',
                                                        }}>
                                                            "{notification.reply.content}"
                                                        </div>
                                                        <div style={{
                                                            fontSize: '11px',
                                                            color: '#999',
                                                            marginTop: '4px',
                                                        }}>
                                                            {new Date(notification.created_at).toLocaleString('en-US', {
                                                                month: 'numeric',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                second: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                        )}
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

