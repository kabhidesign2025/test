import React, { useState, useEffect } from "react";
import { db } from "../../firebase/firebaseConfig";
import {
  collection,
  addDoc,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const StudentRegister = () => {
  const defaultCompetition = "13th National level drawing competition";

  const [form, setForm] = useState({
    fullName: "",
    age: "",
    gender: "male",
    grade: "",
    email: "",
    competitionName: defaultCompetition,
    schoolName: "",
  });

  const [schools, setSchools] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch all schools from Firestore on mount
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsSnapshot = await getDocs(collection(db, "schools"));
        const schoolsList = schoolsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSchools(schoolsList);
      } catch (error) {
        console.error("Error fetching schools:", error);
        setMessage("❌ Error fetching schools.");
      }
    };
    fetchSchools();
  }, []);

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Update form state on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "gender" || name === "schoolName"
        ? value
        : value.replace(/^\s+/, ""),
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.schoolName) {
      setMessage("❌ Please select a school.");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      const selectedSchool = schools.find(
        (school) => school.name === form.schoolName
      );

      if (!selectedSchool) {
        setMessage("❌ Selected school not found.");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "students"), {
        fullName: form.fullName.trim(),
        age: Number(form.age),
        gender: form.gender,
        grade: form.grade.trim(),
        email: form.email.trim(),
        competitionName: form.competitionName.trim(),
        schoolId: selectedSchool.id,
        schoolName: form.schoolName,
        createdAt: Timestamp.now(),
        chartStatus: false,
        certificateStatus: false,
        awardStatus: false,
        paymentStatus: false,
        approved: false,
      });

      setMessage(`✅ ${form.fullName} registered successfully! All the best.`);
      setForm({
        fullName: "",
        age: "",
        gender: "male",
        grade: "",
        email: "",
        competitionName: defaultCompetition,
        schoolName: "",
      });

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="text-center mb-4">Student Registration</h3>

              {message && (
                <div className="alert alert-info text-center" role="alert">
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="row g-3" noValidate>
                <div className="col-md-6">
                  <label htmlFor="fullName" className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="form-control"
                    required
                    autoComplete="off"
                    disabled={loading}
                  />
                </div>

                <div className="col-md-3">
                  <label htmlFor="age" className="form-label">
                    Age
                  </label>
                  <input
                    type="number"
                    id="age"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    className="form-control"
                    min="3"
                    max="20"
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-3">
                  <label htmlFor="gender" className="form-label">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={form.gender}
                    onChange={handleChange}
                    className="form-select"
                    disabled={loading}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label htmlFor="grade" className="form-label">
                    Grade
                  </label>
                  <input
                    type="text"
                    id="grade"
                    name="grade"
                    value={form.grade}
                    onChange={handleChange}
                    className="form-control"
                    required
                    autoComplete="off"
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="form-control"
                    required
                    autoComplete="off"
                    disabled={loading}
                  />
                </div>

                <div className="col-md-12">
                  <label htmlFor="competitionName" className="form-label">
                    Competition Name
                  </label>
                  <input
                    type="text"
                    id="competitionName"
                    name="competitionName"
                    value={form.competitionName}
                    onChange={handleChange}
                    placeholder="Eg: SDG Drawing 2025"
                    className="form-control"
                    required
                    autoComplete="off"
                    disabled={loading}
                  />
                </div>

                <div className="col-md-12">
                  <label htmlFor="schoolName" className="form-label">
                    School Name
                  </label>
                  <select
                    id="schoolName"
                    name="schoolName"
                    value={form.schoolName}
                    onChange={handleChange}
                    className="form-select"
                    required
                    disabled={loading}
                  >
                    <option value="">-- Select School --</option>
                    {schools.map((school) => (
                      <option key={school.id} value={school.name}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-12 d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    {loading ? "Registering..." : "Register Student"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentRegister;
