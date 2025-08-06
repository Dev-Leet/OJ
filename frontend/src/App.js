// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';

// Layout Components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';

// Page Components
import HomePage from './pages/HomePage';
import ProblemPage from './pages/ProblemPage';
import SubmissionPage from './pages/SubmissionPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

// Routing Components
import PrivateRoute from './components/routing/PrivateRoute';
import AdminRoute from './components/routing/AdminRoute';

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Switch>
              {/* Public Routes */}
              <Route exact path="/" component={HomePage} />
              <Route exact path="/login" component={Login} />
              <Route exact path="/register" component={Register} />
              <Route path="/problems" component={ProblemPage} />

              {/* Private Routes (for authenticated users) */}
              <PrivateRoute exact path="/dashboard" component={DashboardPage} />
              <PrivateRoute exact path="/submissions" component={SubmissionPage} />

              {/* Admin Routes (for authenticated admins) */}
              <AdminRoute path="/admin" component={AdminPage} />
            </Switch>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;