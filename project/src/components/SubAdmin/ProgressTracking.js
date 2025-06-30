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
  Avatar,
  Tooltip,
  LinearProgress,
  Alert
} from '@mui/material';
import {
  Dashboard,
  School,
  Assignment,
  Visibility,
  Check,
  Search,
  Save,
  Timeline
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import Swal from 'sweetalert2';

const ProgressTracking = ({ darkMode, onThemeToggle }) => {
  const [user] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [schools, setSchools] = useState([]);
  const [studentsCountMap, setStudentsCountMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        const schoolsSnap = await getDocs(collection(db, "schools"));
        const assignedSchools = schoolsSnap.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((school) => school.assignedSubadminId === user.uid);
        setSchools(assignedSchools);

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

  const handleFieldChange = async (schoolId, field, value) => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "schools", schoolId), { [field]: value });
      setSchools((prev) =>
        prev.map((s) => (s.id === schoolId ? { ...s, [field]: value } : s))
      );
      
      Swal.fire({
        title: 'Updated!',
        text: 'Progress updated successfully.',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to update progress', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAcknowledge = async (schoolId, schoolName) => {
    try {
      const result = await Swal.fire({
        title: 'Submit School Progress?',
        text: `Mark ${schoolName} as completed and submit to admin?`,
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
        
        Swal.fire({
          title: 'Submitted!',
          text: 'School progress has been submitted successfully.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to submit school progress', 'error');
    }
  };

  const filteredSchools = schools.filter((school) => {
    const search = searchTerm.toLowerCase();
    return (
      (school.name || "").toLowerCase().includes(search) ||
      (school.email || "").toLowerCase().includes(search) ||
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

  const completedSchools = schools.filter(s => s.status === 'acknowledged').length;
  const inProgressSchools = schools.filter(s => s.status === 'approved').length;

  if (loading) {
    return (
      <Layout
        title="Progress Tracking"
        userRole="subadmin"
        userName={userProfile?.name}
        userEmail={auth.currentUser?.email}
        menuItems={menuItems}
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading progress data...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout
      title="Progress Tracking"
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
            Progress Tracking
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Track and update school competition progress
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Schools"
              value={schools.length}
              icon={<School />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Completed"
              value={completedSchools}
              icon={<Check />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="In Progress"
              value={inProgressSchools}
              icon={<Timeline />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Completion Rate"
              value={schools.length > 0 ? `${Math.round((completedSchools / schools.length) * 100)}%` : '0%'}
              icon={<Assignment />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Progress Alert */}
        {saving && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Saving progress updates...
          </Alert>
        )}

        {/* Main Content */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight="bold">
                School Progress Management
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
                    <TableCell><strong>Students</strong></TableCell>
                    <TableCell><strong>Progress</strong></TableCell>
                    <TableCell><strong>Count Awaiting</strong></TableCell>
                    <TableCell><strong>Chart Sent</strong></TableCell>
                    <TableCell><strong>Competition</strong></TableCell>
                    <TableCell><strong>Chart Received</strong></TableCell>
                    <TableCell><strong>Certificate</strong></TableCell>
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
                            <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                              {school.name?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
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
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={school.countAwaitingYesNo || ""}
                              onChange={(e) =>
                                handleFieldChange(school.id, "countAwaitingYesNo", e.target.value)
                              }
                              disabled={isCompleted || saving}
                            >
                              <MenuItem value="">-</MenuItem>
                              <MenuItem value="yes">Yes</MenuItem>
                              <MenuItem value="no">No</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={school.chartSentYesNo || ""}
                              onChange={(e) =>
                                handleFieldChange(school.id, "chartSentYesNo", e.target.value)
                              }
                              disabled={isCompleted || saving}
                            >
                              <MenuItem value="">-</MenuItem>
                              <MenuItem value="yes">Yes</MenuItem>
                              <MenuItem value="no">No</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={school.competitionCompletedYesNo || ""}
                              onChange={(e) =>
                                handleFieldChange(school.id, "competitionCompletedYesNo", e.target.value)
                              }
                              disabled={isCompleted || saving}
                            >
                              <MenuItem value="">-</MenuItem>
                              <MenuItem value="yes">Yes</MenuItem>
                              <MenuItem value="no">No</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={school.chartReceivedYesNo || ""}
                              onChange={(e) =>
                                handleFieldChange(school.id, "chartReceivedYesNo", e.target.value)
                              }
                              disabled={isCompleted || saving}
                            >
                              <MenuItem value="">-</MenuItem>
                              <MenuItem value="yes">Yes</MenuItem>
                              <MenuItem value="no">No</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={school.certificateSentYesNo || ""}
                              onChange={(e) =>
                                handleFieldChange(school.id, "certificateSentYesNo", e.target.value)
                              }
                              disabled={isCompleted || saving}
                            >
                              <MenuItem value="">-</MenuItem>
                              <MenuItem value="yes">Yes</MenuItem>
                              <MenuItem value="no">No</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={isCompleted ? "Submitted" : "In Progress"}
                            color={isCompleted ? "success" : "warning"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
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
                            {!isCompleted && (
                              <Tooltip title="Submit Progress">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleAcknowledge(school.id, school.name)}
                                  disabled={progress < 100}
                                >
                                  <Check />
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
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {selectedSchool?.name?.charAt(0)}
              </Avatar>
              {selectedSchool?.name} - Progress Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedSchool && (
              <Grid container spacing={3} sx={{ pt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Competition Progress Overview
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={getProgressPercentage(selectedSchool)}
                    color={getProgressColor(getProgressPercentage(selectedSchool))}
                    sx={{ mt: 1, mb: 2, height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {Math.round(getProgressPercentage(selectedSchool))}% Complete
                  </Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        School Information
                      </Typography>
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
                        <Typography variant="subtitle2" color="text.secondary">Students Registered</Typography>
                        <Typography variant="body1">{studentsCountMap[selectedSchool.id] || 0}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Progress Checklist
                      </Typography>
                      {[
                        { field: 'countAwaitingYesNo', label: 'Count Awaiting' },
                        { field: 'chartSentYesNo', label: 'Chart Sent' },
                        { field: 'competitionCompletedYesNo', label: 'Competition Completed' },
                        { field: 'chartReceivedYesNo', label: 'Chart Received' },
                        { field: 'certificateSentYesNo', label: 'Certificate Sent' }
                      ].map((item, index) => (
                        <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2">{item.label}</Typography>
                          <Chip
                            label={selectedSchool[item.field] === 'yes' ? 'Yes' : selectedSchool[item.field] === 'no' ? 'No' : 'Pending'}
                            color={selectedSchool[item.field] === 'yes' ? 'success' : selectedSchool[item.field] === 'no' ? 'error' : 'default'}
                            size="small"
                          />
                        </Box>
                      ))}
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

export default ProgressTracking;