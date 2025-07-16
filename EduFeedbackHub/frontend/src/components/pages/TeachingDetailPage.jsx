/**
 * This component allows users to view details, comments, and ratings for a teaching record.
 * Rating trends and threaded comments are supported.
 */

import React, {useEffect, useState} from 'react'; // Import React and hooks
import {useParams, Link, useLocation} from 'react-router-dom'; // Import router hooks and components
import CommentSection from '../forms/CommentSection.jsx';
import RatingComponent from '../forms/RatingComponent.jsx';
import TeacherRatingTrendChart from '../forms/TeacherRatingTrendChart.jsx';

// Custom hook to extract query parameters from the URL
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function TeachingDetailPage() {
    const params = useParams(); // Extract dynamic route parameters (e.g. teaching_id)
    const query = useQuery();   // Get query parameters (currently unused)
    const teachingId = params.teaching_id; // Extract the teaching record ID from URL

    // State for storing teaching record, comments, rating, and loading status
    const [teachingData, setTeachingData] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshComments, setRefreshComments] = useState(false); // Toggle to refresh comments
    const [ratingData, setRatingData] = useState({average: 0, count: 0}); // Average rating info
    const [showTrend, setShowTrend] = useState(false); // Whether to show rating trend chart

    // Fetch teaching record and comments when component mounts or refresh is triggered
    useEffect(() => {
        if (!teachingId) return;
        setLoading(true);

        fetch(`/api/teaching/${teachingId}/`)
            .then(res => res.json())
            .then(data => {
                setTeachingData(data.teaching);              // Set main teaching data
                setComments(data.comments || []);            // Set comments list
                setRatingData(data.rating || {average: 0, count: 0}); // Set rating stats
                setLoading(false);
            })
            .catch(() => setLoading(false)); // Handle error silently
    }, [teachingId, refreshComments]);

    // Callback to update rating data after user rates
    const handleRatingChange = (newAverage, newCount) => {
        setRatingData({average: newAverage, count: newCount});
    };

    const userRole = localStorage.getItem('role'); // Get current user role

    // Refresh comment section when a new comment is added or deleted
    const handleCommentAdded = () => {
        setRefreshComments(prev => !prev); // Trigger re-fetch
    };

    // If data is still loading, show a loading message
    if (loading) return <p>Loading teaching record details...</p>;

    // If no data is available, show not found message
    if (!teachingData) return <p>Teaching record not found.</p>;

    return (
        <div>
            {/* Main heading */}
            <h2>Teaching Record</h2>

            <div style={{marginBottom: '1rem'}}>
                {/* Display lecturer name */}
                <p><strong>Lecturer:</strong> {teachingData.lecturer}</p>

                {/* Toggle button to show/hide rating trend chart */}
                {teachingData.lecturer_id && (
                    <button onClick={() => setShowTrend(v => !v)} style={{marginBottom: '0.5rem'}}>
                        {showTrend ? 'Hide Rating Trend' : 'View Rating Trend'}
                    </button>
                )}

                {/* Conditional rendering of rating trend chart */}
                {showTrend && teachingData.lecturer_id && (
                    <TeacherRatingTrendChart
                        lecturerId={teachingData.lecturer_id}
                        schoolId={teachingData.module_info?.school?.id}
                    />
                )}

                {/* Display module name */}
                <p><strong>Module:</strong> {teachingData.module}</p>

                {/* Display year */}
                <p><strong>Year:</strong> {teachingData.year}</p>

                {/* Display hierarchical institution info if available */}
                {teachingData.module_info && (
                    <>
                        {teachingData.module_info.school?.college?.university && (
                            <p><strong>University:</strong> {teachingData.module_info.school.college.university.name}
                            </p>
                        )}
                        {teachingData.module_info.school?.college && (
                            <p><strong>College:</strong> {teachingData.module_info.school.college.name}</p>
                        )}
                        {teachingData.module_info.school && (
                            <p><strong>School:</strong> {teachingData.module_info.school.name}</p>
                        )}
                    </>
                )}
            </div>

            {/* Rating section for students */}
            <RatingComponent
                targetType="teaching"
                targetId={parseInt(teachingId, 10)}
                average={ratingData.average}
                count={ratingData.count}
                userRole={userRole}
                onRatingChange={handleRatingChange}
            />

            {/* Navigation links */}
            <p>
                <Link to={`/module/${teachingData.module_id}`}>Back to Module</Link>
            </p>
            <p><Link to="/">Back to Home</Link></p>

            {/* Comment section for teaching record */}
            <CommentSection
                targetType="teaching"
                targetId={parseInt(teachingId, 10)}
                targetIdName="teaching_id"
            />
        </div>
    );
}

