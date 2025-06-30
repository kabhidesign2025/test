import React from "react";
import { Box, Button, Typography, Container, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ThemeToggleButton from "./ThemeToggleButton";

const HomePage = ({ darkMode, onThemeToggle }) => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ mt: 12, textAlign: "center" }}>
      <Stack direction="row" justifyContent="flex-end">
        <ThemeToggleButton darkMode={darkMode} onThemeToggle={onThemeToggle} />
      </Stack>

      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Welcome to EduMaster
      </Typography>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Your gateway to smart school management
      </Typography>

      <Stack spacing={2} mt={4}>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => navigate("/login")}
        >
          Login
        </Button>

        <Button
          variant="outlined"
          color="secondary"
          fullWidth
          onClick={() => navigate("/register-school")}
        >
          Register School
        </Button>
      </Stack>
    </Container>
  );
};

export default HomePage;
