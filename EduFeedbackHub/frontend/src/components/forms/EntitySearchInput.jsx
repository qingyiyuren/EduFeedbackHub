/**
 * This component is a React input with autocomplete for searching entities (e.g. universities, colleges).
 */


import React, {useState, useEffect, useRef} from 'react';

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
                                              displayFields,                            // Optional fields to show in suggestion
                                              parentInfo = {},                          // Parent entity context, e.g., { universityId: 1 }
                                          }) {
    const config = entityConfig[entityType] || entityConfig.university;
    const finalDisplayFields = displayFields || config.defaultDisplayFields;

    const [query, setQuery] = useState('');               // User input value
    const [suggestions, setSuggestions] = useState([]);   // Search results
    const [showSuggestions, setShowSuggestions] = useState(false); // Dropdown visibility
    const [activeIndex, setActiveIndex] = useState(-1);   // Highlighted suggestion
    const [isFocused, setIsFocused] = useState(false);    // Input focus status

    const containerRef = useRef(null);                    // DOM ref to detect outside clicks
    const listRefs = useRef([]);                          // Refs to suggestion items

    // Construct full search API URL with query and parent params
    const buildApiUrl = () => {
        const url = new URL(config.apiEndpoint, window.location.origin);
        url.searchParams.set('q', query); // Add query string
        if (config.parentEntityType && parentInfo[`${config.parentEntityType}Id`]) {
            url.searchParams.set(config.parentEntityParam, parentInfo[`${config.parentEntityType}Id`]); // Add parent param
        }
        return url.toString();
    };

    // Fetch suggestions when query, focus or parent info changes
    useEffect(() => {
        if (!query.trim() || !isFocused) {
            setSuggestions([]);               // Clear if input empty or blurred
            setShowSuggestions(false);
            setActiveIndex(-1);
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
                setSuggestions(data[config.responseKey] || []); // Set suggestions
                setShowSuggestions(true);
                setActiveIndex(-1);
            })
            .catch(() => {
                setSuggestions([]);           // On error, clear all
                setShowSuggestions(false);
                setActiveIndex(-1);
            });
    }, [query, parentInfo, entityType]);

    // Scroll to highlighted suggestion when it changes
    useEffect(() => {
        if (activeIndex >= 0 && listRefs.current[activeIndex]) {
            listRefs.current[activeIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [activeIndex]);

    // Handle keyboard navigation
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
        if (onSelect) onSelect(entity);    // Callback
    };

    // Click outside to close dropdown
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


    // Component UI
    return (
        <div style={{position: 'relative'}} ref={containerRef}>
            <h3>Search for {config.displayName}</h3>

            <input
                value={query}
                onChange={e => setQuery(e.target.value)}              // Update input value
                placeholder={`Search ${config.displayName.toLowerCase()} by name`}
                onKeyDown={handleKeyDown}                             // Keyboard handler
                onFocus={() => setIsFocused(true)}                   // Show dropdown on focus
                onBlur={() => setIsFocused(false)}                   // Hide on blur
                style={{width: '100%', padding: '8px'}}
                aria-autocomplete="list"
                aria-controls={`${entityType}-suggestions`}
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            />

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
                                    {entity[field]}
                                    {idx < finalDisplayFields.length - 1 ? ', ' : ''}
                                </span>
                            ))}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
