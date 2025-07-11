/**
 * This component allows users to search for an existing university or add a new one.
 * When a university is selected or added, the user is redirected to its detail page.
 * If a similar university already exists, the user is also redirected to the existing one.
 */
import React, {useState} from 'react';  // Import React and the useState hook
import {Link, useNavigate} from 'react-router-dom';  // Import routing helpers
import UniversitySearchInput from '../forms/UniversitySearchInput.jsx';  // Import the university search input component
import UniversityAddForm from '../forms/UniversityAddForm.jsx';  // Import the university add form component

export default function UniversitySearchAddPage() {
    const [message, setMessage] = useState('');  // Message to display success or duplicate info
    const navigate = useNavigate();  // Hook for navigation

    const entityType = 'university';  // The entity type (used in API paths and routing)
    const entityDisplayName = 'University';  // Display name for the entity

    return (
        <div style={{maxWidth: 600, margin: '2rem auto', padding: '0 1rem'}}>
            {/* Link to return to the home page */}
            <p>
                <Link to="/">Back to Home</Link>
            </p>

            {/* Page title */}
            <h2>Search or Add a {entityDisplayName}</h2>

            {/* University search input; on selection, navigate to the detail page */}
            <UniversitySearchInput
                entityType={entityType}
                entityDisplayName={entityDisplayName}
                onSelect={(item) => navigate(`/${entityType}/${item.id}`)}  // Redirect on selection
            />

            {/* University add form; handles success and existing cases */}
            <UniversityAddForm
                entityType={entityType}
                entityDisplayName={entityDisplayName}

                // When a university is successfully added
                onAddSuccess={(item) => {
                    setMessage(`Added ${entityDisplayName}: ${item.name}`);
                    navigate(`/${entityType}/${item.id}`);  // Redirect to the new university's page
                }}

                // When a similar university already exists
                onAddExists={(item) => {
                    setMessage(
                        `A similar ${entityDisplayName} already exists: ${item.name}${
                            item.region ? ` (${item.region})` : ''
                        }`
                    );
                    navigate(`/${entityType}/${item.id}`);  // Redirect to the existing university
                }}
            />

            {/* Display message if one exists */}
            {message && (
                <p style={{marginTop: '1rem', color: 'green'}}>
                    {message}
                </p>
            )}
        </div>
    );
}
