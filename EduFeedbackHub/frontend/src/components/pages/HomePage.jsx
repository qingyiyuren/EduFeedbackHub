// This component renders the homepage of EduFeedbackHub with a link to the QS Rankings list.

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
        </div>
    );
}
