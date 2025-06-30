import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  doc,
  deleteDoc,
  getDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Avatar,
  Fab,
  Tooltip,
  Container,
  useTheme,
  alpha,
  LinearProgress,
  CircularProgress,
  useMediaQuery,
  Slide,
  Zoom,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Stack,
  Divider,
  Badge
} from '@mui/material';
import {
  Dashboard,
  People,
  PersonAdd,
  Visibility,
  Delete,
  Search,
  Add,
  School as SchoolIcon,
  Warning,
  CheckCircle,
  Upload,
  Download,
  TrendingUp,
  Edit,
  Assessment,
  Home,
  BarChart,
  Close,
  ArrowBack,
  EmojiEvents,
  Star,
  Timeline,
  Group,
  Person,
  Email
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import Swal from 'sweetalert2';

const SchoolDashboard = ({ darkMode, onThemeToggle }) => {
  const [schoolName, setSchoolName] = useState("");
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [viewStudent, setViewStudent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    fullName: "",
    age: "",
    grade: "",
    gender: "male",
    email: ""
  });
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(480));

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <Dashboard />, 
      path: '/school/dashboard'
    },
    { 
      text: 'Students', 
      icon: <People />, 
      path: '/school/students'
    },
    { 
      text: 'Add Student', 
      icon: <PersonAdd />, 
      path: '/student/add'
    },
    { 
      text: 'Bulk Add', 
      icon: <Upload />, 
      path: '/school/bulk-add'
    }
  ];

  const speedDialActions = [
    {
      icon: <PersonAdd />,
      name: 'Add Student',
      action: () => setAddStudentDialogOpen(true)
    },
    {
      icon: <Upload />,
      name: 'Bulk Add',
      action: () => navigate('/school/bulk-add')
    },
    {
      icon: <People />,
      name: 'View All',
      action: () => navigate('/school/students')
    },
    {
      icon: <Download />,
      name: 'Export',
      action: () => exportToCSV()
    }
  ];

  // Fetch school info
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const schoolRef = doc(db, "schools", user.uid);
    getDoc(schoolRef).then((snap) => {
      if (snap.exists()) {
        const schoolData = { id: snap.id, ...snap.data() };
        setSchool(schoolData);
        setSchoolName(schoolData.name);
      }
      setLoading(false);
    }).catch((error) => {
      console.error("Error fetching school:", error);
      setLoading(false);
    });
  }, [user]);

  // Fetch students
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "students"),
      where("schoolId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    getDocs(q).then((snap) =>
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    ).catch((error) => {
      console.error("Error fetching students:", error);
    });
  }, [user]);

  const handleAddStudent = async () => {
    if (!newStudent.fullName.trim() || !newStudent.age || !newStudent.grade || !newStudent.email.trim()) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    if (school?.isFrozen) {
      Swal.fire('Error', 'Student registration is currently frozen', 'error');
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        ...newStudent,
        age: Number(newStudent.age),
        schoolId: user.uid,
        schoolName: schoolName,
        competitionName: "13th National level drawing competition",
        chartStatus: false,
        certificateStatus: false,
        awardStatus: false,
        paymentStatus: false,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "students"), data);
      setStudents((prev) => [
        { id: docRef.id, ...data, createdAt: { toDate: () => new Date() } },
        ...prev,
      ]);

      setNewStudent({
        fullName: "",
        age: "",
        grade: "",
        gender: "male",
        email: ""
      });
      setAddStudentDialogOpen(false);

      Swal.fire({
        title: 'Success!',
        text: 'Student added successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to add student: ' + error.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, studentName) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Remove ${studentName} from the competition?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove!'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "students", id));
        setStudents((prev) => prev.filter((s) => s.id !== id));
        Swal.fire({
          title: 'Removed!',
          text: 'Student has been removed.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to remove student', 'error');
    }
  };

  const exportToCSV = () => {
    const csvContent = [
      'Full Name,Age,Grade,Gender,Email,Registration Date',
      ...filtered.map(s => 
        `${s.fullName},${s.age},${s.grade},${s.gender},${s.email},${s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : 'N/A'}`
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schoolName}_students.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filtered = students.filter((s) => {
    const searchLower = search.toLowerCase();
    const registeredDate = s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : "";
    return (
      s.fullName.toLowerCase().includes(searchLower) ||
      s.grade.toLowerCase().includes(searchLower) ||
      s.age.toString().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      registeredDate.includes(searchLower)
    );
  });

  const getGradeColor = (grade) => {
    if (grade.includes('KG')) return 'secondary';
    const gradeNum = parseInt(grade.replace('Grade ', ''));
    if (gradeNum <= 5) return 'primary';
    if (gradeNum <= 8) return 'info';
    return 'success';
  };

  const thisMonthStudents = students.filter(s => {
    const studentDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
    const thisMonth = new Date();
    return studentDate.getMonth() === thisMonth.getMonth() && 
           studentDate.getFullYear() === thisMonth.getFullYear();
  }).length;

  const recentStudents = students.filter(s => {
    const studentDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return studentDate >= weekAgo;
  }).length;

  if (loading) {
    return (
      <Layout
        title="School Dashboard"
        userRole="school"
        userName={schoolName}
        userEmail={auth.currentUser?.email}
        menuItems={menuItems}
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
      >
        <Box 
          sx={{ 
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#ffffff'
          }}
        >
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
            <Typography variant="h6" color="text.secondary">
              Loading Dashboard...
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Please wait while we fetch your school data
            </Typography>
          </Box>
        </Box>
      </Layout>
    );
  }

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        width: '100vw',
        overflow: 'hidden'
      }}
    >
      <Layout
        title="School Dashboard"
        userRole="school"
        userName={schoolName}
        userEmail={auth.currentUser?.email}
        menuItems={menuItems}
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
      >
        <Container 
          maxWidth="xl" 
          sx={{ 
            px: { xs: 1, sm: 2 },
            py: { xs: 2, sm: 3 },
            backgroundColor: '#ffffff',
            minHeight: '100vh'
          }}
        >
          {/* Welcome Section with Enhanced Design */}
          <Box sx={{ 
            mb: { xs: 3, md: 4 }, 
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
            borderRadius: { xs: 3, md: 4 },
            p: { xs: 3, sm: 4, md: 6 },
            position: 'relative',
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%231976d2" fill-opacity="0.03"%3E%3Ccircle cx="30" cy="30" r="4"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              zIndex: 0
            }
          }}>
            <Box sx={{ position: 'relative', zIndex: 1 }}>
              {/* School Logo/Avatar */}
              <Avatar
                sx={{
                  width: { xs: 80, sm: 100, md: 120 },
                  height: { xs: 80, sm: 100, md: 120 },
                  mx: 'auto',
                  mb: 3,
                  bgcolor: 'primary.main',
                  fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
                  fontWeight: 'bold',
                  boxShadow: '0 8px 32px rgba(25, 118, 210, 0.3)',
                  border: '4px solid rgba(255, 255, 255, 0.8)'
                }}
              >
                {schoolName.charAt(0)}
              </Avatar>

              <Typography 
                variant={isExtraSmall ? "h5" : isSmallMobile ? "h4" : isMobile ? "h3" : "h2"} 
                fontWeight="bold" 
                color="primary" 
                gutterBottom
                sx={{ 
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                  textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {isSmallMobile && schoolName.length > 25 
                  ? schoolName.substring(0, 25) + '...' 
                  : schoolName
                }
              </Typography>
              
              <Typography 
                variant={isExtraSmall ? "body1" : isSmallMobile ? "h6" : "h5"} 
                color="text.secondary" 
                sx={{ mb: 3, fontWeight: 500 }}
              >
                13th National Drawing Competition Portal
              </Typography>
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={2} 
                justifyContent="center" 
                alignItems="center"
              >
                <Chip 
                  icon={<People />} 
                  label={`${students.length} Students Registered`} 
                  color="primary" 
                  size={isSmallMobile ? "medium" : "large"}
                  sx={{
                    fontWeight: 600,
                    px: 2,
                    py: 1,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)'
                  }}
                />
                
                <Chip 
                  icon={<EmojiEvents />} 
                  label="Competition Active" 
                  color="success" 
                  size={isSmallMobile ? "medium" : "large"}
                  sx={{
                    fontWeight: 600,
                    px: 2,
                    py: 1,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    boxShadow: '0 4px 12px rgba(76, 175, 80, 0.2)'
                  }}
                />
              </Stack>
            </Box>
          </Box>

          {/* Enhanced Freeze Alert */}
          {school?.isFrozen && (
            <Zoom in={true}>
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 3,
                  border: '2px solid #ff9800',
                  backgroundColor: alpha('#ff9800', 0.1),
                  '& .MuiAlert-message': {
                    width: '100%',
                    textAlign: 'center'
                  },
                  '& .MuiAlert-icon': {
                    fontSize: '2rem'
                  }
                }}
                icon={<Warning sx={{ fontSize: '2rem' }} />}
              >
                <Typography fontWeight="bold" variant={isSmallMobile ? "body1" : "h6"}>
                  🚫 Registration Frozen
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Adding new students is currently disabled by the administrator
                </Typography>
              </Alert>
            </Zoom>
          )}

          {/* Enhanced Stats Cards */}
          <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: { xs: 3, md: 4 } }}>
            <Grid item xs={6} sm={3}>
              <StatsCard
                title="Total Students"
                value={students.length}
                icon={<People />}
                color="primary"
                subtitle="Registered"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatsCard
                title="This Month"
                value={thisMonthStudents}
                icon={<PersonAdd />}
                color="success"
                subtitle="New registrations"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatsCard
                title="Recent"
                value={recentStudents}
                icon={<TrendingUp />}
                color="info"
                subtitle="Last 7 days"
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <StatsCard
                title="Status"
                value={school?.isFrozen ? "Frozen" : "Active"}
                icon={school?.isFrozen ? <Warning /> : <CheckCircle />}
                color={school?.isFrozen ? "warning" : "success"}
                subtitle="Registration"
              />
            </Grid>
          </Grid>

          {/* Enhanced Quick Actions */}
          {!school?.isFrozen && (
            <Card sx={{ 
              mb: 3, 
              borderRadius: 3, 
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}>
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom sx={{ mb: 3 }}>
                  Quick Actions
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<PersonAdd />}
                      onClick={() => setAddStudentDialogOpen(true)}
                      sx={{ 
                        py: { xs: 2, sm: 2.5 },
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                        boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                        }
                      }}
                    >
                      Add Student
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Upload />}
                      onClick={() => navigate('/school/bulk-add')}
                      sx={{ 
                        py: { xs: 2, sm: 2.5 },
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 15px rgba(25, 118, 210, 0.2)'
                        }
                      }}
                    >
                      Bulk Add
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<People />}
                      onClick={() => navigate('/school/students')}
                      sx={{ 
                        py: { xs: 2, sm: 2.5 },
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 15px rgba(25, 118, 210, 0.2)'
                        }
                      }}
                    >
                      View All
                    </Button>
                  </Grid>
                  <Grid item xs={12} sm={6} md={3}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Download />}
                      onClick={exportToCSV}
                      sx={{ 
                        py: { xs: 2, sm: 2.5 },
                        borderRadius: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        borderWidth: 2,
                        '&:hover': {
                          borderWidth: 2,
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 15px rgba(25, 118, 210, 0.2)'
                        }
                      }}
                    >
                      Export Data
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Main Content Card */}
          <Card sx={{ 
            borderRadius: { xs: 3, md: 4 }, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            backgroundColor: '#ffffff'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
              {/* Enhanced Header with Search */}
              <Stack 
                direction={{ xs: 'column', md: 'row' }}
                justifyContent="space-between" 
                alignItems={{ xs: 'stretch', md: 'center' }} 
                spacing={3}
                sx={{ mb: 4 }}
              >
                <Box>
                  <Typography 
                    variant={isSmallMobile ? "h5" : isMobile ? "h4" : "h3"} 
                    fontWeight="bold" 
                    color="primary"
                    gutterBottom
                  >
                    Recent Students
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Showing {Math.min(filtered.length, 10)} of {students.length} registered students
                  </Typography>
                </Box>
                
                <TextField
                  placeholder="Search students..."
                  variant="outlined"
                  size="medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ 
                    minWidth: { xs: '100%', md: 300 },
                    maxWidth: { xs: '100%', md: 400 },
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 3,
                      backgroundColor: '#ffffff',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)',
                      },
                      '&.Mui-focused': {
                        boxShadow: '0 4px 12px rgba(25, 118, 210, 0.25)',
                      }
                    }
                  }}
                />
              </Stack>

              {/* Enhanced Students Table */}
              <TableContainer 
                component={Paper} 
                elevation={0} 
                sx={{ 
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  overflow: 'hidden',
                  overflowX: 'auto',
                  backgroundColor: '#ffffff'
                }}
              >
                <Table size={isSmallMobile ? "small" : "medium"}>
                  <TableHead sx={{ 
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`
                  }}>
                    <TableRow>
                      <TableCell sx={{ minWidth: { xs: 200, sm: 250 } }}>
                        <Typography fontWeight="bold" variant="subtitle2" color="primary">
                          Student Information
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 70 }}>
                        <Typography fontWeight="bold" variant="subtitle2" color="primary">
                          Age
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 100 }}>
                        <Typography fontWeight="bold" variant="subtitle2" color="primary">
                          Grade
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, minWidth: 80 }}>
                        <Typography fontWeight="bold" variant="subtitle2" color="primary">
                          Gender
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <Typography fontWeight="bold" variant="subtitle2" color="primary">
                          Actions
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filtered.length ? (
                      filtered.slice(0, 10).map((student, index) => (
                        <TableRow 
                          key={student.id} 
                          hover
                          sx={{
                            '&:nth-of-type(odd)': {
                              backgroundColor: alpha(theme.palette.action.hover, 0.3),
                            },
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.05),
                              transform: 'scale(1.01)',
                              transition: 'all 0.2s ease'
                            }
                          }}
                        >
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                  <Box
                                    sx={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: '50%',
                                      bgcolor: 'success.main',
                                      border: '2px solid white'
                                    }}
                                  />
                                }
                              >
                                <Avatar 
                                  sx={{ 
                                    mr: { xs: 1.5, sm: 2 }, 
                                    bgcolor: theme.palette.primary.main,
                                    width: { xs: 36, sm: 44 },
                                    height: { xs: 36, sm: 44 },
                                    fontSize: { xs: '1rem', sm: '1.2rem' },
                                    fontWeight: 'bold',
                                    boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
                                  }}
                                >
                                  {student.fullName.charAt(0)}
                                </Avatar>
                              </Badge>
                              <Box>
                                <Typography 
                                  variant="subtitle2" 
                                  fontWeight="bold" 
                                  noWrap
                                  sx={{ 
                                    maxWidth: { xs: 140, sm: 180, md: 220 },
                                    fontSize: { xs: '0.875rem', sm: '1rem' }
                                  }}
                                >
                                  {isSmallMobile && student.fullName.length > 15 
                                    ? student.fullName.substring(0, 15) + '...' 
                                    : student.fullName
                                  }
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  color="text.secondary" 
                                  sx={{ 
                                    display: { xs: 'block', sm: 'block' },
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' },
                                    maxWidth: { xs: 140, sm: 180, md: 220 },
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  {isSmallMobile && student.email.length > 20 
                                    ? student.email.substring(0, 20) + '...' 
                                    : student.email
                                  }
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={student.age} 
                              color="info" 
                              size="small" 
                              variant="outlined"
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={student.grade} 
                              color={getGradeColor(student.grade)} 
                              size="small" 
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                textTransform: 'capitalize',
                                fontWeight: 500,
                                fontSize: { xs: '0.8rem', sm: '0.875rem' }
                              }}
                            >
                              {student.gender}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => {
                                    setViewStudent(student);
                                    setDialogOpen(true);
                                  }}
                                  sx={{
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      backgroundColor: alpha(theme.palette.primary.main, 0.1)
                                    }
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove Student">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleDelete(student.id, student.fullName)}
                                  sx={{
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      backgroundColor: alpha(theme.palette.error.main, 0.1)
                                    }
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                          <Box display="flex" flexDirection="column" alignItems="center">
                            <Avatar
                              sx={{
                                width: 80,
                                height: 80,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                                color: 'primary.main',
                                mb: 3
                              }}
                            >
                              <People sx={{ fontSize: 40 }} />
                            </Avatar>
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                              No students found
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
                              {search ? 'Try adjusting your search terms' : 'Start by adding your first student to the competition'}
                            </Typography>
                            {!search && !school?.isFrozen && (
                              <Button
                                variant="contained"
                                startIcon={<PersonAdd />}
                                onClick={() => setAddStudentDialogOpen(true)}
                                sx={{
                                  borderRadius: 3,
                                  px: 4,
                                  py: 1.5,
                                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 6px 20px rgba(25, 118, 210, 0.4)',
                                  }
                                }}
                              >
                                Add Your First Student
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Enhanced Show All Students Button */}
              {filtered.length > 10 && (
                <Box sx={{ textAlign: 'center', mt: 4 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/school/students')}
                    startIcon={<People />}
                    endIcon={<Badge badgeContent={students.length} color="primary" />}
                    sx={{
                      borderRadius: 4,
                      textTransform: 'none',
                      fontWeight: 600,
                      px: 6,
                      py: 2,
                      borderWidth: 2,
                      '&:hover': {
                        borderWidth: 2,
                        transform: 'translateY(-2px)',
                        boxShadow: '0 8px 25px rgba(25, 118, 210, 0.2)'
                      }
                    }}
                  >
                    View All Students
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Enhanced View Student Dialog */}
          <Dialog 
            open={dialogOpen} 
            onClose={() => setDialogOpen(false)} 
            maxWidth="sm" 
            fullWidth
            fullScreen={isSmallMobile}
            TransitionComponent={Slide}
            TransitionProps={{ direction: "up" }}
            PaperProps={{
              sx: { 
                borderRadius: isSmallMobile ? 0 : 4,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                backgroundColor: '#ffffff'
              }
            }}
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 48, height: 48 }}>
                    {viewStudent?.fullName?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant={isSmallMobile ? "h6" : "h5"} fontWeight="bold">
                      Student Details
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Competition Registration
                    </Typography>
                  </Box>
                </Box>
                {isSmallMobile && (
                  <IconButton onClick={() => setDialogOpen(false)}>
                    <Close />
                  </IconButton>
                )}
              </Box>
            </DialogTitle>
            <DialogContent sx={{ backgroundColor: '#ffffff' }}>
              {viewStudent && (
                <Box sx={{ pt: 2 }}>
                  <Card variant="outlined" sx={{ mb: 3, borderRadius: 3, backgroundColor: '#ffffff' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <Star sx={{ mr: 1 }} />
                        {viewStudent.fullName}
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Grid container spacing={3}>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                          <Typography variant="h6" fontWeight="bold">{viewStudent.age} years</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Grade</Typography>
                          <Typography variant="h6" fontWeight="bold">{viewStudent.grade}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                          <Typography variant="body1" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                            {viewStudent.gender}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="text.secondary">Registration Date</Typography>
                          <Typography variant="body1" fontWeight="500">
                            {viewStudent.createdAt?.toDate ? 
                              viewStudent.createdAt.toDate().toLocaleDateString() : 
                              "—"
                            }
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="text.secondary">Email Address</Typography>
                          <Typography 
                            variant="body1" 
                            sx={{ 
                              wordBreak: 'break-word',
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                              fontWeight: 500
                            }}
                          >
                            {viewStudent.email}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>

                  <Alert severity="info" sx={{ borderRadius: 2 }}>
                    <Typography variant="body2">
                      This student is registered for the <strong>13th National Level Drawing Competition</strong>
                    </Typography>
                  </Alert>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 3, backgroundColor: '#ffffff' }}>
              <Button 
                onClick={() => setDialogOpen(false)} 
                variant="outlined" 
                fullWidth={isSmallMobile}
                sx={{ borderRadius: 3, fontWeight: 600 }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Enhanced Add Student Dialog */}
          <Dialog 
            open={addStudentDialogOpen} 
            onClose={() => setAddStudentDialogOpen(false)} 
            maxWidth="sm" 
            fullWidth
            fullScreen={isSmallMobile}
            TransitionComponent={Slide}
            TransitionProps={{ direction: "up" }}
            PaperProps={{
              sx: { 
                borderRadius: isSmallMobile ? 0 : 4,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                backgroundColor: '#ffffff'
              }
            }}
          >
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box display="flex" alignItems="center">
                  <PersonAdd sx={{ mr: 1, color: 'primary.main', fontSize: '2rem' }} />
                  <Box>
                    <Typography variant={isSmallMobile ? "h6" : "h5"} color="primary" fontWeight="bold">
                      Add New Student
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Register student for the competition
                    </Typography>
                  </Box>
                </Box>
                {isSmallMobile && (
                  <IconButton onClick={() => setAddStudentDialogOpen(false)}>
                    <Close />
                  </IconButton>
                )}
              </Box>
            </DialogTitle>
            <DialogContent sx={{ backgroundColor: '#ffffff' }}>
              <Box sx={{ pt: 2 }}>
                <TextField
                  margin="dense"
                  label="Full Name"
                  fullWidth
                  variant="outlined"
                  value={newStudent.fullName}
                  onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                  sx={{ mb: 3 }}
                  required
                  disabled={submitting}
                  placeholder="Enter student's full name"
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6}>
                    <TextField
                      label="Age"
                      type="number"
                      fullWidth
                      variant="outlined"
                      value={newStudent.age}
                      onChange={(e) => setNewStudent({ ...newStudent, age: e.target.value })}
                      inputProps={{ min: 3, max: 20 }}
                      required
                      disabled={submitting}
                      placeholder="Age"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControl fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select
                        value={newStudent.gender}
                        label="Gender"
                        onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                        disabled={submitting}
                      >
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Grade</InputLabel>
                  <Select
                    value={newStudent.grade}
                    label="Grade"
                    onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                    required
                    disabled={submitting}
                  >
                    <MenuItem value="PreKG">PreKG</MenuItem>
                    <MenuItem value="LKG">LKG</MenuItem>
                    <MenuItem value="UKG">UKG</MenuItem>
                    {[...Array(12)].map((_, i) => (
                      <MenuItem key={i + 1} value={`Grade ${i + 1}`}>
                        Grade {i + 1}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  margin="dense"
                  label="Email Address"
                  type="email"
                  fullWidth
                  variant="outlined"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                  required
                  disabled={submitting}
                  placeholder="student@example.com"
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ 
              p: 3, 
              flexDirection: isSmallMobile ? 'column' : 'row', 
              gap: isSmallMobile ? 2 : 1,
              backgroundColor: '#ffffff'
            }}>
              <Button 
                onClick={() => setAddStudentDialogOpen(false)} 
                variant="outlined"
                disabled={submitting}
                fullWidth={isSmallMobile}
                sx={{ borderRadius: 3, fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleAddStudent} 
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={20} /> : <PersonAdd />}
                fullWidth={isSmallMobile}
                sx={{ 
                  ml: isSmallMobile ? 0 : 1,
                  borderRadius: 3,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                  }
                }}
              >
                {submitting ? 'Adding Student...' : 'Add Student'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Enhanced Speed Dial for Mobile */}
          {!school?.isFrozen && isMobile && (
            <SpeedDial
              ariaLabel="Quick Actions"
              sx={{ position: 'fixed', bottom: 24, right: 24 }}
              icon={<SpeedDialIcon />}
              onClose={() => setSpeedDialOpen(false)}
              onOpen={() => setSpeedDialOpen(true)}
              open={speedDialOpen}
            >
              {speedDialActions.map((action) => (
                <SpeedDialAction
                  key={action.name}
                  icon={action.icon}
                  tooltipTitle={action.name}
                  onClick={() => {
                    action.action();
                    setSpeedDialOpen(false);
                  }}
                />
              ))}
            </SpeedDial>
          )}
        </Container>
      </Layout>
    </Box>
  );
};

export default SchoolDashboard;