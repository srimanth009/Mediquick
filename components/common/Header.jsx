import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../assets/css/home_page.css';

function Header({ userType, employee, onLogout }) {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
      setIsNavOpen(false);
      setIsProfileDropdownOpen(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleNav = () => setIsNavOpen(!isNavOpen);
  const toggleProfileDropdown = () => setIsProfileDropdownOpen(!isProfileDropdownOpen);

  return (
    <header className={isScrolled ? 'header-active' : ''}>
      <Link to="/" className="logo">
        <span>M</span>edi<span>Q</span>uick
      </Link>
      
      {/* Show different nav based on user type */}
      {userType === 'employee' && employee ? (
        <div className="employee-header-section">
          <nav className={`navbar ${isNavOpen ? 'nav-toggle' : ''}`}>
            <ul>
              <li><Link to="/employee/dashboard">Dashboard</Link></li>
              <li><Link to="/employee/monitor-reviews">Monitor Reviews</Link></li>
              <li><Link to="/employee/profile">My Profile</Link></li>
            </ul>
          </nav>
          
          <div className="header-profile-section">
            <div className="header-profile-info">
              <span className="header-welcome">Welcome,</span>
              <span className="header-employee-name">{employee.name}</span>
            </div>
            <div className="header-profile-dropdown">
              <img 
                src={employee.profilePhoto || '/images/default-employee.svg'} 
                alt={employee.name}
                className="header-profile-photo"
                onClick={toggleProfileDropdown}
                onError={(e) => {
                  e.target.src = '/images/default-employee.svg';
                }}
              />
              {isProfileDropdownOpen && (
                <div className="profile-dropdown-menu">
                  <Link to="/employee/profile" className="dropdown-item">
                    <i className="fas fa-user"></i> View Profile
                  </Link>
                  <Link to="/employee/edit-profile" className="dropdown-item">
                    <i className="fas fa-edit"></i> Edit Profile
                  </Link>
                  <Link to="/employee/dashboard" className="dropdown-item">
                    <i className="fas fa-tachometer-alt"></i> Dashboard
                  </Link>
                  <hr className="dropdown-divider" />
                  <button onClick={onLogout} className="dropdown-item logout-item">
                    <i className="fas fa-sign-out-alt"></i> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
          <nav className={`navbar ${isNavOpen ? 'nav-toggle' : ''}`}>
            <ul>
              <li><Link to="/">Home</Link></li>
              <li><Link to="/about-us">About Us</Link></li>
              <li><Link to="/faqs">FAQs</Link></li>
              <li><Link to="/blog">Blog</Link></li>
              <li><Link to="/contact-us">Contact Us</Link></li>
            </ul>
          </nav>
        </>
      )}
      
      <i className={`fas ${isNavOpen ? 'fa-times' : 'fa-bars'}`} onClick={toggleNav}></i>
    </header>
  );
}

export default Header;