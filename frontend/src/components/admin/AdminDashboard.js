// frontend/src/components/admin/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import problemService from '../../services/problemService';

const AdminDashboard = () => {
  // State for problems, loading status, and errors
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Function to fetch all problems
  const fetchProblems = async () => {
    try {
      setLoading(true);
      const data = await problemService.getAllProblems();
      setProblems(data);
    } catch (err) {
      setError('Failed to load problems. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch problems when the component mounts
  useEffect(() => {
    fetchProblems();
  }, []);

  // Handle the deletion of a problem
  const handleDelete = async (id) => {
    // Confirm before deleting
    if (window.confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
      try {
        await problemService.deleteProblem(id);
        // Refresh the problem list after deletion
        fetchProblems();
      } catch (err) {
        setError('Failed to delete problem.');
        console.error(err);
      }
    }
  };

  // Display a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Display an error message
  if (error) {
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-gray-800">Admin Dashboard</h1>
        <Link
          to="/admin/problems/new"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Create New Problem
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <h2 className="text-2xl font-semibold p-5 border-b">Manage Problems</h2>
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Title
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Difficulty
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Created At
              </th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {problems.length > 0 ? (
              problems.map((problem) => (
                <tr key={problem._id} className="hover:bg-gray-50">
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm font-semibold">
                    {problem.title}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    {problem.difficulty}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    {new Date(problem.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm space-x-2">
                    <Link
                      to={`/admin/problems/edit/${problem._id}`}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(problem._id)}
                      className="text-red-600 hover:text-red-900 font-medium"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-10 text-gray-500">
                  No problems found. Create one to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
