// frontend/src/pages/SubmissionPage.js
import React from 'react';
import SubmissionList from '../components/submission/SubmissionList';

/**
 * This page component acts as the container for the user's submission history.
 * It renders the SubmissionList component which handles the display logic.
 */
const SubmissionPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/*
        The SubmissionList component contains all the logic for fetching
        and displaying the submissions for the logged-in user.
      */}
      <SubmissionList />
    </div>
  );
};

export default SubmissionPage;
