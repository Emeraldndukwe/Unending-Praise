import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import confetti from "canvas-confetti";

const ANNIVERSARY_DATE = new Date("2026-03-27T00:00:00");

function useCountdown() {
  const [diff, setDiff] = useState(() => ANNIVERSARY_DATE.getTime() - Date.now());
  const [arrived, setArrived] = useState(() => ANNIVERSARY_DATE.getTime() - Date.now() <= 0);
  const firedRef = useRef(false);

  useEffect(() => {
    const id = setInterval(() => {
      const remaining = ANNIVERSARY_DATE.getTime() - Date.now();
      setDiff(remaining);
      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        setArrived(true);
      }
    }, 1000);
    return () => clearInterval(id);
  }, []);

  if (diff <= 0) return { countdown: null, arrived };

  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return { countdown: { days, hrs, mins, secs }, arrived };
}

const Navbar = () => {
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About us", path: "/about" },
    { name: "Crusades", path: "/crusades" },
    { name: "Testimonies", path: "/testimonies" },
    { name: "Trainings & Resources", path: "/trainings" },
    { name: "Contact", path: "/contact" },
  ];

  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const { countdown, arrived } = useCountdown();

  const [hidden, setHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

  const fireConfetti = useCallback(() => {
    const duration = 6000;
    const end = Date.now() + duration;
    const colors = ["#54037C", "#FFD700", "#FF69B4", "#FFFFFF", "#9B59B6"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  useEffect(() => {
    if (arrived) {
      fireConfetti();
    }
  }, [arrived, fireConfetti]);

  // ✅ Hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;

      if (current > lastScroll && current > 80) {
        setHidden(true); // scrolling down
      } else {
        setHidden(false); // scrolling up
      }

      setLastScroll(current);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <motion.nav
      initial={{ opacity: 0, scaleX: 0.8 }}
      animate={{
        opacity: hidden ? 0 : 1,
        y: hidden ? -80 : 0,
        scaleX: 1,
      }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="
        fixed top-3 left-2 right-2 z-[100]
        bg-[#54037C]/70 backdrop-blur-sm
        border border-white/10
        rounded-full shadow-lg
        px-6 py-4 flex justify-between items-center
      "
    >
      <Link
        to="/"
        className="flex flex-col items-center gap-0.5"
      >
        <img 
          src="/logo.png" 
          alt="Unending praise" 
          className="h-14 md:h-16 object-contain"
        />
        {countdown ? (
          <span className="text-[9px] sm:text-[10px] font-bold tracking-wide text-amber-300 whitespace-nowrap leading-none">
            {countdown.days}d {countdown.hrs}h {countdown.mins}m {countdown.secs}s
          </span>
        ) : arrived ? (
          <span className="text-[9px] sm:text-[10px] font-bold tracking-wide text-amber-300 whitespace-nowrap leading-none animate-pulse">
            3 Years! 🎉
          </span>
        ) : null}
      </Link>

      {/* ✅ Desktop Links */}
      <ul className="hidden md:flex gap-6 text-sm md:text-base text-amber-50">
        {navLinks.map(({ name, path }) => {
          const isActive = path === "/" 
            ? pathname === "/" 
            : pathname === path || pathname.startsWith(path + "/");
          return (
            <motion.li key={name} whileHover={{ scale: 1.05, y: -1 }}>
              <Link
                to={path}
                className={`${
                  isActive
                    ? "text-white font-semibold border-b-2 border-amber-400"
                    : "text-white/70 hover:text-white"
                } transition-colors duration-300 pb-1`}
              >
                {name}
              </Link>
            </motion.li>
          );
        })}
      </ul>

      {/* ✅ Mobile Button */}
      <button
        className="md:hidden text-white"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* ✅ Mobile Menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="
              absolute top-full mt-3 left-0 right-0
              bg-[#54037C]/95 backdrop-blur-md
              border border-white/10
              rounded-2xl shadow-lg p-6
              flex flex-col items-center gap-4 text-white
            "
          >
            {navLinks.map(({ name, path }) => {
              const isActive = path === "/" 
                ? pathname === "/" 
                : pathname === path || pathname.startsWith(path + "/");
              return (
                <Link
                  key={name}
                  to={path}
                  onClick={() => setMenuOpen(false)}
                  className={`${
                    isActive
                      ? "text-amber-400 font-semibold"
                      : "text-white/80 hover:text-white"
                  } text-base transition`}
                >
                  {name}
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
