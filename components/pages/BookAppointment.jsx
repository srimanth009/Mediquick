// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import '../../assets/css/PatientBooking.css';
// const BookDocOnline = () => {
//     const [allDoctors, setAllDoctors] = useState([]);
//     const [filteredDoctors, setFilteredDoctors] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState('');
    
//     // Filter states
//     const [searchQuery, setSearchQuery] = useState('');
//     const [specializationFilter, setSpecializationFilter] = useState('');
    
//     // Available specializations
//     const [specializations, setSpecializations] = useState([]);

//     useEffect(() => {
//         fetchDoctors();
//     }, []);

//     useEffect(() => {
//         filterDoctors();
//     }, [searchQuery, specializationFilter, allDoctors]);

//     const fetchDoctors = async () => {
//         try {
//             setLoading(true);
//             setError('');
//             const token = getToken();
//             const response = await fetch('http://localhost:3002/patient/api/doctors/online', {
//                 headers: {
//                     'Authorization': `Bearer ${token}`
//                 }
//             });
            
//             if (!response.ok) {
//                 throw new Error(`HTTP error! status: ${response.status}`);
//             }
            
//             const doctors = await response.json();
//             setAllDoctors(doctors);
            
//             // Extract unique specializations
//             const uniqueSpecializations = [...new Set(
//                 doctors.map(doc => doc.specialization || 'General Physician')
//             )];
//             setSpecializations(uniqueSpecializations);
            
//         } catch (err) {
//             console.error('Error fetching doctors:', err);
//             setError('Failed to load doctors. Please try again later.');
//         } finally {
//             setLoading(false);
//         }
//     };

//     const filterDoctors = () => {
//         let filtered = allDoctors;

//         // Apply specialization filter
//         if (specializationFilter) {
//             filtered = filtered.filter(doctor => 
//                 (doctor.specialization || 'General Physician') === specializationFilter
//             );
//         }

//         // Apply search query filter
//         if (searchQuery) {
//             filtered = filtered.filter(doctor => 
//                 doctor.name.toLowerCase().includes(searchQuery.toLowerCase())
//             );
//         }

//         setFilteredDoctors(filtered);
//     };

//     const handleSearchChange = (e) => {
//         setSearchQuery(e.target.value);
//     };

//     const handleSpecializationChange = (e) => {
//         setSpecializationFilter(e.target.value);
//     };

//     const clearFilters = () => {
//         setSearchQuery('');
//         setSpecializationFilter('');
//     };

//     return (
//         <div className="book-doc-online">
//             <header>
//                 <Link to="/" className="logo">
//                     <span>M</span>edi<span>Q</span>uick
//                 </Link>
//                 <nav className="navbar">
//                     <ul>
//                         <li><Link to="/about">About Us</Link></li>
//                         <li><Link to="/faqs">FAQs</Link></li>
//                         <li><Link to="/blogs">Blog</Link></li>
//                         <li><Link to="/contact">Contact Us</Link></li>
//                         <li>
//                             <Link to="/patient/profile">
//                                 <img 
//                                     src="https://static.thenounproject.com/png/638636-200.png" 
//                                     alt="Profile" 
//                                     height="30" 
//                                     width="30" 
//                                 />
//                             </Link>
//                         </li>
//                     </ul>
//                 </nav>
//             </header>

//             <section className="search-doctor">
//                 <h1 className="heading">Book Online Appointment</h1>
//                 <div className="search-bar">
//                     <input 
//                         type="text" 
//                         placeholder="Search doctors by name..." 
//                         value={searchQuery}
//                         onChange={handleSearchChange}
//                     />
//                     <select 
//                         className="filter-dropdown"
//                         value={specializationFilter}
//                         onChange={handleSpecializationChange}
//                     >
//                         <option value="">All Specializations</option>
//                         {specializations.map(spec => (
//                             <option key={spec} value={spec}>{spec}</option>
//                         ))}
//                     </select>
//                     <button className="button" onClick={clearFilters}>
//                         Clear Filters
//                     </button>
//                 </div>
//             </section>

//             <section className="doctor-list">
//                 <h2 className="title">Available Doctors (Online)</h2>
//                 <br />
                
