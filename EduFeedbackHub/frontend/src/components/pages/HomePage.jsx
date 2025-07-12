// This component renders the homepage of EduFeedbackHub with links to QS Rankings and Entities Quick Search.

import React from 'react';
import {Link} from 'react-router-dom';

export default function HomePage() {
    return (
        <div>
            <h1>EduFeedbackHub</h1> {/* Main title */}
            <p>Find and provide feedback on educational institutions and courses</p> {/* Description */}

            <div style={{textAlign: 'center', marginTop: '40px'}}>
                <div style={{marginBottom: '20px'}}>
                    <Link to="/search" style={{fontSize: '18px', textDecoration: 'none', color: '#007bff'}}>
                        Quick Search {/* Link to search page */}
                    </Link>
                </div>
                <div>
                    <Link to="/years" style={{fontSize: '18px', textDecoration: 'none', color: '#007bff'}}>
                        View QS Rankings {/* Link to QS rankings page */}
                    </Link>
                </div>
            </div>
        </div>
    );
}

