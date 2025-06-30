import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase/firebaseConfig";
import { collection, addDoc, doc, getDoc, Timestamp } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";

const AddStudent = () => {
  const defaultCompetition = "13th National level drawing competition";

  const [form, setForm] = useState({
    fullName: "",
    age: "",
    grade: "",
    gender: "male",
    email: "",
    competitionName: defaultCompetition,
  });
  const [message, setMessage] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchSchool = async () => {
      if (!user) return;
      const ref = doc(db, "schools", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setSchoolName(snap.data().name);
      }
    };
    fetchSchool();
  }, [user]);

  const handleChange = e =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!user || isSubmitting) return;

    setIsSubmitting(true);
    setMessage("");

    try {
      await addDoc(collection(db, "students"), {
        ...form,
        schoolId: user.uid,
        schoolName,
        createdAt: Timestamp.now(),
        chartStatus: false,
        certificateStatus: false,
        awardStatus: false,
        paymentStatus: false,
      });

      setMessage("✅ Student registered successfully.");
      setForm({
        fullName: "",
        age: "",
        grade: "",
        gender: "male",
        email: "",
        competitionName: defaultCompetition,
      });
    } catch (err) {
      setMessage("❌ Error: " + err.message);
    }

    setIsSubmitting(false);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h3 className="text-center mb-4">Add New Student</h3>

              {message && (
                <div className="alert alert-info text-center">
                  {message}
                  <br />
                  <small className="text-muted">
                    You can register another student below.
                  </small>
                </div>
              )}

              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={form.age}
                    onChange={handleChange}
                    className="form-control"
                    required
                    min={3}
                    max={20}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Grade</label>
                  <input
                    type="text"
                    name="grade"
                    value={form.grade}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="form-control"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Competition Name</label>
                  <input
                    type="text"
                    name="competitionName"
                    value={form.competitionName}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Eg: SDG Drawing 2025"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">School Name</label>
                  <input
                    type="text"
                    value={schoolName}
                    className="form-control"
                    disabled
                  />
                </div>
                <div className="col-12 d-grid">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus-fill me-1"></i> Register Student
                      </>
                    )}
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

export default AddStudent;
