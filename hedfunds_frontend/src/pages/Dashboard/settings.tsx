import React, { useState, useRef } from "react";

const SettingsPanel: React.FC = () => {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="py-10 px-4 sm:px-8 rounded-3xl max-w-2xl mx-auto ml-20">
      <h2 className="text-xl font-bold text-gray-900 mb-6 text-left">General settings</h2>
      <div className="flex flex-col items-center space-y-5">
        {/* Upload Photo */}
        <button
          onClick={triggerFileInput}
          className="flex items-center w-full max-w-xl px-3 py-2 bg-orange-50 rounded-xl hover:bg-orange-100 transition focus:outline-none shadow"
        >
          <span className="flex-shrink-0 bg-white rounded-full p-2 mr-4 border border-orange-100 relative">
            {profileImage ? (
              <img
                src={profileImage}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <svg
                className="w-6 h-6 text-orange-500"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="13" r="4" />
                <path d="M2 7h4l2-3h8l2 3h4v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z" />
              </svg>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </span>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm text-orange-600">Upload Photo</span>
            <span className="text-xs text-gray-500">Reset password</span>
          </div>
        </button>

        {/* Account Settings */}
        <button className="flex items-center w-full max-w-xl px-3 py-2 bg-orange-50 rounded-xl hover:bg-orange-100 transition focus:outline-none shadow">
          <span className="flex-shrink-0 bg-white rounded-full p-2 mr-4 border border-orange-100">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="8" r="4" />
              <path d="M16 20c0-2.21-3.58-4-8-4s-8 1.79-8 4" />
            </svg>
          </span>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm text-orange-600">Account Settings</span>
            <span className="text-xs text-gray-500">Manage profile</span>
          </div>
        </button>

        {/* Dark Mode */}
        <div className="flex items-center w-full max-w-xl px-3 py-2 bg-orange-50 rounded-xl shadow">
          <span className="flex-shrink-0 bg-white rounded-full p-2 mr-4 border border-orange-100">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="3" />
              <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
            </svg>
          </span>
          <div className="flex flex-col items-start flex-grow">
            <span className="font-semibold text-sm text-orange-600">Dark Mode</span>
            <span className="text-xs text-gray-500">Switch app display to your preference</span>
          </div>
          <label className="ml-4 inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={() => setDarkMode(!darkMode)}
              className="sr-only"
            />
            <div className={`w-10 h-5 flex items-center rounded-full p-1 transition ${darkMode ? "bg-orange-500" : "bg-orange-200"}`}>
              <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition ${darkMode ? "translate-x-5" : ""}`}></div>
            </div>
          </label>
        </div>

        {/* Contact Us */}
        <button className="flex items-center w-full max-w-xl px-3 py-2 bg-orange-50 rounded-xl hover:bg-orange-100 transition focus:outline-none shadow">
          <span className="flex-shrink-0 bg-white rounded-full p-2 mr-4 border border-orange-100">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3" />
              <circle cx="12" cy="17" r="1" />
            </svg>
          </span>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm text-orange-600">Contact us</span>
            <span className="text-xs text-gray-500">Help or contact Billzpay</span>
          </div>
        </button>

        {/* Deactivate/Delete Account */}
        <button className="flex items-center w-full max-w-xl px-3 py-2 bg-orange-50 rounded-xl hover:bg-orange-100 transition focus:outline-none shadow">
          <span className="flex-shrink-0 bg-white rounded-full p-2 mr-4 border border-orange-100">
            <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <rect x="3" y="6" width="18" height="15" rx="2" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </span>
          <div className="flex flex-col items-start">
            <span className="font-semibold text-sm text-orange-600">Deactivate/Delete Account</span>
            <span className="text-xs text-gray-500">Account Deactivation</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;