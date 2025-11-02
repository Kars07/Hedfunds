import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import logo from "../../assets/logo.png";
import default_profile from "../../assets/avatar-default.png";
import { Address, Blockfrost, Lucid, LucidEvolution, paymentCredentialOf, WalletApi, PaymentKeyHash } from "@lucid-evolution/lucid";
import Verification from "./Verification";


type Wallet = {
  name: string;
  icon: string;
  apiVersion: string;
  enable: () => Promise<WalletApi>;
  isEnabled: () => Promise<boolean>;
};

type Connection = {
  api: WalletApi;
  lucid: LucidEvolution;
  address: Address;
  pkh: PaymentKeyHash;
};

interface WalletContextType {
  wallets: Wallet[];
  connection: Connection | null;
  isConnecting: boolean;
  connectWallet: (wallet: Wallet) => Promise<void>;
  disconnectWallet: () => void;
}


const WalletContext = createContext<WalletContextType | null>(null);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

// Welcome Modal Component
const WelcomeModal: React.FC<{ 
  isOpen: boolean; 
  userName: string; 
  onClose: () => void; 
  onProceedKYC: () => void; 
}> = ({ isOpen, userName, onClose, onProceedKYC }) => {
  if (!isOpen) return null;


  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
        >
          <i className="bx bx-x"></i>
        </button>
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to HedFunds Dashboard
          </h1>
          <p className="text-lg text-gray-600">
            Hello, <span className="font-semibold text-orange-600">{userName}</span>! 
          </p>
        </div>
        
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-orange-100 p-3 rounded-full">
              <i className="bx bx-shield-check text-2xl text-orange-600"></i>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">
            KYC Verification Required
          </h2>
          <p className="text-gray-600 mb-4">
            Before you can make a loan request, you need to complete your KYC (Know Your Customer) verification. 
            This helps us ensure the security and compliance of our platform.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300"
          >
            Skip for Now
          </button>
          <button
            onClick={onProceedKYC}
            className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300 transform hover:scale-105 shadow-md"
          >
            <i className="bx bx-right-arrow-alt mr-2"></i>
            Proceed to KYC Verification
          </button>
        </div>
        
        <div className="mt-6 text-sm text-gray-500">
          <p>Need help? Contact our support team for assistance.</p>
        </div>
      </div>
    </div>
  );
};

