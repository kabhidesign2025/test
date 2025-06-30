import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
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
  Avatar,
  Tooltip,
  LinearProgress,
  Container,
  useMediaQuery,
  useTheme,
  Button
} from '@mui/material';
import {
  Dashboard,
  School,
  Assignment,
  Visibility,
  Check,
  Search,
  CheckCircle
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import Swal from 'sweetalert2';

const SubAdminDashboard = ({ darkMode, onThemeToggle }) => {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [schools, setSchools] = useState([]);
  const [viewSchool, setViewSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);
  const [studentsCountMap, setStudentsCountMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/subadmin/dashboard' },
    { text: 'Schools', icon: <School />, path: '/subadmin/schools' },
    { text: 'Progress', icon: <Assignment />, path: '/subadmin/progress' }
  ];

  // Fetch user profile
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) setUserProfile(snap.data());
    });
  }, [user]);

  // Fetch schools and students
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getDocs(collection(db, "schools")).then(async (snap) => {
      const assignedSchools = snap.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((school) => school.assignedSubadminId === user.uid);
      setSchools(assignedSchools);
      setCompletedCount(
        assignedSchools.filter((s) => s.status === "acknowledged").length
      );

      // Fetch all students once and count per school
      const studentsSnap = await getDocs(collection(db, "students"));
      const countMap = {};
      studentsSnap.forEach((studentDoc) => {
        const data = studentDoc.data();
        if (!data.schoolId) return;
        countMap[data.schoolId] = (countMap[data.schoolId] || 0) + 1;
      });
      setStudentsCountMap(countMap);

      setLoading(false);
    });
  }, [user]);

  // Field change
  const handleFieldChange = async (schoolId, field, value) => {
    try {
      await updateDoc(doc(db, "schools", schoolId), { [field]: value });
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolId ? { ...s, [field]: value } : s))
      );
      
      Swal.fire({
        title: 'Updated!',
        text: 'Field updated successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to update field', 'error');
    }
  };

  // Acknowledge handler
  const handleAcknowledge = async (schoolId, schoolName) => {
    try {
      const result = await Swal.fire({
        title: 'Submit Progress?',
        text: `Mark ${schoolName} as completed?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4caf50',
        confirmButtonText: 'Yes, submit!'
      });

      if (result.isConfirmed) {
        await updateDoc(doc(db, "schools", schoolId), { status: "acknowledged" });
        setSchools((prev) =>
          prev.map((s) =>
            s.id === schoolId ? { ...s, status: "acknowledged" } : s
          )
        );
        setCompletedCount((prev) => prev + 1);
        
        Swal.fire({
          title: 'Submitted!',
          text: 'School progress submitted successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to submit school progress', 'error');
    }
  };

  // Search filter
  const filteredSchools = schools.filter((school) => {
    const search = searchTerm.toLowerCase();
    return (
      (school.name || "").toLowerCase().includes(search) ||
      (school.email || "").toLowerCase().includes(search) ||
      (school.phone || "").toLowerCase().includes(search) ||
      (school.principal || "").toLowerCase().includes(search)
    );
  });

  const getProgressPercentage = (school) => {
    const fields = [
      'countAwaitingYesNo',
      'chartSentYesNo',
      'competitionCompletedYesNo',
      'chartReceivedYesNo',
      'certificateSentYesNo'
    ];
    const completed = fields.filter(field => school[field] === 'yes').length;
    return (completed / fields.length) * 100;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'success';
    if (percentage >= 50) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Layout
        title="Sub Admin Dashboard"
        userRole="subadmin"
        userName={userProfile?.name}
        userEmail={auth.currentUser?.email}
        menuItems={menuItems}
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout
      title="Sub Admin Dashboard"
      userRole="subadmin"
      userName={userProfile?.name || userProfile?.username}
      userEmail={auth.currentUser?.email}
      menuItems={menuItems}
      darkMode={darkMode}
      onThemeToggle={onThemeToggle}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
        {/* Stats Cards */}
        <Grid container spacing={isMobile ? 1 : 3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Assigned"
              value={schools.length}
              icon={<School />}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Completed"
              value={completedCount}
              icon={<CheckCircle />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="In Progress"
              value={schools.length - completedCount}
              icon={<Assignment />}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Students"
              value={Object.values(studentsCountMap).reduce((sum, count) => sum + count, 0)}
              icon={<Dashboard />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'stretch', sm: 'center' }, 
              mb: 2,
              gap: 2
            }}>
              <Typography variant={isMobile ? "h6" : "h5"} fontWeight="bold">
                School Management
              </Typography>
              <TextField
                placeholder="Search schools..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ minWidth: { xs: '100%', sm: 250 } }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>School</strong></TableCell>
                    <TableCell><strong>Students</strong></TableCell>
                    <TableCell><strong>Progress</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchools.map((school) => {
                    const progress = getProgressPercentage(school);
                    const isCompleted = school.status === "acknowledged";
                    
                    return (
                      <TableRow 
                        key={school.id} 
                        hover
                        sx={isCompleted ? { opacity: 0.7, bgcolor: '#f5f5f5' } : {}}
                      >
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 1, bgcolor: 'primary.main', width: 32, height: 32 }}>
                              {school.name?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {school.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {school.principal}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={studentsCountMap[school.id] || 0}
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ width: '100%' }}>
                            <LinearProgress
                              variant="determinate"
                              value={progress}
                              color={getProgressColor(progress)}
                              sx={{ mb: 0.5 }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {Math.round(progress)}%
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isCompleted ? "Submitted" : "In Progress"}
                            color={isCompleted ? "success" : "warning"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="View">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setViewSchool(school);
                                  setDialogOpen(true);
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            {!isCompleted && (
                              <Tooltip title="Submit">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleAcknowledge(school.id, school.name)}
                                >
                                  <Check fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* School Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {viewSchool?.name?.charAt(0)}
              </Avatar>
              {viewSchool?.name} Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {viewSchool && (
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Principal</Typography>
                  <Typography variant="body1" gutterBottom>{viewSchool.principal || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1" gutterBottom>{viewSchool.email || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1" gutterBottom>{viewSchool.phone || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Students</Typography>
                  <Typography variant="body1" gutterBottom>{studentsCountMap[viewSchool.id] || 0}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Progress</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressPercentage(viewSchool)}
                    color={getProgressColor(getProgressPercentage(viewSchool))}
                    sx={{ mt: 1, mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    {Math.round(getProgressPercentage(viewSchool))}% Complete
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default SubAdminDashboard;