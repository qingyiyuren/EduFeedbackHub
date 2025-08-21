/**
 * This component allows users to view the rating trend of a teacher over time.
 * Default view is a line chart. Users can toggle to a quartile (IQR) chart.
 */
import React, {useEffect, useState} from 'react'; // Import React and hooks
import { ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Scatter, ErrorBar } from 'recharts';
import { getApiUrlWithPrefix } from '../../config/api.js'; // Import API configuration

export default function TeacherRatingTrendChart({lecturerId, universityId, collegeId, schoolId, year_filter}) {
    const [trendData, setTrendData] = useState(null);         // State to store fetched rating trend data
    const [loading, setLoading] = useState(true);             // State to indicate loading status
    const [error, setError] = useState(null);                 // State to store error message if fetching fails
    const [selectedLines, setSelectedLines] = useState([]);   // State to control which trend lines are shown
    const [chartMode, setChartMode] = useState('line');       // 'line' | 'quartile'
    const [selectedQuartileTarget, setSelectedQuartileTarget] = useState('Overall'); // 'Overall' or course name

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
                setSelectedLines(['Overall', ...Object.keys(data.courses || {})]); // Show all lines by default
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

    const {years, overall, courses, overall_quartiles, courses_quartiles} = trendData;

    // Prepare chart data: numeric X so that points align exactly above ticks (x = index)
    const chartData = (years || []).map((year, idx) => {
        const row = { x: idx, year, Overall: overall ? overall[idx] : null };
        if (courses) {
            Object.keys(courses).forEach(course => {
                row[course] = courses[course][idx];
            });
        }
        if (overall_quartiles) {
            const q1 = overall_quartiles.q1 ? overall_quartiles.q1[idx] : null;
            const q3 = overall_quartiles.q3 ? overall_quartiles.q3[idx] : null;
            const median = overall_quartiles.median ? overall_quartiles.median[idx] : null;
            const vmin = overall_quartiles.min ? overall_quartiles.min[idx] : null;
            const vmax = overall_quartiles.max ? overall_quartiles.max[idx] : null;
            row.q1 = q1;
            row.iqr = (q1 != null && q3 != null) ? Math.max(0, q3 - q1) : null;
            row.q3 = q3;
            row.median = median;
            row.min = vmin;
            row.max = vmax;
        }
        return row;
    });

    // Distinct colors for course lines
    const colors = ['#8884d8', '#82ca9d', '#ff7300', '#0088FE', '#FFBB28', '#00C49F', '#FF8042'];
    const courseNames = courses ? Object.keys(courses) : [];
    const allLines = ['Overall', ...courseNames];

    // Toggle visibility of lines
    const handleCheckboxChange = (line) => {
        setSelectedLines(prev =>
            prev.includes(line) ? prev.filter(l => l !== line) : [...prev, line]
        );
    };

    // Shared X axis for both modes — numeric with integer ticks, formatted as years
    const xAxisProps = {
        dataKey: 'x',
        type: 'number',
        domain: [chartData.length ? -0.5 : 0, chartData.length ? chartData.length - 0.5 : 0],
        ticks: chartData.map(d => d.x),
        tickFormatter: (v) => years && years[v] ? years[v] : v,
        allowDecimals: false,
        tickMargin: 8,
        tickLine: false,
        axisLine: { stroke: '#e0e0e0' }
    };

    // Tooltip for 王-shaped box-plot mode (min/median/max only)
    const WangTooltip = ({ active, payload }) => {
        if (!active || !payload || payload.length === 0) return null;
        const dataPoint = payload[0].payload || {};
        const toNum = (v) => (v == null ? null : Number(v));
        const fmt = (v) => (v == null ? '-' : toNum(v).toFixed(2));
        const median = toNum(dataPoint.median);
        const vmin = toNum(dataPoint.min);
        const vmax = toNum(dataPoint.max);
        return (
            <div style={{ background: 'rgba(255,255,255,0.95)', border: '1px solid #e0e0e0', borderRadius: 6, padding: '8px 10px', fontSize: 12 }}>
                <div>Min: {fmt(vmin)}</div>
                <div>Median: {fmt(median)}</div>
                <div>Max: {fmt(vmax)}</div>
            </div>
        );
    };

    // Custom median marker: short horizontal bar at the median level
    const MedianBarDot = (props) => {
        const { cx, cy } = props;
        if (cx == null || cy == null) return null;
        const halfWidth = 10;
        return (
            <g>
                <line x1={cx - halfWidth} x2={cx + halfWidth} y1={cy} y2={cy} stroke="#ff7300" strokeWidth={2} />
            </g>
        );
    };

    // Custom legend for the box-plot (王字形) mode
    const WangLegend = () => {
        const itemStyle = { display: 'flex', alignItems: 'center', marginRight: 16 };
        const rowStyle = { display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' };
        return (
            <div style={{ padding: '6px 0', fontSize: 14, lineHeight: 1.2, textAlign: 'center' }}>
                <div style={rowStyle}>
                    <div style={itemStyle}>
                        <span style={{ display: 'inline-block', width: 14, height: 10, background: '#82ca9d', opacity: 0.5, border: '1px solid #82ca9d', marginRight: 6 }} />
                        <span>IQR (Q1–Q3)</span>
                    </div>
                    <div style={itemStyle}>
                        <span style={{ display: 'inline-block', width: 14, height: 0, borderBottom: '2px solid #1976d2', marginRight: 6 }} />
                        <span>Whisker (Min–Max)</span>
                    </div>
                    <div style={itemStyle}>
                        <span style={{ display: 'inline-block', width: 14, height: 0, borderBottom: '2px solid #ff7300', marginRight: 6 }} />
                        <span>Median</span>
                    </div>
                </div>
            </div>
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

            {/* Toggle between line chart and quartile chart + quartile target selector */}
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <button
                    onClick={() => setChartMode(prev => prev === 'line' ? 'quartile' : 'line')}
                    style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        backgroundColor: '#1976d2',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                >
                    {chartMode === 'line' ? 'Switch to Quartile' : 'Switch to Line'}
                </button>
                {chartMode === 'quartile' && (
                    <select
                        value={selectedQuartileTarget}
                        onChange={(e) => setSelectedQuartileTarget(e.target.value)}
                        style={{ padding: '6px 8px' }}
                        aria-label="Quartile target"
                    >
                        <option value="Overall">Overall</option>
                        {courseNames.map(name => (
                            <option key={name} value={name}>{name}</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Checkboxes only for line mode; hidden in quartile mode to reduce clutter */}
            {chartMode === 'line' && (
                <div style={{marginBottom: 8}}>
                    {allLines.map((line) => (
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
            )}

            {/* Chart area */}
            <ResponsiveContainer width="100%" height={320}>
                {chartMode === 'line' ? (
                    <ComposedChart data={chartData} margin={{top: 10, right: 60, left: 0, bottom: 50}}>
                        <XAxis {...xAxisProps} />
                        <YAxis domain={[0, 5]} tickCount={6} tickFormatter={() => ''} />
                        <Tooltip />
                        {/* Legend hidden in quartile mode to avoid clutter */}

                        {/* Overall rating trend line */}
                        {selectedLines.includes('Overall') && (
                            <Line
                                type="linear"
                                dataKey="Overall"
                                stroke="#000"
                                strokeWidth={2}
                                dot={{ r: 3, fill: '#000', stroke: 'none' }}
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
                                    dot={{ r: 3, fill: colors[(idx + 1) % colors.length], stroke: 'none' }}
                                />
                            ) : null
                        ))}
                    </ComposedChart>
                ) : (
                    <ComposedChart data={chartData.map((d, i) => {
                        // Choose data source: overall or a specific course's distribution
                        const hasCourseTarget = (selectedQuartileTarget && selectedQuartileTarget !== 'Overall' && courses_quartiles && courses_quartiles[selectedQuartileTarget]);
                        const target = hasCourseTarget ? courses_quartiles[selectedQuartileTarget] : overall_quartiles;
                        if (!target) return d;
                        const q1 = target.q1 ? target.q1[i] : null;
                        const q3 = target.q3 ? target.q3[i] : null;
                        const median = target.median ? target.median[i] : null;
                        const vmin = target.min ? target.min[i] : null;
                        const vmax = target.max ? target.max[i] : null;
                        const errLow = (median != null && vmin != null) ? Math.max(0, Number(median) - Number(vmin)) : null;
                        const errHigh = (median != null && vmax != null) ? Math.max(0, Number(vmax) - Number(median)) : null;
                        return {
                            ...d,
                            q1,
                            q3,
                            iqr: (q1 != null && q3 != null) ? Math.max(0, Number(q3) - Number(q1)) : null,
                            median,
                            min: vmin,
                            max: vmax,
                            errY: (errLow != null && errHigh != null) ? [errLow, errHigh] : null,
                        };
                    })} margin={{top: 10, right: 60, left: 0, bottom: 50}}>
                        <XAxis {...xAxisProps} />
                        <YAxis domain={[0, 5]} tickCount={6} />
                        <Tooltip content={<WangTooltip />} />
                        <Legend content={<WangLegend />} verticalAlign="bottom" align="center" wrapperStyle={{ paddingTop: 8 }} />

                        {/* IQR box (Q1–Q3) */}
                        <Bar dataKey="q1" stackId="iqr" fill="transparent" stroke="transparent" barSize={26} name="Q1" />
                        <Bar dataKey="iqr" stackId="iqr" fill="#82ca9d" fillOpacity={0.5} barSize={26} name="IQR (Q1–Q3)" />

                        {/* Draw "王" glyph per year: vertical whisker (min–max) + middle horizontal bar at median */}
                        <Scatter dataKey="median" fill="transparent" name="Box (Min–Median–Max)">
                            <ErrorBar dataKey="errY" direction="y" width={16} stroke="#1976d2" strokeWidth={2} />
                        </Scatter>
                        <Line type="linear" dataKey="median" stroke="none" dot={<MedianBarDot />} name="Median" />
                    </ComposedChart>
                )}
            </ResponsiveContainer>
        </div>
    );
}
