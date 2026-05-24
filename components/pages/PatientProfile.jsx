import '../../assets/css/patient_profile.css';
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { usePatient } from '../../context/PatientContext';
import { getToken, removeToken } from '../../utils/authUtils';
import {
  fetchPatientAppointments,
  cancelAppointment
} from '../../store/slices/appointmentSlice';

const PatientProfile = () => {
  const { patient, loading: profileLoading, error: profileError, refetch: refetchPatient, logout } = usePatient();
  const dispatch = useDispatch();
  
  const getProfileImageUrl = () => {
    if (!patient?.profilePhoto) return '/images/default-patient.svg';
    const photo = patient.profilePhoto;
    if (/^(https?:|data:|blob:)/i.test(photo)) return photo;
    const API = import.meta.env.VITE_API_URL;
    if (photo.startsWith('/')) return `${API}${photo}`;
    return `${API}/${photo}`;
  };
  
  // Redux state
  const {
    patientAppointments,
    patientAppointmentsLoading: loading,
    patientAppointmentsError: error
  } = useSelector((state) => state.appointments);

  const previousAppointments = patientAppointments.previous;
  const upcomingAppointments = patientAppointments.upcoming;
  const [chatModal, setChatModal] = useState({
    isOpen: false,
    appointmentId: null,
    messages: []
  });
  
  const [feedbackModal, setFeedbackModal] = useState({
    isOpen: false,
    appointmentId: null,
    feedback: '',
    rating: 0,
    existingFeedback: null,
    existingRating: null
  });
  
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatMessagesRef = useRef(null);
  const navigate = useNavigate();

  // Cancel appointment
  const handleCancelAppointment = async (appointmentId) => {
    const appointment = upcomingAppointments.find(appt => appt.id === appointmentId);
    
    if (appointment) {
      const status = appointment.status.toLowerCase();
      
      if (status === 'completed') {
        alert('Cannot cancel a completed appointment');
        return;
      }
      
      if (status === 'cancelled') {
        alert('This appointment is already cancelled');
        return;
      }
    }

    if (confirm('Are you sure you want to cancel this appointment?')) {
      try {
        await dispatch(cancelAppointment(appointmentId)).unwrap();
        alert('Appointment cancelled successfully');
        // Refresh appointments
        dispatch(fetchPatientAppointments('upcoming'));
        dispatch(fetchPatientAppointments('previous'));
      } catch (error) {
        console.error('Error:', error);
        alert(error || 'An error occurred while cancelling the appointment');
      }
    }
  };

  // Chat functionality
  const openChat = (appointmentId) => {
    setChatModal({
      isOpen: true,
      appointmentId,
      messages: []
    });
    loadMessages(appointmentId);
  };

  const closeChat = () => {
    setChatModal({
      isOpen: false,
      appointmentId: null,
      messages: []
    });
  };

  const loadMessages = async (appointmentId) => {
    try {
      const token = getToken('patient');
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/chat/${appointmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 401) {
        removeToken('patient');
        navigate('/patient/form');
        return;
      }
      
      const data = await response.json();
      
      if (data.messages) {
        setChatModal(prev => ({
          ...prev,
          messages: data.messages
        }));
        
        // Scroll to bottom of chat
        setTimeout(() => {
          if (chatMessagesRef.current) {
            chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
          }
        }, 100);
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const sendMessage = async () => {
    if (!messageInputRef.current?.value.trim() || !chatModal.appointmentId) return;
    
    try {
      const token = getToken('patient');
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          appointmentId: chatModal.appointmentId,
          message: messageInputRef.current.value.trim(),
          senderType: 'patient'
        })
      });
      
      if (response.status === 401) {
        removeToken('patient');
        navigate('/patient/form');
        return;
      }
      
      if (response.ok) {
        messageInputRef.current.value = '';
        loadMessages(chatModal.appointmentId);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  const sendFile = async () => {
    const file = fileInputRef.current?.files[0];
    if (!file || !chatModal.appointmentId) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('appointmentId', chatModal.appointmentId);
    formData.append('senderType', 'patient');

    try {
      const token = getToken('patient');
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/chat/send-file`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        removeToken('patient');
        navigate('/patient/form');
        return;
      }

      if (response.ok) {
        fileInputRef.current.value = '';
        loadMessages(chatModal.appointmentId);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send file');
      }
    } catch (error) {
      console.error('Error sending file:', error);
      alert('Failed to send file');
    }
  };

  const handleFileInputChange = () => {
    if (fileInputRef.current?.files.length > 0) {
      sendFile();
    }
  };

  const handleMessageKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  // Feedback functionality
  const openFeedbackModal = (appointment) => {
    setFeedbackModal({
      isOpen: true,
      appointmentId: appointment.id,
      feedback: appointment.feedback || '',
      rating: appointment.rating || 0,
      existingFeedback: appointment.feedback,
      existingRating: appointment.rating
    });
  };

  const closeFeedbackModal = () => {
    setFeedbackModal({
      isOpen: false,
      appointmentId: null,
      feedback: '',
      rating: 0,
      existingFeedback: null,
      existingRating: null
    });
  };

  const submitFeedback = async () => {
    if (!feedbackModal.appointmentId) return;
    
    if (!feedbackModal.feedback.trim() && feedbackModal.rating === 0) {
      alert('Please provide feedback or rating');
      return;
    }

    try {
      const token = getToken('patient');
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/appointment/${feedbackModal.appointmentId}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          feedback: feedbackModal.feedback.trim() || null,
          rating: feedbackModal.rating || null
        })
      });

      if (response.status === 401) {
        removeToken('patient');
        navigate('/patient/form');
        return;
      }

      if (response.ok) {
        alert('Feedback submitted successfully!');
        closeFeedbackModal();
        // Refresh appointments to show updated feedback
        dispatch(fetchPatientAppointments('previous'));
      } else {
        const error = await response.json();
        alert(error.details || error.error || 'Failed to submit feedback');
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      alert('An error occurred while submitting feedback');
    }
  };

  // Close profile and redirect to dashboard
  const closeProfile = () => {
    navigate('/patient/dashboard');
  };

  // Load data on component mount
  useEffect(() => {
    dispatch(fetchPatientAppointments('previous'));
    dispatch(fetchPatientAppointments('upcoming'));
  }, [dispatch]);

  // Poll for new messages when chat is open
  useEffect(() => {
    let interval;
    if (chatModal.isOpen && chatModal.appointmentId) {
      interval = setInterval(() => {
        loadMessages(chatModal.appointmentId);
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [chatModal.isOpen, chatModal.appointmentId]);

  // Status color classes
  const getStatusClass = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'completed') return 'status-completed';
    if (statusLower === 'cancelled') return 'status-cancelled';
    if (statusLower === 'confirmed') return 'status-confirmed';
    if (statusLower === 'pending') return 'status-pending';
    return '';
  };

  return (
    <div className="patient-profile-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

        :root {
          --blue: #0188df;
          --black: #444d53;
          --white: #fff;
        }

        * {
          font-family: "Roboto", sans-serif;
          margin: 0;
          padding: 0;
          text-decoration: none;
          outline: none;
          box-sizing: border-box;
        }

        .patient-profile-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: linear-gradient(to bottom, #f4f8fb, #eaf3fa);
        }

        header {
          width: 96%;
          background: var(--white);
          position: fixed;
          top: 2rem;
          left: 50%;
          transform: translate(-50%);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 2rem;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        header a {
          color: var(--black);
          transition: color 0.2s ease;
        }

        header a:hover {
          color: var(--blue);
        }

        header .logo {
          font-size: 3rem;
          font-weight: bold;
        }

        header .logo span {
          color: var(--blue);
        }

        header .navbar ul {
          display: flex;
          align-items: center;
          justify-content: space-between;
          list-style: none;
        }

        header .navbar ul li {
          margin: 0 1rem;
        }

        header .navbar ul li a {
          font-size: 1.6rem;
          color: var(--black);
          padding: 0.5rem 1rem;
          border-radius: 4px;
          transition: color 0.2s ease, background-color 0.2s ease;
        }

        header .navbar ul li a:hover {
          color: var(--blue);
          background-color: rgba(1, 136, 223, 0.1);
        }

        .patient-profile {
          flex: 1;
          padding: 36px;
          background-color: white;
          margin: 110px 20px 30px 20px;
          border-radius: 20px;
          box-shadow: 0 12px 40px rgba(0,0,0,0.07);
          position: relative;
        }

        .profile-container {
          max-width: 860px;
          margin: auto;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 30px;
          margin-bottom: 28px;
          padding-bottom: 24px;
          border-bottom: 1px solid #e8eff6;
          flex-wrap: wrap;
        }

        .profile-picture img {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          object-fit: cover;
          border: 4px solid #eaf3fa;
          box-shadow: 0 4px 16px rgba(1,136,223,0.15);
          flex-shrink: 0;
        }

        .profile-info {
          flex: 1;
        }

        .profile-info h1 {
          margin: 0 0 4px 0;
          font-size: 2rem;
          color: #1a2940;
          font-weight: 700;
        }

        .profile-info .profile-email {
          margin: 0 0 14px 0;
          color: #6b7a8d;
          font-size: 1.4rem;
        }

        .profile-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .info-box {
          background: #f4f8fb;
          padding: 16px 20px;
          border-radius: 14px;
          border: 1px solid rgba(1,136,223,0.08);
        }

        .info-box-label {
          font-size: 1.1rem;
          color: #6b7a8d;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .info-box-value {
          font-size: 1.4rem;
          color: #1a2940;
          font-weight: 600;
        }

        .appointment-history,
        .future-appointments {
          margin-top: 28px;
          background-color: #fff;
        }

        .appointment-history h2,
        .future-appointments h2 {
          margin-bottom: 16px;
          color: #1a2940;
          font-size: 1.6rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e8eff6;
        }

        .appointment-list {
          list-style: none;
          padding: 0;
        }

        .appointment-list li {
          background: #fff;
          padding: 18px 22px;
          margin: 12px 0;
          border-radius: 16px;
          font-size: 1.4rem;
          border: 1px solid #e8eff6;
          border-left: 4px solid #1E88E5;
          box-shadow: 0 4px 16px rgba(0,0,0,0.05);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .appointment-list li:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 28px rgba(0,0,0,0.09);
        }

        .close-btn {
          position: absolute;
          top: 15px;
          left: 15px;
          font-size: 24px;
          font-weight: bold;
          cursor: pointer;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          padding: 8px 12px;
          transition: background 0.3s ease, color 0.3s ease;
          z-index: 10;
        }

        .close-btn:hover {
          background: rgba(0, 0, 0, 0.3);
          color: white;
        }

        .button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #1E88E5, #00BFA6);
          color: white;
          font-size: 1.4rem;
          border-radius: 30px;
          cursor: pointer;
          margin: 20px auto 0;
          border: none;
          padding: 10px 28px;
          font-weight: 600;
          box-shadow: 0 6px 20px rgba(30,136,229,0.22);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
          display: block;
        }

        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 28px rgba(30,136,229,0.32);
        }

        /* Status badges */
        .status-completed {
          display: inline-block;
          background: #e6f7ed;
          color: #1a7a46;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 1.2rem;
        }
        .status-cancelled {
          display: inline-block;
          background: #fde8e8;
          color: #c53030;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 1.2rem;
        }
        .status-confirmed {
          display: inline-block;
          background: #e3f2fd;
          color: #1565C0;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 1.2rem;
        }
        .status-pending {
          display: inline-block;
          background: #fff4db;
          color: #b7791f;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 1.2rem;
        }

        /* Action buttons */
        .cancel-btn {
          background: #fde8e8;
          color: #c53030;
          border: 1px solid rgba(197,48,48,0.2);
          padding: 7px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 1.3rem;
          margin-top: 10px;
          margin-right: 8px;
          font-weight: 600;
          transition: background 0.2s ease, transform 0.2s ease;
        }
        .cancel-btn:hover {
          background: #fcc;
          transform: translateY(-1px);
        }

        .chat-btn {
          background: linear-gradient(135deg, #1E88E5, #00BFA6);
          color: white;
          border: none;
          padding: 7px 16px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 1.3rem;
          margin-top: 10px;
          margin-right: 8px;
          font-weight: 600;
          box-shadow: 0 4px 12px rgba(30,136,229,0.2);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .chat-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(30,136,229,0.3);
        }

        /* Modal styles */
        .modal {
          display: flex;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0,0,0,0.4);
          align-items: center;
          justify-content: center;
        }

        .modal-content {
          background-color: #fefefe;
          padding: 20px;
          border: 1px solid #888;
          width: 90%;
          max-width: 600px;
          border-radius: 8px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .modal-close {
          color: #aaa;
          float: right;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
          align-self: flex-end;
        }

        .modal-close:hover {
          color: black;
        }

        .chat-messages {
          height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          padding: 10px;
          margin: 10px 0;
          border-radius: 4px;
          flex: 1;
        }

        .chat-input {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .chat-input input {
          flex: 1;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1.4rem;
        }

        .chat-input button {
          padding: 8px 16px;
          background-color: var(--blue);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.4rem;
        }

        .message {
          margin: 5px 0;
          padding: 8px 12px;
          border-radius: 8px;
          max-width: 80%;
          font-size: 1.4rem;
        }

        .message.sent {
          background-color: var(--blue);
          color: white;
          margin-left: auto;
        }

        .message.received {
          background-color: #f0f0f0;
          margin-right: auto;
          color: #333;
        }

        .loader {
          border: 4px solid #f3f3f3;
          border-top: 4px solid var(--blue);
          border-radius: 50%;
          width: 30px;
          height: 30px;
          animation: spin 1s linear infinite;
          margin: 20px auto;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .error-message {
          color: red;
          text-align: center;
          margin: 20px 0;
          font-size: 1.4rem;
        }

        .retry-btn {
          background-color: var(--blue);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin: 10px auto;
          display: block;
          font-size: 1.4rem;
        }

        @media (max-width: 768px) {
          header {
            width: 100%;
            top: 0;
            padding: 1rem;
          }

          header .navbar ul {
            flex-direction: column;
            position: fixed;
            top: -100rem;
            left: 0;
            width: 100%;
            background: var(--white);
            opacity: 0;
            padding: 2rem 0;
          }

          header .navbar ul li {
            margin: 1rem 0;
            width: 100%;
            text-align: center;
          }

          header .navbar ul li a {
            font-size: 2rem;
            display: block;
            padding: 1rem;
          }

          .patient-profile {
            margin: 80px 10px 10px 10px;
            padding: 20px 18px;
          }

          .profile-header {
            flex-direction: column !important;
            text-align: center;
          }

          .profile-info {
            text-align: center !important;
            align-items: center !important;
          }

          .profile-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <header>
        <Link to="/" className="logo">
          <span>M</span>edi<span>Q</span>uick
        </Link>
        <nav className="navbar">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/faqs">FAQs</Link></li>
            <li><Link to="/blogs">Blog</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
            <li><button onClick={logout} style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit'}}>LogOut</button></li>
          </ul>
        </nav>
      </header>

      {/* Patient Profile Section */}
      <section className="patient-profile">
        {/* Close Button */}
        <div className="close-btn" onClick={closeProfile}>
          <i className="fas fa-times"></i>
        </div>

        <div className="profile-container">
          <div className="profile-header">
            <div className="profile-picture">
              <img 
                src={getProfileImageUrl()} 
                alt="Patient Profile" 
                onError={(e) => {
                  e.target.src = '/images/default-patient.svg';
                }}
              />
            </div>
            <div className="profile-info">
              {profileLoading ? (
                <div className="loader"></div>
              ) : profileError ? (
                <div className="error-message">
                  <p>Error loading profile: {profileError}</p>
                  <button className="retry-btn" onClick={refetchPatient}>Retry</button>
                </div>
              ) : patient ? (
                <>
                  <h1 id="patientName">{patient.name}</h1>
                  <p className="profile-email" id="patientEmail">{patient.email}</p>
                </>
              ) : (
                <p>No profile data available.</p>
              )}
            </div>
          </div>

          {/* Info grid */}
          {patient && !profileLoading && !profileError && (
            <div className="profile-grid">
              {patient.mobile && (
                <div className="info-box">
                  <div className="info-box-label">Mobile</div>
                  <div className="info-box-value">{patient.mobile}</div>
                </div>
              )}
              {patient.address && (
                <div className="info-box">
                  <div className="info-box-label">Address</div>
                  <div className="info-box-value">{patient.address}</div>
                </div>
              )}
              {patient.dateOfBirth && (
                <div className="info-box">
                  <div className="info-box-label">Date of Birth</div>
                  <div className="info-box-value">
                    {new Date(patient.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                </div>
              )}
              {patient.gender && (
                <div className="info-box">
                  <div className="info-box-label">Gender</div>
                  <div className="info-box-value">{patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}</div>
                </div>
              )}
            </div>
          )}

          {/* Previous Appointments */}
          <div className="appointment-history">
            <h2><i className="fas fa-history"></i> Previous Appointments</h2>
            <div id="previousAppointments">
              {loading ? (
                <div className="loader"></div>
              ) : error ? (
                <div className="error-message">
                  <p>Failed to load previous appointments: {error}</p>
                  <button className="retry-btn" onClick={() => dispatch(fetchPatientAppointments('previous'))}>
                    Retry
                  </button>
                </div>
              ) : previousAppointments.length === 0 ? (
                <p>No previous appointments found.</p>
              ) : (
                <ul className="appointment-list">
                  {previousAppointments.map(appointment => (
                    <li key={appointment.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '1.5rem', color: '#1a2940' }}>Dr. {appointment.doctorName} <span style={{ color: '#6b7a8d', fontWeight: 400, fontSize: '1.3rem' }}>({appointment.specialization})</span></strong>
                        <span className={getStatusClass(appointment.status)}>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                      </div>
                      <div style={{ color: '#6b7a8d', fontSize: '1.35rem', lineHeight: '1.8' }}>
                        <span><i className="far fa-calendar" style={{ marginRight: '5px' }}></i>{appointment.date} at {appointment.time}</span><br />
                        <span><i className="fas fa-tag" style={{ marginRight: '5px' }}></i>Type: <strong style={{ color: '#1a2940' }}>{appointment.type}</strong></span>
                      </div>
                      {appointment.notes && <div style={{ marginTop: '6px', color: '#6b7a8d', fontSize: '1.3rem' }}><strong>Notes:</strong> {appointment.notes}</div>}
                      {appointment.feedback && <div style={{ marginTop: '4px', color: '#6b7a8d', fontSize: '1.3rem' }}><strong>Feedback:</strong> {appointment.feedback}</div>}
                      {appointment.rating !== null && appointment.rating !== undefined && (
                        <div style={{ marginTop: '4px', fontSize: '1.3rem', color: '#6b7a8d' }}>⭐ Rating: <strong>{appointment.rating}/10</strong></div>
                      )}
                      {appointment.status.toLowerCase() === 'completed' && (
                        <div style={{ marginTop: '10px' }}>
                          <button 
                            onClick={() => openFeedbackModal(appointment)} 
                            className="chat-btn"
                          >
                            {appointment.feedback || appointment.rating ? '✏️ Edit Feedback' : '⭐ Give Feedback'}
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Upcoming Appointments */}
          <div className="future-appointments">
            <h2><i className="fas fa-calendar-check"></i> Upcoming Appointments</h2>
            <div id="upcomingAppointments">
              {loading ? (
                <div className="loader"></div>
              ) : error ? (
                <div className="error-message">
                  <p>Failed to load upcoming appointments: {error}</p>
                  <button className="retry-btn" onClick={() => dispatch(fetchPatientAppointments('upcoming'))}>
                    Retry
                  </button>
                </div>
              ) : upcomingAppointments.length === 0 ? (
                <p>No upcoming appointments found.</p>
              ) : (
                <ul className="appointment-list">
                  {upcomingAppointments.map(appointment => (
                    <li key={appointment.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                        <strong style={{ fontSize: '1.5rem', color: '#1a2940' }}>Dr. {appointment.doctorName} <span style={{ color: '#6b7a8d', fontWeight: 400, fontSize: '1.3rem' }}>({appointment.specialization})</span></strong>
                        <span className={getStatusClass(appointment.status)}>{appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}</span>
                      </div>
                      <div style={{ color: '#6b7a8d', fontSize: '1.35rem', lineHeight: '1.8' }}>
                        <span><i className="far fa-calendar" style={{ marginRight: '5px' }}></i>{appointment.date} at {appointment.time}</span><br />
                        <span><i className="fas fa-tag" style={{ marginRight: '5px' }}></i>Type: <strong style={{ color: '#1a2940' }}>{appointment.type}</strong></span>
                      </div>
                      {appointment.notes && <div style={{ marginTop: '6px', color: '#6b7a8d', fontSize: '1.3rem' }}><strong>Notes:</strong> {appointment.notes}</div>}
                      {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                        <div style={{ marginTop: '10px' }}>
                          {appointment.status === 'confirmed' && (
                            <button 
                              onClick={() => openChat(appointment.id)} 
                              className="chat-btn"
                            >
                              <i className="fas fa-comment-dots"></i> Chat with Doctor
                            </button>
                          )}
                          <button 
                            onClick={() => handleCancelAppointment(appointment.id)} 
                            className="cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <Link to="/patient/edit-profile">
            <button className="button">Edit Profile</button>
          </Link>
        </div>
      </section>

      {/* Chat Modal */}
      {chatModal.isOpen && (
        <div className="modal">
          <div className="modal-content">
            <span className="modal-close" onClick={closeChat}>&times;</span>
            <h2>Chat with Doctor</h2>
            <div 
              ref={chatMessagesRef}
              className="chat-messages"
            >
              {chatModal.messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`message ${msg.senderType === 'patient' ? 'sent' : 'received'}`}
                >
                  {msg.isFile ? (
                    <a 
                      href={`${import.meta.env.VITE_API_URL}/chat/download/${msg.fileName}`}
                      style={{ color: 'inherit', textDecoration: 'none' }}
                    >
                      📎 {msg.fileName} (Download)
                    </a>
                  ) : (
                    msg.message
                  )}
                </div>
              ))}
            </div>
            <div className="chat-input">
              <input 
                ref={messageInputRef}
                type="text" 
                placeholder="Type your message..." 
                onKeyPress={handleMessageKeyPress}
              />
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif" 
                style={{ display: 'none' }}
                onChange={handleFileInputChange}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                title="Upload File"
              >
                📎
              </button>
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {feedbackModal.isOpen && (
        <div className="modal">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <span className="modal-close" onClick={closeFeedbackModal}>&times;</span>
            <h2>📝 Appointment Feedback</h2>
            <div style={{ padding: '20px 0' }}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Rating (0-10):
                </label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input 
                    type="range"
                    min="0"
                    max="10"
                    value={feedbackModal.rating}
                    onChange={(e) => setFeedbackModal(prev => ({ ...prev, rating: parseInt(e.target.value) }))}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '20px', fontWeight: 'bold', minWidth: '60px' }}>
                    {feedbackModal.rating}/10 ⭐
                  </span>
                </div>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Feedback (Optional):
                </label>
                <textarea
                  value={feedbackModal.feedback}
                  onChange={(e) => setFeedbackModal(prev => ({ ...prev, feedback: e.target.value }))}
                  placeholder="Share your experience with this appointment..."
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={closeFeedbackModal}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={submitFeedback}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientProfile;