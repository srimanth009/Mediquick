import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import MedicineHeader from '../common/MedicineHeader';
import { usePatient } from '../../context/PatientContext';
import { getToken, removeToken } from '../../utils/authUtils';

// Yup validation schema
const patientEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(500, 'Name must not exceed 500 characters')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods')
    .trim(),
  email: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address')
    .trim(),
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits')
    .trim(),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters')
    .trim(),
  dateOfBirth: yup
    .date()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === '' ? null : value;
    })
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Patient must be at least 1 year old', function(value) {
      if (!value) return true; // Allow empty
      const age = Math.floor((new Date() - new Date(value)) / 31557600000); // ms in a year
      return age >= 1;
    }),
  gender: yup
    .string()
    .nullable()
    .oneOf(['male', 'female', 'other', null], 'Please select a valid gender')
});

const PatientEditProfile = () => {
  const { patient, loading: patientLoading, error: patientError, refetch, logout } = usePatient();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('/images/default-patient.svg');
  const [photoError, setPhotoError] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Initialize react-hook-form with yup resolver
  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm({
    resolver: yupResolver(patientEditSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      address: '',
      dateOfBirth: '',
      gender: ''
    }
  });

  useEffect(() => {
    if (patient) {
      // Update form values with patient data from context
      setValue('name', patient.name || '');
      setValue('email', patient.email || '');
      setValue('mobile', patient.mobile || '');
      setValue('address', patient.address || '');
      // Format date for input field (YYYY-MM-DD)
      if (patient.dateOfBirth) {
        const date = new Date(patient.dateOfBirth);
        const formatted = date.toISOString().split('T')[0];
        setValue('dateOfBirth', formatted);
      } else {
        setValue('dateOfBirth', '');
      }
      setValue('gender', patient.gender || '');
      
      // Format profile photo URL
      if (patient.profilePhoto) {
        const photo = patient.profilePhoto;
        if (/^(https?:|data:|blob:)/i.test(photo)) {
          setProfilePhoto(photo);
        } else if (photo.startsWith('/')) {
          const API = import.meta.env.VITE_API_URL;
          setProfilePhoto(`${API}${photo}`);
        } else {
          const API = import.meta.env.VITE_API_URL;
          setProfilePhoto(`${API}/${photo}`);
        }
      } else {
        setProfilePhoto('/images/default-patient.svg');
      }
    }
  }, [patient, setValue]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfilePhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePhoto = async () => {
    if (!confirm('Are you sure you want to remove your profile photo?')) return;
    
    try {
      const token = getToken('patient');
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/patient/profile-photo/remove`, {
        method: 'POST',
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
      
      if (data.success) {
        setProfilePhoto('/images/default-patient.svg');
        setSuccess('Profile photo removed successfully');
        refetch(); // Refetch data in context
      } else {
        setPhotoError(data.error || 'Failed to remove photo');
      }
    } catch (error) {
      console.error('Error removing profile photo:', error);
      setPhotoError('Failed to remove photo');
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setSuccess('');
    setPhotoError('');

    try {
      const submissionData = new FormData();
      submissionData.append('name', data.name);
      submissionData.append('email', data.email);
      submissionData.append('mobile', data.mobile);
      submissionData.append('address', data.address);
      
      // Add optional fields if provided
      if (data.dateOfBirth) {
        submissionData.append('dateOfBirth', data.dateOfBirth);
      }
      if (data.gender) {
        submissionData.append('gender', data.gender);
      }

      // Add profile photo if a new one was selected
      if (fileInputRef.current?.files[0]) {
        submissionData.append('profilePhoto', fileInputRef.current.files[0]);
      }

      const token = getToken('patient');
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/patient/update-profile`, {
        method: 'POST',
        body: submissionData,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        removeToken('patient');
        navigate('/patient/form');
        return;
      }

      const result = await response.json();

      if (response.ok) {
        setSuccess(result.message || 'Profile updated successfully');
        refetch(); // Refetch data in context
        // Redirect after successful update
        setTimeout(() => {
          navigate('/patient/profile');
        }, 2000);
      } else {
        setPhotoError(result.error || 'Error updating profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setPhotoError('An error occurred while updating the profile');
    } finally {
      setLoading(false);
    }
  };

  const closeProfile = () => {
    navigate('/patient/profile');
  };

  if (patientLoading) {
    return <div>Loading...</div>;
  }

  if (patientError) {
    return <div>Error: {patientError}</div>;
  }

  return (
    <div className="patient-edit-profile-container">
      <MedicineHeader />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap');

        :root {
          --primary-blue: #1E88E5;
          --primary-teal: #00BFA6;
          --dark-blue: #1565C0;
          --light-blue: #E3F2FD;
          --background: #F4F8FB;
          --black: #2C3E50;
          --dark-gray: #34495E;
          --gray: #5D6D7E;
          --light-gray: #ECF0F1;
          --white: #FFFFFF;
          --border: #D5DBDB;
          --success: #00BFA6;
          --danger: #E74C3C;
        }

        * {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          margin: 0;
          padding: 0;
          text-decoration: none;
          outline: none;
          box-sizing: border-box;
        }

        html {
          font-size: 62.5%;
        }

        .patient-edit-profile-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
          background: linear-gradient(to bottom right, #F4F8FB, #EAF3FA);
          padding-top: 7rem;
        }

        .patient-profile {
          flex: 1;
          max-width: 850px;
          margin: 60px auto;
          background: var(--white);
          padding: 50px;
          border-radius: 25px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.06);
          position: relative;
          animation: fadeUp 0.6s ease forwards;
        }

        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(25px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--primary-blue);
          font-weight: 500;
          font-size: 1.4rem;
          text-decoration: none;
          margin-bottom: 30px;
          transition: all 0.2s ease;
        }

        .back-link:hover {
          gap: 12px;
          color: var(--dark-blue);
        }

        .back-link i {
          font-size: 1.6rem;
        }

        .profile-form {
          width: 100%;
        }

        .profile-form-title {
          font-size: 2.8rem;
          font-weight: 700;
          color: var(--black);
          margin-bottom: 10px;
          text-align: center;
        }

        .profile-form-subtitle {
          font-size: 1.5rem;
          color: var(--gray);
          text-align: center;
          margin-bottom: 40px;
        }

        .profile-form input,
        .profile-form select {
          width: 100%;
          padding: 14px 18px;
          border-radius: 14px;
          border: 2px solid #EAF3FA;
          background: #F9FCFF;
          font-size: 1.5rem;
          transition: all 0.3s ease;
          color: var(--black);
        }

        .profile-form input:focus,
        .profile-form select:focus {
          border-color: var(--primary-blue);
          background: var(--white);
          box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.1);
          outline: none;
        }

        .profile-form input:focus,
        .profile-form select:focus {
          border-color: var(--primary-blue);
          background: var(--white);
          box-shadow: 0 0 0 4px rgba(30, 136, 229, 0.1);
          outline: none;
        }

        .profile-form select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%235D6D7E' d='M10.293 3.293L6 7.586 1.707 3.293A1 1 0 00.293 4.707l5 5a1 1 0 001.414 0l5-5a1 1 0 10-1.414-1.414z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 18px center;
          padding-right: 45px;
        }

        .error-input {
          border-color: var(--danger) !important;
          background: #FFEBEE !important;
        }

        .error-message {
          color: var(--danger);
          font-size: 1.3rem;
          margin: 6px 0 0 4px;
          font-weight: 500;
        }

        .success-message {
          color: var(--success);
          font-size: 1.5rem;
          margin: 0 0 25px 0;
          text-align: center;
          background: #E8F5E9;
          padding: 14px;
          border-radius: 12px;
          border: 1px solid var(--success);
        }

        /* Avatar Section */
        .avatar-section {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 40px;
          border-bottom: 2px solid #EAF3FA;
        }

        .profile-avatar {
          width: 140px;
          height: 140px;
          border-radius: 50%;
          border: 5px solid #EAF3FA;
          object-fit: cover;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
          margin: 0 auto 20px;
          display: block;
        }

        .avatar-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
          align-items: center;
          flex-wrap: wrap;
        }

        .file-input-wrapper {
          position: relative;
          overflow: hidden;
          display: inline-block;
        }

        .file-input-wrapper input[type=file] {
          position: absolute;
          left: -9999px;
        }

        .custom-file-upload {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 20px;
          background: #F4F8FB;
          cursor: pointer;
          font-weight: 500;
          font-size: 1.4rem;
          color: var(--black);
          transition: all 0.3s ease;
          border: 2px solid transparent;
        }

        .custom-file-upload:hover {
          background: var(--light-blue);
          border-color: var(--primary-blue);
          color: var(--primary-blue);
        }

        .custom-file-upload i {
          font-size: 1.5rem;
        }

        .btn-remove-photo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 22px;
          border-radius: 20px;
          background: #FFEBEE;
          color: var(--danger);
          border: 2px solid transparent;
          cursor: pointer;
          font-weight: 500;
          font-size: 1.4rem;
          transition: all 0.3s ease;
        }

        .btn-remove-photo:hover {
          background: var(--danger);
          color: var(--white);
          border-color: var(--danger);
        }

        .btn-remove-photo i {
          font-size: 1.5rem;
        }

        /* Form Grid */
        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 25px;
          margin-bottom: 30px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-label {
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--black);
          margin-bottom: 8px;
        }

        /* Button Styles */
        .form-actions {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px solid #EAF3FA;
        }

        .btn-primary {
          background: linear-gradient(135deg, var(--primary-blue), var(--primary-teal));
          color: var(--white);
          border: none;
          border-radius: 30px;
          padding: 14px 35px;
          font-weight: 600;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 8px 20px rgba(30, 136, 229, 0.25);
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(30, 136, 229, 0.35);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #F4F8FB;
          color: var(--primary-blue);
          border: 2px solid #F4F8FB;
          border-radius: 30px;
          padding: 14px 35px;
          font-weight: 600;
          font-size: 1.5rem;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: var(--light-blue);
          border-color: var(--primary-blue);
        }

        .btn-secondary:hover {
          background: var(--light-blue);
          border-color: var(--primary-blue);
        }

        /* Responsive Design */
        @media (max-width: 768px) {
          html {
            font-size: 55%;
          }

          .patient-profile {
            margin: 30px 15px;
            padding: 30px 20px;
            border-radius: 20px;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 20px;
          }

          .form-group.full-width {
            grid-column: 1;
          }

          .form-actions {
            flex-direction: column;
            gap: 12px;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
          }

          .avatar-actions {
            flex-direction: column;
            gap: 10px;
          }

          .custom-file-upload,
          .btn-remove-photo {
            width: 100%;
            justify-content: center;
          }

          .profile-form-title {
            font-size: 2.4rem;
          }

          .profile-avatar {
            width: 120px;
            height: 120px;
          }
        }

        @media (max-width: 480px) {
          html {
            font-size: 50%;
          }

          .patient-profile {
            margin: 20px 10px;
            padding: 25px 15px;
          }
        }
      `}</style>

      {/* Edit Profile Section */}
      <section className="patient-profile">
        <Link to="/patient/profile" className="back-link">
          <i className="fas fa-arrow-left"></i>
          Back to Profile
        </Link>

        <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
          <h2 className="profile-form-title">Edit Profile</h2>
          <p className="profile-form-subtitle">Update your personal information</p>

          {photoError && <div className="error-message" style={{ textAlign: 'center', marginBottom: '20px' }}>{photoError}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Avatar Section */}
          <div className="avatar-section">
            <img 
              src={profilePhoto} 
              alt="Profile Preview" 
              className="profile-avatar"
              onError={(e) => {
                e.target.src = '/images/default-patient.svg';
              }}
            />
            
            <div className="avatar-actions">
              <div className="file-input-wrapper">
                <label htmlFor="profilePhoto" className="custom-file-upload">
                  <i className="fas fa-camera"></i>
                  Change Photo
                </label>
                <input 
                  type="file" 
                  id="profilePhoto" 
                  name="profilePhoto" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
              
              <button 
                type="button" 
                className="btn-remove-photo"
                onClick={removeProfilePhoto}
              >
                <i className="fas fa-trash"></i>
                Remove
              </button>
            </div>
          </div>

          {/* Form Fields - Grid Layout */}
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input 
                type="text" 
                placeholder="Enter your full name" 
                {...register('name')}
                className={errors.name ? 'error-input' : ''}
              />
              {errors.name && <div className="error-message">{errors.name.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input 
                type="email" 
                placeholder="Enter your email" 
                {...register('email')}
                className={errors.email ? 'error-input' : ''}
              />
              {errors.email && <div className="error-message">{errors.email.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input 
                type="text" 
                placeholder="10-digit mobile number" 
                {...register('mobile')}
                className={errors.mobile ? 'error-input' : ''}
              />
              {errors.mobile && <div className="error-message">{errors.mobile.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Date of Birth</label>
              <input 
                type="date" 
                {...register('dateOfBirth')}
                className={errors.dateOfBirth ? 'error-input' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dateOfBirth && <div className="error-message">{errors.dateOfBirth.message}</div>}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Address *</label>
              <input 
                type="text" 
                placeholder="Enter your address" 
                {...register('address')}
                className={errors.address ? 'error-input' : ''}
              />
              {errors.address && <div className="error-message">{errors.address.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Gender</label>
              <select 
                {...register('gender')}
                className={errors.gender ? 'error-input' : ''}
              >
                <option value="">Select Gender (Optional)</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <div className="error-message">{errors.gender.message}</div>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button 
              type="button" 
              className="btn-secondary"
              onClick={closeProfile}
            >
              Cancel
            </button>
            
            <button 
              type="submit" 
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default PatientEditProfile;