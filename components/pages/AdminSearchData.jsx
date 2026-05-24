import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchAdminAppointments,
  selectAdminAppointments,
  selectUniqueDoctors,
  selectUniqueSpecializations,
  selectDoctorEarnings,
  selectSpecializationEarnings,
  selectAppointmentsByDateRange,
  selectAdminLoading
} from '../../store/slices/adminSlice';
import Header from '../common/Header';
import '../../assets/css/AdminSearchData.css';

const AdminSearchData = () => {
  const dispatch = useDispatch();
  
  // Redux state
  const appointments = useSelector(selectAdminAppointments);
  const doctors = useSelector(selectUniqueDoctors);
  const specializations = useSelector(selectUniqueSpecializations);
  const adminLoading = useSelector(selectAdminLoading);
  
  // Local state for selections and filters
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateRangeDoctor, setDateRangeDoctor] = useState('');
  const [dateRangeSpecialization, setDateRangeSpecialization] = useState('');
  const [error, setError] = useState('');
  const [isNavOpen, setIsNavOpen] = useState(false);
  
  // Compute derived data using Redux selectors
  const doctorEarnings = useSelector(state => selectDoctorEarnings(state, selectedDoctor));
  const specializationEarnings = useSelector(state => selectSpecializationEarnings(state, selectedSpecialization));
  const dateRangeAppointments = useSelector(state => selectAppointmentsByDateRange(state, startDate, endDate, dateRangeDoctor, dateRangeSpecialization));

  // Calculate totals
  const doctorTotals = doctorEarnings.reduce((acc, day) => ({
    totalFees: acc.totalFees + (day.totalFees || 0),
    totalRevenue: acc.totalRevenue + (day.totalRevenue || 0)
  }), { totalFees: 0, totalRevenue: 0 });

  const specializationTotals = specializationEarnings.reduce((acc, day) => ({
    totalFees: acc.totalFees + (day.totalFees || 0),
    totalRevenue: acc.totalRevenue + (day.totalRevenue || 0)
  }), { totalFees: 0, totalRevenue: 0 });

  const dateRangeTotals = dateRangeAppointments.reduce((acc, appt) => ({
    totalFees: acc.totalFees + (appt.fee || 0),
    totalRevenue: acc.totalRevenue + (appt.revenue || 0)
  }), { totalFees: 0, totalRevenue: 0 });

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Load appointments on component mount (doctors and specializations are derived from appointments)
  useEffect(() => {
    dispatch(fetchAdminAppointments());
  }, [dispatch]);

  // Load available doctors
  // Validation functions (data now comes from Redux selectors)
  const validateDoctorSearch = () => {
    if (!selectedDoctor) {
      alert('Please select a doctor');
      return false;
    }
    return true;
  };

  const validateSpecializationSearch = () => {
    if (!selectedSpecialization) {
      alert('Please select a specialization');
      return false;
    }
    return true;
  };

  const validateDateRange = () => {
    if (!startDate || !endDate) {
      alert('Please select both start date and end date');
      return false;
    }

    if (new Date(startDate) > new Date(endDate)) {
      alert('Start date cannot be after end date');
      return false;
    }
    
    return true;
  };

  // Toggle mobile navigation
  const toggleMobileNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  return (
    <div className="admin-search-data">
      <Header />

      <div className="search-data-container">
        <div className="search-data-header">
          <Link to="/admin/dashboard" className="search-data-back">← Back to Dashboard</Link>
          <h1>Admin Search Data</h1>
          <p>Search and analyze appointment data by different criteria</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError('')} className="btn btn-secondary">
              Dismiss
            </button>
          </div>
        )}

        {/* Doctor Earnings Section */}
        <section className="search-section">
          <h2 className="section-title">Doctor Earnings</h2>
          
          {/* Doctor Filter */}
          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="doctorSelect">Select Doctor:</label>
              <select 
                id="doctorSelect"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                disabled={adminLoading.appointments}
              >
                <option value="">Select a Doctor</option>
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization}
                  </option>
                ))}
              </select>
              <button 
                className="search-btn" 
                onClick={validateDoctorSearch}
                disabled={adminLoading.appointments}
              >
                <i className="fas fa-search"></i>
                {adminLoading.appointments ? ' Loading...' : ' Search'}
              </button>
            </div>
          </div>
          
          {doctorEarnings.length > 0 && (
            <div className="summary-card">
              <h3>Total Earnings</h3>
              <p>{formatCurrency(doctorTotals.totalFees)}</p>
              <p style={{fontSize: '1rem', marginTop: '5px'}}>
                MediQuick Revenue: {formatCurrency(doctorTotals.totalRevenue)}
              </p>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Appointments Count</th>
                  <th>Total Fees</th>
                  <th>MediQuick Revenue (10%)</th>
                </tr>
              </thead>
              <tbody>
                {adminLoading.appointments ? (
                  <tr>
                    <td colSpan="4" className="loading">Loading doctor earnings...</td>
                  </tr>
                ) : doctorEarnings.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty">Select a doctor to view earnings</td>
                  </tr>
                ) : (
                  doctorEarnings.map((day, index) => (
                    <tr key={index}>
                      <td>{day.date}</td>
                      <td>{day.count}</td>
                      <td>{formatCurrency(day.totalFees)}</td>
                      <td>{formatCurrency(day.totalRevenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Specialization Earnings Section */}
        <section className="search-section">
          <h2 className="section-title">Specialization Earnings</h2>
          
          {/* Specialization Filter */}
          <div className="filter-container">
            <div className="filter-group">
              <label htmlFor="specializationSelect">Select Specialization:</label>
              <select 
                id="specializationSelect"
                value={selectedSpecialization}
                onChange={(e) => setSelectedSpecialization(e.target.value)}
                disabled={adminLoading.appointments}
              >
                <option value="">Select a Specialization</option>
                {specializations.map(specialization => (
                  <option key={specialization} value={specialization}>
                    {specialization}
                  </option>
                ))}
              </select>
              <button 
                className="search-btn" 
                onClick={validateSpecializationSearch}
                disabled={adminLoading.appointments}
              >
                <i className="fas fa-search"></i>
                {adminLoading.appointments ? ' Loading...' : ' Search'}
              </button>
            </div>
          </div>

          {specializationEarnings.length > 0 && (
            <div className="summary-card">
              <h3>Total Earnings</h3>
              <p>{formatCurrency(specializationTotals.totalFees)}</p>
              <p style={{fontSize: '1rem', marginTop: '5px'}}>
                MediQuick Revenue: {formatCurrency(specializationTotals.totalRevenue)}
              </p>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Appointments Count</th>
                  <th>Total Fees</th>
                  <th>MediQuick Revenue (10%)</th>
                </tr>
              </thead>
              <tbody>
                {adminLoading.appointments ? (
                  <tr>
                    <td colSpan="4" className="loading">Loading specialization earnings...</td>
                  </tr>
                ) : specializationEarnings.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty">Select a specialization to view earnings</td>
                  </tr>
                ) : (
                  specializationEarnings.map((day, index) => (
                    <tr key={index}>
                      <td>{day.date}</td>
                      <td>{day.count}</td>
                      <td>{formatCurrency(day.totalFees)}</td>
                      <td>{formatCurrency(day.totalRevenue)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Date Range Appointments Section */}
        <section className="search-section">
          <h2 className="section-title">Appointments by Date Range</h2>
          
          {/* Date Range Filter */}
          <div className="filter-container">
            <div className="date-range-form">
              <div className="filter-group">
                <label htmlFor="startDate">Start Date:</label>
                <input 
                  id="startDate"
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={adminLoading.appointments}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="endDate">End Date:</label>
                <input 
                  id="endDate"
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={adminLoading.appointments}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="dateRangeDoctor">Doctor:</label>
                <select
                  id="dateRangeDoctor"
                  value={dateRangeDoctor}
                  onChange={(e) => setDateRangeDoctor(e.target.value)}
                  disabled={adminLoading.appointments}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- All Doctors --</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <label htmlFor="dateRangeSpecialization">Specialization:</label>
                <select
                  id="dateRangeSpecialization"
                  value={dateRangeSpecialization}
                  onChange={(e) => setDateRangeSpecialization(e.target.value)}
                  disabled={adminLoading.appointments}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                  <option value="">-- All Specializations --</option>
                  {specializations.map((spec) => (
                    <option key={spec} value={spec}>
                      {spec}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filter-group">
                <button 
                  className="search-btn" 
                  onClick={validateDateRange}
                  disabled={adminLoading.appointments}
                >
                  <i className="fas fa-search"></i>
                  {adminLoading.appointments ? ' Loading...' : ' Search'}
                </button>
              </div>
            </div>
          </div>

          {(dateRangeDoctor || dateRangeSpecialization) && dateRangeAppointments.length > 0 && (
            <div style={{
              padding: '10px 15px',
              marginTop: '15px',
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '4px',
              fontSize: '14px'
            }}>
              <strong>Active Filters:</strong>
              {dateRangeDoctor && <span> Doctor: {doctors.find(d => d.id === dateRangeDoctor)?.name}</span>}
              {dateRangeDoctor && dateRangeSpecialization && <span> | </span>}
              {dateRangeSpecialization && <span> Specialization: {dateRangeSpecialization}</span>}
            </div>
          )}

          {dateRangeAppointments.length > 0 && (
            <div className="summary-card">
              <h3>Total Earnings for Selected Period</h3>
              <p>{formatCurrency(dateRangeTotals.totalFees)}</p>
              <p style={{fontSize: '1rem', marginTop: '5px'}}>
                MediQuick Revenue: {formatCurrency(dateRangeTotals.totalRevenue)}
              </p>
            </div>
          )}

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Fee</th>
                  <th>MediQuick Revenue (10%)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {adminLoading.appointments ? (
                  <tr>
                    <td colSpan="8" className="loading">Loading appointments...</td>
                  </tr>
                ) : dateRangeAppointments.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty">Select date range to view appointments</td>
                  </tr>
                ) : (
                  dateRangeAppointments.map(appt => (
                    <tr key={appt._id}>
                      <td>{appt.patientName}</td>
                      <td>{appt.doctorName}</td>
                      <td>{appt.specialization}</td>
                      <td>{appt.date}</td>
                      <td>{appt.time}</td>
                      <td>{formatCurrency(appt.fee)}</td>
                      <td>{formatCurrency(appt.revenue)}</td>
                      <td>
                        <span className={`status ${appt.status}`}>
                          {appt.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {dateRangeAppointments.length > 0 && (
                <tfoot>
                  <tr>
                    <td colSpan="5"><strong>Total</strong></td>
                    <td><strong>{formatCurrency(dateRangeTotals.totalFees)}</strong></td>
                    <td><strong>{formatCurrency(dateRangeTotals.totalRevenue)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AdminSearchData;