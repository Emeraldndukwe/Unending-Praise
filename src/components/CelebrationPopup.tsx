import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DAY_IMAGES: Record<number, string> = {
  19: "/UK Z 2 DSP & USA R 1 z 1 (19).jpg",
  20: "/South pacific & Western Europe zone 4 (20).jpg",
  23: "/EWCA zone 3 & EWCA ZONE 4 (23).jpg",
  24: "/Lagos zone 1  & M.C Warri (24).jpg",
  25: "/Capetown Z 2 & Ce Nig North central z 1 (25).jpg",
  26: "/USA REGION 1 ZONE 2 (26).jpg",
  27: "/USA REGION 1 ZONE 2 (27).jpg",
  28: "/BLW UK Z A & BLW USA R1 (28).jpg",
};

const AVATAR_URL = "https://lmmsdp.org/avatar/";

export default function CelebrationPopup() {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("celebration_popup_dismissed");
    if (dismissed) return;

    const day = new Date().getDate();
    const src = DAY_IMAGES[day];
    if (src) {
      setImgSrc(src);
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = () => {
    setOpen(false);
    sessionStorage.setItem("celebration_popup_dismissed", "1");
  };

  if (!imgSrc) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={close}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-[90vw] sm:w-[85vw] md:w-full max-w-2xl flex flex-col items-center gap-5 sm:gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute -top-10 right-0 sm:-top-11 sm:-right-11 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div className="w-full overflow-hidden rounded-2xl shadow-2xl">
              <img
                src={imgSrc}
                alt="Celebrating 3 Years of Unending Praise"
                className="w-full h-[50vh] sm:h-[55vh] md:h-[60vh] object-cover"
                loading="eager"
              />
            </div>

            <a
              href={AVATAR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-3 rounded-full bg-[#54037C] hover:bg-[#6B1A9E] text-white font-semibold text-sm sm:text-base transition shadow-lg"
            >
              Create your avatar today
            </a>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
