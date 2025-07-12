/**
 * This component displays the details of an entity (university, college, school, module, etc.),
 * including its name, region, and related comments.
 * Users can view existing comments and submit new ones.
 * Navigation buttons are provided to search for or add sub-entities under the current entity for feedback purposes.
 */

import React, {useEffect, useState} from 'react';
import {useParams, Link, useLocation, useNavigate} from 'react-router-dom';
import CommentList from '../forms/CommentList.jsx';
import CommentForm from '../forms/CommentForm.jsx';

// Configuration for each entity type (used for routing, labels, hierarchy)
const entityConfig = {
    university: {
        displayName: 'University',
        paramName: 'university_id',
        subEntityType: 'college',
        subEntityDisplayName: 'College',
        subEntitySearchPath: '/college/search',
        parentEntityType: null,
    },
    college: {
        displayName: 'College',
        paramName: 'college_id',
        subEntityType: 'school',
        subEntityDisplayName: 'School',
        subEntitySearchPath: '/school/search',
        parentEntityType: 'university',
        parentEntityDisplayName: 'University',
    },
    school: {
        displayName: 'School',
        paramName: 'school_id',
        subEntityType: 'module',
        subEntityDisplayName: 'Module',
        subEntitySearchPath: '/module/search',
        parentEntityType: 'college',
        parentEntityDisplayName: 'College',
    },
    module: {
        displayName: 'Module',
        paramName: 'module_id',
        subEntityType: null,
        parentEntityType: 'school',
        parentEntityDisplayName: 'School',
    },
    lecturer: {
        displayName: 'Lecturer',
        paramName: 'lecturer_id',
        subEntityType: null,
        parentEntityType: null,
        parentEntityDisplayName: null,
    },
};

