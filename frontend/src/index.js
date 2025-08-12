// frontend/src/index.js
import React from 'react';
//import ReactDOM from 'react-dom';
import './index.css'; // Main stylesheet for global styles (e.g., Tailwind CSS)
import App from './App';
import { createRoot } from 'react-dom/client';

/**
 * This is the entry point of the React application.
 *
 * ReactDOM.render takes two arguments:
 * 1. The component to render (<App /> in this case).
 * 2. The DOM element where the component should be mounted.
 * 'root' is the ID of a div in the public/index.html file.
 *
 * <React.StrictMode> is a wrapper that helps with highlighting potential
 * problems in an application. It activates additional checks and warnings
 * for its descendants.
 */

/* ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') */
  
  const container = document.getElementById('root');
  const root = createRoot(container); // createRoot(container!) if using TS
  root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>

);
