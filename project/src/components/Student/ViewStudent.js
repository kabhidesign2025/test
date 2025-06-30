import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";

const ViewStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const docRef = doc(db, "students", id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setStudent(docSnap.data());
        } else {
          console.log("No such student!");
        }
      } catch (err) {
        console.error("Error fetching student:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [id]);

  if (loading) {
    return <div className="text-center py-5">Loading student info...</div>;
  }

  if (!student) {
    return <div className="text-center py-5 text-danger">Student not found.</div>;
  }

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-body">
              <h4 className="mb-4 text-center text-primary">Student Details</h4>
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <th>Full Name</th>
                    <td>{student.fullName}</td>
                  </tr>
                  <tr>
                    <th>Age</th>
                    <td>{student.age}</td>
                  </tr>
                  <tr>
                    <th>Gender</th>
                    <td>{student.gender}</td>
                  </tr>
                  <tr>
                    <th>Grade</th>
                    <td>{student.grade}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{student.email}</td>
                  </tr>
                  <tr>
                    <th>Competition</th>
                    <td>{student.competitionName}</td>
                  </tr>
                  <tr>
                    <th>Registered Date</th>
                    <td>
                      {student.createdAt?.toDate
                        ? student.createdAt.toDate().toLocaleDateString()
                        : "N/A"}
                    </td>
                  </tr>
                  <tr>
                    <th>Chart</th>
                    <td>{student.chartStatus ? "✔️" : "❌"}</td>
                  </tr>
                  <tr>
                    <th>Certificate</th>
                    <td>{student.certificateStatus ? "📄" : "—"}</td>
                  </tr>
                  <tr>
                    <th>Award</th>
                    <td>{student.awardStatus ? "🏆" : "—"}</td>
                  </tr>
                  <tr>
                    <th>Payment</th>
                    <td>{student.paymentStatus ? "✅" : "❌"}</td>
                  </tr>
                </tbody>
              </table>

              <div className="text-end">
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                  ← Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewStudent;
