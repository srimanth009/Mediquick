import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDoctor } from '../../context/DoctorContext';
import { getToken, removeToken } from '../../utils/authUtils';

const DoctorProfile = () => {
  const { doctor, loading: profileLoading, error: profileError, logout } = useDoctor();
  const navigate = useNavigate();
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [previousAppointments, setPreviousAppointments] = useState([]);
  const [loading, setLoading] = useState({
    upcoming: true,
    previous: true
  });
  const [errors, setErrors] = useState({});

  // Fetch appointments
  const fetchAppointments = async () => {
    try {
      const token = getToken('doctor');
      // Fetch upcoming appointments
      const API = import.meta.env.VITE_API_URL;
      const upcomingResponse = await fetch(`${API}/doctor/appointments/upcoming`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (upcomingResponse.status === 401) {
        removeToken('doctor');
        navigate('/doctor/form');
        return;
      }
      
      if (upcomingResponse.ok) {
        const appointments = await upcomingResponse.json();
        setUpcomingAppointments(appointments);
      } else {
        throw new Error('Failed to fetch upcoming appointments');
      }
      
      setLoading(prev => ({ ...prev, upcoming: false }));
      
    } catch (error) {
      console.error('Error fetching upcoming appointments:', error);
      setErrors(prev => ({ ...prev, upcoming: error.message }));
      setLoading(prev => ({ ...prev, upcoming: false }));
    }

    try {
      const token = getToken('doctor');
      // Fetch previous appointments
      const API = import.meta.env.VITE_API_URL;
      const previousResponse = await fetch(`${API}/doctor/appointments/previous`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (previousResponse.status === 401) {
        removeToken('doctor');
        navigate('/doctor/form');
        return;
      }
      
      if (previousResponse.ok) {
        const appointments = await previousResponse.json();
        setPreviousAppointments(appointments);
      } else {
        throw new Error('Failed to fetch previous appointments');
      }
      
      setLoading(prev => ({ ...prev, previous: false }));
      
    } catch (error) {
      console.error('Error fetching previous appointments:', error);
      setErrors(prev => ({ ...prev, previous: error.message }));
      setLoading(prev => ({ ...prev, previous: false }));
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAppointments();
  }, []);

  // Status color classes
  const getStatusClass = (status) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return 'status-pending';
    if (statusLower === 'confirmed') return 'status-confirmed';
    if (statusLower === 'completed') return 'status-completed';
    if (statusLower === 'cancelled') return 'status-cancelled';
    return '';
  };

  // Format appointment date
  const formatAppointmentDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div style={{
      padding: '20px',
      fontFamily: 'Roboto, sans-serif'
    }}>
      {/* Profile Content */}
      <h2 style={{
        fontSize: '24px',
        color: '#444d53',
        marginBottom: '20px',
        textAlign: 'center'
      }}>Doctor Profile</h2>
      
      {/* Doctor Profile Section */}
      <div id="doctor-profile">
          {profileLoading ? (
            <div style={{
              textAlign: 'center',
              fontSize: '18px',
              color: '#0188df',
              padding: '20px'
            }}>Loading doctor profile...</div>
          ) : profileError ? (
            <div style={{
              color: '#FF4500',
              fontSize: '16px',
              textAlign: 'center',
              padding: '10px'
            }}>
              Error: {profileError}. <Link 
                to="/doctor/form" 
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  background: '#444d53',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '5px',
                  marginLeft: '10px'
                }}
              >Go to Login</Link>
            </div>
          ) : doctor ? (
            <>
              <div style={{
                textAlign: 'center',
                marginBottom: '20px'
              }}>
                <img 
                  src={
                    doctor.profilePhoto 
                      ? doctor.profilePhoto.startsWith('http') 
                        ? doctor.profilePhoto 
                        : (() => {
                            const API = import.meta.env.VITE_API_URL;
                            return `${API}${doctor.profilePhoto.startsWith('/') ? '' : '/'}${doctor.profilePhoto}`;
                          })()
                      : 'https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png'
                  } 
                  alt="Profile" 
                  style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #0188df'
                  }}
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png';
                  }}
                />
              </div>
              <div style={{
                marginBottom: '20px',
                background: '#f8f9fa',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Name:</strong> {doctor.name || 'N/A'}</p>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Email:</strong> {doctor.email || 'N/A'}</p>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Mobile:</strong> {doctor.mobile || 'N/A'}</p>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Address:</strong> {doctor.address || 'N/A'}</p>
                {doctor.dateOfBirth && (
                  <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Date of Birth:</strong> {new Date(doctor.dateOfBirth).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                )}
                {doctor.gender && (
                  <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Gender:</strong> {doctor.gender.charAt(0).toUpperCase() + doctor.gender.slice(1)}</p>
                )}
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Specialization:</strong> {doctor.specialization || 'N/A'}</p>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>College:</strong> {doctor.college || 'N/A'}</p>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Year of Passing:</strong> {doctor.yearOfPassing || 'N/A'}</p>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Location:</strong> {doctor.location || 'N/A'}</p>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Online Status:</strong> {doctor.onlineStatus || 'N/A'}</p>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Consultation Fee:</strong> ₹{doctor.consultationFee || 'N/A'}</p>
                <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>Registration Number:</strong> {doctor.registrationNumber || 'N/A'}</p>
                {doctor.ssn && <p style={{fontSize: '16px', color: '#444d53', margin: '8px 0'}}><strong style={{color: '#0188df'}}>SSN:</strong> {doctor.ssn || 'N/A'}</p>}
              </div>
            </>
          ) : (
            <div style={{
              color: '#FF4500',
              fontSize: '16px',
              textAlign: 'center',
              padding: '10px'
            }}>Doctor data not available. Please try logging in again.</div>
          )}
      </div>

      {/* Upcoming Appointments Section */}
      <div style={{marginTop: '30px'}}>
        <h3 style={{
          fontSize: '20px',
          color: '#444d53',
          margin: '20px 0 10px 0'
        }}>Upcoming Appointments</h3>
          <div id="upcoming-appointments">
            {loading.upcoming ? (
              <div style={{
                textAlign: 'center',
                fontSize: '16px',
                color: '#0188df',
                padding: '15px'
              }}>Loading upcoming appointments...</div>
            ) : errors.upcoming ? (
              <div style={{
                color: '#FF4500',
                fontSize: '16px',
                textAlign: 'center',
                padding: '10px'
              }}>Error loading upcoming appointments</div>
            ) : upcomingAppointments.length === 0 ? (
              <p style={{fontSize: '16px', color: '#666', textAlign: 'center', padding: '15px'}}>No upcoming appointments found.</p>
            ) : (
              <ul style={{listStyleType: 'none', padding: 0}}>
                {upcomingAppointments.map(appointment => (
                  <li key={appointment._id} style={{
                    background: '#444d53',
                    color: 'white',
                    margin: '8px 0',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '15px',
                    border: '1px solid #0188df'
                  }}>
                    <div style={{
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}>
                      {appointment.patientId?.name || 'Unknown Patient'}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <span><strong>Date:</strong> {formatAppointmentDate(appointment.date)}</span>
                      <span><strong>Time:</strong> {appointment.time}</span>
                      <span><strong>Type:</strong> {appointment.type}</span>
                      <span style={{color: appointment.status === 'confirmed' ? '#32CD32' : appointment.status === 'pending' ? '#FFA500' : appointment.status === 'completed' ? '#1E90FF' : '#FF4500'}}>
                        <strong>Status:</strong> {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                    {appointment.feedback && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: 'rgba(1, 136, 223, 0.1)',
                        borderRadius: '4px',
                        borderLeft: '3px solid #0188df'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#0188df' }}>
                          💬 Patient Feedback:
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                          {appointment.feedback}
                        </div>
                      </div>
                    )}
                    {appointment.rating !== null && appointment.rating !== undefined && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#FFD700' }}>
                          ⭐ Rating: {appointment.rating}/10
                        </span>
                      </div>
                    )}
                    {appointment.doctorNotes?.text && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '4px',
                        borderLeft: '3px solid #10b981'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#10b981' }}>
                          📝 My Notes:
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {appointment.doctorNotes.text}
                        </div>
                      </div>
                    )}
                    {appointment.doctorNotes?.files && appointment.doctorNotes.files.length > 0 && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                          📎 {appointment.doctorNotes.files.length} file(s) attached
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>

      {/* Previous Appointments Section */}
      <div style={{marginTop: '30px'}}>
        <h3 style={{
          fontSize: '20px',
          color: '#444d53',
          margin: '20px 0 10px 0'
        }}>Previous Appointments</h3>
          <div id="previous-appointments">
            {loading.previous ? (
              <div style={{
                textAlign: 'center',
                fontSize: '16px',
                color: '#0188df',
                padding: '15px'
              }}>Loading previous appointments...</div>
            ) : errors.previous ? (
              <div style={{
                color: '#FF4500',
                fontSize: '16px',
                textAlign: 'center',
                padding: '10px'
              }}>Error loading previous appointments</div>
            ) : previousAppointments.length === 0 ? (
              <p style={{fontSize: '16px', color: '#666', textAlign: 'center', padding: '15px'}}>No previous appointments found.</p>
            ) : (
              <ul style={{listStyleType: 'none', padding: 0}}>
                {previousAppointments.map(appointment => (
                  <li key={appointment._id} style={{
                    background: '#444d53',
                    color: 'white',
                    margin: '8px 0',
                    padding: '15px',
                    borderRadius: '8px',
                    fontSize: '15px',
                    border: '1px solid #0188df'
                  }}>
                    <div style={{
                      fontWeight: 'bold',
                      marginBottom: '8px'
                    }}>
                      {appointment.patientId?.name || 'Unknown Patient'}
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <span><strong>Date:</strong> {formatAppointmentDate(appointment.date)}</span>
                      <span><strong>Time:</strong> {appointment.time}</span>
                      <span><strong>Type:</strong> {appointment.type}</span>
                      <span style={{color: appointment.status === 'confirmed' ? '#32CD32' : appointment.status === 'pending' ? '#FFA500' : appointment.status === 'completed' ? '#1E90FF' : '#FF4500'}}>
                        <strong>Status:</strong> {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                      </span>
                    </div>
                    {appointment.feedback && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: 'rgba(1, 136, 223, 0.1)',
                        borderRadius: '4px',
                        borderLeft: '3px solid #0188df'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#0188df' }}>
                          💬 Patient Feedback:
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: '1.5' }}>
                          {appointment.feedback}
                        </div>
                      </div>
                    )}
                    {appointment.rating !== null && appointment.rating !== undefined && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                        borderRadius: '4px',
                        display: 'inline-block'
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#FFD700' }}>
                          ⭐ Rating: {appointment.rating}/10
                        </span>
                      </div>
                    )}
                    {appointment.doctorNotes?.text && (
                      <div style={{
                        marginTop: '10px',
                        padding: '10px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '4px',
                        borderLeft: '3px solid #10b981'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#10b981' }}>
                          📝 My Notes:
                        </div>
                        <div style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                          {appointment.doctorNotes.text}
                        </div>
                      </div>
                    )}
                    {appointment.doctorNotes?.files && appointment.doctorNotes.files.length > 0 && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '4px'
                      }}>
                        <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                          📎 {appointment.doctorNotes.files.length} file(s) attached
                        </span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
        </div>
      </div>

      {/* Action Buttons */}
      {doctor && (
        <div style={{
          textAlign: 'center',
          margin: '30px 0'
        }}>
            <Link 
              to="/doctor/edit-profile" 
              style={{
                display: 'inline-block',
                padding: '12px 20px',
                background: '#444d53',
                color: 'white',
                fontSize: '16px',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                margin: '10px',
                border: '1px solid #0188df',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#0188df';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#444d53';
                e.target.style.color = 'white';
              }}
            >Edit Profile</Link>
            <Link 
              to="/doctor/dashboard" 
              style={{
                display: 'inline-block',
                padding: '12px 20px',
                background: '#444d53',
                color: 'white',
                fontSize: '16px',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                margin: '10px',
                border: '1px solid #0188df',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#0188df';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#444d53';
                e.target.style.color = 'white';
              }}
            >Go to Dashboard</Link>
            <button 
              onClick={logout}
              style={{
                display: 'inline-block',
                padding: '12px 20px',
                background: '#d9534f',
                color: 'white',
                fontSize: '16px',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                margin: '10px',
                border: '1px solid #c9302c'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#c9302c';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#d9534f';
              }}
            >Logout</button>
        </div>
      )}
    </div>
  );
};

export default DoctorProfile;