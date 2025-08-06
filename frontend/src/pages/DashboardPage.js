// frontend/src/pages/DashboardPage.js
import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * This page serves as the main dashboard for a logged-in user.
 * It displays a welcome message and a summary of their profile.
 */
const DashboardPage = () => {
  // Get the authenticated user's data from the AuthContext
  const { user } = useContext(AuthContext);

  // If the user data is not yet loaded, show a loading message
  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-800">
            Welcome, {user.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            This is your personal dashboard. Here you can track your progress and manage your account.
          </p>
        </div>

        {/* Profile Information Section */}
        <div className="bg-white shadow-md rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">
            Your Profile
          </h2>
          <div className="space-y-3">
            <div className="flex">
              <p className="font-medium text-gray-500 w-32">Full Name:</p>
              <p className="text-gray-800">{user.name}</p>
            </div>
            <div className="flex">
              <p className="font-medium text-gray-500 w-32">Email:</p>
              <p className="text-gray-800">{user.email}</p>
            </div>
            <div className="flex">
              <p className="font-medium text-gray-500 w-32">Role:</p>
              <p className="text-gray-800 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/problems"
            className="block p-6 bg-indigo-600 text-white rounded-lg shadow-lg hover:bg-indigo-700 transition-colors"
          >
            <h3 className="text-xl font-semibold">Start Solving</h3>
            <p className="mt-2">
              Browse the problem set and start tackling new challenges.
            </p>
          </Link>
          <Link
            to="/submissions"
            className="block p-6 bg-gray-700 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
          >
            <h3 className="text-xl font-semibold">View Submissions</h3>
            <p className="mt-2">
              Review your past submissions and track your progress.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
