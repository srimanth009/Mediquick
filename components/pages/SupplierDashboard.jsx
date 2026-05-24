import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { showMessage } from '../../utils/alerts';
import '../../assets/css/SupplierDashboard.css';
import { useSupplier } from '../../context/SupplierContext';
import { getToken, removeToken } from '../../utils/authUtils';

const BASE_URL = import.meta.env.VITE_API_URL;

const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
        case 'pending':   return 'badge-pending';
        case 'confirmed': return 'badge-confirmed';
        case 'shipped':   return 'badge-shipped';
        case 'delivered': return 'badge-delivered';
        case 'cancelled': return 'badge-cancelled';
        case 'in_cart':   return 'badge-incart';
        default:          return 'badge-pending';
    }
};

const getStatusDisplayText = (status) => {
    if (!status) return 'N/A';
    if (status.toLowerCase() === 'in_cart') return 'In Cart';
    if (status.toLowerCase() === 'all') return 'All';
    return status.charAt(0).toUpperCase() + status.slice(1);
};

const SupplierDashboard = () => {
    const { supplier, logout } = useSupplier();
    const [orders, setOrders]       = useState([]);
    const [medicines, setMedicines] = useState([]);
    const [stats, setStats]         = useState({ totalMedicines: 0, pendingOrders: 0, totalRevenue: 0, cartItems: 0 });
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState('');
    const [activeOrderFilter, setActiveOrderFilter] = useState('all');
    const [activeSection, setActiveSection]           = useState('overview');
    const [sidebarOpen, setSidebarOpen]               = useState(false);
    const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
    const navigate = useNavigate();

    const getAuthHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken('supplier')}`
    });

    useEffect(() => {
        Promise.all([fetchMedicines(true), fetchOrders(true)])
            .then(() => setLoading(false))
            .catch((err) => {
                setLoading(false);
                if (err.message?.includes('Unauthorized')) navigate('/supplier/form');
            });

        const interval = setInterval(() => {
            fetchOrders(false);
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async (initialLoad = false) => {
        if (initialLoad) setError('');
        try {
            const response = await fetch(`${BASE_URL}/supplier/api/orders`, {
                headers: { 'Authorization': `Bearer ${getToken('supplier')}` }
            });
            if (!response.ok) {
                if (response.status === 401) { removeToken('supplier'); navigate('/supplier/form'); return; }
                throw new Error('Failed to fetch orders');
            }
            const data = await response.json();
            setOrders(data);
            if (initialLoad) fetchDashboardStats(data);
        } catch (err) {
            console.error('Error fetching orders:', err);
            if (initialLoad) setError('Failed to load orders.');
        }
    };

    const fetchMedicines = async (initialLoad = false) => {
        if (initialLoad) setError('');
        try {
            const response = await fetch(`${BASE_URL}/supplier/api/medicines`, {
                headers: { 'Authorization': `Bearer ${getToken('supplier')}` }
            });
            if (!response.ok) {
                if (response.status === 401) { removeToken('supplier'); navigate('/supplier/form'); return; }
                throw new Error('Failed to fetch medicines');
            }
            const data = await response.json();
            setMedicines(data);
            if (initialLoad) setStats(prev => ({ ...prev, totalMedicines: data.length }));
            return data;
        } catch (err) {
            console.error('Error fetching medicines:', err);
            if (initialLoad) setError('Failed to load medicines.');
            throw err;
        }
    };

    const fetchDashboardStats = (currentOrders) => {
        const orderList = Array.isArray(currentOrders) ? currentOrders : orders;
        const pendingOrders = orderList.filter(o => ['pending', 'confirmed', 'shipped'].includes(o.status)).length;
        const cartItems     = orderList.filter(o => o.status === 'in_cart').length;
        const totalRevenue  = orderList
            .filter(o => o.status === 'delivered')
            .reduce((s, o) => s + (o.totalCost || 0), 0);
        setStats(prev => ({ ...prev, pendingOrders, cartItems, totalRevenue }));
    };

    const addMedicine = async (event) => {
        event.preventDefault();
        const form = event.target;
        const formData = {
            name:         form.medicineName.value.trim(),
            medicineID:   form.medicineID.value.trim(),
            quantity:     parseInt(form.quantity.value),
            cost:         parseFloat(form.cost.value),
            manufacturer: form.manufacturer.value.trim(),
            expiryDate:   form.expiryDate.value,
        };
        let errors = {};
        if (!formData.name) errors.name = 'Medicine name is required';
        else if (!/^[A-Za-z][A-Za-z0-9\s\-]*$/.test(formData.name)) errors.name = 'Name must start with a letter';
        if (!formData.medicineID) errors.medicineID = 'Medicine ID is required';
        else if (!/^[A-Za-z0-9]+[A-Za-z0-9\-_]*$/.test(formData.medicineID)) errors.medicineID = 'Invalid Medicine ID format';
        if (!formData.manufacturer) errors.manufacturer = 'Manufacturer is required';
        else if (/^[0-9\s\-]+$/.test(formData.manufacturer)) errors.manufacturer = 'Manufacturer cannot be only numbers';
        if (!formData.expiryDate) errors.expiryDate = 'Expiry date is required';
        else {
            const d = new Date(formData.expiryDate);
            const t = new Date(); t.setHours(0, 0, 0, 0);
            if (d <= t) errors.expiryDate = 'Expiry date must be in the future';
        }
        if (isNaN(formData.quantity) || formData.quantity <= 0 || !Number.isInteger(formData.quantity))
            errors.quantity = 'Quantity must be a positive whole number';
        if (isNaN(formData.cost) || formData.cost <= 0)
            errors.cost = 'Cost must be a positive number';
        if (Object.keys(errors).length > 0) {
            Object.values(errors).forEach(msg => showMessage(msg, 'error'));
            return;
        }
        try {
            const response = await fetch(`${BASE_URL}/supplier/api/add-medicine`, {
                method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (response.ok) {
                showMessage(data.message || 'Medicine added successfully!', 'success');
                form.reset();
                fetchMedicines(true);
                fetchDashboardStats();
            } else {
                if (response.status === 401) { removeToken('supplier'); navigate('/supplier/form'); return; }
                showMessage(`${data.error}: ${data.details || ''}`, 'error');
            }
        } catch { showMessage('Failed to add medicine', 'error'); }
    };

    const removeMedicine = async (medicineId) => {
        if (!window.confirm('Are you sure you want to remove this medicine?')) return;
        try {
            const response = await fetch(`${BASE_URL}/supplier/api/medicines/${medicineId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken('supplier')}` }
            });
            const data = await response.json();
            if (response.ok) {
                showMessage(data.message || 'Medicine removed successfully', 'success');
                fetchMedicines(true);
                fetchDashboardStats();
            } else {
                if (response.status === 401) { removeToken('supplier'); navigate('/supplier/form'); return; }
                showMessage(data.error || 'Failed to remove medicine', 'error');
            }
        } catch { showMessage('Failed to remove medicine. Try again.', 'error'); }
    };

    const updateOrderStatus = async (orderId, status) => {
        if (!window.confirm(`Update order status to ${status}?`)) return;
        const row = document.querySelector(`tr[data-id="${orderId}"]`);
        const buttons = row?.querySelectorAll('.sd-action-btn') || [];
        buttons.forEach(btn => (btn.disabled = true));
        try {
            const response = await fetch(`${BASE_URL}/supplier/api/orders/${orderId}/status`, {
                method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify({ status })
            });
            if (response.ok) {
                showMessage('Order status updated successfully', 'success');
                fetchOrders(true);
                fetchDashboardStats();
            } else {
                if (response.status === 401) { removeToken('supplier'); navigate('/supplier/form'); return; }
                const data = await response.json();
                throw new Error(data.error || 'Failed to update order status');
            }
        } catch (err) {
            showMessage(err.message, 'error');
        } finally {
            buttons.forEach(btn => (btn.disabled = false));
        }
    };

    const viewOrderDetails = (orderId) => {
        const order = orders.find(o => o.id === orderId);
        if (!order) { alert('Order details not found.'); return; }
        let addressText = 'N/A';
        if (order.deliveryAddress) {
            if (typeof order.deliveryAddress === 'string') {
                addressText = order.deliveryAddress;
            } else if (typeof order.deliveryAddress === 'object') {
                const a = order.deliveryAddress;
                addressText = [a.street, a.city, a.state, a.pincode || a.zipcode, a.country]
                    .filter(Boolean).join(', ') || JSON.stringify(a);
            }
        }
        alert(
            `Order Details\n\nOrder ID: ${order.id}\nCustomer: ${order.patient || 'N/A'}\nEmail: ${order.patientEmail || 'N/A'}\nPhone: ${order.patientMobile || 'N/A'}\nAddress: ${addressText}\nMedicine: ${order.medicine || 'N/A'} (${order.medicineId || 'N/A'})\nQuantity: ${order.quantity || 'N/A'}\nAmount: ₹${order.totalCost || 0}\nDelivery Charge: ₹${order.deliveryCharge || 0}\nFinal Amount: ₹${order.finalAmount || order.totalCost || 0}\nPayment: ${order.paymentMethod || 'N/A'}\nStatus: ${getStatusDisplayText(order.status)}\nDate: ${order.orderDate || 'N/A'}`
        );
    };

    const getMedicineIncome = (medicineID) =>
        orders
            .filter(o => o.status === 'delivered' && o.medicineId === medicineID)
            .reduce((s, o) => s + (o.totalCost || 0), 0);

    const filteredOrders = activeOrderFilter === 'all'
        ? orders
        : orders.filter(o => o.status === activeOrderFilter);

    const handleLogout = (e) => { e.preventDefault(); logout(); };

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const hour = today.getHours();
    const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

    const navItems = [
        { id: 'overview',   label: 'Overview',     subtitle: 'Store summary and recent activity' },
        { id: 'analytics', label: 'Analytics',     subtitle: 'Order and medicine insights' },
        { id: 'orders',    label: 'Orders',        subtitle: 'Manage and update customer orders' },
        { id: 'medicines', label: 'Medicines',     subtitle: 'Your full medicine inventory' },
        { id: 'add',       label: 'Add Medicine',  subtitle: 'Add a new medicine to your catalog' },
    ];
    const activeNav = navItems.find(n => n.id === activeSection) || navItems[0];

    /* ── Analytics computations ───────────────────────────────── */
    const placedOrders = orders.filter(o => o.status !== 'in_cart');

    // Customer order frequency map
    const customerMap = {};
    placedOrders.forEach(o => {
        const name = o.patient || 'Unknown';
        if (!customerMap[name]) customerMap[name] = { name, count: 0, totalSpent: 0, lastOrder: null };
        customerMap[name].count++;
        customerMap[name].totalSpent += (o.totalCost || 0);
        const d = o.orderDate ? new Date(o.orderDate) : null;
        if (d && (!customerMap[name].lastOrder || d > customerMap[name].lastOrder))
            customerMap[name].lastOrder = d;
    });
    const customerList = Object.values(customerMap)
        .sort((a, b) => b.count - a.count);
    const topCustomer = customerList[0] || null;

    // Medicine order frequency map
    const medicineMap = {};
    placedOrders.forEach(o => {
        const key = o.medicine || 'Unknown';
        if (!medicineMap[key]) medicineMap[key] = { name: key, id: o.medicineId || '', count: 0, totalQty: 0, totalRevenue: 0 };
        medicineMap[key].count++;
        medicineMap[key].totalQty  += (o.quantity || 0);
        medicineMap[key].totalRevenue += (o.totalCost || 0);
    });
    const medicineList = Object.values(medicineMap)
        .sort((a, b) => b.count - a.count);
    const topMedicine = medicineList[0] || null;

    const formatDate = (d) => {
        if (!d) return 'N/A';
        const date = d instanceof Date ? d : new Date(d);
        if (isNaN(date)) return 'N/A';
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const daysSince = (d) => {
        if (!d) return null;
        const diff = Math.floor((Date.now() - (d instanceof Date ? d : new Date(d))) / 86400000);
        if (diff === 0) return 'Today';
        if (diff === 1) return '1 day ago';
        return `${diff} days ago`;
    };

    if (loading) {
        return (
            <div className="sd-loading">
                <div className="sd-loading-inner">
                    <div className="sd-spinner"></div>
                    <p>Loading dashboard…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sd-root" onClick={() => profileDropdownOpen && setProfileDropdownOpen(false)}>

            {/* ── SIDEBAR + CONTENT ROW ───────────── */}
            <div className="sd-body">

            {/* ── SIDEBAR ─────────────────────────── */}
            <aside className={`sd-sidebar${sidebarOpen ? ' sd-sidebar--open' : ''}`}>
                <div className="sd-sidebar-brand">
                    <span className="sd-brand-logo">M</span>
                    <span className="sd-brand-name">MediQuick</span>
                    <button className="sd-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
                </div>

                {supplier?.name && (
                    <div className="sd-sidebar-user">
                        <div className="sd-avatar">{supplier.name.charAt(0).toUpperCase()}</div>
                        <div className="sd-sidebar-user-info">
                            <div className="sd-sidebar-username">{supplier.name}</div>
                            <div className="sd-sidebar-role">Supplier</div>
                        </div>
                    </div>
                )}

                <nav className="sd-nav">
                    <div className="sd-nav-label">DASHBOARD</div>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`sd-nav-item${activeSection === item.id ? ' sd-nav-item--active' : ''}`}
                            onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                        >
                            {item.label}
                        </button>
                    ))}

                    <div className="sd-nav-divider"></div>
                    <div className="sd-nav-label">ACCOUNT</div>

                    <Link to="/supplier/profile" className="sd-nav-item">Profile</Link>
                    <button className="sd-nav-item sd-nav-item--logout" onClick={handleLogout}>Logout</button>
                </nav>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && <div className="sd-overlay" onClick={() => setSidebarOpen(false)}></div>}

            {/* ── MAIN AREA ───────────────────────── */}
            <div className="sd-main">

                {/* Page Content */}
                <main className="sd-content">

                    {/* ── ANALYTICS ─────────────────── */}
                    {activeSection === 'analytics' && (
                        <>
                            <div className="sd-section-title">
                                <h2>Analytics</h2>
                                <p>Insights into orders and medicine performance.</p>
                            </div>

                            {/* Top-level stats */}
                            <div className="sd-stats-grid">
                                <StatCard label="Total Orders" value={placedOrders.length} accent="#3b82f6" sub="Excluding cart items" />
                                <StatCard label="Unique Customers" value={customerList.length} accent="#a855f7" sub="Who placed orders" />
                                <StatCard label="Medicines Ordered" value={medicineList.length} accent="#f59e0b" sub="Distinct medicines" />
                                <StatCard label="Total Revenue" value={`₹${stats.totalRevenue.toFixed(0)}`} accent="#22c55e" sub="From delivered orders" />
                            </div>

                            {/* Two-column analytics */}
                            <div className="sd-analytics-grid">

                                {/* Customer Frequency */}
                                <div className="sd-card">
                                    <div className="sd-card-header">
                                        <div>
                                            <div className="sd-card-title">📊 Order Analytics — Customer Frequency</div>
                                            <div className="sd-card-subtitle">Who orders most often from you</div>
                                        </div>
                                        {topCustomer && (
                                            <div className="sd-analytics-champion">
                                                <div className="sd-champion-avatar">{topCustomer.name.charAt(0).toUpperCase()}</div>
                                                <div>
                                                    <div className="sd-champion-name">{topCustomer.name}</div>
                                                    <div className="sd-champion-sub">{topCustomer.count} orders · Top customer</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="sd-table-wrap">
                                        <table className="sd-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Customer</th>
                                                    <th>Orders</th>
                                                    <th>Total Spent</th>
                                                    <th>Last Order</th>
                                                    <th>Frequency</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {customerList.length === 0 ? (
                                                    <tr><td colSpan="6" className="sd-empty">No order data yet</td></tr>
                                                ) : customerList.map((c, i) => (
                                                    <tr key={c.name}>
                                                        <td>
                                                            <span className={`sd-rank-badge ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}`}>
                                                                {i + 1}
                                                            </span>
                                                        </td>
                                                        <td className="sd-bold">{c.name}</td>
                                                        <td>
                                                            <div className="sd-freq-bar-wrap">
                                                                <div className="sd-freq-bar" style={{ width: `${Math.min(100, (c.count / (topCustomer?.count || 1)) * 100)}%` }}></div>
                                                                <span className="sd-freq-num">{c.count}</span>
                                                            </div>
                                                        </td>
                                                        <td className="sd-mono">₹{c.totalSpent.toFixed(2)}</td>
                                                        <td className="sd-muted">{formatDate(c.lastOrder)}</td>
                                                        <td>
                                                            <span className={`sd-badge ${c.count >= 5 ? 'badge-delivered' : c.count >= 3 ? 'badge-confirmed' : c.count >= 2 ? 'badge-shipped' : 'badge-pending'}`}>
                                                                {c.count >= 5 ? 'High' : c.count >= 3 ? 'Medium' : c.count >= 2 ? 'Regular' : 'Low'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Medicine Analytics */}
                                <div className="sd-card">
                                    <div className="sd-card-header">
                                        <div>
                                            <div className="sd-card-title">💊 Medicine Analytics — Most Ordered</div>
                                            <div className="sd-card-subtitle">Best performing medicines by order count</div>
                                        </div>
                                        {topMedicine && (
                                            <div className="sd-analytics-champion">
                                                <div className="sd-champion-avatar sd-champion-avatar--green">🏆</div>
                                                <div>
                                                    <div className="sd-champion-name">{topMedicine.name}</div>
                                                    <div className="sd-champion-sub">{topMedicine.count} orders · Most ordered</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="sd-table-wrap">
                                        <table className="sd-table">
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Medicine</th>
                                                    <th>Orders</th>
                                                    <th>Units Sold</th>
                                                    <th>Revenue</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {medicineList.length === 0 ? (
                                                    <tr><td colSpan="5" className="sd-empty">No order data yet</td></tr>
                                                ) : medicineList.map((m, i) => (
                                                    <tr key={m.name}>
                                                        <td>
                                                            <span className={`sd-rank-badge ${i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''}`}>
                                                                {i + 1}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div className="sd-bold">{m.name}</div>
                                                            {m.id && <div className="sd-mono sd-muted" style={{fontSize:'11px'}}>{m.id}</div>}
                                                        </td>
                                                        <td>
                                                            <div className="sd-freq-bar-wrap">
                                                                <div className="sd-freq-bar sd-freq-bar--green" style={{ width: `${Math.min(100, (m.count / (topMedicine?.count || 1)) * 100)}%` }}></div>
                                                                <span className="sd-freq-num">{m.count}</span>
                                                            </div>
                                                        </td>
                                                        <td>{m.totalQty}</td>
                                                        <td className="sd-mono sd-success">₹{m.totalRevenue.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                            </div>

                            {/* Last order per customer */}
                            <div className="sd-card" style={{marginTop: '24px'}}>
                                <div className="sd-card-header">
                                    <div>
                                        <div className="sd-card-title">🕒 Last Order Time per Customer</div>
                                        <div className="sd-card-subtitle">How recently each customer placed an order</div>
                                    </div>
                                </div>
                                <div className="sd-last-order-grid">
                                    {customerList.length === 0 ? (
                                        <p className="sd-empty" style={{padding:'24px'}}>No customer data yet</p>
                                    ) : customerList.map((c) => (
                                        <div className="sd-last-order-card" key={c.name}>
                                            <div className="sd-lo-avatar">{c.name.charAt(0).toUpperCase()}</div>
                                            <div className="sd-lo-info">
                                                <div className="sd-lo-name">{c.name}</div>
                                                <div className="sd-lo-meta">{c.count} order{c.count !== 1 ? 's' : ''} · ₹{c.totalSpent.toFixed(0)} total</div>
                                            </div>
                                            <div className="sd-lo-right">
                                                <div className="sd-lo-date">{formatDate(c.lastOrder)}</div>
                                                <div className="sd-lo-ago">{daysSince(c.lastOrder)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── OVERVIEW ──────────────────── */}
                    {activeSection === 'overview' && (
                        <>
                            <div className="sd-section-title">
                                <h2>Dashboard Overview</h2>
                                <p>Here's what's happening with your store today.</p>
                            </div>

                            {/* Stats Grid */}
                            <div className="sd-stats-grid">
                                <StatCard
                                    label="Total Medicines"
                                    value={stats.totalMedicines}
                                    accent="#3b82f6"
                                    sub="In your inventory"
                                />
                                <StatCard
                                    label="Active Orders"
                                    value={stats.pendingOrders}
                                    accent="#f59e0b"
                                    sub="Pending · Confirmed · Shipped"
                                />
                                <StatCard
                                    label="Total Revenue"
                                    value={`₹${stats.totalRevenue.toFixed(0)}`}
                                    accent="#22c55e"
                                    sub="From delivered orders"
                                />
                                <StatCard
                                    label="Cart Items"
                                    value={stats.cartItems}
                                    accent="#a855f7"
                                    sub="Awaiting checkout"
                                />
                            </div>

                            {/* Summary Row */}
                            <div className="sd-summary-row">
                                <div className="sd-summary-card">
                                    <div className="sd-summary-label">Delivered Orders</div>
                                    <div className="sd-summary-value">{orders.filter(o => o.status === 'delivered').length}</div>
                                    <div className="sd-summary-sub">Successfully fulfilled</div>
                                </div>
                                <div className="sd-summary-card">
                                    <div className="sd-summary-label">Cancelled Orders</div>
                                    <div className="sd-summary-value">{orders.filter(o => o.status === 'cancelled').length}</div>
                                    <div className="sd-summary-sub">Orders cancelled</div>
                                </div>
                                <div className="sd-summary-card">
                                    <div className="sd-summary-label">Total Orders</div>
                                    <div className="sd-summary-value">{orders.filter(o => o.status !== 'in_cart').length}</div>
                                    <div className="sd-summary-sub">Across all statuses</div>
                                </div>
                            </div>

                            {/* Recent Orders Preview */}
                            <div className="sd-card">
                                <div className="sd-card-header">
                                    <div>
                                        <div className="sd-card-title">Recent Orders</div>
                                        <div className="sd-card-subtitle">Latest 5 orders across all statuses</div>
                                    </div>
                                    <button className="sd-btn-ghost" onClick={() => setActiveSection('orders')}>View All →</button>
                                </div>
                                <div className="sd-table-wrap">
                                    <table className="sd-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Medicine</th>
                                                <th>Patient</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.length === 0 ? (
                                                <tr><td colSpan="6" className="sd-empty">No orders yet</td></tr>
                                            ) : orders.slice(0, 5).map(order => (
                                                <tr key={order.id}>
                                                    <td className="sd-mono">{order.status === 'in_cart' ? 'CART-' : 'ORD-'}{String(order.id).substring(0, 8)}</td>
                                                    <td>{order.medicine || 'Unknown'}</td>
                                                    <td>{order.patient || 'Unknown'}</td>
                                                    <td className="sd-mono">₹{(order.totalCost || 0).toFixed(2)}</td>
                                                    <td><span className={`sd-badge ${getStatusBadgeClass(order.status)}`}>{getStatusDisplayText(order.status)}</span></td>
                                                    <td>{order.orderDate || 'N/A'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── ORDERS ────────────────────── */}
                    {activeSection === 'orders' && (
                        <>
                            <div className="sd-section-title">
                                <h2>Order Management</h2>
                                <p>View, filter, and update all customer orders.</p>
                            </div>
                            <div className="sd-card">
                                <div className="sd-card-header">
                                    <div>
                                        <div className="sd-card-title">All Orders</div>
                                        <div className="sd-card-subtitle">{filteredOrders.length} orders shown</div>
                                    </div>
                                </div>
                                <div className="sd-filters">
                                    {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'in_cart', 'cancelled'].map(f => (
                                        <button
                                            key={f}
                                            className={`sd-filter-pill${activeOrderFilter === f ? ' active' : ''}`}
                                            onClick={() => setActiveOrderFilter(f)}
                                        >
                                            {getStatusDisplayText(f)}
                                            {f !== 'all' && ` (${orders.filter(o => o.status === f).length})`}
                                        </button>
                                    ))}
                                </div>
                                <div className="sd-table-wrap">
                                    <table className="sd-table">
                                        <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Medicine</th>
                                                <th>Patient</th>
                                                <th>Qty</th>
                                                <th>Amount</th>
                                                <th>Status</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredOrders.length === 0 ? (
                                                <tr><td colSpan="8" className="sd-empty">No orders matching this filter</td></tr>
                                            ) : filteredOrders.map(order => (
                                                <tr key={order.id} data-id={order.id}>
                                                    <td className="sd-mono">{order.status === 'in_cart' ? 'CART-' : 'ORD-'}{String(order.id).substring(0, 8)}</td>
                                                    <td>
                                                        <span className="sd-bold">{order.medicine || 'Unknown'}</span>
                                                        <span className="sd-muted"> ({order.medicineId || 'N/A'})</span>
                                                    </td>
                                                    <td>{order.patient || 'Unknown'}</td>
                                                    <td>{order.quantity || 0}</td>
                                                    <td className="sd-mono">₹{(order.totalCost || 0).toFixed(2)}</td>
                                                    <td><span className={`sd-badge ${getStatusBadgeClass(order.status)}`}>{getStatusDisplayText(order.status)}</span></td>
                                                    <td>{order.orderDate || 'N/A'}</td>
                                                    <td>
                                                        <div className="sd-actions">
                                                            <button className="sd-action-btn sd-action-view" onClick={() => viewOrderDetails(order.id)}>View</button>
                                                            {order.status === 'confirmed' && (
                                                                <button className="sd-action-btn sd-action-ship" onClick={() => updateOrderStatus(order.id, 'shipped')}>Ship</button>
                                                            )}
                                                            {order.status === 'shipped' && (
                                                                <button className="sd-action-btn sd-action-deliver" onClick={() => updateOrderStatus(order.id, 'delivered')}>Deliver</button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── MEDICINES ─────────────────── */}
                    {activeSection === 'medicines' && (
                        <>
                            <div className="sd-section-title">
                                <h2>Medicine Inventory</h2>
                                <p>All medicines currently listed in your catalog.</p>
                            </div>
                            <div className="sd-card">
                                <div className="sd-card-header">
                                    <div>
                                        <div className="sd-card-title">Medicines</div>
                                        <div className="sd-card-subtitle">{medicines.length} items in inventory</div>
                                    </div>
                                    <button className="sd-btn-primary" onClick={() => setActiveSection('add')}>+ Add Medicine</button>
                                </div>
                                <div className="sd-table-wrap">
                                    <table className="sd-table">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>ID</th>
                                                <th>Qty</th>
                                                <th>Cost</th>
                                                <th>Manufacturer</th>
                                                <th>Expiry</th>
                                                <th>Revenue</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {medicines.length === 0 ? (
                                                <tr><td colSpan="8" className="sd-empty">No medicines found. Add one to get started.</td></tr>
                                            ) : medicines.map(med => (
                                                <tr key={med.id}>
                                                    <td className="sd-bold">{med.name}</td>
                                                    <td className="sd-mono sd-muted">{med.medicineID}</td>
                                                    <td>{med.quantity}</td>
                                                    <td className="sd-mono">₹{med.cost}</td>
                                                    <td>{med.manufacturer}</td>
                                                    <td>{med.expiryDate}</td>
                                                    <td className="sd-mono sd-success">₹{getMedicineIncome(med.medicineID).toFixed(2)}</td>
                                                    <td>
                                                        <button className="sd-action-btn sd-action-remove" onClick={() => removeMedicine(med.id)}>Remove</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* ── ADD MEDICINE ──────────────── */}
                    {activeSection === 'add' && (
                        <>
                            <div className="sd-section-title">
                                <h2>Add New Medicine</h2>
                                <p>Fill in the details to add a medicine to your inventory.</p>
                            </div>
                            <div className="sd-card sd-form-card">
                                <form onSubmit={addMedicine} className="sd-form">
                                    <div className="sd-form-grid">
                                        <div className="sd-field">
                                            <label className="sd-label">Medicine Name</label>
                                            <input className="sd-input" type="text" name="medicineName" required
                                                pattern="^[A-Za-z][A-Za-z0-9\s\-]*$"
                                                placeholder="e.g. Paracetamol 500mg" />
                                        </div>
                                        <div className="sd-field">
                                            <label className="sd-label">Medicine ID</label>
                                            <input className="sd-input" type="text" name="medicineID" required
                                                pattern="^[A-Za-z0-9]+[A-Za-z0-9\-_]*$"
                                                placeholder="e.g. MED-001" />
                                        </div>
                                        <div className="sd-field">
                                            <label className="sd-label">Quantity</label>
                                            <input className="sd-input" type="number" name="quantity"
                                                min="1" step="1" required placeholder="e.g. 100" />
                                        </div>
                                        <div className="sd-field">
                                            <label className="sd-label">Cost per unit (₹)</label>
                                            <input className="sd-input" type="number" name="cost"
                                                min="0.01" step="0.01" required placeholder="e.g. 12.50" />
                                        </div>
                                        <div className="sd-field">
                                            <label className="sd-label">Manufacturer</label>
                                            <input className="sd-input" type="text" name="manufacturer" required
                                                placeholder="e.g. Sun Pharma" />
                                        </div>
                                        <div className="sd-field">
                                            <label className="sd-label">Expiry Date</label>
                                            <input className="sd-input" type="date" name="expiryDate" required
                                                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]} />
                                        </div>
                                    </div>
                                    <div className="sd-form-footer">
                                        <button type="submit" className="sd-btn-primary sd-btn-lg">Add Medicine</button>
                                        <button type="button" className="sd-btn-ghost"
                                            onClick={() => setActiveSection('medicines')}>Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}

                </main>
            </div>{/* end sd-main */}
            </div>{/* end sd-body */}
        </div>
    );
};

const StatCard = ({ label, value, accent, sub }) => (
    <div className="sd-stat-card" style={{ '--sd-accent': accent }}>
        <div className="sd-stat-accent-bar"></div>
        <div className="sd-stat-body">
            <div className="sd-stat-label">{label}</div>
            <div className="sd-stat-value">{value}</div>
            {sub && <div className="sd-stat-sub">{sub}</div>}
        </div>
    </div>
);

export default SupplierDashboard;
