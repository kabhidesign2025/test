import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';
import Navigation from './components/Navigation';
import TeacherLogin from './components/teacher/TeacherLogin';
import TeacherDashboard from './components/teacher/TeacherDashboard';
import QuizBuilder from './components/teacher/QuizBuilder';
import TeacherProfile from './components/teacher/TeacherProfile';
import SessionManager from './components/teacher/SessionManager';
import StudentLogin from './components/student/StudentLogin';
import StudentDashboard from './components/student/StudentDashboard';
import AdminDashboard from './components/admin/AdminDashboard';
import SchoolAssignmentManager from './components/admin/SchoolAssignmentManager';

const theme = createTheme({
  palette: {
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
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 800 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 700 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
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

interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student' | 'admin';
  avatar?: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('quizUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('quizUser', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('quizUser');
  };

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <div>Loading...</div>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
          {user && <Navigation user={user} onLogout={handleLogout} />}
          
          <Routes>
            {/* Public Routes */}
            <Route 
              path="/login" 
              element={
                !user ? (
                  <TeacherLogin onLogin={handleLogin} />
                ) : (
                  <Navigate to={`/${user.role}/dashboard`} replace />
                )
              } 
            />
            
            <Route 
              path="/student-login" 
              element={
                !user ? (
                  <StudentLogin onLogin={handleLogin} />
                ) : (
                  <Navigate to="/student/dashboard" replace />
                )
              } 
            />

            {/* Protected Routes */}
            {user ? (
              <>
                {/* Teacher Routes */}
                {user.role === 'teacher' && (
                  <>
                    <Route path="/teacher/dashboard" element={<TeacherDashboard user={user} />} />
                    <Route path="/teacher/quiz-builder" element={<QuizBuilder user={user} />} />
                    <Route path="/teacher/profile" element={<TeacherProfile user={user} />} />
                    <Route path="/teacher/session/:sessionId" element={<SessionManager user={user} />} />
                  </>
                )}

                {/* Student Routes */}
                {user.role === 'student' && (
                  <>
                    <Route path="/student/dashboard" element={<StudentDashboard user={user} />} />
                  </>
                )}

                {/* Admin Routes */}
                {user.role === 'admin' && (
                  <>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/school-assignments" element={<SchoolAssignmentManager />} />
                  </>
                )}

                {/* Default redirect based on role */}
                <Route path="/" element={<Navigate to={`/${user.role}/dashboard`} replace />} />
              </>
            ) : (
              <Route path="/" element={<Navigate to="/login" replace />} />
            )}

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
              },
            }}
          />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;