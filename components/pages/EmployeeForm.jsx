import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import '../../assets/css/EmployeeForm.css';

// --- Yup Validation Schemas ---

const passwordRule = yup
  .string()
  .required('Password is required')
  .min(6, 'Password must be at least 6 characters')
  .matches(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number');

const emailRule = yup
  .string()
  .required('Email is required')
  .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address');

// Login Schema
const loginSchema = yup.object().shape({
  email: emailRule,
  password: passwordRule,
  securityCode: yup
    .string()
    .required('Security code is required')
});

// Signup Schema
const signupSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be between 2 and 500 characters')
    .max(500, 'Name must be between 2 and 500 characters')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods'),
  signupEmail: emailRule,
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^\d{10}$/, 'Mobile number must be 10 digits'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters'),
  signupPassword: passwordRule,
  signupSecurityCode: yup
    .string()
    .required('Security code is required'),
  profilePhoto: yup
    .mixed()
    .required('Profile photo is required')
    // Validate file presence (files array must contain at least one element)
    .test('fileRequired', 'Profile photo is required', (value) => {
      return value && value.length > 0;
    }),
  document: yup
    .mixed()
    .required('Document is required')
    .test('fileRequired', 'Verification document is required', (value) => {
      return value && value.length > 0;
    })
    // Optional: Add file type validation if needed, e.g.,
    /*
    .test('fileType', 'Only image files (jpg, png, jpeg) are allowed', (value) => {
      if (!value || !value[0]) return true; // Handled by fileRequired test
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      return validTypes.includes(value[0].type);
    })
    */
});

// --- React Component ---

const EmployeeForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  // Initialize react-hook-form with yup resolver for Login
  const loginForm = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      email: '',
      password: '',
      securityCode: ''
    }
  });

  // Initialize react-hook-form with yup resolver for Signup
  const signupForm = useForm({
    resolver: yupResolver(signupSchema),
    mode: 'onChange', // Real-time validation
    defaultValues: {
      name: '',
      signupEmail: '',
      mobile: '',
      address: '',
      signupPassword: '',
      signupSecurityCode: '',
      profilePhoto: null,
      document: null
    }
  });

  // Determine which form's hooks to use based on the state
  const currentForm = isLogin ? loginForm : signupForm;
  const { register, handleSubmit, formState: { errors }, watch, reset, setValue } = currentForm;

  // Use RHF's watch function to monitor the file input for preview generation
  const profilePhotoFile = watch("profilePhoto");

  // Effect to handle file preview when profilePhoto changes (only runs in signup mode)
  React.useEffect(() => {
    if (!isLogin && profilePhotoFile && profilePhotoFile.length > 0) {
      const file = profilePhotoFile[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview('');
    }
  }, [profilePhotoFile, isLogin]);


  // --- Form Submission Handlers ---

  const handleLogin = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/employee/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          securityCode: data.securityCode
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Store JWT token
        localStorage.setItem('mediquick_employee_token', result.token);
        localStorage.setItem('mediquick_employee_role', 'employee');
        
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/employee/dashboard';
        }, 1000);
      } else {
        setErrorMessage(result.error + (result.details ? `: ${result.details}` : ''));
      }
    } catch (error) {
      setErrorMessage('Network error. Please check your connection and try again.');
      console.error('Login error:', error);
    }
  };

  const handleSignup = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    
    // Create FormData for file upload
    const signupData = new FormData();
    signupData.append('name', data.name);
    signupData.append('email', data.signupEmail);
    signupData.append('mobile', data.mobile);
    signupData.append('address', data.address);
    signupData.append('password', data.signupPassword);
    signupData.append('securityCode', data.signupSecurityCode);
    
    // Append the profile photo file if it exists in the FileList
    if (data.profilePhoto && data.profilePhoto[0]) {
      signupData.append('profilePhoto', data.profilePhoto[0]);
    }
    
    // Append the document file if it exists in the FileList
    if (data.document && data.document[0]) {
      signupData.append('document', data.document[0]);
    }
    
    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/employee/signup`, {
        method: 'POST',
        body: signupData // FormData handles 'Content-Type': 'multipart/form-data' automatically
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccessMessage(result.message || 'Signup successful! Please login with your credentials.');
        setIsLogin(true);
        signupForm.reset();
        setPhotoPreview(''); // Clear preview on successful submission
      } else {
        setErrorMessage(result.error + (result.details ? `: ${result.details}` : ''));
      }
    } catch (error) {
      setErrorMessage('Network error. Please check your connection and try again.');
      console.error('Signup error:', error);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setErrorMessage('');
    setSuccessMessage('');
    loginForm.reset();
    signupForm.reset();
    setPhotoPreview('');
  };

  const closeProfile = () => {
    window.location.href = "/";
  };

  return (
    <div className="employee-profile">
      <div className="close-btn" onClick={closeProfile}>
        <i className="fas fa-times"></i>
      </div>
      
      <h2 style={{ color: '#0188df', fontSize: '2rem', textAlign: 'center' }}>
        {isLogin ? 'Employee Login' : 'Employee Sign Up'}
      </h2>

      {errorMessage && (
        <div className="error-message" id="errlogin">
          {errorMessage}
        </div>
      )}
      
      {successMessage && (
        <div className="success-message" id="successlogin">
          {successMessage}
        </div>
      )}

      {isLogin ? (
        <form className="profile-form" onSubmit={handleSubmit(handleLogin)}>
          <input
            type="email"
            placeholder="Email"
            {...register('email')}
            className={errors.email ? 'error-input' : ''}
            required
          />
          {errors.email && <span className="field-error">{errors.email.message}</span>}
          
          <input
            type="password"
            placeholder="Password"
            {...register('password')}
            className={errors.password ? 'error-input' : ''}
            required
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
          
          <input
            type="password"
            placeholder="Security Code"
            {...register('securityCode')}
            className={errors.securityCode ? 'error-input' : ''}
            autoComplete="off"
            required
          />
          {errors.securityCode && <span className="field-error">{errors.securityCode.message}</span>}
          
          <button type="submit" className="button">Login</button>
          <p className="toggle" onClick={toggleForm}>
            Don't have an account? Sign Up
          </p>
        </form>
      ) : (
        <form className="profile-form" onSubmit={handleSubmit(handleSignup)}>
          <input
            type="text"
            placeholder="Full Name"
            {...register('name')}
            className={errors.name ? 'error-input' : ''}
            required
          />
          {errors.name && <span className="field-error">{errors.name.message}</span>}
          
          <input
            type="email"
            placeholder="Email"
            {...register('signupEmail')}
            className={errors.signupEmail ? 'error-input' : ''}
            required
          />
          {errors.signupEmail && <span className="field-error">{errors.signupEmail.message}</span>}
          
          <input
            type="tel"
            placeholder="Mobile"
            {...register('mobile')}
            className={errors.mobile ? 'error-input' : ''}
            pattern="[0-9]{10}"
            required
          />
          {errors.mobile && <span className="field-error">{errors.mobile.message}</span>}
          
          <input
            type="text"
            placeholder="Address"
            {...register('address')}
            className={errors.address ? 'error-input' : ''}
            required
          />
          {errors.address && <span className="field-error">{errors.address.message}</span>}
          
          <input
            type="password"
            placeholder="Create your password"
            {...register('signupPassword')}
            className={errors.signupPassword ? 'error-input' : ''}
            minLength="6"
            required
          />
          {errors.signupPassword && <span className="field-error">{errors.signupPassword.message}</span>}
          
          <input
            type="password"
            placeholder="Security Code"
            {...register('signupSecurityCode')}
            className={errors.signupSecurityCode ? 'error-input' : ''}
            autoComplete="off"
            required
          />
          {errors.signupSecurityCode && <span className="field-error">{errors.signupSecurityCode.message}</span>}
          
          {/* Profile Photo Upload Field */}
          <div style={{ margin: '20px 10%', textAlign: 'center' }}>
            <label htmlFor="profilePhoto" style={{ display: 'block', marginBottom: '10px', color: '#0188df', fontWeight: 'bold' }}>
              Profile Photo (Required)
            </label>
            <input
              type="file"
              id="profilePhoto"
              accept="image/*"
              // RHF Register for file input. Note: files are registered as FileList.
              {...register('profilePhoto')}
              className={errors.profilePhoto ? 'error-input' : ''}
              required
              style={{ width: '80%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
            />
            {errors.profilePhoto && <span className="field-error">{errors.profilePhoto.message}</span>}
            
            {photoPreview && (
              <div id="photoPreview" style={{ marginTop: '10px' }}>
                <img 
                  id="previewImg" 
                  src={photoPreview} 
                  alt="Profile Preview" 
                  style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0188df' }} 
                />
              </div>
            )}
          </div>
          
          {/* Document Upload Field */}
          <div style={{ margin: '20px 10%', textAlign: 'center' }}>
            <label htmlFor="document" style={{ display: 'block', marginBottom: '10px', color: '#0188df', fontWeight: 'bold' }}>
              Verification Document (Required)
            </label>
            <input
              type="file"
              id="document"
              accept="application/pdf,image/*"
              {...register('document')}
              className={errors.document ? 'error-input' : ''}
              required
              style={{ width: '80%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
            />
            {errors.document && <span className="field-error">{errors.document.message}</span>}
          </div>
          
          <button type="submit" className="button">Sign Up</button>
          <p className="toggle" onClick={toggleForm}>
            Already have an account? Sign In
          </p>
        </form>
      )}
    </div>
  );
};

export default EmployeeForm;