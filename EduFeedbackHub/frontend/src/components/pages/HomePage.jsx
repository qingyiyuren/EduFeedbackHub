// This component renders the homepage of EduFeedbackHub with links to QS Rankings and University Search/Add.

import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
    return (
        <div>
            <h1>Welcome to EduFeedbackHub</h1>  {/* Main heading */}
            <p>
                {/* Link to the page that lists QS ranking years */}
                <Link to="/years">View QS World University Rankings</Link>
            </p>
            <p>
                {/* New link to the university search/add page */}
                <Link to="/university/search">Search or Add University for Feedback</Link>
            </p>
        </div>
    );
}
