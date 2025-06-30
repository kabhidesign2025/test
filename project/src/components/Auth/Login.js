import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Container,
  CircularProgress,
  Fade,
  Stack,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  Email,
  Person,
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Home,
  Lock
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const Login = () => {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const [loginType, setLoginType] = useState("email");
  const navigate = useNavigate();

  // Detect login type based on input
  useEffect(() => {
    if (identifier.includes("@")) {
      setLoginType("email");
    } else if (identifier.trim() && !identifier.includes("@")) {
      setLoginType("username");
    } else {
      setLoginType("email");
    }
  }, [identifier]);

  const showAlert = (title, message, type = 'error') => {
    const icons = {
      error: 'error',
      success: 'success',
      warning: 'warning',
      info: 'info'
    };

    Swal.fire({
      title: title,
      text: message,
      icon: icons[type],
      confirmButtonText: 'OK',
      confirmButtonColor: type === 'error' ? '#d33' : '#1976d2',
      background: '#ffffff',
      customClass: {
        popup: 'swal2-popup-custom',
        title: 'swal2-title-custom'
      }
    });
  };

  const handleRedirect = async (userData) => {
    const role = userData.role;
    
    // Show success message
    await Swal.fire({
      title: `Welcome ${role.charAt(0).toUpperCase() + role.slice(1)}!`,
      text: `Login successful. Redirecting to your dashboard...`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false,
      background: '#ffffff'
    });

    if (role === "admin") {
      navigate("/admin/dashboard");
    } else if (role === "subadmin") {
      navigate("/subadmin/dashboard");
    } else if (role === "owner") {
      navigate("/owner/dashboard");
    } else if (role === "school") {
      const schoolRef = doc(db, "schools", userData.schoolId);
      const schoolSnap = await getDoc(schoolRef);
      if (!schoolSnap.exists()) {
        showAlert("School Not Found", "Your school data could not be found. Please contact the administrator.", "error");
      } else {
        const schoolData = schoolSnap.data();
        if (schoolData.status === "acknowledged") {
          setShowThankYouModal(true);
          setTimeout(() => {
            setShowThankYouModal(false);
            navigate("/");
          }, 5000);
        } else if (schoolData.status === "approved") {
          navigate("/school/dashboard");
        } else if (schoolData.status === "rejected") {
          showAlert(
            "School Registration Rejected",
            `Your school registration has been rejected. Reason: ${schoolData.rejectionReason || "No specific reason provided. Please contact the administrator for more details."}`,
            "error"
          );
        } else {
          showAlert(
            "Approval Pending",
            "Your school registration is still under review. Please wait for admin approval before accessing the portal.",
            "warning"
          );
        }
      }
    } else {
      showAlert("Invalid User Role", "Your account has an invalid role assignment. Please contact the administrator.", "error");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!identifier.trim()) {
      showAlert(
        "Missing Credentials",
        "Please enter your email address or username to continue.",
        "warning"
      );
      return;
    }

    if (!password.trim()) {
      showAlert(
        "Missing Password",
        "Please enter your password to continue.",
        "warning"
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      // USERNAME login: admin/subadmin
      if (!identifier.includes("@")) {
        const usersCol = collection(db, "users");
        const q = query(usersCol, where("username", "==", identifier.trim()));
        const querySnap = await getDocs(q);

        if (querySnap.empty) {
          showAlert(
            "Invalid Username", 
            "The username you entered is not recognized. Please check your username and try again.",
            "error"
          );
          setLoading(false);
          return;
        }

        const userDoc = querySnap.docs[0];
        const userData = userDoc.data();

        if (userData.role !== "admin" && userData.role !== "subadmin") {
          showAlert(
            "Access Denied", 
            "This username is not authorized for admin access. Please use your email address if you are a school user.",
            "error"
          );
          setLoading(false);
          return;
        }

        const loginEmail = userData.email;
        await signInWithEmailAndPassword(auth, loginEmail, password);
        await handleRedirect(userData);
      } else {
        // EMAIL login flow
        const userCredential = await signInWithEmailAndPassword(
          auth,
          identifier.trim(),
          password
        );
        const uid = userCredential.user.uid;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await auth.signOut();
          showAlert(
            "Account Not Found", 
            "Your account data could not be found. Please contact the administrator.",
            "error"
          );
          setLoading(false);
          return;
        }
        
        const userData = userSnap.data();

        if (userData.role === "admin" || userData.role === "subadmin") {
          await auth.signOut();
          showAlert(
            "Admin Access Required", 
            "Administrators must log in using their assigned username, not email address.",
            "warning"
          );
        } else {
          await handleRedirect(userData);
        }
      }
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address. Please check your email or register.";
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please check your password and try again.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format. Please enter a valid email address.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed login attempts. Please try again later.";
      }
      
      showAlert("Authentication Failed", errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Thank You Modal
  if (showThankYouModal) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          width: '100vw',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          p: 2
        }}
      >
        <Fade in={showThankYouModal}>
          <Card
            sx={{
              maxWidth: 500,
              textAlign: 'center',
              p: 6,
              borderRadius: 4,
              boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
              border: '1px solid #e0e0e0'
            }}
          >
            <CardContent>
              <Typography variant="h3" color="success.main" gutterBottom>
                🎉 Thank You! 🎉
              </Typography>
              <Typography variant="h5" gutterBottom>
                Thank you for joining <strong>The Art Foundation</strong>
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                It was wonderful to work with you.<br />
                <strong>See you next year!</strong>
              </Typography>
              <CircularProgress size={32} />
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                Redirecting to homepage...
              </Typography>
            </CardContent>
          </Card>
        </Fade>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#ffffff'
        }}
      >
        <Container maxWidth="xl">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box
                component="img"
                src="/logo (2).jpg"
                alt="The Art Foundation"
                sx={{
                  height: 40,
                  width: 'auto',
                  borderRadius: 1,
                  mr: 2
                }}
              />
              <Typography variant="h6" fontWeight="bold" color="primary">
                THE ART FOUNDATION
              </Typography>
            </Box>
            
            <IconButton
              onClick={() => navigate('/')}
              sx={{
                color: 'text.secondary',
                '&:hover': { color: 'primary.main' }
              }}
            >
              <Home />
            </IconButton>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2
        }}
      >
        <Container maxWidth="sm">
          <Card
            sx={{
              borderRadius: 4,
              p: { xs: 4, sm: 6 },
              boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0',
              width: '100%'
            }}
          >
            <CardContent>
              {/* Title */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  Sign in to access your portal
                </Typography>
              </Box>

              <form onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label={loginType === "email" ? "Email Address" : "Username"}
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {loginType === "email" ? <Email /> : <Person />}
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  placeholder={loginType === "email" ? "Enter your email address" : "Enter your username"}
                  autoComplete="username"
                  inputProps={{
                    style: { 
                      textAlign: 'left',
                      direction: 'ltr'
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                  sx={{
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    mb: 3,
                    borderRadius: 3,
                    textTransform: 'none',
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                      boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                    }
                  }}
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>

                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
              </form>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Login Instructions
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>For Schools:</strong> Use your registered email address
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>For Admins:</strong> Use your assigned username
                </Typography>
              </Box>

              <Typography 
                variant="body2" 
                sx={{ 
                  textAlign: 'center', 
                  mt: 3, 
                  fontStyle: 'italic',
                  color: 'text.secondary'
                }}
              >
                "Every child is an artist"
              </Typography>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </Box>
  );
};

export default Login;