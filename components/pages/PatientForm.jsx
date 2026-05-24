import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { setToken } from '../../utils/authUtils';
import Header from '../common/Header';
import '../../assets/css/PatientForm.css';

// ── OTP Verify Step ──────────────────────────────────────────────────────────
const RESEND_COOLDOWN = 60; // seconds

function OtpStep({ email, pendingId, onSuccess, onBack }) {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef(null);

  // Start countdown on mount
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setResendCooldown(RESEND_COOLDOWN);
    timerRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setMessage({ type: 'error', text: 'Please enter the OTP.' });
      return;
    }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/patient/signup/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingId, otp: otp.trim() }),
      });
      const result = await response.json();
      if (response.ok) {
        if (result.token) setToken(result.token, 'patient');
        setMessage({ type: 'success', text: 'Account created! Redirecting to dashboard...' });
        setTimeout(() => {
          window.location.href = result.redirect || '/patient/dashboard';
        }, 1200);
      } else {
        setMessage({ type: 'error', text: `${result.error}${result.details ? ': ' + result.details : ''}` });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/patient/signup/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingId, email }),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'A new OTP has been sent to your email.' });
        resetTimer();
      } else {
        setMessage({ type: 'error', text: `${result.error}${result.details ? ': ' + result.details : ''}` });
        if (result.error === 'Session expired') {
          setTimeout(onBack, 2000);
        }
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-box">
      <h2>Verify Your Email</h2>
      <p style={{ color: '#6b7a8d', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
        A 6-digit OTP has been sent to <strong>{email}</strong>.<br />
        Enter it below to complete your registration.
      </p>

      {message.text && (
        <div className={`message ${message.type}`}>{message.text}</div>
      )}

      <form onSubmit={handleVerify}>
        <div className="form-group">
          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            style={{ letterSpacing: '8px', fontSize: '22px', textAlign: 'center' }}
            autoFocus
          />
          <i className="pf-icon fas fa-key"></i>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify & Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px', color: '#6b7a8d' }}>
        Didn't receive the OTP?{' '}
        {resendCooldown > 0
          ? <span style={{ color: '#aaa' }}>Resend in {resendCooldown}s</span>
          : <span
              className="pf-link"
              onClick={handleResend}
              style={{ cursor: loading ? 'default' : 'pointer' }}
            >Resend OTP</span>
        }
      </p>

      <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px' }}>
        <span className="pf-link" onClick={onBack}>← Back to Sign Up</span>
      </p>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

// Yup validation schemas
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number')
});

const signupSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters long')
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
  dateOfBirth: yup
    .date()
    .nullable()
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'You must be at least 18 years old', function(value) {
      if (!value) return true;
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      return age >= 18;
    })
    .typeError('Please enter a valid date'),
  gender: yup
    .string()
    .nullable()
    .oneOf(['male', 'female', 'other', null, ''], 'Please select a valid gender'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters long'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters long')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number')
});

const PatientForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  // OTP step state
  const [otpStep, setOtpStep] = useState(false);   // show OTP input screen?
  const [pendingId, setPendingId] = useState('');
  const [signupEmail, setSignupEmail] = useState('');

  // Initialize react-hook-form with yup resolver
  const loginForm = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const signupForm = useForm({
    resolver: yupResolver(signupSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      mobile: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      password: ''
    }
  });

  // Use the appropriate form based on isLogin state
  const { register, handleSubmit, formState: { errors }, reset } = isLogin ? loginForm : signupForm;

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setMessage({ type: '', text: '' });
    setOtpStep(false);
    setPendingId('');
    setSignupEmail('');
    loginForm.reset();
    signupForm.reset();
  };

  const onSubmit = async (data) => {
    try {
      if (isLogin) {
        // ── LOGIN: completely unchanged ──────────────────────────────────────
        const API = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API}/patient/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: data.email, password: data.password }),
        });
        const result = await response.json();
        if (response.ok) {
          if (result.token) setToken(result.token, 'patient');
          setMessage({ type: 'success', text: 'Login successful! Redirecting...' });
          setTimeout(() => {
            window.location.href = result.redirect || '/patient/dashboard';
          }, 1000);
        } else {
          setMessage({
            type: 'error',
            text: `${result.error}${result.details ? ': ' + result.details : ''}`
          });
        }
      } else {
        // ── SIGNUP STEP 1: send OTP ──────────────────────────────────────────
        const API = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API}/patient/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const result = await response.json();
        if (response.ok) {
          // Backend validated the data and sent OTP — switch to OTP step
          setPendingId(result.pendingId);
          setSignupEmail(data.email.trim().toLowerCase());
          setOtpStep(true);
          setMessage({ type: '', text: '' });
        } else {
          setMessage({
            type: 'error',
            text: `${result.error}${result.details ? ': ' + result.details : ''}`
          });
        }
      }
    } catch (error) {
      console.error(`${isLogin ? 'Login' : 'Signup'} Error:`, error);
      setMessage({
        type: 'error',
        text: `An error occurred during ${isLogin ? 'login' : 'signup'}. Please try again.`
      });
    }
  };

  return (
    <div className="patient-form-container">
      <Header />

      {/* ── OTP verification step (replaces the form temporarily) ── */}
      {otpStep ? (
        <OtpStep
          email={signupEmail}
          pendingId={pendingId}
          onBack={() => {
            setOtpStep(false);
            setPendingId('');
            setSignupEmail('');
            setMessage({ type: '', text: '' });
          }}
        />
      ) : (
        <div className="form-box">
          <h2>
            {isLogin ? 'Patient Login' : 'Patient Sign Up'}
          </h2>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {isLogin ? (
          <form id="loginForm" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                {...register('email')}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <i className="pf-icon fas fa-envelope"></i>
              {errors.email && <span className="error-message">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                {...register('password')}
                className={errors.password ? 'error' : ''}
              />
              <i className="pf-icon fas fa-lock"></i>
              {errors.password && <span className="error-message">{errors.password.message}</span>}
            </div>

            <button type="submit" className="submit-btn">Login</button>
            <p className="pf-footer">
              Don't have an account?{' '}
              <span className="pf-link" onClick={toggleForm}>Sign Up</span>
            </p>
          </form>
        ) : (
          <form id="signupForm" onSubmit={handleSubmit(onSubmit)}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                {...register('name')}
                className={errors.name ? 'error' : ''}
              />
              <i className="pf-icon fas fa-user"></i>
              {errors.name && <span className="error-message">{errors.name.message}</span>}
            </div>

            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                {...register('email')}
                className={errors.email ? 'error' : ''}
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              <i className="pf-icon fas fa-envelope"></i>
              {errors.email && <span className="error-message">{errors.email.message}</span>}
            </div>

            <div className="form-group">
              <input
                type="tel"
                placeholder="Mobile"
                {...register('mobile')}
                className={errors.mobile ? 'error' : ''}
              />
              <i className="pf-icon fas fa-phone"></i>
              {errors.mobile && <span className="error-message">{errors.mobile.message}</span>}
            </div>

            <div className="form-group has-label">
              <label style={{ fontSize: '13px', color: '#6b7a8d', marginBottom: '6px', display: 'block' }}>Date of Birth (Optional)</label>
              <input
                type="date"
                {...register('dateOfBirth')}
                className={errors.dateOfBirth ? 'error' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth.message}</span>}
            </div>

            <div className="form-group has-label">
              <label style={{ fontSize: '13px', color: '#6b7a8d', marginBottom: '6px', display: 'block' }}>Gender (Optional)</label>
              <select
                {...register('gender')}
                className={errors.gender ? 'error' : ''}
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
              {errors.gender && <span className="error-message">{errors.gender.message}</span>}
            </div>

            <div className="form-group">
              <input
                type="text"
                placeholder="Address"
                {...register('address')}
                className={errors.address ? 'error' : ''}
              />
              <i className="pf-icon fas fa-map-marker-alt"></i>
              {errors.address && <span className="error-message">{errors.address.message}</span>}
            </div>

            <div className="form-group">
              <input
                type="password"
                placeholder="Create your password"
                {...register('password')}
                className={errors.password ? 'error' : ''}
              />
              <i className="pf-icon fas fa-lock"></i>
              {errors.password && <span className="error-message">{errors.password.message}</span>}
            </div>

            <button type="submit" className="submit-btn">Sign Up</button>
            <p className="pf-footer">
              Already have an account?{' '}
              <span className="pf-link" onClick={toggleForm}>Sign In</span>
            </p>
          </form>
        )}
      </div>
      )}
    </div>
  );
};

export default PatientForm;