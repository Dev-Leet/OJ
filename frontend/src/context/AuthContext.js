// frontend/src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

// 1. Create the context
export const AuthContext = createContext();

/**
 * 2. Create the AuthProvider component.
 * This component will wrap the entire application and provide the authentication state.
 */
export const AuthProvider = ({ children }) => {
  // State to hold the current user object and loading status
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 3. Check for an existing user session in localStorage when the app loads
  useEffect(() => {
    // Get user data from the authService (which reads from localStorage)
    const loggedInUser = authService.getCurrentUser();
    if (loggedInUser) {
      setUser(loggedInUser);
    }
    // Set loading to false once the check is complete
    setLoading(false);
  }, []); // The empty dependency array ensures this effect runs only once on mount

  /**
   * Logs in a user and updates the global state.
   * @param {string} email - The user's email.
   * @param {string} password - The user's password.
   */
  const login = async (email, password) => {
    // Call the login service, which handles the API call and localStorage
    const userData = await authService.login(email, password);
    // Update the user state with the data received from the service
    setUser(userData);
  };

  /**
   * Logs out the user and clears the global state.
   */
  const logout = () => {
    // Call the logout service, which removes the user from localStorage
    authService.logout();
    // Clear the user state
    setUser(null);
  };

  // 4. Provide the user, loading state, and auth functions to child components
  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {/*
        Don't render the rest of the app until the initial user check is complete.
        This prevents UI flicker (e.g., showing a login page for a split second
        to an already logged-in user).
      */}
      {!loading && children}
    </AuthContext.Provider>
  );
};
