/**
 * This component allows users to log in or register for an account.
 * Authentication and form handling are provided.
 */
import React, {useState} from 'react';// Import React and useState hook
import {useNavigate, Link} from 'react-router-dom';// Import router hooks and components
import { getApiUrlWithPrefix } from '../../config/api.js'; // Import API configuration

export default function LoginRegisterPage() {
    // State to toggle between login and register modes
    const [isLogin, setIsLogin] = useState(true);

    // Form input states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('student');

    // State for feedback messages
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // React Router navigation
    const navigate = useNavigate();

    // Handle login/register form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form action
        setError('');
        setSuccess('');
        const url = isLogin ? getApiUrlWithPrefix('login/') : getApiUrlWithPrefix('register/');
        const body = isLogin ? {username, password} : {username, password, role};

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(body),
            });

            let data = {};
            try {
                data = await res.json(); // Try to parse JSON response
            } catch {
                setError('Server error or invalid response. Please try again later.');
                return;
            }

            // Handle API errors based on returned message
            if (!res.ok) {
                if (data.error) {
                    if (data.error.includes('Invalid username or password')) {
                        setError('Account does not exist or password is incorrect. Please check your credentials or register first.');
                    } else if (data.error.includes('Username already exists')) {
                        setError('Account already exists. Please login.');
                    } else {
                        setError(data.error); // General error message
                    }
                } else {
                    setError('Unknown error');
                }
                return;
            }

            // On successful login: save auth info and redirect
            if (isLogin) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('role', data.role);
                localStorage.setItem('username', username);
                localStorage.setItem('user_id', data.user_id); // Save user_id for permission checks
                setSuccess('Login successful! Redirecting to home...');
                setTimeout(() => navigate('/'), 1000); // Redirect after delay
            } else {
                // On successful registration: show success and switch to login
                setIsLogin(true);
                localStorage.setItem('user_id', data.user_id); // Store ID even if not logged in yet
                setSuccess('Registration successful! Please login.');
            }
        } catch (err) {
            setError('Network error or server not reachable.');
        }
    };

    return (
        <div style={{maxWidth: 400, margin: '40px auto', padding: 24, border: '1px solid #ccc', borderRadius: 8}}>
            {/* Back to home link */}
            <p style={{marginBottom: 24}}>
                <Link to="/">
                    Back to Home
                </Link>
            </p>

            {/* Page heading */}
            <h2>{isLogin ? 'Login' : 'Register'}</h2>

            {/* Form inputs */}
            <form onSubmit={handleSubmit}>
                {/* Username input */}
                <div style={{marginBottom: 12}}>
                    <label>Username:</label><br/>
                    <input value={username} onChange={e => setUsername(e.target.value)} required/>
                </div>

                {/* Password input */}
                <div style={{marginBottom: 12}}>
                    <label>Password:</label><br/>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} required/>
                </div>

                {/* Role selection for registration only */}
                {!isLogin && (
                    <div style={{marginBottom: 12}}>
                        <label>Role:</label><br/>
                        <select value={role} onChange={e => setRole(e.target.value)}>
                            <option value="student">Student</option>
                            <option value="lecturer">Lecturer</option>
                        </select>
                    </div>
                )}

                {/* Submit button */}
                <button type="submit" style={{width: '100%', marginBottom: 12}}>
                    {isLogin ? 'Login' : 'Register'}
                </button>
            </form>

            {/* Toggle between login and register */}
            <button onClick={() => setIsLogin(!isLogin)} style={{width: '100%'}}>
                {isLogin ? 'No account? Register' : 'Already have an account? Login'}
            </button>

            {/* Error or success message display */}
            {error && <div style={{color: 'red', marginTop: 12}}>{error}</div>}
            {success && <div style={{color: 'green', marginTop: 12}}>{success}</div>}
        </div>
    );
}
