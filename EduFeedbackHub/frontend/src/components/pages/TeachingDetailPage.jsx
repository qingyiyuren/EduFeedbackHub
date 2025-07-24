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
    // State to ensure visit is only recorded once per page load
    const [visitRecorded, setVisitRecorded] = useState(false);

    // State for AI sentiment analysis results and loading
    const [sentimentResult, setSentimentResult] = useState(null);
    const [sentimentLoading, setSentimentLoading] = useState(false);
    const [sentimentError, setSentimentError] = useState(null);

    // Handler to fetch sentiment analysis for the current teaching record
    const handleAnalyzeSentiment = async () => {
        if (!teachingId) return;
        setSentimentLoading(true);
        setSentimentError(null);
        setSentimentResult(null);
        try {
            const res = await fetch(`/api/teaching/${teachingId}/sentiment/`);
            if (!res.ok) throw new Error('Failed to fetch sentiment analysis');
            const data = await res.json();
            setSentimentResult(data);
        } catch (err) {
            setSentimentError('Failed to analyze comments.');
        } finally {
            setSentimentLoading(false);
        }
    };

    // Fetch teaching record and comments when component mounts or teachingId changes
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
                setVisitRecorded(false); // Reset visitRecorded when teachingId changes
            })
            .catch(() => setLoading(false)); // Handle error silently
    }, [teachingId]);

    // Record visit history only once per teaching page load
    useEffect(() => {
        const fromVisit = query.get('fromVisit'); // Check if navigation is from recent visit
        if (!teachingId || visitRecorded) return;
        if (fromVisit === '1') return; // Do not record if from recent visit
        const token = localStorage.getItem('token');
        if (token && teachingData && teachingData.lecturer && teachingData.module && teachingData.year) {
            // Compose a readable name for the teaching record
            const entityName = `${teachingData.lecturer} - ${teachingData.module} (${teachingData.year})`;
            fetch('/api/visit-history/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}` // Add token for authentication
                },
                body: JSON.stringify({
                    entityType: 'teaching',
                    entityId: teachingData.id,
                    entityName: entityName
                })
            });
            setVisitRecorded(true); // Mark as recorded to prevent duplicate
        }
    }, [teachingId, teachingData, visitRecorded, query]);

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
                    <button onClick={() => setShowTrend(v => !v)} style={{marginBottom: '0.5rem', marginRight: 8}}>
                        {showTrend ? 'Hide Rating Trend' : 'View Rating Trend'}
                    </button>
                )}
                {/* AI Analyze Comments Button */}
                <button
                    onClick={handleAnalyzeSentiment}
                    style={{
                        backgroundColor: '#6c63ff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        padding: '8px 12px',
                        cursor: 'pointer',
                        marginLeft: 8
                    }}
                >
                    AI Analyze Comments
                </button>
                {/* Sentiment Analysis Result */}
                {sentimentLoading && <div style={{marginTop: 12}}>Analyzing comments...</div>}
                {sentimentError && <div style={{marginTop: 12, color: 'red'}}>{sentimentError}</div>}
                {sentimentResult && (
                    <div style={{marginTop: 12, background: '#f4f6fa', borderRadius: 6, padding: 12}}>
                        <h4 style={{margin: 0, marginBottom: 6}}>AI Sentiment Analysis</h4>
                        <div style={{fontSize: 14, marginBottom: 6}}>
                            <strong>Comments analyzed:</strong> {sentimentResult.comment_count}<br/>
                            <strong>Average Sentiment:</strong>
                            <span style={{marginLeft: 8}}>
                                Positive: {sentimentResult.average_sentiment.pos.toFixed(2)} | Neutral: {sentimentResult.average_sentiment.neu.toFixed(2)} | Negative: {sentimentResult.average_sentiment.neg.toFixed(2)} | Compound: {sentimentResult.average_sentiment.compound.toFixed(2)}
                            </span>
                        </div>
                        {/* Optionally show per-comment sentiment breakdown */}
                        <details style={{fontSize: 13, marginTop: 6}}>

                            <summary>Show per-comment sentiment</summary>
                            <ul style={{margin: 0, paddingLeft: 18}}>
                                {sentimentResult.comments.map(c => (
                                    <li key={c.id} style={{marginBottom: 4}}>
                                        <span
                                            style={{color: c.sentiment.compound > 0.2 ? '#28a745' : c.sentiment.compound < -0.2 ? '#dc3545' : '#888'}}>
                                            {c.sentiment.compound > 0.2 ? '😊' : c.sentiment.compound < -0.2 ? '😞' : '😐'}
                                        </span>
                                        <span style={{marginLeft: 6}}>{c.content}</span>
                                        <span style={{marginLeft: 8, color: '#888'}}>
                                            (pos: {c.sentiment.pos.toFixed(2)}, neu: {c.sentiment.neu.toFixed(2)}, neg: {c.sentiment.neg.toFixed(2)}, comp: {c.sentiment.compound.toFixed(2)})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </details>
                    </div>
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

