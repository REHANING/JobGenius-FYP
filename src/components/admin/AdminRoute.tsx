import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminLogin from '../../pages/admin/AdminLogin';
import AdminDashboard from '../../pages/admin/Dashboard';

interface AdminRouteProps {
  children?: React.ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saas-cyan"></div>
      </div>
    );
  }

  // If user is logged in and is admin, show dashboard
  if (user && user.role === 'admin') {
    return <AdminDashboard />;
  }

  // Otherwise show login page
  return <AdminLogin />;
};

export default AdminRoute;



