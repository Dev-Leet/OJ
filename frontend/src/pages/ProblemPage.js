// frontend/src/pages/ProblemPage.js
import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Use Routes
import ProblemList from '../components/problem/ProblemList';
import ProblemDetails from '../components/problem/ProblemDetails';


/**
 * This page component acts as a router for the /problems URL path.
 * It determines whether to show the list of all problems or the
 * detailed view of a single problem.
 */
const ProblemPage = () => {
  return (
    <Routes> {/* Use Routes */}
      <Route path="/" element={<ProblemList />} /> {/* The base path is now just "/" */}
      <Route path="/:id" element={<ProblemDetails />} /> {/* The nested path */}
    </Routes>
  );
};


export default ProblemPage;
