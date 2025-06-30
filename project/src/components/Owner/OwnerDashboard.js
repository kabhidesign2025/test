import React, { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
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
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  School,
  People,
  Visibility,
  Search,
  TrendingUp,
  Assessment
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';

const OwnerDashboard = ({ darkMode, onThemeToggle }) => {
  const [schools, setSchools] = useState([]);
  const [studentsCountMap, setStudentsCountMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [totalStudents, setTotalStudents] = useState(0);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/owner/dashboard' },
    { text: 'Schools', icon: <School />, path: '/owner/schools' },
    { text: 'Analytics', icon: <Assessment />, path: '/owner/analytics' },
    { text: 'Reports', icon: <TrendingUp />, path: '/owner/reports' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all schools
        const schoolsSnapshot = await getDocs(collection(db, "schools"));
        const schoolsList = schoolsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSchools(schoolsList);

        // Fetch all students and count by schoolId
        const studentsSnapshot = await getDocs(collection(db, "students"));
        const counts = {};
        let totalStudentsCount = 0;
        studentsSnapshot.forEach((doc) => {
          const data = doc.data();
          const schoolId = data.schoolId;
          if (schoolId) {
            counts[schoolId] = (counts[schoolId] || 0) + 1;
            totalStudentsCount++;
          }
        });
        setStudentsCountMap(counts);
        setTotalStudents(totalStudentsCount);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const filteredSchools = schools.filter((school) =>
    school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.principal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'acknowledged': return 'info';
      default: return 'warning';
    }
  };

  const approvedSchools = schools.filter(s => s.status === 'approved').length;
  const pendingSchools = schools.filter(s => s.status === 'pending' || s.status === 'registered').length;
  const acknowledgedSchools = schools.filter(s => s.status === 'acknowledged').length;

  return (
    <Layout
      title="Owner Dashboard"
      userRole="owner"
      userName="Owner"
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
              title="Schools"
              value={schools.length}
              icon={<School />}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Students"
              value={totalStudents}
              icon={<People />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Approved"
              value={approvedSchools}
              icon={<Dashboard />}
              color="info"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Completed"
              value={acknowledgedSchools}
              icon={<TrendingUp />}
              color="warning"
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
                Schools Overview
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
                    <TableCell><strong>Principal</strong></TableCell>
                    <TableCell><strong>Students</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <School sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            No schools found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'Try adjusting your search' : 'No schools registered yet'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => (
                      <TableRow key={school.id} hover>
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
                          <Chip
                            label={studentsCountMap[school.id] || 0}
                            color="primary"
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={school.status || 'pending'}
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
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
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
                {selectedSchool?.name?.charAt(0)}
              </Avatar>
              {selectedSchool?.name} Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedSchool && (
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Principal</Typography>
                  <Typography variant="body1" gutterBottom>{selectedSchool.principal || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1" gutterBottom>{selectedSchool.email || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body1" gutterBottom>{selectedSchool.phone || "N/A"}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Students</Typography>
                  <Typography variant="body1">
                    {studentsCountMap[selectedSchool.id] || 0}
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

export default OwnerDashboard;