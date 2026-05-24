import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import '../../assets/css/PatientBooking.css';
import { usePatient } from '../../context/PatientContext';
import {
    fetchOnlineDoctors,
    setSearchQuery,
    setSpecializationFilter,
    clearFilters
} from '../../store/slices/appointmentSlice';

const BookDocOnline = () => {
    const { patient } = usePatient();
    const dispatch = useDispatch();
    
    // Redux state
    const {
        onlineDoctors,
        doctorsLoading: loading,
        doctorsError: error,
        filters
    } = useSelector((state) => state.appointments);

    useEffect(() => {
        dispatch(fetchOnlineDoctors());
    }, [dispatch]);

    // Compute filtered doctors and available specializations
    const { filteredDoctors, specializations } = useMemo(() => {
        let filtered = onlineDoctors;

        // Apply specialization filter
        if (filters.specialization) {
            filtered = filtered.filter(doctor => 
                (doctor.specialization || 'General Physician') === filters.specialization
            );
        }

        // Apply search query filter
        if (filters.searchQuery) {
            filtered = filtered.filter(doctor => 
                doctor.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
            );
        }

        // Extract unique specializations
        const uniqueSpecializations = [...new Set(
            onlineDoctors.map(doc => doc.specialization || 'General Physician')
        )];

        return {
            filteredDoctors: filtered,
            specializations: uniqueSpecializations
        };
    }, [onlineDoctors, filters]);

    const handleSearchChange = (e) => {
        dispatch(setSearchQuery(e.target.value));
    };

    const handleSpecializationChange = (e) => {
        dispatch(setSpecializationFilter(e.target.value));
    };

    const handleClearFilters = () => {
        dispatch(clearFilters());
    };

    return (
        <div className="book-doc-online">
            {/* {patient && patient.name && (
                <h1 className="welcome-message">Welcome, {patient.name}!</h1>
            )} */}

            <section className="search-doctor">
                <h1 className="heading">Book Online Appointment</h1>
                <div className="search-bar">
                    <input 
                        type="text" 
                        placeholder="Search doctors by name..." 
                        value={filters.searchQuery}
                        onChange={handleSearchChange}
                    />
                    <select 
                        className="filter-dropdown"
                        value={filters.specialization}
                        onChange={handleSpecializationChange}
                    >
                        <option value="">All Specializations</option>
                        {specializations.map(spec => (
                            <option key={spec} value={spec}>{spec}</option>
                        ))}
                    </select>
                    <button className="button" onClick={handleClearFilters}>
                        Clear Filters
                    </button>
                </div>
            </section>

            <section className="doctor-list">
                <h2 className="title">Available Doctors (Online)</h2>
                <br />
                
                {loading && (
                    <div className="loading">
                        <i className="fas fa-spinner fa-spin"></i> Loading doctors...
                    </div>
                )}
                
                {error && (
                    <div className="error-message">{error}</div>
                )}
                
                <div className="scroll-container">
                    {!loading && !error && filteredDoctors.length === 0 && (
                        <div className="error-message">
                            No doctors available at the moment.
                        </div>
                    )}
                    
                    {!loading && !error && filteredDoctors.map(doctor => (
                        <div key={doctor.id} className="doctor-card">
                            <img 
                                src={
                                    doctor.profilePhoto 
                                      ? doctor.profilePhoto.startsWith('http') 
                                        ? doctor.profilePhoto 
                                        : (() => {
                                            const API = import.meta.env.VITE_API_URL;
                                            return `${API}${doctor.profilePhoto.startsWith('/') ? '' : '/'}${doctor.profilePhoto}`;
                                          })()
                                      : 'https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png'
                                } 
                                alt="Doctor"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = 'https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png';
                                }}
                            />
                            <div>
                                <h3>
                                    Dr. {doctor.name} 
                                    <span className="online-badge">Online</span>
                                </h3>
                                <p><strong>Specialist:</strong> {doctor.specialization || 'General Physician'}</p>
                                <p><strong>Email:</strong> {doctor.email}</p>
                                <p><strong>Available:</strong> {doctor.availability || '9:00 AM - 5:00 PM'}</p>
                                <p><strong>Experience:</strong> {doctor.experience || '5+ years'}</p>
                                {doctor.averageRating > 0 && (
                                    <p style={{color: '#ff8c00', fontWeight: 'bold'}}>
                                        <strong>⭐ Rating:</strong> {doctor.averageRating}/10 
                                        <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}> ({doctor.totalReviews} {doctor.totalReviews === 1 ? 'review' : 'reviews'})</span>
                                    </p>
                                )}
                                <Link to={`/patient/doctor-profile-patient/${doctor.id}?type=online`}>
                                    <button className="book-now">Consult Now</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default BookDocOnline;