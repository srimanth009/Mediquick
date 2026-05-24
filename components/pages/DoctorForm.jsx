import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { setToken } from '../../utils/authUtils';
import Header from '../common/Header';
import '../../assets/css/DoctorForm.css';

// ── OTP Verify Step ──────────────────────────────────────────────────────────
const RESEND_COOLDOWN = 60;

function OtpStep({ email, pendingId, onBack }) {
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const timerRef = useRef(null);

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
    if (!otp.trim()) { setMessage({ type: 'error', text: 'Please enter the OTP.' }); return; }
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/doctor/signup/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pendingId, otp: otp.trim() }),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: result.message || 'Account created! Await approval. Redirecting to login...' });
        setTimeout(() => { window.location.href = '/doctor/form'; }, 2500);
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
    if (resendCooldown > 0 || loading) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/doctor/signup/resend-otp`, {
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
        if (result.error === 'Session expired') setTimeout(onBack, 2000);
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-box">
      <h2 style={{ color: '#0188df' }}>Verify Your Email</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>
        A 6-digit OTP has been sent to <strong>{email}</strong>.<br />
        Enter it below to complete your registration.
      </p>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

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
        </div>
        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify & Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', marginTop: '12px', fontSize: '14px', color: '#666' }}>
        Didn't receive the OTP?{' '}
        {resendCooldown > 0
          ? <span style={{ color: '#aaa' }}>Resend in {resendCooldown}s</span>
          : <span
              style={{ color: '#ffa500', cursor: loading ? 'default' : 'pointer', textDecoration: 'underline' }}
              onClick={handleResend}
            >Resend OTP</span>
        }
      </p>
      <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '13px' }}>
        <span
          style={{ color: '#ffa500', cursor: 'pointer', textDecoration: 'underline' }}
          onClick={onBack}
        >← Back to Sign Up</span>
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
    .min(6, 'Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number')
});

const signupSchema = yup.object().shape({
  name: yup
    .string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(500, 'Name must not exceed 500 characters')
    .matches(/^(?=.*[A-Za-z])[A-Za-z0-9\s\-'.]+$/, 'Name must contain at least one letter and can include letters, numbers, spaces, hyphens, apostrophes, and periods'),
  signupEmail: yup
    .string()
    .required('Email is required')
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'),
  mobile: yup
    .string()
    .required('Mobile number is required')
    .matches(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  dateOfBirth: yup
    .date()
    .required('Date of birth is required')
    .max(new Date(), 'Date of birth cannot be in the future')
    .test('age', 'Doctor must be at least 21 years old', function(value) {
      if (!value) return false;
      const today = new Date();
      const birthDate = new Date(value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age >= 21;
    })
    .typeError('Please enter a valid date'),
  gender: yup
    .string()
    .nullable()
    .oneOf(['male', 'female', 'other', null, ''], 'Please select a valid gender'),
  address: yup
    .string()
    .required('Address is required')
    .min(5, 'Address must be at least 5 characters'),
  registrationNumber: yup
    .string()
    .required('Registration number is required')
    .matches(/^[a-zA-Z0-9]{6,20}$/, 'Registration number must be 6-20 alphanumeric characters'),
  specialization: yup
    .string()
    .required('Specialization is required'),
  college: yup
    .string()
    .required('College is required'),
  yearOfPassing: yup
    .number()
    .required('Year of passing is required')
    .min(1970, 'Year must be 1970 or later')
    .max(2025, 'Year cannot exceed 2025')
    .typeError('Year of passing must be a number'),
  location: yup
    .string()
    .required('Location is required'),
  onlineStatus: yup
    .string()
    .required('Online status is required'),
  consultationFee: yup
    .number()
    .required('Consultation fee is required')
    .min(0, 'Consultation fee must be a positive number')
    .typeError('Consultation fee must be a number'),

  signupPassword: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/, 'Password must contain at least one letter and one number'),
  document: yup
    .mixed()
    .required('Document is required')
    .test('fileType', 'Only PDF, DOC, and DOCX files are allowed', (value) => {
      if (!value || !value[0]) return false;
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      return validTypes.includes(value[0].type);
    })
});

const DoctorForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // OTP step state
  const [otpStep, setOtpStep] = useState(false);
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
      signupEmail: '',
      mobile: '',
      dateOfBirth: '',
      gender: '',
      address: '',
      registrationNumber: '',
      specialization: '',
      college: '',
      yearOfPassing: '',
      location: '',
      onlineStatus: 'Online',
      consultationFee: '',

      signupPassword: '',
      document: null
    }
  });

  // Use the appropriate form based on isLogin state
  const { register, handleSubmit, formState: { errors }, reset } = isLogin ? loginForm : signupForm;

  const onLoginSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    
    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/doctor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Store JWT token
        if (result.token) {
          setToken(result.token, 'doctor');
        }
        setSuccessMessage('Login successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/doctor/dashboard';
        }, 1000);
      } else {
        setErrorMessage(result.error + (result.details ? `: ${result.details}` : ''));
      }
    } catch (error) {
      setErrorMessage('Network error. Please check your connection and try again.');
      console.error('Login error:', error);
    }
  };

  const onSignupSubmit = async (data) => {
    setErrorMessage('');
    setSuccessMessage('');
    
    const signupData = new FormData();
    signupData.append('name', data.name);
    signupData.append('email', data.signupEmail);
    signupData.append('mobile', data.mobile);
    signupData.append('address', data.address);
    signupData.append('registrationNumber', data.registrationNumber);
    signupData.append('specialization', data.specialization);
    signupData.append('college', data.college);
    signupData.append('yearOfPassing', data.yearOfPassing);
    signupData.append('location', data.location);
    signupData.append('onlineStatus', data.onlineStatus);
    signupData.append('consultationFee', data.consultationFee);
    signupData.append('password', data.signupPassword);
    if (data.dateOfBirth) signupData.append('dateOfBirth', data.dateOfBirth);
    if (data.gender) signupData.append('gender', data.gender);
    if (data.document && data.document[0]) {
      signupData.append('document', data.document[0]);
    }
    
    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await fetch(`${API}/doctor/signup`, {
        method: 'POST',
        body: signupData
      });
      
      const result = await response.json();
      
      if (response.ok) {
        // Backend validated + uploaded file + sent OTP — show OTP step
        setPendingId(result.pendingId);
        setSignupEmail(data.signupEmail.trim().toLowerCase());
        setOtpStep(true);
        setErrorMessage('');
        setSuccessMessage('');
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
    setOtpStep(false);
    setPendingId('');
    setSignupEmail('');
    loginForm.reset();
    signupForm.reset();
  };

  const closeProfile = () => {
    window.location.href = "/";
  };

  return (
    <div className="doctor-form-container">
      <Header />

      {/* ── OTP verification step ── */}
      {otpStep ? (
        <OtpStep
          email={signupEmail}
          pendingId={pendingId}
          onBack={() => {
            setOtpStep(false);
            setPendingId('');
            setSignupEmail('');
            setErrorMessage('');
            setSuccessMessage('');
          }}
        />
      ) : (
      <div className="form-box">
        <h2 style={{ color: '#0188df' }}>
          {isLogin ? 'Doctor Login' : 'Doctor Sign Up'}
        </h2>

        {errorMessage && (
          <div className="message error">
            {errorMessage}
          </div>
        )}
        
        {successMessage && (
          <div className="message success">
            {successMessage}
          </div>
        )}

        {isLogin ? (
          <form onSubmit={handleSubmit(onLoginSubmit)}>
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
              {errors.email && <span className="error-message">{errors.email.message}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                placeholder="Password"
                {...register('password')}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password.message}</span>}
            </div>

            <button type="submit" className="submit-btn">Login</button>
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Don't have an account? </span>
              <span onClick={toggleForm} style={{ color: '#ffa500', cursor: 'pointer', textDecoration: 'underline' }}>Sign Up</span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSignupSubmit)}>
            <div className="form-group">
              <input
                type="text"
                placeholder="Full Name"
                {...register('name')}
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-message">{errors.name.message}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="email"
                placeholder="Email"
                {...register('signupEmail')}
                className={errors.signupEmail ? 'error' : ''}
                autoComplete="email"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {errors.signupEmail && <span className="error-message">{errors.signupEmail.message}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="tel"
                placeholder="Mobile"
                {...register('mobile')}
                className={errors.mobile ? 'error' : ''}
              />
              {errors.mobile && <span className="error-message">{errors.mobile.message}</span>}
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: '14px', color: '#666', marginBottom: '5px', display: 'block' }}>Date of Birth *</label>
              <input
                type="date"
                {...register('dateOfBirth')}
                className={errors.dateOfBirth ? 'error' : ''}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth.message}</span>}
            </div>
            
            <div className="form-group">
              <label style={{ fontSize: '14px', color: '#666', marginBottom: '5px', display: 'block' }}>Gender (Optional)</label>
              <select
                {...register('gender')}
                className={errors.gender ? 'error' : ''}
                style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '16px' }}
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
              {errors.address && <span className="error-message">{errors.address.message}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="text"
                placeholder="Registration Number"
                {...register('registrationNumber')}
                className={errors.registrationNumber ? 'error' : ''}
              />
              {errors.registrationNumber && <span className="error-message">{errors.registrationNumber.message}</span>}
            </div>
            
            <div className="form-group">
              <select
                {...register('specialization')}
                className={errors.specialization ? 'error' : ''}
                style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '16px' }}
              >
                <option value="">Select Specialization</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Psychiatry">Psychiatry</option>
                <option value="Oncology">Oncology</option>
                <option value="Radiology">Radiology</option>
                <option value="Emergency Medicine">Emergency Medicine</option>
                <option value="Internal Medicine">Internal Medicine</option>
                <option value="Gastroenterology">Gastroenterology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Ophthalmology">Ophthalmology</option>
                <option value="ENT (Otolaryngology)">ENT (Otolaryngology)</option>
                <option value="Anesthesiology">Anesthesiology</option>
              </select>
              {errors.specialization && <span className="error-message">{errors.specialization.message}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="text"
                placeholder="College of latest degree"
                {...register('college')}
                className={errors.college ? 'error' : ''}
              />
              {errors.college && <span className="error-message">{errors.college.message}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="number"
                placeholder="Year of passing (UG)"
                {...register('yearOfPassing')}
                className={errors.yearOfPassing ? 'error' : ''}
              />
              {errors.yearOfPassing && <span className="error-message">{errors.yearOfPassing.message}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="text"
                placeholder="Location"
                {...register('location')}
                className={errors.location ? 'error' : ''}
              />
              {errors.location && <span className="error-message">{errors.location.message}</span>}
            </div>
            
            <div className="form-group">
              <label className="file-input-label">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  {...register('document')}
                  className={errors.document ? 'error' : ''}
                />
                Upload Medical Document (PDF, DOC, DOCX)
              </label>
              {errors.document && <span className="error-message">{errors.document.message}</span>}
            </div>
            
            <div className="form-group">
              <select
                {...register('onlineStatus')}
                style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ddd', fontSize: '16px' }}
              >
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
              {errors.onlineStatus && <span className="error-message">{errors.onlineStatus.message}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="number"
                placeholder="Consultation Fee"
                {...register('consultationFee')}
                className={errors.consultationFee ? 'error' : ''}
              />
              {errors.consultationFee && <span className="error-message">{errors.consultationFee.message}</span>}
            </div>
            
            <div className="form-group">
              <input
                type="password"
                placeholder="Create your password"
                {...register('signupPassword')}
                className={errors.signupPassword ? 'error' : ''}
              />
              {errors.signupPassword && <span className="error-message">{errors.signupPassword.message}</span>}
            </div>
            
            <button type="submit" className="submit-btn">Sign Up</button>
            <p style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
              <span style={{ color: '#666' }}>Already have an account? </span>
              <span onClick={toggleForm} style={{ color: '#ffa500', cursor: 'pointer', textDecoration: 'underline' }}>Sign In</span>
            </p>
          </form>
        )}
      </div>
      )}
    </div>
  );
};

export default DoctorForm;