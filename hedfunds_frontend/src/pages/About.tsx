import React, { useRef, useEffect } from "react";
import wura from '../assets/wura.jpg';
import dami from '../assets/dami.jpg';
import raphael from '../assets/raphael.jpg';
import michael from '../assets/Micheal.jpg';
import dani from '../assets/dani.jpg';
import zigzag from '../assets/zigzag.png';

const About: React.FC = () => {
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    const pathLength = path.getTotalLength();
    path.style.strokeDasharray = `${pathLength} ${pathLength}`;
    path.style.strokeDashoffset = `${pathLength}`;

    const handleScroll = () => {
      const pathTop = path.getBoundingClientRect().top;
      const pathHeight = path.getBoundingClientRect().height;
      const windowHeight = window.innerHeight;

      if (pathTop < windowHeight && pathTop + pathHeight > 0) {
        const visibleRatio = Math.min(1, (windowHeight - pathTop) / (windowHeight + pathHeight));
        const speedFactor = 1.5;
        const drawLength = Math.min(pathLength, pathLength * visibleRatio * speedFactor);
        path.style.strokeDashoffset = `${pathLength - drawLength}`;
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
    <div className="w-full h-full text-white overflow-hidden">
      <div className="absolute lg:block hidden left-10 pl-8 rotate-z-65 translate-y-[-10px]">
        <img src={zigzag} alt="Logo" className="w-[500px] h-auto" />
      </div>
      <h1 className="text-4xl text-center pt-30 font-bold text-gray-900">MEET OUR DEVELOPERS</h1>
      <div className='justify-center pt-3 flex lg:hidden '>
        <div className='border border-orange-600 w-50 block rounded-2xl h-3 bg-orange-600 items-center'></div>
      </div>
      <div className="absolute lg:block hidden right-10 pl-8 rotate-z-125 translate-y-[-170px]">
        <img src={zigzag} alt="Logo" className="w-[500px] h-auto" />
      </div>
      <div className="relative lg:block hidden">
        <svg
          width="1584"
          height="3509"
          viewBox="0 0 1584 2479"
          className="absolute transform -translate-y-50 -z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g filter="url(#filter0_d_1_3)">
            <path
              ref={pathRef}
              d="M5 5C349.784 47.2114 515.585 84.7439 773 171C966.325 241.023 1066.55 283.289 1201 375L1465 544C1534.56 573.225 1559.12 568.34 1574 517C1557.98 469.576 1544.77 447.112 1489.5 438C1447.28 444.151 1423.51 447.845 1378 462.5L1165.5 544C1114.82 562.835 1018.91 688.1 694 726.5C610.572 738.871 582.247 762.236 506.5 764.5C447.49 800.127 385.658 787.338 305 835.5C235.175 863.434 203.682 892.377 144 928C73.1972 980.026 53.5941 1026.61 54 1140.5C54.4636 1249.68 66.5695 1294.06 108 1345C382.089 1474.27 865.5 1555 865.5 1555L1377.5 1647.5C1449.99 1682.25 1491.29 1701.02 1481 1825C1467.05 1917.22 1447.27 1949.93 1377.5 1953.5L1075.5 1992.5C863.211 2043.66 815.185 2053.95 694 2081.5L250 2184.5C143.944 2225.37 109.153 2261.45 69 2337.5L15.5 2469"
              stroke="#EA580C"
              strokeWidth="10"
              shapeRendering="crispEdges"
              style={{
                transition: 'stroke-dashoffset 0.3s ease-out',
              }}
            />
          </g>
          <defs>
            <filter
              id="filter0_d_1_3"
              x="0.392395"
              y="0.037056"
              width="1582.85"
              height="2478.85"
              filterUnits="userSpaceOnUse"
              colorInterpolationFilters="sRGB"
            >
              <feFlood floodOpacity="0" result="BackgroundImageFix" />
              <feColorMatrix
                in="SourceAlpha"
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                result="hardAlpha"
              />
              <feOffset dy="4" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix
                type="matrix"
                values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
              />
              <feBlend
                mode="normal"
                in2="BackgroundImageFix"
                result="effect1_dropShadow_1_3"
              />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_1_3"
                result="shape"
              />
            </filter>
          </defs>
        </svg>
      </div>

      <div className="py-20  flex flex-col md:gap-20 ">
        <div className="w-full flex  flex-col lg:flex-row lg:gap-20  justify-end md:px-40 px-10">
          <img src={michael} alt="" className="lg:w-[350px] rounded-4xl lg:h-[450px]" />
          <div className="flex flex-col justify-center  items-center">
            <div className="transform lg:py-0 py-5 pb-15 lg:pb-0 ">
              <h1 className="text-3xl text-orange-600 font-bold pb-3 text-start">Oloyede Micheal</h1>
              <h2 className="text-2xl font-bold text-gray-900 pb-5">Team Leader and Full Stack Developer</h2>
              <span className="text-gray-700">Meet our amazing team leader, Michael. A full-stack developer with a passion for building cool and functional projects. He’s not just skilled, he’s also fun, encouraging, and always bringing good energy to the team. Leading by example, Michael makes working together a great experience.</span>
              <div className="socials pt-5 ">
                <a href="https://x.com/thatkid_mikey" className=""> <i className="bx px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-twitter text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href=" https://www.linkedin.com/in/micheal-oloyede-b4043a254/"><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-linkedin text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href="michealbolu19@gmail.com "><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bx-envelope text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" />
                </a>
              </div>
            </div>
          </div>

        </div>
        <div className="w-full flex gap-20 justify md:px-40 px-10">
          <div className="flex lg:flex-row flex-col-reverse lg:gap-20 lg:justify-end items-center">
            <div className="transform  lg:py-0 py-5 pb-15 lg:pb-0  lg:translate-y-10">
              <h1 className="text-3xl text-orange-600 font-bold pb-3 text-start">Abibi Daniella</h1>
              <h2 className="text-2xl font-bold text-gray-900 pb-5">Project Manager and Backend Developer</h2>
              <span className="text-gray-700">Daniella keeps our team organized and on track while also handling the backend magic. She's the calm in the chaos, making sure tasks are done, deadlines are met, and everyone stays focused. With a sharp mind for logic and a knack for structure, se’s the kind of teammate who just gets things done. she is very reliably and efficiently.</span>
              <div className="socials pt-5 ">
                <a href=" https://x.com/thegirl_niella" className=""> <i className="bx px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-twitter text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href=""><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-linkedin text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href=" daniellaabibi@gmail.com"><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bx-envelope text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" />
                </a>
              </div>
            </div>
             <img src={dani} alt="" className="lg:w-[350px]  rounded-4xl lg:h-[450px]" />
            
          </div>
        </div>
        <div className="w-full flex lg:gap-20 flex-col lg:flex-row justify-end md:px-40 px-10">
          <img src={dami} alt="" className="lg:w-[350px] rounded-4xl lg:h-[450px]" />
          <div className="flex flex-col justify-center items-center">
            <div className="transform lg:py-0 py-5 pb-15 lg:pb-0 ">
              <h1 className="text-3xl text-orange-600 font-bold pb-3 text-start">Emmanuel Damilola</h1>
              <h2 className="text-2xl font-bold text-gray-900 pb-5">UI/UX Designer</h2>
              <span className="text-gray-700">Dami brings our ideas to life with stunning visuals and user-friendly designs. He has a natural talent for combining creativity with functionality, making sure our users always have a great experience. Easy to talk to, collaborative, and super thoughtful .</span>
              <div className="socials pt-5 ">
                <a href="https://x.com/emmanuelda27228" className=""> <i className="bx px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-twitter text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href=""><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-linkedin text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href="emmanueldamilolaxx@gmail.com "><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bx-envelope text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" />
                </a>
              </div>
            </div>
          </div>

        </div>
        <div className="w-full  flex gap-20  justify md:px-40 px-10">
          <div className="flex lg:flex-row flex-col-reverse lg:gap-20 lg:justify-end items-center">
            <div className="transform  lg:py-0 py-5 pb-15 lg:pb-0   lg:translate-y-10 ">
              <h1 className="text-3xl text-orange-600 font-bold pb-3 text-start">Omilabu Wuraola</h1>
              <h2 className="text-2xl font-bold text-gray-900 pb-5">Frontend Developer and Creative Designer</h2>
              <span className="text-gray-700">Wuraola is the creative spirit of our team. From animations to clean interfaces, she knows how to turn vision into vibrant web experiences. With a blend of design flair and coding skills, she bridges the gap between aesthetics and functionality. She’s fun, imaginative, and a joy to collaborate with.</span>
              <div className="socials pt-5 ">
                <a href="https://x.com/wur38094" className=""> <i className="bx px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-twitter text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href="www.linkedin.com/in/omilabu-wuraola-7a200b329"><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-linkedin text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href="Omilabuw@gmail.com"><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bx-envelope text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" />
                </a>
              </div>
            </div>
            <img src={wura} alt="" className="lg:w-[350px] rounded-4xl lg:h-[450px]" />
          
          </div>
        </div>
        <div className="w-full flex lg:gap-20 flex-col lg:flex-row justify-end md:px-40 px-10">
          <img src={raphael} alt="" className="lg:w-[350px] rounded-4xl lg:h-[450px]" />
          <div className="flex flex-col justify-center items-center">
            <div className="transform  lg:py-0 py-5 pb-15 lg:pb-0  ">
              <h1 className="text-3xl text-orange-600 font-bold pb-3 text-start">Eniaiyejuni Raphael</h1>
              <h2 className="text-2xl font-bold text-gray-900 pb-5">Smart Contract Developer</h2>
              <span className="text-gray-700">Raphael is our blockchain brain! He handles the smart contracts that make our project secure and decentralized. Quietly brilliant and deeply focused, he brings technical depth with a cool-headed approach. You can trust him to write clean, reliable code and explain even the complex stuff in simple terms.</span>
              <div className="socials pt-5 ">
                <a href="https://x.com/GrumpyDonutDad" className=""> <i className="bx px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-twitter text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href=""><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bxl-linkedin text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" /></a>
                <a href="Eniaiyejuni.raphaelolukayode@gmail.com "><i className="bx  px-2 hover:border-amber-600 mx-2 pt-2 border-2 border-black rounded-full w-10 h-10 bx-envelope text-black text-xl cursor-pointer transition-colors duration-300 hover:text-orange-600" />
                </a>
              </div>
            </div>
          </div>

        </div>
    </div>
    </div>
  );
};

export default About;