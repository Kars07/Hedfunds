import '../gradient-text/gradient-text.css';
import '../index.css';
import Slider from "./Slider";
import hand from '../assets/hand.png';
import cloud from '../assets/cloud.png'

export const HowItWorks = () => {
  return (
    <div className='relative w-full   bg-white min-h-[100vh] md:min-h-[170vh] pb-0 md:pb-10 overflow-hidden md:px-4'>
      <section className="bg-white pt-20 flex justify-center items-center text-center">
        <div className="mx-auto text-center ">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 px-4">Explore Decentralized Lending with Swiftfund</h2>
          <p className="md:text-lg md:px-2 text-gray-700 mb-6 m-auto text-center w-[70%] md:w-[50%]">
            Start with SWIFTFund to take control of your financial future through secure, transparent,
            peer-to-peer lending. Experience trustless finance with blockchain at its core.
          </p>
          <a href="#" className="inline-block hover:bg-orange-600 border-3 hover:text-white delay-100 duration-150 text-orange-600 rounded-3xl px-6 py-3 font-semibold shadow hover:transition">
            Discover More
          </a>
        </div>
      </section>

      {/* --- Hand Image --- */}
     <div className="relative w-full flex items-center justify-center mt-10 mb-25">
  <div className="relative">
    <img
      src={hand}
      alt="Hand"
      className="md:h-[40em] h-[25em] z-10 md:translate-x-0 object-cover"
    />
    {/* Cloudy bottom overlay */}    <div className="absolute top-50 md:top-100 md:translate-x-70 z-20 ">
      <img src={cloud} alt="" className="translate-x-9" />
    </div>
  </div>
</div>



      {/* --- Steps: Responsive layout --- */}
      <div className='md:hidden block'>
       <Slider />
      </div>
      {/* Destop */}
      <div className="md:flex top-35 left-30  absolute hidden">

        {/* Step 1: Apply */}
        <div className="h-screen flex flex-col justify-center items-center text-center  cursor-pointer hover:scale-105 transition-transform duration-300">
          <img
            src="/apply.png"
            alt="Apply"
            className="w-full max-w-[80px] mb-4"
            style={{
              filter: "sepia(1) hue-rotate(-20deg) saturate(4) brightness(1.1)",
            }}
          />
          <h2 className="text-2xl text-orange-600 font-bold mb-2">Apply</h2>
          <p className="text-lg text-gray-600">Sign up and submit <br />your loan request</p>
        </div>

        {/* Step 2: Match */}
        <div className="h-screen flex translate-x-160 translate-y-40 flex-col justify-center items-center text-center cursor-pointer hover:scale-105 transition-transform duration-300">
          <img
            src="/match.png"
            alt="Match"
            className="w-full max-w-[80px] mb-4"
            style={{
              filter: "sepia(1) hue-rotate(-20deg) saturate(4) brightness(1.1)",
            }}
          />
          <h2 className="text-2xl text-orange-600 font-bold mb-2">Match</h2>
          <p className="text-lg text-gray-600">We connect you with potential<br /> lenders on our platform</p>
        </div>

        {/* Step 3: Fund */}
        <div className="h-screen flex flex-col translate-y-110 -translate-x-70 justify-center items-center text-center snap-start cursor-pointer hover:scale-105 transition-transform duration-300">
          <img
            src="/money.png"
            alt="Fund"
            className="w-full max-w-[80px] mb-4"
            style={{
              filter: "sepia(1) hue-rotate(-20deg) saturate(4) brightness(1.1)",
            }}
          />
          <h2 className="text-2xl text-orange-600 font-bold mb-2">Fund</h2>
          <p className="text-lg text-gray-600">Receive your fund directly <br /> once matched and approved</p>
        </div>
      </div>  
    </div>
  );
};


