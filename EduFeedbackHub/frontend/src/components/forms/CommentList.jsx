/**
 * This component allows users to view, reply to, and delete comments for an entity.
 * Nested replies are supported for threaded discussions.
 */
import React, { useState } from 'react'; // Import React and useState hook
import CommentForm from './CommentForm.jsx';

export default function CommentList({
    comments,         // Array of comment objects
    targetType,       // e.g. "university"
    targetId,         // e.g. 3 (university ID)
    targetIdName,     // e.g. "university_id"
    onCommentDeleted, // Function to refresh comments after deletion/addition
    onCommentAdded,   // Function to refresh comments after adding a reply
}) {
    // State to track which comment is being replied to
    const [replyingToId, setReplyingToId] = useState(null);
    // State to track which comment should show login tip
    const [loginTipForReplyId, setLoginTipForReplyId] = useState(null);

    // Get current logged-in user info
    const currentUserId = localStorage.getItem('user_id');
    const token = localStorage.getItem('token');

    // Handle Reply button click
    const handleReplyClick = (commentId) => {
        if (!token) {
            setLoginTipForReplyId(commentId); // Show login tip if not logged in
            return;
        }
        setLoginTipForReplyId(null); // Hide login tip
        setReplyingToId(replyingToId === commentId ? null : commentId); // Toggle reply form
    };

    // Function to delete a comment
    const deleteComment = (id) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;

        const token = localStorage.getItem('token');
        fetch(`/api/comment/${id}/delete/`, {
            method: 'POST',
            headers: token ? { 'Authorization': `Token ${token}` } : {},
        })
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
                marginLeft: level === 0 ? 0 : 28,  // More indent for replies
                background: '#fff', // Always white background
                borderRadius: level > 0 ? 10 : 0,
                boxShadow: level > 0 ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                borderBottom: '1px solid #eee',
                padding: level > 0 ? '8px 12px 8px 16px' : '12px 0 12px 0',
                marginTop: level === 0 ? 18 : 8,
                marginBottom: level === 0 ? 18 : 8,
            }}
        >
            {/* Comment content and timestamp */}
            <p style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {comment.content}
                {comment.is_anonymous
                    ? <span style={{ marginLeft: 8, color: '#888' }}>— Anonymous User</span>
                    : comment.username && (
                        <span style={{ marginLeft: 8, color: '#1976d2', fontWeight: 500 }}>
                            — {comment.username}
                            {comment.role && (
                                <span style={{
                                    display: 'inline-block',
                                    background: comment.role === 'lecturer' ? '#ede7f6' : '#eaf7ff',
                                    color: comment.role === 'lecturer' ? '#6c3fc5' : '#1976d2',
                                    borderRadius: 4,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    padding: '2px 7px',
                                    marginLeft: 6,
                                }}>
                                    {comment.role.charAt(0).toUpperCase() + comment.role.slice(1)}
                                </span>
                            )}
                        </span>
                    )}
            </p>
            {/* Comment meta info */}
            <div style={{ fontSize: 13, color: '#888', marginBottom: 4 }}>
                {/* Format timestamp to local time string for user-friendly display */}
                {comment.created_at && new Date(comment.created_at).toLocaleString()}
                <span style={{ marginLeft: 12, color: '#1976d2', cursor: 'pointer' }} onClick={() => handleReplyClick(comment.id)}>
                    Reply
                </span>
                {comment.user === Number(currentUserId) && (
                    <span style={{ marginLeft: 12, color: '#d32f2f', cursor: 'pointer' }} onClick={() => deleteComment(comment.id)}>
                        Delete
                    </span>
                )}
            </div>
            {/* Show login tip if not logged in and trying to reply */}
            {loginTipForReplyId === comment.id && (
                <div style={{ color: '#d32f2f', margin: '8px 0' }}>Please log in to reply</div>
            )}
            {/* Show reply form if replying to this comment */}
            {replyingToId === comment.id && (
                <CommentForm
                    targetType={targetType}
                    targetId={targetId}
                    targetIdName={targetIdName}
                    parentId={comment.id}
                    onCommentAdded={() => {
                        setReplyingToId(null); // Close reply form
                        onCommentAdded && onCommentAdded(); // Notify parent
                    }}
                />
            )}
            {/* Render nested replies recursively */}
            {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, level + 1)}
        </div>
    ));

    // Render the comment list
    return (
        <div>
            {comments && comments.length > 0 ? renderComments(comments) : <p>No comments yet.</p>}
        </div>
    );
}