// Custom hook to parse query parameters
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function EntityDetailPage({entityType = 'university'}) {
    const params = useParams();                    // URL params for dynamic ID
    const query = useQuery();                      // Query string parser
    const navigate = useNavigate();                // Navigation hook

    const config = entityConfig[entityType] || entityConfig.university;
    const entityId = params[config.paramName];     // Extract entity ID from route
    const fromYear = query.get('fromYear');        // Extract optional ranking year

    // State for core data
    const [entityData, setEntityData] = useState(null);   // Current entity data
    const [comments, setComments] = useState([]);         // Comments for this entity
    const [loading, setLoading] = useState(true);         // Loading indicator
    const [refreshComments, setRefreshComments] = useState(false); // Trigger refresh

    // Module-specific state
    const [modules, setModules] = useState([]);           // Not currently used
    const [teachings, setTeachings] = useState([]);       // Teaching records
    const [showTeachingForm, setShowTeachingForm] = useState(false); // Toggle form
    const [selectedYear, setSelectedYear] = useState(''); // Selected year in dropdown
    const [years, setYears] = useState([]);               // Available year options
    const [newLecturerName, setNewLecturerName] = useState(''); // New lecturer name

    // Fetch entity details and comments
    useEffect(() => {
        if (!entityId) return;
        setLoading(true);
        fetch(`/api/${entityType}/${entityId}/`)
            .then(res => res.json())
            .then(data => {
                setEntityData(data[entityType]);                  // Set core entity info
                setComments(data.comments || []);                 // Set comments list
                if (entityType === 'module') setTeachings(data.teachings || []); // Set teaching records
                setLoading(false);
            })
            .catch(() => setLoading(false));                      // Handle errors silently
    }, [entityId, refreshComments, entityType]);

    // Populate year dropdown (only when form is shown)
    useEffect(() => {
        if (showTeachingForm && entityType === 'module') {
            const currentYear = new Date().getFullYear();
            const yearsList = [];
            for (let i = 2010; i <= currentYear; i++) {
                yearsList.push(i.toString());
            }
            setYears(yearsList);
        }
    }, [showTeachingForm, entityType]);

    // Triggered after comment submission/deletion
    const handleCommentAdded = () => {
        setRefreshComments(prev => !prev); // Toggle state to refresh data
    };

    // Submit teaching record (module + lecturer + year)
    const handleAddTeaching = async () => {
        if (!selectedYear) return alert('Please select year');
        if (!newLecturerName.trim()) return alert('Please enter lecturer name');

        try {
            let lecturerId;

            // Try adding new lecturer
            const lecturerResponse = await fetch('/api/lecturer/add/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name: newLecturerName.trim()}),
            });

            const lecturerData = await lecturerResponse.json();

            if (lecturerResponse.ok) {
                lecturerId = lecturerData.id; // New lecturer created
            } else if (lecturerResponse.status === 409 && lecturerData.existing_lecturer) {
                lecturerId = lecturerData.existing_lecturer.id; // Use existing lecturer
            } else {
                return alert(lecturerData.error || 'Failed to add lecturer');
            }

            // Submit teaching record
            const response = await fetch('/api/teaching/add/', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    lecturer_id: lecturerId,
                    module_id: entityId,
                    year: selectedYear,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Reset form and reload
                setShowTeachingForm(false);
                setSelectedYear('');
                setNewLecturerName('');
                fetch(`/api/module/${entityId}/`)
                    .then(res => res.json())
                    .then(data => setTeachings(data.teachings || []));
            } else {
                alert(data.error || 'Failed to add teaching record');
            }
        } catch (error) {
            alert('Failed to add teaching record');
        }
    };

    // Loading / error fallback
    if (loading) return <p>Loading {config.displayName} details...</p>;
    if (!entityData) return <p>{config.displayName} not found. Please check the URL or try searching again.</p>;

    const parentEntity = config.parentEntityType && entityData[config.parentEntityType]; // Extract parent if any

    return (
        <div>
            {/* Render full hierarchy for school */}
            {entityType === 'school' && entityData.college?.university && (
                <div style={{marginBottom: '1rem'}}>
                    <h3>{entityData.college.university.name} {entityData.college.university.region && `(${entityData.college.university.region})`}</h3>
                    <h3>{entityData.college.name}</h3>
                    <h2>{entityData.name}</h2>
                </div>
            )}

            {/* College under university */}
            {entityType === 'college' && parentEntity && (
                <div style={{marginBottom: '1rem'}}>
                    <h3>{parentEntity.name} {parentEntity.region && `(${parentEntity.region})`}</h3>
                    <h2>{entityData.name}</h2>
                </div>
            )}

            {/* University only */}
            {entityType === 'university' && (
                <h2>{entityData.name} {entityData.region && `(${entityData.region})`}</h2>
            )}

            {/* Module full hierarchy */}
            {entityType === 'module' && entityData.school?.college?.university && (
                <div style={{marginBottom: '1rem'}}>
                    <h3>{entityData.school.college.university.name} {entityData.school.college.university.region && `(${entityData.school.college.university.region})`}</h3>
                    <h3>{entityData.school.college.name}</h3>
                    <h3>{entityData.school.name}</h3>
                    <h2>{entityData.name}</h2>
                </div>
            )}
            {/* Module with partial hierarchy */}
            {entityType === 'module' && entityData.school && (!entityData.school.college || !entityData.school.college.university) && (
                <div><h3>{entityData.school.name}</h3><h2>{entityData.name}</h2></div>
            )}
            {entityType === 'module' && !entityData.school && <h2>{entityData.name}</h2>}

            {/* Return to ranking page if came from one */}
            {fromYear && <p><Link to={`/rankings/${fromYear}`}>Back to {fromYear} Rankings</Link></p>}

            {/* Back links to parent entities */}
            {entityType === 'school' && entityData.college && (
                <p><Link to={`/college/${entityData.college.id}`}>Back to {entityData.college.name}</Link></p>
            )}
            {entityType === 'college' && parentEntity && (
                <p><Link to={`/university/${parentEntity.id}`}>Back to {parentEntity.name}</Link></p>
            )}
            {entityType === 'module' && entityData.school && (
                <p><Link to={`/school/${entityData.school.id}`}>Back to {entityData.school.name}</Link></p>
            )}

            <p><Link to="/">Back to Home</Link></p>

            {/* Button to search/add sub-entity under current */}
            {config.subEntityType && (
                <button
                    onClick={() => {
                        const searchParams = new URLSearchParams();
                        searchParams.set(`${entityType}Name`, encodeURIComponent(entityData.name));
                        searchParams.set(`${entityType}Id`, entityData.id);
                        if (parentEntity) {
                            searchParams.set(`${config.parentEntityType}Name`, encodeURIComponent(parentEntity.name));
                            searchParams.set(`${config.parentEntityType}Id`, parentEntity.id);
                        }
                        navigate(`${config.subEntitySearchPath}?${searchParams.toString()}`);
                    }}
                    style={{marginTop: '1rem'}}
                >
                    Search or Add {config.subEntityDisplayName} for Feedback
                </button>
            )}

            {/* Quick search button for any level */}
            <div style={{marginTop: '1rem'}}>
                <button
                    onClick={() => {
                        const searchParams = new URLSearchParams();
                        if (entityType === 'university') {
                            searchParams.set('universityName', encodeURIComponent(entityData.name));
                            searchParams.set('universityId', entityData.id);
                        } else if (entityType === 'college') {
                            searchParams.set('collegeName', encodeURIComponent(entityData.name));
                            searchParams.set('collegeId', entityData.id);
                            if (parentEntity) {
                                searchParams.set('universityName', encodeURIComponent(parentEntity.name));
                                searchParams.set('universityId', parentEntity.id);
                            }
                        } else if (entityType === 'school') {
                            searchParams.set('schoolName', encodeURIComponent(entityData.name));
                            searchParams.set('schoolId', entityData.id);
                            if (parentEntity) {
                                searchParams.set('collegeName', encodeURIComponent(parentEntity.name));
                                searchParams.set('collegeId', parentEntity.id);
                            }
                        }
                        navigate(`/search?${searchParams.toString()}`);
                    }}
                >
                    🔍 Quick Search
                </button>
            </div>

            {/* Show module teaching records and form */}
            {entityType === 'module' && (
                <div style={{marginTop: '1rem'}}>
                    <h3>Teaching Records</h3>
                    {teachings.length > 0 ? (
                        <ul>
                            {teachings.map(teaching => (
                                <li key={teaching.id}>
                                    <Link to={`/teaching/${teaching.id}`}>
                                        <strong>{teaching.lecturer}</strong> <span
                                        style={{color: '#666'}}>({teaching.year})</span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No teaching records found for this module.</p>
                    )}
                    <button onClick={() => setShowTeachingForm(!showTeachingForm)} style={{marginTop: '1rem'}}>
                        {showTeachingForm ? 'Cancel' : 'Add Teaching Record'}
                    </button>

                    {/* Teaching submission form */}
                    {showTeachingForm && (
                        <div style={{marginTop: '1rem', padding: '1rem', border: '1px solid #ccc'}}>
                            <h4>Add Teaching Record</h4>
                            <div>
                                <label>Lecturer: </label>
                                <input
                                    type="text"
                                    placeholder="Lecturer Name"
                                    value={newLecturerName}
                                    onChange={(e) => setNewLecturerName(e.target.value)}
                                    style={{width: '100%', padding: '4px'}}
                                />
                            </div>
                            <div style={{marginTop: '1rem'}}>
                                <label>Year: </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    style={{width: '100%', padding: '4px'}}
                                >
                                    <option value="">Select Year</option>
                                    {years.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <button onClick={handleAddTeaching} style={{marginTop: '1rem'}}>
                                Add Teaching Record
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Comments section */}
            <h3>Comments</h3>
            <CommentList
                comments={comments}
                targetType={entityType}
                targetId={parseInt(entityId, 10)}
                onCommentDeleted={handleCommentAdded}
                onCommentAdded={handleCommentAdded}
            />

            {/* New comment form */}
            <h3>Leave a Comment</h3>
            <CommentForm
                targetType={entityType}
                targetId={parseInt(entityId, 10)}
                onCommentAdded={handleCommentAdded}
            />
        </div>
    );
}
