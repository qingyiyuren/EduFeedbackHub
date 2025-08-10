/**
 * This component allows users to view the rating trend of a teacher over time.
 */
import React, {useEffect, useState} from 'react';// Import React and hooks
import {LineChart, Line, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer} from 'recharts';// Import chart components from Recharts for rendering responsive line charts.
import { getApiUrlWithPrefix } from '../../config/api.js'; // Import API configuration

export default function TeacherRatingTrendChart({lecturerId, universityId, collegeId, schoolId, year_filter}) {
    const [trendData, setTrendData] = useState(null);         // State to store fetched rating trend data
    const [loading, setLoading] = useState(true);             // State to indicate loading status
    const [error, setError] = useState(null);                 // State to store error message if fetching fails
    const [selectedLines, setSelectedLines] = useState([]);   // State to control which trend lines are shown

    // Generate filter description based on available hierarchy level
    let filterDesc = '';
    if (schoolId) filterDesc = ' (in this School)';
    else if (collegeId) filterDesc = ' (in this College)';
    else if (universityId) filterDesc = ' (in this University)';

    // Fetch rating trend data for the lecturer
    useEffect(() => {
        if (!lecturerId) return;

        let url = getApiUrlWithPrefix(`lecturer/${lecturerId}/rating_trend/?`); // Base API endpoint
        const params = [];
        if (universityId) params.push(`university_id=${universityId}`);
        if (collegeId) params.push(`college_id=${collegeId}`);
        if (schoolId) params.push(`school_id=${schoolId}`);
        if (year_filter) params.push(`year_filter=${year_filter}`); // Add year filter if provided
        url += params.join('&'); // Append query parameters

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setTrendData(data); // Store result
                setSelectedLines(['Overall', ...Object.keys(data.courses)]); // Show all lines by default
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to load rating trend.'); // Handle error
                setLoading(false);
            });
    }, [
        lecturerId || null,
        universityId || null,
        collegeId || null,
        schoolId || null,
        year_filter || null
    ]);

    // Show loading/error/empty state
    if (loading) return <p>Loading rating trend...</p>;
    if (error) return <p>{error}</p>;
    if (!trendData) return <p>No rating trend data available.</p>;

    const {years, overall, courses} = trendData;

    // Prepare chart data: one row per year with average for each course and overall
    const chartData = years.map((year, idx) => {
        const row = {year, Overall: overall[idx]};
        Object.keys(courses).forEach(course => {
            row[course] = courses[course][idx];
        });
        return row;
    });

    // Define a set of distinct colors for course lines
    const colors = ['#8884d8', '#82ca9d', '#ff7300', '#0088FE', '#FFBB28', '#00C49F', '#FF8042'];
    const courseNames = Object.keys(courses);

    // All available lines for selection
    const allLines = ['Overall', ...courseNames];

    // Handle checkbox toggle for showing/hiding lines
    const handleCheckboxChange = (line) => {
        setSelectedLines(prev =>
            prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
        );
    };

    return (
        <div style={{width: '100%', height: 400, margin: '1rem 0', marginBottom: '1rem'}}>
            {/* Title for the chart */}
            <h4>Lecturer Rating Trend</h4>
            {/* Show filter description if provided, on a separate line */}
            {filterDesc && (
                <div style={{ color: '#888', marginBottom: 8 }}>{filterDesc}</div>
            )}

            {/* Checkboxes to toggle visibility of individual trend lines */}
            <div style={{marginBottom: 8}}>
                {allLines.map((line, idx) => (
                    <label key={line} style={{marginRight: 12}}>
                        <input
                            type="checkbox"
                            checked={selectedLines.includes(line)}
                            onChange={() => handleCheckboxChange(line)}
                        />
                        {line}
                    </label>
                ))}
            </div>

            {/* Responsive line chart using recharts */}
            <ResponsiveContainer width="100%" height={320}>
                <LineChart data={chartData} margin={{top: 10, right: 60, left: 0, bottom: 50}}>
                    <XAxis dataKey="year" interval={0} padding={{right: 30}}/> {/* X-axis for years */}
                    <YAxis domain={[0, 5]} tickCount={6}/> {/* Y-axis from 0 to 5 */}
                    <Tooltip/> {/* Shows value details on hover */}
                    <Legend/> {/* Shows legend for lines */}

                    {/* Overall rating trend line */}
                    {selectedLines.includes('Overall') && (
                        <Line
                            type="linear"
                            dataKey="Overall"
                            stroke="#000"
                            strokeWidth={2}
                            dot={{r: 3, fill: '#000', stroke: 'none'}}
                        />
                    )}

                    {/* Trend line for each course */}
                    {courseNames.map((name, idx) => (
                        selectedLines.includes(name) ? (
                            <Line
                                key={name}
                                type="linear"
                                dataKey={name}
                                stroke={colors[(idx + 1) % colors.length]}
                                dot={{
                                    r: 3,
                                    fill: colors[(idx + 1) % colors.length],
                                    stroke: 'none'
                                }}
                            />
                        ) : null
                    ))}
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
