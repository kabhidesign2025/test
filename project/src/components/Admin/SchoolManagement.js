import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
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
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  Container,
  useMediaQuery,
  useTheme,
  Alert,
  LinearProgress,
  Checkbox,
  Toolbar,
  alpha,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Dashboard,
  School,
  People,
  PersonAdd,
  Visibility,
  Edit,
  Delete,
  Check,
  Close,
  Warning,
  Search,
  FilterList,
  Assignment,
  Download,
  MoreVert,
  Email,
  Print,
  FileDownload,
  Block,
  CheckCircle
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import Swal from 'sweetalert2';

const SchoolManagement = ({ darkMode, onThemeToggle }) => {
  const [schools, setSchools] = useState([]);
  const [studentsCountMap, setStudentsCountMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [selected, setSelected] = useState([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Schools', icon: <School />, path: '/admin/schools' },
    { text: 'Students', icon: <People />, path: '/admin/students' },
    { text: 'Users', icon: <PersonAdd />, path: '/admin/users' },
    { text: 'Reports', icon: <Assignment />, path: '/admin/reports' }
  ];

  useEffect(() => {
    fetchAllData();
    fetchStudentCounts();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await fetchSchoolsSyncedWithAuth();
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentCounts = async () => {
    const studentsSnap = await getDocs(collection(db, "students"));
    const countMap = {};
    studentsSnap.forEach((studentDoc) => {
      const data = studentDoc.data();
      if (!data.schoolId) return;
      countMap[data.schoolId] = (countMap[data.schoolId] || 0) + 1;
    });
    setStudentsCountMap(countMap);
  };

  const fetchSchoolsSyncedWithAuth = async () => {
    const schoolSnap = await getDocs(collection(db, "schools"));
    const schoolList = schoolSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const usersSnap = await getDocs(collection(db, "users"));
    const authUserEmails = usersSnap.docs.map(doc => doc.data().email);
    const filteredSchools = schoolList.filter(school =>
      authUserEmails.includes(school.email)
    );
    setSchools(filteredSchools);
  };

  const handleStatusUpdate = async (schoolId, newStatus) => {
    try {
      await updateDoc(doc(db, "schools", schoolId), { status: newStatus });
      fetchSchoolsSyncedWithAuth();
      Swal.fire({
        title: 'Success!',
        text: newStatus === "approved" ? "School approved successfully." : "School status updated.",
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to update school status', 'error');
    }
  };

  const handleFreezeSchool = async (school) => {
    try {
      const result = await Swal.fire({
        title: `${school.isFrozen ? 'Unfreeze' : 'Freeze'} School?`,
        text: `This will ${school.isFrozen ? 'allow' : 'prevent'} the school from adding new students.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: school.isFrozen ? '#4caf50' : '#f44336',
        confirmButtonText: `Yes, ${school.isFrozen ? 'unfreeze' : 'freeze'} it!`
      });

      if (result.isConfirmed) {
        await updateDoc(doc(db, "schools", school.id), {
          isFrozen: !school.isFrozen,
        });
        setSchools(prev =>
          prev.map(s =>
            s.id === school.id ? { ...s, isFrozen: !school.isFrozen } : s
          )
        );
        Swal.fire({
          title: 'Success!',
          text: `School ${school.isFrozen ? 'unfrozen' : 'frozen'} successfully!`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to update school freeze status', 'error');
    }
  };

  const handleRejectSchool = async () => {
    if (!selectedSchool || !rejectReason.trim()) {
      Swal.fire('Error', 'Please provide a rejection reason', 'error');
      return;
    }
    
    try {
      await updateDoc(doc(db, "schools", selectedSchool.id), {
        status: "rejected",
        rejectionReason: rejectReason.trim(),
      });
      fetchSchoolsSyncedWithAuth();
      setRejectReason("");
      setSelectedSchool(null);
      setRejectDialogOpen(false);
      Swal.fire({
        title: 'School Rejected',
        text: 'School has been rejected successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to reject school', 'error');
    }
  };

  const handleRemoveSchool = async (schoolId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "schools", schoolId));
        fetchSchoolsSyncedWithAuth();
        Swal.fire({
          title: 'Deleted!',
          text: 'School has been removed.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to remove school', 'error');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(filteredSchools.map(s => s.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const exportToCSV = () => {
    const csvData = filteredSchools.map(school => ({
      'School Name': school.name,
      'Principal': school.principal || '',
      'Email': school.email,
      'Phone': school.phone || '',
      'Address': school.address || '',
      'Status': school.status || 'pending',
      'Students Count': studentsCountMap[school.id] || 0,
      'Registration Date': school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'N/A',
      'Frozen': school.isFrozen ? 'Yes' : 'No'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schools_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'acknowledged': return 'info';
      default: return 'warning';
    }
  };

  const filteredSchools = schools.filter(school => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = school.name?.toLowerCase().includes(searchLower) ||
      school.principal?.toLowerCase().includes(searchLower) ||
      school.email?.toLowerCase().includes(searchLower) ||
      school.phone?.toLowerCase().includes(searchLower);
    
    const matchesStatus = filterStatus === "all" || school.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const numSelected = selected.length;
  const rowCount = filteredSchools.length;

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
      }
    </div>
  );

  if (loading) {
    return (
      <Layout
        title="School Management"
        userRole="admin"
        userName="Administrator"
        userEmail={auth.currentUser?.email}
        menuItems={menuItems}
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <LinearProgress sx={{ width: '50%' }} />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout
      title="School Management"
      userRole="admin"
      userName="Administrator"
      userEmail={auth.currentUser?.email}
      menuItems={menuItems}
      darkMode={darkMode}
      onThemeToggle={onThemeToggle}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2 } }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            School Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage all registered schools and their status
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={isMobile ? 1 : 3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Total Schools"
              value={schools.length}
              icon={<School />}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Approved"
              value={schools.filter(s => s.status === 'approved').length}
              icon={<CheckCircle />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Pending"
              value={schools.filter(s => s.status === 'pending' || s.status === 'registered').length}
              icon={<Warning />}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Completed"
              value={schools.filter(s => s.status === 'acknowledged').length}
              icon={<Assignment />}
              color="info"
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            {/* Toolbar */}
            <Toolbar
              sx={{
                pl: { sm: 2 },
                pr: { xs: 1, sm: 1 },
                ...(numSelected > 0 && {
                  bgcolor: (theme) =>
                    alpha(theme.palette.primary.main, theme.palette.action.activatedOpacity),
                }),
              }}
            >
              {numSelected > 0 ? (
                <Typography
                  sx={{ flex: '1 1 100%' }}
                  color="inherit"
                  variant="subtitle1"
                  component="div"
                >
                  {numSelected} selected
                </Typography>
              ) : (
                <Typography
                  sx={{ flex: '1 1 100%' }}
                  variant="h6"
                  id="tableTitle"
                  component="div"
                  fontWeight="bold"
                >
                  All Schools ({filteredSchools.length})
                </Typography>
              )}

              {numSelected > 0 ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Export Selected">
                    <IconButton onClick={exportToCSV}>
                      <FileDownload />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    placeholder="Search schools..."
                    variant="outlined"
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ width: { xs: '100%', sm: 250 } }}
                  />
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={filterStatus}
                      label="Status"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="pending">Pending</MenuItem>
                      <MenuItem value="approved">Approved</MenuItem>
                      <MenuItem value="rejected">Rejected</MenuItem>
                      <MenuItem value="acknowledged">Completed</MenuItem>
                    </Select>
                  </FormControl>

                  <IconButton
                    onClick={(e) => setActionMenuAnchor(e.currentTarget)}
                    size="small"
                  >
                    <MoreVert />
                  </IconButton>
                </Box>
              )}
            </Toolbar>

            {/* Action Menu */}
            <Menu
              anchorEl={actionMenuAnchor}
              open={Boolean(actionMenuAnchor)}
              onClose={() => setActionMenuAnchor(null)}
            >
              <MenuItem onClick={() => {
                exportToCSV();
                setActionMenuAnchor(null);
              }}>
                <ListItemIcon><Download /></ListItemIcon>
                <ListItemText>Export CSV</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => {
                window.print();
                setActionMenuAnchor(null);
              }}>
                <ListItemIcon><Print /></ListItemIcon>
                <ListItemText>Print List</ListItemText>
              </MenuItem>
            </Menu>

            {/* Schools Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mt: 2 }}>
              <Table size={isMobile ? "small" : "medium"}>
                <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        indeterminate={numSelected > 0 && numSelected < rowCount}
                        checked={rowCount > 0 && numSelected === rowCount}
                        onChange={handleSelectAll}
                      />
                    </TableCell>
                    <TableCell><strong>School</strong></TableCell>
                    <TableCell><strong>Contact</strong></TableCell>
                    <TableCell><strong>Students</strong></TableCell>
                    <TableCell><strong>Status</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredSchools.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <School sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            No schools found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'Try adjusting your search filters' : 'No schools registered yet'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchools.map((school) => {
                      const isItemSelected = selected.includes(school.id);
                      
                      return (
                        <TableRow 
                          key={school.id} 
                          hover
                          onClick={() => handleSelectOne(school.id)}
                          role="checkbox"
                          aria-checked={isItemSelected}
                          selected={isItemSelected}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              onChange={() => handleSelectOne(school.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                                {school.name?.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="bold">
                                  {school.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {school.principal}
                                </Typography>
                                {school.isFrozen && (
                                  <Chip 
                                    label="Frozen" 
                                    color="error" 
                                    size="small" 
                                    sx={{ ml: 1 }}
                                  />
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{school.phone}</Typography>
                            <Typography variant="caption" color="text.secondary">{school.email}</Typography>
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
                            <Box display="flex" gap={0.5}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSchool(school);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Visibility fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Approve">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatusUpdate(school.id, "approved");
                                  }}
                                >
                                  <Check fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reject">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSchool(school);
                                    setRejectDialogOpen(true);
                                  }}
                                >
                                  <Close fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={school.isFrozen ? "Unfreeze" : "Freeze"}>
                                <IconButton
                                  size="small"
                                  color={school.isFrozen ? "success" : "warning"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleFreezeSchool(school);
                                  }}
                                >
                                  <Block fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveSchool(school.id);
                                  }}
                                >
                                  <Delete fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
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
              School Details
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
                        Status & Statistics
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Current Status</Typography>
                        <Chip
                          label={selectedSchool.status || 'pending'}
                          color={getStatusColor(selectedSchool.status)}
                          size="small"
                        />
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Students Registered</Typography>
                        <Typography variant="body1">{studentsCountMap[selectedSchool.id] || 0}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Registration Date</Typography>
                        <Typography variant="body1">
                          {selectedSchool.createdAt
                            ? new Date(selectedSchool.createdAt).toLocaleDateString()
                            : "N/A"}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Registration Status</Typography>
                        <Chip
                          label={selectedSchool.isFrozen ? "Frozen" : "Active"}
                          color={selectedSchool.isFrozen ? "error" : "success"}
                          size="small"
                        />
                      </Box>
                      {selectedSchool.rejectionReason && (
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">Rejection Reason</Typography>
                          <Typography variant="body1" color="error.main">
                            {selectedSchool.rejectionReason}
                          </Typography>
                        </Box>
                      )}
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

        {/* Reject School Dialog */}
        <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Reject School</DialogTitle>
          <DialogContent>
            <Typography variant="body1" gutterBottom>
              Please provide a reason for rejecting {selectedSchool?.name}:
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Rejection Reason"
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter the reason for rejection..."
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleRejectSchool} 
              variant="contained" 
              color="error"
              disabled={!rejectReason.trim()}
            >
              Reject School
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default SchoolManagement;