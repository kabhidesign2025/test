import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
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
  Avatar,
  Tooltip,
  Container,
  useMediaQuery,
  useTheme,
  Alert,
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
  Assignment,
  Visibility,
  Edit,
  Delete,
  Check,
  Close,
  Warning,
  Search,
  FilterList,
  Download,
  MoreVert,
  AssignmentInd,
  SupervisorAccount
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import Swal from 'sweetalert2';

const SchoolAssignment = ({ darkMode, onThemeToggle }) => {
  const [schools, setSchools] = useState([]);
  const [subAdmins, setSubAdmins] = useState([]);
  const [studentsCountMap, setStudentsCountMap] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedSubAdmin, setSelectedSubAdmin] = useState("");
  const [selected, setSelected] = useState([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignment, setFilterAssignment] = useState("all");
  const [loading, setLoading] = useState(true);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/admin/dashboard' },
    { text: 'Schools', icon: <School />, path: '/admin/schools' },
    { text: 'Students', icon: <People />, path: '/admin/students' },
    { text: 'Users', icon: <PersonAdd />, path: '/admin/users' },
    { text: 'Assignments', icon: <Assignment />, path: '/admin/assignments' },
    { text: 'Reports', icon: <Assignment />, path: '/admin/reports' }
  ];

  useEffect(() => {
    fetchAllData();
    fetchStudentCounts();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await fetchSchools();
      await fetchSubAdmins();
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

  const fetchSchools = async () => {
    const schoolSnap = await getDocs(collection(db, "schools"));
    const schoolList = schoolSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSchools(schoolList);
  };

  const fetchSubAdmins = async () => {
    try {
      const q = query(collection(db, "users"), where("role", "==", "subadmin"));
      const usersSnap = await getDocs(q);
      const subAdminList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSubAdmins(subAdminList);
    } catch (error) {
      console.error("Error fetching sub-admins:", error);
    }
  };

  const handleAssignSchool = async (schoolId, subAdminId, subAdminName) => {
    try {
      await updateDoc(doc(db, "schools", schoolId), {
        assignedSubadminId: subAdminId,
        assignedSubadminName: subAdminName,
        assignedAt: new Date().toISOString()
      });

      setSchools(prev =>
        prev.map(school =>
          school.id === schoolId
            ? { ...school, assignedSubadminId: subAdminId, assignedSubadminName: subAdminName }
            : school
        )
      );

      Swal.fire({
        title: 'Success!',
        text: 'School assigned successfully!',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to assign school', 'error');
    }
  };

  const handleBulkAssign = async () => {
    if (selected.length === 0 || !selectedSubAdmin) {
      Swal.fire('Error', 'Please select schools and a sub-admin', 'error');
      return;
    }

    try {
      const subAdmin = subAdmins.find(sa => sa.id === selectedSubAdmin);
      const promises = selected.map(schoolId =>
        updateDoc(doc(db, "schools", schoolId), {
          assignedSubadminId: selectedSubAdmin,
          assignedSubadminName: subAdmin.name || subAdmin.username || subAdmin.email,
          assignedAt: new Date().toISOString()
        })
      );

      await Promise.all(promises);

      setSchools(prev =>
        prev.map(school =>
          selected.includes(school.id)
            ? {
                ...school,
                assignedSubadminId: selectedSubAdmin,
                assignedSubadminName: subAdmin.name || subAdmin.username || subAdmin.email
              }
            : school
        )
      );

      setSelected([]);
      setSelectedSubAdmin("");
      setAssignDialogOpen(false);

      Swal.fire({
        title: 'Success!',
        text: `${selected.length} schools assigned successfully!`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to assign schools', 'error');
    }
  };

  const handleUnassignSchool = async (schoolId, schoolName) => {
    try {
      const result = await Swal.fire({
        title: 'Unassign School?',
        text: `Remove assignment for ${schoolName}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, unassign!'
      });

      if (result.isConfirmed) {
        await updateDoc(doc(db, "schools", schoolId), {
          assignedSubadminId: null,
          assignedSubadminName: null,
          assignedAt: null
        });

        setSchools(prev =>
          prev.map(school =>
            school.id === schoolId
              ? { ...school, assignedSubadminId: null, assignedSubadminName: null }
              : school
          )
        );

        Swal.fire({
          title: 'Unassigned!',
          text: 'School has been unassigned.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to unassign school', 'error');
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
      'Status': school.status || 'pending',
      'Assigned Sub-Admin': school.assignedSubadminName || 'Unassigned',
      'Students Count': studentsCountMap[school.id] || 0,
      'Registration Date': school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'school_assignments.csv';
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
      school.assignedSubadminName?.toLowerCase().includes(searchLower);
    
    const matchesStatus = filterStatus === "all" || school.status === filterStatus;
    const matchesAssignment = filterAssignment === "all" || 
      (filterAssignment === "assigned" && school.assignedSubadminId) ||
      (filterAssignment === "unassigned" && !school.assignedSubadminId);
    
    return matchesSearch && matchesStatus && matchesAssignment;
  });

  const numSelected = selected.length;
  const rowCount = filteredSchools.length;
  const assignedSchools = schools.filter(s => s.assignedSubadminId).length;
  const unassignedSchools = schools.filter(s => !s.assignedSubadminId).length;

  return (
    <Layout
      title="School Assignment Management"
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
            School Assignment Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Assign schools to sub-administrators for management
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
              title="Assigned"
              value={assignedSchools}
              icon={<AssignmentInd />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Unassigned"
              value={unassignedSchools}
              icon={<Warning />}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Sub-Admins"
              value={subAdmins.length}
              icon={<SupervisorAccount />}
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
                  School Assignments ({filteredSchools.length})
                </Typography>
              )}

              {numSelected > 0 ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    startIcon={<AssignmentInd />}
                    onClick={() => setAssignDialogOpen(true)}
                    size="small"
                  >
                    Bulk Assign
                  </Button>
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

                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Assignment</InputLabel>
                    <Select
                      value={filterAssignment}
                      label="Assignment"
                      onChange={(e) => setFilterAssignment(e.target.value)}
                    >
                      <MenuItem value="all">All</MenuItem>
                      <MenuItem value="assigned">Assigned</MenuItem>
                      <MenuItem value="unassigned">Unassigned</MenuItem>
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
                    <TableCell><strong>Assigned To</strong></TableCell>
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
                            {school.assignedSubadminName ? (
                              <Chip
                                label={school.assignedSubadminName}
                                color="success"
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Chip
                                label="Unassigned"
                                color="warning"
                                size="small"
                                variant="outlined"
                              />
                            )}
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
                              {school.assignedSubadminId ? (
                                <Tooltip title="Unassign">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnassignSchool(school.id, school.name);
                                    }}
                                  >
                                    <Close fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              ) : (
                                <Tooltip title="Assign">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSchool(school);
                                      setAssignDialogOpen(true);
                                    }}
                                  >
                                    <AssignmentInd fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
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
              School Assignment Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedSchool && (
              <Grid container spacing={3} sx={{ pt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        School Information
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
                        <Typography variant="subtitle2" color="text.secondary">Students Registered</Typography>
                        <Typography variant="body1">{studentsCountMap[selectedSchool.id] || 0}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Assignment Status
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
                        <Typography variant="subtitle2" color="text.secondary">Assigned Sub-Admin</Typography>
                        {selectedSchool.assignedSubadminName ? (
                          <Chip
                            label={selectedSchool.assignedSubadminName}
                            color="success"
                            size="small"
                          />
                        ) : (
                          <Chip
                            label="Not Assigned"
                            color="warning"
                            size="small"
                          />
                        )}
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Assignment Date</Typography>
                        <Typography variant="body1">
                          {selectedSchool.assignedAt
                            ? new Date(selectedSchool.assignedAt).toLocaleDateString()
                            : "Not assigned yet"}
                        </Typography>
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

        {/* Bulk Assignment Dialog */}
        <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {numSelected > 0 ? `Assign ${numSelected} Schools` : 'Assign School'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <FormControl fullWidth>
                <InputLabel>Select Sub-Admin</InputLabel>
                <Select
                  value={selectedSubAdmin}
                  label="Select Sub-Admin"
                  onChange={(e) => setSelectedSubAdmin(e.target.value)}
                >
                  {subAdmins.map((subAdmin) => (
                    <MenuItem key={subAdmin.id} value={subAdmin.id}>
                      <Box display="flex" alignItems="center">
                        <Avatar sx={{ mr: 2, bgcolor: 'secondary.main', width: 24, height: 24 }}>
                          {(subAdmin.name || subAdmin.username || subAdmin.email)?.charAt(0)}
                        </Avatar>
                        {subAdmin.name || subAdmin.username || subAdmin.email}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              {numSelected > 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  You are about to assign {numSelected} schools to the selected sub-admin.
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (numSelected > 0) {
                  handleBulkAssign();
                } else if (selectedSchool && selectedSubAdmin) {
                  const subAdmin = subAdmins.find(sa => sa.id === selectedSubAdmin);
                  handleAssignSchool(
                    selectedSchool.id, 
                    selectedSubAdmin, 
                    subAdmin.name || subAdmin.username || subAdmin.email
                  );
                  setAssignDialogOpen(false);
                }
              }}
              variant="contained"
              disabled={!selectedSubAdmin}
            >
              Assign
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default SchoolAssignment;