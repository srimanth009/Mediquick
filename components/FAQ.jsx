import { useState } from 'react';
import '../assets/css/home_page.css';

function FAQ() {
  const [activeTab, setActiveTab] = useState('online');
  const [openFAQs, setOpenFAQs] = useState({});

  const faqData = {
    online: [
      {
        question: 'What is an online doctor consultation or online medical consultation?',
        answer: 'An online consultation allows you to connect with a doctor via video or chat for medical advice.',
      },
      {
        question: 'How do I consult a doctor online now?',
        answer: 'You can book an online consultation via the MediQuick website or app by selecting a doctor and time slot.',
      },
      {
        question: 'Do you provide online doctor consultation for emergencies?',
        answer: 'Online consultations are not for emergencies. Please visit a hospital or call an ambulance for urgent care.',
      },
    ],
    pharmacy: [
      {
        question: 'When will I receive my order?',
        answer: 'For any update on your order such as delivery date and time, you can get in touch with our customer service email us at mediquick2025@gmail.com with your order details.',
      },
    ],
  };

  const toggleFAQ = (index) => {
    setOpenFAQs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="faq-container">
      <div className="faq-tabs">
        {Object.keys(faqData).map((category) => (
          <button
            key={category}
            className={`tab ${activeTab === category ? 'active' : ''}`}
            data-category={category}
            onClick={() => setActiveTab(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)} Consultation
          </button>
        ))}
      </div>
      <div className="faq-content">
        {faqData[activeTab].map((faq, index) => (
          <div key={index} className="faq">
            <button className="faq-question" onClick={() => toggleFAQ(index)}>
              {faq.question}
              <span className={`arrow ${openFAQs[index] ? 'rotate' : ''}`}>&#9660;</span>
            </button>
            <div className={`faq-answer ${openFAQs[index] ? 'active' : ''}`}>
              <p>{faq.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FAQ;