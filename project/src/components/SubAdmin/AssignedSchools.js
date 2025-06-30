import React, { useEffect, useState } from "react";
import { db, auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  collection,
  getDocs,
  doc,
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
  Button,
  Avatar,
  Tooltip,
  LinearProgress
} from '@mui/material';
import {
  Dashboard,
  School,
  Assignment,
  Visibility,
  Search,
  Phone,
  Email,
  LocationOn
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';

const AssignedSchools = ({ darkMode, onThemeToggle }) => {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [schools, setSchools] = useState([]);
  const [studentsCountMap, setStudentsCountMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/subadmin/dashboard' },
    { text: 'Assigned Schools', icon: <School />, path: '/subadmin/schools' },
    { text: 'Progress Tracking', icon: <Assignment />, path: '/subadmin/progress' }
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
    
    const fetchData = async () => {
      try {
        // Fetch assigned schools
        const schoolsSnap = await getDocs(collection(db, "schools"));
        const assignedSchools = schoolsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((school) => school.assignedSubadminId === user.uid);
        setSchools(assignedSchools);

        // Fetch students count
        const studentsSnap = await getDocs(collection(db, "students"));
        const countMap = {};
        studentsSnap.forEach((studentDoc) => {
          const data = studentDoc.data();
          if (!data.schoolId) return;
          countMap[data.schoolId] = (countMap[data.schoolId] || 0) + 1;
        });
        setStudentsCountMap(countMap);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const filteredSchools = schools.filter((school) => {
    const search = searchTerm.toLowerCase();
    return (
      (school.name || "").toLowerCase().includes(search) ||
      (school.email || "").toLowerCase().includes(search) ||
      (school.phone || "").toLowerCase().includes(search) ||
      (school.principal || "").toLowerCase().includes(search) ||
      (school.address || "").toLowerCase().includes(search)
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'acknowledged': return 'info';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  if (loading) {
    return (
      <Layout
        title="Assigned Schools"
        userRole="subadmin"
        userName={userProfile?.name}
        userEmail={auth.currentUser?.email}
        menuItems={menuItems}
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading assigned schools...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout
      title="Assigned Schools"
      userRole="subadmin"
      userName={userProfile?.name || userProfile?.username}
      userEmail={auth.currentUser?.email}
      menuItems={menuItems}
      darkMode={darkMode}
      onThemeToggle={onThemeToggle}
    >
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Assigned Schools
          </Typography>
          <Typography variant="h6" color="text.secondary">
            View and manage your assigned schools
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Assigned"
              value={schools.length}
              icon={<School />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Completed"
              value={schools.filter(s => s.status === 'acknowledged').length}
              icon={<Assignment />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="In Progress"
              value={schools.filter(s => s.status === 'approved').length}
              icon={<Dashboard />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Students"
              value={Object.values(studentsCountMap).reduce((sum, count) => sum + count, 0)}
              icon={<Dashboard />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                School List ({filteredSchools.length})
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
                sx={{ width: 300 }}
              />
            </Box>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell><strong>School</strong></TableCell>
                    <TableCell><strong>Principal</strong></TableCell>
                    <TableCell><strong>Contact</strong></TableCell>
                    <TableCell><strong>Students</strong></TableCell>
                    <TableCell><strong>Progress</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <School sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            No schools assigned
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'Try adjusting your search' : 'No schools have been assigned to you yet'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => {
                      const progress = getProgressPercentage(school);
                      
                      return (
                        <TableRow key={school.id} hover>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                {school.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {school.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {school.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {school.principal || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                                <Phone sx={{ fontSize: 16, mr: 0.5 }} />
                                {school.phone || "N/A"}
                              </Typography>
                              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                <Email sx={{ fontSize: 16, mr: 0.5 }} />
                                {school.email || "N/A"}
                              </Typography>
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
                                {Math.round(progress)}% Complete
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={school.status === 'acknowledged' ? 'Completed' : school.status || 'Pending'}
                              color={getStatusColor(school.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedSchool(school);
                                  setDialogOpen(true);
                                }}
                              >
                                <Visibility />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* School Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {selectedSchool?.name?.charAt(0)}
              </Avatar>
              {selectedSchool?.name} - School Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedSchool && (
              <Grid container spacing={3} sx={{ pt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Basic Information
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">School Name</Typography>
                        <Typography variant="body1">{selectedSchool.name}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Principal</Typography>
                        <Typography variant="body1">{selectedSchool.principal || "N/A"}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{selectedSchool.email}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                        <Typography variant="body1">{selectedSchool.phone || "N/A"}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                        <Typography variant="body1">{selectedSchool.address || "N/A"}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Progress Status
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Overall Progress</Typography>
                        <LinearProgress
                          variant="determinate"
                          value={getProgressPercentage(selectedSchool)}
                          color={getProgressColor(getProgressPercentage(selectedSchool))}
                          sx={{ mt: 1, mb: 1 }}
                        />
                        <Typography variant="body2">
                          {Math.round(getProgressPercentage(selectedSchool))}% Complete
                        </Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Students Registered</Typography>
                        <Typography variant="body1">{studentsCountMap[selectedSchool.id] || 0}</Typography>
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Current Status</Typography>
                        <Chip
                          label={selectedSchool.status === 'acknowledged' ? 'Completed' : selectedSchool.status || 'Pending'}
                          color={getStatusColor(selectedSchool.status)}
                          size="small"
                        />
                      </Box>
                      
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Registration Date</Typography>
                        <Typography variant="body1">
                          {selectedSchool.createdAt
                            ? new Date(selectedSchool.createdAt).toLocaleDateString()
                            : "N/A"}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default AssignedSchools;