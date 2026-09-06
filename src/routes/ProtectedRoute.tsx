import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/database';
import { HeartHandshake } from 'lucide-react';

interface ProtectedRouteProps {
  requiredRole?: UserRole;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole }) => {
  const { user, role, loading, isConfigured } = useAuth();

  // Loading state with soothing accessible spinner
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center bg-slate-50">
        <div className="w-16 h-16 rounded-3xl bg-teal-700 flex items-center justify-center text-white animate-bounce shadow-lg mb-4">
          <HeartHandshake className="w-9 h-9" />
        </div>
        <p className="text-lg font-bold text-slate-700">Loading SmritiSetu...</p>
        <p className="text-xs text-slate-500 mt-1">Preparing your personalized dementia care space</p>
      </div>
    );
  }

  // If Supabase is unconfigured, allow developers/evaluators to view shells in preview mode,
  // but if configured, enforce real auth
  if (isConfigured && !user) {
    return <Navigate to="/login" replace />;
  }

  // If role is required and does not match the user's role
  if (requiredRole && role && role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};
