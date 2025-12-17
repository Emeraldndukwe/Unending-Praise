import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const navLinks = [
    { name: "Home", path: "/" },
    { name: "About us", path: "/about" },
    { name: "Crusades", path: "/crusades" },
    { name: "Testimonies", path: "/testimonies" },
    { name: "Trainings and Recordings", path: "/trainings" },
    { name: "Contact", path: "/contact" },
  ];

  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const [hidden, setHidden] = useState(false);
  const [lastScroll, setLastScroll] = useState(0);

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
      {/* ✅ Logo */}
      <Link
        to="/"
        className="flex items-center"
      >
        <img 
          src="/logo.png" 
          alt="Unending praise" 
          className="h-10 md:h-12 object-contain"
        />
      </Link>

      {/* ✅ Desktop Links */}
      <ul className="hidden md:flex gap-6 text-sm md:text-base text-amber-50">
        {navLinks.map(({ name, path }) => (
          <motion.li key={name} whileHover={{ scale: 1.05, y: -1 }}>
            <Link
              to={path}
              className={`${
                pathname === path || pathname.startsWith(path)
                  ? "text-white font-semibold border-b-2 border-amber-400"
                  : "text-white/70 hover:text-white"
              } transition-colors duration-300 pb-1`}
            >
              {name}
            </Link>
          </motion.li>
        ))}
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
            {navLinks.map(({ name, path }) => (
              <Link
                key={name}
                to={path}
                onClick={() => setMenuOpen(false)}
                className={`${
                  pathname === path || pathname.startsWith(path)
                    ? "text-amber-400 font-semibold"
                    : "text-white/80 hover:text-white"
                } text-base transition`}
              >
                {name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
