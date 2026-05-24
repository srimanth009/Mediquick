import { Link } from 'react-router-dom';
import '../../assets/css/home_page.css';

function Footer() {
  return (
    <footer className="footer">
      <div className="box">
        <h2 className="logo">
          <span>M</span>edi<span>Q</span>uick
        </h2>
        <p>
          Your trusted healthcare partner, providing seamless access to online consultations, appointment bookings,
          and medicine deliveries, ensuring a hassle-free medical experience.
        </p>
      </div>
      <div className="box">
        <h2 className="logo">
          <span>S</span>hare
        </h2>
        <a href="mailto:mediquick2025@gmail.com">Email</a>
        <a href="https://www.facebook.com/share/1568c6qDuW/">Facebook</a>
        <a href="https://www.instagram.com/mediquick2025?igsh=MXVqaDRkY2xvNGJsZg==">Instagram</a>
        <a href="https://www.linkedin.com/in/medi-quick-437318355?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app">LinkedIn</a>
      </div>
      <div className="box">
        <h2 className="logo">
          <span>L</span>inks
        </h2>
        <Link to="/">Home</Link>
        <Link to="/about-us">About Us</Link>
        <Link to="/faqs">FAQ's</Link>
        <Link to="/contact-us">Contact Us</Link>
        <Link to="/blog">Blog</Link>
        <a href="/privacy">Privacy Policy</a>
        <a href="/terms">Terms & Conditions</a>
      </div>
      <h1 className="credit">Created by <span>Team MediQuick</span> all rights reserved.</h1>
    </footer>
  );
}

export default Footer;