import React, { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

const ContactForm = () => {
  const [form, setForm] = useState({
    name: "",
    school: "",
    location: "",
    whatsapp: "",
    message: "",
    calltime: ""
  });
  const [success, setSuccess] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    await addDoc(collection(db, "contactRequests"), {
      ...form,
      submittedAt: Timestamp.now()
    });
    setSuccess(true);
    setForm({
      name: "",
      school: "",
      location: "",
      whatsapp: "",
      message: "",
      calltime: ""
    });
  };

  return (
    <section id="contact-form" className="py-4 bg-light">
      <div className="container">
        <div className="row justify-content-center mb-3">
          <div className="col-lg-8 text-center">
            <h2 className="fw-bold text-dark fs-3 mb-2">General Enquiry</h2>
            <p className="text-muted fs-6 mb-3">
              Send us your questions or requests. We’ll get in touch shortly.
            </p>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-lg-10">
            <div className="bg-white rounded shadow-sm p-3 p-md-4">
              {success && (
                <div className="alert alert-success">Submitted!</div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="row g-3 text-dark">
                  <div className="col-md-6">
                    <label htmlFor="name" className="form-label">
                      Your Name
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="name"
                      name="name"
                      placeholder="Enter your name"
                      value={form.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="school" className="form-label">
                      School Name
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="school"
                      name="school"
                      placeholder="Enter your school name"
                      value={form.school}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="location" className="form-label">
                      School Location
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="location"
                      name="location"
                      placeholder="City / Town / District"
                      value={form.location}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label htmlFor="whatsapp" className="form-label">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="whatsapp"
                      name="whatsapp"
                      placeholder="e.g., +91 98765 43210"
                      value={form.whatsapp}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-12">
                    <label htmlFor="message" className="form-label">
                      Your Message
                    </label>
                    <textarea
                      className="form-control form-control-sm"
                      id="message"
                      name="message"
                      rows={3}
                      placeholder="Type your message here..."
                      value={form.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="col-md-12">
                    <label htmlFor="calltime" className="form-label">
                      Preferred Time for Call
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="calltime"
                      name="calltime"
                      placeholder="e.g., 10 AM – 12 PM"
                      value={form.calltime}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-12 text-end">
                    <button
                      type="submit"
                      className="btn btn-warning fw-semibold text-dark btn-sm px-4"
                    >
                      Submit
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;