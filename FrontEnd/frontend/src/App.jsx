import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import { Toaster } from 'react-hot-toast'; // 1. IMPORT TOASTER HERE

import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import StaffDashboard from './pages/StaffDashboard';
import ChangePassword from './pages/ChangePassword';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { token, userRole } = useContext(AuthContext);

  return (
    <BrowserRouter>
      {/* 2. ADD TOASTER HERE (This makes alerts work on every single page!) */}
      <Toaster position="top-right" reverseOrder={false} /> 

      <Routes>
        <Route path="/" element={!token ? <Login /> : <Navigate to={`/${userRole?.toLowerCase()}-dashboard`} />} />
        
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/student-dashboard" element={<StudentDashboard />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
        {/* <Route path="/admin-dashboard" element={<div>Admin Dashboard</div>} /> */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App;