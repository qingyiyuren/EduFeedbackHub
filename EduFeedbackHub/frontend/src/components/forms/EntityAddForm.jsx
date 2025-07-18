/**
 * This component allows users to add a new entity (university, college, school, etc.).
 * It provides name/region suggestions and supports parent entity linkage.
 */

import React, {useState, useEffect, useRef} from 'react'; // Import React and hooks
import {useNavigate} from 'react-router-dom'; // Import router hook

// Configuration of API endpoints, display names, parent relations, and region requirement for each entity type
const entityConfig = {
    university: {
        displayName: 'University',
        apiSearchEndpoint: '/api/university/search/',   // Search existing universities
        apiAddEndpoint: '/api/university/add/',         // Add new university
        responseKey: 'universities',                     // Key in API response data
        requireRegion: true,                             // University requires region field
        parentEntityType: null,                          // University has no parent entity
        parentEntityParam: null,
    },
    college: {
        displayName: 'College',
        apiSearchEndpoint: '/api/college/search/',
        apiAddEndpoint: '/api/college/add/',
        responseKey: 'colleges',
        requireRegion: false,
        parentEntityType: 'university',                  // College must link to university
        parentEntityParam: 'university_id',
    },
    school: {
        displayName: 'School',
        apiSearchEndpoint: '/api/school/search/',
        apiAddEndpoint: '/api/school/add/',
        responseKey: 'schools',
        requireRegion: false,
        parentEntityType: 'college',                      // School must link to college
        parentEntityParam: 'college_id',
    },
    module: {
        displayName: 'Module',
        apiSearchEndpoint: '/api/module/search/',
        apiAddEndpoint: '/api/module/add/',
        responseKey: 'modules',
        requireRegion: false,
        parentEntityType: 'school',                       // Module linked to school
        parentEntityParam: 'school_id',
    },
    lecturer: {
        displayName: 'Lecturer',
        apiSearchEndpoint: '/api/lecturer/search/',
        apiAddEndpoint: '/api/lecturer/add/',
        responseKey: 'lecturers',
        requireRegion: false,
        parentEntityType: null,
        parentEntityParam: null,
    },
};

