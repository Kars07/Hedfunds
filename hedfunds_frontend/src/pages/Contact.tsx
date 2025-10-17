import React, { useState, ChangeEvent, FormEvent, useRef } from "react";
import axios from "axios";
import '../gradient-text/gradient-text.css';
import group from '../assets/Group.jpeg';
import { useScroll, useTransform, motion } from 'framer-motion';

interface FormData {
  fullName: string;
  email: string;
  companyName: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    email: "",
    companyName: "",
    message: "",
  });

  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(""); 

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/users/contact`, formData);

      if (response.status === 200) {
        setSuccessMessage("Thank you for contacting SwiftFund! We'll get back to you soon.");
        setFormData({ fullName: "", email: "", companyName: "", message: "" });
      }
    } catch (error) {
      console.error(error);
      setErrorMessage("Something went wrong. Please try again later.");
    }
  };

  return (
    <div className="300vh">
      <h1 className="text-6xl  text-center pt-30 font-bold">Get in Touch – We're Here to Help!</h1>
      <h2 className="py-5 text-xl text-center">Have a question, need support, or interested in a business collaboration? <br></br>Our team is ready to assist you!</h2>
      <div className="w-[100%]">
        <Scale />
      </div>
      <div className="text-gray-700 transform -translate-y-20 relative flex flex-col lg:flex-row w-full">
        {/* Left Column */}
        <div className="w-full lg:w-[40%] pt-10 lg:pt-[5%] flex flex-col text-center justify-center items-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl italic font-special">Let's Chat</h1>
          <h2 className="px-6 sm:px-10 pt-4 text-base sm:text-lg">
            At Swiftfund, we prioritize timely responses to your needs.
          </h2>
        </div>

        {/* Vertical Divider (Hidden on small screens) */}
        <div className="hidden lg:flex justify-center items-center relative">
          <hr className="border-4 absolute top-60 rounded-4xl border-orange-600 w-0.5 bg-orange-600 h-[60vh]" />
        </div>

        {/* Right Column (Form) */}
        <div className="w-full lg:w-[40%] flex flex-col mt-10 lg:mt-40 justify-center px-6 sm:px-12 lg:ml-40">
          <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
            <div className="py-2">
              <label htmlFor="fullName" className="pb-1 font-bold">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="py-2">
              <label htmlFor="email" className="pb-1 font-bold">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="py-2">
              <label htmlFor="companyName" className="pb-1 font-bold">Company Name</label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div className="py-2">
              <label htmlFor="message" className="pb-1 font-bold">Message</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={4}
                required
              />
            </div>

            <div className="flex justify-center items-center pb-20">
              <button
                type="submit"
                className="inline-block hover:bg-orange-600 border-2 bg-blur hover:text-white text-orange-600 text-center rounded-3xl px-14 py-3 font-semibold shadow transition duration-150 cursor-pointer"
              >
                Submit
              </button>
            </div>

            {successMessage && (
              <div className="text-center text-green-600 font-semibold">
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="text-center text-red-600 font-semibold">
                {errorMessage}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;

const Scale = () => {
  const container = useRef(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ['start start', 'end end']
  })
  const scale4 = useTransform(scrollYProgress, [0, 1], [1, 3]);

  return (
    <div ref={container} className="container">
      <div className="sticky_">
        <div className="element">
          <motion.div style={{ scale: scale4 }} className="videoContainer">
            <img src={group} alt="" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}