import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useEmployee } from '../../context/EmployeeContext';
import { getToken, removeToken } from '../../utils/authUtils';
import '../../assets/css/EmployeeEditProfile.css';

// --- Yup Validation Schema ---
const employeeEditSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be between 2 and 500 characters')
    .max(500, 'Name must be between 2 and 500 characters')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods'),
  email: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters'),
  // File input is optional on edit, so it's not strictly required here.
  profilePhoto: yup.mixed().nullable() 
});

// --- Main Component ---
const EmployeeEditProfile = () => {
  // Context hook to get data and update function
  const { employee, loading: contextLoading, error: contextError, updateEmployee, logout } = useEmployee();
  
  const [currentPhoto, setCurrentPhoto] = useState('/images/default-employee.svg');
  const [photoPreview, setPhotoPreview] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isHeaderActive, setIsHeaderActive] = useState(false);
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  // Initialize react-hook-form
  const { 
    register, 
    handleSubmit, 
    formState: { errors }, 
    setValue, 
    watch 
  } = useForm({
    resolver: yupResolver(employeeEditSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      address: '',
      profilePhoto: null
    }
  });

  // Watch file input for preview generation
  const fileToUpload = watch("profilePhoto"); 

  // Load data from context and handle scrolling
  useEffect(() => {
    // Populate form data from context using RHF's setValue
    if (employee) {
      setValue('name', employee.name || '');
      setValue('email', employee.email || '');
      setValue('mobile', employee.mobile || '');
      setValue('address', employee.address || '');
      setCurrentPhoto(employee.profilePhoto || '/images/default-employee.svg');
    }
    
    // Handle scroll for header
    const handleScroll = () => {
      setIsHeaderActive(window.scrollY > 30);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [employee, setValue]); 

  // Effect to handle file preview when profilePhoto changes
  useEffect(() => {
    if (fileToUpload && fileToUpload.length > 0) {
      const file = fileToUpload[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview('');
    }
  }, [fileToUpload]);


  // File change handler (remains slightly manual for preview generation)
  const handleFileChange = (e) => {
    // RHF registers the change, but we manually read the file for the instant preview
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview('');
    }
  };


  // RHF Submission Handler
  const onSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');

    try {
      setSubmitting(true);
      
      const submitData = new FormData();
      // Append validated RHF data
      submitData.append('name', data.name);
      submitData.append('email', data.email);
      submitData.append('mobile', data.mobile);
      submitData.append('address', data.address);
      
      // Append photo only if a new one was selected (using the ref)
      if (fileInputRef.current?.files[0]) {
        submitData.append('profilePhoto', fileInputRef.current.files[0]);
      }

      const token = getToken('employee');
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/employee/update-profile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData, // FormData for multipart
      });
      
      if (response.status === 401) {
        removeToken('employee');
        navigate('/employee/form');
        return;
      }

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccessMessage(result.message || 'Profile updated successfully!');
        
        // UPDATE CONTEXT WITH NEW DATA FROM BACKEND
        if (result.employee) {
          updateEmployee({
            name: result.employee.name,
            email: result.employee.email,
            mobile: result.employee.mobile,
            address: result.employee.address,
            profilePhoto: result.employee.profilePhoto
          });
        }

        setTimeout(() => {
          navigate('/employee/profile');
        }, 1000);
      } else {
        setErrorMessage(result.error || result.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setErrorMessage('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };


  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeProfile = () => {
    navigate('/employee/profile');
  };

  // Handle loading state from context
  if (contextLoading) {
    return (
      <div className="employee-edit-profile-page">
        <Header isHeaderActive={isHeaderActive} isNavOpen={isNavOpen} toggleNav={toggleNav} />
        <section className="employee-profile">
          <div className="loading">
            <i className="fas fa-spinner fa-spin"></i> Loading profile data...
          </div>
        </section>
      </div>
    );
  }

  // Handle error state from context
  if (contextError) {
    return (
      <div className="employee-edit-profile-page">
        <Header isHeaderActive={isHeaderActive} isNavOpen={isNavOpen} toggleNav={toggleNav} />
        <section className="employee-profile">
          <div className="error-message">
            {contextError}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="employee-edit-profile-page">
      <Header isHeaderActive={isHeaderActive} isNavOpen={isNavOpen} toggleNav={toggleNav} />
      
      <section className="employee-profile">
        <div className="close-btn" onClick={closeProfile}>
          <i className="fas fa-times"></i>
        </div>
        
        {/* Use RHF's handleSubmit to wrap the submission function */}
        <form className="profile-form" onSubmit={handleSubmit(onSubmit)}>
          {errorMessage && (
            <div className="error-message" id="errorMsg">
              {errorMessage}
            </div>
          )}
          
          {successMessage && (
            <div className="success-message" id="successMsg">
              {successMessage}
            </div>
          )}
          
          {/* Current Profile Photo Display */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img 
              id="currentPhoto" 
              src={currentPhoto} 
              alt="Current Profile Photo" 
              style={{ 
                width: '100px', 
                height: '100px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                border: '3px solid #0188df' 
              }}
              onError={(e) => {
                e.target.src = '/images/default-employee.svg';
              }}
            />
            <p style={{ marginTop: '10px', color: '#0188df', fontWeight: 'bold' }}>
              Current Profile Photo
            </p>
          </div>
          
          <input
            type="text"
            placeholder="Full Name"
            // RHF Register
            {...register('name')}
            className={errors.name ? 'error-input' : ''}
            required
          />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
          
          <input
            type="email"
            placeholder="Email"
            // RHF Register
            {...register('email')}
            className={errors.email ? 'error-input' : ''}
            required
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
          
          <input
            type="text"
            placeholder="Mobile"
            // RHF Register
            {...register('mobile')}
            className={errors.mobile ? 'error-input' : ''}
            pattern="\d{10}"
            required
          />
          {errors.mobile && <span className="field-error">{errors.mobile.message}</span>}
          
          <input
            type="text"
            placeholder="Address"
            // RHF Register
            {...register('address')}
            className={errors.address ? 'error-input' : ''}
            required
          />
          {errors.address && <span className="field-error">{errors.address.message}</span>}
          
          {/* Profile Photo Change Section */}
          <div style={{ margin: '20px 0', textAlign: 'center' }}>
            <label 
              htmlFor="profilePhoto" 
              style={{ 
                display: 'block', 
                marginBottom: '10px', 
                color: '#0188df', 
                fontWeight: 'bold' 
              }}
            >
              Change Profile Photo (Optional)
            </label>
            <input
              type="file"
              id="profilePhoto"
              accept="image/*"
              // RHF Register for file input. We use a combined approach with ref and manual change handler.
              {...register('profilePhoto')}
              ref={(e) => {
                // Assign the ref for file access in the submission handler
                fileInputRef.current = e; 
                // Call RHF's registered ref function
                register('profilePhoto').ref(e); 
              }}
              onChange={(e) => {
                handleFileChange(e);
                // Call RHF's registered onChange function
                register('profilePhoto').onChange(e); 
              }}
              style={{ 
                width: '80%', 
                padding: '10px', 
                border: '1px solid #ccc', 
                borderRadius: '5px' 
              }}
            />
            
            {photoPreview && (
              <div id="photoPreview" style={{ marginTop: '10px' }}>
                <img 
                  id="previewImg" 
                  src={photoPreview} 
                  alt="New Profile Preview" 
                  style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    objectFit: 'cover', 
                    border: '2px solid #0188df' 
                  }} 
                />
                <p style={{ marginTop: '5px', color: '#0188df', fontSize: '12px' }}>
                  New Photo Preview
                </p>
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="button"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </section>
    </div>
  );
};

// Header Component (Kept unchanged)
const Header = ({ isHeaderActive, isNavOpen, toggleNav }) => {
  return (
    <header className={isHeaderActive ? 'header-active' : ''}>
      <Link to="#" className="logo">
        <span>M</span>edi<span>Q</span>uick
      </Link>
      <nav className={`navbar ${isNavOpen ? 'nav-toggle' : ''}`}>
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About Us</Link></li>
          <li><Link to="/faqs">FAQs</Link></li>
          <li><Link to="/blogs">Blog</Link></li>
          <li><Link to="/contact">Contact Us</Link></li>
        </ul>
      </nav>
      <div className={`fas fa-bars ${isNavOpen ? 'fa-times' : ''}`} onClick={toggleNav}></div>
    </header>
  );
};

export default EmployeeEditProfile;