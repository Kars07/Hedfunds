import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useLocation, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PageWrapper from './components/PageWrapper';
import HeaderSection from './pages/HeaderSection';
import About from './pages/About';
import Contact from './pages/Contact';
import Docs from './pages/Docs';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';
import Login from './components/auth/Login';
import VerifyEmail from './components/auth/VerifyEmail';
import ForgotPassword from './components/auth/ForgotPassword';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/Dashboard/Dashboard';
import DefaultDashboardContent from './pages/Dashboard/DefaultDashboardContent';
import Applications from './pages/Dashboard/applications';
import LoansToBeRepaid from './pages/Dashboard/loanstoberepaid';
import MyLoanApplications from './pages/Dashboard/myloan-applications';
import LoansFunded from './pages/Dashboard/loans-funded';
import LoansRepaid from './pages/Dashboard/loansirepaid';
import Transaction from './pages/Dashboard/transaction';
import Verification from './pages/Dashboard/Verification'
import FundLoan from './pages/Dashboard/fundaloan';
import Profile from './pages/Dashboard/Profile'
import Settings from './pages/Dashboard/settings';
import NotFound from './components/NotFound';
import ScrollToTop from './ScrollToTop';
import CivilServantVerification from './pages/Dashboard/CivilServantVerification';

const App: React.FC = () => {
  const location = useLocation();
  const animatedRoutes = ["/", "/about", "/contact"];
  const showNavbarFooter = animatedRoutes.includes(location.pathname);

  return (
    <>
      {showNavbarFooter && <Navbar />}
      <ScrollToTop />
      {animatedRoutes.includes(location.pathname) ? (
        
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageWrapper><HeaderSection /></PageWrapper>} />
            <Route path="/about" element={<PageWrapper><About /></PageWrapper>} />
            <Route path="/contact" element={<PageWrapper><Contact /></PageWrapper>} />
            <Route path="" element={<NotFound />} /> 
          </Routes>
        </AnimatePresence>
      ) : (
        <Routes>
          <Route path="/docs" element={<Docs />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            <Route index element={<DefaultDashboardContent />} />
            <Route path="LoansToRepay" element={<LoansToBeRepaid />} />
            <Route path="applications" element={<Applications />} />
            <Route path="fundaloan" element={<FundLoan />} />
            <Route path="loanstoberepaid" element={<LoansToBeRepaid />} />
            <Route path="myloan-applications" element={<MyLoanApplications />} />
            <Route path="loans-funded" element={<LoansFunded />} />
            <Route path="loansirepaid" element={<LoansRepaid />} />
             {/* <Route path="KYC-Verify" element={<Verification />} /> */}
            <Route path="KYC-Verify" element={<Verification onComplete={() => {}} onClose={() => {}} />} />
          <Route path="civil-servant-verification" element={<CivilServantVerification />} />
            <Route path="transactions" element={<Transaction />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="" element={<NotFound />} /> 
        </Routes>
      )}

      {showNavbarFooter && <Footer />}
    </>
  );
};

export default App;
