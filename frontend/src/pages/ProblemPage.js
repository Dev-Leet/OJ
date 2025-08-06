// frontend/src/pages/ProblemPage.js
import React from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';
import ProblemList from '../components/problem/ProblemList';
import ProblemDetails from '../components/problem/ProblemDetails';

/**
 * This page component acts as a router for the /problems URL path.
 * It determines whether to show the list of all problems or the
 * detailed view of a single problem.
 */
const ProblemPage = () => {
  // `useRouteMatch` provides access to the current path, which is '/problems'
  const { path } = useRouteMatch();

  return (
    <div>
      <Switch>
        {/*
          Route for the main problems list.
          Example URL: /problems
        */}
        <Route exact path={path}>
          <ProblemList />
        </Route>

        {/*
          Route for a specific problem's details page.
          The `:id` is a URL parameter that will be the problem's ID.
          Example URL: /problems/60d5f2f9c7b7c2a7c8e4d3c1
        */}
        <Route path={`${path}/:id`}>
          <ProblemDetails />
        </Route>
      </Switch>
    </div>
  );
};

export default ProblemPage;
