import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  LinearProgress,
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
  Stepper,
  Step,
  StepLabel,
  Grid
} from '@mui/material';
import {
  CloudUpload,
  Download,
  Preview,
  Check,
  Error,
  Delete,
  FileUpload
} from '@mui/icons-material';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import Swal from 'sweetalert2';

const CSVUploader = ({ schoolId, schoolName, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [csvData, setCsvData] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Upload CSV', 'Validate Data', 'Import Students'];

  const downloadTemplate = () => {
    const csvContent = [
      'Full Name,Age,Grade,Gender,Email',
      'John Doe,10,Grade 5,male,john@example.com',
      'Jane Smith,12,Grade 7,female,jane@example.com',
      'Alex Johnson,8,Grade 3,male,alex@example.com'
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    if (!uploadedFile.name.endsWith('.csv')) {
      Swal.fire('Error', 'Please upload a CSV file only', 'error');
      return;
    }

    setFile(uploadedFile);
    parseCSV(uploadedFile);
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        Swal.fire('Error', 'CSV file must contain at least a header and one data row', 'error');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['Full Name', 'Age', 'Grade', 'Gender', 'Email'];
      
      // Validate headers
      const headerValid = expectedHeaders.every(header => 
        headers.some(h => h.toLowerCase().includes(header.toLowerCase()))
      );

      if (!headerValid) {
        Swal.fire('Error', 'CSV headers must include: Full Name, Age, Grade, Gender, Email', 'error');
        return;
      }

      // Parse data rows
      const data = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length < 5) continue;

        const student = {
          fullName: values[0],
          age: parseInt(values[1]),
          grade: values[2],
          gender: values[3].toLowerCase(),
          email: values[4],
          rowNumber: i + 1
        };

        // Validate each student
        const rowErrors = validateStudent(student, i + 1);
        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
        }

        data.push(student);
      }

      setCsvData(data);
      setValidationErrors(errors);
      setActiveStep(1);
    };

    reader.readAsText(file);
  };

  const validateStudent = (student, rowNumber) => {
    const errors = [];

    if (!student.fullName || student.fullName.length < 2) {
      errors.push(`Row ${rowNumber}: Full name is required and must be at least 2 characters`);
    }

    if (!student.age || student.age < 3 || student.age > 20) {
      errors.push(`Row ${rowNumber}: Age must be between 3 and 20`);
    }

    if (!student.grade) {
      errors.push(`Row ${rowNumber}: Grade is required`);
    }

    if (!['male', 'female', 'other'].includes(student.gender)) {
      errors.push(`Row ${rowNumber}: Gender must be male, female, or other`);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!student.email || !emailRegex.test(student.email)) {
      errors.push(`Row ${rowNumber}: Valid email is required`);
    }

    return errors;
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      Swal.fire('Error', 'Please fix validation errors before importing', 'error');
      return;
    }

    setUploading(true);
    setActiveStep(2);

    try {
      const validStudents = csvData.filter(student => 
        student.fullName && student.age && student.grade && student.email
      );

      // Check for duplicate emails
      const emails = validStudents.map(s => s.email.toLowerCase());
      const duplicates = emails.filter((email, index) => emails.indexOf(email) !== index);
      
      if (duplicates.length > 0) {
        Swal.fire('Error', `Duplicate emails found: ${duplicates.join(', ')}`, 'error');
        setUploading(false);
        return;
      }

      // Import students
      const promises = validStudents.map(student => 
        addDoc(collection(db, "students"), {
          fullName: student.fullName,
          age: student.age,
          grade: student.grade,
          gender: student.gender,
          email: student.email,
          schoolId: schoolId,
          schoolName: schoolName,
          competitionName: "13th National level drawing competition",
          chartStatus: false,
          certificateStatus: false,
          awardStatus: false,
          paymentStatus: false,
          createdAt: Timestamp.now(),
        })
      );

      await Promise.all(promises);

      Swal.fire({
        title: 'Success!',
        text: `${validStudents.length} students imported successfully!`,
        icon: 'success',
        confirmButtonText: 'Great!'
      });

      // Reset form
      setFile(null);
      setCsvData([]);
      setValidationErrors([]);
      setActiveStep(0);
      
      if (onUploadComplete) {
        onUploadComplete();
      }

    } catch (error) {
      Swal.fire('Error', 'Failed to import students: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeStudent = (index) => {
    const newData = csvData.filter((_, i) => i !== index);
    setCsvData(newData);
    
    // Re-validate remaining data
    const errors = [];
    newData.forEach((student, i) => {
      const rowErrors = validateStudent(student, i + 1);
      errors.push(...rowErrors);
    });
    setValidationErrors(errors);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          CSV Student Import
        </Typography>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step 0: Upload */}
        {activeStep === 0 && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Button
                  variant="outlined"
                  startIcon={<Download />}
                  onClick={downloadTemplate}
                  fullWidth
                >
                  Download Template
                </Button>
              </Grid>
              <Grid item xs={12} md={6}>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<CloudUpload />}
                  fullWidth
                >
                  Upload CSV File
                  <input
                    type="file"
                    accept=".csv"
                    hidden
                    onChange={handleFileUpload}
                  />
                </Button>
              </Grid>
            </Grid>

            {file && (
              <Alert severity="info" sx={{ mb: 2 }}>
                File selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </Alert>
            )}

            <Alert severity="info">
              <Typography variant="subtitle2" gutterBottom>
                CSV Format Requirements:
              </Typography>
              <Typography variant="body2">
                • Headers: Full Name, Age, Grade, Gender, Email<br />
                • Age: 3-20 years<br />
                • Gender: male, female, or other<br />
                • Email: Valid email format<br />
                • No duplicate emails allowed
              </Typography>
            </Alert>
          </Box>
        )}

        {/* Step 1: Validation */}
        {activeStep === 1 && (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Data Validation ({csvData.length} students)
              </Typography>
              <Button
                variant="outlined"
                startIcon={<Preview />}
                onClick={() => setPreviewOpen(true)}
              >
                Preview Data
              </Button>
            </Box>

            {validationErrors.length > 0 ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {validationErrors.length} Validation Error(s):
                </Typography>
                {validationErrors.slice(0, 5).map((error, index) => (
                  <Typography key={index} variant="body2">
                    • {error}
                  </Typography>
                ))}
                {validationErrors.length > 5 && (
                  <Typography variant="body2">
                    ... and {validationErrors.length - 5} more errors
                  </Typography>
                )}
              </Alert>
            ) : (
              <Alert severity="success" sx={{ mb: 2 }}>
                All data validated successfully! Ready to import.
              </Alert>
            )}

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setActiveStep(0)}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={validationErrors.length > 0}
                startIcon={<FileUpload />}
              >
                Import Students
              </Button>
            </Box>
          </Box>
        )}

        {/* Step 2: Importing */}
        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Importing Students...
            </Typography>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Please wait while we import your students to the database.
            </Typography>
          </Box>
        )}

        {/* Preview Dialog */}
        <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="lg" fullWidth>
          <DialogTitle>Data Preview</DialogTitle>
          <DialogContent>
            <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Age</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Gender</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {csvData.map((student, index) => {
                    const hasErrors = validationErrors.some(error => 
                      error.includes(`Row ${student.rowNumber}`)
                    );
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{student.fullName}</TableCell>
                        <TableCell>{student.age}</TableCell>
                        <TableCell>{student.grade}</TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>
                          {student.gender}
                        </TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Chip
                            icon={hasErrors ? <Error /> : <Check />}
                            label={hasErrors ? "Error" : "Valid"}
                            color={hasErrors ? "error" : "success"}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => removeStudent(index)}
                          >
                            <Delete />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPreviewOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CSVUploader;