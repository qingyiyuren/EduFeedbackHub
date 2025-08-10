/**
 * This component renders the user's profile page, enabling both viewing and editing of personal information.
 */
import React from 'react';// Import React
import {Link} from 'react-router-dom'; // Import router component

export default function HomePage() {
    // Get username from localStorage if available
    const username = localStorage.getItem('username');

    return (
        <div style={{paddingTop: 60, textAlign: 'center'}}>

            {/* Display a welcome message if the user is logged in */}
            {username && (
                <div style={{color: '#1976d2', fontWeight: 500, marginBottom: 32, fontSize: '1.4em'}}>
                    Welcome {username}
                </div>
            )}

            {/* Main title */}
            <h1 style={{marginBottom: 24, fontSize: '3em', color: '#388e3c'}}>EduFeedbackHub</h1>

            {/* Short description */}
            <p style={{marginBottom: 40, color: '#000', fontSize: '1.3em', lineHeight: '1.6'}}>
                Find and provide feedback on educational institutions and courses
            </p>

            {/* Navigation links */}
            <div style={{marginTop: 0}}>
                {/* Quick search for modules or lecturers */}
                <div style={{marginBottom: 40}}>
                    {/* Guide: You can search or add lecturers, institutions, courses, and more. */}
                    <div style={{fontSize: '1.1em', color: '#666', marginBottom: 8}}>
                        You can quickly search or add a new item (such as a university, module, or lecturer).
                    </div>
                    <Link to="/search" style={{fontSize: '1.3em', fontWeight: 600, color: '#1976d2', textDecoration: 'none'}}>
                        Quick Search & Add New Item
                    </Link>
                </div>

                {/* View QS university rankings */}
                <div style={{marginBottom: 40}}>
                    {/* Guide: View QS World University Rankings */}
                    <div style={{fontSize: '1.1em', color: '#666', marginBottom: 8}}>
                        View QS World University Rankings.
                    </div>
                    <Link to="/years" style={{fontSize: '1.3em', fontWeight: 600, color: '#1976d2', textDecoration: 'none'}}>
                        View QS Rankings
                    </Link>
                </div>

                {/* Redirect to login/register if not already logged in */}
                <div style={{marginBottom: 0}}>
                    {/* Guide: Register or log in to your account */}
                    <div style={{fontSize: '1.1em', color: '#666', marginBottom: 8}}>
                        {username ? 'View or edit your profile.' : 'Register or log in to your account.'}
                    </div>
                    {username ? (
                        <Link to="/profile" style={{fontSize: '1.3em', fontWeight: 600, color: '#1976d2', textDecoration: 'none'}}>
                            Profile
                        </Link>
                    ) : (
                        <Link to="/login" style={{fontSize: '1.3em', fontWeight: 600, color: '#1976d2', textDecoration: 'none'}}>
                            Register / Login
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}


