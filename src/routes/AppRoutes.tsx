import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { ElderlyDashboard } from '../pages/elderly/ElderlyDashboard';
import { GamePlayerPage } from '../pages/elderly/GamePlayerPage';
import { CaregiverDashboard } from '../pages/caregiver/CaregiverDashboard';
import { Unauthorized } from '../pages/unauthorized/Unauthorized';

// Smart Home redirector based on authenticated role
const HomeRedirect: React.FC = () => {
  const { user, role, loading, isConfigured } = useAuth();

  if (loading) return null;

  if (!user && isConfigured) {
    return <Navigate to="/login" replace />;
  }

  if (role === 'caregiver') {
    return <Navigate to="/caregiver" replace />;
  }

  // Default to elderly shell
  return <Navigate to="/elderly" replace />;
};

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Root redirector */}
      <Route path="/" element={<HomeRedirect />} />

      {/* Public Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Protected Elderly Routes */}
      <Route element={<ProtectedRoute requiredRole="elderly" />}>
        <Route path="/elderly" element={<ElderlyDashboard />} />
        <Route path="/elderly/play/:gameId" element={<GamePlayerPage />} />
      </Route>

      {/* Protected Caregiver Routes */}
      <Route element={<ProtectedRoute requiredRole="caregiver" />}>
        <Route path="/caregiver" element={<CaregiverDashboard />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
