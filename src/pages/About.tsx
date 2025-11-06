import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function About() {
  // Placeholder livestream start date (replace with actual)
  const startDate = new Date("2023-01-01T00:00:00Z");

  const [elapsed, setElapsed] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // Keep track of previous values to detect which digits changed
  const prev = useRef(elapsed);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startDate.getTime()) / 1000);
      const days = Math.floor(diff / (3600 * 24));
      const hours = Math.floor((diff % (3600 * 24)) / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = diff % 60;
      setElapsed({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const AnimatedDigit = ({ value, oldValue }: { value: number; oldValue: number }) => {
    const digits = String(value).padStart(2, "0").split("");
    const prevDigits = String(oldValue).padStart(2, "0").split("");

    return (
      <div className="flex gap-[2px] md:gap-1">
        {digits.map((digit, i) => {
          const hasChanged = digit !== prevDigits[i];
          return (
            <div
              key={i}
              className="relative w-6 md:w-8 h-[48px] md:h-[64px] overflow-hidden text-center"
            >
              <AnimatePresence mode="popLayout">
                {hasChanged ? (
                  <motion.span
                    key={digit}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -30, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                    className="absolute inset-0 text-4xl md:text-5xl font-bold text-gray-900"
                  >
                    {digit}
                  </motion.span>
                ) : (
                  // Static digit (no animation)
                  <span className="absolute inset-0 text-4xl md:text-5xl font-bold text-gray-900">
                    {digit}
                  </span>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    );
  };

  // Store previous elapsed after each render
  useEffect(() => {
    prev.current = elapsed;
  }, [elapsed]);

  return (
    <div className="bg-[#FAF9F6] text-gray-900 min-h-screen flex flex-col pt-24 overflow-x-hidden">
      {/* HERO IMAGE SECTION */}
      <section className="w-full py-10 flex justify-center">
        <div className="w-[90%] md:w-[80%] lg:w-[70%] overflow-hidden rounded-3xl shadow-lg">
          <img
            src="/map-image.jpg"
            alt="Map showing mission locations"
            className="w-full h-[300px] md:h-[400px] object-cover"
          />
        </div>
      </section>

      {/* VISION SECTION */}
      <section className="relative py-16 px-6 md:px-12">
        <div className="absolute left-0 top-0 pl-4 sm:pl-6 md:pl-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">Our Vision</h2>
          <motion.div
            className="h-[2px] bg-black/30 rounded-full w-[90vw] md:w-[92vw] mt-3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />
        </div>

        <div className="max-w-5xl mx-auto mt-8 sm:mt-12 md:mt-16 flex flex-col gap-6 sm:gap-8">
          <p className="text-justify leading-6 sm:leading-7 md:leading-8 text-sm sm:text-base md:text-lg text-gray-700 indent-4 sm:indent-6 md:indent-8 px-4 sm:px-0">
            We have gone round the world for crusades, sharing the word of God
            with our Man of God Rev. Chris Oyakhilome. Join us and look at our
            journey so far. We have gone round the world for crusades, sharing
            the word of God with our Man of God Rev. Chris Oyakhilome. Join us
            and look at our journey so far. We have gone round the world for
            crusades, sharing the word of God with our Man of God Rev. Chris
            Oyakhilome. Join us and look at our journey so far. We have gone
            round the world for crusades, sharing the word of God with our Man
            of God Rev. Chris Oyakhilome. Join us and look at our journey so far.
          </p>
        </div>
      </section>

      {/* COUNTDOWN SECTION */}
      <section className="relative py-16 px-6 md:px-12">
        <div className="absolute right-0 top-0 pr-4 sm:pr-6 md:pr-12 text-right">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">Livestream Duration</h2>
          <motion.div
            className="h-[2px] bg-black/30 rounded-full w-[90vw] md:w-[92vw] mt-3 ml-auto"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "right" }}
          />
        </div>

        <div className="max-w-5xl mx-auto mt-16 flex justify-center gap-4 md:gap-6 font-mono">
          <div className="flex flex-col items-center">
            <AnimatedDigit value={elapsed.days} oldValue={prev.current.days} />
            <span className="text-sm mt-14 tracking-widest">DAYS</span>
          </div>
          <span className="text-4xl font-bold mt-10">:</span>
          <div className="flex flex-col items-center">
            <AnimatedDigit value={elapsed.hours} oldValue={prev.current.hours} />
            <span className="text-sm mt-14 tracking-widest">HRS</span>
          </div>
          <span className="text-4xl font-bold mt-10">:</span>
          <div className="flex flex-col items-center">
            <AnimatedDigit value={elapsed.minutes} oldValue={prev.current.minutes} />
            <span className="text-sm mt-14 tracking-widest">MIN</span>
          </div>
          <span className="text-4xl font-bold mt-10">:</span>
          <div className="flex flex-col items-center">
            <AnimatedDigit value={elapsed.seconds} oldValue={prev.current.seconds} />
            <span className="text-sm mt-14 tracking-widest">SEC</span>
          </div>
        </div>
      </section>
    </div>
  );
}