// KYC Verification Modal Component
const KYCVerificationModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}> = ({ isOpen, onClose, onComplete }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="max-w-4xl w-full max-h-[90vh] bg-white rounded-2xl shadow-2xl relative overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl z-10"
        >
          <i className="bx bx-x"></i>
        </button>
        
        <div className="p-6 h-full overflow-y-auto">
          {/* Your Verification component goes here */}
          <Verification 
            onComplete={onComplete}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [isNaira, setIsNaira] = useState<boolean>(true);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [nairaBalance] = useState<number>(5000);

  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");

  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const [showBorrowerActions, setShowBorrowerActions] = useState<boolean>(false);
  const [showLenderActions, setShowLenderActions] = useState<boolean>(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [showKYCModal, setShowKYCModal] = useState<boolean>(false);
  const navigate = useNavigate();

  // Wallet state
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [showWalletDropdown, setShowWalletDropdown] = useState<boolean>(false);

  // Mobile menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth < 768
  );

  useEffect(() => {
    const fetchExchangeRate = async () => {
      try {
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=cardano&vs_currencies=ngn"
        );
        const data = await response.json();
        const rate = data.cardano.ngn;
        setExchangeRate(rate);
      } catch (error) {
        console.error("Error fetching exchange rate", error);
      }
    };

    fetchExchangeRate();
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUserName(parsedUser.fullname || "User");
        setUserEmail(parsedUser.email || "user@example.com");
        
        // Check if welcome modal has been shown before
        const hasSeenWelcome = localStorage.getItem("hasSeenWelcomeModal");
        if (!hasSeenWelcome) {
          setShowWelcomeModal(true);
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [navigate]);

  // Load available wallets
  useEffect(() => {
    function getWallets(): Wallet[] {
      const walletList: Wallet[] = [];
      const { cardano } = window as any;

      if (!cardano) {
        console.error("Cardano object not found. Please install a wallet extension.");
        return walletList;
      }

      for (const c in cardano) {
        const wallet = cardano[c];
        if (!wallet.apiVersion) continue;
        walletList.push(wallet);
      }

      return walletList.sort((l, r) => {
        return l.name.toUpperCase() < r.name.toUpperCase() ? -1 : 1;
      });
    }

    setWallets(getWallets());
  }, []);

  // Check for cached wallet connection
  useEffect(() => {
    const checkSavedConnection = async () => {
      const savedWalletName = localStorage.getItem("connected_wallet");
      if (savedWalletName && wallets.length > 0) {
        const wallet = wallets.find(w => w.name === savedWalletName);
        if (wallet) {
          try {
            const isEnabled = await wallet.isEnabled();
            if (isEnabled) {
              connectWallet(wallet);
            }
          } catch (error) {
            console.error("Failed to reconnect wallet:", error);
          }
        }
      }
    };

    if (wallets.length > 0) {
      checkSavedConnection();
    }
  }, [wallets]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
  
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    disconnectWallet();
    
    localStorage.removeItem("user");

    try {
      await fetch(
        `${
          import.meta.env.VITE_API_URL || "http://localhost:5000"
        }/api/users/logout`,
        {
          method: "POST",
          credentials: "include",
        }
      );
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setShowLogoutModal(false);
      navigate("/login");
    }
  };

  const toggleBorrowerActions = () => {
    setShowBorrowerActions(!showBorrowerActions);
  };

  const toggleLenderActions = () => {
    setShowLenderActions(!showLenderActions);
  };

  const toggleWalletDropdown = () => {
    setShowWalletDropdown(!showWalletDropdown);
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) setMenuOpen(false);
  };

  // Handle KYC proceed button
  const handleProceedKYC = () => {
    setShowWelcomeModal(false);
    setShowKYCModal(true);
    // Mark that user has seen the welcome modal
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };

  // Handle closing welcome modal
  const handleCloseWelcomeModal = () => {
    setShowWelcomeModal(false);
    localStorage.setItem("hasSeenWelcomeModal", "true");
  };
 
  // Handle KYC completion
  const handleKYCComplete = () => {
    setShowKYCModal(false);
    console.log("KYC verification completed!");
  };

  // Handle KYC modal close
  const handleCloseKYCModal = () => {
    setShowKYCModal(false);
  };

  // Wallet connect function
  const connectWallet = async (wallet: Wallet) => {
    try {
      setIsConnecting(true);
      setWalletError(null);
      
      const api = await wallet.enable();
      
      const lucid = await Lucid(
        new Blockfrost(
          "https://cardano-preprod.blockfrost.io/api/v0", 
          "preprodtJBS315srwdKRJldwtHxMqPJZplLRkCh"
        ), 
        "Preprod"
      );
      
      lucid.selectWallet.fromAPI(api);

      const address = await lucid.wallet().address();
      const pkh = paymentCredentialOf(address).hash;

      const conn = { api, lucid, address, pkh };
      setConnection(conn);
      
      // Save connection to localStorage
      localStorage.setItem("connected_wallet", wallet.name);
      
      // Close dropdown after connecting
      setShowWalletDropdown(false);
      
      console.log("Wallet connected successfully:", wallet.name);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      setWalletError(`Failed to connect ${wallet.name}. Please try again.`);
    } finally {
      setIsConnecting(false);
    }
  };

  // Wallet disconnect function
  const disconnectWallet = () => {
    setConnection(null);
    localStorage.removeItem("connected_wallet");
  };

  // Create wallet context value
  const walletContextValue: WalletContextType = {
    wallets,
    connection,
    isConnecting,
    connectWallet,
    disconnectWallet,
  };

  return (
    <WalletContext.Provider value={walletContextValue}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-gray-100 text-gray-900 relative overflow-hidden">

        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-40 right-20 w-72 h-72 bg-orange-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '2s'}}></div>
          <div className="absolute -bottom-8 left-40 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse" style={{animationDelay: '4s'}}></div>
        </div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>

        <div className="relative z-10 flex flex-row">
          {isMobile && !menuOpen && (
            <button
              onClick={toggleMenu}
              className="fixed top-4 left-4 z-50 text-gray-900 text-2xl bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-gray-200/50 hover:bg-white/30 transition-all duration-300"
            >
              ☰
            </button>
          )}
          
          {/* Sidebar */}
          <aside className={`w-[100vw] scroll-auto shadow-xl md:w-1/4 z-10 bg-white/70 backdrop-blur-xl border-r border-gray-200/50 text-white p-4 flex flex-col justify-between h-full md:h-[100vh] overflow-hidden fixed transform transition-transform duration-300 md:static ${
            isMobile ? "w-2/3 bg-white/80 backdrop-blur-xl " : "w-1/5"}
           ${menuOpen || !isMobile ? "translate-x-0" : "-translate-x-full"}`}
          >
           {isMobile && (
              <button
                onClick={toggleMenu}
                className="absolute top-4 right-4 text-xl hover:bg-gray-200/50 rounded-full p-2 transition-all duration-300 text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
              </button>
            )}

            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center md:pt-0 pt-8 space-x-3 mb-8">
                <img src={logo} alt="HedFunds Logo" className="w-8 h-8" />
                <div className="text-xl text-black font-bold">
                  <span>DASHBOARD</span>
                </div>
              </div>

              {/* Navigation */}
              <nav className="mt-6 space-y-2">
                {/* Home */}
                <div
                  className="group flex items-center space-x-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white py-4 px-10 rounded-4xl shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                  onClick={() => handleNavigation("/dashboard")}
                >
                  <i className="bx bx-home text-lg"></i>
                  <span className="text-sm font-medium">Home</span>
                </div>

                {/* Borrower Actions */}
                <div className="group">
                  <div
                    className="flex items-center justify-between py-4 px-10 rounded-4xl text-gray-700 hover:text-orange-600 cursor-pointer bg-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200"
                    onClick={toggleBorrowerActions}
                  >
                    <div className="flex items-center space-x-3">
                      <i className="bx bx-user text-lg"></i>
                      <span className="text-sm font-medium">Borrower Actions</span>
                    </div>
                    <i
                      className={`bx bx-chevron-down text-sm transition-transform duration-200 ${
                        showBorrowerActions ? "rotate-180" : "rotate-0"
                      }`}
                    ></i>
                  </div>

                  <div
                    className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${
                      showBorrowerActions ? "max-h-48" : "max-h-0"
                    }`}
                  >
                    <div className="mt-1 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm">
                      <div
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:text-orange-600 cursor-pointer hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200 first:rounded-t-lg text-sm"
                        onClick={() => handleNavigation("/dashboard/applications")}
                      >
                        <i className="bx bx-folder text-base"></i>
                        <span>Apply for Loan</span>
                      </div>
                      <div
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:text-orange-600 cursor-pointer hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200 text-sm border-t border-gray-100"
                        onClick={() => handleNavigation("/dashboard/myloan-applications")}
                      >
                        <i className="bx bx-edit text-base"></i>
                        <span>My Loan Requests</span>
                      </div>
                      <div
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:text-orange-600 cursor-pointer hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200 text-sm border-t border-gray-100"
                        onClick={() => handleNavigation("/dashboard/loanstoberepaid")}
                      >
                        <i className="bx bx-transfer text-base"></i>
                        <span>Repay Loan</span>
                      </div>
                      <div
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:text-orange-600 cursor-pointer hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200 text-sm border-t border-gray-100 last:rounded-b-lg"
                        onClick={() => handleNavigation("/dashboard/loansirepaid")}
                      >
                        <i className="bx bx-refresh text-base"></i>
                        <span>Repaid Loans</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lender Actions */}
                <div className="group">
                  <div
                    className="flex items-center justify-between py-4 px-10 rounded-4xl text-gray-700 hover:text-orange-600 cursor-pointer bg-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200"
                    onClick={toggleLenderActions}
                  >
                    <div className="flex items-center space-x-3">
                      <i className="bx bx-money text-lg"></i>
                      <span className="text-sm font-medium">Lender Actions</span>
                    </div>
                    <i
                      className={`bx bx-chevron-down text-sm transition-transform duration-200 ${
                        showLenderActions ? "rotate-180" : "rotate-0"
                      }`}
                    ></i>
                  </div>

                  <div
                    className={`transition-[max-height] duration-300 ease-in-out overflow-hidden ${
                      showLenderActions ? "max-h-32" : "max-h-0"
                    }`}
                  >
                    <div className="mt-1 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm">
                      <div
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:text-orange-600 cursor-pointer hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200 first:rounded-t-lg text-sm"
                        onClick={() => handleNavigation("/dashboard/fundaloan")}
                      >
                        <i className="bx bx-search text-base"></i>
                        <span>Fund a Loan</span>
                      </div>
                      <div
                        className="flex items-center space-x-3 px-4 py-2.5 text-gray-700 hover:text-orange-600 cursor-pointer hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200 text-sm border-t border-gray-100 last:rounded-b-lg"
                        onClick={() => handleNavigation("/dashboard/loans-funded")}
                      >
                        <i className="bx bx-dollar-circle text-base"></i>
                        <span>My Funded Loans</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile */}
                <div
                  className="group flex items-center space-x-3 py-4 px-10 rounded-4xl text-gray-700 hover:text-orange-600 bg-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200 cursor-pointer"
                  onClick={() => handleNavigation("/dashboard/profile")}
                >
                  <i className="bx bx-user text-lg"></i>
                  <span className="text-sm font-medium">Profile</span>
                </div>

                {/* Settings */}
                <div
                  className="group flex items-center space-x-3 py-4 px-10 rounded-4xl text-gray-700 hover:text-orange-600 bg-white/50 backdrop-blur-sm border border-gray-200/50 hover:border-orange-300 hover:bg-gradient-to-r hover:from-orange-50/70 hover:to-orange-100/70 transition-all duration-200 cursor-pointer"
                  onClick={() => handleNavigation("/dashboard/settings")}
                >
                  <i className="bx bx-cog text-lg"></i>
                  <span className="text-sm font-medium">Settings</span>
                </div>
              </nav>
            </div>

            {/* User Profile Section - Fixed at bottom */}
            <div className="mt-4 flex items-center py-3 px-3 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-lg shadow-sm">
              <img
                src={default_profile}
                alt="User Avatar"
                className="w-10 h-10 rounded-full border-2 border-orange-300 shadow-sm flex-shrink-0"
              />
              <div className="ml-3 flex-1 min-w-0">
                <h2 className="text-sm text-gray-800 font-semibold truncate">{userName}</h2>
                <p className="text-xs text-gray-500 truncate">{userEmail}</p>
              </div>
              <button
                onClick={() => setShowLogoutModal(true)}
                className="text-gray-600 hover:text-orange-600 cursor-pointer bg-white/60 p-2 rounded-lg hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-200 flex-shrink-0"
                title="Logout"
              >
                <i className="bx bx-log-in text-lg"></i>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 bg-white/30 backdrop-blur-xl pl-0 pr-6 py-6 h-screen overflow-y-auto">
            <Outlet />
          </main>

          {/* Welcome Modal */}
          <WelcomeModal 
            isOpen={showWelcomeModal}
            userName={userName}
            onClose={handleCloseWelcomeModal}
            onProceedKYC={handleProceedKYC}
          />

          {/* KYC Verification Modal */}
          <KYCVerificationModal
            isOpen={showKYCModal}
            onClose={handleCloseKYCModal}
            onComplete={handleKYCComplete}
          />

          {/* Logout Confirmation Modal */}
          {showLogoutModal && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50">
              <div className="bg-white/90 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl p-8 w-96 transform transition-all duration-300">
                <h2 className="text-2xl font-semibold mb-4 text-gray-800">
                  Confirm Logout
                </h2>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to log out?
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="px-6 py-3 bg-gray-200/80 backdrop-blur-xl text-gray-800 rounded-xl hover:bg-gray-300/80 transition-all duration-300 transform hover:scale-105 border border-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white rounded-xl hover:from-orange-700 hover:to-orange-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </WalletContext.Provider>
  );
};

export default Dashboard;