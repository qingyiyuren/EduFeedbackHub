/**
 * This component displays QS rankings for a specific year.
 * It fetches data from the backend API and presents it in a user-friendly format.
 */
import React, {useEffect, useState} from 'react';// Import React and hooks
import {useParams, Link} from 'react-router-dom'; // Import router hooks and components
import { getApiUrlWithPrefix } from '../../config/api.js'; // Import API configuration
import { formatEntityName } from '../../utils/textUtils.js'; // Import text formatting utilities

function QSYearDetailPage() {
    const {year} = useParams();  // Extract year from URL parameters
    const [rankings, setRankings] = useState([]);  // State to store rankings data
    const [loading, setLoading] = useState(true);  // Loading state
    const [error, setError] = useState(null);      // Error state

    // Fetch rankings data for the specific year when component mounts
    useEffect(() => {
        fetch(getApiUrlWithPrefix(`rankings/${year}/`))  // Send GET request
            .then((res) => {
                if (!res.ok) {
                    throw new Error('Failed to fetch rankings');
                }
                return res.json();
            })
            .then((data) => {
                setRankings(data.rankings || []);  // Update state with rankings data
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching rankings:', err);
                setError(err.message);
                setLoading(false);
            });
    }, [year]);  // Re-run effect when year changes

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

export default QSYearDetailPage;
