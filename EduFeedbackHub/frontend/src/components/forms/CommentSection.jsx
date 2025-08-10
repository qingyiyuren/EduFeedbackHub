/**
 * This component allows users to view all comments for an entity and submit new comments.
 * Comments are refreshed automatically after addition or deletion.
 */
import React, {useState, useEffect} from 'react'; // Import React and hooks
import CommentList from './CommentList.jsx';
import CommentForm from './CommentForm.jsx';
import FollowButton from './FollowButton.jsx';
import { getApiUrlWithPrefix } from '../../config/api.js'; // Import API configuration

export default function CommentSection({targetType, targetId, targetIdName, showFollowButton = true}) {
    // State to hold the list of comments
    const [comments, setComments] = useState([]);
    // State to indicate if comments are loading
    const [loading, setLoading] = useState(true);
    // State to trigger refresh when a comment is added or deleted
    const [refreshFlag, setRefreshFlag] = useState(false);

    // Fetch comments for the target entity
    useEffect(() => {
        if (!targetId) return;

        let url;
        if (targetType === 'university') url = getApiUrlWithPrefix(`university/${targetId}/`);
        else if (targetType === 'college') url = getApiUrlWithPrefix(`college/${targetId}/`);
        else if (targetType === 'school') url = getApiUrlWithPrefix(`school/${targetId}/`);
        else if (targetType === 'module') url = getApiUrlWithPrefix(`module/${targetId}/`);
        else if (targetType === 'teaching') url = getApiUrlWithPrefix(`teaching/${targetId}/`);
        else return;

        setLoading(true); // Set loading state
        fetch(url)
            .then(res => res.json())
            .then(data => {
                setComments(data.comments || []); // Set comments from response
                setLoading(false); // Done loading
            })
            .catch(() => setLoading(false)); // On error, stop loading
    }, [targetType, targetId, refreshFlag]);

    // Handler: Called when a comment is added or deleted to trigger refresh
    const handleCommentChanged = () => {
        setRefreshFlag(flag => !flag); // Toggle flag to re-fetch comments
    };

    // Show loading indicator while fetching comments
    if (loading) return <p>Loading comments...</p>;

    // Render the comment section: list and form
    return (
        <div>
            <h3>Comments</h3>
            
            {/* Follow Button placed under Comments title */}
            {showFollowButton && (
                <FollowButton
                    entityType={targetType}
                    entityId={parseInt(targetId, 10)}
                />
            )}
            
            <CommentList
                comments={comments} // Pass comments to list
                targetType={targetType}
                targetId={targetId}
                targetIdName={targetIdName}
                onCommentDeleted={handleCommentChanged} // Refresh on delete
                onCommentAdded={handleCommentChanged}   // Refresh on add (for nested replies)
            />
            <h3>Leave a Comment</h3>
            <CommentForm
                targetType={targetType}
                targetId={targetId}
                targetIdName={targetIdName}
                onCommentAdded={handleCommentChanged} // Refresh on add
            />
        </div>
    );
} 