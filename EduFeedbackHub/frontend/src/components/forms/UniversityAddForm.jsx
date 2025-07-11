/**
 * This component provides a form interface to add a new university.
 * It includes autocomplete suggestions for both university name and region,
 * with keyboard navigation support for the suggestion lists.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UniversityAddForm({
  onAddSuccess,    // Callback function called after successful addition, receives the new university data
  onAddExists,     // Callback function called when a duplicate university is detected, receives the existing university entity
  requireRegion = true,   // Whether the region field is required, default is true
}) {
  // Define entity type and display name for easier maintenance and reuse
  const entityType = 'university';
  const entityDisplayName = 'University';

  // State for the university name input
  const [name, setName] = useState('');
  // State for the region input
  const [region, setRegion] = useState('');
  // List of suggested names based on the current input
  const [nameSuggestions, setNameSuggestions] = useState([]);
  // List of suggested regions based on the current input
  const [regionSuggestions, setRegionSuggestions] = useState([]);
  // Whether to show the name suggestions dropdown
  const [showNameSuggestions, setShowNameSuggestions] = useState(false);
  // Whether to show the region suggestions dropdown
  const [showRegionSuggestions, setShowRegionSuggestions] = useState(false);
  // Index of the currently highlighted name suggestion (-1 means none)
  const [nameActiveIndex, setNameActiveIndex] = useState(-1);
  // Index of the currently highlighted region suggestion (-1 means none)
  const [regionActiveIndex, setRegionActiveIndex] = useState(-1);
  // Tracks if an existing university entity matches the input to prevent duplicates
  const [existingEntity, setExistingEntity] = useState(null);

  // Used for routing/navigation
  const navigate = useNavigate();

  // Refs to the wrapper elements of the name and region inputs for click outside detection
  const nameRef = useRef(null);
  const regionRef = useRef(null);
  // Refs for each suggestion item in the name and region suggestion lists, for scrolling highlighted items into view
  const nameListRefs = useRef([]);
  const regionListRefs = useRef([]);

  /**
   * Effect to listen for changes in the name input and perform autocomplete search:
   * - If the name is empty, clears suggestions and existing entity state.
   * - Otherwise, fetches matching university names from the backend.
   * - Checks if an exact match (name and optionally region) exists to mark as existing entity.
   */
  useEffect(() => {
    if (!name.trim()) {
      setNameSuggestions([]);
      setShowNameSuggestions(false);
      setExistingEntity(null);
      return;
    }

    fetch(`/api/university/search/?q=${encodeURIComponent(name.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        const suggestions = data.universities || [];
        setNameSuggestions(suggestions);
        setShowNameSuggestions(true);
        setNameActiveIndex(-1);

        // Find an exact match (name and region if required)
        const matched = suggestions.find((item) =>
          item.name.toLowerCase() === name.trim().toLowerCase() &&
          (!requireRegion || (item.region && item.region.toLowerCase() === region.trim().toLowerCase()))
        );
        setExistingEntity(matched || null);
      })
      .catch(() => {
        setNameSuggestions([]);
        setShowNameSuggestions(false);
        setExistingEntity(null);
      });
  }, [name, region, requireRegion]);

  /**
   * Effect to listen for changes in the region input and perform autocomplete search:
   * - If region is not required or empty, clears suggestions.
   * - Otherwise, fetches matching region suggestions from backend.
   */
  useEffect(() => {
    if (!requireRegion || !region.trim()) {
      setRegionSuggestions([]);
      setShowRegionSuggestions(false);
      return;
    }

    fetch(`/api/region/search/?q=${encodeURIComponent(region.trim())}`)
      .then((res) => res.json())
      .then((data) => {
        setRegionSuggestions(data.regions || []);
        setShowRegionSuggestions(true);
        setRegionActiveIndex(-1);
      })
      .catch(() => {
        setRegionSuggestions([]);
        setShowRegionSuggestions(false);
      });
  }, [region, requireRegion]);

  /**
   * Scroll the highlighted name suggestion into view whenever the active index changes
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
   * Scroll the highlighted region suggestion into view whenever the active index changes
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
   * Handle keyboard events on the name input:
   * - ArrowUp and ArrowDown keys change the highlighted suggestion index.
   * - Enter key selects the highlighted suggestion and fills the input.
   * - Escape key closes the suggestions dropdown.
   */
  const handleNameKeyDown = (e) => {
    if (!showNameSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setNameActiveIndex((i) => (i + 1) % nameSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setNameActiveIndex((i) => (i - 1 + nameSuggestions.length) % nameSuggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (nameActiveIndex >= 0 && nameActiveIndex < nameSuggestions.length) {
        const selected = nameSuggestions[nameActiveIndex];
        setName(selected.name);
        if (requireRegion) setRegion(selected.region || '');
        setShowNameSuggestions(false);
        setExistingEntity(selected);
      }
    } else if (e.key === 'Escape') {
      setShowNameSuggestions(false);
      setNameActiveIndex(-1);
    }
  };

  /**
   * Handle keyboard events on the region input with the same logic as name input
   */
  const handleRegionKeyDown = (e) => {
    if (!showRegionSuggestions) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setRegionActiveIndex((i) => (i + 1) % regionSuggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setRegionActiveIndex((i) => (i - 1 + regionSuggestions.length) % regionSuggestions.length);
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
   * When clicking on a name suggestion, fill the input fields and close the dropdown
   */
  const selectNameSuggestion = (item) => {
    setName(item.name);
    if (requireRegion) setRegion(item.region || '');
    setShowNameSuggestions(false);
    setExistingEntity(item);
  };

  /**
   * When clicking on a region suggestion, fill the region input and close the dropdown
   */
  const selectRegionSuggestion = (r) => {
    setRegion(r);
    setShowRegionSuggestions(false);
  };

  /**
   * Listen for clicks outside the input or suggestion dropdowns to close them
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
   * Handle form submission:
   * - Validate required fields
   * - If duplicate detected, confirm and redirect to existing university page
   * - Otherwise, send add request to backend
   * - On success, call onAddSuccess and reset inputs
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim() || (requireRegion && !region.trim())) {
      alert(`Please fill both ${entityDisplayName} name and region.`);
      return;
    }

    if (existingEntity) {
      if (
        window.confirm(
          `This ${entityDisplayName.toLowerCase()} already exists: ${existingEntity.name}${
            requireRegion ? ` (${existingEntity.region})` : ''
          }. Go to its page?`
        )
      ) {
        navigate(`/university/${existingEntity.id}`);
      }
      onAddExists && onAddExists(existingEntity);
      return;
    }

    const payload = { name: name.trim() };
    if (requireRegion) payload.region = region.trim();

    fetch(`/api/university/add/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
        } else {
          onAddSuccess && onAddSuccess(data);
          setName('');
          setRegion('');
          setExistingEntity(null);
          setNameSuggestions([]);
          setRegionSuggestions([]);
        }
      })
      .catch(() => alert(`Failed to add ${entityDisplayName.toLowerCase()}.`));
  };

  // Render the form UI
  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 20, maxWidth: 400 }}>
      <h3>Add a New {entityDisplayName}</h3>

      {/* University name input and suggestion dropdown */}
      <div style={{ position: 'relative', marginBottom: 20 }} ref={nameRef}>
        <label htmlFor={`${entityType}-name`}>{entityDisplayName} Name:</label>
        <input
          id={`${entityType}-name`}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleNameKeyDown}
          autoComplete="off"
          style={{ width: '100%', padding: 6, fontSize: 16 }}
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
                ref={(el) => (nameListRefs.current[i] = el)}
                onClick={() => selectNameSuggestion(item)}
                onMouseEnter={() => setNameActiveIndex(i)}
                style={{
                  padding: '8px',
                  backgroundColor: i === nameActiveIndex ? '#d8eaff' : 'white',
                  cursor: 'pointer',
                }}
              >
                {item.name}
                {requireRegion && item.region ? ` (${item.region})` : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Region input and suggestion dropdown (if required) */}
      {requireRegion && (
        <div style={{ position: 'relative', marginBottom: 20 }} ref={regionRef}>
          <label htmlFor={`${entityType}-region`}>Region:</label>
          <input
            id={`${entityType}-region`}
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            onKeyDown={handleRegionKeyDown}
            autoComplete="off"
            style={{ width: '100%', padding: 6, fontSize: 16 }}
            placeholder="Enter or select region"
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
                  ref={(el) => (regionListRefs.current[i] = el)}
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

      {/* Warning message when a duplicate university is detected */}
      {existingEntity && (
        <p style={{ color: 'red' }}>
          This {entityDisplayName.toLowerCase()} already exists:{' '}
          <a href={`/university/${existingEntity.id}`}>
            {existingEntity.name}
            {requireRegion && existingEntity.region ? ` (${existingEntity.region})` : ''}
          </a>
        </p>
      )}

      {/* Submit button */}
      <button type="submit" style={{ padding: '8px 16px' }}>
        Add {entityDisplayName}
      </button>
    </form>
  );
}
