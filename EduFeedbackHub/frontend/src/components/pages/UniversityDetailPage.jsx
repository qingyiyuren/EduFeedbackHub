// This component displays detailed information about a university, including its name, region, and a list of related comments.
// It fetches university data based on the URL parameter and supports returning to the rankings page via query parameters.

import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import CommentList from '../forms/CommentList.jsx';  // Component to display comments list
import CommentForm from '../forms/CommentForm.jsx';  // Component for submitting new comments

// Custom hook to parse URL query parameters
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function UniversityDetailPage() {
    const { university_id } = useParams();  // Get university ID from the URL path
    const query = useQuery();               // Get query parameters
    const navigate = useNavigate();         // Router navigation object (unused here)

    const fromYear = query.get('fromYear');  // Retrieve 'fromYear' query param for back navigation

    // Component state
    const [university, setUniversity] = useState(null);  // University details
    const [comments, setComments] = useState([]);        // List of comments for the university
    const [loading, setLoading] = useState(true);        // Loading state flag
    const [refreshComments, setRefreshComments] = useState(false);  // Toggle to trigger comments refresh

    // Fetch university details and comments whenever university_id or refreshComments changes
    useEffect(() => {
        setLoading(true);
        fetch(`/api/university/${university_id}/`)  // Request backend for university data
            .then(res => res.json())
            .then(data => {
                setUniversity(data.university);    // Update university info
                setComments(data.comments);        // Update comments list
                setLoading(false);                 // Turn off loading indicator
            })
            .catch(() => setLoading(false));      // On error, stop loading indicator
    }, [university_id, refreshComments]);

    // Handler to toggle refreshComments state, triggering data reload
    function handleCommentAdded() {
        setRefreshComments(prev => !prev);
    }

    if (loading) return <p>Loading university details...</p>;   // Show loading message while fetching data
    if (!university) return <p>University not found.</p>;       // Show message if university does not exist

    return (
        <div>
            <h2>{university.name} ({university.region})</h2>

            {/* If 'fromYear' query param exists, show link back to that year's rankings */}
            {fromYear && (
                <p>
                    <Link to={`/rankings/${fromYear}`}>
                        Back to {fromYear} Rankings
                    </Link>
                </p>
            )}
            {/* Link to rankings year list page */}
            <p>
                <Link to="/years">
                    Back to QS Rankings Years
                </Link>
            </p>

            {/* Comments section */}
            <h3>Comments</h3>
            <CommentList
                comments={comments}
                universityId={university_id}
                onCommentDeleted={handleCommentAdded}  // Refresh data on comment deletion
                onCommentAdded={handleCommentAdded}    // Refresh data on comment addition
            />

            {/* Comment submission form */}
            <h3>Leave a Comment</h3>
            <CommentForm
                universityId={university_id}
                onCommentAdded={handleCommentAdded}    // Refresh data when new comment added
            />
        </div>
    );
}
