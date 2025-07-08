// This component renders a comment submission form used to post new comments
// or replies for a specific university. It handles user input, form submission,
// and communicates with the backend API to save comments.


import React, {useState} from 'react';

export default function CommentForm({universityId, parentId = null, onCommentAdded}) {
    // State to store the current comment text input by the user
    const [content, setContent] = useState('');

    // State to track whether the form is currently submitting
    const [submitting, setSubmitting] = useState(false);

    // Handles the form submission event
    const handleSubmit = (e) => {
        e.preventDefault();  // Prevent default form submission behavior (page reload)

        // Validate that the comment is not empty
        if (!content.trim()) return alert('Comment cannot be empty');

        setSubmitting(true);  // Set submitting state to true to disable input and button

        // Send POST request to the backend API with comment content and optional parent ID (for replies)
        fetch(`/api/university/${universityId}/comment/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({content, parent_id: parentId}),
        })
            .then(res => {
                // If response is not OK, throw an error
                if (!res.ok) throw new Error('Failed to submit comment');
                return res.json();
            })
            .then(() => {
                // Clear the textarea after successful submission
                setContent('');
                // Notify parent component that a comment was added (to refresh comment list)
                onCommentAdded();
            })
            .catch(err => alert(err.message))  // Show alert if an error occurs
            .finally(() => setSubmitting(false));  // Re-enable the form inputs
    };

    return (
        <form onSubmit={handleSubmit} style={{marginTop: '8px', marginBottom: '8px'}}>
            <textarea
                rows={3}
                value={content}
                onChange={e => setContent(e.target.value)}  // Update content state on user input
                placeholder={parentId ? 'Write a reply...' : 'Write a comment...'}  // Different placeholder for replies or new comments
                disabled={submitting}  // Disable textarea during submission
                style={{width: '100%', padding: '8px', fontWeight: 'bold'}}
            />

            <button type="submit" disabled={submitting} style={{marginTop: '4px'}}>
                {submitting ? 'Submitting...' : parentId ? 'Reply' : 'Submit'}
            </button>
        </form>
    );
}
