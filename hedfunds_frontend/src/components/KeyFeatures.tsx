import React, { useEffect, useRef } from 'react';
import arrow from "../assets/arrow.png";

const KeyFeatures: React.FC = () => {
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength} ${pathLength}`;
    path.style.strokeDashoffset = pathLength.toString();

    const handleScroll = () => {
      const rect = path.getBoundingClientRect();
      const pathTop = rect.top;
      const pathHeight = rect.height;
      const windowHeight = window.innerHeight;

      if (pathTop < windowHeight && pathTop + pathHeight > 0) {
        const visibleRatio = Math.min(1, (windowHeight - pathTop) / (windowHeight + pathHeight));
        const speedFactor = 1.5;
        const drawLength = Math.min(pathLength, pathLength * visibleRatio * speedFactor);
        path.style.strokeDashoffset = (pathLength - drawLength).toString();
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  return (
    <div className="md:py-30 pb-0 px-5 md:mt-20 mt-100 overflow-hidden">
      <h1 className="text-4xl md:pt-10 font-bold text-gray-900 text-center">KEY FEATURES OF HEDFUNDS</h1>
      <div className="justify-center text-center items-center pt-3 flex">
         <div className=''>We are all about our client's comfort and safety. That's why we provide the best service you</div>
      </div>
      <div className="flex justify-center pt-10 md:pt-20 pb-10">
        <div className="border-3 w-12 animate-bounce h-12 rounded-full justify-center items-center flex">
          <img src={arrow} alt="arrow" className="w-8" style={{ filter: "brightness(0)" }} />
        </div>
      </div>

      {/* 🟢 Animated SVG */}
      <div className='md:block hidden'>
        <div className="relative">
          <svg width="1184" height="741" viewBox="0 0 1584 941" className="transform absolute -z-10 -translate-y-10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g filter="url(#filter0_d_1_3)">
              <path
                ref={pathRef}
                d="M5 5C349.784 47.2114 515.585 84.7439 773 171C966.325 241.023 1066.55 283.289 1201 375L1465 544C1534.56 573.225 1559.12 568.34 1574 517C1557.98 469.576 1544.77 447.112 1489.5 438C1447.28 444.151 1423.51 447.845 1378 462.5L1165.5 544C1114.82 562.835 1018.91 688.1 694 726.5C610.572 738.871 565.747 743.236 490 745.5C409.723 755.23 365.305 762.552 305 835.5C244.944 899.042 208.869 911.283 144 928"
                stroke="#ea580c"
                strokeWidth="10"
                shapeRendering="crispEdges"
                style={{ transition: 'stroke-dashoffset 0.3s ease-out' }}
              />
            </g>
            <defs>
              <filter id="filter0_d_1_3" x="0.392" y="0.037" width="1582.85" height="940.805" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
                <feFlood floodOpacity="0" result="BackgroundImageFix" />
                <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 127 0" result="hardAlpha" />
                <feOffset dy="4" />
                <feGaussianBlur stdDeviation="2" />
                <feComposite in2="hardAlpha" operator="out" />
                <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.25 0" />
                <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_1_3" />
                <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_1_3" result="shape" />
              </filter>
            </defs>
          </svg>
        </div>
      </div>
      {/* 📝 Key Features Content */}
      <div className=' text-center md:text-left mx-4 md:mx-0'>
        <div className='py-20 md:py-0 md:border-none border-4 mb-14 md:mb-0 md:rounded-none md:shadow-none rounded-4xl shadow-2xl'>
          <h1 className="text-black font-medium text-3xl md:text-3xl pt-0 md:pt-10 pb-5">🔁 Dual Roles</h1>
          <h2 className='md:text-lg text-xl px-4'>
            Anyone can be a lender at any time students, <br></br>retirees, business owners.
            Only employees of<br></br> registered companies can borrow.
          </h2>
        </div>
        <div className="justify-center md:flex md:flex-col items-center mb-14 md:mb-0  py-20 md:py-0 md:border-none md:rounded-none md:shadow-none border-4 rounded-4xl shadow-2xl">
          <h1 className="text-black md:px-0 px-10 font-medium text-3xl md:text-3xl pt-0 md:pt-10 pb-5">📤 Blockchain Submissions</h1>
          <h2 className='md:text-lg text-xl px-2'>
            Loan requests are submitted to the Hedera<br />
            blockchain, ensuring transparency, immutability, <br />
            and auditability of all actions.
          </h2>
        </div>
        <div className="justify-end md:flex md:flex-col items-end py-20 mb-24 md:mb-0 md:py-0 md:border-none border-4 md:rounded-none md:shadow-none rounded-4xl shadow-2xl">
          <h1 className="text-black md:px-0 px-10 font-medium items-center md:item-end text-3xl md:text-3xl pt-0 md:pt-10 pb-5 transform md:-translate-x-30">⏳ Timely Repayment</h1>
          <h2 className='md:text-lg text-xl px-2'>
            Borrowers are expected to repay on or before<br />
            the deadline. Failure to repay may affect reputation<br />
            and access to future funds.
          </h2>
        </div>
      </div>
    </div>
  );
};

export default KeyFeatures;