import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import '../../assets/css/AdminForm.css';

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
    .required('Security code is required')
});

// --- React Component ---

const AdminForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const loginForm = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange', 
    defaultValues: {
      email: '',
      password: '',
      securityCode: ''
    }
  });

  // Initialize react-hook-form with yup resolver for Signup
  const signupForm = useForm({
    resolver: yupResolver(signupSchema),
    // Changed to 'onChange' for real-time validation as the user types
    mode: 'onChange', 
    defaultValues: {
      name: '',
      signupEmail: '',
      mobile: '',
      address: '',
      signupPassword: '',
      signupSecurityCode: ''
    }
  });

  // Use the appropriate form based on isLogin state
  // Errors object will update instantly due to mode: 'onChange'
  const { register, handleSubmit, formState: { errors }, reset } = isLogin ? loginForm : signupForm;

  // --- Form Submission Handlers ---

  const handleLogin = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    
    // Custom error message for user
    // No need to check for password error explicitly here as handleSubmit already ensures no form errors, 
    // but keeping the logic for custom error visibility if formState has validation errors
    if (loginForm.formState.errors.password) {
        setErrorMessage('Please correct the errors in the form. Note that the password should be at least 6 characters long and contain at least one letter and one number, with no spaces.');
        return;
    }

    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/admin/login`, {
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
        localStorage.setItem('mediquick_admin_token', result.token);
        localStorage.setItem('mediquick_admin_role', 'admin');
        
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = result.redirect || '/admin/dashboard';
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
    
    // Custom error message for user
    if (signupForm.formState.errors.signupPassword) {
        setErrorMessage('Please correct the errors in the form. Note that the password should be at least 6 characters long and contain at least one letter and one number, with no spaces.');
        return;
    }

    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/admin/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: data.name,
          email: data.signupEmail,
          mobile: data.mobile,
          address: data.address,
          password: data.signupPassword,
          securityCode: data.signupSecurityCode
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setSuccessMessage(result.message || 'Signup successful! Please login.');
        setIsLogin(true);
        // Reset signup form
        signupForm.reset();
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
    // Reset both forms when toggling
    loginForm.reset();
    signupForm.reset();
  };

  const closeProfile = () => {
    window.location.href = "/";
  };

  return (
    <div className="admin-form-container">
      <div className="admin-form-wrapper">
        <div className="close-btn" onClick={closeProfile}>
          <i className="fas fa-times"></i>
        </div>
        
        <div className="admin-form-header">
          {/* <a href="/" className="logo"><span>M</span>edi<span>Q</span>uick</a> */}
          <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>
          {/* <p>Welcome to MediQuick Admin Portal</p> */}
        </div>

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

        {/* RHF's handleSubmit handles validation before calling the submit handler */}
        {isLogin ? (
          <form className="admin-form" onSubmit={handleSubmit(handleLogin)}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email address"
                {...register('email')}
                className={errors.email ? 'error-input' : ''}
                required
              />
              {errors.email && <span className="field-error">{errors.email.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register('password')}
                className={errors.password ? 'error-input' : ''}
                required
              />
              {errors.password && <span className="field-error">{errors.password.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="securityCode">Security Code</label>
              <input
                id="securityCode"
                type="password"
                placeholder="Enter security code"
                {...register('securityCode')}
                className={errors.securityCode ? 'error-input' : ''}
                autoComplete="off"
                required
              />
              {errors.securityCode && <span className="field-error">{errors.securityCode.message}</span>}
            </div>
            
            <button type="submit" className="submit-btn">Login</button>
            
            <div className="form-links">
              <a href="#" onClick={toggleForm}>
                Don't have an account? Sign Up
              </a>
            </div>
        </form>
        ) : (
          <form className="admin-form" onSubmit={handleSubmit(handleSignup)}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                {...register('name')}
                className={errors.name ? 'error-input' : ''}
                required
              />
              {errors.name && <span className="field-error">{errors.name.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="signupEmail">Email Address</label>
              <input
                id="signupEmail"
                type="email"
                placeholder="Enter your email address"
                {...register('signupEmail')}
                className={errors.signupEmail ? 'error-input' : ''}
                required
              />
              {errors.signupEmail && <span className="field-error">{errors.signupEmail.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                id="mobile"
                type="tel"
                placeholder="Enter your mobile number"
                {...register('mobile')}
                className={errors.mobile ? 'error-input' : ''}
                pattern="[0-9]{10}"
                required
              />
              {errors.mobile && <span className="field-error">{errors.mobile.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                placeholder="Enter your full address"
                {...register('address')}
                className={errors.address ? 'error-input' : ''}
                rows="3"
                required
              />
              {errors.address && <span className="field-error">{errors.address.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="signupPassword">Password</label>
              <input
                id="signupPassword"
                type="password"
                placeholder="Create your password"
                {...register('signupPassword')}
                className={errors.signupPassword ? 'error-input' : ''}
                minLength="6"
                required
              />
              {errors.signupPassword && <span className="field-error">{errors.signupPassword.message}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="signupSecurityCode">Security Code</label>
              <input
                id="signupSecurityCode"
                type="password"
                placeholder="Enter security code"
                {...register('signupSecurityCode')}
                className={errors.signupSecurityCode ? 'error-input' : ''}
                autoComplete="off"
                required
              />
              {errors.signupSecurityCode && <span className="field-error">{errors.signupSecurityCode.message}</span>}
            </div>
            
            <button type="submit" className="submit-btn">Sign Up</button>
            
            <div className="form-links">
              <a href="#" onClick={toggleForm}>
                Already have an account? Sign In
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default AdminForm;