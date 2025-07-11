/**
 * This component provides a general-purpose comment form.
 * It supports submitting top-level comments or replies to existing comments.
 * The component is used across different entity types (e.g., university, college, school) by passing `targetType` and `targetId`.
 */

import React, {useState} from 'react';  // Import React and the useState hook

export default function CommentForm({targetType, targetId, parentId = null, onCommentAdded}) {
    const [content, setContent] = useState('');         // State to store the comment text
    const [submitting, setSubmitting] = useState(false); // State to indicate submission in progress

    // Handle form submission
    const handleSubmit = (e) => {
        e.preventDefault();  // Prevent the default form behavior

        if (!content.trim()) return alert('Comment cannot be empty');  // Basic validation

        setSubmitting(true);  // Set submitting state to disable inputs

        // Build the request payload. Dynamically set the key based on targetType (e.g., university_id)
        const body = {
            content,
            parent_id: parentId,
            [`${targetType}_id`]: targetId,
        };

        // Send POST request to add the comment
        fetch('/api/comment/add/', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body),
        })
            .then(res => {
                if (!res.ok) throw new Error('Failed to submit comment');
                return res.json();
            })
            .then(() => {
                setContent('');  // Clear the textarea after successful submission
                if (onCommentAdded) onCommentAdded();  // Notify parent component to refresh comments
            })
            .catch(err => alert(err.message))  // Show error message
            .finally(() => setSubmitting(false));  // Reset submitting state
    };

    return (
        <form onSubmit={handleSubmit} style={{marginTop: '8px', marginBottom: '8px'}}>
            {/* Textarea for comment content */}
            <textarea
                rows={3}
                value={content}
                onChange={e => setContent(e.target.value)}  // Update content state
                placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}  // Adjust placeholder
                disabled={submitting}
                style={{width: '100%', padding: '8px', fontWeight: 'bold'}}
            />

            {/* Submit button */}
            <button type="submit" disabled={submitting} style={{marginTop: '4px'}}>
                {submitting ? 'Submitting...' : parentId ? 'Reply' : 'Submit'} {/* Button label changes dynamically */}
            </button>
        </form>
    );
}

