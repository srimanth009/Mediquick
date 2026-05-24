import React, { useState } from 'react';
import './FAQs.css';

const FAQs = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqData = [
    {
      question: "How do I book an appointment with a doctor?",
      answer: "You can book an appointment by logging into your patient account, navigating to the 'Book Appointment' section, selecting your preferred doctor and available time slot. You'll receive a confirmation email once your appointment is scheduled."
    },
    {
      question: "Is online consultation safe and secure?",
      answer: "Yes, our platform uses end-to-end encryption for all video consultations. Your medical data is protected with industry-standard security measures, and all our doctors are verified healthcare professionals."
    },
    {
      question: "How do I order medicines online?",
      answer: "After receiving a prescription from your doctor, you can visit the 'Order Medicines' section, search for your prescribed medications, add them to your cart, and proceed to checkout. We'll deliver your medicines to your registered address."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, net banking, UPI payments, and digital wallets. All transactions are processed through secure payment gateways."
    },
    {
      question: "How can I access my medical records?",
      answer: "Your medical records, prescriptions, and appointment history are available in your patient dashboard. You can view, download, or share them with other healthcare providers as needed."
    },
    {
      question: "What if I need to cancel or reschedule an appointment?",
      answer: "You can cancel or reschedule appointments up to 2 hours before the scheduled time through your patient dashboard. For emergency situations, please contact our support team immediately."
    },
    {
      question: "Do you provide emergency medical services?",
      answer: "While we offer 24/7 online consultations, for medical emergencies, please contact your local emergency services or visit the nearest hospital. Our platform is designed for non-emergency consultations and routine healthcare needs."
    },
    {
      question: "How do I register as a new patient?",
      answer: "Click on 'Patient Registration' on our homepage, fill in your personal details, verify your email and phone number, and create a secure password. Once registered, you can start booking appointments and accessing our services."
    },
    {
      question: "Are my consultations confidential?",
      answer: "Absolutely. All consultations are strictly confidential and follow medical privacy regulations. Your personal health information is only accessible to you and your treating physician."
    },
    {
      question: "What should I do if I have technical issues during a video consultation?",
      answer: "If you experience technical difficulties, try refreshing your browser or switching to a different device. Our technical support team is available 24/7 to assist you. You can also reschedule the consultation if the issue persists."
    },
    {
      question: "How long does medicine delivery take?",
      answer: "Standard delivery takes 2-3 business days within the city and 3-5 business days for other locations. We also offer same-day delivery for urgent medications in select areas."
    },
    {
      question: "Can I get a second opinion from another doctor?",
      answer: "Yes, you can book consultations with multiple doctors on our platform. We encourage seeking second opinions for complex medical conditions. You can share your previous consultation records with the new doctor."
    }
  ];

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="faqs-container">
      <div className="faqs-content">
        <div className="faqs-list">
          <h2 className="page-heading">MediQuick - Frequently Asked Questions</h2>
          {faqData.map((faq, index) => (
            <div key={index} className={`faq-item ${activeIndex === index ? 'active' : ''}`}>
              <button 
                className="faq-question"
                onClick={() => toggleFAQ(index)}
                aria-expanded={activeIndex === index}
              >
                <span>{faq.question}</span>
                <span className={`faq-icon ${activeIndex === index ? 'rotated' : ''}`}>+</span>
              </button>
              <div className={`faq-answer ${activeIndex === index ? 'expanded' : ''}`}>
                <p>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="contact-support">
          <h2>Still Have Questions?</h2>
          <p>
            If you couldn't find the answer you're looking for, our support team is here to help. 
            Contact us through any of the following methods:
          </p>
          <div className="support-methods">
            <div className="support-method">
              <h4>📞 Phone Support</h4>
              <p>+1-800-FDFED-CARE (24/7)</p>
            </div>
            <div className="support-method">
              <h4>📧 Email Support</h4>
              <p>support@fdfed-healthcare.com</p>
            </div>
            <div className="support-method">
              <h4>💬 Live Chat</h4>
              <p>Available on our website (9 AM - 9 PM)</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FAQs;