import React, { useRef } from "react";
import { HowItWorks } from "../components/HowItWorks";
import { WhyChoose } from "../components/WhyChoose";
import FAQ from "../components/FAQ";
import HorizontalScrollEffect from "../components/HorizontalScrollEffect";
import { Ready } from "../components/Ready";
import KeyFeatures from "../components/KeyFeatures";
import { useTransform, motion, useScroll } from "framer-motion";

// Video Component
const Video: React.FC<{ scrollYProgress: any }> = ({ scrollYProgress }) => {
  const handleLearnMore = () => {
    window.open("/register", "_blank");
  };

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const rotate = useTransform(scrollYProgress, [0, 1], [0, -5]);

  return (
    <motion.div style={{ scale, rotate }} className="h-[150vh] top-0 sticky">
      <div className="relative">
        <video
          className="absolute top-0 right-0 w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          style={{ zIndex: -1 }}
        >
          <source src="/videos/market-women.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black opacity-50"></div>

        <div className="text-white text-center justify-center min-h-screen flex flex-col align-middle py-20 transform translate-y-10 relative z-10">
          <h1 className="md:text-5xl text-4xl font-extrabold mb-6">
            Borrow and Lend with Ease
          </h1>
          <h2 className="lg:px-0 px-5">
           Whether you’re a student, retiree, or business owner, SwiftFund lets you lend in minutes, or borrow securely <br />if you’re an employee of a registered company. With clear terms and the power of Cardano smart <br /> contracts, you’ll enjoy quick approvals and peace of mind backed by real community trust. </h2>
          <div className="flex justify-center">
            <button
              onClick={handleLearnMore}
              className="relative overflow-hidden rounded-4xl cursor-pointer transform transition-all duration-300 ease-in-out hover:-translate-y-1 hover:scale-110 bg-[length:200%_100%] bg-no-repeat bg-[linear-gradient(to_right,_#ea580c_50%,_#c2410c_50%)] bg-right hover:bg-left text-white font-bold py-4 px-7 m-7"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main HeaderSection Component
const HeaderSection: React.FC = () => {
  const container = useRef<HTMLDivElement>(null); // ✅ Fix: typed ref properly
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end end"]
  });

  return (
    <div>
      <div ref={container} className="justify-center relative h-[300vh]">
        <Video scrollYProgress={scrollYProgress} />
        <HowItWorks />
      </div>

      <KeyFeatures />

      <div className="w-full h-full relative top-0 object-cover bg-zinc-900">
        <h1 className="md:text-9xl text-7xl pb-10 pl-10 transform translate-y-30 font-bold sticky text-white">
          FAQ
        </h1>
        <FAQ />
      </div>

      <div className="pt-25">
        <WhyChoose />
      </div>

      <div>
        <HorizontalScrollEffect />
      </div>

      <div>
        <Ready />
      </div>
    </div>
  );
};

export default HeaderSection;
