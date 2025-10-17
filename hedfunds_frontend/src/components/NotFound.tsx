import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-center text-white overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-16 w-96 h-96 bg-blue-500 opacity-20 rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-orange-500 opacity-20 rounded-full animate-pulse"></div>
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-green-500 opacity-10 rounded-full animate-pulse"></div>
      </div>

      {/* Content */}
      <h1 className="text-9xl font-extrabold text-red-600 drop-shadow-md z-10">404</h1>
      <h2 className="text-3xl font-semibold mt-4 drop-shadow-md z-10">Page Not Found</h2>
      <p className="text-lg mt-2 text-gray-300 z-10">
        Oops! The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={handleBackToHome}
        className="mt-8 px-6 py-3 bg-orange-500 text-white rounded-full text-lg font-medium shadow-lg hover:bg-orange-600 hover:shadow-xl transition-all duration-300 cursor-pointer z-10"
      >
        Back to Home
      </button>
    </div>
  );
};

export default NotFound;