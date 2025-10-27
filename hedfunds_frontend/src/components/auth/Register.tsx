import React, { useState, ChangeEvent, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logo from '../../assets/logo.png';


interface FormData {
  fullname: string;
  email: string;
  password: string;
}

const API_URL = "https://swiftfund-6b61.onrender.com";

const Registration: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ fullname: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$*&])[A-Za-z\d@#$*&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validatePassword(formData.password)) {
      setErrorMessage(
        'Password must include at least 8 characters, 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character (@, #, $, *, &).'
      );
      return;
    }

    setErrorMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/verify-email');
      } else {
        setErrorMessage(data.message || data.error || 'Registration failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Something went wrong. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prevState) => !prevState);
  };

  return (
    <div className="  h-[150vh] bg-orange-50  md:p-15 pt-8 px-4 ">
      <div className="flex items-center4 mb-">
        <img src={logo} alt="HeadFunds Logo" className="w-8 h-auto mr-3" />
        <h2 className="text-2xl font-bold text-zinc-800">HEDFUNDS</h2>
      </div>
      <div className='flex flex-col md:flex-row w-full mt-15 md:mt-20  justify-between'>
       <div className='md:p-8 py-6 px-5 bg-white w-full rounded-2xl shadow-2xl  md:w-[55%]'>
          <h1 className='md:text-6xl text-4xl font-bold mb-4 text-zinc-800'>Start your journey <br />to smarter lending.</h1>
          <h2 className="text-xl font-bold text-orange-500 ">Sign Up</h2>
          <h4 className="text-gray-500 mb-6">Enter your details below to create an account</h4>
          <form onSubmit={handleSubmit}>
            <div className="flex items-center bg-gray-100 rounded-lg p-2 mb-4 border border-gray-300 w-full  relative">
              <input
                type="text"
                name="fullname"
                placeholder="Full Name"
                required
                className="bg-transparent outline-none flex-grow text-gray-700"
                value={formData.fullname}
                onChange={handleChange}
              />
              <span className="ml-2 text-orange-500 cursor-pointer absolute right-3">
                <i className="bx bxs-user"></i>
              </span>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-2 mb-4 border border-gray-300 w-full  relative">
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="bg-transparent outline-none flex-grow text-gray-700"
                value={formData.email}
                onChange={handleChange}
              />
              <span className="ml-2 text-orange-500 cursor-pointer absolute right-3">
                <i className="bx bx-envelope"></i>
              </span>
            </div>
            <div className="flex items-center bg-gray-100 rounded-lg p-2 mb-4 border border-gray-300 w-full relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                required
                className="bg-transparent outline-none flex-grow text-gray-700"
                value={formData.password}
                onChange={handleChange}
              />
              <span
                className="ml-2 text-orange-500 cursor-pointer absolute right-3"
                onClick={togglePasswordVisibility}
              >
                <i className={showPassword ? 'bx bx-show' : 'bx bx-hide'}></i>
              </span>
            </div>
            {errorMessage && <p className="text-red-500 text-sm mb-2">{errorMessage}</p>}
            <p className="text-gray-500 mb-4 flex">
              <span className="text-orange-500">*</span> <h1 className='text-[10px]'>Your password should be a combination of capital and small letters, numbers, and special characters (@, #, $, *, &).</h1>
            </p>
            <div className='flex justify-center items-center'>
              <button
                type="submit"
                disabled={loading}
                className={`text-orange-600 border-2 border-orange-600 w-[300px] font-bold py-3 px-10 rounded-3xl  cursor-pointer hover:bg-orange-600 hover:text-white transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Registering...' : 'Register'}
              </button>
            </div>
          </form>
          <div className='flex justify-center items-center'>
              <p className="pt-2">Already have an account?</p>
            <Link to="/login">
              <button className=" pt-2 px-2 border-b-2 border-black transition-colors cursor-pointer duration-300 font-semibold hover:bg-white hover:text-orange-600">
                Login
              </button>
            </Link>
          </div>
        </div>   
        <div className=" justify-center mt-10 md:mt-20 md:w-[35%] items-center">
          <h2 className="mb-4">"Step into a world where financial support is no longer a privilege — it’s a shared mission. Borrow with dignity. Lend with purpose. Connect, grow, and thrive on your own terms."</h2>
          <div className=' flex cursor-pointer  '>
            <h1 className='md:w-[50px] w-[30px] h-[30px] md:h-[50px] bg-orange-600 ease-in-out transform duration-300 transition-transform hover:rotate-[360deg] rounded-full hover:rounded-none'></h1>
          </div>
        </div>
      </div>
   </div>
  );
};

export default Registration;