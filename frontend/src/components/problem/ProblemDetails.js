// frontend/src/components/problem/ProblemDetails.js
import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import problemService from '../../services/problemService';
import SubmissionForm from '../submission/SubmissionForm';
import { AuthContext } from '../../context/AuthContext';

const ProblemDetails = () => {
  const { id: problemId } = useParams(); // Get problem ID from URL
  const { user } = useContext(AuthContext); // Get user context

  // State for problem data, loading, and errors
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch problem details when the component mounts or problemId changes
  useEffect(() => {
    const fetchProblemDetails = async () => {
      try {
        setLoading(true);
        const data = await problemService.getProblemById(problemId);
        setProblem(data);
      } catch (err) {
        setError('Failed to load problem details. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProblemDetails();
  }, [problemId]);

  // Display a loading spinner
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-24 w-24 border-t-4 border-b-4 border-indigo-600"></div>
      </div>
    );
  }

  // Display an error message
  if (error) {
    return <div className="text-center text-red-600 mt-10 text-xl">{error}</div>;
  }

  // Display a message if the problem is not found
  if (!problem) {
    return <div className="text-center text-gray-500 mt-10 text-xl">Problem not found.</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Problem Description */}
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold mb-4 text-gray-900">{problem.title}</h1>
          <div className="flex items-center mb-4">
            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
              problem.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
              problem.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {problem.difficulty}
            </span>
          </div>

          <div className="prose max-w-none text-gray-700">
            <h2 className="text-xl font-semibold mt-6 mb-2">Problem Description</h2>
            <p>{problem.description}</p>

            <h2 className="text-xl font-semibold mt-6 mb-2">Constraints</h2>
            <pre className="bg-gray-100 p-3 rounded-md"><code>{problem.constraints}</code></pre>

            {problem.testCases.slice(0, 2).map((tc, index) => ( // Show first 2 test cases as examples
              <div key={index}>
                <h3 className="text-lg font-semibold mt-6 mb-2">Example {index + 1}</h3>
                <div className="bg-gray-100 p-4 rounded-md">
                  <p className="font-mono"><strong>Input:</strong> {tc.input}</p>
                  <p className="font-mono mt-2"><strong>Output:</strong> {tc.output}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Code Editor and Submission */}
        <div>
          {user ? (
            <SubmissionForm problemId={problemId} />
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <h2 className="text-xl font-semibold">Please log in to submit a solution.</h2>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemDetails;
