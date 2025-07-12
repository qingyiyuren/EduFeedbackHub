/**
 * This component provides a flexible interface for users to quickly search
 * for universities, colleges, schools, or modules.
 * It supports hierarchical parent entity selection and guides users to add
 * missing parent entities before adding lower-level ones.
 */

import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EntitySearchInput from '../forms/EntitySearchInput.jsx';

export default function QuickSearchPage() {
    const location = useLocation(); // React Router hook to get current location (URL)
    const navigate = useNavigate(); // React Router hook for programmatic navigation
    const query = new URLSearchParams(location.search); // Parse query parameters from URL

    // Extract default parent entity info from URL parameters (if any)
    const defaultUniversityId = query.get('universityId');
    const defaultUniversityName = query.get('universityName') ? decodeURIComponent(query.get('universityName')) : '';
    const defaultCollegeId = query.get('collegeId');
    const defaultCollegeName = query.get('collegeName') ? decodeURIComponent(query.get('collegeName')) : '';
    const defaultSchoolId = query.get('schoolId');
    const defaultSchoolName = query.get('schoolName') ? decodeURIComponent(query.get('schoolName')) : '';

    // State for currently selected entity type to search
    const [selectedEntityType, setSelectedEntityType] = useState('university');
    // State to hold parent entity information relevant to selected entity type
    const [parentInfo, setParentInfo] = useState({
        universityId: defaultUniversityId || '',
        universityName: defaultUniversityName || '',
        collegeId: defaultCollegeId || '',
        collegeName: defaultCollegeName || '',
        schoolId: defaultSchoolId || '',
        schoolName: defaultSchoolName || '',
    });
    // State for the entity selected from the search input
    const [searchEntity, setSearchEntity] = useState(null);

    // Supported entity types with display labels and button colors
    const entityTypes = [
        { value: 'university', label: 'University', color: '#007bff' },
        { value: 'college', label: 'College', color: '#007bff' },
        { value: 'school', label: 'School', color: '#007bff' },
        { value: 'module', label: 'Module', color: '#007bff' },
    ];

    /**
     * Handle entity type selection changes.
     * Reset irrelevant parent info according to the selected entity type hierarchy.
     * @param {string} entityType - The new selected entity type.
     */
    const handleEntityTypeChange = (entityType) => {
        setSelectedEntityType(entityType); // Update selected entity type
        setSearchEntity(null); // Clear current search selection

        // Clone current parentInfo to modify safely
        const newParentInfo = { ...parentInfo };

        // Reset parent info fields not applicable to the selected entity type
        if (entityType === 'university') {
            // University is top-level, clear lower-level parents
            newParentInfo.collegeId = '';
            newParentInfo.collegeName = '';
            newParentInfo.schoolId = '';
            newParentInfo.schoolName = '';
        } else if (entityType === 'college') {
            // College requires university info, clear school info
            newParentInfo.schoolId = '';
            newParentInfo.schoolName = '';
        } else if (entityType === 'school') {
            // School requires college and university info, clear school itself (for fresh selection)
            newParentInfo.schoolId = '';
            newParentInfo.schoolName = '';
        } else if (entityType === 'module') {
            // Module requires school, college, and university info — keep all
        }

        setParentInfo(newParentInfo); // Update state with cleaned parent info
    };

    /**
     * Handle selection of a parent entity from the search input component.
     * Updates the corresponding parent entity info in state.
     * @param {Object} entity - The selected parent entity { id, name }.
     * @param {string} parentType - The type of the parent entity ('university', 'college', or 'school').
     */
    const handleParentSelect = (entity, parentType) => {
        setParentInfo(prev => ({
            ...prev,
            [`${parentType}Id`]: entity.id,
            [`${parentType}Name`]: entity.name,
        }));
        setSearchEntity(null); // Clear current search selection since parent changed
    };

    return (
        <div>
            <h1>Quick Search</h1> {/* Page header */}
            <p>Search for any university, college, school, or module</p> {/* Instruction */}

            {/* Link back to home page */}
            <p>
                <a href="/" style={{ color: '#007bff', textDecoration: 'none' }}>
                    Back to Home
                </a>
            </p>

            {/* Entity type selection buttons */}
            <div style={{ marginBottom: '30px' }}>
                <h3>What are you looking for?</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {entityTypes.map(type => (
                        <button
                            key={type.value}
                            onClick={() => handleEntityTypeChange(type.value)} // Change selected entity type
                            style={{
                                backgroundColor: selectedEntityType === type.value ? '#007bff' : '#f8f9fa',
                                color: selectedEntityType === type.value ? 'white' : '#333',
                                border: '1px solid #ddd',
                                padding: '8px 16px',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            {type.label} {/* Button label */}
                        </button>
                    ))}
                </div>
            </div>

            {/* Parent entity search inputs, shown depending on selected entity type */}
            {selectedEntityType !== 'university' && (
                <div style={{ marginBottom: '30px' }}>
                    <h3>Select Parent Item</h3>

                    {/* University selector: required for college, school, module */}
                    {(selectedEntityType === 'college' || selectedEntityType === 'school' || selectedEntityType === 'module') && (
                        <div style={{ marginBottom: '15px' }}>
                            <EntitySearchInput
                                entityType="university"
                                entityDisplayName="University"
                                onSelect={(entity) => handleParentSelect(entity, 'university')} // Update university parent info
                                autoNavigate={false}
                                parentInfo={{}} // No parents for university input
                            />
                        </div>
                    )}

                    {/* College selector: required for school, module */}
                    {(selectedEntityType === 'school' || selectedEntityType === 'module') && (
                        <div style={{ marginBottom: '15px' }}>
                            <EntitySearchInput
                                entityType="college"
                                entityDisplayName="College"
                                onSelect={(entity) => handleParentSelect(entity, 'college')} // Update college parent info
                                autoNavigate={false}
                                parentInfo={parentInfo} // Pass current parent info for context
                            />
                        </div>
                    )}

                    {/* School selector: required for module */}
                    {selectedEntityType === 'module' && (
                        <div style={{ marginBottom: '15px' }}>
                            <EntitySearchInput
                                entityType="school"
                                entityDisplayName="School"
                                onSelect={(entity) => handleParentSelect(entity, 'school')} // Update school parent info
                                autoNavigate={false}
                                parentInfo={parentInfo} // Pass current parent info for context
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Main search input for the selected entity type */}
            <div>
                <EntitySearchInput
                    entityType={selectedEntityType} // Entity type to search
                    entityDisplayName={entityTypes.find(t => t.value === selectedEntityType)?.label} // Display label
                    parentInfo={parentInfo} // Parent entity context
                    placeholder={`Select or type to search ${entityTypes.find(t => t.value === selectedEntityType)?.label.toLowerCase()}...`} // Input placeholder
                    onSelect={(entity) => setSearchEntity(entity)} // Update selected entity state
                    autoNavigate={false} // Disable auto navigation on select
                />
                <button
                    style={{ marginTop: '10px', padding: '6px 18px', fontSize: '16px' }}
                    onClick={() => {
                        if (searchEntity && searchEntity.id) {
                            navigate(`/${selectedEntityType}/${searchEntity.id}`); // Navigate to selected entity detail page
                        } else {
                            window.alert('Please select an item to search.'); // Alert if no selection
                        }
                    }}
                >
                    Search
                </button>
            </div>

            {/* Quick add new entity section */}
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                <h3>Can't find what you're looking for?</h3>

                {/* Conditional UI for adding new entities with guidance on selecting/adding parent entities first */}
                {selectedEntityType === 'university' ? (
                    // For university, allow direct addition
                    <div>
                        <p>Add a new university:</p>
                        <button
                            onClick={() => {
                                navigate('/university/search');
                            }}
                        >
                            Add New University
                        </button>
                    </div>
                ) : selectedEntityType === 'college' ? (
                    // For college, require university selected first
                    <div>
                        {!parentInfo.universityId ? (
                            <div>
                                <p>To add a college, you need to select a university first.</p>
                                <p>Please search it or add a new university:</p>
                                <button
                                    onClick={() => {
                                        navigate('/university/search');
                                    }}
                                >
                                    Add New University
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : selectedEntityType === 'school' ? (
                    // For school, require university and college selected first
                    <div>
                        {!parentInfo.universityId ? (
                            <div>
                                <p>To add a school, you need to select a university and college first.</p>
                                <p>Please search it or add a new university:</p>
                                <button
                                    onClick={() => {
                                        navigate('/university/search');
                                    }}
                                >
                                    Add New University
                                </button>
                            </div>
                        ) : !parentInfo.collegeId ? (
                            <div>
                                <p>To add a school, you need to select a college first.</p>
                                <p>Please search it or add a new college under {parentInfo.universityName}:</p>
                                <button
                                    onClick={() => {
                                        const searchParams = new URLSearchParams();
                                        searchParams.set('universityId', parentInfo.universityId);
                                        searchParams.set('universityName', parentInfo.universityName);
                                        navigate(`/college/search?${searchParams.toString()}`);
                                    }}
                                >
                                    Add New College
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : selectedEntityType === 'module' ? (
                    // For module, require university, college, and school selected first
                    <div>
                        {!parentInfo.universityId ? (
                            <div>
                                <p>To add a module, you need to select a university, college, and school first.</p>
                                <p>Please search them or add a new university:</p>
                                <button
                                    onClick={() => {
                                        navigate('/university/search');
                                    }}
                                >
                                    Add New University
                                </button>
                            </div>
                        ) : !parentInfo.collegeId ? (
                            <div>
                                <p>To add a module, you need to select a college and school first.</p>
                                <p>Please search them or add a new college under {parentInfo.universityName}:</p>
                                <button
                                    onClick={() => {
                                        const searchParams = new URLSearchParams();
                                        searchParams.set('universityId', parentInfo.universityId);
                                        searchParams.set('universityName', parentInfo.universityName);
                                        navigate(`/college/search?${searchParams.toString()}`);
                                    }}
                                >
                                    Add New College
                                </button>
                            </div>
                        ) : !parentInfo.schoolId ? (
                            <div>
                                <p>To add a module, you need to select a school first.</p>
                                <p>Please search it or add a new school under {parentInfo.collegeName}:</p>
                                <button
                                    onClick={() => {
                                        const searchParams = new URLSearchParams();
                                        searchParams.set('universityId', parentInfo.universityId);
                                        searchParams.set('universityName', parentInfo.universityName);
                                        searchParams.set('collegeId', parentInfo.collegeId);
                                        searchParams.set('collegeName', parentInfo.collegeName);
                                        navigate(`/school/search?${searchParams.toString()}`);
                                    }}
                                >
                                    Add New School
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
