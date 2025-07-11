/**
 * A React component that provides a text input with autocomplete functionality
 * for searching universities by name. As the user types, it queries the backend
 * API to fetch matching university suggestions and displays them in a dropdown.
 */

import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';

export default function UniversitySearchInput({
    onSelect,               // Callback function when a suggestion is selected, receives the selected entity object
    renderOption,           // Optional function to customize rendering of each suggestion, receives the entity object, returns JSX
    displayFields = ['name', 'region'], // Default fields of the entity to display in suggestions (e.g., university name and region)
    autoNavigate = true,    // Whether to automatically navigate to the detail page upon selection, default is true
}) {
    // Entity type and display name used throughout the component
    const entityType = 'university';
    const entityDisplayName = 'University';

    // State for the current input query string
    const [query, setQuery] = useState('');
    // List of suggestions fetched from the backend API
    const [suggestions, setSuggestions] = useState([]);
    // Whether the suggestions dropdown is visible
    const [showSuggestions, setShowSuggestions] = useState(false);
    // Index of the currently highlighted suggestion for keyboard navigation (-1 means none)
    const [activeIndex, setActiveIndex] = useState(-1);

    // React Router hook to programmatically navigate pages
    const navigate = useNavigate();

    // Ref for the container div to detect outside clicks and close dropdown
    const containerRef = useRef(null);
    // Refs for each suggestion list item DOM element, used to scroll highlighted item into view
    const listRefs = useRef([]);

    /**
     * Effect hook triggered whenever `query` changes:
     * - If query is empty or whitespace only, clear suggestions and hide dropdown.
     * - Otherwise, fetch suggestions from backend API `/api/university/search/` with encoded query param.
     * - Upon successful fetch, update the suggestions list and show dropdown.
     * - On fetch failure, clear and hide suggestions.
     */
    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            setActiveIndex(-1);
            return;
        }

        fetch(`/api/university/search/?q=${encodeURIComponent(query)}`)
            .then((res) => res.json())
            .then((data) => {
                // Expecting backend response format { universities: [...] }
                setSuggestions(data.universities || []);
                setShowSuggestions(true);
                setActiveIndex(-1);
            })
            .catch(() => {
                setSuggestions([]);
                setShowSuggestions(false);
                setActiveIndex(-1);
            });
    }, [query]);

    /**
     * Handles selection of a suggestion item:
     * - Sets the input query to the selected entity's name.
     * - Hides the suggestion dropdown and resets the active highlight.
     * - Calls the onSelect callback if provided.
     * - Otherwise, if autoNavigate is true, navigates to the selected entity's detail page.
     */
    const handleSelect = (entity) => {
        setQuery(entity.name || '');
        setShowSuggestions(false);
        setActiveIndex(-1);
        if (onSelect) {
            onSelect(entity);
        } else if (autoNavigate) {
            navigate(`/university/${entity.id}`);
        }
    };

    /**
     * Effect hook triggered whenever activeIndex changes:
     * Automatically scrolls the currently highlighted suggestion into view smoothly,
     * so that keyboard navigation keeps the highlighted item visible.
     */
    useEffect(() => {
        if (activeIndex >= 0 && listRefs.current[activeIndex]) {
            listRefs.current[activeIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [activeIndex]);

    /**
     * Handles keyboard navigation inside the input field:
     * - ArrowDown: moves the highlight down, cycles to top after last.
     * - ArrowUp: moves the highlight up, cycles to bottom after first.
     * - Enter: selects the currently highlighted suggestion or, if only one suggestion is available, selects it directly.
     * - Escape: closes the suggestion dropdown and clears highlight.
     */
    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex((i) => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIndex >= 0 && activeIndex < suggestions.length) {
                handleSelect(suggestions[activeIndex]);
            } else if (suggestions.length === 1) {
                handleSelect(suggestions[0]);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setActiveIndex(-1);
        }
    };

    /**
     * Effect hook to listen for clicks outside the component container,
     * in order to close the suggestion dropdown when clicking elsewhere on the page.
     */
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    /**
     * Default rendering function for each suggestion option:
     * Iterates over displayFields array and renders the corresponding entity field values,
     * separated by commas.
     */
    const defaultRenderOption = (entity) => {
        return displayFields.map((field, idx) => (
            <span key={idx}>
                {entity[field]}
                {idx < displayFields.length - 1 ? ', ' : ''}
            </span>
        ));
    };

    return (
        <div style={{position: 'relative'}} ref={containerRef}>
            {/* Title above the input field */}
            <h3>Search a {entityDisplayName}</h3>
            <input
                value={query}                         // Controlled input bound to query state
                onChange={(e) => setQuery(e.target.value)} // Update query state on input change
                placeholder={`Search ${entityDisplayName.toLowerCase()} by name`} // Input placeholder text
                onKeyDown={handleKeyDown}             // Keyboard event handler for navigation
                style={{width: '100%', padding: '8px'}}
                aria-autocomplete="list"
                aria-controls={`${entityType}-suggestions`}
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            />
            {/* Suggestion dropdown, only rendered when showSuggestions is true */}
            {showSuggestions && (
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
                    {suggestions.length > 0 ? (
                        // Map over suggestions and render each as a list item
                        suggestions.map((entity, index) => (
                            <li
                                key={entity.id}
                                id={`suggestion-${index}`}
                                ref={(el) => (listRefs.current[index] = el)} // Save DOM ref for scrolling
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: index === activeIndex ? '#bde4ff' : 'white', // Highlight current
                                }}
                                onMouseDown={() => handleSelect(entity)}  // Select suggestion on mouse click
                                onMouseEnter={() => setActiveIndex(index)} // Highlight suggestion on hover
                            >
                                {/* Render suggestion with custom or default renderer */}
                                {renderOption ? renderOption(entity) : defaultRenderOption(entity)}
                            </li>
                        ))
                    ) : (
                        // Show message if no suggestions found
                        <li style={{padding: '8px', color: '#999'}}>
                            Sorry, no {entityDisplayName.toLowerCase()}s found.
                            <br/>
                            You can add one below.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
}
