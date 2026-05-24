import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useEmployee } from '../../context/EmployeeContext';
import { getToken, removeToken } from '../../utils/authUtils';
import Header from '../common/Header';
import '../../assets/css/EmployeeProfile.css';

const BASE_URL = import.meta.env.VITE_API_URL;

const EmployeeProfile = () => {
  const { 
    employee, 
    loading, 
    error, 
    previousRegistrations, 
    pendingRegistrations, 
    refetch,
    logout
  } = useEmployee();
  
  const navigate = useNavigate();
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    // Profile data is handled by context
  }, []);

  const handleApprove = async (doctorId, doctorName) => {
    if (!window.confirm(`Are you sure you want to approve ${doctorName}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      
      const token = getToken('employee');
      const response = await fetch(`${BASE_URL}/employee/approve_doctor/${doctorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (response.status === 401) {
        removeToken('employee');
        navigate('/employee/form');
        return;
      }

      const contentType = response.headers.get('content-type');
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        throw new Error('Server returned an error. Please try again.');
      }

      if (response.ok) {
        alert(`Doctor ${doctorName} approved successfully!`);
        // Refresh the data to show updated lists
        refetch();
      } else {
        setActionError(data.error || data.message || 'Failed to approve doctor');
      }
    } catch (error) {
      console.error('Error approving doctor:', error);
      setActionError('Network error. Please check your connection and try again.');
      // Still refresh to see if it worked
      refetch();
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (doctorId, doctorName) => {
    const reason = prompt(`Enter reason for rejecting ${doctorName}:`);
    if (!reason) return;

    if (!window.confirm(`Are you sure you want to reject ${doctorName}?\nReason: ${reason}`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError('');
      
      const token = getToken('employee');
      const response = await fetch(`${BASE_URL}/employee/reject_doctor/${doctorId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      if (response.status === 401) {
        removeToken('employee');
        navigate('/employee/form');
        return;
      }

      if (response.ok) {
        alert(`Doctor ${doctorName} rejected successfully!`);
        // Refresh the data to show updated lists
        refetch();
      } else {
        const data = await response.json();
        setActionError(data.error || 'Failed to reject doctor');
      }
    } catch (error) {
      console.error('Error rejecting doctor:', error);
      setActionError('Network error. Please try again.');
      // Still refresh to see if it worked
      refetch();
    } finally {
      setActionLoading(false);
    }
  };

  const viewDocument = (documentPath) => {
    if (!documentPath) {
      alert('No document available');
      return;
    }
    
    // Construct the full URL
    const docUrl = documentPath.startsWith('http') 
      ? documentPath 
      : `${BASE_URL}/${documentPath.replace(/\\/g, '/')}`;
    
    // Open in new tab
    window.open(docUrl, '_blank');
  };

  const handleLogout = () => {
    navigate('/employee/form');
  };

  const closeProfile = () => {
    navigate('/employee/dashboard');
  };

  if (loading) {
    return (
      <div className="employee-profile-page">
        <Header userType="employee" employee={employee} onLogout={logout} />
        <div className="container">
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Loading profile data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-profile-page">
      <Header userType="employee" employee={employee} onLogout={logout} />
      
      <div className="container">
        <div className="close-btn" onClick={closeProfile}>
          <i className="fas fa-times"></i>
        </div>

        {(error || actionError) && (
          <div className="error-message">
            {error || actionError}
            {error && <button className="retry-btn" onClick={refetch}>Retry</button>}
          </div>
        )}

        {employee && (
          <div className="profile-content">
            <div className="profile-layout">
              {/* Left Column - Personal Details */}
              <div className="profile-left-column">
                <div className="profile-info">
                  <div className="profile-photo-container">
                    <img 
                      id="employee-photo"
                      src={employee.profilePhoto || '/images/default-employee.svg'} 
                      alt="Profile Photo" 
                      onError={(e) => {
                        e.target.src = '/images/default-employee.svg';
                      }}
                    />
                  </div>
                  <div className="profile-details">
                    <h2>Personal Details</h2>
                    <div className="detail-row">
                      <strong>Name:</strong>
                      <span>{employee.name}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Email:</strong>
                      <span>{employee.email}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Mobile:</strong>
                      <span>{employee.mobile}</span>
                    </div>
                    <div className="detail-row">
                      <strong>Address:</strong>
                      <span>{employee.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Buttons Only */}
              <div className="profile-right-column">
                <div className="action-buttons">
                  <Link to="/employee/dashboard" className="button dashboard-btn">
                    Go to Dashboard
                  </Link>
                  <Link to="/employee/edit-profile" className="button">
                    Edit Profile
                  </Link>
                </div>
              </div>
              {/* End Right Column */}
            </div>
            {/* End Profile Layout */}
          </div>
        )}
      </div>
    </div>
  );
};



export default EmployeeProfile;