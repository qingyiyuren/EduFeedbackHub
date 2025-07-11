// This component fetches and displays a list of available years for QS rankings.
// Users can click a year to navigate to the rankings page for that year.

import React, {useEffect, useState} from 'react';  // Import React hooks
import {Link, useNavigate} from 'react-router-dom'; // Import routing helpers

function QSYearListPage() {
    const [years, setYears] = useState([]);  // State to store list of years
    const navigate = useNavigate();          // Hook to programmatically navigate (not used here)

    // Fetch the list of years from backend API on component mount
    useEffect(() => {
        fetch('/api/years/')              // GET request to API endpoint
            .then((res) => res.json())   // Parse JSON response
            .then((data) => {
                console.log('Fetched years:', data.years); // Debug log fetched years
                setYears(data.years);                      // Update state with years array
            })
            .catch((err) => console.error('Failed to load years:', err));  // Handle errors
    }, []);  // Empty dependency array means this runs once on mount

    return (
        <div>
            <h1>Select a Year to View QS Rankings</h1>

            {/* Link back to the home page */}
            <p><Link to="/">Back to Home</Link></p>

            <ul>
                {/* Show loading or no data message if years is empty */}
                {years.length === 0 ? (
                    <li>Loading or no data...</li>
                ) : (
                    // Otherwise map each year into a list item with a link to the rankings page
                    years.map((year) => (
                        <li key={year}>
                            <Link to={`/rankings/${year}`}>{year}</Link>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}

export default QSYearListPage;
