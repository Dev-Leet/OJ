import React, { useContext } from 'react';
import { Route, Redirect } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const AdminRoute = ({ component: Component, ...rest }) => {
  const { user, loading } = useContext(AuthContext);

  return (
    <Route
      {...rest}
      render={(props) =>
        user && user.role === 'admin' ? (
          <Component {...props} />
        ) : (
          <Redirect to="/" />
        )
      }
    />
  );
};

export default AdminRoute;
