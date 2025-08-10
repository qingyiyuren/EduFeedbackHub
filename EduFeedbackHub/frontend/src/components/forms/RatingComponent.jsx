/**
 * This component allows users to rate an entity and view the average rating.
 */
import React, {useState, useEffect} from 'react';// Import React and hooks
import { getApiUrlWithPrefix } from '../../config/api.js'; // Import API configuration

// React component for star-based rating with current user interaction and average display
export default function RatingComponent({
                                            targetType,            // Type of the entity being rated (e.g., 'module', 'lecturer')
                                            targetId,              // ID of the entity being rated
                                            average = 0,           // Average rating score for this entity
                                            count = 0,             // Total number of ratings submitted
                                            userRole = null,       // Current user's role (e.g., 'student'); only students can rate
                                            onRatingChange = null  // Optional callback after a new rating is submitted
                                        }) {
    const [currentRating, setCurrentRating] = useState(0);       // User's own rating for this entity
    const [hoverRating, setHoverRating] = useState(0);           // Rating value currently hovered
    const [isSubmitting, setIsSubmitting] = useState(false);     // Whether a rating is currently being submitted
    const canRate = userRole === 'student';                      // Only students are allowed to rate
    const token = localStorage.getItem('token');                 // Retrieve auth token from local storage

    // Fetch the user's existing rating for the target entity (if any)
    useEffect(() => {
        if (!canRate || !token) return;
        fetch(getApiUrlWithPrefix(`rate/user-rating/?target_type=${targetType}&target_id=${targetId}`), {
            headers: {
                'Authorization': `Token ${token}`,
            },
        })
            .then(res => res.json())
            .then(data => {
                if (data.score) {
                    setCurrentRating(data.score); // Set previously submitted score
                }
            });
    }, [targetType, targetId, canRate, token]);

    // Handle clicking on a star to submit a rating
    const handleStarClick = async (rating) => {
        if (!canRate || !token) return;
        setIsSubmitting(true);
        try {
            const response = await fetch(getApiUrlWithPrefix('rate/'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify({
                    target_type: targetType,
                    target_id: targetId,
                    score: rating
                }),
            });
            const data = await response.json();
            if (response.ok) {
                setCurrentRating(rating); // Update current rating after successful submission
                if (onRatingChange) {
                    onRatingChange(data.average, data.count); // Notify parent of new average/count
                }
            } else {
                alert(data.error || 'Failed to submit rating'); // Show error message
            }
        } catch (error) {
            alert('Failed to submit rating'); // Show network error
        } finally {
            setIsSubmitting(false); // Reset submitting flag
        }
    };

    // Render one star icon with interaction logic and styling
    const renderStar = (index) => {
        const starValue = index + 1; // Star values range from 1 to 5
        const filled = hoverRating >= starValue || (hoverRating === 0 && currentRating >= starValue);
        const halfFilled = !filled && (hoverRating >= starValue - 0.5 || (hoverRating === 0 && currentRating >= starValue - 0.5));
        return (
            <span
                key={index}
                onClick={canRate ? () => handleStarClick(starValue) : undefined}
                onMouseEnter={canRate ? () => setHoverRating(starValue) : undefined}
                onMouseLeave={canRate ? () => setHoverRating(0) : undefined}
                style={{
                    cursor: canRate ? 'pointer' : 'default',
                    fontSize: '24px',
                    color: filled ? '#ffd700' : halfFilled ? '#ffd700' : '#ddd',
                    opacity: isSubmitting ? 0.5 : 1,
                    userSelect: 'none',
                }}
                role="button"
                aria-label={`Rate ${starValue} star${starValue > 1 ? 's' : ''}`}
            >
                ★
            </span>
        );
    };

    // Render the full rating UI
    return (
        <div style={{marginBottom: '20px', padding: '15px', border: '1px solid #eee', borderRadius: '8px'}}>
            {/* Show prompt to rate if user is a student */}
            {canRate && (
                <div style={{fontSize: '14px', color: '#666', marginBottom: '10px'}}>
                    {token ? 'Click stars to rate' : 'Please log in to rate'}
                </div>
            )}
            {/* Render star rating interaction UI */}
            {canRate && (
                <div style={{display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px'}}>
                    <div style={{display: 'flex', gap: '2px'}}>
                        {[0, 1, 2, 3, 4].map(renderStar)} {/* 5 stars */}
                    </div>
                    {currentRating > 0 && (
                        <span style={{fontSize: '14px', color: '#666'}}>
                            Your rating: {currentRating}
                        </span>
                    )}
                </div>
            )}
            {/* Show average rating and total count */}
            <div style={{marginBottom: '10px'}}>
                <div style={{fontSize: '16px', fontWeight: 'bold', color: '#333'}}>
                    Average: {average.toFixed(1)}
                </div>
                <div style={{fontSize: '14px', color: '#666'}}>
                    {count} {count === 1 ? 'rating' : 'ratings'}
                </div>
            </div>
        </div>
    );
}
