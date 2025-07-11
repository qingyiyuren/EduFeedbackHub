/**
 * This component displays a list of comments with support for nested replies.
 * Users can reply to or delete comments.
 * It accepts a list of comments and provides buttons for user interaction.
 */

import React, { useState } from 'react';
import CommentForm from './CommentForm.jsx';  // Import the reusable comment form

export default function CommentList({
    comments,         // Array of comment objects
    targetType,       // e.g. "university"
    targetId,         // e.g. 3 (university ID)
    onCommentDeleted, // Function to refresh comments after deletion/addition
    onCommentAdded    // Optional: function to call when a comment is added
}) {
    const [replyingToId, setReplyingToId] = useState(null);  // Track which comment is being replied to

    // Function to delete a comment
    const deleteComment = (id) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        fetch(`/api/comment/${id}/delete/`, { method: 'POST' })
            .then(res => {
                if (res.ok) {
                    onCommentDeleted();  // Trigger parent to refresh comments
                    if (replyingToId === id) setReplyingToId(null);  // Clear reply state if needed
                } else {
                    alert('Failed to delete comment');
                }
            });
    };

    // Recursive function to render comments and their replies
    const renderComments = (list, level = 0) => list.map(comment => (
        <div
            key={comment.id}
            style={{
                marginLeft: level * 20,  // Indent replies
                borderBottom: '1px solid #eee',
                padding: '8px 0',
            }}
        >
            {/* Comment content and timestamp */}
            <p style={{ fontWeight: 'bold' }}>{comment.content}</p>
            <small>{new Date(comment.created_at).toLocaleString()}</small><br />

            {/* Reply button */}
            <button
                onClick={() =>
                    setReplyingToId(replyingToId === comment.id ? null : comment.id)
                }
                style={{ marginRight: 8 }}
            >
                {replyingToId === comment.id ? 'Cancel Reply' : 'Reply'}
            </button>

            {/* Delete button */}
            <button onClick={() => deleteComment(comment.id)}>Delete</button>

            {/* Show reply form when user is replying to this comment */}
            {replyingToId === comment.id && (
                <div style={{ marginTop: 8 }}>
                    <CommentForm
                        targetType={targetType}
                        targetId={targetId}
                        parentId={comment.id}
                        onCommentAdded={() => {
                            setReplyingToId(null);      // Close reply form
                            onCommentDeleted();         // Refresh comment list
                        }}
                    />
                </div>
            )}

            {/* Render nested replies if they exist */}
            {comment.replies && comment.replies.length > 0 &&
                renderComments(comment.replies, level + 1)}
        </div>
    ));

    // Display fallback if there are no comments
    if (!comments || comments.length === 0) return <p>No comments yet.</p>;

    return <div>{renderComments(comments)}</div>;
}
