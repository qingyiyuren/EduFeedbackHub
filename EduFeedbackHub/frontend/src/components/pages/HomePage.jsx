/**
 * This component renders the user's profile page, enabling both viewing and editing of personal information.
 */
import React from 'react';// Import React
import {Link} from 'react-router-dom'; // Import router component

export default function HomePage() {
    // Retrieve username and role from localStorage (if logged in)
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');

    return (
        <div style={{paddingTop: 60}}>
            {/* Display a welcome message if the user is logged in */}
            {username && (
                <div style={{color: '#1976d2', fontWeight: 500, marginBottom: 24, fontSize: '1.2em'}}>
                    Welcome {username}
                </div>
            )}

            {/* Main title */}
            <h1 style={{marginBottom: 16}}>EduFeedbackHub</h1>

            {/* Short description */}
            <p style={{marginBottom: 40, color: '#000'}}>
                Find and provide feedback on educational institutions and courses
            </p>

            {/* Navigation links */}
            <div style={{marginTop: 0}}>
                {/* Quick search for modules or lecturers */}
                <div style={{marginBottom: 32}}>
                    {/* Guide: You can search or add lecturers, institutions, courses, and more. */}
                    <div style={{fontSize: '0.95em', color: '#555', marginBottom: 4}}>
                        You can quickly search or add a new item (such as a university, module, or lecturer).
                    </div>
                    <Link to="/search">
                        Quick Search & Add New Item
                    </Link>
                </div>

                {/* View QS university rankings */}
                <div style={{marginBottom: 32}}>
                    {/* Guide: View QS World University Rankings */}
                    <div style={{fontSize: '0.95em', color: '#555', marginBottom: 4}}>
                        View QS World University Rankings.
                    </div>
                    <Link to="/years">
                        View QS Rankings
                    </Link>
                </div>

                {/* Redirect to login/register if not already logged in */}
                <div style={{marginBottom: 0}}>
                    {/* Guide: Register or log in to your account */}
                    <div style={{fontSize: '0.95em', color: '#555', marginBottom: 4}}>
                        {username ? 'View or edit your profile.' : 'Register or log in to your account.'}
                    </div>
                    {username ? (
                        <Link to="/profile">
                            Profile
                        </Link>
                    ) : (
                        <Link to="/login">
                            Register / Login
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}


