import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import { collection, addDoc, doc, getDoc, Timestamp, writeBatch } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Container,
  Tabs,
  Tab,
  useTheme,
  alpha
} from '@mui/material';
import {
  Add,
  Delete,
  Upload,
  Download,
  Preview,
  Save,
  Clear,
  PersonAdd,
  School as SchoolIcon,
  CloudUpload,
  TableChart
} from '@mui/icons-material';
import Layout from '../common/Layout';
import CSVUploader from './CSVUploader';
import Swal from 'sweetalert2';

const BulkStudentAdd = ({ darkMode, onThemeToggle }) => {
  const [students, setStudents] = useState([]);
  const [schoolName, setSchoolName] = useState("");
  const [school, setSchool] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [user] = useAuthState(auth);
  const theme = useTheme();

  const menuItems = [
    { text: 'Dashboard', icon: <SchoolIcon />, path: '/school/dashboard' },
    { text: 'Students', icon: <PersonAdd />, path: '/school/students' },
    { text: 'Add Student', icon: <Add />, path: '/student/add' },
    { text: 'Bulk Add', icon: <Upload />, path: '/school/bulk-add' }
  ];

  const steps = ['Choose Method', 'Add Students', 'Review & Submit'];

  const defaultStudent = {
    fullName: "",
    age: "",
    grade: "",
    gender: "male",
    email: ""
  };

  useEffect(() => {
    const fetchSchool = async () => {
      if (!user) return;
      const ref = doc(db, "schools", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const schoolData = snap.data();
        setSchool(schoolData);
        setSchoolName(schoolData.name);
      }
    };
    fetchSchool();
  }, [user]);

  // Initialize with 5 empty students
  useEffect(() => {
    if (students.length === 0) {
      setStudents(Array(5).fill().map(() => ({ ...defaultStudent })));
    }
  }, []);

  const handleStudentChange = (index, field, value) => {
    const updatedStudents = [...students];
    updatedStudents[index] = { ...updatedStudents[index], [field]: value };
    setStudents(updatedStudents);
  };

  const addStudent = () => {
    setStudents([...students, { ...defaultStudent }]);
  };

  const removeStudent = (index) => {
    if (students.length > 1) {
      const updatedStudents = students.filter((_, i) => i !== index);
      setStudents(updatedStudents);
    }
  };

  const clearAll = () => {
    Swal.fire({
      title: 'Clear All Students?',
      text: 'This will remove all student data you have entered.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Yes, clear all!'
    }).then((result) => {
      if (result.isConfirmed) {
        setStudents([{ ...defaultStudent }]);
        setActiveStep(0);
      }
    });
  };

  const validateStudents = () => {
    const validStudents = students.filter(student => 
      student.fullName.trim() && 
      student.age && 
      student.grade.trim() && 
      student.email.trim()
    );

    if (validStudents.length === 0) {
      Swal.fire('Error', 'Please add at least one complete student record.', 'error');
      return false;
    }

    // Check for duplicate emails
    const emails = validStudents.map(s => s.email.toLowerCase());
    const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
    
    if (duplicates.length > 0) {
      Swal.fire('Error', `Duplicate emails found: ${duplicates.join(', ')}`, 'error');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (activeStep === 0) {
      setActiveStep(1);
    } else if (activeStep === 1) {
      if (tabValue === 0 && validateStudents()) {
        setActiveStep(2);
      } else if (tabValue === 1) {
        setActiveStep(2);
      }
    }
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const handleSubmit = async () => {
    if (school?.isFrozen) {
      Swal.fire('Error', 'Student registration is currently frozen', 'error');
      return;
    }

    setLoading(true);

    try {
      const validStudents = students.filter(student => 
        student.fullName.trim() && 
        student.age && 
        student.grade.trim() && 
        student.email.trim()
      );

      const batch = writeBatch(db);
      const studentRefs = [];

      validStudents.forEach(student => {
        const studentRef = doc(collection(db, "students"));
        studentRefs.push(studentRef);
        
        batch.set(studentRef, {
          ...student,
          age: Number(student.age),
          schoolId: user.uid,
          schoolName: schoolName,
          competitionName: "13th National level drawing competition",
          chartStatus: false,
          certificateStatus: false,
          awardStatus: false,
          paymentStatus: false,
          createdAt: Timestamp.now(),
        });
      });

      await batch.commit();

      await Swal.fire({
        title: 'Success!',
        text: `${validStudents.length} students registered successfully!`,
        icon: 'success',
        confirmButtonText: 'Great!'
      });

      // Reset form
      setStudents([{ ...defaultStudent }]);
      setActiveStep(0);

    } catch (error) {
      Swal.fire('Error', 'Failed to register students: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getValidStudents = () => {
    return students.filter(student => 
      student.fullName.trim() && 
      student.age && 
      student.grade.trim() && 
      student.email.trim()
    );
  };

  const downloadTemplate = () => {
    const csvContent = "Full Name,Age,Grade,Gender,Email\n" +
      "John Doe,10,Grade 5,male,john@example.com\n" +
      "Jane Smith,12,Grade 7,female,jane@example.com";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
      }
    </div>
  );

  return (
    <Layout
      title="Bulk Student Registration"
      userRole="school"
      userName={schoolName}
      userEmail={auth.currentUser?.email}
      menuItems={menuItems}
      darkMode={darkMode}
      onThemeToggle={onThemeToggle}
    >
      <Container maxWidth="xl" sx={{ py: 2 }}>
        {/* Header */}
        <Box sx={{ 
          mb: 4, 
          textAlign: 'center',
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          borderRadius: 3,
          p: 4
        }}>
          <Typography variant="h3" fontWeight="bold" color="primary" gutterBottom>
            Bulk Student Registration
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
            Add multiple students at once for the competition
          </Typography>
          <Chip 
            icon={<Upload />} 
            label="Bulk Import" 
            color="primary" 
            variant="outlined" 
            size="large"
          />
        </Box>

        {/* Freeze Alert */}
        {school?.isFrozen && (
          <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography fontWeight="bold" variant="h6">
              Student Registration Frozen
            </Typography>
            <Typography>
              Adding new students is currently disabled by the administrator.
            </Typography>
          </Alert>
        )}

        {/* Stepper */}
        <Card sx={{ mb: 3, borderRadius: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Step 0: Choose Method */}
            {activeStep === 0 && (
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" gutterBottom color="primary">
                  Choose Import Method
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                  Select how you would like to add students to the competition
                </Typography>

                <Grid container spacing={3} justifyContent="center">
                  <Grid item xs={12} md={6}>
                    <Card 
                      sx={{ 
                        p: 3, 
                        cursor: 'pointer',
                        border: tabValue === 0 ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s ease'
                        }
                      }}
                      onClick={() => setTabValue(0)}
                    >
                      <TableChart sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        Manual Entry
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Enter student details manually using forms
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card 
                      sx={{ 
                        p: 3, 
                        cursor: 'pointer',
                        border: tabValue === 1 ? `2px solid ${theme.palette.primary.main}` : '2px solid transparent',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                          transition: 'all 0.2s ease'
                        }
                      }}
                      onClick={() => setTabValue(1)}
                    >
                      <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                      <Typography variant="h6" gutterBottom>
                        CSV Upload
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Upload a CSV file with student data
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}

            {/* Step 1: Add Students */}
            {activeStep === 1 && (
              <Box>
                <Tabs 
                  value={tabValue} 
                  onChange={(e, newValue) => setTabValue(newValue)}
                  sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
                >
                  <Tab label="Manual Entry" />
                  <Tab label="CSV Upload" />
                </Tabs>

                {/* Manual Entry Tab */}
                <TabPanel value={tabValue} index={0}>
                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={addStudent}
                    >
                      Add Student
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      onClick={downloadTemplate}
                    >
                      Download Template
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Clear />}
                      onClick={clearAll}
                    >
                      Clear All
                    </Button>
                    <Chip 
                      label={`${getValidStudents().length} Valid Students`} 
                      color="primary" 
                      variant="outlined"
                    />
                  </Box>

                  {/* Student Forms */}
                  <Grid container spacing={2}>
                    {students.map((student, index) => (
                      <Grid item xs={12} key={index}>
                        <Paper 
                          elevation={1} 
                          sx={{ 
                            p: 3, 
                            border: student.fullName.trim() ? `2px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            background: student.fullName.trim() ? alpha(theme.palette.success.main, 0.05) : 'inherit'
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6" color="primary">
                              Student #{index + 1}
                            </Typography>
                            <IconButton
                              color="error"
                              onClick={() => removeStudent(index)}
                              disabled={students.length === 1}
                            >
                              <Delete />
                            </IconButton>
                          </Box>

                          <Grid container spacing={2}>
                            <Grid item xs={12} md={4}>
                              <TextField
                                fullWidth
                                label="Full Name"
                                value={student.fullName}
                                onChange={(e) => handleStudentChange(index, 'fullName', e.target.value)}
                                required
                              />
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <TextField
                                fullWidth
                                label="Age"
                                type="number"
                                value={student.age}
                                onChange={(e) => handleStudentChange(index, 'age', e.target.value)}
                                inputProps={{ min: 3, max: 20 }}
                                required
                              />
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <FormControl fullWidth required>
                                <InputLabel>Grade</InputLabel>
                                <Select
                                  value={student.grade}
                                  label="Grade"
                                  onChange={(e) => handleStudentChange(index, 'grade', e.target.value)}
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
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <FormControl fullWidth>
                                <InputLabel>Gender</InputLabel>
                                <Select
                                  value={student.gender}
                                  label="Gender"
                                  onChange={(e) => handleStudentChange(index, 'gender', e.target.value)}
                                >
                                  <MenuItem value="male">Male</MenuItem>
                                  <MenuItem value="female">Female</MenuItem>
                                  <MenuItem value="other">Other</MenuItem>
                                </Select>
                              </FormControl>
                            </Grid>
                            <Grid item xs={12} md={2}>
                              <TextField
                                fullWidth
                                label="Email"
                                type="email"
                                value={student.email}
                                onChange={(e) => handleStudentChange(index, 'email', e.target.value)}
                                required
                              />
                            </Grid>
                          </Grid>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </TabPanel>

                {/* CSV Upload Tab */}
                <TabPanel value={tabValue} index={1}>
                  <CSVUploader 
                    schoolId={user?.uid}
                    schoolName={schoolName}
                    onUploadComplete={() => {
                      Swal.fire('Success!', 'Students imported successfully!', 'success');
                      setActiveStep(0);
                    }}
                  />
                </TabPanel>
              </Box>
            )}

            {/* Step 2: Review & Submit */}
            {activeStep === 2 && tabValue === 0 && (
              <Box>
                <Typography variant="h5" gutterBottom color="primary" sx={{ textAlign: 'center' }}>
                  Review Students ({getValidStudents().length} students)
                </Typography>
                
                <TableContainer 
                  component={Paper} 
                  elevation={0} 
                  sx={{ 
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 2,
                    mb: 3
                  }}
                >
                  <Table>
                    <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      <TableRow>
                        <TableCell><strong>#</strong></TableCell>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Age</strong></TableCell>
                        <TableCell><strong>Grade</strong></TableCell>
                        <TableCell><strong>Gender</strong></TableCell>
                        <TableCell><strong>Email</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {getValidStudents().map((student, index) => (
                        <TableRow key={index} hover>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{student.fullName}</TableCell>
                          <TableCell>{student.age}</TableCell>
                          <TableCell>{student.grade}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{student.gender}</TableCell>
                          <TableCell>{student.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ textAlign: 'center', py: 2 }}>
                  {loading && (
                    <Box sx={{ mb: 3 }}>
                      <LinearProgress />
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Registering students...
                      </Typography>
                    </Box>
                  )}

                  <Alert severity="info" sx={{ mb: 3 }}>
                    Once submitted, students will be registered for the 13th National Level Drawing Competition.
                  </Alert>
                </Box>
              </Box>
            )}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              
              <Box>
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={loading || school?.isFrozen || (tabValue === 0 && getValidStudents().length === 0)}
                    startIcon={<Save />}
                    size="large"
                  >
                    {loading ? 'Submitting...' : 'Submit All Students'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={activeStep === 1 && tabValue === 0 && getValidStudents().length === 0}
                    size="large"
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};

export default BulkStudentAdd;