/**
 * This component allows users to view details, comments, and related actions for an entity.
 * Navigation to sub-entities and feedback features are included.
 */

import React, {useEffect, useState} from 'react'; // Import React and hooks
import {useParams, Link, useLocation, useNavigate} from 'react-router-dom'; // Import router hooks and components
import CommentSection from '../forms/CommentSection.jsx';
import RatingComponent from '../forms/RatingComponent.jsx';
import FollowButton from '../forms/FollowButton.jsx';

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
    const [loading, setLoading] = useState(true);         // Loading indicator
    const [refreshComments, setRefreshComments] = useState(false); // Trigger refresh
    const [ratingData, setRatingData] = useState({ average: 0, count: 0 }); // Rating data

    // Module-specific state
    const [modules, setModules] = useState([]);           // Not currently used
    const [teachings, setTeachings] = useState([]);       // Teaching records
    const [showTeachingForm, setShowTeachingForm] = useState(false); // Toggle form
    const [selectedYear, setSelectedYear] = useState(''); // Selected year in dropdown
    const [years, setYears] = useState([]);               // Available year options
    const [newLecturerName, setNewLecturerName] = useState(''); // New lecturer name

    // State to ensure visit is only recorded once per page load
    const [visitRecorded, setVisitRecorded] = useState(false);

    // Fetch entity details and comments
    useEffect(() => {
        if (!entityId) return;
        setLoading(true);
        fetch(`/api/${entityType}/${entityId}/`)
            .then(res => res.json())
            .then(data => {
                setEntityData(data[entityType]);                  // Set core entity info
                setRatingData(data.rating || { average: 0, count: 0 }); // Set rating data
                if (entityType === 'module') setTeachings(data.teachings || []); // Set teaching records
                setLoading(false);
                setVisitRecorded(false); // Reset visitRecorded when entity changes
            })
            .catch(() => setLoading(false));                      // Handle errors silently
    }, [entityId, entityType]);

    // Record visit history only once per entity page load
    useEffect(() => {
        const fromVisit = query.get('fromVisit'); // Check if navigation is from recent visit
        if (!entityId || visitRecorded) return;
        if (fromVisit === '1') return; // Do not record if from recent visit
        const token = localStorage.getItem('token');
        if (token && entityData && entityData.name) {
            // Compose a hierarchical name for visit history
            let hierarchicalName = entityData.name;
            if (entityType === 'college' && entityData.university) {
                hierarchicalName = `${entityData.university.name} - ${entityData.name}`;
            } else if (entityType === 'school' && entityData.college && entityData.college.university) {
                hierarchicalName = `${entityData.college.university.name} - ${entityData.college.name} - ${entityData.name}`;
            } else if (entityType === 'school' && entityData.college) {
                hierarchicalName = `${entityData.college.name} - ${entityData.name}`;
            } else if (entityType === 'module' && entityData.school && entityData.school.college && entityData.school.college.university) {
                hierarchicalName = `${entityData.school.college.university.name} - ${entityData.school.college.name} - ${entityData.school.name} - ${entityData.name}`;
            } else if (entityType === 'module' && entityData.school && entityData.school.college) {
                hierarchicalName = `${entityData.school.college.name} - ${entityData.school.name} - ${entityData.name}`;
            } else if (entityType === 'module' && entityData.school) {
                hierarchicalName = `${entityData.school.name} - ${entityData.name}`;
            }
            fetch('/api/visit-history/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}` // Add token for authentication
                },
                body: JSON.stringify({
                    entityType: entityType,
                    entityId: entityData.id,
                    entityName: hierarchicalName
                })
            });
            setVisitRecorded(true); // Mark as recorded to prevent duplicate
        }
    }, [entityId, entityType, entityData, visitRecorded, query]);

    // Populate year dropdown (only when form is shown)
    useEffect(() => {
        if (showTeachingForm && entityType === 'module') {
            const currentYear = new Date().getFullYear();
            const yearsList = [];
            for (let i = currentYear; i >= 2010; i--) {
                yearsList.push(i.toString());
            }
            setYears(yearsList);
        }
    }, [showTeachingForm, entityType]);

    // Submit teaching record (module + lecturer + year)
    const handleAddTeaching = async () => {
        // Validate required inputs
        if (!newLecturerName.trim() || !selectedYear) {
            alert('Please enter the lecturer name and select a year.');
            return;
        }

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

    // Handle rating change
    const handleRatingChange = (newAverage, newCount) => {
        setRatingData({ average: newAverage, count: newCount });
    };

    // Get user role from localStorage
    const userRole = localStorage.getItem('role');

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

            {/* Rating Component */}
            <RatingComponent
                targetType={entityType}
                targetId={parseInt(entityId, 10)}
                average={ratingData.average}
                count={ratingData.count}
                userRole={userRole}
                onRatingChange={handleRatingChange}
            />

            {/* Follow Button */}
            <FollowButton
                entityType={entityType}
                entityId={parseInt(entityId, 10)}
            />

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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
                                <div>
                                    <label>Lecturer: </label><br />
                                    <input
                                        type="text"
                                        placeholder="Lecturer Name"
                                        value={newLecturerName}
                                        onChange={(e) => setNewLecturerName(e.target.value)}
                                        style={{ width: 220, padding: '4px', color: newLecturerName ? '#222' : '#888', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label>Year: </label><br />
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        style={{ width: 220, padding: '4px', boxSizing: 'border-box' }}
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleAddTeaching} style={{marginTop: '1rem'}}>
                                Add Teaching Record
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Comments display section */}
            <CommentSection
                targetType={entityType}
                targetId={parseInt(entityId, 10)}
                targetIdName={config.paramName}
            />
        </div>
    );
}
