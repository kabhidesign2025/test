import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import {
  collection,
  getDocs,
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
  Container,
  useMediaQuery,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  LinearProgress,
  Divider
} from '@mui/material';
import {
  Dashboard,
  School,
  People,
  PersonAdd,
  Assignment,
  Download,
  TrendingUp,
  BarChart,
  PieChart,
  Timeline
} from '@mui/icons-material';
import Layout from '../common/Layout';
import StatsCard from '../common/StatsCard';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';

const Reports = ({ darkMode, onThemeToggle }) => {
  const [schools, setSchools] = useState([]);
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("all");
  const [reportType, setReportType] = useState("overview");
  
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
      // Fetch schools
      const schoolsSnap = await getDocs(collection(db, "schools"));
      const schoolsList = schoolsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSchools(schoolsList);

      // Fetch students
      const studentsQuery = query(collection(db, "students"), orderBy("createdAt", "desc"));
      const studentsSnap = await getDocs(studentsQuery);
      const studentsList = studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setStudents(studentsList);

      // Fetch users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalSchools = schools.length;
  const approvedSchools = schools.filter(s => s.status === 'approved').length;
  const pendingSchools = schools.filter(s => s.status === 'pending' || s.status === 'registered').length;
  const completedSchools = schools.filter(s => s.status === 'acknowledged').length;
  const totalStudents = students.length;
  const totalUsers = users.length;

  // School status distribution
  const schoolStatusData = [
    { name: 'Approved', value: approvedSchools, color: '#4caf50' },
    { name: 'Pending', value: pendingSchools, color: '#ff9800' },
    { name: 'Completed', value: completedSchools, color: '#2196f3' },
    { name: 'Rejected', value: schools.filter(s => s.status === 'rejected').length, color: '#f44336' }
  ];

  // Students by grade
  const gradeData = students.reduce((acc, student) => {
    const grade = student.grade || 'Unknown';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {});

  const gradeChartData = Object.entries(gradeData).map(([grade, count]) => ({
    grade,
    students: count
  }));

  // Monthly registration data
  const monthlyData = students.reduce((acc, student) => {
    if (student.createdAt?.toDate) {
      const date = student.createdAt.toDate();
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      acc[monthYear] = (acc[monthYear] || 0) + 1;
    }
    return acc;
  }, {});

  const monthlyChartData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({
      month,
      registrations: count
    }));

  // Top schools by student count
  const schoolStudentCount = students.reduce((acc, student) => {
    const schoolId = student.schoolId;
    if (schoolId) {
      acc[schoolId] = (acc[schoolId] || 0) + 1;
    }
    return acc;
  }, {});

  const topSchoolsData = Object.entries(schoolStudentCount)
    .map(([schoolId, count]) => {
      const school = schools.find(s => s.id === schoolId);
      return {
        name: school?.name || 'Unknown School',
        students: count
      };
    })
    .sort((a, b) => b.students - a.students)
    .slice(0, 10);

  const exportReport = () => {
    const reportData = {
      summary: {
        totalSchools,
        approvedSchools,
        pendingSchools,
        completedSchools,
        totalStudents,
        totalUsers
      },
      schools: schools.map(school => ({
        name: school.name,
        principal: school.principal,
        email: school.email,
        status: school.status,
        studentsCount: schoolStudentCount[school.id] || 0,
        registrationDate: school.createdAt ? new Date(school.createdAt).toLocaleDateString() : 'N/A'
      })),
      students: students.map(student => {
        const school = schools.find(s => s.id === student.schoolId);
        return {
          name: student.fullName,
          age: student.age,
          grade: student.grade,
          school: school?.name || 'Unknown',
          registrationDate: student.createdAt?.toDate ? student.createdAt.toDate().toLocaleDateString() : 'N/A'
        };
      })
    };

    const csvContent = [
      'SUMMARY REPORT',
      `Total Schools,${totalSchools}`,
      `Approved Schools,${approvedSchools}`,
      `Pending Schools,${pendingSchools}`,
      `Completed Schools,${completedSchools}`,
      `Total Students,${totalStudents}`,
      `Total Users,${totalUsers}`,
      '',
      'SCHOOLS DETAIL',
      'School Name,Principal,Email,Status,Students Count,Registration Date',
      ...reportData.schools.map(school => 
        `${school.name},${school.principal || ''},${school.email},${school.status || 'pending'},${school.studentsCount},${school.registrationDate}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `art_foundation_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const TabPanel = ({ children, value, index }) => (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
      
    </div>
  );

  if (loading) {
    return (
      <Layout
        title="Reports & Analytics"
        userRole="admin"
        userName="Administrator"
        userEmail={auth.currentUser?.email}
        menuItems={menuItems}
        darkMode={darkMode}
        onThemeToggle={onThemeToggle}
      >
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <Typography>Loading reports...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout
      title="Reports & Analytics"
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
            Reports & Analytics
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Comprehensive insights and data analysis
          </Typography>
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={isMobile ? 1 : 3} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={4} md={2}>
            <StatsCard
              title="Schools"
              value={totalSchools}
              icon={<School />}
              color="primary"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatsCard
              title="Students"
              value={totalStudents}
              icon={<People />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatsCard
              title="Approved"
              value={approvedSchools}
              icon={<TrendingUp />}
              color="info"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatsCard
              title="Pending"
              value={pendingSchools}
              icon={<Timeline />}
              color="warning"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatsCard
              title="Completed"
              value={completedSchools}
              icon={<Assignment />}
              color="success"
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <StatsCard
              title="Users"
              value={totalUsers}
              icon={<PersonAdd />}
              color="secondary"
            />
          </Grid>
        </Grid>

        {/* Controls */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2, 
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between'
            }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Report Type</InputLabel>
                  <Select
                    value={reportType}
                    label="Report Type"
                    onChange={(e) => setReportType(e.target.value)}
                  >
                    <MenuItem value="overview">Overview</MenuItem>
                    <MenuItem value="schools">Schools</MenuItem>
                    <MenuItem value="students">Students</MenuItem>
                    <MenuItem value="progress">Progress</MenuItem>
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateRange}
                    label="Date Range"
                    onChange={(e) => setDateRange(e.target.value)}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="quarter">This Quarter</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Button
                variant="contained"
                startIcon={<Download />}
                onClick={exportReport}
                size="small"
              >
                Export Report
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Charts and Analytics */}
        <Grid container spacing={3}>
          {/* School Status Distribution */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  School Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={schoolStatusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {schoolStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Students by Grade */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Students by Grade
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={gradeChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="students" fill="#2196f3" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Registrations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Monthly Registration Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="registrations" stroke="#4caf50" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Schools */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Top Schools by Student Count
                </Typography>
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell><strong>Rank</strong></TableCell>
                        <TableCell><strong>School Name</strong></TableCell>
                        <TableCell><strong>Students</strong></TableCell>
                        <TableCell><strong>Progress</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {topSchoolsData.map((school, index) => (
                        <TableRow key={school.name} hover>
                          <TableCell>#{index + 1}</TableCell>
                          <TableCell>{school.name}</TableCell>
                          <TableCell>
                            <Chip label={school.students} color="primary" size="small" />
                          </TableCell>
                          <TableCell>
                            <LinearProgress
                              variant="determinate"
                              value={(school.students / Math.max(...topSchoolsData.map(s => s.students))) * 100}
                              sx={{ width: 100 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default Reports;