//                 {loading && (
//                     <div className="loading">
//                         <i className="fas fa-spinner fa-spin"></i> Loading doctors...
//                     </div>
//                 )}
                
//                 {error && (
//                     <div className="error-message">{error}</div>
//                 )}
                
//                 <div className="scroll-container">
//                     {!loading && !error && filteredDoctors.length === 0 && (
//                         <div className="error-message">
//                             No doctors available at the moment.
//                         </div>
//                     )}
                    
//                     {!loading && !error && filteredDoctors.map(doctor => (
//                         <div key={doctor.id} className="doctor-card">
//                             <img 
//                                 src="https://icons.veryicon.com/png/o/healthcate-medical/orange-particle/doctor-20.png" 
//                                 alt="Doctor" 
//                             />
//                             <div>
//                                 <h3>
//                                     Dr. {doctor.name} 
//                                     <span className="online-badge">Online</span>
//                                 </h3>
//                                 <p><strong>Specialist:</strong> {doctor.specialization || 'General Physician'}</p>
//                                 <p><strong>Email:</strong> {doctor.email}</p>
//                                 <p><strong>Available:</strong> {doctor.availability || '9:00 AM - 5:00 PM'}</p>
//                                 <p><strong>Experience:</strong> {doctor.experience || '5+ years'}</p>
//                                 <Link to={`/patient/doctor-profile-patient/${doctor.id}?type=online`}>
//                                     <button className="book-now">Consult Now</button>
//                                 </Link>
//                             </div>
//                         </div>
//                     ))}
//                 </div>
//             </section>

//             <footer className="footer">
//                 <div className="box">
//                     <Link to="/" className="logo">
//                         <span>M</span>edi<span>Q</span>uick
//                     </Link>
//                     <p>Your trusted healthcare partner for quick and reliable medical services.</p>
//                 </div>
                
//                 <div className="box">
//                     <h3>Quick Links</h3>
//                     <Link to="/">Home</Link>
//                     <Link to="/about">About Us</Link>
//                     <Link to="/faqs">FAQs</Link>
//                     <Link to="/blogs">Blog</Link>
//                 </div>
                
//                 <div className="box">
//                     <h3>Contact Us</h3>
//                     <a href="tel:+1234567890">+123-456-7890</a>
//                     <a href="mailto:support@mediquick.com">support@mediquick.com</a>
//                     <a href="#">123 Health Street, Medical City</a>
//                 </div>
                
//                 <div className="credit">
//                     &copy; {new Date().getFullYear()} by <span>MediQuick</span> | all rights reserved!
//                 </div>
//             </footer>
//         </div>
//     );
// };

