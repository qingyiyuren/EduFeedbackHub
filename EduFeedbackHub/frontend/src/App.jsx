/**
 * This is the main entry point of the React frontend.
 * It sets up client-side routing using React Router.
 * Each route maps to a specific page component and is rendered within a shared Layout.
 */


import React from 'react';
import Layout from './components/forms/Layout.jsx';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Page components
import HomePage from './components/pages/HomePage';
import QSYearListPage from './components/pages/QSYearListPage';
import QSYearDetailPage from './components/pages/QSYearDetailPage';
import UniversityDetailPage from './components/pages/UniversityDetailPage.jsx';
import UniversitySearchAddPage from './components/pages/UniversitySearchAddPage.jsx';
import CollegeSearchAddPage from './components/pages/ColledgeSearchAddPage.jsx';
import CollegeDetailPage from "./components/pages/CollegeDetailPage.jsx";

function App() {
    return (
        <Router>
            {/* The Layout component wraps all pages and provides shared UI (e.g., navbar) */}
            <Layout>
                <Routes>
                    {/* Homepage */}
                    <Route path="/" element={<HomePage />} />

                    {/* List of QS ranking years */}
                    <Route path="/years" element={<QSYearListPage />} />

                    {/* University rankings for a specific year */}
                    <Route path="/rankings/:year" element={<QSYearDetailPage />} />

                    {/* University detail page */}
                    <Route path="/university/:university_id" element={<UniversityDetailPage />} />

                    {/* University search and add page */}
                    <Route path="/university/search" element={<UniversitySearchAddPage />} />

                    {/* College search and add page */}
                    <Route path="/college/search" element={<CollegeSearchAddPage />} />

                    {/* College detail page */}
                    <Route path="/college/:college_id" element={<CollegeDetailPage />} />
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
