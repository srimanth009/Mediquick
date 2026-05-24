import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import '../../assets/css/DoctorProfilePatient.css';
import { getToken } from '../../utils/authUtils';

const DoctorProfilePatient = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Local state instead of Redux
    const [doctor, setDoctor] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [bookedSlots, setBookedSlots] = useState({});
    const [slotsLoading, setSlotsLoading] = useState(false);
    const [booking, setBooking] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [bookingError, setBookingError] = useState(null);
    
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');

    // Get type from query params
    const searchParams = new URLSearchParams(location.search);
    const type = searchParams.get('type') || 'offline'; // Default to offline if not specified
    const isOnlineConsultation = type === 'online';

    // Generate dates for next 14 days
    const generateDates = () => {
        const dates = [];
        const today = new Date();
        
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            dates.push({
                display: `${date.toLocaleString('en-US', { weekday: 'short' })} ${date.getDate()}`,
                value: date.toISOString().split("T")[0],
                dateObj: date
            });
        }
        return dates;
    };

    const dates = generateDates();

    // Define all possible slots
    const allSlots = {
        morning: ["09:00 AM", "09:15 AM", "09:30 AM", "09:45 AM", "10:00 AM", "10:15 AM", "10:30 AM", "10:45 AM", "11:00 AM", "11:15 AM", "11:30 AM"],
        afternoon: ["02:00 PM", "02:15 PM", "02:30 PM", "02:45 PM", "03:00 PM", "03:15 PM", "03:30 PM", "03:45 PM"],
        evening: ["06:00 PM", "06:15 PM", "06:30 PM", "06:45 PM", "07:00 PM", "07:15 PM", "07:30 PM", "07:45 PM"]
    };

    // Calculate available slots using useMemo to prevent race conditions
    const availableSlots = useMemo(() => {
        if (!selectedDate) {
            return {
                morning: [],
                afternoon: [],
                evening: []
            };
        }

        const selectedDateObj = new Date(selectedDate);
        const now = new Date();
        const isToday = selectedDateObj.toDateString() === now.toDateString();
        const dateStr = selectedDateObj.toISOString().split("T")[0];
        
        // Get booked slots from state (after fetch completes)
        const key = `${id}-${dateStr}`;
        const bookedSlotsForDate = bookedSlots[key] || [];
        
        const filterSlots = (slots) => {
            return slots.map(slot => {
                const isBooked = bookedSlotsForDate.includes(slot);
                let isPast = false;
                
                if (isToday) {
                    const [time, period] = slot.split(' ');
                    let [hours, minutes] = time.split(':').map(Number);
                    
                    if (period === 'PM' && hours !== 12) hours += 12;
                    if (period === 'AM' && hours === 12) hours = 0;
                    
                    const slotTime = new Date(selectedDateObj);
                    slotTime.setHours(hours, minutes, 0, 0);
                    isPast = slotTime <= now;
                }
                
                return {
                    time: slot,
                    booked: isBooked,
                    past: isPast,
                    disabled: isBooked || isPast
                };
            });
        };

        return {
            morning: filterSlots(allSlots.morning),
            afternoon: filterSlots(allSlots.afternoon),
            evening: filterSlots(allSlots.evening)
        };
    }, [selectedDate, bookedSlots, id]);

    useEffect(() => {
        fetchDoctorProfile();
        return () => {
            // Cleanup
            setDoctor(null);
            setBookingSuccess(false);
            setBookingError(null);
        };
    }, [id]);

    useEffect(() => {
        if (selectedDate) {
            // Fetch booked slots when date changes
            fetchBookedSlotsForDate(selectedDate);
        }
    }, [selectedDate, id, isOnlineConsultation]);

    // Fetch doctor profile from backend
    const fetchDoctorProfile = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken('patient');
            const API = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API}/patient/api/doctor/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch doctor profile');
            }
            
            const data = await response.json();
            setDoctor(data);
        } catch (err) {
            console.error('Error fetching doctor:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Fetch booked slots from backend
    const fetchBookedSlotsForDate = async (date) => {
        setSlotsLoading(true);
        try {
            const token = getToken('patient');
            const consultationType = isOnlineConsultation ? 'online' : 'offline';
            const API = import.meta.env.VITE_API_URL;
            const response = await fetch(
                `${API}/appointment/api/booked-slots?doctorId=${id}&date=${date}&type=${consultationType}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch booked slots');
            }
            
            const slots = await response.json();
            const key = `${id}-${date}`;
            setBookedSlots(prev => ({ ...prev, [key]: slots }));
        } catch (err) {
            console.error('Error fetching booked slots:', err);
        } finally {
            setSlotsLoading(false);
        }
    };

    useEffect(() => {
        console.log("Payment modal state changed:", showPaymentModal);
    }, [showPaymentModal]);

    useEffect(() => {
        if (bookingSuccess) {
            setShowPaymentModal(false);
            alert(`Appointment booked successfully! ${isOnlineConsultation ? 'Online Consultation' : 'Clinic Visit'}\nPayment Method: ${paymentMethod}`);
            setTimeout(() => {
                navigate('/patient/dashboard');
            }, 2000);
        }
    }, [bookingSuccess, isOnlineConsultation, paymentMethod, navigate]);

    useEffect(() => {
        if (bookingError) {
            alert(bookingError);
            // Refresh slots if booking failed
            if (selectedDate) {
                fetchBookedSlotsForDate(selectedDate);
            }
        }
    }, [bookingError, id, selectedDate, isOnlineConsultation]);

    useEffect(() => {
        if (doctor && dates.length > 0 && !selectedDate) {
            setSelectedDate(dates[0].value);
        }
    }, [doctor]);

    const handleDateSelect = (dateValue) => {
        setSelectedDate(dateValue);
        setSelectedTime(''); // Reset time when date changes
    };

    const handleTimeSelect = (time) => {
        if (!time.disabled) {
            setSelectedTime(time.time);
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedDate || !selectedTime) {
            alert("Please select a valid date and time slot.");
            return;
        }

        console.log("Opening payment modal..."); // Debug log
        // Show payment modal instead of directly booking
        setShowPaymentModal(true);
    };

    const handleConfirmPayment = async () => {
        if (!paymentMethod) {
            alert("Please select a payment method.");
            return;
        }

        // Book appointment via direct API call
        setBooking(true);
        setBookingError(null);
        try {
            const token = getToken('patient');
            const API = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API}/appointment/appointments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    doctorId: id,
                    date: selectedDate,
                    time: selectedTime.replace(/ \(.*\)$/, ''),
                    type: isOnlineConsultation ? 'online' : 'offline',
                    notes: '',
                    modeOfPayment: paymentMethod
                })
            });
            
            console.log('=== BOOKING REQUEST ===');
            console.log('Selected Date (string):', selectedDate);
            console.log('Selected Date type:', typeof selectedDate);
            console.log('Selected Time:', selectedTime);
            console.log('Doctor ID:', id);
            console.log('======================');
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || errorData.message || 'Failed to book appointment');
            }
            
            setBookingSuccess(true);
        } catch (err) {
            console.error('Error booking appointment:', err);
            setBookingError(err.message);
        } finally {
            setBooking(false);
        }
    };

    const handleCancelPayment = () => {
        setShowPaymentModal(false);
        setPaymentMethod('');
    };

    const closeProfile = () => {
        navigate(isOnlineConsultation ? '/patient/book-doc-online' : '/patient/book-appointment');
    };

    if (loading) {
        return (
            <div className="doctor-profile-patient">
                <div className="loading">Loading doctor profile...</div>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="doctor-profile-patient">
                <div className="error-message">Doctor data is unavailable.</div>
            </div>
        );
    }

    return (
        <div className="doctor-profile-patient">
            <header>
                <Link to="/" className="logo">
                    <span>M</span>edi<span>Q</span>uick
                </Link>
                <nav className="navbar">
                    <ul>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/faqs">FAQs</Link></li>
                        <li><Link to="/blogs">Blog</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li>
                            <Link to="/patient/profile">
                                <img 
                                    src="https://static.thenounproject.com/png/638636-200.png" 
                                    alt="Profile" 
                                    height="30" 
                                    width="30" 
                                />
                            </Link>
                        </li>
                    </ul>
                </nav>
            </header>

            <div className="container">
                {error && <div className="error-message">{error}</div>}
                <div className="left-section">
                    <div className="close-btn" onClick={closeProfile}>
                        <i className="fas fa-times"></i>
                    </div>
                    <div className="doctor-info">
                        <img 
                            src={
                                doctor.image || doctor.profilePhoto
                                  ? (doctor.image || doctor.profilePhoto).startsWith('http') 
                                    ? (doctor.image || doctor.profilePhoto)
                                    : (() => {
                                        const API = import.meta.env.VITE_API_URL;
                                        return `${API}${(doctor.image || doctor.profilePhoto).startsWith('/') ? '' : '/'}${doctor.image || doctor.profilePhoto}`;
                                      })()
                                  : 'https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png'
                            } 
                            alt="Doctor"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png';
                            }}
                        />
                        <div className="details">
                            <h2>Dr. {doctor.name}</h2>
                            <p className="specialty">
                                <strong>Specialization:</strong> {doctor.specialization}
                            </p>
                            <p><strong>Experience:</strong> {doctor.experience}</p>
                            <p><strong>Qualification:</strong> {doctor.qualifications}</p>
                            <p><strong>Languages:</strong> {doctor.languages}</p>
                            <p className="location">
                                <strong>Location:</strong> {doctor.location}
                            </p>
                            <p className="fee">
                                <strong>Consultation Fee:</strong> ₹{doctor.consultationFee}
                            </p>
                            {doctor.averageRating > 0 && (
                                <p className="rating">
                                    <strong>Rating:</strong> ⭐ {doctor.averageRating}/10 
                                    <span style={{color: '#666', fontSize: '0.9em'}}> ({doctor.totalReviews} {doctor.totalReviews === 1 ? 'review' : 'reviews'})</span>
                                </p>
                            )}
                            <div className={`appointment-type ${isOnlineConsultation ? 'online' : 'offline'}`}>
                                <strong>Appointment Type:</strong> {isOnlineConsultation ? 'Online Consultation' : 'Clinic Visit'}
                            </div>
                        </div>
                    </div>
                    <div className="doctor-details">
                        <h3>About Doctor</h3>
                        <p>{doctor.about}</p>
                    </div>
                    <div className="reviews">
                        <h3>Patient Reviews & Ratings</h3>
                        {doctor.reviews && doctor.reviews.length > 0 ? (
                            doctor.reviews.map((review, index) => (
                                <div key={index} className="review" style={{marginBottom: '15px', padding: '12px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#f9f9f9'}}>
                                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                                        <p style={{margin: 0}}><strong>{review.patientName}</strong></p>
                                        <span style={{backgroundColor: '#ffd700', padding: '4px 10px', borderRadius: '12px', fontSize: '0.9em', fontWeight: 'bold'}}>
                                            ⭐ {review.rating}/10
                                        </span>
                                    </div>
                                    <p style={{margin: '8px 0 0 0', color: '#555', lineHeight: '1.5'}}>{review.comment}</p>
                                    {review.reviewedAt && (
                                        <p style={{margin: '8px 0 0 0', fontSize: '0.85em', color: '#999'}}>
                                            {new Date(review.reviewedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p style={{color: '#999', fontStyle: 'italic'}}>No reviews available yet. Be the first to leave a review!</p>
                        )}
                    </div>
                </div>

                <div className="right-section">
                    <h2 className="heading">
                        {isOnlineConsultation ? 'Online Consultation' : 'Clinic Visit'}
                    </h2>
                    <div className="appointment-slots">
                        <p>Available Slots</p>
                        <div className="date-selection">
                            {dates.map((date, index) => (
                                <button
                                    key={index}
                                    className={selectedDate === date.value ? 'selected' : ''}
                                    onClick={() => handleDateSelect(date.value)}
                                >
                                    {date.display}
                                </button>
                            ))}
                        </div>

                        <div className="slots">
                            <h3>MORNING SLOTS</h3>
                            {availableSlots.morning.map((slot, index) => (
                                <button
                                    key={index}
                                    className={selectedTime === slot.time ? 'selected' : ''}
                                    disabled={slot.disabled}
                                    onClick={() => handleTimeSelect(slot)}
                                >
                                    {slot.time}
                                    {slot.booked && " (Not Available)"}
                                    {slot.past && " (Past)"}
                                </button>
                            ))}
                        </div>

                        <div className="slots">
                            <h3>AFTERNOON SLOTS</h3>
                            {availableSlots.afternoon.map((slot, index) => (
                                <button
                                    key={index}
                                    className={selectedTime === slot.time ? 'selected' : ''}
                                    disabled={slot.disabled}
                                    onClick={() => handleTimeSelect(slot)}
                                >
                                    {slot.time}
                                    {slot.booked && " (Not Available)"}
                                    {slot.past && " (Past)"}
                                </button>
                            ))}
                        </div>

                        <div className="slots">
                            <h3>EVENING SLOTS</h3>
                            {availableSlots.evening.map((slot, index) => (
                                <button
                                    key={index}
                                    className={selectedTime === slot.time ? 'selected' : ''}
                                    disabled={slot.disabled}
                                    onClick={() => handleTimeSelect(slot)}
                                >
                                    {slot.time}
                                    {slot.booked && " (Not Available)"}
                                    {slot.past && " (Past)"}
                                </button>
                            ))}
                        </div>

                        <button 
                            className={`book-btn ${isOnlineConsultation ? 'online-btn' : 'offline-btn'}`}
                            onClick={handleBookAppointment}
                            disabled={booking || !selectedDate || !selectedTime}
                        >
                            {booking ? "Booking..." : 
                             isOnlineConsultation ? "Start Online Consultation" : "Book Appointment"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="payment-modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 9999
                }} onClick={(e) => {
                    // Close modal if clicking on overlay
                    if (e.target.className === 'payment-modal-overlay') {
                        handleCancelPayment();
                    }
                }}>
                    <div className="payment-modal" style={{
                        backgroundColor: 'white',
                        borderRadius: '1.5rem',
                        width: '90%',
                        maxWidth: '55rem',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        boxShadow: '0 1rem 3rem rgba(0, 0, 0, 0.3)'
                    }}>
                        <div className="payment-header">
                            <h2>Payment</h2>
                            <button className="close-modal" onClick={handleCancelPayment}>
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        
                        <div className="payment-details">
                            <div className="appointment-summary">
                                <h3>Appointment Summary</h3>
                                <p><strong>Doctor:</strong> Dr. {doctor.name}</p>
                                <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</p>
                                <p><strong>Time:</strong> {selectedTime}</p>
                                <p><strong>Type:</strong> {isOnlineConsultation ? 'Online Consultation' : 'Clinic Visit'}</p>
                                <p className="total-amount"><strong>Amount:</strong> ₹{doctor.consultationFee}</p>
                            </div>

                            <div className="payment-methods">
                                <h3>Select Payment Method</h3>
                                <div className="payment-options">
                                    <label className={`payment-option ${paymentMethod === 'credit-card' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="credit-card"
                                            checked={paymentMethod === 'credit-card'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="payment-icon">💳</span>
                                        <span>Credit/Debit Card</span>
                                    </label>

                                    <label className={`payment-option ${paymentMethod === 'upi' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="upi"
                                            checked={paymentMethod === 'upi'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="payment-icon">📱</span>
                                        <span>UPI</span>
                                    </label>

                                    <label className={`payment-option ${paymentMethod === 'net-banking' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="net-banking"
                                            checked={paymentMethod === 'net-banking'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="payment-icon">🏦</span>
                                        <span>Net Banking</span>
                                    </label>

                                    <label className={`payment-option ${paymentMethod === 'wallet' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="wallet"
                                            checked={paymentMethod === 'wallet'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="payment-icon">💰</span>
                                        <span>Wallet</span>
                                    </label>

                                    <label className={`payment-option ${paymentMethod === 'cash' ? 'selected' : ''}`}>
                                        <input
                                            type="radio"
                                            name="payment"
                                            value="cash"
                                            checked={paymentMethod === 'cash'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        />
                                        <span className="payment-icon">💵</span>
                                        <span>Cash (Pay at Clinic)</span>
                                    </label>
                                </div>
                            </div>

                            <div className="payment-actions">
                                <button 
                                    className="cancel-payment-btn" 
                                    onClick={handleCancelPayment}
                                    disabled={booking}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="confirm-payment-btn" 
                                    onClick={handleConfirmPayment}
                                    disabled={!paymentMethod || booking}
                                >
                                    {booking ? "Processing..." : "Confirm Payment"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <footer className="footer">
                <div className="box">
                    <Link to="/" className="logo">
                        <span>M</span>edi<span>Q</span>uick
                    </Link>
                    <p>Your trusted healthcare partner for quick and reliable medical services.</p>
                </div>
                
                <div className="box">
                    <h3>Quick Links</h3>
                    <Link to="/">Home</Link>
                    <Link to="/about">About Us</Link>
                    <Link to="/faqs">FAQs</Link>
                    <Link to="/blogs">Blog</Link>
                </div>
                
                <div className="box">
                    <h3>Contact Us</h3>
                    <a href="tel:+1234567890">+123-456-7890</a>
                    <a href="mailto:support@mediquick.com">support@mediquick.com</a>
                    <a href="#">123 Health Street, Medical City</a>
                </div>
                
                <div className="credit">
                    &copy; {new Date().getFullYear()} by <span>MediQuick</span> | all rights reserved!
                </div>
            </footer>
        </div>
    );
};

export default DoctorProfilePatient;