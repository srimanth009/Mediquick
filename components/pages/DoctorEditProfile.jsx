import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useDoctor } from '../../context/DoctorContext';
import { getToken, removeToken } from '../../utils/authUtils';
import axios from 'axios';

// Yup validation schema
const doctorEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(500, 'Name must not exceed 500 characters')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods'),
  email: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters'),
  specialization: yup
    .string(),
  college: yup
    .string(),
  yearOfPassing: yup
    .string(),
  location: yup
    .string()
    .required('Location is required'),
  onlineStatus: yup
    .string()
    .required('Online status is required'),
  consultationFee: yup
    .number()
    .required('Consultation fee is required')
    .min(0, 'Consultation fee must be a non-negative number')
    .typeError('Consultation fee must be a number'),
  dateOfBirth: yup
    .date()
    .nullable()
    .transform((value, originalValue) => {
      return originalValue === '' ? null : value;
    })
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Doctor must be at least 21 years old', function(value) {
      if (!value) return true; // Allow empty
      const age = Math.floor((new Date() - new Date(value)) / 31557600000); // ms in a year
      return age >= 21;
    }),
  gender: yup
    .string()
    .nullable()
    .oneOf(['male', 'female', 'other', null], 'Please select a valid gender')
});

const DoctorEditProfile = () => {
  const { doctor, loading: contextLoading, error: contextError, refetch, logout } = useDoctor();
  const [previewPhoto, setPreviewPhoto] = useState('/images/default-doctor.svg');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [photoError, setPhotoError] = useState('');
  
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // Initialize react-hook-form with yup resolver
  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(doctorEditSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      address: '',
      specialization: '',
      college: '',
      yearOfPassing: '',
      location: '',
      onlineStatus: 'Online',
      consultationFee: 0,
      dateOfBirth: '',
      gender: ''
    }
  });

  useEffect(() => {
    if (doctor) {
      // Update form values with doctor data from context
      setValue('name', doctor.name || '');
      setValue('email', doctor.email || '');
      setValue('mobile', doctor.mobile || '');
      setValue('address', doctor.address || '');
      setValue('specialization', doctor.specialization || '');
      setValue('college', doctor.college || '');
      setValue('yearOfPassing', doctor.yearOfPassing || '');
      setValue('location', doctor.location || '');
      setValue('onlineStatus', doctor.onlineStatus || 'Online');
      setValue('consultationFee', doctor.consultationFee || 0);
      
      // Format date for input field (YYYY-MM-DD)
      if (doctor.dateOfBirth) {
        const date = new Date(doctor.dateOfBirth);
        const formatted = date.toISOString().split('T')[0];
        setValue('dateOfBirth', formatted);
      } else {
        setValue('dateOfBirth', '');
      }
      setValue('gender', doctor.gender || '');
      
      if (doctor.profilePhoto) {
        const API = import.meta.env.VITE_API_URL;
        setPreviewPhoto(`${API}/${doctor.profilePhoto}`);
      } else {
        setPreviewPhoto('/images/default-doctor.svg');
      }
    }
  }, [doctor, setValue]);

  // File change handler

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPreviewPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeProfilePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    
    try {
        const token = getToken('doctor');
        const API = import.meta.env.VITE_API_URL;
        const { data } = await axios.post(`${API}/doctor/profile-photo/remove`, {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (data.success) {
            setPreviewPhoto('/images/default-doctor.svg');
            refetch(); // Refetch doctor data to update context
            setSuccess('Profile photo removed successfully.');
        } else {
            setPhotoError(data.message || 'Failed to remove photo');
        }
    } catch (error) {
        console.error('Error removing profile photo:', error);
        if (error.response?.status === 401) {
            removeToken();
            navigate('/doctor/form');
            return;
        }
        setPhotoError(error.response?.data?.message || 'Server error while removing photo.');
    }
  };

  const onSubmit = async (formValues) => {
    setLoading(true);
    setSuccess('');
    setPhotoError('');

    try {
      const data = new FormData();
      // Append all form fields to FormData
      data.append('name', formValues.name);
      data.append('email', formValues.email);
      data.append('mobile', formValues.mobile);
      data.append('address', formValues.address);
      data.append('specialization', formValues.specialization);
      data.append('college', formValues.college);
      data.append('yearOfPassing', formValues.yearOfPassing);
      data.append('location', formValues.location);
      data.append('onlineStatus', formValues.onlineStatus);
      data.append('consultationFee', formValues.consultationFee);
      
      // Add optional fields if provided
      if (formValues.dateOfBirth) {
        data.append('dateOfBirth', formValues.dateOfBirth);
      }
      if (formValues.gender) {
        data.append('gender', formValues.gender);
      }
      
      // Add profile photo if a new one was selected
      if (fileInputRef.current?.files[0]) {
        data.append('profilePhoto', fileInputRef.current.files[0]);
      }

      const token = getToken('doctor');
      const API = import.meta.env.VITE_API_URL;
      const response = await axios.post(`${API}/doctor/update-profile`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        await refetch(); // Refetch data to update context
        setSuccess('Profile updated successfully! Redirecting...');
        setTimeout(() => {
          navigate('/doctor/profile');
        }, 2000);
      } else {
        setPhotoError(response.data.message || 'Error updating profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error.response?.status === 401) {
        removeToken();
        navigate('/doctor/form');
        return;
      }
      setPhotoError(error.response?.data?.message || 'An error occurred while updating the profile');
    } finally {
      setLoading(false);
    }
  };

  if (contextLoading) {
    return <div className="loading">Loading profile...</div>;
  }

  if (contextError) {
    return <div className="error-message">Error: {contextError}. Please try logging in again.</div>;
  }

  return (
    <div className="doctor-edit-profile-container" style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '20px auto',
      fontFamily: 'Roboto, sans-serif'
    }}>

      {/* Edit Profile Section */}
      <div style={{
        background: 'white',
        padding: '30px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        border: '1px solid #e0e0e0'
      }}>
        <h2 style={{
          fontSize: '24px',
          color: '#444d53',
          marginBottom: '20px',
          textAlign: 'center'
        }}>Edit Doctor Profile</h2>

        <form onSubmit={handleSubmit(onSubmit)}>
          {photoError && <div style={{color: 'red', textAlign: 'center', marginBottom: '15px', padding: '10px', background: '#ffeaea', border: '1px solid #ffcdd2', borderRadius: '5px'}}>{photoError}</div>}
          {success && <div style={{color: 'green', textAlign: 'center', marginBottom: '15px', padding: '10px', background: '#f0fff0', border: '1px solid #d4edda', borderRadius: '5px'}}>{success}</div>}

          {/* Profile Photo Section */}
          <div style={{
            textAlign: 'center',
            margin: '20px 0',
            padding: '20px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <img 
              src={previewPhoto} 
              alt="Profile Preview" 
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #0188df',
                marginBottom: '15px'
              }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/default-doctor.svg';
              }}
            />
            
            <input 
              type="file" 
              id="profilePhoto" 
              name="profilePhoto" 
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ marginBottom: '15px' }}
            />
            
            <div style={{
              display: 'flex',
              gap: '10px',
              justifyContent: 'center',
              marginTop: '15px'
            }}>
              <button 
                type="button" 
                style={{
                  background: '#dc3545',
                  color: 'white',
                  border: '1px solid #dc3545',
                  padding: '8px 16px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
                onClick={removeProfilePhoto}
                onMouseOver={(e) => {
                  e.target.style.background = 'white';
                  e.target.style.color = '#dc3545';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = '#dc3545';
                  e.target.style.color = 'white';
                }}
              >
                Remove Photo
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div style={{marginBottom: '20px'}}>
            <label htmlFor="name" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Name:</label>
            <input 
              type="text" 
              id="name" 
              {...register('name')}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.name ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#444d53',
                backgroundColor: '#fff'
              }}
            />
            {errors.name && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.name.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="email" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Email:</label>
            <input 
              type="email" 
              id="email" 
              {...register('email')}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.email ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#444d53',
                backgroundColor: '#fff'
              }}
            />
            {errors.email && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.email.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="mobile" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Mobile:</label>
            <input 
              type="text" 
              id="mobile" 
              {...register('mobile')}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.mobile ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#444d53',
                backgroundColor: '#fff'
              }}
            />
            {errors.mobile && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.mobile.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="address" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Address:</label>
            <input 
              type="text" 
              id="address" 
              {...register('address')}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.address ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#444d53',
                backgroundColor: '#fff'
              }}
            />
            {errors.address && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.address.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="specialization" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Specialization:</label>
            <input 
              type="text" 
              id="specialization" 
              {...register('specialization')}
              readOnly
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.specialization ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#666',
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }}
            />
            {errors.specialization && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.specialization.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="college" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>College:</label>
            <input 
              type="text" 
              id="college" 
              {...register('college')}
              readOnly
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.college ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#666',
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }}
            />
            {errors.college && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.college.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="yearOfPassing" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Year of Passing:</label>
            <input 
              type="text" 
              id="yearOfPassing" 
              {...register('yearOfPassing')}
              readOnly
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.yearOfPassing ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#666',
                backgroundColor: '#f5f5f5',
                cursor: 'not-allowed'
              }}
            />
            {errors.yearOfPassing && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.yearOfPassing.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="location" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Location:</label>
            <input 
              type="text" 
              id="location" 
              {...register('location')}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.location ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#444d53',
                backgroundColor: '#fff'
              }}
            />
            {errors.location && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.location.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="onlineStatus" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Online Status:</label>
            <select 
              id="onlineStatus" 
              {...register('onlineStatus')}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.onlineStatus ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#444d53',
                backgroundColor: '#fff'
              }}
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>
            {errors.onlineStatus && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.onlineStatus.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="consultationFee" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Consultation Fee:</label>
            <input 
              type="number" 
              id="consultationFee" 
              {...register('consultationFee')}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.consultationFee ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#444d53',
                backgroundColor: '#fff'
              }}
              step="0.01"
            />
            {errors.consultationFee && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.consultationFee.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="dateOfBirth" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Date of Birth (Optional):</label>
            <input 
              type="date" 
              id="dateOfBirth" 
              {...register('dateOfBirth')}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.dateOfBirth ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#444d53',
                backgroundColor: '#fff'
              }}
              max={new Date().toISOString().split('T')[0]}
            />
            {errors.dateOfBirth && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.dateOfBirth.message}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <label htmlFor="gender" style={{
              display: 'block',
              fontSize: '16px',
              color: '#0188df',
              marginBottom: '8px',
              fontWeight: '500'
            }}>Gender (Optional):</label>
            <select 
              id="gender" 
              {...register('gender')}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '16px',
                border: errors.gender ? '1px solid red' : '1px solid #ddd',
                borderRadius: '5px',
                color: '#444d53',
                backgroundColor: '#fff'
              }}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
            {errors.gender && <div style={{color: 'red', fontSize: '14px', marginTop: '5px'}}>{errors.gender.message}</div>}
          </div>

          {/* Form Actions */}
          <div style={{
            display: 'flex',
            gap: '15px',
            justifyContent: 'center',
            marginTop: '30px',
            flexWrap: 'wrap'
          }}>
            <button 
              type="submit" 
              style={{
                padding: '12px 24px',
                background: '#444d53',
                color: 'white',
                fontSize: '16px',
                borderRadius: '5px',
                cursor: 'pointer',
                border: '1px solid #0188df',
                minWidth: '150px',
                opacity: loading ? '0.6' : '1'
              }}
              disabled={loading}
              onMouseOver={(e) => {
                if (!loading) {
                  e.target.style.background = 'white';
                  e.target.style.color = '#0188df';
                }
              }}
              onMouseOut={(e) => {
                if (!loading) {
                  e.target.style.background = '#444d53';
                  e.target.style.color = 'white';
                }
              }}
            >
              {loading ? 'Updating...' : 'Update Profile'}
            </button>
            
            <Link 
              to="/doctor/profile" 
              style={{
                padding: '12px 24px',
                background: 'white',
                color: '#444d53',
                fontSize: '16px',
                borderRadius: '5px',
                textDecoration: 'none',
                border: '1px solid #444d53',
                minWidth: '150px',
                textAlign: 'center',
                display: 'inline-block'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#444d53';
                e.target.style.color = 'white';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'white';
                e.target.style.color = '#444d53';
              }}
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorEditProfile;