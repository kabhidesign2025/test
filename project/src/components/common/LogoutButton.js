import React from "react";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("role"); // clear demo login role
    navigate("/"); // redirect to login
  };

  return (
    <button 
      onClick={handleLogout} 
      className="btn btn-primary d-flex align-items-center gap-2 px-4"
    >
      <i className="bi bi-box-arrow-right"></i>
      Logout
    </button>
  );
};

export default LogoutButton;
