// This is the main entry point of the React application.
// It imports the root App component and renders it into the DOM element with id 'root'.
// React.StrictMode is used to highlight potential problems during development.
// Global CSS styles are also imported here to apply styling across the app.

import React from 'react';                  // Import React library to enable JSX syntax
import ReactDOM from 'react-dom/client';   // Import ReactDOM client API for rendering components to the DOM
import App from './App';                    // Import the root App component
import './index.css';                       // Import global CSS styles (optional)

// Find the DOM element with id 'root', create a React root, and render the <App /> component inside it
ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>    {/* React Strict Mode, helps detect potential issues during development */}
        <App/> {/* Root component of the app */}
    </React.StrictMode>
);


