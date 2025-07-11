import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';

export default function CollegeSearchInput({
                                               onSelect,
                                               renderOption,
                                               displayFields = ['name'],
                                               autoNavigate = true,
                                               universityId,
                                           }) {
    const entityType = 'college';
    const entityDisplayName = 'College';

    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    const navigate = useNavigate();
    const containerRef = useRef(null);
    const listRefs = useRef([]);

    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            setShowSuggestions(false);
            setActiveIndex(-1);
            return;
        }
        if (!universityId) {
            setSuggestions([]);
            setShowSuggestions(false);
            setActiveIndex(-1);
            return;
        }

        fetch(`/api/college/search/?q=${encodeURIComponent(query)}&university_id=${universityId}`)
            .then(res => res.json())
            .then(data => {
                setSuggestions(data.colleges || []);
                setShowSuggestions(true);
                setActiveIndex(-1);
            })
            .catch(() => {
                setSuggestions([]);
                setShowSuggestions(false);
                setActiveIndex(-1);
            });
    }, [query, universityId]);

    const handleSelect = (entity) => {
        setQuery(entity.name || '');
        setShowSuggestions(false);
        setActiveIndex(-1);
        if (onSelect) {
            onSelect(entity);
        } else if (autoNavigate) {
            navigate(`/${entityType}/${entity.id}`);
        }
    };

    useEffect(() => {
        if (activeIndex >= 0 && listRefs.current[activeIndex]) {
            listRefs.current[activeIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [activeIndex]);

    const handleKeyDown = (e) => {
        if (!showSuggestions) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveIndex(i => (i + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveIndex(i => (i - 1 + suggestions.length) % suggestions.length);
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

    const defaultRenderOption = (entity) => {
        return displayFields.map((field, idx) => (
            <span key={idx}>
                {entity[field]}
                {idx < displayFields.length - 1 ? ', ' : ''}
            </span>
        ));
    };

    return (
        <div style={{position: 'relative', maxWidth: 400}} ref={containerRef}>
            <h3>Search a {entityDisplayName}</h3>
            <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder={`Search ${entityDisplayName.toLowerCase()} by name`}
                onKeyDown={handleKeyDown}
                style={{width: '100%', padding: '8px', fontSize: 16}}
                aria-autocomplete="list"
                aria-controls={`${entityType}-suggestions`}
                aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            />
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
                        suggestions.map((entity, index) => (
                            <li
                                key={entity.id}
                                id={`suggestion-${index}`}
                                ref={el => (listRefs.current[index] = el)}
                                style={{
                                    padding: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: index === activeIndex ? '#bde4ff' : 'white',
                                }}
                                onMouseDown={() => handleSelect(entity)}
                                onMouseEnter={() => setActiveIndex(index)}
                            >
                                {renderOption ? renderOption(entity) : defaultRenderOption(entity)}
                            </li>
                        ))
                    ) : (
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
