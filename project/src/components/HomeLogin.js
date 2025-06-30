import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const HomeLogin = () => {
  const navigate = useNavigate();

  return (
    <div
      className="d-flex justify-content-center align-items-center vh-100"
      style={{
        background: "linear-gradient(135deg, #a45bd7, #1755e6)",
        color: "#fff",
      }}
    >
      <div
        className="card shadow-lg text-center p-4"
        style={{ maxWidth: "400px", width: "100%", borderRadius: "1rem" }}
      >
        <h2 className="mb-4 text-dark fw-bold">The ART Foundation Portal</h2>

        <button
          className="btn btn-primary w-100 mb-3 fw-semibold"
          onClick={() => navigate("/login")}
        >
          Login
        </button>

        <button
          className="btn btn-outline-primary w-100 fw-semibold"
          onClick={() => navigate("/register-school")}
        >
          Register School
        </button>
      </div>
    </div>
  );
};

export default HomeLogin;
