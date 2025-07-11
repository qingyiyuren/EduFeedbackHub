import React, {useState} from 'react';
import {Link, useNavigate, useLocation} from 'react-router-dom';
import CollegeSearchInput from '../forms/CollegeSearchInput.jsx';
import CollegeAddForm from '../forms/CollegeAddForm.jsx';

function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function CollegeSearchAddPage() {
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    const query = useQuery();

    const universityName = query.get('universityName') || '';
    const universityId = query.get('universityId') || '';

    const university = {
        id: universityId,
        name: universityName,
    };

    const entityType = 'college';
    const entityDisplayName = 'College';

    return (
        <div style={{maxWidth: 600, margin: '2rem auto', padding: '0 1rem'}}>
            <p>
                <Link to="/">Back to Home</Link>
            </p>

            {universityId && (
                <p>
                    <Link to={`/university/${universityId}`}>Back to University</Link>
                </p>
            )}

            {universityName && (
                <h2 style={{marginBottom: '0.5rem'}}>{universityName}</h2>
            )}


            <h3>Search or Add a {entityDisplayName}</h3>

            <CollegeSearchInput
                entityType={entityType}
                entityDisplayName={entityDisplayName}
                universityId={university.id}
                onSelect={(item) => {
                    if (item?.id) {
                        navigate(`/${entityType}/${item.id}`);
                    }
                }}
            />

            <CollegeAddForm
                entityType={entityType}
                entityDisplayName={entityDisplayName}
                university={university}
                onAddSuccess={(item) => {
                    if (item?.id) {
                        setMessage(`Added ${entityDisplayName}: ${item.name}`);
                        navigate(`/${entityType}/${item.id}`);
                    }
                }}
                onAddExists={(item) => {
                    if (item?.id) {
                        setMessage(`A similar ${entityDisplayName} already exists: ${item.name}`);
                        navigate(`/${entityType}/${item.id}`);
                    }
                }}
            />

            {message && (
                <p style={{marginTop: '1rem', color: 'green'}}>{message}</p>
            )}
        </div>
    );
}
