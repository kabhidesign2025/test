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
  Alert,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction
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
  AdminPanelSettings,
  SupervisorAccount,
  Business,
  Add
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import Swal from 'sweetalert2';

const UserManagement = ({ darkMode, onThemeToggle }) => {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [subadmins, setSubadmins] = useState([]);
  const [owners, setOwners] = useState([]);
  const [schools, setSchools] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
  const [editUserDialogOpen, setEditUserDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ 
    email: "", 
    password: "", 
    role: "admin",
    username: "",
    name: ""
  });
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
    fetchAllUsers();
    fetchSchools();
  }, []);

  const fetchAllUsers = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setUsers(allUsers);
      setAdmins(allUsers.filter(user => user.role === "admin"));
      setSubadmins(allUsers.filter(user => user.role === "subadmin"));
      setOwners(allUsers.filter(user => user.role === "owner"));
    } catch (error) {
      console.error("Error fetching users:", error);
      Swal.fire('Error', 'Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const schoolsSnap = await getDocs(collection(db, "schools"));
      setSchools(schoolsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching schools:", error);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.role) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    try {
      // Create user in Firebase Auth
      const cred = await createUserWithEmailAndPassword(
        auth,
        newUser.email,
        newUser.password
      );

      // Add user to Firestore
      const userData = {
        uid: cred.user.uid,
        email: newUser.email,
        role: newUser.role,
        createdAt: Date.now(),
      };

      // Add optional fields
      if (newUser.username) userData.username = newUser.username;
      if (newUser.name) userData.name = newUser.name;

      await addDoc(collection(db, "users"), userData);
      
      setNewUser({ 
        email: "", 
        password: "", 
        role: "admin",
        username: "",
        name: ""
      });
      setAddUserDialogOpen(false);
      fetchAllUsers();
      
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

  const handleDeleteUser = async (userId, userEmail) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Delete user ${userEmail}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete!'
      });

      if (result.isConfirmed) {
        await deleteDoc(doc(db, "users", userId));
        fetchAllUsers();
        Swal.fire({
          title: 'Deleted!',
          text: 'User has been deleted.',
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to delete user', 'error');
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      fetchAllUsers();
      Swal.fire({
        title: 'Updated!',
        text: 'User role updated successfully.',
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire('Error', 'Failed to update user role', 'error');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'error';
      case 'subadmin': return 'warning';
      case 'school': return 'primary';
      case 'owner': return 'success';
      default: return 'default';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <AdminPanelSettings />;
      case 'subadmin': return <SupervisorAccount />;
      case 'school': return <School />;
      case 'owner': return <Business />;
      default: return <People />;
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower)
    );
  });

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
      }
    </div>
  );

  return (
    <Layout
      title="User Management"
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
            User Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage system users and their roles
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={isMobile ? 1 : 3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Total Users"
              value={users.length}
              icon={<People />}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Admins"
              value={admins.length}
              icon={<AdminPanelSettings />}
              color="error"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Sub-Admins"
              value={subadmins.length}
              icon={<SupervisorAccount />}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Owners"
              value={owners.length}
              icon={<Business />}
              color="success"
            />
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
              <Tab label="All Users" />
              <Tab label="Administrators" />
              <Tab label="Sub-Admins" />
              <Tab label="Owners" />
            </Tabs>
          </Box>

          <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
            {/* Toolbar */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2, 
              mb: 2, 
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between'
            }}>
              <TextField
                placeholder="Search users..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ minWidth: { xs: '100%', sm: 250 } }}
              />
              
              <Button
                variant="contained"
                startIcon={<PersonAdd />}
                onClick={() => setAddUserDialogOpen(true)}
                size="small"
              >
                Add User
              </Button>
            </Box>

            {/* All Users Tab */}
            <TabPanel value={tabValue} index={0}>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                <Table size={isMobile ? "small" : "medium"}>
                  <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                    <TableRow>
                      <TableCell><strong>User</strong></TableCell>
                      <TableCell><strong>Role</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                      <TableCell><strong>Created</strong></TableCell>
                      <TableCell><strong>Actions</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <Avatar sx={{ mr: 2, bgcolor: getRoleColor(user.role) }}>
                              {getRoleIcon(user.role)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {user.name || user.username || user.email?.split('@')[0]}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {user.username && `@${user.username}`}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={user.role?.toUpperCase()}
                            color={getRoleColor(user.role)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{user.email}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={0.5}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setDialogOpen(true);
                                }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => {
                                  setSelectedUser(user);
                                  setEditUserDialogOpen(true);
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteUser(user.id, user.email)}
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
            </TabPanel>

            {/* Administrators Tab */}
            <TabPanel value={tabValue} index={1}>
              <List>
                {admins.map((admin) => (
                  <ListItem key={admin.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'error.main' }}>
                        <AdminPanelSettings />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={admin.name || admin.username || admin.email?.split('@')[0]}
                      secondary={admin.email}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteUser(admin.id, admin.email)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            {/* Sub-Admins Tab */}
            <TabPanel value={tabValue} index={2}>
              <List>
                {subadmins.map((subadmin) => (
                  <ListItem key={subadmin.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <SupervisorAccount />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={subadmin.name || subadmin.username || subadmin.email?.split('@')[0]}
                      secondary={subadmin.email}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteUser(subadmin.id, subadmin.email)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            {/* Owners Tab */}
            <TabPanel value={tabValue} index={3}>
              <List>
                {owners.map((owner) => (
                  <ListItem key={owner.id}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'success.main' }}>
                        <Business />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={owner.name || owner.username || owner.email?.split('@')[0]}
                      secondary={owner.email}
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        onClick={() => handleDeleteUser(owner.id, owner.email)}
                      >
                        <Delete />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </TabPanel>
          </CardContent>
        </Card>

        {/* Add User Dialog */}
        <Dialog open={addUserDialogOpen} onClose={() => setAddUserDialogOpen(false)} maxWidth="sm" fullWidth>
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
                required
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
                required
              />
              <TextField
                margin="dense"
                label="Username (Optional)"
                fullWidth
                variant="outlined"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="dense"
                label="Full Name (Optional)"
                fullWidth
                variant="outlined"
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={newUser.role}
                  label="Role"
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <MenuItem value="admin">Administrator</MenuItem>
                  <MenuItem value="subadmin">Sub Administrator</MenuItem>
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

        {/* User Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ mr: 2, bgcolor: getRoleColor(selectedUser?.role) }}>
                {getRoleIcon(selectedUser?.role)}
              </Avatar>
              User Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedUser && (
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedUser.name || selectedUser.username || selectedUser.email?.split('@')[0]}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{selectedUser.email}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                  <Chip
                    label={selectedUser.role?.toUpperCase()}
                    color={getRoleColor(selectedUser.role)}
                    size="small"
                  />
                </Grid>
                {selectedUser.username && (
                  <Grid item xs={6}>
                    <Typography variant="subtitle2" color="text.secondary">Username</Typography>
                    <Typography variant="body1">@{selectedUser.username}</Typography>
                  </Grid>
                )}
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Created</Typography>
                  <Typography variant="body1">
                    {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}
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

export default UserManagement;