import React from 'react';
import './AboutUs.css';

const AboutUs = () => {
  return (
    <div className="about-us-container">
      <div className="about-us-content">
        <section className="mission-section">
          <h2>About MediQuick</h2>
          <h3>Our Mission</h3>
          <p>
            At MediQuick Healthcare, we are committed to revolutionizing healthcare delivery through 
            innovative digital solutions. Our platform bridges the gap between patients, doctors, 
            and healthcare providers, ensuring accessible, efficient, and quality medical care for everyone.
          </p>
        </section>

        <section className="services-section">
          <h2>What We Offer</h2>
          <div className="services-grid">
            <div className="service-card">
              <h3>Online Consultations</h3>
              <p>Connect with qualified doctors from the comfort of your home through our secure video consultation platform.</p>
            </div>
            <div className="service-card">
              <h3>Appointment Booking</h3>
              <p>Easy and convenient appointment scheduling with your preferred healthcare providers.</p>
            </div>
            <div className="service-card">
              <h3>Medicine Ordering</h3>
              <p>Order prescribed medications online with reliable delivery to your doorstep.</p>
            </div>
            <div className="service-card">
              <h3>Health Records</h3>
              <p>Secure digital storage and management of your medical records and prescriptions.</p>
            </div>
            <div className="service-card">
              <h3>Expert Blogs</h3>
              <p>Access valuable health information and tips from our medical professionals.</p>
            </div>
            <div className="service-card">
              <h3>24/7 Support</h3>
              <p>Round-the-clock customer support to assist you with any healthcare needs.</p>
            </div>
          </div>
        </section>

        <section className="team-section">
          <h2>Our Team</h2>
          <p>
            Our diverse team consists of experienced healthcare professionals, skilled developers, 
            and dedicated support staff working together to provide the best possible healthcare experience. 
            We are passionate about leveraging technology to improve health outcomes and make healthcare 
            more accessible to everyone.
          </p>
        </section>

        <section className="values-section">
          <h2>Our Values</h2>
          <div className="values-grid">
            <div className="value-item">
              <h4>Patient-Centered Care</h4>
              <p>Every decision we make prioritizes patient safety, comfort, and satisfaction.</p>
            </div>
            <div className="value-item">
              <h4>Innovation</h4>
              <p>We continuously embrace new technologies to enhance healthcare delivery.</p>
            </div>
            <div className="value-item">
              <h4>Trust & Security</h4>
              <p>Your health data is protected with the highest standards of security and privacy.</p>
            </div>
            <div className="value-item">
              <h4>Accessibility</h4>
              <p>Quality healthcare should be available to everyone, regardless of location or circumstance.</p>
            </div>
          </div>
        </section>

        <section className="contact-cta">
          <h2>Join Our Healthcare Community</h2>
          <p>
            Ready to experience the future of healthcare? Join thousands of satisfied patients 
            and healthcare providers who trust MediQuick Healthcare for their medical needs.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;