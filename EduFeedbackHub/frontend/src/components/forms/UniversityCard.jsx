// This component displays a university's ranking, name (as a clickable link), and region.
// It is used to show a brief overview of a university within a list or ranking page.

import React from 'react';
import { Link } from 'react-router-dom';

export default function UniversityCard({ ranking }) {
    const { rank, university } = ranking; // Destructure rank and university info from ranking prop

    return (
        <div style={{ border: '1px solid #ccc', marginBottom: 8, padding: 8 }}>
            <strong>#{rank}</strong>{' '} {/* Show university rank with a # prefix */}
            <Link to={`/university/${university.id}`}> {/* Link to university detail page */}
                {university.name} {/* Display university name */}
            </Link>{' '}
            - <em>{university.region}</em> {/* Display university region in italic */}
        </div>
    );
}

