import React, { useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import CommentList from '../forms/CommentList.jsx';
import CommentForm from '../forms/CommentForm.jsx';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function CollegeDetailPage() {
    const params = useParams();
    const query = useQuery();
    const navigate = useNavigate();

    const entityType = 'college';
    const entityDisplayName = 'College';

    const entityId = params['college_id'];
    const fromYear = query.get('fromYear');

    const [entityData, setEntityData] = useState(null);
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshComments, setRefreshComments] = useState(false);

    useEffect(() => {
        if (!entityId) return;
        setLoading(true);
        fetch(`/api/${entityType}/${entityId}/`)
            .then(res => res.json())
            .then(data => {
                setEntityData(data[entityType]);
                setComments(data.comments || []);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [entityId, refreshComments]);

    const handleCommentAdded = () => {
        setRefreshComments(prev => !prev);
    };

    if (loading) return <p>Loading {entityDisplayName} details...</p>;
    if (!entityData) return <p>{entityDisplayName} not found.</p>;

    return (
        <div>
            {entityData.university && (
                <h3 style={{ marginBottom: '0.5rem' }}>
                    {entityData.university.name}
                    {entityData.university.region ? ` (${entityData.university.region})` : ''}
                </h3>
            )}
            <h2>{entityData.name}</h2>

            {fromYear && (
                <p>
                    <Link to={`/rankings/${fromYear}`}>Back to {fromYear} Rankings</Link>
                </p>
            )}

            {entityData.university && (
                <p>
                    <Link to={`/university/${entityData.university.id}`}>Back to University</Link>
                </p>
            )}

            <button
                onClick={() =>
                    navigate(`/college/search?universityName=${encodeURIComponent(entityData.university?.name || '')}`)
                }
                style={{ marginTop: '1rem' }}
            >
                Search or Add College for Feedback
            </button>

            <h3>Comments</h3>
            <CommentList
                comments={comments}
                targetType={entityType}
                targetId={parseInt(entityId, 10)}
                onCommentDeleted={handleCommentAdded}
                onCommentAdded={handleCommentAdded}
            />

            <h3>Leave a Comment</h3>
            <CommentForm
                targetType={entityType}
                targetId={parseInt(entityId, 10)}
                onCommentAdded={handleCommentAdded}
            />
        </div>
    );
}
