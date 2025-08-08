/**
 * This component allows users to quickly search for entities or courses.
 * Search results and navigation are provided.
 */

import React, {useState, useEffect} from 'react'; // Import React and useState/useEffect hooks
import {useLocation, Link, useNavigate} from 'react-router-dom'; // Import router hooks and components
import EntitySearchInput from '../forms/EntitySearchInput.jsx';
import EntityAddForm from '../forms/EntityAddForm.jsx';
import TeacherRatingTrendChart from '../forms/TeacherRatingTrendChart.jsx';
import { formatEntityName, formatPersonName } from '../../utils/textUtils.js'; // Import text formatting utilities

export default function QuickSearchPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const query = new URLSearchParams(location.search);

    // State for search and filters
    const [searchMode, setSearchMode] = useState('lecturer'); // 'lecturer' or 'entity'
    // Remove searchQuery, use selectedLecturer only
    const [selectedUniversity, setSelectedUniversity] = useState(null);
    const [selectedCollege, setSelectedCollege] = useState(null);
    const [selectedSchool, setSelectedSchool] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [selectedYear, setSelectedYear] = useState('');
    const [lecturers, setLecturers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedLecturer, setSelectedLecturer] = useState(null);
    const [lecturerDetails, setLecturerDetails] = useState(null);
    const [searched, setSearched] = useState(false); // Whether search has been submitted

    // State for add form
    const [showAddForm, setShowAddForm] = useState(false);
    const [addFormEntityType, setAddFormEntityType] = useState('');
    const [addFormParentInfo, setAddFormParentInfo] = useState({});

    // Track the last search filters to know if filters have changed since last search
    const [lastSearchFilters, setLastSearchFilters] = useState({});

    // Add state to control chart visibility
    const [showTrendChart, setShowTrendChart] = useState(false);

    // State for user's visit history
    const [visitHistory, setVisitHistory] = useState([]); // Stores the user's recent visit records

    // Remove AI sentiment analysis state and handler from QuickSearchPage
    // (sentimentResult, sentimentLoading, sentimentError, handleAnalyzeSentiment, and related UI are deleted)

    // Fetch visit history for the current user on component mount
    useEffect(() => {
        // Get token from localStorage (assumes login stores it as 'token')
        const token = localStorage.getItem('token');
        if (!token) return; // If not logged in, skip
        fetch('/api/visit-history/', {
            headers: {
                'Authorization': `Token ${token}` // Add token for authentication
            }
        })
            .then(res => res.json())
            .then(data => setVisitHistory(data))
            .catch(err => {
                console.error('Failed to fetch visit history:', err);
                setVisitHistory([]);
            });
    }, []);

    // Get filter values from URL params
    useEffect(() => {
        const q = query.get('q');
        const schoolId = query.get('schoolId');
        const schoolName = query.get('schoolName');
        const moduleId = query.get('moduleId');
        const moduleName = query.get('moduleName');

        // Set search query if provided
        // if (q) {
        //     setSearchQuery(q);
        // }

        if (schoolId && schoolName) {
            setSelectedSchool({id: schoolId, name: schoolName});
        }
        if (moduleId && moduleName) {
            setSelectedModule({id: moduleId, name: moduleName});
        }
    }, [query]);

    // Clear search results when mode changes
    useEffect(() => {
        setLecturers([]);
        setSelectedLecturer(null);
        setLecturerDetails(null);
    }, [searchMode]);

    // When a search is performed, record the current filters and fetch details/chart
    const handleSearch = async () => {
        // Store all filter values at the moment of search
        const filters = {
            lecturerId: selectedLecturer?.id,
            universityId: selectedUniversity?.id,
            collegeId: selectedCollege?.id,
            schoolId: selectedSchool?.id,
            year: selectedYear,
        };
        setLastSearchFilters(filters);
        setSearched(true);
        if (searchMode === 'lecturer' && filters.lecturerId) {
            await handleLecturerSelect(
                filters.lecturerId,
                filters.universityId,
                filters.collegeId,
                filters.schoolId,
                filters.year
            );
        } else if (searchMode === 'entity') {
            handleEntitySearch();
        }
    };

    // Update handleLecturerSelect to use explicit filter arguments
    const handleLecturerSelect = async (lecturerId, universityId, collegeId, schoolId, year) => {
        setLoading(true);
        try {
            // Build filter parameters for lecturer details
            const params = new URLSearchParams();
            if (universityId) params.append('university_id', universityId);
            if (collegeId) params.append('college_id', collegeId);
            if (schoolId) params.append('school_id', schoolId);
            if (year) params.append('year_filter', year);
            const response = await fetch(`/api/lecturer/${lecturerId}/details/?${params}`);
            const data = await response.json();
            setLecturerDetails(data);
        } catch (error) {
            console.error('Failed to get lecturer details:', error);
            setLecturerDetails(null);
        } finally {
            setLoading(false);
        }
    };

    // Handle entity search - navigate to appropriate entity page
    const handleEntitySearch = () => {
        let targetEntity = null;
        let targetId = null;

        // Determine which entity to navigate to based on what's selected
        if (selectedModule) {
            targetEntity = 'module';
            targetId = selectedModule.id;
        } else if (selectedSchool) {
            targetEntity = 'school';
            targetId = selectedSchool.id;
        } else if (selectedCollege) {
            targetEntity = 'college';
            targetId = selectedCollege.id;
        } else if (selectedUniversity) {
            targetEntity = 'university';
            targetId = selectedUniversity.id;
        }

        if (targetEntity && targetId) {
            navigate(`/${targetEntity}/${targetId}`);
        }
    };

    // Generate year options (descending order, newest year first)
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear; i >= 2010; i--) {
        years.push(i.toString());
    }

    // Determine search button text and functionality
    const getSearchButtonText = () => {
        if (searchMode === 'lecturer') {
            return loading ? 'Searching...' : 'Search';
        } else {
            if (selectedModule) return 'View Module';
            if (selectedSchool) return 'View School';
            if (selectedCollege) return 'View College';
            if (selectedUniversity) return 'View University';
            return 'Select Entity to View';
        }
    };

    // Determine if the search button should be disabled
    // Only disable if loading or no lecturer is selected (for lecturer mode)
    // Allow searching the same lecturer multiple times
    const isSearchDisabled = () => {
        if (searchMode === 'lecturer') {
            return loading || !selectedLecturer;
        } else {
            return !selectedUniversity && !selectedCollege && !selectedSchool && !selectedModule;
        }
    };

    // Handle add form success
    const handleAddSuccess = (newEntity) => {
        setShowAddForm(false);
        // Update the corresponding selected entity
        switch (addFormEntityType) {
            case 'university':
                setSelectedUniversity(newEntity);
                break;
            case 'college':
                setSelectedCollege(newEntity);
                break;
            case 'school':
                setSelectedSchool(newEntity);
                break;
            case 'module':
                setSelectedModule(newEntity);
                break;
        }

        // Navigate to the new entity's detail page
        navigate(`/${addFormEntityType}/${newEntity.id}`);
    };

    // Show add form for specific entity type
    const showAddFormFor = (entityType) => {
        let parentInfo = {};

        switch (entityType) {
            case 'college':
                if (!selectedUniversity) {
                    alert('Please select a university first.');
                    return;
                }
                parentInfo = {university: selectedUniversity};
                break;
            case 'school':
                if (!selectedCollege) {
                    alert('Please select a college first.');
                    return;
                }
                parentInfo = {college: selectedCollege};
                break;
            case 'module':
                if (!selectedSchool) {
                    alert('Please select a school first.');
                    return;
                }
                parentInfo = {school: selectedSchool};
                break;
        }

        setAddFormEntityType(entityType);
        setAddFormParentInfo(parentInfo);
        setShowAddForm(true);
    };

    // Handle no search results
    const handleNoResults = (query, entityType) => {
        showAddFormFor(entityType);
    };


    // Reset 'searched' state when the input value changes
    useEffect(() => {
        setSearched(false);
    }, []);

    // If any filter changes after a search, reset searched state
    useEffect(() => {
        if (!searched) return;
        if (
            selectedUniversity !== lastSearchFilters.selectedUniversity ||
            selectedCollege !== lastSearchFilters.selectedCollege ||
            selectedSchool !== lastSearchFilters.selectedSchool ||
            selectedModule !== lastSearchFilters.selectedModule ||
            selectedYear !== lastSearchFilters.selectedYear
        ) {
            setSearched(false);
        }
    }, [selectedUniversity, selectedCollege, selectedSchool, selectedModule, selectedYear]);

    /**
     * Helper function to generate a human-readable filter description for display.
     * Shows the most specific filter selected by the user, or 'showing all data' if no filter.
     */
    const getFilterDesc = () => {
        if (selectedSchool) return '(in this School)';
        if (selectedCollege) return '(in this College)';
        if (selectedUniversity) return '(in this University)';
        return '(showing all data)';
    };

    return (
        <div>
            <h1>Quick Search</h1>
            <Link to="/" style={{marginBottom: '20px', display: 'block'}}>
                Back to Home
            </Link>
            {/* --- Visit History Section (now below Back to Home) --- */}
            {/* Always display the user's visit history section, even if empty */}
            <div style={{
                marginBottom: '20px',
                padding: '10px',
                border: '1px solid #eee',
                borderRadius: '6px',
                background: '#f6f6f6'
            }}>
                <h4 style={{marginBottom: 8}}>Your Recent Visits</h4>
                {visitHistory.length > 0 ? (
                    <ul style={{listStyle: 'none', padding: 0, margin: 0}}>
                        {visitHistory.slice(0, 5).map((record, idx) => {
                            // Determine the correct detail page path for each entity type
                            let path = '/';
                            switch (record.entityType) {
                                case 'university':
                                    path = `/university/${record.entityId}`;
                                    break;
                                case 'college':
                                    path = `/college/${record.entityId}`;
                                    break;
                                case 'school':
                                    path = `/school/${record.entityId}`;
                                    break;
                                case 'module':
                                    path = `/module/${record.entityId}`;
                                    break;
                                case 'lecturer':
                                    path = `/lecturer/${record.entityId}`;
                                    break;
                                case 'teaching':
                                    path = `/teaching/${record.entityId}`;
                                    break;
                                default:
                                    path = '/';
                            }
                            // Always append ?fromVisit=1 to signal 'recent visit' navigation
                            const linkPath = path + '?fromVisit=1';
                            return (
                                <li key={record.id || idx} style={{marginBottom: 6}}>
                                    {/* Render as a clickable link with ?fromVisit=1 */}
                                    <Link
                                        to={linkPath}
                                        style={{
                                            color: '#1976d2',
                                            textDecoration: 'none', // Remove underline
                                            fontSize: '13px',
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span
                                            style={{fontWeight: 500}}>{record.entityType.charAt(0).toUpperCase() + record.entityType.slice(1)}:</span> {
                                            record.entityType === 'lecturer' || record.entityType === 'teaching' 
                                                ? formatPersonName(record.entityName)
                                                : formatEntityName(record.entityName)
                                        }
                                        <span style={{color: '#aaa', marginLeft: 8, fontSize: 11}}>
                                            {/* Show the visit time in local format */}
                                            {record.timestamp ? new Date(record.timestamp).toLocaleString() : ''}
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div style={{color: '#888', fontSize: 14, padding: '8px 0'}}>
                        No recent visits yet.
                    </div>
                )}
            </div>

            {/* Search Mode Selection */}
            <div style={{
                marginBottom: '20px',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
            }}>
                <div style={{display: 'flex', alignItems: 'flex-start', gap: '24px'}}>
                    <div>
                        <h3 style={{marginBottom: '10px'}}>Search Mode</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            <label
                                style={{display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '4px'}}>
                                <input
                                    type="radio"
                                    name="searchMode"
                                    value="lecturer"
                                    checked={searchMode === 'lecturer'}
                                    onChange={(e) => setSearchMode(e.target.value)}
                                    style={{marginRight: '8px'}}
                                />
                                Search Lecturers
                            </label>
                            <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
                                <input
                                    type="radio"
                                    name="searchMode"
                                    value="entity"
                                    checked={searchMode === 'entity'}
                                    onChange={(e) => setSearchMode(e.target.value)}
                                    style={{marginRight: '8px'}}
                                />
                                Browse Institutions & Courses
                            </label>
                        </div>
                    </div>
                    <div style={{fontSize: '13px', color: '#555', maxWidth: 420, marginLeft: 16}}>
                        <strong>Tips:</strong>
                        <ul style={{margin: 0, paddingLeft: 18}}>
                            <li><b>To search</b> for information (such as rating trends or comments) about <b>lecturers
                                already added</b> to this site, please use <b>Search Lecturers</b>.
                            </li>
                            <li><b>To search for a university, college, school, or module</b>, please use <b>Browse
                                Institutions & Courses</b>.
                            </li>
                            <li>If you can <b>not find a university, college, school, or module</b>, please use the
                                corresponding <b>add</b> function.
                            </li>
                            <li><b>To add a lecturer entry</b>, you must first create or select the following in order
                                through <b>Browse Institutions & Courses</b>:
                            </li>
                        </ul>
                        <div style={{marginTop: 4, marginLeft: 18}}>
                            University → College → School → Module → Teaching Record (with Lecturer and Year)
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Form */}
            <div style={{marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px'}}>
                <h3>Search Filters</h3>

                {/* Lecturer Name Search - Only for lecturer mode */}
                {searchMode === 'lecturer' && (
                    <div style={{marginBottom: '15px'}}>
                        <label style={{display: 'block', marginBottom: '5px'}}>Lecturer Name:</label>
                        <EntitySearchInput
                            entityType="lecturer"
                            entityDisplayName="Lecturer"
                            onSelect={entity => setSelectedLecturer(entity)}
                            autoNavigate={false}
                            parentInfo={{}}
                            placeholder="Search and select lecturer..."
                            // Ensure clearing the input resets selectedLecturer
                            onNoResults={() => setSelectedLecturer(null)}
                        />
                    </div>
                )}

                {/* University Filter */}
                <div style={{marginBottom: '15px'}}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '5px'
                    }}>
                        <label style={{display: 'block', marginBottom: '0'}}>University (Optional):</label>
                        <button
                            type="button"
                            onClick={() => showAddFormFor('university')}
                            style={{
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            Add University
                        </button>
                    </div>
                    <EntitySearchInput
                        entityType="university"
                        entityDisplayName="University"
                        onSelect={(entity) => {
                            setSelectedUniversity(entity);
                            // Clear child entities when parent is cleared
                            if (!entity) {
                                setSelectedCollege(null);
                                setSelectedSchool(null);
                                setSelectedModule(null);
                            }
                        }}
                        autoNavigate={false}
                        parentInfo={{}}
                        placeholder="Search and select university..."
                        onNoResults={handleNoResults}
                    />
                    {selectedUniversity && (
                        <div style={{marginTop: '5px', fontSize: '14px', color: '#666'}}>
                            Selected: {formatEntityName(selectedUniversity.name)}
                        </div>
                    )}
                </div>

                {/* College Filter */}
                {selectedUniversity && (
                    <div style={{marginBottom: '15px'}}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '5px'
                        }}>
                            <label style={{display: 'block', marginBottom: '0'}}>College (Optional):</label>
                            <button
                                type="button"
                                onClick={() => showAddFormFor('college')}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                Add College
                            </button>
                        </div>
                        <EntitySearchInput
                            entityType="college"
                            entityDisplayName="College"
                            onSelect={(entity) => {
                                setSelectedCollege(entity);
                                // Clear child entities when parent is cleared
                                if (!entity) {
                                    setSelectedSchool(null);
                                    setSelectedModule(null);
                                }
                            }}
                            autoNavigate={false}
                            parentInfo={{universityId: selectedUniversity.id, universityName: selectedUniversity.name}}
                            placeholder="Search and select college..."
                            onNoResults={handleNoResults}
                        />
                        {selectedCollege && (
                            <div style={{marginTop: '5px', fontSize: '14px', color: '#666'}}>
                                Selected: {formatEntityName(selectedCollege.name)}
                            </div>
                        )}
                    </div>
                )}

                {/* School Filter */}
                {selectedCollege && (
                    <div style={{marginBottom: '15px'}}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '5px'
                        }}>
                            <label style={{display: 'block', marginBottom: '0'}}>School (Optional):</label>
                            <button
                                type="button"
                                onClick={() => showAddFormFor('school')}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                Add School
                            </button>
                        </div>
                        <EntitySearchInput
                            entityType="school"
                            entityDisplayName="School"
                            onSelect={(entity) => {
                                setSelectedSchool(entity);
                                // Clear child entities when parent is cleared
                                if (!entity) {
                                    setSelectedModule(null);
                                }
                            }}
                            autoNavigate={false}
                            parentInfo={{
                                universityId: selectedUniversity.id,
                                universityName: selectedUniversity.name,
                                collegeId: selectedCollege.id,
                                collegeName: selectedCollege.name
                            }}
                            placeholder="Search and select school..."
                            onNoResults={handleNoResults}
                        />
                        {selectedSchool && (
                            <div style={{marginTop: '5px', fontSize: '14px', color: '#666'}}>
                                Selected: {formatEntityName(selectedSchool.name)}
                            </div>
                        )}
                    </div>
                )}

                {/* Module Filter */}
                {selectedSchool && (
                    <div style={{marginBottom: '15px'}}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '5px'
                        }}>
                            <label style={{display: 'block', marginBottom: '0'}}>Module (Optional):</label>
                            <button
                                type="button"
                                onClick={() => showAddFormFor('module')}
                                style={{
                                    backgroundColor: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                }}
                            >
                                Add Module
                            </button>
                        </div>
                        <EntitySearchInput
                            entityType="module"
                            entityDisplayName="Module"
                            onSelect={(entity) => setSelectedModule(entity)}
                            autoNavigate={false}
                            parentInfo={{
                                universityId: selectedUniversity.id,
                                universityName: selectedUniversity.name,
                                collegeId: selectedCollege.id,
                                collegeName: selectedCollege.name,
                                schoolId: selectedSchool.id,
                                schoolName: selectedSchool.name
                            }}
                            placeholder="Search and select module..."
                            onNoResults={handleNoResults}
                        />
                        {selectedModule && (
                            <div style={{marginTop: '5px', fontSize: '14px', color: '#666'}}>
                                Selected: {formatEntityName(selectedModule.name)}
                            </div>
                        )}
                    </div>
                )}

                {/* Year Filter - Only for lecturer mode */}
                {searchMode === 'lecturer' && (
                    <div style={{marginBottom: '15px'}}>
                        <label style={{display: 'block', marginBottom: '5px'}}>Year (Optional):</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            style={{
                                width: 320,
                                minWidth: 320,
                                maxWidth: 320,
                                padding: '8px',
                                borderRadius: '4px',
                                border: '1px solid #ccc'
                            }}
                        >
                            <option value="">All Years</option>
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                )}

                <button
                    onClick={handleSearch}
                    disabled={isSearchDisabled()}
                    style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        padding: '10px 20px',
                        borderRadius: '4px',
                        cursor: isSearchDisabled() ? 'not-allowed' : 'pointer',
                        opacity: isSearchDisabled() ? 0.6 : 1,
                        marginTop: '15px'
                    }}
                >
                    {getSearchButtonText()}
                </button>
            </div>

            {/* Search Results */}
            <div style={{marginTop: 24}}>
                <h3>Search Results</h3>
                {/* Removed the 'No lecturer found' error message for a cleaner UI */}
                {/* Only show details area */}
            </div>

            {/* Lecturer Details */}
            {searched && lecturerDetails && lastSearchFilters.lecturerId && (
                <div style={{
                    padding: '20px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa'
                }}>
                    <h3>Lecturer Details: {formatPersonName(lecturerDetails.name)}</h3>
                    {/* Show current filter description below the title */}
                    <div style={{color: '#888', marginBottom: 8}}>
                        {getFilterDesc()}
                    </div>
                    {/* Overall Statistics */}
                    <div style={{marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '4px'}}>
                        <h4>Overall Statistics</h4>
                        <div style={{display: 'flex', gap: '20px'}}>
                            <div>
                                <strong>Total Teaching Records:</strong> {lecturerDetails.total_records || 0}
                            </div>
                            <div>
                                <strong>Average Rating:</strong> {lecturerDetails.average_rating?.toFixed(1) || 'N/A'}
                            </div>
                            <div>
                                <strong>Total Ratings:</strong> {lecturerDetails.total_ratings || 0}
                            </div>
                        </div>
                        {/* Show/Hide Trend Chart Button */}
                        <div style={{ display: 'flex', gap: 12, marginTop: 16, marginBottom: 8 }}>
                            <button
                                onClick={() => setShowTrendChart(v => !v)}
                                style={{ marginRight: 8 }}
                            >
                                {showTrendChart ? 'Hide Rating Trend Chart' : 'View Rating Trend Chart'}
                            </button>
                        </div>
                        {/* Trend Chart */}
                        {showTrendChart && lastSearchFilters.lecturerId && (
                            <TeacherRatingTrendChart
                                lecturerId={lastSearchFilters.lecturerId || null}
                                universityId={lastSearchFilters.universityId || null}
                                collegeId={lastSearchFilters.collegeId || null}
                                schoolId={lastSearchFilters.schoolId || null}
                                year_filter={lastSearchFilters.year || null}
                            />
                        )}
                    </div>

                    {/* Teaching Records by Year */}
                    {lecturerDetails.teaching_records && Object.keys(lecturerDetails.teaching_records).length > 0 && (
                        <div>
                            <h4>Teaching Records by Year</h4>
                            {Object.entries(lecturerDetails.teaching_records)
                                .sort((a, b) => Number(b[0]) - Number(a[0])) // Sort years descending
                                .map(([year, records]) => (
                                    <div key={year} style={{
                                        marginBottom: '15px',
                                        padding: '15px',
                                        backgroundColor: 'white',
                                        borderRadius: '4px'
                                    }}>
                                        <h5 style={{marginBottom: '10px', color: '#28a745'}}>Year: {year}</h5>
                                        {records.map(record => (
                                            <div key={record.id} style={{
                                                marginBottom: '10px',
                                                padding: '10px',
                                                border: '1px solid #eee',
                                                borderRadius: '4px'
                                            }}>
                                                <div style={{fontWeight: 'bold'}}>
                                                    {formatEntityName(record.module_name)}
                                                </div>
                                                <div style={{color: '#666', fontSize: '14px'}}>
                                                    School: {formatEntityName(record.school_name)} → {formatEntityName(record.college_name)} → {formatEntityName(record.university_name)}
                                                </div>
                                                <div style={{display: 'flex', gap: '20px', marginTop: '5px'}}>
                                                    <span>
                                                        <strong>Rating:</strong> {record.average_rating?.toFixed(1) || 'N/A'}
                                                        ({record.rating_count || 0} ratings)
                                                    </span>
                                                    <Link to={`/teaching/${record.id}`} style={{color: '#1976d2'}}>
                                                        View Details →
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {loading && (
                <div style={{textAlign: 'center', padding: '20px'}}>
                    Loading...
                </div>
            )}

            {/* Add Entity Form */}
            {showAddForm && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '20px',
                        borderRadius: '8px',
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h2>Add New {formatEntityName(addFormEntityType.charAt(0).toUpperCase() + addFormEntityType.slice(1))}</h2>
                            <button
                                onClick={() => setShowAddForm(false)}
                                style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                        </div>
                        <EntityAddForm
                            entityType={addFormEntityType}
                            onAddSuccess={handleAddSuccess}
                            parentInfo={addFormParentInfo}
                        />
                    </div>
                </div>
            )}
        </div>
    );
} 