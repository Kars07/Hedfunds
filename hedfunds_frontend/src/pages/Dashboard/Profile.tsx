import React, { useEffect, useState } from "react";
import default_profile from "../../assets/avatar-default.png";

// Dummy fetchProfile function (replace with real API call)
const fetchProfile = async () => {
  // Simulate API response
  return {
    lastLogin: "24/05/2025 13:08:07",
    WalletAdress: "addr1_12rqewq12rqe12rqe1.......f9",
    email: "michealbolu19@gmail.com",
    emailVerified: true,
    creditScore: "600",
    kycLevel: "Tier 2",
    fullName: "Oloyede Micheal",
    gender: "",
    dob: "Jul **, **",
    mobile: "",
    address: "",
    occupation: "",
  };
};

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile().then(setProfile);
  }, []);

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-orange-500 font-semibold">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 flex flex-col items-center">
      {/* Header */}
      <div className="w-full flex items-center mb-8 max-w-5xl px-6">
        <button className="text-orange-500 text-2xl mr-2 hover:bg-orange-50 rounded-full p-2">
          <svg width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-orange-600">My Profile</h1>
      </div>

      {/* Main Content Container */}
      <div className="w-full flex flex-col gap-8 items-center">
        {/* Profile Card */}
        <div className="w-full max-w-5xl ml-10 bg-white rounded-2xl shadow-lg px-10 pt-8 pb-6 border border-orange-100">
          <div className="flex items-center mb-4">
            <img
              src={default_profile}
              alt="Profile"
              className="w-16 h-16 rounded-full border-4 border-orange-200 object-cover mr-4"
            />
            <div>
              <p className="font-semibold text-gray-900 text-lg">
                Hi, <span className="text-orange-500">{profile.fullName.split(" ")[0].toUpperCase()}</span>
              </p>
              <p className="text-xs text-gray-500">
                Last login: <span className="text-orange-400">{profile.lastLogin}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 mt-4">
            <ProfileRow label="Wallet Adress" value={profile.WalletAdress} />
            <ProfileRow
              label="Email"
              value={
                <span className="flex items-center gap-1">
                  {profile.email}
                  {profile.emailVerified && (
                    <svg className="w-4 h-4 ml-1 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" />
                      <path d="M9 12l2 2l4-4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              }
            />
            <ProfileRow label="Credit Score" value={profile.creditScore} />
          </div>
        </div>

        {/* Details Card */}
        <div className="w-full max-w-5xl ml-10 bg-white rounded-2xl shadow-lg px-10 pt-8 pb-6 border border-orange-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
            <ProfileRow label="KYC Levels" value={profile.kycLevel} />
            <ProfileRow label="Full Name" value={profile.fullName} />
            <ProfileRow label="Gender" value={profile.gender  || <span className="text-orange-300">Not set</span>} />
            <ProfileRow label="Date of birth" value={profile.dob  || <span className="text-orange-300">Not set</span>} />
            <ProfileRow label="Mobile Number" value={profile.mobile  || <span className="text-orange-300">Not set</span>} />
            <ProfileRow label="Address" value={profile.address || <span className="text-orange-300">Not set</span>} />
            <ProfileRow label="Occupation" value={profile.occupation || <span className="text-orange-300">Not set</span>} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for profile rows
const ProfileRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
    <span className="font-medium text-gray-600">{label}</span>
    <span className="text-gray-900 text-right break-all">{value}</span>
  </div>
);

export default Profile;