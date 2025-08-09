/**
 * This component allows users to view all comments for an entity and submit new comments.
 * Comments are refreshed automatically after addition or deletion.
 */
import React, {useState, useEffect} from 'react'; // Import React and hooks
import CommentList from './CommentList.jsx';
import CommentForm from './CommentForm.jsx';
import FollowButton from './FollowButton.jsx';

export default function CommentSection({targetType, targetId, targetIdName, showFollowButton = true}) {
    // State to hold the list of comments
    const [comments, setComments] = useState([]);
    // State to indicate if comments are loading
    const [loading, setLoading] = useState(true);
    // State to trigger refresh when a comment is added or deleted
    const [refreshFlag, setRefreshFlag] = useState(false);

    // Effect: Fetch comments from the backend API when target changes or refresh is triggered
    useEffect(() => {
        if (!targetType || !targetId) return; // Do nothing if required props are missing
        setLoading(true); // Set loading state
        let url = '';
        // Determine API endpoint based on entity type
        if (targetType === 'university') url = `/api/university/${targetId}/`;
        else if (targetType === 'college') url = `/api/college/${targetId}/`;
        else if (targetType === 'school') url = `/api/school/${targetId}/`;
        else if (targetType === 'module') url = `/api/module/${targetId}/`;
        else if (targetType === 'teaching') url = `/api/teaching/${targetId}/`;
        else return; // Unknown type, do nothing
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