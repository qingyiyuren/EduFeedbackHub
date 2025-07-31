/**
 * This is the main entry point of the React frontend.
 * It sets up client-side routing using React Router.
 * Each route maps to a specific page component and is rendered within a shared Layout.
 */


import React from 'react'; // Import React
import {BrowserRouter as Router, Routes, Route} from 'react-router-dom'; // Import router hooks and components

import Layout from './components/forms/Layout.jsx';

// Page components
import HomePage from './components/pages/HomePage';
import QSYearListPage from './components/pages/QSYearListPage';
import QSYearDetailPage from './components/pages/QSYearDetailPage';
import EntityDetailPage from './components/pages/EntityDetailPage.jsx';
import EntitySearchAddPage from './components/pages/EntitySearchAddPage.jsx';
import TeachingDetailPage from './components/pages/TeachingDetailPage.jsx';
import QuickSearchPage from './components/pages/QuickSearchPage.jsx';
import LoginRegisterPage from './components/pages/LoginRegisterPage.jsx';
import ProfilePage from './components/pages/ProfilePage.jsx';


function App() {
    return (
        <Router>
            {/* The Layout component wraps all pages and provides shared UI (e.g., navbar, logout) */}
            <Layout>
                <Routes>
                    {/* Homepage */}
                    <Route path="/" element={<HomePage/>}/>

                    {/* List of QS ranking years */}
                    <Route path="/years" element={<QSYearListPage/>}/>

                    {/* University rankings for a specific year */}
                    <Route path="/rankings/:year" element={<QSYearDetailPage/>}/>

                    {/* University detail page */}
                    <Route path="/university/:university_id"
                           element={<EntityDetailPage entityType="university" entityDisplayName="University"/>}/>

                    {/* University search and add page */}
                    <Route path="/university/search"
                           element={<EntitySearchAddPage entityType="university" entityDisplayName="University"/>}/>

                    {/* College search and add page */}
                    <Route path="/college/search"
                           element={<EntitySearchAddPage entityType="college" entityDisplayName="College"/>}/>

                    {/* College detail page */}
                    <Route path="/college/:college_id"
                           element={<EntityDetailPage entityType="college" entityDisplayName="College"/>}/>

                    {/* School search and add page */}
                    <Route path="/school/search"
                           element={<EntitySearchAddPage entityType="school" entityDisplayName="School"/>}/>

                    {/* School detail page */}
                    <Route path="/school/:school_id"
                           element={<EntityDetailPage entityType="school" entityDisplayName="School"/>}/>

                    {/* Module search and add page */}
                    <Route path="/module/search"
                           element={<EntitySearchAddPage entityType="module" entityDisplayName="Module"/>}/>

                    {/* Module detail page */}
                    <Route path="/module/:module_id"
                           element={<EntityDetailPage entityType="module" entityDisplayName="Module"/>}/>

                    {/* Teaching record detail page */}
                    <Route path="/teaching/:teaching_id" element={<TeachingDetailPage/>}/>

                    {/* Quick Search (Lecturer Only) */}
                    <Route path="/search" element={<QuickSearchPage/>}/>

                    {/* Login/Register page */}
                    <Route path="/login" element={<LoginRegisterPage/>}/>
                    {/* Profile page for students and lecturers */}
                    <Route path="/profile" element={<ProfilePage/>}/>
                </Routes>
            </Layout>
        </Router>
    );
}

export default App;
