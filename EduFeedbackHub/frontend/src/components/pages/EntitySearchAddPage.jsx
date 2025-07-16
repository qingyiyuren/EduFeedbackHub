/**
 * This component allows users to search for an existing entity or add a new one.
 * Users are redirected to the detail page after selection or addition.
 */
import React, {useState} from 'react'; // Import React and useState hook
import {Link, useNavigate, useLocation} from 'react-router-dom'; // Import router hooks and components
import EntitySearchInput from '../forms/EntitySearchInput.jsx';
import EntityAddForm from '../forms/EntityAddForm.jsx';

// Custom hook to get URL query parameters
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

// Component for searching or adding entities, supports parent entity context
export default function EntitySearchAddPage({
                                                entityType = 'university',              // Current entity type, default to university
                                                entityDisplayName = 'University',       // Display name of the entity type
                                                parentInfo = {},                        // Parent entity info, e.g., { universityId, universityName }
                                            }) {
    const [message, setMessage] = useState('');       // Message state for user feedback
    const [searchEntity, setSearchEntity] = useState(null); // Currently selected search entity
    const navigate = useNavigate();                     // Navigation function
    const query = useQuery();                           // URL query parameters

    // Merge parentInfo from props and URL parameters (props take priority)
    const mergedParentInfo = {
        ...parentInfo,
        universityId: parentInfo.universityId || query.get('universityId') || '',
        universityName: parentInfo.universityName || decodeURIComponent(query.get('universityName') || ''),
        collegeId: parentInfo.collegeId || query.get('collegeId') || '',
        collegeName: parentInfo.collegeName || decodeURIComponent(query.get('collegeName') || ''),
        schoolId: parentInfo.schoolId || query.get('schoolId') || '',
        schoolName: parentInfo.schoolName || decodeURIComponent(query.get('schoolName') || ''),
        // Reserved for more hierarchy levels
    };

    // Construct parent entity objects with id and name for child components
    const parentEntityInfo = {};
    if (mergedParentInfo.universityId) {
        parentEntityInfo.university = {
            id: mergedParentInfo.universityId,
            name: mergedParentInfo.universityName
        };
    }
    if (mergedParentInfo.collegeId) {
        parentEntityInfo.college = {
            id: mergedParentInfo.collegeId,
            name: mergedParentInfo.collegeName
        };
    }
    if (mergedParentInfo.schoolId) {
        parentEntityInfo.school = {
            id: mergedParentInfo.schoolId,
            name: mergedParentInfo.schoolName
        };
    }

    return (
        <div>
            {/* Link back to homepage */}
            <p>
                <Link to="/">Back to Home</Link>
            </p>

            {/* Links to navigate back to parent entities if available */}
            {mergedParentInfo.universityId && (
                <p>
                    <Link to={`/university/${mergedParentInfo.universityId}`}>Back to University</Link>
                </p>
            )}
            {mergedParentInfo.collegeId && (
                <p>
                    <Link to={`/college/${mergedParentInfo.collegeId}`}>Back to College</Link>
                </p>
            )}
            {mergedParentInfo.schoolId && (
                <p>
                    <Link to={`/school/${mergedParentInfo.schoolId}`}>Back to School</Link>
                </p>
            )}

            {/* Display parent entity names as headings */}
            {mergedParentInfo.universityName && (
                <h2 style={{marginBottom: '0.5rem'}}>{mergedParentInfo.universityName}</h2>
            )}
            {mergedParentInfo.collegeName && (
                <h2 style={{marginBottom: '0.5rem'}}>{mergedParentInfo.collegeName}</h2>
            )}
            {mergedParentInfo.schoolName && (
                <h2 style={{marginBottom: '0.5rem'}}>{mergedParentInfo.schoolName}</h2>
            )}

            {/* Title for the search or add section */}
            <h3>Search or Add a {entityDisplayName}</h3>

            {/* Render generic entity search input */}
            <EntitySearchInput
                entityType={entityType}           // Current entity type
                entityDisplayName={entityDisplayName} // Entity display name
                parentInfo={mergedParentInfo}     // Parent info for filtering/search context
                onSelect={setSearchEntity}        // Callback when an entity is selected
                autoNavigate={false}              // Disable auto navigation on select
            />

            {/* Search button: navigate to selected entity's detail page */}
            <button
                style={{marginTop: '10px', padding: '6px 18px', fontSize: '16px'}}
                onClick={() => {
                    if (searchEntity && searchEntity.id) {
                        navigate(`/${entityType}/${searchEntity.id}`);
                    } else {
                        window.alert('Please select an entity to search.');
                    }
                }}
            >
                Search
            </button>

            {/* Render generic entity add form */}
            <EntityAddForm
                entityType={entityType}           // Current entity type
                entityDisplayName={entityDisplayName} // Entity display name
                parentInfo={parentEntityInfo}     // Parent info for linking new entity
                onAddSuccess={(item) => {         // Callback on successful add
                    setMessage(`Added ${entityDisplayName}: ${item.name}`);
                    navigate(`/${entityType}/${item.id}`);
                }}
                onAddExists={(item) => {          // Callback if entity already exists
                    setMessage(`A similar ${entityDisplayName} already exists: ${item.name}`);
                    navigate(`/${entityType}/${item.id}`);
                }}
            />

            {/* Display feedback message */}
            {message && (
                <p style={{marginTop: '1rem', color: 'green'}}>{message}</p>
            )}
        </div>
    );
}
