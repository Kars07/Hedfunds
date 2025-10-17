import { motion, useTransform, useScroll } from "framer-motion";
import { useRef } from "react";

const HorizontalScrollEffect = () => {
  return (
    <div className="">
      
      <HorizontalScrollCarousel />
      
    </div>
  );
};

const HorizontalScrollCarousel = () => {
  const targetRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
  });

  const x = useTransform(scrollYProgress, [0, 1], ["1%", "-85%"]);

  return (
    <section ref={targetRef} className="relative items-center   h-[60vh] md:h-[200vh]  ">
      <div className="sticky top-0 flex h-[50vh] md:h-screen items-center overflow-hidden">
        <motion.div style={{ x }} className="flex gap-10 px-10">
          {phrases.map((text, idx) => (
            <motion.div
              key={idx}
              className="text-black text-8xl md:text-[20em] font-bold whitespace-nowrap"
            >
              {text.split(".").map((word, i, arr) => (
                <span key={i} className="mr-4">
                  {word.trim()}
                  {i !== arr.length - 1 && (
                    <span className="text-orange-500"> . </span>
                  )}
                </span>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HorizontalScrollEffect;

const phrases = [
  "SECURE.",
  "TRANSPARENT.",
  "FAST.",
  "SECURE.",
  "TRANSPARENT.",
  "FAST.",
];
