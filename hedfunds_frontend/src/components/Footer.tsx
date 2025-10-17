import React from "react";
import logo from "../assets/logo.png";

const Footer: React.FC = () => {
  return (
    <footer className="footer overflow-hidden w-full px-10 rounded-t-4xl bg-zinc-900 flex flex-col items-center py-10 relative">
     

      <div className="footer-content flex flex-wrap justify-start items-start pt-16 max-w-[1200px] relative">
        <div className="-mx-40 w-full justify-start flex h-auto gap-2 text-2xl font-bold text-white mt-12 pl-36 absolute top-[-40px]">
          <img className="w-[50px] h-auto mb-5" src={logo} alt="Logo" />
          <div className="flex justify-center items-center">
            <h1>SWIFTFUND</h1>
          </div>
        </div>

        <div className="footer-column flex-1 min-w-[200px] mt-15 px-2 mr-20">
          <h3 className="text-white text-base mb-5">Products</h3>
          <ul className="list-none pb-4">
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Fund Pass</li>
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Fund Auth</li>
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Documentation</li>
          </ul>
        </div>

        <div className="footer-column flex-1 min-w-[200px] mt-15 px-2 mr-20">
          <h3 className="text-white text-base mb-5">Company</h3>
          <ul className="list-none pb-4">
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">About</li>
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">News</li>
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Team</li>
          </ul>
        </div>

        <div className="footer-column flex-1 min-w-[200px] mt-15 px-2 mr-20">
          <h3 className="text-white text-base mb-5">Support</h3>
          <ul className="list-none pb-4">
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Help Center</li>
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Information</li>
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Loan Agreements</li>
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Brand Guidelines</li>
          </ul>
        </div>

        <div className="footer-column flex-1 min-w-[200px] mt-15 px-2 mr-20">
          <h3 className="text-white text-base mb-5">Legal</h3>
          <ul className="list-none pb-4">
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Legal Disclosures</li>
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Privacy Policy</li>
            <li className="text-white/70 text-sm mb-3 cursor-pointer hover:text-white">Terms and Conditions</li>
          </ul>
        </div>
      </div>
      <hr className="w-[90vw] h-[1px] mt-20 mb-5 bg-zinc-100  border-none" />
      <div className="footer-bottom flex justify-between items-center py-4 text-white text-sm gap-[33rem]">
        &copy;2025. All rights reserved.
        <div className="footer-social-icons flex gap-4 ml-40">
          <a href="https://x.com/SwiftFund_" target="_blank" rel="noopener noreferrer">
            <i className="bx bxl-twitter text-white text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" />
          </a>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            <i className="bx bxl-github text-white text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" />
          </a>
          <a href="https://youtube.com" target="_blank" rel="noopener noreferrer">
            <i className="bx bxl-youtube text-white text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" />
          </a>
          <i className="bx bxl-linkedin text-white text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" />
        </div>
      </div>
    </footer>
  );
};

export default Footer;