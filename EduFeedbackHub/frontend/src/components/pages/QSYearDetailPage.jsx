/**
 * This component allows users to view QS World University Rankings for a specific year.
 * Rankings are displayed in a table with navigation to university details.
 */
import React, {useEffect, useState} from 'react'; // Import React and hooks
import {Link, useParams} from 'react-router-dom'; // Import router hooks and components
import { formatEntityName } from '../../utils/textUtils.js'; // Import text formatting utilities

export default function QSYearDetailPage() {
    const {year} = useParams();  // Get the "year" parameter from the URL (e.g., /rankings/2024)

    // State variables: "rankings" holds the university ranking data; "loading" indicates loading state
    const [rankings, setRankings] = useState([]);
    const [loading, setLoading] = useState(true);

    // When the page loads or when "year" changes, fetch ranking data from the backend
    useEffect(() => {
        fetch(`/api/rankings/${year}/`)  // Send GET request
            .then(res => res.json())     // Parse the JSON response
            .then(data => {
                setRankings(data.rankings); // Store rankings in state
                setLoading(false);          // Mark loading as complete
            })
            .catch(() => setLoading(false)); // Also stop loading on error
    }, [year]); // Dependency array: re-run effect when "year" changes

    // Show loading message while fetching
    if (loading) return <p>Loading rankings...</p>;

    return (
        <div>
            <h1>QS World University Rankings - {year}</h1>

            {/* Link to go back to the list of years */}
            <p><Link to="/years">Back to Years List</Link></p>

            {/* Rankings table */}
            <table style={{width: '100%', borderCollapse: 'collapse'}}>
                <thead>
                <tr style={{borderBottom: '2px solid black'}}>
                    <th style={{textAlign: 'left', padding: '8px'}}>Rank</th>
                    <th style={{textAlign: 'left', padding: '8px'}}>University</th>
                    <th style={{textAlign: 'left', padding: '8px'}}>Country or Region</th>
                </tr>
                </thead>
                <tbody>
                {rankings.map(ranking => (
                    <tr key={ranking.id} style={{borderBottom: '1px solid #ccc'}}>
                        <td style={{padding: '8px'}}>{ranking.rank}</td>

                        {/* University name links to detail page, passing year as query param */}
                        <td style={{padding: '8px'}}>
                            <Link to={`/university/${ranking.university.id}?fromYear=${year}`}>
                                {formatEntityName(ranking.university.name)}
                            </Link>
                        </td>

                        <td style={{padding: '8px'}}>{ranking.university.region}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
}
