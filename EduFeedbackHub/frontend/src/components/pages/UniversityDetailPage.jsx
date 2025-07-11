/**
 * This component displays the details of a university, including its name, region, and related comments.
 * Users can view existing comments and submit new ones.
 * A button is also provided to search for or add colleges under the university for feedback purposes.
 */


import React, { useEffect, useState } from 'react';  // Import React and React Hooks (useEffect, useState)
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';  // Import routing hooks
import CommentList from '../forms/CommentList.jsx';  // Import the comment list component
import CommentForm from '../forms/CommentForm.jsx';  // Import the comment form component

// Custom hook to parse URL query parameters
function useQuery() {
    return new URLSearchParams(useLocation().search);  // Returns the query parameters of the current URL
}

export default function UniversityDetailPage() {
    const params = useParams();  // Get URL parameters
    const query = useQuery();  // Use the custom hook to parse query parameters
    const navigate = useNavigate();  // Hook for programmatic navigation

    const entityType = 'university';  // The current entity type is "university"
    const entityDisplayName = 'University';  // Display name for the entity

    const entityId = params['university_id'];  // Get the university ID from the URL
    const fromYear = query.get('fromYear');  // Get the "fromYear" query parameter (e.g., ranking year)

    // State management
    const [entityData, setEntityData] = useState(null);  // Holds university basic info
    const [comments, setComments] = useState([]);  // Holds the list of comments
    const [loading, setLoading] = useState(true);  // Indicates if data is loading
    const [refreshComments, setRefreshComments] = useState(false);  // Toggle to trigger comment refresh

    // useEffect to fetch university details on component mount or refresh
    useEffect(() => {
        if (!entityId) return;  // If no university ID, do nothing
        setLoading(true);  // Set loading state to true
        fetch(`/api/${entityType}/${entityId}/`)  // Send request to backend API
            .then(res => res.json())  // Parse JSON response
            .then(data => {
                setEntityData(data[entityType]);  // Set university basic info
                setComments(data.comments || []);  // Set comments list (empty if none)
                setLoading(false);  // Stop loading
            })
            .catch(() => setLoading(false));  // On error, stop loading
    }, [entityId, refreshComments]);  // Re-run when entity ID or refresh flag changes

    // Called after a comment is added or deleted to refresh comments
    const handleCommentAdded = () => {
        setRefreshComments(prev => !prev);  // Toggle the refresh flag
    };

    // Show loading text while data is being fetched
    if (loading) return <p>Loading {entityDisplayName} details...</p>;

    // Show error message if university not found
    if (!entityData) return <p>{entityDisplayName} not found.</p>;

    return (
        <div>
            {/* Display university name and region (if any) */}
            <h2>
                {entityData.name} {entityData.region ? `(${entityData.region})` : ''}
            </h2>

            {/* Show link back to ranking page if fromYear is available */}
            {fromYear && (
                <p>
                    <Link to={`/rankings/${fromYear}`}>Back to {fromYear} Rankings</Link>
                </p>
            )}

            {/* Link back to homepage */}
            <p>
                <Link to="/">Back to Home</Link>
            </p>

            {/* Navigate to the college search/add page, passing university name and ID */}
            <button
                onClick={() =>
                    navigate(
                        `/college/search?universityName=${encodeURIComponent(entityData.name)}&universityId=${entityData.id}`
                    )
                }
                style={{ marginTop: '1rem' }}
            >
                Search or Add College for Feedback
            </button>

            {/* Comment list section */}
            <h3>Comments</h3>
            <CommentList
                comments={comments}
                targetType={entityType}  // Target type is "university"
                targetId={parseInt(entityId, 10)}  // Target ID is the university ID
                onCommentDeleted={handleCommentAdded}  // Refresh when a comment is deleted
                onCommentAdded={handleCommentAdded}  // Refresh when a comment is added
            />

            {/* Comment submission form */}
            <h3>Leave a Comment</h3>
            <CommentForm
                targetType={entityType}  // Target type is "university"
                targetId={parseInt(entityId, 10)}  // Target ID is the university ID
                onCommentAdded={handleCommentAdded}  // Refresh when a comment is added
            />
        </div>
    );
}
