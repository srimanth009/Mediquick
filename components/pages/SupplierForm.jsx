import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Header from '../common/Header';
import { setToken } from '../../utils/authUtils';
import '../../assets/css/supplier_form.css';

// --- Yup Validation Helpers ---

const passwordRule = yup
  .string()
  .required('Password is required')
  .min(6, 'Password must be at least 6 characters long')
  .matches(/(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number');

const emailRule = yup
  .string()
  .required('Email is required')
  .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address')
  .trim()
  .lowercase();

// --- Yup Validation Schemas ---

const loginSchema = yup.object().shape({
  email: emailRule,
  password: passwordRule,
  securityCode: yup
    .string()
    .required('Security code is required')
});

const signupSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods')
    .min(2, 'Name must be between 2 and 100 characters')
    .max(100, 'Name must be between 2 and 100 characters'),
  email: emailRule, 
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^[0-9]{10}$/, 'Mobile number must be exactly 10 digits'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be between 5 and 200 characters')
    .max(200, 'Address must be between 5 and 200 characters'),
  supplierID: yup
    .string()
    .required('Supplier ID is required')
    .matches(/^[A-Za-z0-9-_]+$/, 'Supplier ID can only contain letters, numbers, hyphens, and underscores')
    .min(3, 'Supplier ID must be between 3 and 20 characters')
    .max(20, 'Supplier ID must be between 3 and 20 characters'),
  password: passwordRule, 
  securityCode: yup
    .string()
    .required('Security code is required'),
  profilePhoto: yup
    .mixed()
    .required('Profile photo is required')
    .test('fileRequired', 'Profile photo is required', (value) => {
      return value && value.length > 0;
    }),
  document: yup
    .mixed()
    .required('Document is required')
    .test('fileRequired', 'Verification document is required', (value) => {
      return value && value.length > 0;
    })
});

// --- React Component ---

const SupplierForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState('');
  const navigate = useNavigate();
  const [message, setMessage] = useState({ type: '', text: '' });

  const loginForm = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange', // For real-time validation
    defaultValues: { email: '', password: '', securityCode: '' }
  });

  // Initialize react-hook-form for Signup
  const signupForm = useForm({
    resolver: yupResolver(signupSchema),
    mode: 'onChange', // For real-time validation
    defaultValues: {
      name: '', email: '', mobile: '', address: '', supplierID: '', password: '', securityCode: '', profilePhoto: null, document: null
    }
  });

  // Determine which form's hooks to use based on the state
  const currentForm = isLogin ? loginForm : signupForm;
  // Note: We use the same keys in register() for both forms: email, password, securityCode
  const { register, handleSubmit, formState: { errors }, watch, reset } = currentForm;

  // Use RHF's watch function to monitor the file input for preview generation
  const profilePhotoFile = watch("profilePhoto");

  // Effect to handle file preview when profilePhoto changes (only runs in signup mode)
  useEffect(() => {
    if (!isLogin && profilePhotoFile && profilePhotoFile.length > 0) {
      const file = profilePhotoFile[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview('');
    }
  }, [profilePhotoFile, isLogin]);


  const onLoginSubmit = async (data) => {
    setMessage({ type: '', text: '' });
    setIsLoading(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/supplier/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          securityCode: data.securityCode
        })
      });
      
      const result = await resp.json();

      if (resp.ok) {
        // Store JWT token
        if (result.token) {
          setToken(result.token, 'supplier');
        }
        setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
        setTimeout(() => {
          navigate(result.redirect || '/supplier/dashboard');
        }, 800);
      } else {
        setMessage({ type: 'error', text: result.error || 'Login failed' });
      }
    } catch (err) {
      console.error('Supplier login error:', err);
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const onSignupSubmit = async (data) => {
    setMessage({ type: '', text: '' });
    setIsLoading(true);

    try {
      const signupData = new FormData();
      // Append all fields to FormData
      signupData.append('name', data.name);
      // RHF handles the email to be lowercase/trimmed due to the schema, so we use data.email
      signupData.append('email', data.email); 
      signupData.append('mobile', data.mobile);
      signupData.append('address', data.address);
      signupData.append('supplierID', data.supplierID);
      signupData.append('password', data.password);
      signupData.append('securityCode', data.securityCode);
      
      // Append the files
      if (data.profilePhoto && data.profilePhoto[0]) {
        signupData.append('profilePhoto', data.profilePhoto[0]);
      }
      if (data.document && data.document[0]) {
        signupData.append('document', data.document[0]);
      }

      const resp = await fetch(`${import.meta.env.VITE_API_URL}/supplier/signup`, {
        method: 'POST',
        body: signupData // FormData handles 'Content-Type': 'multipart/form-data'
      });

      const result = await resp.json();

      if (resp.ok) {
        setMessage({ type: 'success', text: 'Registration successful! Please login.' });
        setTimeout(() => {
          setIsLogin(true);
          signupForm.reset(); // Reset form after successful signup
          setPhotoPreview('');
        }, 1200);
      } else {
        setMessage({ type: 'error', text: result.error || 'Registration failed' });
      }
    } catch (err) {
      console.error('Supplier signup error:', err);
      setMessage({ type: 'error', text: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage({ type: '', text: '' });
    loginForm.reset();
    signupForm.reset();
    setPhotoPreview('');
  };

  // Scroll to top on mount and when switching forms
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [isLogin]);

  return (
    <div className="supplier-form-container">
      <Header />

      <div className="supplier-profile">
        {/* Login Form */}
        {isLogin ? (
          <form id="loginForm" className="profile-form supplier-profile-form" onSubmit={handleSubmit(onLoginSubmit)}>
          <h2 style={{ color: '#007bff', fontSize: '2rem', textAlign: 'center' }}>Supplier Login</h2>
          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
          
          <input 
            type="email" 
            placeholder="Email" 
            {...register('email')}
            className={errors.email ? 'error-input' : ''} 
            required 
            autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck={false} 
          />
          {errors.email && <span className="error-text">{errors.email.message}</span>}
          
          <input 
            type="password" 
            placeholder="Password" 
            {...register('password')}
            className={errors.password ? 'error-input' : ''} 
            required 
          />
          {errors.password && <span className="error-text">{errors.password.message}</span>}
          
          <input 
            type="password" 
            placeholder="Security Code" 
            {...register('securityCode')}
            className={errors.securityCode ? 'error-input' : ''} 
            required 
          />
          {errors.securityCode && <span className="error-text">{errors.securityCode.message}</span>}
          
          <button type="submit" className="button" disabled={isLoading}>{isLoading ? 'Logging in...' : 'Login'}</button>
          <p className="toggle" onClick={toggleForm}><ins>Don't have an account?</ins> <ins>Sign Up</ins></p>
        </form>
        ) : (
          /* Sign Up Form */
          <form id="signupForm" className="profile-form supplier-profile-form" onSubmit={handleSubmit(onSignupSubmit)}>
          <h2 style={{ color: '#007bff', fontSize: '2rem', textAlign: 'center' }}>Supplier Sign Up</h2>
          {message.text && <div className={`message ${message.type}`}>{message.text}</div>}
          
          <input 
            type="text" 
            placeholder="Full Name" 
            {...register('name')}
            className={errors.name ? 'error-input' : ''} 
            required 
          />
          {errors.name && <span className="error-text">{errors.name.message}</span>}
          
          <input 
            type="email" 
            placeholder="Email" 
            {...register('email')}
            className={errors.email ? 'error-input' : ''} 
            required 
            autoComplete="email" autoCapitalize="off" autoCorrect="off" spellCheck={false} 
          />
          {errors.email && <span className="error-text">{errors.email.message}</span>}
          
          <input 
            type="tel" 
            placeholder="Mobile" 
            {...register('mobile')}
            className={errors.mobile ? 'error-input' : ''} 
            required 
          />
          {errors.mobile && <span className="error-text">{errors.mobile.message}</span>}
          
          <input 
            type="text" 
            placeholder="Supplier ID" 
            {...register('supplierID')}
            className={errors.supplierID ? 'error-input' : ''} 
            required 
          />
          {errors.supplierID && <span className="error-text">{errors.supplierID.message}</span>}
          
          <input 
            type="text" 
            placeholder="Address" 
            {...register('address')}
            className={errors.address ? 'error-input' : ''} 
            required 
          />
          {errors.address && <span className="error-text">{errors.address.message}</span>}
          
          <input 
            type="password" 
            placeholder="Create your password" 
            {...register('password')}
            className={errors.password ? 'error-input' : ''} 
            minLength="6" 
            required 
          />
          {errors.password && <span className="error-text">{errors.password.message}</span>}
          
          <input 
            type="password" 
            placeholder="Security Code" 
            {...register('securityCode')}
            className={errors.securityCode ? 'error-input' : ''} 
            required 
          />
          {errors.securityCode && <span className="error-text">{errors.securityCode.message}</span>}

          {/* Profile Photo Upload Field */}
          <div style={{ margin: '20px 10%', textAlign: 'center' }}>
            <label htmlFor="profilePhoto" style={{ display: 'block', marginBottom: '10px', color: '#0188df', fontWeight: 'bold' }}>
              Profile Photo (Required)
            </label>
            <input
              type="file"
              id="profilePhoto"
              accept="image/*"
              // RHF Register for file input: register('profilePhoto')
              {...register('profilePhoto')}
              className={errors.profilePhoto ? 'error-input' : ''}
              required
              style={{ width: '80%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }}
            />
            {errors.profilePhoto && <span className="error-text">{errors.profilePhoto.message}</span>}
            
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

          {/* Verification Document Upload Field */}
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
            {errors.document && <span className="error-text">{errors.document.message}</span>}
          </div>
          
            <button type="submit" className="button" disabled={isLoading}>{isLoading ? 'Signing up...' : 'Sign Up'}</button>
            <p className="toggle" onClick={toggleForm}><ins>Already have an account?</ins> <ins>Sign In</ins></p>
          </form>
        )}
      </div>
    </div>
  );
};

export default SupplierForm;