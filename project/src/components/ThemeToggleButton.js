import React from "react";
import IconButton from "@mui/material/IconButton";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import LinearProgress from "@mui/material/LinearProgress";
import TextField from "@mui/material/TextField";

const ThemeToggleButton = ({ darkMode, onThemeToggle }) => (
  <IconButton
    onClick={onThemeToggle}
    color="inherit"
    aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
  >
    {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
  </IconButton>
);

const RegisterSchool = () => {
  return (
    <div>
      {/* Other components and logic for registering a school */}
      <LinearProgress aria-label="Registration progress" />
      <TextField
        label="Email"
        autoComplete="email"
        variant="outlined"
        margin="normal"
        required
        fullWidth
        // ...other props
      />
    </div>
  );
};

export default ThemeToggleButton;
export { RegisterSchool };