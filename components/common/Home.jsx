import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import FAQ from '../FAQ';
import '../../assets/css/home_page.css';

function Home() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setIsMobileNavOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchReviews = async () => {
    try {
      const API = import.meta.env.VITE_API_URL;
      const response = await axios.get(`${API}/review/approved`);
      if (response.data.success) {
        setReviews(response.data.reviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // If no reviews, keep empty array
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} style={{ color: index < rating ? '#fbbf24' : '#d1d5db' }}>
        ★
      </span>
    ));
  };

  return (
    <>
      {/* Modern Rich Header */}
      <header className={`home-header ${isScrolled ? 'home-header--scrolled' : ''}`}>
        <div className="home-header__inner">
          <Link to="/" className="home-header__logo">
            <span className="home-header__logo-icon"><i className="fas fa-heartbeat"></i></span>
            <span className="home-header__logo-text">Medi<span>Quick</span></span>
          </Link>

          <nav className={`home-header__nav ${isMobileNavOpen ? 'home-header__nav--open' : ''}`}>
            <Link to="/" className="home-header__link home-header__link--active">
              <i className="fas fa-home"></i> Home
            </Link>
            <Link to="/about-us" className="home-header__link">
              <i className="fas fa-info-circle"></i> About Us
            </Link>
            <Link to="/faqs" className="home-header__link">
              <i className="fas fa-question-circle"></i> FAQs
            </Link>
            <Link to="/blog" className="home-header__link">
              <i className="fas fa-blog"></i> Blog
            </Link>
            <Link to="/contact-us" className="home-header__link">
              <i className="fas fa-envelope"></i> Contact
            </Link>
          </nav>

          <button 
            className="home-header__hamburger" 
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            aria-label="Toggle navigation"
          >
            <i className={`fas ${isMobileNavOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        </div>
      </header>
      <section id="home" className="home">
        <div className="hero-combined">
          <div className="hero-image-text">
            <img
              src="https://static.vecteezy.com/system/resources/previews/013/758/401/non_2x/online-medicine-patient-call-doctor-via-internet-free-vector.jpg"
              alt="Telemedicine Consultation"
              className="hero-img-large"
            />
            <div className="hero-content">
              <h1>
                <span>Instant</span> Care, <span>Anywhere</span>, Anytime.
              </h1>
              <p>
                Welcome to MediQuick, your trusted telemedicine platform for quick and reliable medical consultations. Connect with doctors, get prescriptions, and manage your health—all from the comfort of your home.
              </p>
              <Link to="/about">
                <button className="button">Learn More</button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="role" className="card roles-section">
        <div className="box-container roles-row container-row">
          <h1 className="roles-heading">Select your role</h1>
          <div className="roles-cards-container" role="list" aria-label="role cards">
            {[
              { role: 'Doctor', link: '/doctor/form', icon: 'https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png' },
              { role: 'Patient', link: '/patient/form', icon: 'https://icons.veryicon.com/png/o/healthcate-medical/two-color-icon-of-simple-medical-project/patient-4.png' },
              { role: 'Admin', link: '/admin/form', icon: 'https://icons.veryicon.com/png/o/miscellaneous/small-icons-1/supplier-15.png' },
              { role: 'Employee', link: '/employee/form', icon: 'https://icons.veryicon.com/png/o/business/erp-system-background-icon/employee-turnover.png' },
              { role: 'Supplier', link: '/supplier/form', icon: 'https://icons.veryicon.com/png/o/miscellaneous/small-icons-1/supplier-15.png' },
            ].map(({ role, link, icon }) => (
              <article key={role} className="box role-card shadow-medium fade-up" role="listitem">
                <div className="card-top-strip" aria-hidden="true" />
                <div className="role-avatar">
                  <img src={icon} alt={`${role} Icon`} />
                </div>
                <div className="content">
                  <h2>{role}</h2>
                  <p className="role-sub">Sign in / Register as a {role.toLowerCase()}</p>
                  <Link to={link} className="link-center">
                    <button className="button select-btn" aria-label={`Select ${role}`}>Select</button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="review" className="review">
        <h1 className="heading">Patient & Doctor Reviews</h1>
        <h3 className="title">What our users say about MediQuick</h3>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.6rem', color: '#6b7280' }}>
            Loading reviews...
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', fontSize: '1.6rem', color: '#6b7280' }}>
            No reviews yet. Be the first to share your experience!
          </div>
        ) : (
          <div className="box-container">
            {reviews.map((review) => (
              <div key={review._id} className="box">
                <i className="fas fa-quote-left"></i>
                <div style={{ margin: '1rem 0', fontSize: '2rem' }}>
                  {renderStars(review.rating)}
                </div>
                <p>{review.reviewText}</p>
                <div className="images">
                  <img
                    src="https://www.oneeducation.org.uk/wp-content/uploads/2020/06/cool-profile-icons-69.png"
                    alt="Reviewer Profile Icon"
                  />
                  <div className="info">
                    <h3>{review.userName}</h3>
                    <span style={{ fontSize: '1.3rem', color: '#6b7280' }}>
                      {review.userType} • {formatDate(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="faq-header">
        <h1 className="heading">How can we help you?</h1>
        <p>
          We are here to answer all your <span className="faq-link">Frequently Asked Questions</span>
        </p>
      </div>

      <FAQ />
    </>
  );
}

export default Home;