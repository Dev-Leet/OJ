// frontend/src/components/problem/ProblemList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import problemService from '../../services/problemService';

const ProblemList = () => {
  // State for storing problems, loading status, and errors
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch problems from the backend when the component mounts
  useEffect(() => {
    const fetchProblems = async () => {
      try {
        const data = await problemService.getAllProblems();
        setProblems(data);
      } catch (err) {
        setError('Failed to load problems. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblems();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Helper function to determine the color for the difficulty badge
  const getDifficultyClass = (difficulty) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Display a loading spinner while data is being fetched
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Display an error message if fetching fails
  if (error) {
    return <div className="text-center text-red-500 mt-8">{error}</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
        Problem Set
      </h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
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
                Tags
              </th>
            </tr>
          </thead>
          <tbody>
            {problems.map((problem) => (
              <tr key={problem._id} className="hover:bg-gray-50">
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <Link
                    to={`/problems/${problem._id}`}
                    className="text-indigo-600 hover:text-indigo-900 font-semibold"
                  >
                    {problem.title}
                  </Link>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <span
                    className={`inline-block px-3 py-1 font-semibold leading-tight rounded-full text-xs ${getDifficultyClass(
                      problem.difficulty
                    )}`}
                  >
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                  <div className="flex flex-wrap gap-2">
                    {problem.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-200 text-gray-700 rounded-md text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProblemList;