export default function EntityAddForm({
                                          entityType = 'university', // Type of entity to add
                                          onAddSuccess,              // Callback on successful add
                                          onAddExists,               // Callback if entity already exists
                                          requireRegion,             // Override for region requirement
                                          parentInfo = {},           // Parent entity info
                                      }) {
    // Current entity configuration
    const config = entityConfig[entityType] || entityConfig.university;
    // Final region required flag (override if provided)
    const finalRequireRegion = requireRegion !== undefined ? requireRegion : config.requireRegion;

    // State for entity name input
    const [name, setName] = useState('');
    // State for region input
    const [region, setRegion] = useState('');
    // Name suggestion list
    const [nameSuggestions, setNameSuggestions] = useState([]);
    // Region suggestion list
    const [regionSuggestions, setRegionSuggestions] = useState([]);
    // Show/hide name suggestions dropdown
    const [showNameSuggestions, setShowNameSuggestions] = useState(false);
    // Show/hide region suggestions dropdown
    const [showRegionSuggestions, setShowRegionSuggestions] = useState(false);
    // Currently highlighted name suggestion index
    const [nameActiveIndex, setNameActiveIndex] = useState(-1);
    // Currently highlighted region suggestion index
    const [regionActiveIndex, setRegionActiveIndex] = useState(-1);
    // Detected existing entity if input matches exactly
    const [existingEntity, setExistingEntity] = useState(null);

    const navigate = useNavigate(); // Router navigation

    // Refs for input containers to detect outside clicks for closing dropdowns
    const nameRef = useRef(null);
    const regionRef = useRef(null);
    // Refs for suggestion list items to scroll active item into view
    const nameListRefs = useRef([]);
    const regionListRefs = useRef([]);

    /**
     * Build search API URL including query and parent entity parameter if applicable
     * @param {string} query - current search query string
     * @returns {string} full search API URL
     */
    const buildSearchApiUrl = (query) => {
        const url = new URL(config.apiSearchEndpoint, window.location.origin);
        url.searchParams.set('q', query);
        // Add parent entity ID parameter if needed
        if (config.parentEntityType && parentInfo[config.parentEntityType]?.id) {
            url.searchParams.set(config.parentEntityParam, parentInfo[config.parentEntityType].id);
        }
        return url.toString();
    };

    /**
     * Effect to fetch name suggestions on name or related input change.
     * Clears suggestions if input empty or missing required parent entity.
     * Detects exact matches to flag duplicates.
     */
    useEffect(() => {
        if (!name.trim()) {
            setNameSuggestions([]);
            setShowNameSuggestions(false);
            setExistingEntity(null);
            return;
        }
        if (config.parentEntityType && !parentInfo[config.parentEntityType]?.id) {
            setNameSuggestions([]);
            setShowNameSuggestions(false);
            setExistingEntity(null);
            return;
        }
        fetch(buildSearchApiUrl(name.trim()))
            .then(res => res.json())
            .then(data => {
                const suggestions = data[config.responseKey] || [];
                setNameSuggestions(suggestions);
                setShowNameSuggestions(true);
                setNameActiveIndex(-1);
                // Find exact match of name and region if region required
                const matched = suggestions.find(item =>
                    item.name.toLowerCase() === name.trim().toLowerCase() &&
                    (!finalRequireRegion || (item.region && item.region.toLowerCase() === region.trim().toLowerCase()))
                );
                setExistingEntity(matched || null);
            })
            .catch(() => {
                setNameSuggestions([]);
                setShowNameSuggestions(false);
                setExistingEntity(null);
            });
    }, [name, region, finalRequireRegion, parentInfo, entityType]);

    /**
     * Effect to fetch region suggestions when region input changes,
     * only if region is required and input non-empty.
     */
    useEffect(() => {
        if (!finalRequireRegion || !region.trim()) {
            setRegionSuggestions([]);
            setShowRegionSuggestions(false);
            return;
        }
        fetch(`/api/region/search/?q=${encodeURIComponent(region.trim())}`)
            .then(res => res.json())
            .then(data => {
                setRegionSuggestions(data.regions || []);
                setShowRegionSuggestions(true);
                setRegionActiveIndex(-1);
            })
            .catch(() => {
                setRegionSuggestions([]);
                setShowRegionSuggestions(false);
            });
    }, [region, finalRequireRegion]);

    /**
     * Scroll the active name suggestion item into view when index changes
     */
    useEffect(() => {
        if (nameActiveIndex >= 0 && nameListRefs.current[nameActiveIndex]) {
            nameListRefs.current[nameActiveIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [nameActiveIndex]);

    /**
     * Scroll the active region suggestion item into view when index changes
     */
    useEffect(() => {
        if (regionActiveIndex >= 0 && regionListRefs.current[regionActiveIndex]) {
            regionListRefs.current[regionActiveIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [regionActiveIndex]);

    /**
     * Keyboard handler for name input:
     * - ArrowDown/ArrowUp to navigate suggestions cyclically
     * - Enter to select active suggestion
     * - Escape to close suggestions
     */
    const handleNameKeyDown = (e) => {
        if (!showNameSuggestions) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setNameActiveIndex(i => (i + 1) % nameSuggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setNameActiveIndex(i => (i - 1 + nameSuggestions.length) % nameSuggestions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (nameActiveIndex >= 0 && nameActiveIndex < nameSuggestions.length) {
                const selected = nameSuggestions[nameActiveIndex];
                setName(selected.name);
                if (finalRequireRegion) setRegion(selected.region || '');
                setShowNameSuggestions(false);
                setExistingEntity(selected);
            }
        } else if (e.key === 'Escape') {
            setShowNameSuggestions(false);
            setNameActiveIndex(-1);
        }
    };

    /**
     * Keyboard handler for region input, similar to name input
     */
    const handleRegionKeyDown = (e) => {
        if (!showRegionSuggestions) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setRegionActiveIndex(i => (i + 1) % regionSuggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setRegionActiveIndex(i => (i - 1 + regionSuggestions.length) % regionSuggestions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (regionActiveIndex >= 0 && regionActiveIndex < regionSuggestions.length) {
                setRegion(regionSuggestions[regionActiveIndex]);
                setShowRegionSuggestions(false);
            }
        } else if (e.key === 'Escape') {
            setShowRegionSuggestions(false);
            setRegionActiveIndex(-1);
        }
    };

    /**
     * When clicking on a name suggestion, fill inputs and close suggestions,
     * mark existing entity for duplication
     */
    const selectNameSuggestion = (item) => {
        setName(item.name);
        if (finalRequireRegion) setRegion(item.region || '');
        setShowNameSuggestions(false);
        setExistingEntity(item);
    };

    /**
     * When clicking on a region suggestion, fill region input and close suggestions
     */
    const selectRegionSuggestion = (r) => {
        setRegion(r);
        setShowRegionSuggestions(false);
    };

    /**
     * Listen for global click events and close suggestions if clicked outside
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (nameRef.current && !nameRef.current.contains(event.target)) {
                setShowNameSuggestions(false);
                setNameActiveIndex(-1);
            }
            if (regionRef.current && !regionRef.current.contains(event.target)) {
                setShowRegionSuggestions(false);
                setRegionActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * Form submit handler:
     * 1. Validate required fields
     * 2. Check duplicate entity and prompt navigation
     * 3. Call backend API to add new entity
     * 4. On success, call callback and reset state
     */
    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate required inputs
        if (!name.trim() || (finalRequireRegion && !region.trim())) {
            alert(`Please enter the ${config.displayName} name${finalRequireRegion ? ' and region' : ''}.`);
            return;
        }

        // Validate parent entity selected if needed
        if (config.parentEntityType && !parentInfo[config.parentEntityType]?.id) {
            alert(`Please select the parent ${config.parentEntityType} before adding a ${config.displayName.toLowerCase()}.`);
            return;
        }

        // Duplicate exists: confirm navigation
        if (existingEntity) {
            const confirmed = window.confirm(
                `This ${config.displayName.toLowerCase()} already exists: ${existingEntity.name}${finalRequireRegion ? ` (${existingEntity.region})` : ''}\n\nWould you like to view it?`
            );
            if (confirmed) {
                navigate(`/${entityType}/${existingEntity.id}`);
            }
            onAddExists && onAddExists(existingEntity);
            return;
        }

        // Build payload for POST
        const payload = {name: name.trim()};
        if (finalRequireRegion) payload.region = region.trim();
        if (config.parentEntityType && parentInfo[config.parentEntityType]?.id) {
            payload[config.parentEntityParam] = parentInfo[config.parentEntityType].id;
        }

        // POST to add entity
        fetch(config.apiAddEndpoint, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload),
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    onAddSuccess && onAddSuccess(data);
                    // Reset form state
                    setName('');
                    setRegion('');
                    setExistingEntity(null);
                    setNameSuggestions([]);
                    setRegionSuggestions([]);
                }
            })
            .catch(() => alert(`Failed to add ${config.displayName.toLowerCase()}.`));
    };

    // Render form UI with parent entity info, inputs, suggestions, duplicate warnings, and submit button
    return (
        <form onSubmit={handleSubmit} style={{marginTop: 20, maxWidth: 400}}>
            <h3>Add New {config.displayName}</h3>

            {/* Show parent entity if applicable */}
            {config.parentEntityType && parentInfo[config.parentEntityType]?.name && (
                <p>
                    Parent {config.parentEntityType}: <strong>{parentInfo[config.parentEntityType].name}</strong>
                </p>
            )}

            {/* Name input and suggestions */}
            <div style={{position: 'relative', marginBottom: 20}} ref={nameRef}>
                <label htmlFor={`${entityType}-name`}>{config.displayName} Name:</label>
                <input
                    id={`${entityType}-name`}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    autoComplete="off"
                    style={{width: '100%', padding: 6, fontSize: 16}}
                    placeholder={`Enter ${config.displayName.toLowerCase()} name`}
                />
                {showNameSuggestions && nameSuggestions.length > 0 && (
                    <ul
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            maxHeight: 150,
                            overflowY: 'auto',
                            backgroundColor: 'white',
                            border: '1px solid #ccc',
                            margin: 0,
                            padding: 0,
                            listStyle: 'none',
                            zIndex: 1000,
                        }}
                    >
                        {nameSuggestions.map((item, i) => (
                            <li
                                key={item.id}
                                ref={el => (nameListRefs.current[i] = el)}
                                onClick={() => selectNameSuggestion(item)}
                                onMouseEnter={() => setNameActiveIndex(i)}
                                style={{
                                    padding: '8px',
                                    backgroundColor: i === nameActiveIndex ? '#d8eaff' : 'white',
                                    cursor: 'pointer',
                                }}
                            >
                                {item.name}{finalRequireRegion && item.region ? ` (${item.region})` : ''}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Region input and suggestions if required */}
            {finalRequireRegion && (
                <div style={{position: 'relative', marginBottom: 20}} ref={regionRef}>
                    <label htmlFor={`${entityType}-region`}>Country or Region:</label>
                    <input
                        id={`${entityType}-region`}
                        type="text"
                        value={region}
                        onChange={e => setRegion(e.target.value)}
                        onKeyDown={handleRegionKeyDown}
                        autoComplete="off"
                        placeholder="Enter or select country or region"
                        style={{width: '100%', padding: 6, fontSize: 16}}
                    />
                    {showRegionSuggestions && regionSuggestions.length > 0 && (
                        <ul
                            style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                right: 0,
                                maxHeight: 150,
                                overflowY: 'auto',
                                backgroundColor: 'white',
                                border: '1px solid #ccc',
                                margin: 0,
                                padding: 0,
                                listStyle: 'none',
                                zIndex: 1000,
                            }}
                        >
                            {regionSuggestions.map((r, i) => (
                                <li
                                    key={i}
                                    ref={el => (regionListRefs.current[i] = el)}
                                    onClick={() => selectRegionSuggestion(r)}
                                    onMouseEnter={() => setRegionActiveIndex(i)}
                                    style={{
                                        padding: '8px',
                                        backgroundColor: i === regionActiveIndex ? '#d8eaff' : 'white',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {r}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* Duplicate entity warning with link */}
            {existingEntity && (
                <p style={{color: 'red'}}>
                    This {config.displayName.toLowerCase()} already exists:{' '}
                    <a href={`/${entityType}/${existingEntity.id}`} style={{ color: '#1976d2', textDecoration: 'underline' }}>
                        {existingEntity.name}
                        {finalRequireRegion && existingEntity.region ? ` (${existingEntity.region})` : ''}
                    </a>
                </p>
            )}

            {/* Submit button */}
            <button type="submit" style={{padding: '8px 16px'}}>
                Add {config.displayName}
            </button>
        </form>
    );
}
