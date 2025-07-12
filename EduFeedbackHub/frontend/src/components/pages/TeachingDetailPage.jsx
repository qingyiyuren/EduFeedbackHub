/**
 * This component displays the details of a teaching record (lecturer teaching a module in a specific year),
 * including the lecturer, module, and year information.
 * Users can view existing comments and submit new ones for this specific teaching instance.
 */

import React, {useEffect, useState} from 'react';
import {useParams, Link, useLocation} from 'react-router-dom';
import CommentList from '../forms/CommentList.jsx';
import CommentForm from '../forms/CommentForm.jsx';

// Custom hook to parse URL query parameters
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function TeachingDetailPage() {
    const params = useParams(); // Get route parameters from URL (e.g., teaching_id)
    const query = useQuery(); // Parse query parameters (not currently used)
    const teachingId = params.teaching_id; // Extract teaching record ID

    // State variables:
    // teachingData: holds the fetched teaching record data
    // comments: holds the list of comments related to this teaching record
    // loading: tracks whether data is currently being loaded
    // refreshComments: a toggle state to trigger comments refresh
    const [teachingData, setTeachingData] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshComments, setRefreshComments] = useState(false);

    // Effect hook to fetch teaching record details and comments when
    // component mounts or when teachingId or refreshComments changes.
    useEffect(() => {
        if (!teachingId) return; // If no teachingId, skip fetching
        setLoading(true); // Set loading state before fetch

        fetch(`/api/teaching/${teachingId}/`) // Fetch teaching data from backend API
            .then(res => res.json())
            .then(data => {
                setTeachingData(data.teaching); // Update teaching data state
                setComments(data.comments || []); // Update comments list state
                setLoading(false); // Data loaded, set loading false
            })
            .catch(() => setLoading(false)); // On error, stop loading but don't crash
    }, [teachingId, refreshComments]);

    // Callback to refresh comments list after adding or deleting a comment
    const handleCommentAdded = () => {
        setRefreshComments(prev => !prev); // Toggle refreshComments to trigger useEffect
    };

    // Render loading indicator if data is being fetched
    if (loading) return <p>Loading teaching record details...</p>;

    // Render error message if no teaching data found
    if (!teachingData) return <p>Teaching record not found.</p>;

    return (
        <div>
            {/* Teaching record information section */}
            <h2>Teaching Record</h2>

            <div style={{marginBottom: '1rem'}}>
                {/* Display lecturer name */}
                <p><strong>Lecturer:</strong> {teachingData.lecturer}</p>
                {/* Display module name */}
                <p><strong>Module:</strong> {teachingData.module}</p>
                {/* Display year taught */}
                <p><strong>Year:</strong> {teachingData.year}</p>

                {/* Display hierarchical information if available */}
                {teachingData.module_info && (
                    <>
                        {/* University name if available */}
                        {teachingData.module_info.school && teachingData.module_info.school.college && teachingData.module_info.school.college.university && (
                            <p><strong>University:</strong> {teachingData.module_info.school.college.university.name}
                            </p>
                        )}
                        {/* College name if available */}
                        {teachingData.module_info.school && teachingData.module_info.school.college && (
                            <p><strong>College:</strong> {teachingData.module_info.school.college.name}</p>
                        )}
                        {/* School name if available */}
                        {teachingData.module_info.school && (
                            <p><strong>School:</strong> {teachingData.module_info.school.name}</p>
                        )}
                    </>
                )}
            </div>

            {/* Navigation links */}
            <p>
                {/* Link back to the module detail page */}
                <Link to={`/module/${teachingData.module_id}`}>
                    Back to Module
                </Link>
            </p>

            <p>
                {/* Link back to homepage */}
                <Link to="/">Back to Home</Link>
            </p>

            {/* Comments display section */}
            <h3>Comments</h3>
            <CommentList
                comments={comments} // Comments data passed down
                targetType="teaching" // Target type for comments context
                targetId={parseInt(teachingId, 10)} // Target ID to associate comments
                onCommentDeleted={handleCommentAdded} // Refresh comments after deletion
                onCommentAdded={handleCommentAdded} // Refresh comments after addition
            />

            {/* Comment submission form */}
            <h3>Leave a Comment</h3>
            <CommentForm
                targetType="teaching" // Context for comment form
                targetId={parseInt(teachingId, 10)} // ID of the teaching record to comment on
                onCommentAdded={handleCommentAdded} // Trigger refresh after comment added
            />
        </div>
    );
}
