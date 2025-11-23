import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RouteDetails from './pages/RouteDetails';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import CompanyDashboard from './pages/CompanyDashboard';
import './styles.css';

// Protected Route Component for Admin
function ProtectedAdminRoute({ children }) {
  const userStr = localStorage.getItem('kelale_user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(userStr);
  if (user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Protected Route Component for Company
function ProtectedCompanyRoute({ children }) {
  const userStr = localStorage.getItem('kelale_user');
  if (!userStr) {
    return <Navigate to="/login" replace />;
  }
  const user = JSON.parse(userStr);
  if (user.role !== 'company') {
    return <Navigate to="/" replace />;
  }
  return children;
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('kelale_user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // Update user when localStorage changes (after login/register)
  useEffect(() => {
    const handleUserUpdate = () => {
      const userStr = localStorage.getItem('kelale_user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      } else {
        setUser(null);
      }
    };
    window.addEventListener('userUpdated', handleUserUpdate);
    // Also check on mount
    handleUserUpdate();
    return () => window.removeEventListener('userUpdated', handleUserUpdate);
  }, []);

  function handleLogout() {
    localStorage.removeItem('kelale_token');
    localStorage.removeItem('kelale_user');
    setUser(null);
    window.dispatchEvent(new Event('userUpdated'));
    window.location.href = '/';
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-yellow-400">
        {/* Navbar */}
        <nav className="bg-black text-yellow-400 p-4 flex flex-wrap justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Kelale Transport Logo" className="h-12 w-auto logo-3d" />
            <div>
              <div className="font-bold text-xl text-3d-pulse">KELALE TRANSPORT</div>
              <span className="text-sm opacity-80">Book intercity buses across Ethiopia</span>
            </div>
          </div>
          <div className="space-x-4 flex items-center">
            <Link to="/" className="hover:underline">Home</Link>
            {user ? (
              <>
                <Link to="/profile" className="hover:underline">Profile</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="hover:underline">Admin</Link>
                )}
                {user.role === 'company' && (
                  <Link to="/company-dashboard" className="hover:underline">Dashboard</Link>
                )}
                <button onClick={handleLogout} className="hover:underline">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hover:underline">Login</Link>
                <Link to="/register" className="hover:underline">Register</Link>
              </>
            )}
          </div>
        </nav>

        {/* Page content */}
        <div className="p-6">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/route-details/:routeId" element={<RouteDetails />} />
            <Route path="/profile" element={<Profile />} />
            <Route 
              path="/admin" 
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              } 
            />
            <Route 
              path="/company-dashboard" 
              element={
                <ProtectedCompanyRoute>
                  <CompanyDashboard />
                </ProtectedCompanyRoute>
              } 
            />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<App />);
