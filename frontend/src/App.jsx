import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import CreateGroup from './pages/CreateGroup';
import AddExpense from './pages/AddExpense';

// Component to protect routes - redirects to login if no token
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Component to prevent logged-in users from seeing login/signup
const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Navbar />
        <Routes>
          {/* Public Routes - Logged in users are redirected to dashboard */}
          <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

          {/* Protected Routes - Guests are redirected to login */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
          <Route path="/edit-group/:groupId" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
          <Route path="/group/:groupId/add-expense" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
          <Route path="/group/:groupId/edit-expense/:expenseId" element={<ProtectedRoute><AddExpense /></ProtectedRoute>} />
          
          {/* Catch all - Redirect to dashboard or login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
