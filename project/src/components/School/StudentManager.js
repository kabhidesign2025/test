import React, { useState, useEffect } from "react";
import { db, auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
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
  writeBatch
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
  MoreVert,
  Edit,
  Email,
  Print,
  FileDownload
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import Swal from 'sweetalert2';

const StudentManager = ({ darkMode, onThemeToggle }) => {
  const [schoolName, setSchoolName] = useState("");
  const [school, setSchool] = useState(null);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [viewStudent, setViewStudent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [newStudent, setNewStudent] = useState({
    fullName: "",
    age: "",
    grade: "",
    gender: "male",
    email: ""
  });
  const [user] = useAuthState(auth);

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <Dashboard />, 
      path: '/school/dashboard' 
    },
    { 
      text: 'Students', 
      icon: <People />, 
      path: '/school/students',
      children: [
        { text: 'View All', icon: <People />, path: '/school/students' },
        { text: 'Add Student', icon: <PersonAdd />, path: '/student/add' },
        { text: 'Bulk Add', icon: <Upload />, path: '/school/bulk-add' }
      ]
    }
  ];

  // Fetch school info
  useEffect(() => {
    if (!user) return;
    const schoolRef = doc(db, "schools", user.uid);
    getDoc(schoolRef).then((snap) => {
      if (snap.exists()) {
        const schoolData = { id: snap.id, ...snap.data() };
        setSchool(schoolData);
        setSchoolName(schoolData.name);
      }
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
    );
  }, [user]);

  const handleAddStudent = async () => {
    if (!newStudent.fullName.trim() || !newStudent.age || !newStudent.grade) {
      Swal.fire('Error', 'Please fill all required fields', 'error');
      return;
    }

    if (school?.isFrozen) {
      Swal.fire('Error', 'Student registration is currently frozen', 'error');
      return;
    }

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
      Swal.fire('Error', 'Failed to add student', 'error');
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

  const handleBulkDelete = async () => {
    if (selected.length === 0) return;

    try {
      const result = await Swal.fire({
        title: 'Delete Selected Students?',
        text: `This will remove ${selected.length} students from the competition.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Yes, delete all!'
      });

      if (result.isConfirmed) {
        const batch = writeBatch(db);
        selected.forEach(id => {
          batch.delete(doc(db, "students", id));
        });
        await batch.commit();

        setStudents(prev => prev.filter(s => !selected.includes(s.id)));
        setSelected([]);
        
        Swal.fire({
          title: 'Deleted!',
          text: `${selected.length} students have been removed.`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire('Error', 'Failed to delete students', 'error');
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(filtered.map(s => s.id));
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
    const csvData = filtered.map(student => ({
      'Full Name': student.fullName,
      'Age': student.age,
      'Grade': student.grade,
      'Gender': student.gender,
      'Email': student.email,
      'Registration Date': student.createdAt?.toDate ? student.createdAt.toDate().toLocaleDateString() : 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
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

  const numSelected = selected.length;
  const rowCount = filtered.length;

  return (
    <Layout
      title="Student Management"
      userRole="school"
      userName={schoolName}
      userEmail={auth.currentUser?.email}
      menuItems={menuItems}
      darkMode={darkMode}
      onThemeToggle={onThemeToggle}
    >
      <Box>
        {/* Welcome Section */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
            Student Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage all registered students for the competition
          </Typography>
        </Box>

        {/* Freeze Alert */}
        {school?.isFrozen && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography fontWeight="bold">
              Student Registration Frozen
            </Typography>
            Adding new students is currently disabled by the administrator.
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Total Students"
              value={students.length}
              icon={<People />}
              color="primary"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="This Month"
              value={students.filter(s => {
                const studentDate = s.createdAt?.toDate ? s.createdAt.toDate() : new Date();
                const thisMonth = new Date();
                return studentDate.getMonth() === thisMonth.getMonth() && 
                       studentDate.getFullYear() === thisMonth.getFullYear();
              }).length}
              icon={<PersonAdd />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Selected"
              value={selected.length}
              icon={<CheckCircle />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatsCard
              title="Registration Status"
              value={school?.isFrozen ? "Frozen" : "Active"}
              icon={school?.isFrozen ? <Warning /> : <CheckCircle />}
              color={school?.isFrozen ? "warning" : "success"}
            />
          </Grid>
        </Grid>

        {/* Main Content */}
        <Card>
          <CardContent>
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
                  Registered Students
                </Typography>
              )}

              {numSelected > 0 ? (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Tooltip title="Delete Selected">
                    <IconButton onClick={handleBulkDelete} color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Export Selected">
                    <IconButton onClick={exportToCSV}>
                      <FileDownload />
                    </IconButton>
                  </Tooltip>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <TextField
                    placeholder="Search students..."
                    variant="outlined"
                    size="small"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ width: { xs: '100%', sm: 300 } }}
                  />
                  
                  <Button
                    variant="contained"
                    startIcon={<PersonAdd />}
                    onClick={() => setAddStudentDialogOpen(true)}
                    disabled={school?.isFrozen}
                    sx={{ minWidth: 'fit-content' }}
                  >
                    Add Student
                  </Button>

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
              <MenuItem onClick={() => {
                setBulkDialogOpen(true);
                setActionMenuAnchor(null);
              }}>
                <ListItemIcon><Upload /></ListItemIcon>
                <ListItemText>Bulk Import</ListItemText>
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

            {/* Students Table */}
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mt: 2 }}>
              <Table>
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
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>Age</strong></TableCell>
                    <TableCell><strong>Grade</strong></TableCell>
                    <TableCell><strong>Gender</strong></TableCell>
                    <TableCell><strong>Registered</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filtered.length ? (
                    filtered.map((student) => {
                      const isItemSelected = selected.includes(student.id);
                      
                      return (
                        <TableRow 
                          key={student.id} 
                          hover
                          onClick={() => handleSelectOne(student.id)}
                          role="checkbox"
                          aria-checked={isItemSelected}
                          selected={isItemSelected}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              onChange={() => handleSelectOne(student.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" alignItems="center">
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                {student.fullName.charAt(0)}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" fontWeight="bold">
                                  {student.fullName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {student.email}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip label={student.age} color="info" size="small" />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={student.grade} 
                              color={getGradeColor(student.grade)} 
                              size="small" 
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                              {student.gender}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {student.createdAt?.toDate ? 
                                student.createdAt.toDate().toLocaleDateString() : 
                                "—"
                              }
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <Tooltip title="View Details">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewStudent(student);
                                    setDialogOpen(true);
                                  }}
                                >
                                  <Visibility />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Remove Student">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(student.id, student.fullName);
                                  }}
                                >
                                  <Delete />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            No students found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {search ? 'Try adjusting your search' : 'Add your first student to get started'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Floating Action Button */}
        {!school?.isFrozen && (
          <Fab
            color="primary"
            aria-label="add student"
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
            onClick={() => setAddStudentDialogOpen(true)}
          >
            <Add />
          </Fab>
        )}

        {/* View Student Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {viewStudent?.fullName?.charAt(0)}
              </Avatar>
              Student Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {viewStudent && (
              <Grid container spacing={2} sx={{ pt: 1 }}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {viewStudent.fullName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                  <Typography variant="body1">{viewStudent.age}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Grade</Typography>
                  <Typography variant="body1">{viewStudent.grade}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {viewStudent.gender}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                  <Typography variant="body1">{viewStudent.email}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Competition</Typography>
                  <Typography variant="body1">
                    {viewStudent.competitionName || "13th National level drawing competition"}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">Registration Date</Typography>
                  <Typography variant="body1">
                    {viewStudent.createdAt?.toDate ? 
                      viewStudent.createdAt.toDate().toLocaleDateString() : 
                      "—"
                    }
                  </Typography>
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Add Student Dialog */}
        <Dialog open={addStudentDialogOpen} onClose={() => setAddStudentDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Student</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <TextField
                margin="dense"
                label="Full Name"
                fullWidth
                variant="outlined"
                value={newStudent.fullName}
                onChange={(e) => setNewStudent({ ...newStudent, fullName: e.target.value })}
                sx={{ mb: 2 }}
                required
              />
              <Grid container spacing={2} sx={{ mb: 2 }}>
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
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={newStudent.gender}
                      label="Gender"
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value })}
                    >
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={newStudent.grade}
                  label="Grade"
                  onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                  required
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
                label="Email"
                type="email"
                fullWidth
                variant="outlined"
                value={newStudent.email}
                onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                required
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAddStudentDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStudent} variant="contained">
              Add Student
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Layout>
  );
};

export default StudentManager;