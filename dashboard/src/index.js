/**
 * dashboard/src/index.js — React root render
 *
 * TASK REQUIREMENT #7: Ensure React Router refresh 404s are fixed.
 *
 * BrowserRouter lives here as the permanent outermost wrapper.
 * It must NOT be inside App() — mounting it conditionally (inside a state check)
 * causes the router to unmount/remount on every auth state change, losing all
 * route history and breaking deep-link refresh (e.g. refreshing /automod).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
