/**
 * This component allows users to search for entities with autocomplete suggestions.
 * Parent entity filtering and custom display fields are supported.
 */


import React, {useState, useEffect, useRef} from 'react'; // Import React and hooks
import { formatEntityName } from '../../utils/textUtils.js'; // Import text formatting utilities

// Configuration for each entity type
const entityConfig = {
    university: {
        displayName: 'University',
        apiEndpoint: '/api/university/search/',       // Search API endpoint
        responseKey: 'universities',                  // Response key in JSON
        defaultDisplayFields: ['name', 'region'],     // Fields to display in dropdown
        parentEntityType: null,                       // No parent for university
    },
    college: {
        displayName: 'College',
        apiEndpoint: '/api/college/search/',
        responseKey: 'colleges',
        defaultDisplayFields: ['name'],
        parentEntityType: 'university',               // College belongs to a university
        parentEntityParam: 'university_id',           // URL param key
    },
    school: {
        displayName: 'School',
        apiEndpoint: '/api/school/search/',
        responseKey: 'schools',
        defaultDisplayFields: ['name'],
        parentEntityType: 'college',
        parentEntityParam: 'college_id',
    },
    module: {
        displayName: 'Module',
        apiEndpoint: '/api/module/search/',
        responseKey: 'modules',
        defaultDisplayFields: ['name'],
        parentEntityType: 'school',
        parentEntityParam: 'school_id',
    },
    lecturer: {
        displayName: 'Lecturer',
        apiEndpoint: '/api/lecturer/search/',
        responseKey: 'lecturers',
        defaultDisplayFields: ['name'],
        parentEntityType: null,
    },
};

