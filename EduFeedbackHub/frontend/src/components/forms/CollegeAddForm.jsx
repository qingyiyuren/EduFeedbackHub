import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';

export default function CollegeAddForm({university, onAddSuccess, onAddExists}) {
    const entityType = 'college';
    const entityDisplayName = 'College';

    const [name, setName] = useState('');
    const [nameSuggestions, setNameSuggestions] = useState([]);
    const [showNameSuggestions, setShowNameSuggestions] = useState(false);
    const [nameActiveIndex, setNameActiveIndex] = useState(-1);
    const [existingEntity, setExistingEntity] = useState(null);

    const navigate = useNavigate();
    const nameRef = useRef(null);
    const nameListRefs = useRef([]);

    useEffect(() => {
        if (!name.trim()) {
            setNameSuggestions([]);
            setShowNameSuggestions(false);
            setExistingEntity(null);
            return;
        }
        fetch(`/api/college/search/?q=${encodeURIComponent(name.trim())}&university_id=${encodeURIComponent(university?.id || '')}`)
            .then(res => res.json())
            .then(data => {
                const suggestions = data.colleges || [];
                setNameSuggestions(suggestions);
                setShowNameSuggestions(true);
                setNameActiveIndex(-1);

                const matched = suggestions.find(
                    item => item.name.toLowerCase() === name.trim().toLowerCase()
                );
                setExistingEntity(matched || null);
            })
            .catch(() => {
                setNameSuggestions([]);
                setShowNameSuggestions(false);
                setExistingEntity(null);
            });
    }, [name, university]);

    useEffect(() => {
        if (nameActiveIndex >= 0 && nameListRefs.current[nameActiveIndex]) {
            nameListRefs.current[nameActiveIndex].scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
            });
        }
    }, [nameActiveIndex]);

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
                setShowNameSuggestions(false);
                setExistingEntity(selected);
            }
        } else if (e.key === 'Escape') {
            setShowNameSuggestions(false);
            setNameActiveIndex(-1);
        }
    };

    const selectNameSuggestion = (item) => {
        setName(item.name);
        setShowNameSuggestions(false);
        setExistingEntity(item);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (nameRef.current && !nameRef.current.contains(event.target)) {
                setShowNameSuggestions(false);
                setNameActiveIndex(-1);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) {
            alert(`Please enter ${entityDisplayName} name.`);
            return;
        }
        if (!university || !university.id) {
            alert(`University info is missing. Cannot add ${entityDisplayName.toLowerCase()}.`);
            return;
        }
        if (existingEntity) {
            if (window.confirm(
                `This ${entityDisplayName.toLowerCase()} already exists: ${existingEntity.name}. Go to its page?`
            )) {
                navigate(`/${entityType}/${existingEntity.id}`);
            }
            onAddExists && onAddExists(existingEntity);
            return;
        }

        fetch(`/api/college/add/`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: name.trim(),
                university_id: university.id,
            }),
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    onAddSuccess && onAddSuccess(data);
                    setName('');
                    setExistingEntity(null);
                    setNameSuggestions([]);
                }
            })
            .catch(() => alert(`Failed to add ${entityDisplayName.toLowerCase()}.`));
    };

    return (
        <form onSubmit={handleSubmit} style={{marginTop: 20, maxWidth: 400}}>
            <h3>Add a New {entityDisplayName}</h3>

            {university && university.name && (
                <p>
                    University: <strong>{university.name}</strong>
                </p>
            )}

            <div style={{position: 'relative', marginBottom: 20}} ref={nameRef}>
                <label htmlFor={`${entityType}-name`}>{entityDisplayName} Name:</label>
                <input
                    id={`${entityType}-name`}
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    autoComplete="off"
                    style={{width: '100%', padding: '8px', fontSize: 16}}
                    placeholder={`Enter ${entityDisplayName.toLowerCase()} name`}
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
                                {item.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {existingEntity && (
                <p style={{color: 'red'}}>
                    This {entityDisplayName.toLowerCase()} already exists:{' '}
                    <a href={`/${entityType}/${existingEntity.id}`}>
                        {existingEntity.name}
                    </a>
                </p>
            )}

            <button type="submit" style={{padding: '8px 16px'}}>
                Add {entityDisplayName}
            </button>
        </form>
    );
}
