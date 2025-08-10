import React from 'react';
import { Routes, Route } from 'react-router-dom'; // Use Routes
import AdminDashboard from '../components/admin/AdminDashboard';
import ProblemEditor from '../components/admin/ProblemEditor';

const AdminPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <Routes> {/* Use Routes */}
        <Route path="/" element={<AdminDashboard />} /> {/* Base path */}
        <Route path="/problems/new" element={<ProblemEditor />} /> {/* Nested path */}
        <Route path="/problems/edit/:id" element={<ProblemEditor />} /> {/* Nested path with param */}
      </Routes>
    </div>
  );
};

export default AdminPage;