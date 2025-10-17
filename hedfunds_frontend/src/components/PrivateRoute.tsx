import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // If no user is logged in, redirect to the login page
  // The `replace` prop ensures that after logging in, the user cannot go back to the private route directly by using the back button.
  return user ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
