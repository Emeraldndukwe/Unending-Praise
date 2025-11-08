import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function About() {
  // Livestream began March 27th, 2023
  const startDate = new Date("2023-03-27T00:00:00Z");

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
    <div className="bg-[#FAF9F6] text-gray-900 min-h-screen flex flex-col pt-24 overflow-x-hidden w-full">
      {/* HERO IMAGE SECTION */}
      <section className="w-full py-10 flex justify-center">
        <div className="w-[90%] md:w-[80%] lg:w-[70%] overflow-hidden rounded-3xl shadow-lg">
          <img
            src="https://loveworldmusic.org/wp-content/uploads/2024/06/1000097946-1536x836.jpg"
            alt="About Unending Praise"
            className="w-full h-[300px] md:h-[400px] object-cover"
          />
        </div>
      </section>

      {/* VISION SECTION */}
      <section className="relative py-16 px-6 md:px-12">
        <div className="absolute left-0 top-0 pl-4 sm:pl-6 md:pl-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold">About Us</h2>
          <motion.div
            className="h-[2px] bg-black/30 rounded-full w-[90vw] md:w-[92vw] mt-3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />
        </div>

        <div className="max-w-5xl mx-auto mt-8 sm:mt-12 md:mt-16 flex flex-col gap-0">
          <p className="text-justify leading-6 sm:leading-7 md:leading-8 text-sm sm:text-base md:text-lg text-gray-700 indent-4 sm:indent-6 md:indent-8 px-4 sm:px-0 mb-0">
            Pastor Chris Live Unending Praise is a nonstop, global worship movement led by the Man of God, Rev. Dr. Chris Oyakhilome DSc. DSc. D.D., and members of the Pastor Chris Live Unending Praise Worship Network.
          </p>
          <p className="text-justify leading-6 sm:leading-7 md:leading-8 text-sm sm:text-base md:text-lg text-gray-700 indent-4 sm:indent-6 md:indent-8 px-4 sm:px-0 mb-0">
            What began as a special one-month session in June 2022 has grown into a divine, never-ending flow of praise. From March 27th, 2023, Christians from every nation have united in an unbroken chain of worship—lifting heartfelt praise to God in 30-minute segments, every hour of every day.
          </p>
          <p className="text-justify leading-6 sm:leading-7 md:leading-8 text-sm sm:text-base md:text-lg text-gray-700 indent-4 sm:indent-6 md:indent-8 px-4 sm:px-0 mb-0">
            Through this ceaseless offering of worship, voices rise continually across languages, nations, and generations, fulfilling the scriptures in John 4:23–24(KJV):
          </p>
          <p className="text-justify leading-6 sm:leading-7 md:leading-8 text-sm sm:text-base md:text-lg text-gray-700 indent-4 sm:indent-6 md:indent-8 px-4 sm:px-0 italic mb-0">
            "But the hour cometh, and now is, when the true worshippers shall worship the Father in spirit and in truth: for the Father seeketh such to worship him. God is a Spirit: and they that worship him must worship him in spirit and in truth."
          </p>
          <p className="text-justify leading-6 sm:leading-7 md:leading-8 text-sm sm:text-base md:text-lg text-gray-700 indent-4 sm:indent-6 md:indent-8 px-4 sm:px-0 mb-0">
            In this divine move of the Spirit, we are fulfilling God's desire for true worshippers—those who live to praise Him without ceasing. Pastor Chris Live Unending Praise is not just a program; it is a lifestyle of worship, and Unending Praise to our Lord Jesus Christ.
          </p>
        </div>
      </section>

      {/* COUNTDOWN SECTION */}
      <section className="relative py-12 sm:py-16 px-4 sm:px-6 md:px-12 overflow-x-hidden">
        <div className="relative sm:absolute sm:right-0 sm:top-0 pr-0 sm:pr-4 md:pr-6 lg:pr-12 text-left sm:text-right mb-8 sm:mb-0">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold whitespace-nowrap">Livestream Duration</h2>
          <motion.div
            className="h-[2px] bg-black/30 rounded-full w-full sm:w-[90vw] md:w-[92vw] mt-3 sm:ml-auto"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />
        </div>

        <div className="max-w-5xl mx-auto mt-8 sm:mt-12 md:mt-16 flex justify-center items-start gap-2 sm:gap-3 md:gap-4 lg:gap-6 font-mono flex-wrap sm:flex-nowrap px-2">
          <div className="flex flex-col items-center">
            <AnimatedDigit value={elapsed.days} oldValue={prev.current.days} />
            <span className="text-xs sm:text-sm mt-6 sm:mt-10 md:mt-14 tracking-widest">DAYS</span>
          </div>
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold mt-6 sm:mt-8 md:mt-10">:</span>
          <div className="flex flex-col items-center">
            <AnimatedDigit value={elapsed.hours} oldValue={prev.current.hours} />
            <span className="text-xs sm:text-sm mt-6 sm:mt-10 md:mt-14 tracking-widest">HRS</span>
          </div>
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold mt-6 sm:mt-8 md:mt-10">:</span>
          <div className="flex flex-col items-center">
            <AnimatedDigit value={elapsed.minutes} oldValue={prev.current.minutes} />
            <span className="text-xs sm:text-sm mt-6 sm:mt-10 md:mt-14 tracking-widest">MIN</span>
          </div>
          <span className="text-2xl sm:text-3xl md:text-4xl font-bold mt-6 sm:mt-8 md:mt-10">:</span>
          <div className="flex flex-col items-center">
            <AnimatedDigit value={elapsed.seconds} oldValue={prev.current.seconds} />
            <span className="text-xs sm:text-sm mt-6 sm:mt-10 md:mt-14 tracking-widest">SEC</span>
          </div>
        </div>
      </section>
    </div>
  );
}
