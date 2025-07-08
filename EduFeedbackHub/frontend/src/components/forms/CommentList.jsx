// CommentList.jsx
// This component renders a list of comments for a university,
// supports nested replies, and allows users to delete comments.
// It also handles showing/hiding the reply form for each comment.

import React, {useState} from 'react';
import CommentForm from './CommentForm.jsx';

export default function CommentList({comments, universityId, onCommentDeleted, onCommentAdded}) {
    // State to track which comment is currently being replied to
    const [replyingToId, setReplyingToId] = useState(null);

    // Delete a comment by ID with user confirmation
    const deleteComment = (id) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        fetch(`/api/comment/${id}/delete/`, {method: 'POST'})
            .then(res => {
                if (res.ok) {
                    onCommentDeleted();  // Notify parent to refresh comment list
                    if (replyingToId === id) setReplyingToId(null);  // Close reply form if open on deleted comment
                } else {
                    alert('Failed to delete comment');
                }
            });
    };

    // Recursively render comments and their nested replies
    // `level` controls indentation for nested replies
    const renderComments = (list, level = 0) => list.map(comment => (
        <div
            key={comment.id}
            style={{
                marginLeft: level * 20,       // Indent nested replies
                borderBottom: '1px solid #eee',
                padding: '8px 0',
            }}
        >
            {/* Comment content */}
            <p style={{fontWeight: 'bold'}}>{comment.content}</p>
            {/* Comment timestamp */}
            <small>{new Date(comment.created_at).toLocaleString()}</small><br/>

            {/* Reply button on left */}
            <button
                onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                style={{marginRight: 8}}
            >
                {replyingToId === comment.id ? 'Cancel Reply' : 'Reply'}
            </button>
            {/* Delete button on right */}
            <button onClick={() => deleteComment(comment.id)}>Delete</button>

            {/* Show reply form if replying to this comment */}
            {replyingToId === comment.id && (
                <div style={{marginTop: 8}}>
                    <CommentForm
                        universityId={universityId}  // Pass university ID from props
                        parentId={comment.id}         // This comment is the parent for the reply
                        onCommentAdded={() => {
                            setReplyingToId(null);    // Close reply form after adding comment
                            onCommentDeleted();       // Refresh comment list after reply added
                        }}
                    />
                </div>
            )}

            {/* Recursively render replies if any */}
            {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, level + 1)}
        </div>
    ));

    // If no comments, show message
    if (!comments || comments.length === 0) return <p>No comments yet.</p>;

    // Render all comments
    return <div>{renderComments(comments)}</div>;
}
