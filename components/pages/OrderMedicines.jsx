import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MedicineHeader from '../common/MedicineHeader';
import { showMessage, getToastClass } from '../../utils/alerts';
import { getToken, removeToken } from '../../utils/authUtils';
import '../../assets/css/OrderMedicines.css';

const OrderMedicines = () => {
    const navigate = useNavigate();
    const [allMedicines, setAllMedicines] = useState([]);
    const [filteredMedicines, setFilteredMedicines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [quantities, setQuantities] = useState({});

    useEffect(() => {
        fetchMedicines();
    }, []);

    useEffect(() => {
        filterMedicines(searchQuery, allMedicines);
    }, [searchQuery, allMedicines]);

    const fetchMedicines = async () => {
        setLoading(true);
        try {
            const token = getToken();
            // Using the API endpoint for searching all medicines
            const API = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API}/medicine/search?query=`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.status === 401) {
                removeToken();
                navigate('/patient/form');
                return;
            }
            
            const data = await response.json();

            if (data.success && data.medicines) {
                setAllMedicines(data.medicines);
            } else {
                setAllMedicines([]);
                showMessage(data.message || 'No medicines found.', getToastClass('info'));
            }

        } catch (err) {
            console.error('Error fetching medicines:', err);
            showMessage('Failed to load medicines. Please try again.', getToastClass('danger'));
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const filterMedicines = (query, medicinesList) => {
        if (!query) {
            setFilteredMedicines(medicinesList);
            return;
        }

        const lowerCaseQuery = query.toLowerCase();
        const filtered = medicinesList.filter(m => 
            (m.name || '').toLowerCase().includes(lowerCaseQuery) ||
            (m.medicineID || '').toLowerCase().includes(lowerCaseQuery) ||
            (m.manufacturer || '').toLowerCase().includes(lowerCaseQuery)
        ); 

        setFilteredMedicines(filtered);
    };

    const handleAddToCart = async (medicineId) => {
        const quantity = quantities[medicineId] || 1;
        const medicine = allMedicines.find(m => m._id === medicineId);
        const max = medicine?.quantity || 1;

        if (quantity < 1 || quantity > max) {
            showMessage(`Please enter a valid quantity (1-${max})`, getToastClass('warning'));
            return;
        }

        try {
            const token = getToken();
            const API = import.meta.env.VITE_API_URL;
            const response = await fetch(`${API}/patient/api/add-to-cart`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ medicineId, quantity })
            });

            if (response.status === 401) {
                removeToken();
                navigate('/patient/form');
                return;
            }

            const data = await response.json();

            if (response.ok) {
                showMessage(data.message || `${quantity} item(s) added to cart`, getToastClass('success'));
                if (window.updateCartCount) window.updateCartCount();
            } else {
                if (data.available !== undefined) {
                    showMessage(`Only ${data.available} available in stock`, getToastClass('warning'));
                } else {
                    showMessage(`Failed to add to cart: ${data.error || "Unknown error"}`, getToastClass('danger'));
                }
            }
        } catch (error) {
            console.error('Error adding to cart:', error);
            showMessage('Failed to add to cart. Please try again.', getToastClass('danger'));
        }
    };
    
    const renderLoading = () => (
        <div style={{ display: 'block', margin: '20px auto', textAlign: 'center' }}>
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getExpiryStatus = (expiryDate) => {
        const expiry = new Date(expiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 0) return { status: 'expired', class: 'expired', text: 'Expired' };
        if (daysUntilExpiry <= 30) return { status: 'expiring', class: 'expiring-soon', text: `${daysUntilExpiry} days` };
        return { status: 'good', class: 'good-expiry', text: `${daysUntilExpiry} days` };
    };

    return (
        <div className="order-medicines-page">
            <MedicineHeader />

            <div className="medicines-container">
                <div className="page-header">
                    <h1 className="page-title">Order Medicines</h1>
                    <p className="page-subtitle">Browse and order your medicines with fast delivery</p>
                </div>

                <div className="search-section">
                    <div className="search-box">
                        <input 
                            type="text" 
                            id="searchInput" 
                            className="search-input" 
                            placeholder="Search medicines by name, ID, or manufacturer..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <button className="search-btn" type="button" onClick={() => filterMedicines(searchQuery, allMedicines)}>
                            <i className="fas fa-search"></i>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner"></div>
                        <p>Loading medicines...</p>
                    </div>
                ) : (
                    <div className="medicines-grid">
                        {filteredMedicines.length === 0 ? (
                            <div className="no-results">
                                <i className="fas fa-pills fa-3x"></i>
                                <h3>No medicines found</h3> 
                                <p>Try a different keyword or check back later for new stock.</p>
                            </div>
                        ) : (
                            filteredMedicines.map(medicine => {
                                const expiryInfo = getExpiryStatus(medicine.expiryDate);
                                
                                return (
                                    <div key={medicine._id} className="medicine-card">
                                        <div className="medicine-card-body">
                                        <div className="medicine-name-banner">
                                            <h2 className="medicine-name-main">{medicine.name}</h2>
                                        </div>
                                        
                                        <div className="medicine-info-header">
                                            <div className="medicine-id-section">
                                                <span className="medicine-id-label">ID:</span>
                                                <span className="medicine-id-value">{medicine.medicineID}</span>
                                            </div>
                                            <div className={`expiry-badge ${expiryInfo.class}`}>
                                                <i className="fas fa-calendar-alt"></i>
                                                {expiryInfo.text}
                                            </div>
                                        </div>

                                        <div className="medicine-details">
                                            <div className="detail-row">
                                                <span className="label">
                                                    <i className="fas fa-industry"></i> Manufacturer:
                                                </span>
                                                <span className="value">{medicine.manufacturer}</span>
                                            </div>
                                            
                                            <div className="detail-row">
                                                <span className="label">
                                                    <i className="fas fa-calendar-check"></i> Expiry Date:
                                                </span>
                                                <span className="value">{formatDate(medicine.expiryDate)}</span>
                                            </div>
                                            
                                            <div className="detail-row">
                                                <span className="label">
                                                    <i className="fas fa-boxes"></i> Stock:
                                                </span>
                                                <span className={`value stock-${medicine.quantity > 10 ? 'good' : medicine.quantity > 0 ? 'low' : 'out'}`}>
                                                    {medicine.quantity > 0 ? `${medicine.quantity} units` : 'Out of Stock'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="price-section">
                                            <span className="price-label">Price per unit</span>
                                            <span className="price-value">₹{medicine.cost.toFixed(2)}</span>
                                        </div>

                                        {medicine.quantity > 0 ? (
                                            <div className="purchase-section">
                                                <div className="quantity-controls">
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => setQuantities(prev => ({ ...prev, [medicine._id]: Math.max(1, (prev[medicine._id] || 1) - 1) }))}
                                                    >−</button>
                                                    <input
                                                        type="number"
                                                        id={`qty-${medicine._id}`}
                                                        className="quantity-input"
                                                        value={quantities[medicine._id] || 1}
                                                        min="1"
                                                        max={medicine.quantity}
                                                        readOnly
                                                        onChange={() => {}}
                                                    />
                                                    <button
                                                        className="qty-btn"
                                                        onClick={() => setQuantities(prev => ({ ...prev, [medicine._id]: Math.min(medicine.quantity, (prev[medicine._id] || 1) + 1) }))}
                                                    >+</button>
                                                </div>
                                                
                                                <button 
                                                    className="add-to-cart-btn" 
                                                    onClick={() => handleAddToCart(medicine._id)}
                                                    disabled={medicine.quantity === 0}
                                                >
                                                    <i className="fas fa-cart-plus"></i>
                                                    Add to Cart
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="out-of-stock-section">
                                                <button className="out-of-stock-btn" disabled>
                                                    <i className="fas fa-times-circle"></i>
                                                    Out of Stock
                                                </button>
                                            </div>
                                        )}

                                        <Link to={`/patient/medicines/${medicine._id}`} className="view-details-btn">
                                            <i className="fas fa-eye"></i>
                                            View Details
                                        </Link>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderMedicines;