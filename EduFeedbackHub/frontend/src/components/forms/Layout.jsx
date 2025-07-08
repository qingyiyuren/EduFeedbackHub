// This component provides a styled container that wraps page content,
// setting max width, margins, padding, and text alignment for consistent layout.

import React from 'react';

export default function Layout({ children }) {
    return (
        <div
            style={{
                maxWidth: '900px',        // Maximum width of content area
                marginLeft: '20px',       // Left margin space
                marginTop: '20px',        // Top margin space
                padding: '10px',          // Inner padding for spacing
                textAlign: 'left',        // Align text to the left
                minHeight: '100vh',       // Minimum height is full viewport height
            }}
        >
            {children}  {/* Render child components passed into Layout */}
        </div>
    );
}