export default function EntitySearchInput({
                                              entityType = 'university',                // Type of entity to search
                                              onSelect,                                 // Callback when suggestion selected
                                              onNoResults,                              // Callback when no results found
                                              displayFields,                            // Optional fields to show in suggestion
                                              parentInfo = {},                          // Parent entity context, e.g., { universityId: 1 }
                                              autoNavigate = true,                      // Whether to auto-navigate on select
                                              placeholder = '',                         // Custom placeholder
                                          }) {
    const config = entityConfig[entityType] || entityConfig.university; // Get config for current entity type
    const finalDisplayFields = displayFields || config.defaultDisplayFields; // Fields to display in dropdown

    // State for user input value
    const [query, setQuery] = useState('');
    // State for search results
    const [suggestions, setSuggestions] = useState([]);
    // State for dropdown visibility
    const [showSuggestions, setShowSuggestions] = useState(false);
    // State for highlighted suggestion
    const [activeIndex, setActiveIndex] = useState(-1);
    // State for input focus
    const [isFocused, setIsFocused] = useState(false);
    // State for showing no results message
    const [showNoResults, setShowNoResults] = useState(false);
    // State for query that had no results
    const [noResultsQuery, setNoResultsQuery] = useState('');

    // Ref for container to detect outside clicks
    const containerRef = useRef(null);
    // Refs for suggestion items
    const listRefs = useRef([]);

    // Build full search API URL with query and parent params
    const buildApiUrl = () => {
        const url = new URL(config.apiEndpoint, window.location.origin);
        url.searchParams.set('q', query); // Add query string
        if (config.parentEntityType && parentInfo[`${config.parentEntityType}Id`]) {
            url.searchParams.set(config.parentEntityParam, parentInfo[`${config.parentEntityType}Id`]); // Add parent param
        }
        return url.toString();
    };

    // Effect: fetch suggestions when query, focus or parent info changes
    useEffect(() => {
        if (!query.trim() || !isFocused) {
            setSuggestions([]);               // Clear if input empty or blurred
            setShowSuggestions(false);
            setActiveIndex(-1);
            // Clear selected entity when query is empty
            if (!query.trim() && onSelect) {
                onSelect(null);
            }
            return;
        }
        if (config.parentEntityType && !parentInfo[`${config.parentEntityType}Id`]) {
            setSuggestions([]);               // Block if parent ID is missing
            setShowSuggestions(false);
            setActiveIndex(-1);
            return;
        }

        fetch(buildApiUrl())                  // Perform API call
            .then(res => res.json())
            .then(data => {
                const results = data[config.responseKey] || [];
                setSuggestions(results); // Set suggestions
                setShowSuggestions(true);
                setActiveIndex(-1);
                // If no results and query is not empty, show no results message
                if (results.length === 0 && query.trim()) {
                    setShowNoResults(true);
                    setNoResultsQuery(query.trim());
                } else {
                    setShowNoResults(false);
                }
            })
            .catch(() => {
                setSuggestions([]);           // On error, clear all
                setShowSuggestions(false);
                setActiveIndex(-1);
                setShowNoResults(false);
            });
    }, [query, parentInfo, entityType]);

    // Effect: scroll to highlighted suggestion when it changes
    useEffect(() => {
        if (activeIndex >= 0 && listRefs.current[activeIndex]) {
            listRefs.current[activeIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [activeIndex]);

    // Handle keyboard navigation in suggestions
    const handleKeyDown = (e) => {
        if (!showSuggestions) return;
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => (i + 1) % suggestions.length); // Move down
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length); // Move up
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
                handleSelect(suggestions[activeIndex]); // Select active
            } else if (suggestions.length === 1) {
                handleSelect(suggestions[0]);           // Auto-select if only one
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false); // Close dropdown
            setActiveIndex(-1);
        }
    };

    // Select a suggestion (on mouse or keyboard)
    const handleSelect = (entity) => {
        setQuery(entity.name || '');       // Fill input
        setShowSuggestions(false);         // Close dropdown
        setActiveIndex(-1);
        setIsFocused(false);               // Blur
        if (onSelect) onSelect(entity);    // Always call onSelect, even if same entity
    };

    // When input value changes, if cleared, also clear selection in parent
    const handleInputChange = (e) => {
        setQuery(e.target.value);
        if (e.target.value === '' && onSelect) {
            onSelect(null); // Notify parent to clear selection
        }
    };

    // Effect: click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Render the search input and suggestions dropdown
    return (
        <div style={{position: 'relative'}} ref={containerRef}>
            <input
                value={query}
                onChange={handleInputChange} // Update input value and clear selection if empty
                placeholder={placeholder || `Search ${config.displayName.toLowerCase()} by name`}
                onKeyDown={handleKeyDown}                             // Keyboard handler
                onFocus={() => setIsFocused(true)}                   // Show dropdown on focus
                onBlur={() => setIsFocused(false)}                   // Hide on blur
                style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
                aria-autocomplete="list"
                aria-controls={`${entityType}-suggestions`}
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            />

            {/* Suggestions dropdown */}
            {showSuggestions && isFocused && suggestions.length > 0 && (
                <ul
                    id={`${entityType}-suggestions`}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #ccc',
                        maxHeight: 200,
                        overflowY: 'auto',
                        margin: 0,
                        padding: 0,
                        listStyle: 'none',
                        zIndex: 1000,
                    }}
                >
                    {suggestions.map((entity, index) => (
                        <li
                            key={entity.id}
                            id={`suggestion-${index}`}
                            ref={el => (listRefs.current[index] = el)} // Track ref
                            style={{
                                padding: '8px',
                                cursor: 'pointer',
                                backgroundColor: index === activeIndex ? '#bde4ff' : 'white',
                            }}
                            onMouseDown={() => handleSelect(entity)}  // Click select
                            onMouseEnter={() => setActiveIndex(index)} // Hover highlight
                        >
                            {finalDisplayFields.map((field, idx) => (
                                <span key={idx}>
                                    {formatEntityName(entity[field])}
                                    {idx < finalDisplayFields.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </li>
                    ))}
                </ul>
            )}

            {/* No Results Message */}
            {showNoResults && isFocused && query.trim() && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    padding: '4px 8px',
                    marginTop: '2px',
                    fontSize: '12px',
                    color: '#dc3545',
                    zIndex: 1000,
                }}>
                    No {config.displayName.toLowerCase()} found for "{noResultsQuery}". You can add it.
                </div>
            )}
        </div>
    );
}