// export default BookDocOnline;
import React, { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import '../../assets/css/PatientBooking.css';
import { usePatient } from '../../context/PatientContext';
import {
    fetchOfflineDoctors,
    setSearchQuery,
    setSpecializationFilter,
    setLocationFilter,
    clearFilters
} from '../../store/slices/appointmentSlice';

const BookAppointment = () => {
    const { patient, logout } = usePatient();
    const dispatch = useDispatch();
    
    // Redux state
    const {
        offlineDoctors,
        doctorsLoading: loading,
        doctorsError: error,
        filters
    } = useSelector((state) => state.appointments);

    useEffect(() => {
        dispatch(fetchOfflineDoctors());
    }, [dispatch]);

    // Compute filtered doctors and available options
    const { filteredDoctors, specializations, locations } = useMemo(() => {
        let filtered = offlineDoctors;

        // Apply specialization filter
        if (filters.specialization) {
            filtered = filtered.filter(doctor => 
                doctor.specialization === filters.specialization
            );
        }

        // Apply location filter
        if (filters.location) {
            filtered = filtered.filter(doctor => 
                doctor.location.toLowerCase().includes(filters.location.toLowerCase())
            );
        }

        // Apply search query filter
        if (filters.searchQuery) {
            filtered = filtered.filter(doctor => 
                doctor.name.toLowerCase().includes(filters.searchQuery.toLowerCase())
            );
        }

        // Extract unique specializations and locations
        const uniqueSpecializations = [...new Set(offlineDoctors.map(doc => doc.specialization).filter(Boolean))];
        const uniqueLocations = [...new Set(offlineDoctors.map(doc => doc.location).filter(Boolean))];

        return {
            filteredDoctors: filtered,
            specializations: uniqueSpecializations,
            locations: uniqueLocations
        };
    }, [offlineDoctors, filters]);

    const handleSearchChange = (e) => {
        dispatch(setSearchQuery(e.target.value));
    };

    const handleSpecializationChange = (e) => {
        dispatch(setSpecializationFilter(e.target.value));
    };

    const handleLocationChange = (e) => {
        dispatch(setLocationFilter(e.target.value));
    };

    const handleClearFilters = () => {
        dispatch(clearFilters());
    };

    return (
        <div className="book-appointment">
            <header>
                <Link to="/" className="logo">
                    <span>M</span>edi<span>Q</span>uick
                </Link>
                <nav className="navbar">
                    <ul>
                        <li>
              {patient && patient.name && (
        <h1 className="welcome-message">Welcome, {patient.name}!</h1>
      )}
            </li>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/faqs">FAQs</Link></li>
                        <li><Link to="/blogs">Blog</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><button onClick={logout} style={{background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit'}}>Logout</button></li>
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

            <section className="search-doctor">
                <h1 className="heading">Book an Offline Appointment</h1>
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
                    <select 
                        className="filter-dropdown"
                        value={filters.location}
                        onChange={handleLocationChange}
                    >
                        <option value="">All Locations</option>
                        {locations.map(location => (
                            <option key={location} value={location}>{location}</option>
                        ))}
                    </select>
                    <button className="button" onClick={handleClearFilters}>
                        Clear Filters
                    </button>
                </div>
            </section>

            <section className="doctor-list">
                <h2 className="title">Available Doctors</h2>
                <div className="scroll-container">
                    {loading && (
                        <div className="loading">
                            <i className="fas fa-spinner fa-spin"></i> Loading doctors...
                        </div>
                    )}
                    
                    {error && (
                        <div className="error-message">{error}</div>
                    )}
                    
                    {!loading && !error && filteredDoctors.length === 0 && (
                        <div className="no-doctors">
                            <p>No doctors found matching your criteria.</p>
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
                                <h3>{doctor.name}</h3>
                                <p><strong>Specialist:</strong> {doctor.specialization}</p>
                                <p><strong>Location:</strong> {doctor.location}</p>
                                <p><strong>Email:</strong> {doctor.email}</p>
                                <p><strong>Available:</strong> {doctor.availability}</p>
                                {doctor.averageRating > 0 && (
                                    <p style={{color: '#ff8c00', fontWeight: 'bold'}}>
                                        <strong>⭐ Rating:</strong> {doctor.averageRating}/10 
                                        <span style={{color: '#666', fontSize: '0.9em', fontWeight: 'normal'}}> ({doctor.totalReviews} {doctor.totalReviews === 1 ? 'review' : 'reviews'})</span>
                                    </p>
                                )}
                                <Link to={`/patient/doctor-profile-patient/${doctor.id}`}>
                                    <button className="book-now">Book Now</button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <footer className="footer">
                <div className="box">
                    <Link to="/" className="logo">
                        <span>M</span>edi<span>Q</span>uick
                    </Link>
                    <p>Your trusted healthcare partner for quick and reliable medical appointments.</p>
                </div>
                
                <div className="box">
                    <h3>Quick Links</h3>
                    <Link to="/about">About Us</Link>
                    <Link to="/services">Services</Link>
                    <Link to="/doctors">Doctors</Link>
                    <Link to="/contact">Contact</Link>
                </div>
                
                <div className="box">
                    <h3>Contact Info</h3>
                    <a href="tel:+1234567890">
                        <i className="fas fa-phone"></i> +123-456-7890
                    </a>
                    <a href="mailto:info@mediquick.com">
                        <i className="fas fa-envelope"></i> info@mediquick.com
                    </a>
                    <a href="#">
                        <i className="fas fa-map-marker-alt"></i> 123 Health St, Medical City
                    </a>
                </div>
                
                <p className="credit">
                    Created by <span>MediQuick Team</span> | All rights reserved
                </p>
            </footer>
        </div>
    );
};

export default BookAppointment;