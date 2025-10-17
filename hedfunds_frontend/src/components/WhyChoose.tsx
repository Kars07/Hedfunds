import React, { useState } from 'react';
import secure from '../assets/secure.png';
import fast from '../assets/fast.png';
import middleman from '../assets/middleman.png';

interface FlipCardProps {
  frontTitle: string;
  backText: string;
  image: string;
}

const FlipCard: React.FC<FlipCardProps> = ({ frontTitle, backText, image }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="w-[260px] shadow-xl mt-12 border-4 border-gray-600 rounded-3xl h-[400px] m-4 perspective cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div
        className={`w-full h-full relative preserve-3d transition-transform duration-500 delay-200 rounded-2xl ${
          isFlipped ? 'rotate-y-180' : ''
        } hover:rotate-y-180`}
      >
        {/* Front Face */}
        <div className="absolute w-full h-full backface-hidden rounded-2xl shadow-lg z-10 overflow-hidden">
          <div
            className="absolute w-full h-full"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(50px)',
              WebkitBackdropFilter: 'blur(50px)',
              zIndex: 1,
            }}
          />
          <div className="flex flex-col justify-center items-center h-full relative z-10 text-black font-bold text-2xl">
            <img src={image} alt="card visual" className="w-34 h-34 object-contain mb-4" />
            <div className='text-2xl'> {frontTitle}</div>
          </div>
        </div>

        {/* Back Face */}
        <div
          className="absolute w-full h-full pt-10 backface-hidden rotate-y-180 bg-cover rounded-xl shadow-lg"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
        >
          <div className='text-2xl font-bold text-white text-center'> {frontTitle}</div>
          <div>
            <h1 className="text-xl mt-10 text-center flex justify-center items-center h-50 border-4 border-gray-600 rounded-3xl m-2 text-white font-bold p-5 leading-relaxed">
              {backText}
            </h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export const WhyChoose: React.FC = () => {
  return (
    <div className="align-middle">
      <div className="pt-20 text-white text-center">
        <h1 className="pb-3 text-4xl font-bold text-black">WHY CHOOSE SWIFTFUND</h1>
        <h2 className="text-black max-w-4xl mx-auto px-4 leading-relaxed">
          At SwiftFund, we believe financial freedom should be accessible to everyone. That’s why we’ve
          built a community-first platform where borrowers and lenders connect directly. 
        </h2>
        <div className="justify-center flex mt-4">
          <div className="border border-white w-50 rounded-2xl h-3 bg-white"></div>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center">
        <div className="flex flex-wrap justify-center space-x-2">
          <FlipCard
            frontTitle="Secure"
            backText="Built on Cardano ensuring end-to-end security"
            image={secure}
          />
          <FlipCard
            frontTitle="Transparent"
            backText="Quick application and approval process"
            image={fast}
          />
          <FlipCard
            frontTitle="No Middleman"
            backText="Connects directly with lenders or borrowers, no middleman"
            image={middleman}
          />
        </div>
      </div>
    </div>
  );
};
