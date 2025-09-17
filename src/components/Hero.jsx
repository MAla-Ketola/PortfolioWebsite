import { motion } from "framer-motion";

import { styles } from "../styles";
import { ComputersCanvas, MysteriousDeskCanvas, TestCanvas } from "./canvas";
import MouseTrailCanvas from "./MouseTrailCanvas";

const Hero = () => {
  return (
    <section className={`relative w-full h-screen mx-auto `}>
      <div
        className={`absolute inset-0 top-[160px]  max-w-7xl mx-auto ${styles.paddingX} flex flex-row items-start gap-5 z-10 pointer-events-none`}
      >
        {/*<div className='flex flex-col justify-center items-center mt-5'>
          <div className='w-5 h-5 rounded-full bg-[#915EFF]' />
          <div className='w-1 sm:h-80 h-40 violet-gradient' />
        </div>*/}

{/*         <div>
          <h1 className={`${styles.heroHeadText} text-white`}>
            Hi, I'm <span className="text-[#fb465b]">Marjut</span>
          </h1>
          <p className={`${styles.heroSubText} mt-2 text-white-100`}>
            I develop 3D visuals, user <br className="sm:block hidden" />
            interfaces and web applications
          </p>
        </div> */}
      </div>

      {/* <Scene /> */}
      <TestCanvas />

      <MouseTrailCanvas
        maxPoints={50}
        decayPerSec={2}
        minStepPx={1}
        baseLineWidth={1.2}
        baseCoreOpacity={0.85}
        auraBlur={12}
        auraAlpha={0.5}
        auraHeadScale={0.45}
        coreHeadScale={0.7}
        segmentStep={50}
        segmentJitter={1.5}
        segmentsPerFrame={200}
        smoothingMs={80}
        wobble={0.2}
        wobbleFreq={0.4}
      />

      {/*Scroll Cue*/}
{/*       <div className="absolute xs:bottom-10 bottom-32 w-full flex justify-center items-center">
        <a href="#about">
          <div className="w-[35px] h-[64px] rounded-3xl border-4 border-secondary flex justify-center items-start p-2">
            <motion.div
              animate={{
                y: [0, 24, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="w-3 h-3 rounded-full bg-secondary mb-1"
            />
          </div>
        </a>
      </div> */}

      {/* CRT scanlines overlay (now the actual last child) */}
      <div className="crt-scanlines pointer-events-none absolute inset-0 z-[5]" />
    </section>
  );
};

export default Hero;




