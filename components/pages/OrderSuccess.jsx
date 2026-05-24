import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { getToken, removeToken } from '../../utils/authUtils';
import '../../assets/css/OrderSuccess.css';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const paymentMethod = searchParams.get('paymentMethod') || 'cod';
    const [orderDetails, setOrderDetails] = useState(null);
    
    useEffect(() => {
        if (window.updateCartCount) window.updateCartCount();
        
        // Fetch order details for display
        fetchOrderDetails();
    }, []);

    const fetchOrderDetails = async () => {
        try {
            const token = getToken();
            const API = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API}/patient/api/session-order-details`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            
            if (response.status === 401) {
                removeToken();
                navigate('/patient/form');
                return;
            }
            
            // Session is cleared after payment - 404 is expected
            if (response.status === 404) {
                console.log('Session order details not available (already processed)');
                return;
            }
            
            if (response.ok) {
                const data = await response.json();
                setOrderDetails(data.orderDetails);
            }
        } catch (error) {
            // Silently handle errors since order details are optional on success page
            console.log('Order details not available:', error.message);
        }
    };

    return (
        <>
            <div className="order-success-container">
                <div className="success-card">
                    <div className="success-icon-wrapper">
                        <div className="success-icon">
                            <i className="fas fa-check-circle"></i>
                        </div>
                    </div>
                    
                    <h1 className="success-title">Order Placed Successfully!</h1>
                    
                    <p className="success-message">
                        Thank you for your order. Your medicines will be delivered to your address shortly.
                    </p>
                    
                    <div className="order-status-card">
                        <div className="status-header">
                            <i className="fas fa-check-circle"></i>
                            <span>Order Confirmed</span>
                        </div>
                        <p className="status-text">
                            {paymentMethod === 'cod' ? (
                                'Order Placed Successfully - Cash on Delivery'
                            ) : (
                                'Order Placed Successfully - Payment Completed'
                            )}
                        </p>
                        {orderDetails && (
                            <div className="order-summary">
                                <div className="order-item">
                                    <span>Order Total:</span>
                                    <span className="amount">₹{orderDetails.finalTotal?.toFixed(2) || '0.00'}</span>
                                </div>
                                <div className="order-item">
                                    <span>Payment Method:</span>
                                    <span className={`payment-method ${paymentMethod}`}>
                                        {paymentMethod === 'cod' ? 'Cash on Delivery' : 
                                         paymentMethod === 'upi' ? 'UPI Payment' : 'Card Payment'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="info-grid">
                        <div className="info-card delivery-info">
                            <div className="info-icon">
                                <i className="fas fa-shipping-fast"></i>
                            </div>
                            <h6>Fast Delivery</h6>
                            <p>Expected delivery: 2-3 business days</p>
                        </div>
                        <div className="info-card support-info">
                            <div className="info-icon">
                                <i className="fas fa-headset"></i>
                            </div>
                            <h6>24/7 Support</h6>
                            <p>Need help? Contact our support team</p>
                        </div>
                        <div className="info-card tracking-info">
                            <div className="info-icon">
                                <i className="fas fa-map-marker-alt"></i>
                            </div>
                            <h6>Order Tracking</h6>
                            <p>Track your order in real-time</p>
                        </div>
                    </div>

                    <div className="action-buttons">
                        <Link to="/patient/dashboard" className="btn btn-primary">
                            <i className="fas fa-home"></i>
                            Go to Dashboard
                        </Link>
                        <Link to="/patient/order-medicines" className="btn btn-outline">
                            <i className="fas fa-shopping-cart"></i>
                            Continue Shopping
                        </Link>
                    </div>

                    <div className="security-info">
                        <i className="fas fa-shield-alt"></i>
                        <span>Your order and payment information is secure and encrypted</span>
                    </div>
                </div>
            </div>
        </>
    );
};

export default OrderSuccess;