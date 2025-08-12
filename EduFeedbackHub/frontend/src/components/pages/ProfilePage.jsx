/**
 * This component displays and edits the user's profile with institution hierarchy.
 * It fetches profile data from the backend API and supports autocomplete selection.
 */

import React, {useState, useEffect} from 'react';// Import React and hooks
import {useNavigate, Link} from 'react-router-dom';// Import router hooks and components
import EntitySearchInput from '../forms/EntitySearchInput.jsx';
import {formatEntityName} from '../../utils/textUtils.js';
import {getApiUrlWithPrefix} from '../../config/api.js';

// Profile page component
export default function ProfilePage() {
    const navigate = useNavigate();// Router navigation function
    const [firstName, setFirstName] = useState('');// First name field state
    const [lastName, setLastName] = useState('');// Last name field state
    const [university, setUniversity] = useState(null);// Selected university entity (object with id, name) or null
    const [college, setCollege] = useState(null); // Selected college entity (object with id, name) or null
    const [school, setSchool] = useState(null);// Selected school entity (object with id, name) or null
    const [role, setRole] = useState('');// User role (student | lecturer)
    const [isEmpty, setIsEmpty] = useState(true); // Whether profile data is incomplete (controls display vs. edit mode)
    const [loading, setLoading] = useState(true); // Loading indicator while fetching profile
    const [error, setError] = useState('');// Error message for data loading or update failures
    const [success, setSuccess] = useState('');// Success message after profile update
    const [isEditing, setIsEditing] = useState(false);// Whether the page is in edit mode
    const [originalData, setOriginalData] = useState(null);// Store original data to support cancel functionality in edit mode

    // Fetch profile info on mount
    useEffect(() => {
        // Read token from localStorage to authenticate API requests
        const token = localStorage.getItem('token');
        if (!token) {
            // If not logged in, redirect to login page
            navigate('/login');
            return;
        }

        // Request current profile data from backend
        fetch(getApiUrlWithPrefix('profile/'), {
            headers: {
                'Authorization': `Token ${token}`
            }
        })
            .then(response => {
                if (!response.ok) {
                    // Convert non-OK responses to thrown errors to be caught below
                    throw new Error('Failed to load profile');
                }
                return response.json();
            })
            .then(data => {
                // Populate fields from API response (fallback to empty strings)
                setFirstName(data.first_name || '');
                setLastName(data.last_name || '');
                // Convert plain strings to entity-like objects for autocomplete components
                setUniversity(data.university ? {name: data.university, id: null} : null);
                setCollege(data.college ? {name: data.college, id: null} : null);
                setSchool(data.school ? {name: data.school, id: null} : null);
                setRole(data.role || '');

                // Determine if profile is incomplete (affects which UI is shown)
                const isProfileEmpty = !data.first_name || !data.last_name || !data.university || !data.college || !data.school;
                setIsEmpty(isProfileEmpty);

                // Save original data to allow canceling edits later
                setOriginalData({
                    firstName: data.first_name || '',
                    lastName: data.last_name || '',
                    university: data.university ? {name: data.university, id: null} : null,
                    college: data.college ? {name: data.college, id: null} : null,
                    school: data.school ? {name: data.school, id: null} : null,
                    role: data.role || ''
                });
                // Stop loading after successful fetch
                setLoading(false);
            })
            .catch(err => {
                // Surface error message and stop loading on failure
                setError(err.message);
                setLoading(false);
            });
    }, [navigate]);

    // Handle form submission to update profile
    const handleSubmit = async (e) => {
        e.preventDefault();
        // Clear previous alert messages before submitting
        setError('');
        setSuccess('');

        // Ensure user is authenticated before calling the API
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            // Submit updated profile to the backend
            const response = await fetch(getApiUrlWithPrefix('profile/'), {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    first_name: firstName,
                    last_name: lastName,
                    university: university?.name || '',
                    college: college?.name || '',
                    school: school?.name || ''
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            // Show success feedback to user
            setSuccess('Profile updated successfully!');
            // After successful update, refetch the profile data to get the latest state
            const updatedResponse = await fetch(getApiUrlWithPrefix('profile/'), {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });
            if (updatedResponse.ok) {
                // Update local states with latest backend data
                const updatedData = await updatedResponse.json();
                setFirstName(updatedData.first_name || '');
                setLastName(updatedData.last_name || '');
                setUniversity(updatedData.university ? {name: updatedData.university, id: null} : null);
                setCollege(updatedData.college ? {name: updatedData.college, id: null} : null);
                setSchool(updatedData.school ? {name: updatedData.school, id: null} : null);
                setRole(updatedData.role || '');

                const isProfileEmpty = !updatedData.first_name || !updatedData.last_name || !updatedData.university || !updatedData.college || !updatedData.school;
                setIsEmpty(isProfileEmpty);

                // Save the just-updated values as the new original data
                setOriginalData({
                    firstName: updatedData.first_name || '',
                    lastName: updatedData.last_name || '',
                    university: updatedData.university ? {name: updatedData.university, id: null} : null,
                    college: updatedData.college ? {name: updatedData.college, id: null} : null,
                    school: updatedData.school ? {name: updatedData.school, id: null} : null,
                    role: updatedData.role || ''
                });
            }
            // Exit edit mode after updating
            setIsEditing(false);
        } catch (err) {
            // Show error message if update fails
            setError(err.message);
        }
    };

    // When university changes, clear college and school (only in edit mode)
    useEffect(() => {
        if (isEditing) {
            // Reset child selections when parent changes
            setCollege(null);
            setSchool(null);
        }
    }, [university?.name, isEditing]);

    // When college changes, clear school (only in edit mode)
    useEffect(() => {
        if (isEditing) {
            // Reset school when college changes
            setSchool(null);
        }
    }, [college?.name, isEditing]);

    if (loading) {
        return (
            <div style={{padding: 20}}>
                {/* Back to Home navigation */}
                <p><Link to="/">Back to Home</Link></p>
                <div>Loading profile...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{padding: 20}}>
                {/* Back to Home navigation */}
                <p><Link to="/">Back to Home</Link></p>
                <div style={{color: 'red'}}>Error: {error}</div>
            </div>
        );
    }


    // Display mode - show profile information
    if (!isEmpty && !isEditing) {
        return (
            <div style={{maxWidth: 600, margin: '0 auto', padding: 20}}>
                <h2>Profile</h2>

                {/* Back to Home navigation */}
                <p><Link to="/">Back to Home</Link></p>

                <div style={{
                    background: '#f9f9f9',
                    padding: 20,
                    borderRadius: 8,
                    marginBottom: 20
                }}>
                    {/* User role */}
                    <div style={{marginBottom: 16}}>
                        <strong>Role:</strong> {role === 'student' ? 'Student' : 'Lecturer'}
                    </div>

                    {/* First name */}
                    <div style={{marginBottom: 16}}>
                        <strong>First Name:</strong> {firstName || 'Not provided'}
                    </div>

                    {/* Last name */}
                    <div style={{marginBottom: 16}}>
                        <strong>Last Name:</strong> {lastName || 'Not provided'}
                    </div>

                    {/* University name */}
                    <div style={{marginBottom: 16}}>
                        <strong>University:</strong> {formatEntityName(university?.name)}
                    </div>

                    {/* College name */}
                    <div style={{marginBottom: 16}}>
                        <strong>College:</strong> {formatEntityName(college?.name)}
                    </div>

                    {/* School name */}
                    <div style={{marginBottom: 16}}>
                        <strong>School:</strong> {formatEntityName(school?.name)}
                    </div>
                </div>

                {/* Edit profile button toggles edit mode and stores original values */}
                <button
                    onClick={() => {
                        // Save current state before editing
                        setOriginalData({
                            firstName,
                            lastName,
                            university,
                            college,
                            school,
                            role
                        });
                        setIsEditing(true);
                    }}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer'
                    }}
                >
                    Edit Profile
                </button>
            </div>
        );
    }

    // Edit mode or empty profile - show form
    return (
        <div style={{maxWidth: 600, margin: '0 auto', padding: 20}}>
            <h2>{isEmpty ? 'Complete Your Profile' : 'Edit Profile'}</h2>

            {/* Back to Home navigation */}
            <p><Link to="/">Back to Home</Link></p>

            {isEmpty && (
                <div style={{
                    background: '#fff3cd',
                    padding: 15,
                    borderRadius: 4,
                    marginBottom: 20,
                    border: '1px solid #ffeaa7'
                }}>
                    Please complete your profile information. All fields marked with * are required.
                </div>
            )}

            {/* Help tip for adding new entities */}
            <div style={{
                background: '#e7f3ff',
                padding: 15,
                borderRadius: 4,
                marginBottom: 20,
                border: '1px solid #b3d9ff'
            }}>
                <div style={{fontSize: '14px', color: '#0056b3', marginBottom: 8}}>
                    <strong>Tip:</strong> Can't find your university, college, or school?
                </div>
                <div style={{fontSize: '13px', color: '#666'}}>
                    You can add new institutions in the{' '}
                    <Link to="/search" style={{color: '#007bff', textDecoration: 'underline'}}>
                        Quick Search & Add New Item
                    </Link>
                    {' '}page. This helps other users find the same institutions.
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Role Display */}
                <div style={{marginBottom: 16}}>
                    <label>Role:</label><br/>
                    <div style={{
                        padding: 8,
                        background: '#f8f9fa',
                        borderRadius: 4,
                        border: '1px solid #dee2e6',
                        color: '#495057'
                    }}>
                        {role === 'student' ? 'Student' : 'Lecturer'}
                    </div>
                </div>

                {/* First Name */}
                <div style={{marginBottom: 16}}>
                    <label>First Name<span style={{color: 'red'}}>*</span></label><br/>
                    <input
                        type="text"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        required
                        placeholder="Please enter your first name"
                        style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc'}}
                    />
                </div>

                {/* Last Name */}
                <div style={{marginBottom: 16}}>
                    <label>Last Name<span style={{color: 'red'}}>*</span></label><br/>
                    <input
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                        required
                        placeholder="Please enter your last name"
                        style={{width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc'}}
                    />
                </div>

                {/* University Autocomplete */}
                <div style={{marginBottom: 16}}>
                    <label>University<span style={{color: 'red'}}>*</span></label><br/>
                    <EntitySearchInput
                        entityType="university"
                        onSelect={(entity) => {
                            setUniversity(entity);
                            if (!entity) {
                                // Clearing university should also clear college and school
                                setCollege(null);
                                setSchool(null);
                            }
                        }}
                        autoNavigate={false}
                        parentInfo={{}}
                        placeholder="Search and select university..."
                    />
                </div>

                {/* College Autocomplete */}
                <div style={{marginBottom: 16}}>
                    <label>College<span style={{color: 'red'}}>*</span></label><br/>
                    <EntitySearchInput
                        entityType="college"
                        onSelect={(entity) => {
                            setCollege(entity);
                            if (!entity) {
                                // Clearing college should also clear school
                                setSchool(null);
                            }
                        }}
                        autoNavigate={false}
                        parentInfo={{universityId: university?.id}}
                        placeholder="Search and select college..."
                    />
                </div>

                {/* School Autocomplete */}
                <div style={{marginBottom: 16}}>
                    <label>School<span style={{color: 'red'}}>*</span></label><br/>
                    <EntitySearchInput
                        entityType="school"
                        onSelect={setSchool}
                        autoNavigate={false}
                        parentInfo={{collegeId: college?.id}}
                        placeholder="Search and select school..."
                    />
                </div>

                {/* Inline error message (if any) */}
                {error && (
                    <div style={{color: 'red', marginBottom: 16}}>
                        {error}
                    </div>
                )}

                {/* Inline success message (if any) */}
                {success && (
                    <div style={{color: 'green', marginBottom: 16}}>
                        {success}
                    </div>
                )}

                <div style={{display: 'flex', gap: 10}}>
                    {/* Submit button to save or update profile */}
                    <button
                        type="submit"
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#28a745',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            cursor: 'pointer'
                        }}
                    >
                        {isEmpty ? 'Save Profile' : 'Update Profile'}
                    </button>

                    {/* Cancel button restores original values and exits edit mode */}
                    {!isEmpty && (
                        <button
                            type="button"
                            onClick={() => {
                                // Restore original data when canceling
                                if (originalData) {
                                    setFirstName(originalData.firstName);
                                    setLastName(originalData.lastName);
                                    setUniversity(originalData.university);
                                    setCollege(originalData.college);
                                    setSchool(originalData.school);
                                    setRole(originalData.role);
                                }
                                setIsEditing(false);
                            }}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: 4,
                                cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}