import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppLayout } from './layout/AppLayout.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { AccessDeniedPage } from './pages/AccessDeniedPage.jsx';
import { DashboardHome } from './pages/DashboardHome.jsx';
import { BoardDetail } from './pages/BoardDetail.jsx';
import { BoardManagement } from './pages/BoardManagement.jsx';
import { FocusTimer } from './pages/FocusTimer.jsx';
import { ManageUsers } from './components/ManageUsers.jsx';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        <Route element={<AppLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="dashboard" element={<DashboardHome />} />
          <Route path="boards/new" element={<BoardManagement />} />
          <Route path="boards/:boardId" element={<BoardDetail />} />
          <Route path="focus" element={<FocusTimer />} />
          <Route path="manage-users" element={<ManageUsers />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}
