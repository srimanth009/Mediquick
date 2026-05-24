import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getToken } from '../../utils/authUtils';

const MedicineHeader = () => {
    const [cartCount, setCartCount] = useState(0);

    const updateCartCount = async () => {
        try {
            const token = getToken();
            if (!token) {
                setCartCount(0);
                return;
            }
            const API = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API}/patient/api/cart/count`, { 
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                setCartCount(data.count || 0);
            }
        } catch (error) {
            console.error('Error fetching cart count:', error);
        }
    };

    // Exporting globally to allow other components (like MedicineDetail/PatientCart) to trigger an update
    useEffect(() => {
        updateCartCount();
        window.updateCartCount = updateCartCount; 
        return () => { delete window.updateCartCount; };
    }, []);

    return (
        <header style={{ backgroundColor: '#2c3e50', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', position: 'fixed', width: '100%', top: 0, zIndex: 100 }}>
            <Link to="/" className="logo" style={{ fontSize: '24px', fontWeight: 'bold', textDecoration: 'none', color: 'white' }}>
                <span style={{ color: '#0188df' }}>M</span>edi<span style={{ color: '#0188df' }}>Q</span>uick
            </Link>
            
            <nav className="navbar">
                <ul style={{ listStyle: 'none', display: 'flex', alignItems: 'center', margin: 0, padding: 0 }}>
                    <li style={{ margin: '0 15px' }}>
                        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>Home</Link>
                    </li>
                    <li style={{ margin: '0 15px' }}>
                        <Link to="/patient/order-medicines" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>Medicines</Link>
                    </li>
                    <li style={{ margin: '0 15px' }}>
                        <Link to="/patient/orders" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>Orders</Link>
                    </li>
                    <li style={{ margin: '0 15px' }}>
                        <Link to="/patient/cart" style={{ color: 'white', textDecoration: 'none', fontSize: '16px', position: 'relative' }}>
                            <i className="fas fa-shopping-cart"></i> Cart
                            <span 
                                id="cartCount" 
                                style={{
                                    position: 'absolute', top: '-8px', right: '-8px', backgroundColor: '#e74c3c', color: 'white', 
                                    borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', 
                                    display: cartCount > 0 ? 'flex' : 'none', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                {cartCount}
                            </span>
                        </Link>
                    </li>
                    <li style={{ margin: '0 15px' }}>
                        <Link to="/patient/dashboard" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>Dashboard</Link>
                    </li>
                    <li style={{ margin: '0 15px' }}>
                        <Link to="/patient/profile" style={{ color: 'white', textDecoration: 'none', fontSize: '16px' }}>
                            <img 
                                src="https://static.thenounproject.com/png/638636-200.png" 
                                alt="Profile" 
                                style={{ height: '30px', width: '30px', borderRadius: '50%' }}
                            />
                        </Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
};

export default MedicineHeader;