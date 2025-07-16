/**
 * This component allows users to submit new comments or replies.
 * It supports anonymous posting and requires login.
 */
import React, { useState } from 'react'; // Import React and useState hook

export default function CommentForm({ targetType, targetId, targetIdName, parentId, onCommentAdded }) {
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    // State for comment content
    const [content, setContent] = useState('');
    // State for anonymous toggle
    const [isAnonymous, setIsAnonymous] = useState(false);
    // State for error message
    const [error, setError] = useState('');
    // State for submission loading
    const [submitting, setSubmitting] = useState(false);

    // If not logged in, show login prompt
    if (!token) {
        return <div style={{ color: '#d32f2f', margin: '16px 0' }}>Please log in to comment</div>;
    }

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!content.trim()) {
            setError('Comment content cannot be empty');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            // Build payload for API
            const payload = {
                content,
                is_anonymous: isAnonymous,
            };
            if (targetIdName && targetId) {
                payload[targetIdName] = targetId;
            }
            if (parentId) payload.parent_id = parentId;
            // Send POST request to add comment
            const res = await fetch('/api/comment/add/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`,
                },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                setContent(''); // Clear input
                setIsAnonymous(false); // Reset anonymous
                if (onCommentAdded) onCommentAdded(); // Notify parent
            } else {
                setError(data.error || 'Failed to submit comment');
            }
        } catch (err) {
            setError('Failed to submit comment');
        } finally {
            setSubmitting(false);
        }
    };

    // Render the comment form
    return (
        <form onSubmit={handleSubmit} style={{ margin: '16px 0' }}>
            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Enter your comment"
                rows={3}
                style={{ width: '100%', padding: 8, fontSize: 15, borderRadius: 4, border: '1px solid #ccc', resize: 'vertical' }}
                disabled={submitting}
            />
            <div style={{ margin: '8px 0' }}>
                <label>
                    <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={e => setIsAnonymous(e.target.checked)}
                        disabled={submitting}
                    />
                    {' '}Comment anonymously
                </label>
            </div>
            {error && <div style={{ color: '#d32f2f', marginBottom: 8 }}>{error}</div>}
            <button type="submit" disabled={submitting || !content.trim()} style={{ padding: '6px 18px', fontSize: 15 }}>
                {submitting ? 'Submitting...' : 'Submit'}
            </button>
        </form>
    );
}

