import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { usePatient } from '../../context/PatientContext';
import {
  fetchPatientPrescriptions,
  downloadPrescription,
  selectPatientPrescriptions,
  selectPrescriptionLoading,
  selectPrescriptionErrors
} from '../../store/slices/prescriptionSlice';
import '../../assets/css/PatientPrescriptions.css';

const PatientPrescriptions = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { logout } = usePatient();
    
    // Redux state
    const prescriptions = useSelector(selectPatientPrescriptions);
    const loading = useSelector(selectPrescriptionLoading);
    const errors = useSelector(selectPrescriptionErrors);

    useEffect(() => {
        dispatch(fetchPatientPrescriptions());
    }, [dispatch]);

    // Handle login redirect
    useEffect(() => {
        if (errors.patientPrescriptions && errors.patientPrescriptions.includes('log in')) {
            setTimeout(() => {
                navigate('/patient/form');
            }, 2000);
        }
    }, [errors.patientPrescriptions, navigate]);

    const handleDownload = async (prescriptionId) => {
        const result = await dispatch(downloadPrescription({ prescriptionId, userType: 'patient' }));
        
        if (result.type === 'prescription/downloadPrescription/rejected') {
            alert('Failed to download prescription. Please try again.');
        }
    };



    if (loading.patientPrescriptions) {
        return (
            <div className="prescriptions-container">
                <div className="loading">
                    <div className="loading-spinner"></div>
                    <p>Loading your prescriptions...</p>
                </div>
            </div>
        );
    }

    if (errors.patientPrescriptions) {
        return (
            <div className="prescriptions-container">
                <div className="error-message">
                    <i className="fas fa-exclamation-triangle"></i>
                    <h3>Error Loading Prescriptions</h3>
                    <p>{errors.patientPrescriptions}</p>
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button className="retry-btn" onClick={() => dispatch(fetchPatientPrescriptions())}>
                            <i className="fas fa-redo"></i> Try Again
                        </button>
                        <button 
                            className="retry-btn" 
                            onClick={() => navigate('/patient/form')}
                            style={{ backgroundColor: '#3498db' }}
                        >
                            <i className="fas fa-sign-in-alt"></i> Go to Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <header className="header">
                <Link to="/" className="logo"><span>M</span>edi<span>Q</span>uick</Link>
                <nav className="navbar">
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/faqs">FAQs</Link></li>
                        <li><Link to="/blog">Blog</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/patient/prescriptions">My Prescriptions</Link></li>
                        <li><button onClick={logout} style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit'}}>LogOut</button></li>
                        <li><Link to="/patient/profile">
                            <img src="https://static.thenounproject.com/png/638636-200.png" 
                                 alt="Profile Image" height="30px" width="30px" />
                        </Link></li>
                    </ul>
                </nav>
                <div className="fas fa-bars"></div>
            </header>

            <section className="prescriptions-container">
                <h1 className="heading">My Prescriptions</h1>
                <h3 className="title">Your medical prescriptions and treatment plans</h3>
                
                <div id="prescriptionsList">
                    {prescriptions.length === 0 ? (
                        <div className="no-prescriptions">
                            <i className="fas fa-file-medical"></i>
                            <h3>No Prescriptions Found</h3>
                            <p>You don't have any prescriptions yet. Your prescriptions will appear here after consultations with doctors.</p>
                            <p style={{ marginTop: '15px', fontSize: '0.9em' }}>
                                <Link to="/patient/book-doc-online" style={{ color: '#16a085', textDecoration: 'none', fontWeight: '600' }}>
                                    <i className="fas fa-video"></i> Book an online consultation to get your first prescription
                                </Link>
                            </p>
                        </div>
                    ) : (
                        <div className="prescriptions-list">
                            {prescriptions.map(prescription => {
                                const appointmentDate = new Date(prescription.appointmentDate).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric' 
                                });

                                return (
                                    <div key={prescription._id} className="prescription-card">
                                        <div className="prescription-header">
                                            <div className="doctor-info">
                                                <div className="doctor-name">
                                                    Dr. {prescription.doctorId?.name || 'Unknown Doctor'}
                                                </div>
                                                <div className="specialization">
                                                    {prescription.doctorId?.specialization || 'General Physician'}
                                                </div>
                                                {prescription.doctorId?.registrationNumber && (
                                                    <div style={{ fontSize: '0.85em', color: '#7f8c8d', marginTop: '5px' }}>
                                                        Reg. No: {prescription.doctorId.registrationNumber}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="prescription-date">
                                                <div className="date-time">
                                                    <i className="far fa-calendar"></i> {appointmentDate}
                                                </div>
                                                <div style={{ marginTop: '5px' }}>
                                                    <i className="far fa-clock"></i> {prescription.appointmentTime}
                                                </div>
                                            </div>
                                            <button 
                                                className="download-btn"
                                                onClick={() => handleDownload(prescription._id)}
                                            >
                                                <i className="fas fa-download"></i> Download PDF
                                            </button>
                                        </div>
                                        
                                        {/* Patient Information */}
                                        <div className="patient-info">
                                            <strong><i className="fas fa-user"></i> Patient Details:</strong>
                                            <div className="patient-details-grid">
                                                <div className="patient-detail-item">
                                                    <div className="patient-detail-label">Name</div>
                                                    <div className="patient-detail-value">{prescription.patientName}</div>
                                                </div>
                                                <div className="patient-detail-item">
                                                    <div className="patient-detail-label">Age</div>
                                                    <div className="patient-detail-value">{prescription.age} years</div>
                                                </div>
                                                <div className="patient-detail-item">
                                                    <div className="patient-detail-label">Gender</div>
                                                    <div className="patient-detail-value" style={{ textTransform: 'capitalize' }}>
                                                        {prescription.gender}
                                                    </div>
                                                </div>
                                                {prescription.weight && (
                                                    <div className="patient-detail-item">
                                                        <div className="patient-detail-label">Weight</div>
                                                        <div className="patient-detail-value">{prescription.weight} kg</div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Symptoms/Diagnosis */}
                                        {prescription.symptoms && (
                                            <div className="diagnosis">
                                                <strong><i className="fas fa-stethoscope"></i> Symptoms & Diagnosis:</strong><br />
                                                <div style={{ marginTop: '8px', lineHeight: '1.6' }}>
                                                    {prescription.symptoms}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Prescribed Medicines */}
                                        <div className="medicines-section">
                                            <h4><i className="fas fa-pills"></i> Prescribed Medicines</h4>
                                            {prescription.medicines && prescription.medicines.length > 0 ? (
                                                prescription.medicines.map((medicine, index) => (
                                                    <div key={index} className="medicine-item">
                                                        <div style={{ flex: 1 }}>
                                                            <div className="medicine-name">
                                                                {index + 1}. {medicine.medicineName}
                                                            </div>
                                                            <div className="medicine-details">
                                                                <span className="dosage">{medicine.dosage}</span>
                                                                <span className="medicine-detail-item">
                                                                    <strong>Frequency:</strong> {medicine.frequency}
                                                                </span>
                                                                <span className="medicine-detail-item">
                                                                    <strong>Duration:</strong> {medicine.duration}
                                                                </span>
                                                                {medicine.instructions && (
                                                                    <span className="medicine-detail-item">
                                                                        <strong>Instructions:</strong> {medicine.instructions}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div style={{ textAlign: 'center', padding: '20px', color: '#7f8c8d' }}>
                                                    <i className="fas fa-info-circle"></i> No medicines prescribed
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Additional Notes */}
                                        {prescription.additionalNotes && (
                                            <div className="instructions">
                                                <strong><i className="fas fa-info-circle"></i> Additional Notes & Instructions:</strong><br />
                                                <div style={{ marginTop: '8px', lineHeight: '1.6' }}>
                                                    {prescription.additionalNotes}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Prescription ID */}
                                        <div className="prescription-id">
                                            <i className="fas fa-fingerprint"></i> Prescription ID: {prescription._id}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Footer Section */}
            <section className="footer">
                <div className="box">
                    <h2 className="logo"><span>M</span>edi<span>Q</span>uick</h2>
                    <p>Your trusted healthcare partner, providing seamless access to online consultations, appointment bookings,
                        and medicine deliveries, ensuring a hassle-free medical experience.</p>
                </div>
                <div className="box">
                    <h2 className="logo"><span>S</span>hare</h2>
                    <a href="mailto:mediquick2025@gmail.com">Email</a>
                    <a href="https://www.facebook.com/share/1568c6qDuW/">Facebook</a>
                    <a href="https://www.instagram.com/mediquick2025?igsh=MXVqaDRkY2xvNGJsZg==">Instagram</a>
                    <a href="https://www.linkedin.com/in/medi-quick-437318355?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app">
                        LinkedIn
                    </a>
                </div>
                <div className="box">
                    <h2 className="logo"><span>L</span>inks</h2>
                    <Link to="/">Home</Link>
                    <Link to="/about">About Us</Link>
                    <Link to="/faqs">FAQ's</Link>
                    <Link to="/contact">Contact Us</Link>
                    <Link to="/blogs">Blog</Link>
                    <Link to="/privacy">Privacy Policy</Link>
                    <Link to="/terms">Terms & Conditions</Link>
                </div>
                <h1 className="credit">Created by <span>Team MediQuick</span> all rights reserved.</h1>
            </section>
        </div>
    );
};

export default PatientPrescriptions;