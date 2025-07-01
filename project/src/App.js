import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';

// Public Components
import HomePage from "./components/HomePage";
import Login from "./components/Auth/Login";
import RegisterSchool from "./components/Auth/RegisterSchool";
import StudentRegister from "./components/Student/StudentRegister";
import HomeLogin from "./components/HomeLogin"; // Add this import
import ContactForm from "./components/ContactForm";

// Admin Components
import AdminDashboard from "./components/Admin/AdminDashboard";
import SchoolManagement from "./components/Admin/SchoolManagement";
import StudentManagement from "./components/Admin/StudentManagement";
import UserManagement from "./components/Admin/UserManagement";
import Reports from "./components/Admin/Reports";
import SchoolAssignment from "./components/Admin/SchoolAssignment";

// SubAdmin Components
import SubAdminDashboard from './components/SubAdmin/SubAdminDashboard';
import AssignedSchools from "./components/SubAdmin/AssignedSchools";
import ProgressTracking from "./components/SubAdmin/ProgressTracking";

// School Components
import SchoolDashboard from "./components/School/SchoolDashboard";
import StudentManager from "./components/School/StudentManager";
import AddStudent from "./components/School/AddStudent";
import BulkStudentAdd from "./components/School/BulkStudentAdd";
import ViewStudent from "./components/Student/ViewStudent";

// Owner Components
import OwnerDashboard from "./components/Owner/OwnerDashboard";

// Route Protection
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1976d2',
        light: '#42a5f5',
        dark: '#0d47a1',
      },
      secondary: {
        main: '#9c27b0',
        light: '#ba68c8',
        dark: '#6a1b9a',
      },
      background: {
        default: '#ffffff',
        paper: '#ffffff',
      },
      text: {
        primary: '#1a202c',
        secondary: '#4a5568',
      },
    },
    typography: {
      fontFamily: '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 800, fontSize: '2.5rem', lineHeight: 1.2 },
      h2: { fontWeight: 700, fontSize: '2rem', lineHeight: 1.3 },
      h3: { fontWeight: 700, fontSize: '1.75rem', lineHeight: 1.3 },
      h4: { fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.4 },
      h5: { fontWeight: 600, fontSize: '1.25rem', lineHeight: 1.4 },
      h6: { fontWeight: 600, fontSize: '1.125rem', lineHeight: 1.4 },
      body1: { fontSize: '1rem', lineHeight: 1.6 },
      body2: { fontSize: '0.875rem', lineHeight: 1.6 },
      button: { fontWeight: 600, textTransform: 'none' },
    },
    shape: { borderRadius: 12 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            padding: 0,
            minHeight: '100vh',
            backgroundColor: '#ffffff',
          },
          '#root': {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            textTransform: 'none',
            fontWeight: 600,
            padding: '12px 24px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              backgroundColor: '#ffffff',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
              },
              '&.Mui-focused': {
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.2)',
              },
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e2e8f0',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
            },
          },
        },
      },
    },
  });

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', backgroundColor: '#ffffff' }}>
        <Router>
          <Routes>
            {/* Public Routes - Full Screen */}
            <Route path="/" element={<HomePage darkMode={darkMode} onThemeToggle={handleThemeToggle} />} />
            <Route path="/login" element={<Login darkMode={darkMode} onThemeToggle={handleThemeToggle} />} />
            <Route path="/register-school" element={<RegisterSchool darkMode={darkMode} onThemeToggle={handleThemeToggle} />} />
            <Route path="/student-register" element={<StudentRegister darkMode={darkMode} onThemeToggle={handleThemeToggle} />} />
            <Route path="/homelogin" element={<HomeLogin />} /> {/* Add this line */}
            <Route path="/contact" element={<ContactForm />} />

            {/* Admin Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <AdminDashboard darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/schools"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <SchoolManagement darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <StudentManagement darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <UserManagement darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assignments"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <SchoolAssignment darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reports"
              element={
                <ProtectedRoute allowedRoles={["admin"]}>
                  <Reports darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            
            {/* SubAdmin Routes */}
            <Route
              path="/subadmin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["subadmin"]}>
                  <SubAdminDashboard darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subadmin/schools"
              element={
                <ProtectedRoute allowedRoles={["subadmin"]}>
                  <AssignedSchools darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/subadmin/progress"
              element={
                <ProtectedRoute allowedRoles={["subadmin"]}>
                  <ProgressTracking darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />

            {/* Owner Routes */}
            <Route
              path="/owner/dashboard"
              element={
                <ProtectedRoute allowedRoles={["owner"]}>
                  <OwnerDashboard darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            
            {/* School Routes */}
            <Route
              path="/school/dashboard"
              element={
                <ProtectedRoute allowedRoles={["school"]}>
                  <SchoolDashboard darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/school/students"
              element={
                <ProtectedRoute allowedRoles={["school"]}>
                  <StudentManager darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/add"
              element={
                <ProtectedRoute allowedRoles={["school"]}>
                  <AddStudent darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/school/bulk-add"
              element={
                <ProtectedRoute allowedRoles={["school"]}>
                  <BulkStudentAdd darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/view/:id"
              element={
                <ProtectedRoute allowedRoles={["school"]}>
                  <ViewStudent darkMode={darkMode} onThemeToggle={handleThemeToggle} />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </Box>
    </ThemeProvider>
  );
}

export default App;