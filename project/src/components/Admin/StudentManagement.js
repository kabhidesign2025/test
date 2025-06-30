import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  query,
  orderBy,
  where
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
  Search,
  FilterList,
  Assignment,
  Download,
  MoreVert,
  Email,
  Print,
  FileDownload
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import Swal from 'sweetalert2';

const StudentManagement = ({ darkMode, onThemeToggle }) => {
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [filterSchool, setFilterSchool] = useState("all");
  const [filterGrade, setFilterGrade] = useState("all");
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
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch students
      const studentsQuery = query(collection(db, "students"), orderBy("createdAt", "desc"));
      const studentsSnap = await getDocs(studentsQuery);
      const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);

      // Fetch schools
      const schoolsSnap = await getDocs(collection(db, "schools"));
      const schoolsList = schoolsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId, studentName) => {
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
        await deleteDoc(doc(db, "students", studentId));
        setStudents(prev => prev.filter(s => s.id !== studentId));
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
        const deletePromises = selected.map(id => deleteDoc(doc(db, "students", id)));
        await Promise.all(deletePromises);

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
      setSelected(filteredStudents.map(s => s.id));
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
    const csvData = filteredStudents.map(student => {
      const school = schools.find(s => s.id === student.schoolId);
      return {
        'Full Name': student.fullName,
        'Age': student.age,
        'Grade': student.grade,
        'Gender': student.gender,
        'Email': student.email,
        'School': school?.name || 'Unknown',
        'Competition': student.competitionName || '',
        'Registration Date': student.createdAt?.toDate ? student.createdAt.toDate().toLocaleDateString() : 'N/A'
      };
    });

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredStudents = students.filter(student => {
    const school = schools.find(s => s.id === student.schoolId);
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = student.fullName?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.grade?.toLowerCase().includes(searchLower) ||
      school?.name?.toLowerCase().includes(searchLower);
    
    const matchesSchool = filterSchool === "all" || student.schoolId === filterSchool;
    const matchesGrade = filterGrade === "all" || student.grade === filterGrade;
    
    return matchesSearch && matchesSchool && matchesGrade;
  });

  const getGradeColor = (grade) => {
    if (grade?.includes('KG')) return 'secondary';
    const gradeNum = parseInt(grade?.replace('Grade ', ''));
    if (gradeNum <= 5) return 'primary';
    if (gradeNum <= 8) return 'info';
    return 'success';
  };

  const uniqueGrades = [...new Set(students.map(s => s.grade))].filter(Boolean).sort();
  const numSelected = selected.length;
  const rowCount = filteredStudents.length;

  return (
    <Layout
      title="Student Management"
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
            Student Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage all registered students across schools
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={isMobile ? 1 : 3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Total Students"
              value={students.length}
              icon={<People />}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
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
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Schools"
              value={schools.length}
              icon={<School />}
              color="info"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <StatsCard
              title="Selected"
              value={selected.length}
              icon={<Assignment />}
              color="warning"
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
                  All Students ({filteredStudents.length})
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
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                    sx={{ width: { xs: '100%', sm: 250 } }}
                  />
                  
                  <FormControl size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>School</InputLabel>
                    <Select
                      value={filterSchool}
                      label="School"
                      onChange={(e) => setFilterSchool(e.target.value)}
                    >
                      <MenuItem value="all">All Schools</MenuItem>
                      {schools.map((school) => (
                        <MenuItem key={school.id} value={school.id}>
                          {school.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ minWidth: 100 }}>
                    <InputLabel>Grade</InputLabel>
                    <Select
                      value={filterGrade}
                      label="Grade"
                      onChange={(e) => setFilterGrade(e.target.value)}
                    >
                      <MenuItem value="all">All Grades</MenuItem>
                      {uniqueGrades.map((grade) => (
                        <MenuItem key={grade} value={grade}>
                          {grade}
                        </MenuItem>
                      ))}
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

            {/* Students Table */}
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
                    <TableCell><strong>Student</strong></TableCell>
                    <TableCell><strong>School</strong></TableCell>
                    <TableCell><strong>Age</strong></TableCell>
                    <TableCell><strong>Grade</strong></TableCell>
                    <TableCell><strong>Gender</strong></TableCell>
                    <TableCell><strong>Registered</strong></TableCell>
                    <TableCell><strong>Actions</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Box display="flex" flexDirection="column" alignItems="center">
                          <People sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="h6" color="text.secondary">
                            No students found
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'Try adjusting your search filters' : 'No students registered yet'}
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const isItemSelected = selected.includes(student.id);
                      const school = schools.find(s => s.id === student.schoolId);
                      
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
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main', width: 32, height: 32 }}>
                                {student.fullName?.charAt(0)}
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
                            <Typography variant="body2">
                              {school?.name || 'Unknown School'}
                            </Typography>
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
                                    setSelectedStudent(student);
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
                                    handleDeleteStudent(student.id, student.fullName);
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
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Student Details Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            <Box display="flex" alignItems="center">
              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                {selectedStudent?.fullName?.charAt(0)}
              </Avatar>
              Student Details
            </Box>
          </DialogTitle>
          <DialogContent>
            {selectedStudent && (
              <Grid container spacing={3} sx={{ pt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Personal Information
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                        <Typography variant="body1">{selectedStudent.fullName}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Age</Typography>
                        <Typography variant="body1">{selectedStudent.age}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Grade</Typography>
                        <Typography variant="body1">{selectedStudent.grade}</Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Gender</Typography>
                        <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                          {selectedStudent.gender}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                        <Typography variant="body1">{selectedStudent.email}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        School & Competition
                      </Typography>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">School</Typography>
                        <Typography variant="body1">
                          {schools.find(s => s.id === selectedStudent.schoolId)?.name || 'Unknown School'}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Competition</Typography>
                        <Typography variant="body1">
                          {selectedStudent.competitionName || "13th National level drawing competition"}
                        </Typography>
                      </Box>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">Registration Date</Typography>
                        <Typography variant="body1">
                          {selectedStudent.createdAt?.toDate ? 
                            selectedStudent.createdAt.toDate().toLocaleDateString() : 
                            "—"
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                          <Chip 
                            label={selectedStudent.chartStatus ? "Chart Sent" : "Chart Pending"} 
                            color={selectedStudent.chartStatus ? "success" : "default"}
                            size="small"
                          />
                          <Chip 
                            label={selectedStudent.certificateStatus ? "Certificate Sent" : "Certificate Pending"} 
                            color={selectedStudent.certificateStatus ? "success" : "default"}
                            size="small"
                          />
                        </Box>
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
      </Container>
    </Layout>
  );
};

export default StudentManagement;