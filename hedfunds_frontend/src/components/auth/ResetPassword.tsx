import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../../assets/logo.png';

const API_URL = "https://swiftfund-6b61.onrender.com";

const ResetPassword: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tokenFromUrl = queryParams.get('token');
    if (tokenFromUrl) setToken(tokenFromUrl);
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords don't match.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword, token }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccessMessage('Your password has been reset successfully.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setErrorMessage(data.message || 'Failed to reset password.');
      }
    } catch {
      setErrorMessage('An error occurred while resetting the password.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow fixed top-0 left-0 w-full z-10">
        <div className="max-w-6xl mx-auto py-4 px-6 flex items-center">
          <img src={logo} alt="Swiftfund Logo" className="w-10 h-10" />
          <span className="ml-3 text-xl font-bold text-black tracking-wide">SWIFTFUND</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex flex-1 justify-center items-center pt-24">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-7">
            <h2 className="text-2xl font-bold text-orange-500 mb-2">Create New Password</h2>
            <p className="text-gray-500">
              Enter your new password and confirm it to reset your password.
            </p>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 mb-5 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-200">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New Password"
                required
                className="bg-transparent outline-none flex-grow text-gray-700 placeholder-gray-400"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                className="ml-2 text-orange-400 focus:outline-none"
                tabIndex={-1}
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {/* Eye SVG */}
                {showNewPassword ? (
                  <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M1 1l22 22M17.94 17.94A10.05 10.05 0 0 1 12 19c-5 0-9-4-9-7s4-7 9-7a9.93 9.93 0 0 1 7.08 2.93M9.88 9.88a3 3 0 1 0 4.24 4.24" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 mb-5 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-200">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                required
                className="bg-transparent outline-none flex-grow text-gray-700 placeholder-gray-400"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="ml-2 text-orange-400 focus:outline-none"
                tabIndex={-1}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M1 1l22 22M17.94 17.94A10.05 10.05 0 0 1 12 19c-5 0-9-4-9-7s4-7 9-7a9.93 9.93 0 0 1 7.08 2.93M9.88 9.88a3 3 0 1 0 4.24 4.24" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width={22} height={22} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12zm11 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            {errorMessage && <p className="text-red-600 text-sm mb-4">{errorMessage}</p>}
            {successMessage && <p className="text-green-600 text-sm mb-4">{successMessage}</p>}
            <button
              type="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors duration-200 shadow cursor-pointer"
            >
              Reset Password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;