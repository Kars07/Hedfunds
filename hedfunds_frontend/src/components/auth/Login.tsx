import React, { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/logo.png';

const API_URL = "https://swiftfund-6b61.onrender.com";

const Login: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${API_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      console.log('Backend response:', data);

      if (!res.ok || !data.user) {
        setErrorMessage(data?.message || 'Login failed. Please try again.');
        setLoading(false);
        return;
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  return (
    <div className='bg-orange-50 h-[120vh] md:p-15 p-4'>
      <div className="flex items-center mb-">
        <img src={logo} alt="HeadFunds Logo" className="w-8 h-auto mr-3" />
        <h2 className="text-2xl font-bold text-zinc-800">HEDFUNDS</h2>
      </div>
      <div className='flex md:flex-row flex-col w-full md:mt-20 mt-15 justify-between'>
        <div className='font-bold text-zinc-800'>
          <h1 className='md:text-6xl text-5xl'>Welcome back!</h1>
          <div className='flex'>
            <h2 className='text-2xl p-2'>Login to Continue</h2>
          </div>
        </div>
        <div className='bg-white mt-6 md:mt-0 rounded-2xl shadow-2xl p-8 md:w-[40%]'>
          <h2 className="text-xl font-bold text-orange-600">Login</h2>
          <h4 className="text-gray-500 mb-6">Enter your details below to access your account</h4>
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="relative mb-4">
              <input
                type="email"
                placeholder="Email"
                required
                className="bg-gray-100 rounded-lg p-3 pr-10 border border-gray-300 w-full text-gray-700 outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-600">
                <i className="bx bx-envelope"></i>
              </span>
            </div>

            {/* Password Field */}
            <div className="relative mb-2">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                required
                className="bg-gray-100 rounded-lg p-3 pr-10 border border-gray-300 w-full text-gray-700 outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-orange-600 cursor-pointer"
                onClick={togglePasswordVisibility}
              >
                <i className={showPassword ? 'bx bx-show' : 'bx bx-hide'}></i>
              </span>
            </div>

            {errorMessage && <p className="text-red-600 text-[10px] mb-4">{errorMessage}</p>}

            <div className='flex justify-center items-center'>
              <button
                type="submit"
                disabled={loading}
                className={`${
                  loading ? 'bg-orange-500' : 'bg-orange-600 hover:bg-orange-600'
                } bg-white border-2 border-orange-600 text-orange-600 font-bold mt-2 py-2 px-4 rounded-3xl w-1/2 cursor-pointer hover:bg-orange-600 hover:text-white transition-colors duration-300`}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
          <p className="text-center text-[14px] text-gray-500 mt-4">
            Forgot your password?{' '}
            <a href="/forgot-password" className="text-black hover:underline">Reset it here</a>
          </p>
          <p className="text-center text-[14px] text-gray-500">
            Don't have an account?{' '}
            <a href="/register" className="text-black hover:underline">Sign up here</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;