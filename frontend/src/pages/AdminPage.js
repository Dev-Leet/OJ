// frontend/src/pages/AdminPage.js
import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import AdminDashboard from '../components/admin/AdminDashboard';
import ProblemEditor from '../components/admin/ProblemEditor';

/**
 * This page component acts as a router for the /admin URL path.
 * It determines which admin component to display based on the specific route.
 */
const AdminPage = () => {
  // `useRouteMatch` provides access to the current base path, which is '/admin'
  const { path } = useRouteMatch();

  return (
    <div className="container mx-auto px-4 py-8">
      <Switch>
        {/*
          Route for the main admin dashboard.
          Example URL: /admin
        */}
        <Route exact path={path}>
          <AdminDashboard />
        </Route>

        {/*
          Route for the problem editor to create a new problem.
          Example URL: /admin/problems/new
        */}
        <Route exact path={`${path}/problems/new`}>
          <ProblemEditor />
        </Route>

        {/*
          Route for the problem editor to edit an existing problem.
          The `:id` is a URL parameter for the problem's ID.
          Example URL: /admin/problems/edit/60d5f2f9c7b7c2a7c8e4d3c1
        */}
        <Route exact path={`${path}/problems/edit/:id`}>
          <ProblemEditor />
        </Route>
      </Switch>
    </div>
  );
};

export default AdminPage;
