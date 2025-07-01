import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
  Stack,
  TablePagination
} from '@mui/material';
import {
  Dashboard,
  School,
  People,
  PersonAdd,
  Visibility,
  Delete,
  Check,
  Close,
  Warning,
  Search,
  Assignment,
  AssignmentInd
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import Swal from 'sweetalert2';

const AdminDashboard = ({ darkMode, onThemeToggle }) => {
  const [schools, setSchools] = useState([]);
  const [studentsCountMap, setStudentsCountMap] = useState({});
  const [admins, setAdmins] = useState([]);
  const [owners, setOwners] = useState([]);
  const [students, setStudents] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [newUser, setNewUser] = useState({ email: "", password: "", role: "admin" });
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [contactRequests, setContactRequests] = useState([]);
  const [contactPage, setContactPage] = useState(0);
  const [contactRowsPerPage, setContactRowsPerPage] = useState(10);
  
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
    fetchContactRequests();
  }, []);

  const fetchAllData = async () => {
    await fetchSchoolsSyncedWithAuth();
    await fetchAdmins();
    await fetchOwners();
    await fetchAllStudents();
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

  const fetchAdmins = async () => {
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const validAdmins = allUsers.filter(
        user => user.role === "admin" && typeof user.email === 'string' && user.email.trim() !== ""
      );
      setAdmins(validAdmins);
    } catch (error) {
      Swal.fire('Error', `Error fetching admins: ${error.message}`, 'error');
    }
  };

  const fetchOwners = async () => {
    const q = query(collection(db, "users"), where("role", "==", "owner"));
    const snap = await getDocs(q);
    setOwners(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchAllStudents = async () => {
    const snap = await getDocs(collection(db, "students"));
    setStudents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const fetchContactRequests = async () => {
    const snap = await getDocs(collection(db, "contactRequests"));
    const requests = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by submittedAt (newest first)
    requests.sort((a, b) => {
      if (!a.submittedAt || !b.submittedAt) return 0;
      const aTime = a.submittedAt.seconds ? a.submittedAt.seconds : a.submittedAt;
      const bTime = b.submittedAt.seconds ? b.submittedAt.seconds : b.submittedAt;
      return bTime - aTime;
    });
    setContactRequests(requests);
  };

  const handleStatusUpdate = async (schoolId, newStatus) => {
    try {
      await updateDoc(doc(db, "schools", schoolId), { status: newStatus });
      fetchSchoolsSyncedWithAuth();
      Swal.fire({
        title: 'Success!',
        text: newStatus === "approved" ? "School approved successfully." : "School set to pending.",
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
    if (!selectedSchool || !rejectReason.trim()) return;
    
    try {
      await updateDoc(doc(db, "schools", selectedSchool.id), {
        status: "rejected",
        rejectionReason: rejectReason.trim(),
      });
      fetchSchoolsSyncedWithAuth();
      setRejectReason("");
      setSelectedSchool(null);
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

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password) {
      Swal.fire('Error', 'Please fill all fields', 'error');
      return;
    }

    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );
      await addDoc(collection(db, "users"), {
        uid: cred.user.uid,
        email: newUser.email,
        role: newUser.role,
        createdAt: Date.now(),
      });
      
      setNewUser({ email: "", password: "", role: "admin" });
      setAddUserDialogOpen(false);
      fetchAdmins();
      fetchOwners();
      
      Swal.fire({
        title: 'Success!',
        text: `${newUser.role} added successfully.`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', `Error adding user: ${error.message}`, 'error');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'acknowledged': return 'info';
      default: return 'warning';
    }
  };

  const filteredSchools = schools.filter(school =>
    school.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.principal?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );

  const assignedSchools = schools.filter(s => s.assignedSubadminId).length;
  const unassignedSchools = schools.filter(s => !s.assignedSubadminId).length;

  return (
    <Layout
      title="Admin Dashboard"
      userRole="admin"
      userName="Administrator"
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
              value={students.length}
              icon={<People />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Assigned"
              value={assignedSchools}
              icon={<AssignmentInd />}
              color="info"
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
        </Grid>

        {/* Quick Actions */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AssignmentInd />}
              onClick={() => window.location.href = '/admin/assignments'}
              sx={{ py: 2 }}
            >
              Manage Assignments
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<PersonAdd />}
              onClick={() => setAddUserDialogOpen(true)}
              sx={{ py: 2 }}
            >
              Add User
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<School />}
              onClick={() => window.location.href = '/admin/schools'}
              sx={{ py: 2 }}
            >
              Manage Schools
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Assignment />}
              onClick={() => window.location.href = '/admin/reports'}
              sx={{ py: 2 }}
            >
              View Reports
            </Button>
          </Grid>
        </Grid>

        {/* Main Content */}
        <Card sx={{ borderRadius: 2 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={(e, newValue) => setTabValue(newValue)}
              variant={isMobile ? "scrollable" : "standard"}
              scrollButtons="auto"
            >
              <Tab label="Recent Schools" />
              <Tab label="Assignment Overview" />
              <Tab label="System Users" />
              <Tab label="Contact Requests" />
            </Tabs>
          </Box>

          {/* Recent Schools Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2, 
                mb: 2, 
                alignItems: { xs: 'stretch', sm: 'center' }
              }}>
                <TextField
                  placeholder="Search schools..."
                  variant="outlined"
                  size="small"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                  sx={{ flexGrow: 1 }}
                />
              </Box>

              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell><strong>School</strong></TableCell>
                      <TableCell><strong>Contact</strong></TableCell>
                      <TableCell><strong>Students</strong></TableCell>
                      <TableCell><strong>Status</strong></TableCell>
                      <TableCell><strong>Assignment</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSchools.slice(0, 10).map((school) => (
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
                            <Tooltip title="View">
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
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleStatusUpdate(school.id, "approved")}
                              >
                                <Check fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveSchool(school.id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          {/* Assignment Overview Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Assignment Statistics
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Assigned Schools</Typography>
                        <Typography variant="h4" color="success.main">{assignedSchools}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">Unassigned Schools</Typography>
                        <Typography variant="h4" color="warning.main">{unassignedSchools}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" color="text.secondary">Assignment Rate</Typography>
                        <Typography variant="h4" color="info.main">
                          {schools.length > 0 ? Math.round((assignedSchools / schools.length) * 100) : 0}%
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Quick Actions
                      </Typography>
                      <Stack spacing={2}>
                        <Button
                          variant="contained"
                          startIcon={<AssignmentInd />}
                          onClick={() => window.location.href = '/admin/assignments'}
                          fullWidth
                        >
                          Manage School Assignments
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<School />}
                          onClick={() => window.location.href = '/admin/schools'}
                          fullWidth
                        >
                          View All Schools
                        </Button>
                        <Button
                          variant="outlined"
                          startIcon={<People />}
                          onClick={() => window.location.href = '/admin/users'}
                          fullWidth
                        >
                          Manage Sub-Admins
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          {/* System Users Tab */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Administrators ({admins.length})
                      </Typography>
                      {admins.slice(0, 5).map((admin) => (
                        <Box key={admin.id} display="flex" alignItems="center" sx={{ mb: 1 }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                            {admin.email?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">{admin.email}</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Owners ({owners.length})
                      </Typography>
                      {owners.slice(0, 5).map((owner) => (
                        <Box key={owner.id} display="flex" alignItems="center" sx={{ mb: 1 }}>
                          <Avatar sx={{ mr: 2, bgcolor: 'orange', width: 32, height: 32 }}>
                            {owner.email?.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2">{owner.email}</Typography>
                        </Box>
                      ))}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          {/* Contact Requests Tab */}
          <TabPanel value={tabValue} index={3}>
            <Box sx={{ p: { xs: 1, sm: 2 } }}>
              <Typography variant="h6" gutterBottom>
                Contact Requests ({contactRequests.length})
              </Typography>
              <TableContainer component={Paper} elevation={0}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Name</strong></TableCell>
                      <TableCell><strong>School</strong></TableCell>
                      <TableCell><strong>Location</strong></TableCell>
                      <TableCell><strong>WhatsApp</strong></TableCell>
                      <TableCell><strong>Message</strong></TableCell>
                      <TableCell><strong>Call Time</strong></TableCell>
                      <TableCell><strong>Submitted At</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contactRequests
                      .slice(contactPage * contactRowsPerPage, contactPage * contactRowsPerPage + contactRowsPerPage)
                      .map(req => (
                        <TableRow key={req.id}>
                          <TableCell>{req.name}</TableCell>
                          <TableCell>{req.school}</TableCell>
                          <TableCell>{req.location}</TableCell>
                          <TableCell>
                            <a href={`https://wa.me/${req.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer">
                              {req.whatsapp}
                            </a>
                          </TableCell>
                          <TableCell>{req.message}</TableCell>
                          <TableCell>{req.calltime}</TableCell>
                          <TableCell>
                            {req.submittedAt
                              ? (req.submittedAt.seconds
                                ? new Date(req.submittedAt.seconds * 1000).toLocaleString()
                                : new Date(req.submittedAt).toLocaleString())
                              : ""}
                          </TableCell>
                          <TableCell>
                            <IconButton
                              color="error"
                              size="small"
                              onClick={async () => {
                                if (window.confirm("Delete this contact request?")) {
                                  await deleteDoc(doc(db, "contactRequests", req.id));
                                  fetchContactRequests();
                                }
                              }}
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
                <TablePagination
                  component="div"
                  count={contactRequests.length}
                  page={contactPage}
                  onPageChange={(e, newPage) => setContactPage(newPage)}
                  rowsPerPage={contactRowsPerPage}
                  onRowsPerPageChange={e => {
                    setContactRowsPerPage(parseInt(e.target.value, 10));
                    setContactPage(0);
                  }}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </TableContainer>
            </Box>
          </TabPanel>
        </Card>

        {/* Dialogs */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>School Details</DialogTitle>
          <DialogContent>
            {selectedSchool && (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>{selectedSchool.name}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Principal</Typography>
                  <Typography variant="body2">{selectedSchool.principal}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body2">{selectedSchool.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                  <Typography variant="body2">{selectedSchool.phone}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Students</Typography>
                  <Typography variant="body2">{studentsCountMap[selectedSchool.id] || 0}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Assignment</Typography>
                  <Typography variant="body2">
                    {selectedSchool.assignedSubadminName || "Not assigned"}
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)}>
          <DialogTitle>Add New User</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                margin="dense"
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Password"
                type="password"
                fullWidth
                variant="outlined"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="subadmin">Sub Admin</MenuItem>
                  <MenuItem value="owner">Owner</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddUserDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} variant="contained">
              Add User
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default AdminDashboard;