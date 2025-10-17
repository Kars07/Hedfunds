import React from 'react';
import logo from '../../assets/logo.png';
import cardanoImg from '../../assets/cardano_image.png'
import { useNavigate } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();

   return (
    <div className="bg-orange-50 min-h-screen flex items-center justify-center py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center space-x-2">
            {/* Logo Icon */}
           <img 
           src={logo} alt="SwiftFunds Logo" className="w-8 h-auto mr-3" 
           />
            <span className="text-xl font-bold text-black">SWIFTFUND</span>
          </div>
        </div>
        <hr className="my-3 border-t border-gray-200" />

        {/* Main Icon */}
        <div className="flex flex-col items-center mt-6 mb-4">
           <span className="ml-2  text-orange-600">
                <i className="bx bx-envelope text-6xl"></i>
              </span>
        </div>

        {/* Main content */}
        <div className="text-center mb-5">
          <h2 className="text-2xl font-semibold text-orange-600 mb-2">Email Verification Link</h2>
          <p className="text-gray-700 text-base">
           We've sent a verification link to your email. Please check your inbox and click the link to verify your account. Once verified, you can proceed to log in.
          </p>
        </div>

        {/* Secure Button */}
        <div className="flex justify-center mb-3">
          <button
            onClick={() => navigate('/login')}
             className="bg-white border-2 border-orange-600 text-orange-600 font-bold mt-2 py-2 px-4 rounded-lg w-1/2  cursor-pointer hover:bg-orange-600 hover:text-white transition-colors duration-300"
          >
            Redirect to Login
          </button>
        </div>
        <p className="text-gray-400 text-xs text-center mb-4">Please ignore if this was not done by you.</p>

        {/* Footer */}
        <div className="bg-gray-50 -mx-8 px-8 py-4 rounded-b-2xl mt-4">
          <p className="text-gray-400 text-xs text-center">
            You're receiving this email because your account needs to be verified before you can proceed to use our services.<br/>
            © 2025. swiftfund.com All rights reserved<br/>
            Lagos Nigeria, 100015.
          </p>
        </div>
        <div className="flex justify-between mt-2">
          <a href="#" className="text-xs text-gray-400 hover:underline">Unsubscribe</a>
          <span className="text-xs text-gray-400"> 
             <img 
           src={cardanoImg} alt="Cardano Logo" className="w-20 h-auto" 
           />
          </span>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
