import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Home from './components/common/Home';
import './utils/toast.css';
import Footer from './components/common/Footer';
import FAQs from './components/FAQ';
import PatientForm from './components/pages/PatientForm';
import PatientDashboard from './components/pages/PatientDashboard';
import PatientAppointments from './components/pages/PatientAppointments';
import BookAppointment from './components/pages/BookAppointment';
import BookDocOnline from './components/pages/BookDocOnline';
import DoctorProfilePatient from './components/pages/DoctorProfilePatient';
import DoctorForm from './components/pages/DoctorForm';
import DoctorDashboard from './components/pages/DoctorDashboard';
import PatientProfile from './components/pages/PatientProfile';
import DoctorProfile from './components/pages/DoctorProfile';
import AdminForm from './components/pages/AdminForm';
import AdminDashboard from './components/pages/AdminDashboard';
import AdminSearchData from './components/pages/AdminSearchData';
import AdminMonitorReviews from './components/pages/AdminMonitorReviews';
import PatientEditProfile from './components/pages/PatientEditProfile';
import DoctorEditProfile from './components/pages/DoctorEditProfile';
import AdminProfile from './components/pages/AdminProfile';
import AdminEditProfile from './components/pages/AdminEditProfile';
import DoctorAnalytics from './components/pages/DoctorAnalytics';
import AdminPatientAnalytics from './components/pages/AdminPatientAnalytics';
import EmployeeForm from './components/pages/EmployeeForm';
import EmployeeDashboard from './components/pages/EmployeeDashboard';
import EmployeeProfile from './components/pages/EmployeeProfile';
import EmployeeEditProfile from './components/pages/EmployeeEditProfile';
import DoctorGeneratePrescriptions from './components/pages/DoctorGeneratePrescriptions';
import DoctorPatientAppointments from './components/pages/DoctorPatientAppointments';
import PatientHistory from './components/pages/PatientHistory';
import DoctorPrescriptions from './components/pages/DoctorPrescriptions';
import PatientPrescriptions from './components/pages/PatientPrescriptions';
import DoctorSchedule from './components/pages/DoctorSchedule';
import SupplierForm from './components/pages/SupplierForm';

import SupplierDashboard from './components/pages/SupplierDashboard';
// Static Pages
import AboutUs from './components/pages/AboutUs';
import ContactUs from './components/pages/ContactUs';
import FAQsPage from './components/pages/FAQs';
// NEW IMPORTS for E-commerce flow
import OrderMedicines from './components/pages/OrderMedicines';
import MedicineDetail from './components/pages/MedicineDetail';
import PatientCart from './components/pages/PatientCart';
import Checkout from './components/pages/Checkout'; 
import PatientOrders from './components/pages/PatientOrders';
import OrderDetails from './components/pages/OrderDetails';
import PaymentPage from './components/pages/PaymentPage';
import OrderSuccess from './components/pages/OrderSuccess';
import BlogPage from './components/pages/BlogPage';
import PostBlog from './components/pages/PostBlog';
import SingleBlog from './components/pages/SingleBlog';
import { PatientProvider } from './context/PatientContext';
import { DoctorProvider } from './context/DoctorContext';
import { AdminProvider } from './context/AdminContext';
import { EmployeeProvider } from './context/EmployeeContext'; // ADDED
import { SupplierProvider } from './context/SupplierContext';
import SupplierProfile from './components/pages/SupplierProfile';
import SupplierEditProfile from './components/pages/SupplierEditProfile';
import ReviewForm from './components/common/ReviewForm';
import PatientReviewPage from './components/pages/PatientReviewPage';
import DoctorReviewPage from './components/pages/DoctorReviewPage';
import ErrorPage from './components/common/ErrorPage';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
      {/* Only show Header on non-supplier, non-admin, non-doctor dashboard, non-book-doc-online, and non-medicine related pages */}
      { !window.location.pathname.startsWith('/supplier') && 
        !window.location.pathname.startsWith('/admin') && 
        window.location.pathname !== '/doctor/dashboard' && 
        window.location.pathname !== '/doctor/schedule' &&
        window.location.pathname !== '/doctor/patient-list' &&
        window.location.pathname !== '/patient/dashboard' &&
        window.location.pathname !== '/patient/book-doc-online' &&
        window.location.pathname !== '/patient/order-medicines' &&
        !window.location.pathname.startsWith('/patient/medicines/') &&
        window.location.pathname !== '/patient/cart' &&
        window.location.pathname !== '/patient/checkout' &&
        window.location.pathname !== '/patient/orders' &&
        !window.location.pathname.startsWith('/patient/orders/') &&
        window.location.pathname !== '/patient/order-details' &&
        window.location.pathname !== '/patient/payment' &&
        window.location.pathname !== '/patient/order-success' && <Header /> }
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/patient/form" element={<PatientForm />} />
        <Route path="/patient/dashboard" element={<PatientProvider><PatientDashboard /></PatientProvider>} />
        <Route path="/patient/appointments" element={<PatientProvider><PatientAppointments /></PatientProvider>} />
        <Route path="/patient/book-appointment" element={<PatientProvider><BookAppointment /></PatientProvider>} />
        <Route path="/patient/book-doc-online" element={<PatientProvider><BookDocOnline /></PatientProvider>} />
        <Route path="/patient/doctor-profile-patient/:id" element={<PatientProvider><DoctorProfilePatient /></PatientProvider>} />
        
        {/* DOCTOR ROUTES */}
        <Route path="/doctor/form" element={<DoctorForm />} />
        <Route path="/doctor/dashboard" element={< DoctorProvider><DoctorDashboard /></DoctorProvider>} />
        <Route path="/doctor/profile" element={
          <DoctorProvider>
            <DoctorProfile />
          </DoctorProvider>
        } />
        <Route path="/doctor/edit-profile" element={
          <DoctorProvider>
            <DoctorEditProfile />
          </DoctorProvider>
        } />
        <Route path="/doctor/generate-prescriptions" element={<DoctorProvider><DoctorGeneratePrescriptions /></DoctorProvider>} />
        <Route path="/doctor/prescriptions" element={<DoctorProvider><DoctorPrescriptions /></DoctorProvider>} />
        <Route path="/doctor/schedule" element={<DoctorProvider><DoctorSchedule /></DoctorProvider>} />
        <Route path="/doctor/patient-appointments" element={<DoctorProvider><DoctorPatientAppointments /></DoctorProvider>} />
        <Route path="/doctor/patient-history" element={<DoctorProvider><PatientHistory /></DoctorProvider>} />
        <Route path="/doctor/submit-review" element={<DoctorProvider><DoctorReviewPage /></DoctorProvider>} />
        
        {/* ADMIN ROUTES */}
        <Route path="/admin/form" element={<AdminForm />} />
        <Route path="/admin/dashboard" element={ <AdminProvider><AdminDashboard /></AdminProvider>} />
        <Route path="/admin/search-data" element={<AdminProvider><AdminSearchData /></AdminProvider>} />
        <Route path="/admin/doctor-analytics" element={<AdminProvider><DoctorAnalytics /></AdminProvider>} />
        <Route path="/admin/patient-analytics" element={<AdminProvider><AdminPatientAnalytics /></AdminProvider>} />
        <Route path="/admin/profile" element={<AdminProvider><AdminProfile /></AdminProvider>} />
        <Route path="/admin/edit-profile" element={<AdminProvider><AdminEditProfile /></AdminProvider>}/>
        
        {/* EMPLOYEE ROUTES */}
        <Route path="/employee/form" element={<EmployeeForm />} />
        <Route path="/employee/dashboard" element={<EmployeeProvider><EmployeeDashboard /></EmployeeProvider> } />
        <Route path="/employee/monitor-reviews" element={<EmployeeProvider><AdminMonitorReviews /></EmployeeProvider>} />
        <Route path="/employee/profile" element={<EmployeeProvider><EmployeeProfile /></EmployeeProvider>} />
        <Route path="/employee/edit-profile" element={<EmployeeProvider><EmployeeEditProfile /></EmployeeProvider>} />
        
        {/* PATIENT PROFILE/EDIT ROUTES */}
        <Route path="/patient/profile" element={<PatientProvider><PatientProfile /></PatientProvider>} />
        <Route path="/patient/edit-profile" element={<PatientProvider><PatientEditProfile /></PatientProvider>} />
        <Route path="/patient/prescriptions" element={<PatientProvider><PatientPrescriptions /></PatientProvider>} />
        <Route path="/patient/submit-review" element={<PatientProvider><PatientReviewPage /></PatientProvider>} />

        {/* SUPPLIER ROUTES */}
        <Route path="/supplier/form" element={<SupplierForm />} />
        <Route path="/supplier/dashboard" element={<SupplierProvider><SupplierDashboard /></SupplierProvider>} />
        <Route path="/supplier/profile" element={<SupplierProvider><SupplierProfile /></SupplierProvider>} />
        <Route path="/supplier/edit-profile" element={<SupplierProvider><SupplierEditProfile /></SupplierProvider>} />

        {/* NEW E-COMMERCE ROUTES */}
        <Route path="/patient/order-medicines" element={<OrderMedicines />} />
        <Route path="/patient/medicines/:id" element={<MedicineDetail />} />
        <Route path="/patient/cart" element={<PatientCart />} />
        <Route path="/patient/orders" element={<PatientOrders />} />
        <Route path="/patient/orders/:id" element={<OrderDetails />} />
        <Route path="/patient/checkout" element={<Checkout />} /> 
        <Route path="/patient/order-details" element={<OrderDetails />} />
        <Route path="/patient/payment" element={<PaymentPage />} />
        <Route path="/patient/order-success" element={<OrderSuccess />} />
        {/* BLOG ROUTES */}
        {/* BLOG ROUTES 📝 (New) */}
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/post" element={<PostBlog />} />
        <Route path="/blog/:id" element={<SingleBlog />} />
        {/* Add route for single blog view. Component conversion not requested, so using placeholder. */}
        
        {/* STATIC PAGES */}
        <Route path="/about-us" element={<AboutUs />} />
        <Route path="/faqs" element={<FAQsPage />} />
        <Route path="/contact-us" element={<ContactUs />} />
        
        {/* ERROR PAGE */}
        <Route path="/error" element={<ErrorPage />} />
      </Routes>
      <Footer />
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;