/**
 * This component for following/unfollowing entities.
 * Display a button that allows users to follow or unfollow an entity
 * to receive notifications about new comments and replies.
 */

import React, { useState, useEffect } from 'react';

export default function FollowButton({ entityType, entityId }) {
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Get authentication token
    const token = localStorage.getItem('token');

    // Check if user is logged in
    const isLoggedIn = !!token;

    // Fetch initial follow status
    useEffect(() => {
        if (!isLoggedIn) return;

        const checkFollowStatus = async () => {
            try {
                const response = await fetch(
                    `http://localhost:8000/api/follow/status/?entity_type=${entityType}&entity_id=${entityId}`,
                    {
                        headers: {
                            'Authorization': `Token ${token}`,
                            'Content-Type': 'application/json',
                        },
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    setIsFollowing(data.is_following);
                }
            } catch (error) {
                console.error('Error checking follow status:', error);
            }
        };

        checkFollowStatus();
    }, [entityType, entityId, token, isLoggedIn]);

    // Toggle follow/unfollow
    const toggleFollow = async () => {
        if (!isLoggedIn) {
            setError('Please log in to follow entities');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const method = isFollowing ? 'DELETE' : 'POST';
            const response = await fetch('http://localhost:8000/api/follow/', {
                method: method,
                headers: {
                    'Authorization': `Token ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    entity_type: entityType,
                    entity_id: entityId,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setIsFollowing(!isFollowing);
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to update follow status');
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Don't render if not logged in
    if (!isLoggedIn) {
        return null;
    }

    return (
        <div style={{ marginBottom: '16px' }}>
            <button
                onClick={toggleFollow}
                disabled={loading}
                style={{
                    background: isFollowing ? '#dc3545' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 16px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    transition: 'background-color 0.2s',
                    opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                    if (!loading) {
                        e.target.style.background = isFollowing ? '#c82333' : '#218838';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!loading) {
                        e.target.style.background = isFollowing ? '#dc3545' : '#28a745';
                    }
                }}
            >
                {loading ? 'Loading...' : (isFollowing ? 'Unfollow' : 'Follow Comments')}
            </button>
            
            {error && (
                <div style={{
                    color: '#dc3545',
                    fontSize: '12px',
                    marginTop: '4px',
                }}>
                    {error}
                </div>
            )}
            
            <div style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '4px',
            }}>
                {isFollowing 
                    ? 'You will receive notifications for new comments and replies on this page' 
                    : 'Follow to receive notifications for new comments and replies on this page'
                }
            </div>
        </div>
    );
} 