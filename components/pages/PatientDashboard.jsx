import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { removeToken } from '../../utils/authUtils';
import '../../assets/css/PatientDashboard.css';
import { usePatient } from '../../context/PatientContext';

const PatientDashboard = () => {
  const { patient, logout } = usePatient();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setIsMobileNavOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getProfileImageUrl = () => {
    if (!patient?.profilePhoto) return '/images/default-patient.svg';
    const photo = patient.profilePhoto;
    if (/^(https?:|data:|blob:)/i.test(photo)) return photo;
    const API = import.meta.env.VITE_API_URL;
    if (photo.startsWith('/')) return `${API}${photo}`;
    return `${API}/${photo}`;
  };

  const handleLogout = async () => {
    try {
      logout();
    } catch (error) {
      console.error('Error logging out:', error);
      navigate('/patient/form');
    }
  };
  
  return (
    <div className="patient-dashboard">
      {/* Custom Modern Header */}
      <header className={`pd-header ${isScrolled ? 'pd-header--scrolled' : ''}`}>
        <div className="pd-header__inner">
          <Link to="/" className="pd-header__logo">
            <span className="pd-header__logo-icon"><i className="fas fa-heartbeat"></i></span>
            <span className="pd-header__logo-text">Medi<span>Quick</span></span>
          </Link>

          <nav className={`pd-header__nav ${isMobileNavOpen ? 'pd-header__nav--open' : ''}`}>
            <Link to="/" className="pd-header__link">
              <i className="fas fa-home"></i> Home
            </Link>
            <Link to="/about-us" className="pd-header__link">
              <i className="fas fa-info-circle"></i> About Us
            </Link>
            <Link to="/faqs" className="pd-header__link">
              <i className="fas fa-question-circle"></i> FAQs
            </Link>
            <Link to="/blog" className="pd-header__link">
              <i className="fas fa-blog"></i> Blog
            </Link>
            <Link to="/contact-us" className="pd-header__link">
              <i className="fas fa-envelope"></i> Contact
            </Link>
          </nav>

          <div className="pd-header__actions">
            <Link to="/patient/profile" className="pd-header__profile">
              <img 
                src={getProfileImageUrl()} 
                alt="Profile" 
                className="pd-header__avatar"
                onError={(e) => { e.target.src = '/images/default-patient.svg'; }}
              />
              <span className="pd-header__username">
                {patient?.name ? patient.name.split(' ')[0] : 'Patient'}
              </span>
            </Link>
            <button onClick={handleLogout} className="pd-header__logout" title="Logout">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>

          <button className="pd-header__hamburger" onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}>
            <i className={`fas ${isMobileNavOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <h1 className="dashboard-title">
            Welcome back{patient?.name ? `, ${patient.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="dashboard-subtitle">Manage your health journey with ease</p>
        </div>
      </div>

      {/* Dashboard Cards */}
      <section className="pd-cards">
        <div className="pd-cards__grid">

          <div className="pd-card">
            <div className="pd-card__icon-wrap pd-card__icon-wrap--blue">
              <i className="fas fa-user-circle"></i>
            </div>
            <div className="pd-card__body">
              <h3 className="pd-card__title">My Profile</h3>
              <p className="pd-card__desc">Manage your personal info and medical history.</p>
              <Link to="/patient/profile" className="pd-card__btn">
                View Profile <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="pd-card">
            <div className="pd-card__icon-wrap pd-card__icon-wrap--teal">
              <i className="fas fa-file-prescription"></i>
            </div>
            <div className="pd-card__body">
              <h3 className="pd-card__title">My Prescriptions</h3>
              <p className="pd-card__desc">Access prescriptions and medication details.</p>
              <Link to="/patient/prescriptions" className="pd-card__btn">
                View Prescriptions <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="pd-card">
            <div className="pd-card__icon-wrap pd-card__icon-wrap--indigo">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="pd-card__body">
              <h3 className="pd-card__title">Consult Doctors</h3>
              <p className="pd-card__desc">Get expert consultations from certified doctors.</p>
              <Link to="/patient/book-doc-online" className="pd-card__btn">
                Consult Now <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="pd-card">
            <div className="pd-card__icon-wrap pd-card__icon-wrap--orange">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="pd-card__body">
              <h3 className="pd-card__title">Book Appointments</h3>
              <p className="pd-card__desc">Schedule appointments with preferred doctors.</p>
              <Link to="/patient/book-appointment" className="pd-card__btn">
                Book Now <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="pd-card">
            <div className="pd-card__icon-wrap pd-card__icon-wrap--green">
              <i className="fas fa-pills"></i>
            </div>
            <div className="pd-card__body">
              <h3 className="pd-card__title">Order Medicine</h3>
              <p className="pd-card__desc">Get medicines delivered to your doorstep.</p>
              <Link to="/patient/order-medicines" className="pd-card__btn">
                Order Now <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

          <div className="pd-card">
            <div className="pd-card__icon-wrap pd-card__icon-wrap--purple">
              <i className="fas fa-clipboard-list"></i>
            </div>
            <div className="pd-card__body">
              <h3 className="pd-card__title">My Appointments</h3>
              <p className="pd-card__desc">View all your appointments with status updates.</p>
              <Link to="/patient/appointments" className="pd-card__btn">
                View Appointments <i className="fas fa-arrow-right"></i>
              </Link>
            </div>
          </div>

        </div>
        
        <div className="pd-review-cta">
          <Link to="/patient/submit-review" className="pd-review-cta__btn">
            <i className="fas fa-star"></i> Share Your Experience with MediQuick
          </Link>
        </div>
      </section>
    </div>
  );
};

export default PatientDashboard;