import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  IconButton,
  useTheme,
  useMediaQuery,
  alpha,
  Zoom,
  Slide,
  Stack,
  Divider,
  Card,
  CardContent,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Alert,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Login as LoginIcon,
  School,
  Palette,
  EmojiEvents,
  PersonAdd,
  ArrowForward,
  Home,
  Star,
  CheckCircle,
  Timeline,
  Group,
  Email,
  Lock,
  Person,
  Phone,
  LocationOn,
  Visibility,
  VisibilityOff,
  Close,
  NavigateNext,
  NavigateBefore
} from '@mui/icons-material';
import Swal from 'sweetalert2';

const COMMON_YELLOW = "#ffc107";
const COMMON_DARKBLUE = "#0d1b2a";
const COMMON_TEXT = "#fff";
const COMMON_TEXT_DARK = "#222";

const HomePage = ({ darkMode, onThemeToggle }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Modal states
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [showLoginRegister, setShowLoginRegister] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({
    identifier: "",
    password: ""
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: "",
    principal: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: ""
  });

  const [errors, setErrors] = useState({});

  const features = [
    {
      icon: <School sx={{ fontSize: 48 }} />,
      title: "School Registration",
      description: "Easy registration process for schools to participate in the competition",
      color: "#4CAF50"
    },
    {
      icon: <Palette sx={{ fontSize: 48 }} />,
      title: "Art Competition",
      description: "13th National Level Drawing Competition for young artists",
      color: "#FF9800"
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 48 }} />,
      title: "Recognition",
      description: "Certificates and awards for outstanding artistic achievements",
      color: "#9C27B0"
    }
  ];

  const stats = [
    { icon: <School />, label: "Schools", value: "500+", color: "#1976d2" },
    { icon: <Group />, label: "Students", value: "10,000+", color: "#4caf50" },
    { icon: <EmojiEvents />, label: "Awards", value: "1,000+", color: "#ff9800" },
    { icon: <Star />, label: "Years", value: "13", color: "#9c27b0" }
  ];

  const steps = ['School Information', 'Contact Details', 'Account Setup'];

  // Handle login form changes
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm({ ...loginForm, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Handle register form changes
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm({ ...registerForm, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Login handler
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginForm.identifier.trim()) {
      setErrors({ identifier: "Please enter your email address or username" });
      return;
    }

    if (!loginForm.password.trim()) {
      setErrors({ password: "Please enter your password" });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // USERNAME login: admin/subadmin
      if (!loginForm.identifier.includes("@")) {
        const usersCol = collection(db, "users");
        const q = query(usersCol, where("username", "==", loginForm.identifier.trim()));
        const querySnap = await getDocs(q);

        if (querySnap.empty) {
          setErrors({ identifier: "Username not found" });
          setLoading(false);
          return;
        }

        const userDoc = querySnap.docs[0];
        const userData = userDoc.data();

        if (userData.role !== "admin" && userData.role !== "subadmin") {
          setErrors({ identifier: "This username is not authorized for admin access" });
          setLoading(false);
          return;
        }

        const loginEmail = userData.email;
        await signInWithEmailAndPassword(auth, loginEmail, loginForm.password);
        await handleRedirect(userData);
      } else {
        // EMAIL login flow
        const userCredential = await signInWithEmailAndPassword(
          auth,
          loginForm.identifier.trim(),
          loginForm.password
        );
        const uid = userCredential.user.uid;
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await auth.signOut();
          setErrors({ identifier: "Account not found" });
          setLoading(false);
          return;
        }
        
        const userData = userSnap.data();

        if (userData.role === "admin" || userData.role === "subadmin") {
          await auth.signOut();
          setErrors({ identifier: "Administrators must log in using their username" });
        } else {
          await handleRedirect(userData);
        }
      }
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";
      
      if (err.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email address.";
      } else if (err.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password.";
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = "Invalid email format.";
      }
      
      setErrors({ general: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  // Handle redirect after login
  const handleRedirect = async (userData) => {
    const role = userData.role;
    
    setLoginOpen(false);
    
    await Swal.fire({
      title: `Welcome ${role.charAt(0).toUpperCase() + role.slice(1)}!`,
      text: `Login successful. Redirecting to your dashboard...`,
      icon: 'success',
      timer: 2000,
      showConfirmButton: false
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
        Swal.fire("Error", "School data not found", "error");
      } else {
        const schoolData = schoolSnap.data();
        if (schoolData.status === "acknowledged") {
          Swal.fire({
            title: '🎉 Thank You! 🎉',
            text: 'Thank you for joining The Art Foundation. See you next year!',
            icon: 'success',
            timer: 3000,
            showConfirmButton: false
          });
        } else if (schoolData.status === "approved") {
          navigate("/school/dashboard");
        } else if (schoolData.status === "rejected") {
          Swal.fire("Registration Rejected", `Reason: ${schoolData.rejectionReason || "Please contact administrator"}`, "error");
        } else {
          Swal.fire("Approval Pending", "Your registration is under review", "warning");
        }
      }
    }
  };

  // Validate register step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 0:
        if (!registerForm.name.trim()) newErrors.name = "School name is required";
        if (!registerForm.principal.trim()) newErrors.principal = "Principal name is required";
        break;
      case 1:
        if (!registerForm.email.trim()) newErrors.email = "Email is required";
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(registerForm.email)) newErrors.email = "Please enter a valid email";
        if (!registerForm.phone.trim()) newErrors.phone = "Phone number is required";
        if (!registerForm.address.trim()) newErrors.address = "Address is required";
        break;
      case 2:
        if (!registerForm.password) newErrors.password = "Password is required";
        if (registerForm.password.length < 6) newErrors.password = "Password must be at least 6 characters";
        if (registerForm.password !== registerForm.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle register next
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  // Handle register back
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  // Register handler
  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!validateStep(2)) return;

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerForm.email, registerForm.password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "schools", uid), {
        name: registerForm.name.trim(),
        principal: registerForm.principal.trim(),
        email: registerForm.email.trim(),
        phone: registerForm.phone.trim(),
        address: registerForm.address.trim(),
        status: "pending",
        createdAt: Date.now(),
      });

      await setDoc(doc(db, "users", uid), {
        uid,
        email: registerForm.email.trim(),
        role: "school",
        schoolId: uid,
        createdAt: Date.now(),
      });

      setRegisterOpen(false);
      setRegisterForm({
        name: "",
        principal: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        address: ""
      });
      setActiveStep(0);

      await Swal.fire({
        title: 'Registration Successful!',
        text: 'Your school has been registered. Please wait for admin approval.',
        icon: 'success',
        confirmButtonText: 'Great!'
      });

    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Get step content for register
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              fullWidth
              label="School Name *"
              name="name"
              value={registerForm.name}
              onChange={handleRegisterChange}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <School sx={{ mr: 2, color: 'primary.main' }} />
              }}
            />
            <TextField
              fullWidth
              label="Principal Name *"
              name="principal"
              value={registerForm.principal}
              onChange={handleRegisterChange}
              error={!!errors.principal}
              helperText={errors.principal}
              InputProps={{
                startAdornment: <Person sx={{ mr: 2, color: 'primary.main' }} />
              }}
            />
          </Box>
        );
      case 1:
        return (
          <Box>
            <TextField
              fullWidth
              label="Email Address *"
              name="email"
              type="email"
              value={registerForm.email}
              onChange={handleRegisterChange}
              error={!!errors.email}
              helperText={errors.email}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <Email sx={{ mr: 2, color: 'primary.main' }} />
              }}
            />
            <TextField
              fullWidth
              label="Phone Number *"
              name="phone"
              value={registerForm.phone}
              onChange={handleRegisterChange}
              error={!!errors.phone}
              helperText={errors.phone}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <Phone sx={{ mr: 2, color: 'primary.main' }} />
              }}
            />
            <TextField
              fullWidth
              label="School Address *"
              name="address"
              multiline
              rows={3}
              value={registerForm.address}
              onChange={handleRegisterChange}
              error={!!errors.address}
              helperText={errors.address}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 2, color: 'primary.main', alignSelf: 'flex-start', mt: 1 }} />
              }}
            />
          </Box>
        );
      case 2:
        return (
          <Box>
            <TextField
              fullWidth
              label="Password *"
              name="password"
              type={showPassword ? "text" : "password"}
              value={registerForm.password}
              onChange={handleRegisterChange}
              error={!!errors.password}
              helperText={errors.password}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <Lock sx={{ mr: 2, color: 'primary.main' }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <TextField
              fullWidth
              label="Confirm Password *"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={registerForm.confirmPassword}
              onChange={handleRegisterChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                startAdornment: <Lock sx={{ mr: 2, color: 'primary.main' }} />,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (window.bootstrap && window.bootstrap.Carousel) {
      const carouselEl = document.getElementById('homeCarousel');
      if (carouselEl) {
        // eslint-disable-next-line no-unused-vars
        const carousel = new window.bootstrap.Carousel(carouselEl, {
          interval: 2500,
          ride: 'carousel',
          pause: false,
          wrap: true
        });
      }
    }
  }, []);

  return (
    <>
      {/* === Fullscreen Hero Section Start (Navbar + Carousel) === */}
      <section
        className="bg-section text-white position-relative section-wrapper d-flex flex-column"
        style={{ height: "100vh", overflow: "hidden", background: COMMON_DARKBLUE, color: COMMON_TEXT }}
      >
        {/* Navbar */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-transparent py-1">
          <div className="container d-flex justify-content-between align-items-center">
            {/* Brand */}
            <a className="navbar-brand fw-bold me-4" href="#">
              <img src="assets/images/logo/logo.png" alt="TAF Logo" width="175" className="me-2" />
            </a>
            {/* Toggler (for mobile) */}
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent"
              aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            {/* Center Navigation */}
            <div className="collapse navbar-collapse justify-content-center" id="navbarContent">
              <ul className="navbar-nav mb-2 mb-lg-0 text-uppercase fw-semibold">
                <li className="nav-item">
                  <a className="nav-link active" href="#" onClick={e => { e.preventDefault(); navigate("/"); }}>Home</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="about.html">About Us</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="competitions.html">Competitions</a>
                </li>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#">Awards</a>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    <li>
                      <a className="dropdown-item" href="bata.html">Best Art Teacher</a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="winners.html">Student Winners</a>
                    </li>
                  </ul>
                </li>
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#">Programs</a>
                  <ul className="dropdown-menu dropdown-menu-dark">
                    <li>
                      <a className="dropdown-item" href="webinar.html">Online Webinar</a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="art-classes.html">ART Classes</a>
                    </li>
                  </ul>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="contact.html">Contact</a>
                </li>
              </ul>
            </div>
            {/* Right-Aligned Register Button */}
            <div className="d-none d-lg-block">
              <button
                className="btn btn-warning fw-bold text-dark px-4"
                style={{ background: "#ffc107", border: "2px solid #ffc107", color: "#222" }}
                onClick={() => setShowLoginRegister(true)}
              >
                Register/Login
              </button>
            </div>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="container-fluid flex-grow-1 d-flex align-items-center">
          <div className="row w-100 align-items-center justify-content-center">
            {/* Left Column */}
            <div className="col-lg-6 text-center text-lg-start mb-4 mb-lg-0 px-4">
              <div>
                <h5>Welcome to</h5>
                <h2 className="display-6 fw-bold"><span className="text-warning">The Art Foundation</span></h2>
                <h4 className="text-warning fw-bold">13<sup>th</sup> National Level Drawing Competition</h4>
                <img className="img-fluid rounded mb-3" src="assets/images/header/sdgcompetitioncard.png" alt="Competition Card" style={{ maxWidth: "100%", height: "auto" }} />
                <div className="d-flex flex-wrap justify-content-center justify-content-lg-start gap-2">
                  <a
                    href="/register-school"
                    className="btn btn-outline-warning"
                    onClick={e => {
                      e.preventDefault();
                      navigate("/register-school");
                    }}
                  >
                    Register Now
                  </a>
                  <a href="#" className="btn btn-warning text-dark">Download Brochure</a>
                </div>
              </div>
            </div>
            {/* Right Column: Carousel */}
            <div className="col-lg-5 px-4">
              <div
                id="homeCarousel"
                className="carousel slide carousel-fade"
                data-bs-ride="carousel"
                data-bs-interval="2500"
              >
                <div className="carousel-inner rounded shadow-lg">
                  <div className="carousel-item active">
                    <img
                      src="assets/images/header/header01.jpeg"
                      className="d-block w-100 img-fluid"
                      alt="Slide 1"
                    />
                  </div>
                  <div className="carousel-item">
                    <img
                      src="assets/images/header/header02.jpg"
                      className="d-block w-100 img-fluid"
                      alt="Slide 2"
                    />
                  </div>
                  <div className="carousel-item">
                    <img
                      src="assets/images/header/header03.jpg"
                      className="d-block w-100 img-fluid"
                      alt="Slide 3"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Floating Image */}
        <img src="assets/images/header/floater.png" alt="Floating Art Image" className="floating-img position-absolute bottom-0 end-0" />
      </section>
      {/* === Hero Section End === */}

      {/* === Services Section Start === */}
      <section
        className="py-5"
        style={{ background: COMMON_DARKBLUE, color: COMMON_TEXT }}
        id="services"
      >
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold" style={{ color: COMMON_TEXT }}>The ART Foundation Services</h2>
            <p className="fs-6" style={{ color: COMMON_TEXT }}>Empowering creativity through dedicated programs and platforms</p>
          </div>
          <div className="row g-4">
            {/* Card 1 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 text-center bg-section-card text-white border-0 shadow service-card">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <img src="assets/images/icons/community.png" alt="Art Community" width="60" className="mb-3" />
                    <h5 className="card-title fw-semibold">Art Community</h5>
                    <p className="card-text">A vibrant platform that connects budding artists, mentors, and educators across India and beyond.</p>
                  </div>
                  <div className="mt-4">
                    <a href="#" className="btn btn-outline-warning w-100 fw-semibold">Learn More</a>
                  </div>
                </div>
              </div>
            </div>
            {/* Card 2 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 text-center bg-section-card text-white border-0 shadow service-card">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <img src="assets/images/icons/competition.png" alt="Competitions" width="60" className="mb-3" />
                    <h5 className="card-title fw-semibold">Annual Competitions</h5>
                    <p className="card-text">National-level drawing competitions fostering artistic talent and celebrating creative expression every year.</p>
                  </div>
                  <div className="mt-4">
                    <a href="#" className="btn btn-outline-warning w-100 fw-semibold">Learn More</a>
                  </div>
                </div>
              </div>
            </div>
            {/* Card 3 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 text-center bg-section-card text-white border-0 shadow service-card">
                <div className="card-body d-flex flex-column justify-content-between">
                  <div>
                    <img src="assets/images/icons/webinar.png" alt="Webinars" width="60" className="mb-3" />
                    <h5 className="card-title fw-semibold">Webinars & Seminars</h5>
                    <p className="card-text">Interactive online sessions with experts on art education, peace-building, and creative empowerment.</p>
                  </div>
                  <div className="mt-4">
                    <a href="#" className="btn btn-outline-warning w-100 fw-semibold">Learn More</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* === Services Section End === */}

      {/* === About Us Section Start === */}
      <section className="py-5 bg-section text-white" id="about" style={{ background: COMMON_DARKBLUE, color: COMMON_TEXT }}>
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">About The ART Foundation</h2>
            <p className="text-warning fst-italic mt-2">Nurturing Creativity, Building Peace, Empowering Youth</p>
          </div>
          <div className="row align-items-center g-5">
            {/* Text Column */}
            <div className="col-lg-6">
              <div className="about-content p-4 rounded-4 shadow-lg">
                <p className="fs-6 mb-4">
                  <strong>The ART Foundation</strong>, established in 2011 by <strong>Mr. Pandu Ranga Guptha</strong>, is India’s premier platform dedicated to promoting creativity, culture, and sustainable development through the power of art.
                </p>
                <p className="fs-6 mb-4">
                  Over the past 12 years, we’ve organized <strong>national competitions</strong>, <strong>webinars</strong>, and built a thriving <strong>art community</strong> committed to the SDGs.
                </p>
                <p className="fs-6 mb-0">
                  In 2025, our founder <strong>Mr. Guptha</strong> was honored with the <strong>United Nations SDG Impact Award</strong> for using education and art to build peace across communities.
                </p>
              </div>
            </div>
            {/* Image Column */}
            <div className="col-lg-6">
              <div className="row g-3">
                <div className="col-6">
                  <img src="assets/images/about/about1.jpg" alt="Award Moment" className="img-fluid rounded shadow-sm about-img" />
                </div>
                <div className="col-6">
                  <img src="assets/images/about/about2.jpg" alt="Art Workshop" className="img-fluid rounded shadow-sm about-img" />
                </div>
                <div className="col-6">
                  <img src="assets/images/about/about3.jpg" alt="Student Winner" className="img-fluid rounded shadow-sm about-img" />
                </div>
                <div className="col-6">
                  <img src="assets/images/about/about4.jpg" alt="Founder Speech" className="img-fluid rounded shadow-sm about-img" />
                </div>
              </div>
            </div>
          </div>
          <div className="text-lg-end text-center mt-3">
            <a href="" className="btn btn-outline-warning p-3">Know More</a>
          </div>
        </div>
      </section>
      {/* === About Us Section End === */}

      {/* === Founder Section Start === */}
      <section className="py-5 bg-darkblue text-white" id="founder">
        <div className="container">
          <div className="row align-items-center g-5">
            {/* Left Column: Founder Image */}
            <div className="col-lg-5 text-center">
              <div className="position-relative d-inline-block founder-img-wrapper">
                <img src="assets/images/founder/founder.jpg" alt="Mr. Pandu Ranga Guptha" className="img-fluid rounded-4 shadow founder-img" />
                <div className="founder-badge bg-warning text-dark fw-bold small px-3 py-1 rounded-pill position-absolute top-0 start-50 translate-middle-x">
                  UN SDG Impact Award Winner
                </div>
              </div>
              <h5 className="mt-4 fw-semibold text-warning">Mr. Pandu Ranga Guptha</h5>
              <p className="mb-0 fst-italic text-light small">Founder & Chairman, The ART Foundation</p>
            </div>
            {/* Right Column: Founder Bio */}
            <div className="col-lg-7">
              <h2 className="display-5 fw-bold mb-4">Meet Our Founder</h2>
              <blockquote className="fs-5 fst-italic text-warning border-start border-warning ps-3 mb-4">
                "Every child is an artist — all they need is a platform to shine."
              </blockquote>
              <div className="founder-paragraph border-start border-4 border-warning ps-3 mb-4">
                <p className="fs-6 mb-2">
                  Mr. Pandu Ranga Guptha is the founder and chairman of The ART Foundation. A visionary educator and art enthusiast, he has dedicated his life to nurturing creativity among school children and building a culture of peace through education and artistic expression.
                </p>
              </div>
              <div className="founder-paragraph border-start border-4 border-warning ps-3 mb-4">
                <p className="fs-6 mb-2">
                  With a deep belief that art can inspire, heal, and educate, Mr. Guptha founded The ART Foundation in 2011. Under his leadership, the foundation has grown into a nationwide movement that supports young artists, promotes cultural exchange, and encourages sustainable thinking in classrooms.
                </p>
              </div>
              <div className="founder-paragraph border-start border-4 border-warning ps-3">
                <p className="fs-6 mb-0">
                  In May 2025, Mr. Guptha was awarded the <strong>United Nations SDG Impact Award</strong> for his efforts in <strong>implementing sustainable practices among school children</strong> through art and education. This global honor reflects his unwavering commitment to the <strong>Sustainable Development Goals (SDGs)</strong> and to empowering the next generation through creative engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* === Founder Section End === */}

      {/* === Mission & Vision Section Start === */}
      <section
        className="py-5 bg-section text-white"
        id="mission-vision"
        style={{ background: COMMON_DARKBLUE, color: COMMON_TEXT }}
      >
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Our Mission & Vision</h2>
            <p className="text-warning fst-italic" style={{ color: COMMON_TEXT }}>What drives The ART Foundation forward</p>
          </div>
          <div className="row g-4">
            {/* Mission Card */}
            <div className="col-md-6">
              <div className="card mission-card bg-section-card text-white border-0 shadow h-100">
                <div className="card-body p-4">
                  <div className="icon mb-3">
                    <img src="assets/images/icons/mission.png" alt="Mission Icon" width="50" />
                  </div>
                  <h5 className="card-title fw-semibold text-warning">Our Mission</h5>
                  <p className="card-text">
                    To foster creativity, cultural awareness, and peace through accessible art education. We aim to empower every child with a platform to express, grow, and contribute to sustainable development.
                  </p>
                </div>
              </div>
            </div>
            {/* Vision Card */}
            <div className="col-md-6">
              <div className="card mission-card bg-section-card text-white border-0 shadow h-100">
                <div className="card-body p-4">
                  <div className="icon mb-3">
                    <img src="assets/images/icons/vision.png" alt="Vision Icon" width="50" />
                  </div>
                  <h5 className="card-title fw-semibold text-warning">Our Vision</h5>
                  <p className="card-text">
                    To be a global beacon in art-led education, nurturing a generation that values creativity, sustainability, and inclusive growth—uniting communities through expression and empathy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* === Mission & Vision Section End === */}

      {/* === Statistics Section Start === */}
      <section className="py-5 bg-darkblue text-white" id="statistics">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="display-5 fw-bold">Our Statistics</h2>
            <p className="text-light fst-italic">Impact of The ART Foundation across India</p>
          </div>
          <div className="row text-center g-4">
            {/* Students */}
            <div className="col-md-4">
              <div className="stat-box p-4 rounded-4 shadow bg-section-card h-100">
                <img src="assets/images/icons/students.png" alt="Students" width="50" className="mb-3" />
                <h2 className="display-4 fw-bold text-warning counter">1<span className="text-white">M+</span></h2>
                <p className="mb-0">Students Participated</p>
              </div>
            </div>
            {/* Community Members */}
            <div className="col-md-4">
              <div className="stat-box p-4 rounded-4 shadow bg-section-card h-100">
                <img src="assets/images/icons/community.png" alt="Community" width="50" className="mb-3" />
                <h2 className="display-4 fw-bold text-warning counter">567<span className="text-white">+</span></h2>
                <p className="mb-0">Active Community Members</p>
              </div>
            </div>
            {/* Schools */}
            <div className="col-md-4">
              <div className="stat-box p-4 rounded-4 shadow bg-section-card h-100">
                <img src="assets/images/icons/school.png" alt="Schools" width="50" className="mb-3" />
                <h2 className="display-4 fw-bold text-warning counter">1425<span className="text-white">+</span></h2>
                <p className="mb-0">Active Schools</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* === Statistics Section End === */}

      {/* === CTA Section Start === */}
      <section className="py-5 bg-warning text-dark text-center" id="cta" style={{ background: COMMON_YELLOW, color: COMMON_TEXT_DARK }}>
        <div className="container">
          <h2 className="display-6 fw-bold mb-3">Be a Part of India's Largest Creative Movement</h2>
          <p className="mb-4 fs-5">Join The ART Foundation and empower change through art, education, and sustainability.</p>
          <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-3">
            <a href="#community" className="btn btn-outline-dark d-flex align-items-center gap-2 px-4 py-2 fw-semibold rounded-pill shadow-sm">
              <i className="bi bi-people-fill"></i>
              Join Our Community
            </a>
            <a href="#register" className="btn btn-dark d-flex align-items-center gap-2 px-4 py-2 fw-semibold rounded-pill shadow-sm">
              <i className="bi bi-building"></i>
              Register Your School
            </a>
            <a href="#online-competition.html" className="btn btn-outline-dark d-flex align-items-center gap-2 px-4 py-2 fw-semibold rounded-pill shadow-sm">
              <i className="bi bi-trophy-fill"></i>
              Online Competition
            </a>
          </div>
        </div>
      </section>
      {/* === CTA Section End === */}

      {/* === Community Join Form Section Start === */}
      <section className="bg-section text-white position-relative d-flex align-items-center" id="community">
        <div className="container community-content">
          <div className="text-center mb-3">
            <h2 className="display-5 fw-bold p-3">Join the Art Foundation Community</h2>
            <p className="fs-6 text-light">Any student or teacher from any school or college is welcome to join us.</p>
          </div>
          <form className="row g-2">
            <div className="col-md-6">
              <label htmlFor="name" className="form-label">Full Name</label>
              <input type="text" className="form-control" id="name" placeholder="Your Name" required />
            </div>
            <div className="col-md-3">
              <label htmlFor="age" className="form-label">Age</label>
              <input type="number" className="form-control" id="age" placeholder="e.g. 12" required />
            </div>
            <div className="col-md-3">
              <label htmlFor="grade" className="form-label">Grade</label>
              <input type="text" className="form-control" id="grade" placeholder="e.g. 7th Grade" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="email" className="form-label">Email Address</label>
              <input type="email" className="form-control" id="email" placeholder="example@email.com" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="whatsapp" className="form-label">WhatsApp Number</label>
              <input type="tel" className="form-control" id="whatsapp" placeholder="10-digit mobile number" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="medium" className="form-label">Preferred Art Medium</label>
              <input type="text" className="form-control" id="medium" placeholder="e.g. Watercolor, Pencil Sketching" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="school" className="form-label">School / College Name</label>
              <input type="text" className="form-control" id="school" placeholder="Full Institution Name" required />
            </div>
            <div className="col-md-6">
              <label htmlFor="role" className="form-label">I am a</label>
              <select className="form-select" id="role" required>
                <option value="" disabled>Choose one...</option>
                <option value="student">I am a Student</option>
                <option value="teacher">I am an Art Teacher</option>
              </select>
            </div>
            <div className="col-12 text-center mt-3">
              <button type="submit" className="btn btn-warning fw-bold text-dark px-5 py-2">Join Community</button>
            </div>
          </form>
        </div>
      </section>
      {/* === Community Join Form Section End === */}

      {/* === Footer Section Start === */}
      <footer className="bg-darkblue text-white pt-5 pb-4" id="footer">
        <div className="container">
          <div className="row gy-5">
            {/* Logo + About */}
            <div className="col-md-4">
              <img src="assets/images/logo/logo-footer.png" alt="The ART Foundation Logo" width="150" className="mb-3" />
              <p className="small text-light">
                The ART Foundation is dedicated to nurturing and promoting the artistic talents of young minds. Join our community and participate in our various programs to enhance your creative skills.
              </p>
              <div className="d-flex gap-3 mt-3">
                <a href="#" className="btn btn-icon" title="Facebook"><i className="bi bi-facebook"></i></a>
                <a href="#" className="btn btn-icon" title="Instagram"><i className="bi bi-instagram"></i></a>
                <a href="#" className="btn btn-icon" title="X"><i className="bi bi-twitter-x"></i></a>
                <a href="#" className="btn btn-icon" title="LinkedIn"><i className="bi bi-linkedin"></i></a>
              </div>
            </div>
            {/* Quick Links */}
            <div className="col-md-2">
              <h6 className="fw-bold mb-3">Quick Links</h6>
              <ul className="list-unstyled small">
                <li><a href="#">Home</a></li>
                <li><a href="#">About Us</a></li>
                <li><a href="#">Registration</a></li>
                <li><a href="#">Student Showcase</a></li>
                <li><a href="#">Events</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            {/* Programs */}
            <div className="col-md-3">
              <h6 className="fw-bold mb-3">Programs</h6>
              <ul className="list-unstyled small">
                <li><a href="#"><i className="bi bi-palette-fill text-warning me-2"></i>Competitions</a></li>
                <li><a href="#"><i className="bi bi-easel-fill text-warning me-2"></i>Workshops</a></li>
                <li><a href="#"><i className="bi bi-easel2-fill text-warning me-2"></i>Seminars</a></li>
                <li><a href="#"><i className="bi bi-people-fill text-warning me-2"></i>Community</a></li>
              </ul>
            </div>
            {/* Contact Info */}
            <div className="col-md-3">
              <h6 className="fw-bold mb-3">Contact Info</h6>
              <ul className="list-unstyled small">
                <li className="mb-3 d-flex align-items-start">
                  <i className="bi bi-telephone-fill text-warning me-3 fs-5 mt-1"></i>
                  <div>
                    <div>+91 76399 22228 / 76399 22223</div>
                    <small>Mon – Fri 10:00 AM – 7:00 PM</small>
                  </div>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="bi bi-envelope-fill text-warning me-3 fs-5 mt-1"></i>
                  <div>
                    <div>info@theartfoundation.in</div>
                    <div>ceo@theartfoundation.in</div>
                  </div>
                </li>
                <li className="d-flex align-items-start">
                  <i className="bi bi-geo-alt-fill text-warning me-3 fs-5 mt-1"></i>
                  <div>
                    India Office:<br />
                    Viveka Nagar, Namakkal,<br />
                    Tamil Nadu, India – 637409
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <hr className="border-light mt-5" />
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center text-center text-md-start small">
            <p className="mb-2 mb-md-0">© 2025 The ART Foundation. All rights reserved.</p>
            <div className="d-flex gap-3">
              <a href="#" className="text-white text-decoration-underline">Terms & Conditions</a>
              <a href="#" className="text-white text-decoration-underline">Privacy Policy</a>
            </div>
          </div>
        </div>
      </footer>
      {/* === Footer Section End === */}

      {/* Login/Register Modal */}
      {showLoginRegister && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.3)" }}
          tabIndex="-1"
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered modal-sm" role="document">
            <div
              className="modal-content"
              style={{
                borderRadius: "1rem",
                border: "3px solidrgb(223, 176, 35)",
                background: "#fffbe6",
              }}
            >
              <div className="modal-header border-0 pb-0" style={{ background: "transparent" }}>
                <h5 className="modal-title w-100 text-center fw-bold" style={{ color: "#222" }}>
                  Welcome
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowLoginRegister(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <button
                  className="btn w-100 mb-3 fw-semibold"
                  style={{
                    borderRadius: "2rem",
                    background: "#ffc107",
                    color: "#222",
                    border: "2px solid #ffc107",
                  }}
                  onClick={() => {
                    setShowLoginRegister(false);
                    navigate("/login");
                  }}
                >
                  Login
                </button>
                <button
                  className="btn w-100 fw-semibold"
                  style={{
                    borderRadius: "2rem",
                    background: "#fffbe6",
                    color: "#222",
                    border: "2px solid #ffc107",
                  }}
                  onClick={() => {
                    setShowLoginRegister(false);
                    navigate("/register-school");
                  }}
                >
                  Register School
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomePage;