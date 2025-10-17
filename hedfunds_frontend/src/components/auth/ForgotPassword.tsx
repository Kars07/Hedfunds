import React, { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMessage(
          data.message || 'We have sent you an email with instructions to reset your password.'
        );
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setErrorMessage(data.message || 'This email address is not registered.');
      }
    } catch {
      setErrorMessage('Something went wrong. Please try again.');
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
            <h2 className="text-2xl font-bold text-orange-500 mb-2">Reset your password</h2>
            <p className="text-gray-500">
              Enter your email address and we'll send you instructions to reset your password.
            </p>
          </div>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 mb-5 border border-gray-200 focus-within:ring-2 focus-within:ring-orange-200">
              <input
                type="email"
                placeholder="youremail@example.com"
                required
                className="bg-transparent outline-none flex-grow text-gray-700 placeholder-gray-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              {/* Simple envelope svg icon for broad compatibility */}
              <span className="ml-2 text-orange-400">
                <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <rect width="24" height="24" fill="none"/>
                  <path d="M3 8l9 6 9-6M5 6h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </span>
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
          <p className="text-center text-sm text-gray-500 mt-6">
            Remember your password?{' '}
            <Link to="/login" className="text-orange-500 hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;