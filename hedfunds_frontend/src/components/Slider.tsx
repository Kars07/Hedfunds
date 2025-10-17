import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface Slide {
  src: string;
  label: string;
  content: string;
}

const Slides: Slide[] = [
  {
    src: "/apply.png",
    label: "Apply",
    content: "Sign up and submit your loan request",
  },
  {
    src: "/match.png",
    label: "Match",
    content: "We connect you with potential lenders on our platform",
  },
  {
    src: "/money.png",
    label: "Fund",
    content: "Receive your fund directly once matched and approved",
  },
];

const ResponsiveSlider: React.FC = () =>{
  const [current, setCurrent] = useState<number>(0);

  const nextSlide = () => {
    setCurrent((prev) => (prev + 1) % Slides.length);
  };

  const prevSlide = () => {
    setCurrent((prev) => (prev - 1 + Slides.length) % Slides.length);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full  max-w-4xl mx-auto p-4">
      <div className="relative overflow-hidden rounded-4xl shadow-xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center bg-white p-6 cursor-pointer"
            onClick={nextSlide}
          >
            <img
              src={Slides[current].src}
              alt={Slides[current].label}
              className="w-full md:w-1/2 h-64 object-contain"
            />
            <div className=" text-center md:text-left">
              <h2 className="text-2xl font-bold text-zinc-900 ">
                {Slides[current].label}
              </h2>
              <p className="mt-2 text-gray-600 ">
                {Slides[current].content}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Arrow Buttons */}
        <button
          onClick={prevSlide}
          className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-white dark:bg-gray-700 p-2 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-white" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-white dark:bg-gray-700 p-2 rounded-full shadow hover:bg-gray-100 dark:hover:bg-gray-600"
        >
          <ArrowRight className="w-6 h-6 text-gray-800 dark:text-white" />
        </button>
      </div>
    </div>
  );
}
export default ResponsiveSlider;
