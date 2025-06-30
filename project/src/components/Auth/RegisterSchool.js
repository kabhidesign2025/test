import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Avatar,
  Stack,
  Container
} from '@mui/material';
import {
  School,
  Person,
  Email,
  Phone,
  LocationOn,
  Lock
} from '@mui/icons-material';

function RegisterSchool({ darkMode, onThemeToggle, isModal }) {
  const [form, setForm] = useState({
    name: "",
    principal: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(""); // Add this at the top with other useState
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "School name is required";
    if (!form.principal.trim()) newErrors.principal = "Principal name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.email.includes('@')) newErrors.email = "Valid email is required";
    if (!form.phone.trim()) newErrors.phone = "Phone number is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.password) newErrors.password = "Password is required";
    if (form.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = "Passwords do not match";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "schools", uid), {
        name: form.name,
        principal: form.principal,
        email: form.email,
        phone: form.phone,
        address: form.address,
        status: "pending",
        createdAt: Date.now(),
      });

      await setDoc(doc(db, "users", uid), {
        uid,
        email: form.email,
        role: "school",
        schoolId: uid,
        createdAt: Date.now(),
      });

      setSuccess("Registration successful! Please wait for admin approval before logging in.");
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: "Registration successful! Please wait for admin approval before logging in.",
            type: "success"
          }
        });
      }, 2000);

    } catch (err) {
      setErrors({ submit: err.message });
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: isModal ? 0 : 4 }}>
      <Box
        sx={{
          width: { xs: '100%', md: '700px' }, // Card width for desktop
          mx: "auto",
          p: { xs: 3, sm: 4 },
          background: theme => theme.palette.background.paper,
          borderRadius: 4,
          boxShadow: theme => theme.shadows[4],
          border: theme => `1px solid ${theme.palette.divider}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center" // Center the card content
        }}
      >
        <Stack alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Avatar sx={{ 
            bgcolor: "primary.main", 
            width: 56, 
            height: 56,
            mb: 1
          }}>
            <School fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
            School Registration
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Join the 13th National Level Drawing Competition
          </Typography>
        </Stack>

        {errors.submit && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {errors.submit}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit} style={{ width: "100%" }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              {/* School Name */}
              <TextField
                fullWidth
                label="School Name"
                name="name"
                value={form.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: <School sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                variant="outlined"
                required
                size="medium"
                sx={{ background: "#f8fafd", borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* Principal Name */}
              <TextField
                fullWidth
                label="Principal Name"
                name="principal"
                value={form.principal}
                onChange={handleChange}
                error={!!errors.principal}
                helperText={errors.principal}
                InputProps={{
                  startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                variant="outlined"
                required
                size="medium"
                sx={{ background: "#f8fafd", borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* Email Address */}
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                variant="outlined"
                required
                size="medium"
                sx={{ background: "#f8fafd", borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* Phone Number */}
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                error={!!errors.phone}
                helperText={errors.phone}
                InputProps={{
                  startAdornment: <Phone sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                variant="outlined"
                required
                size="medium"
                sx={{ background: "#f8fafd", borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* Password */}
              <TextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password || "Minimum 6 characters"}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                variant="outlined"
                required
                size="medium"
                sx={{ background: "#f8fafd", borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* Confirm Password */}
              <TextField
                fullWidth
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                variant="outlined"
                required
                size="medium"
                sx={{ background: "#f8fafd", borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              {/* School Address - full width */}
              <TextField
                fullWidth
                label="School Address"
                name="address"
                multiline
                rows={3}
                value={form.address}
                onChange={handleChange}
                error={!!errors.address}
                helperText={errors.address}
                InputProps={{
                  startAdornment: (
                    <LocationOn sx={{ mr: 1, color: 'text.secondary', alignSelf: 'flex-start', mt: 1 }} />
                  )
                }}
                variant="outlined"
                required
                size="medium"
                sx={{ background: "#f8fafd", borderRadius: 2 }}
              />
            </Grid>
            <Grid item xs={12}>
              {/* Centered Button at bottom */}
              <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  sx={{
                    py: 1.7,
                    px: 5,
                    borderRadius: 3,
                    fontWeight: 700,
                    fontSize: "1.1rem",
                    boxShadow: 3,
                    textTransform: "none"
                  }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Registering...' : 'Register School'}
                </Button>
              </Box>
            </Grid>
            {/* Add the quote directly below the button */}
            <Grid item xs={12}>
              <Box
                sx={{
                  textAlign: 'center',
                  p: 2,
                  mt: 2,
                  backgroundColor: theme => theme.palette.grey[100],
                  borderRadius: 2,
                }}
              >
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontStyle: 'italic' }}
                >
                  🎨 "Every child is an artist" 🌟
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Box>
    </Container>
  );
}

export default RegisterSchool;