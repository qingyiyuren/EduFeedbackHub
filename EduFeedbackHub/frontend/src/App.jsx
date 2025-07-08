// Main application component that sets up frontend routing and layout
// Uses react-router-dom to define routes and their corresponding page components
// Wraps all pages with Layout component for consistent page structure

import React from 'react';
import Layout from './components/forms/Layout.jsx';
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom';
// <Router> is the top-level component that enables routing in the React app,
// allowing navigation between different pages without full page reloads.

import HomePage from './components/pages/HomePage';
import QSYearListPage from './components/pages/QSYearListPage';
import QSYearDetailPage from './components/pages/QSYearDetailPage';
import UniversityDetailPage from './components/pages/UniversityDetailPage';

function App() {
    return (
        <Router>
            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage/>}/>
                    <Route path="/years" element={<QSYearListPage/>}/>
                    <Route path="/rankings/:year" element={<QSYearDetailPage/>}/>
                    <Route path="/university/:university_id" element={<UniversityDetailPage/>}/>
                </Routes>
            </Layout>
        </Router>
    );
}

export default App; // Default export of the App component

