import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const POPUP_BANNER = "/3_YEARS_Celebrating_Design.png";

const AVATAR_URL = "https://lmmsdp.org/avatar/";

export default function CelebrationPopup() {
  const [open, setOpen] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    const dismissed = sessionStorage.getItem("celebration_popup_dismissed");
    if (dismissed) return;

    setImgSrc(POPUP_BANNER);
    const img = new Image();
    img.src = POPUP_BANNER;
    const fallback = setTimeout(() => setOpen(true), 5000);
    img.onload = () => {
      clearTimeout(fallback);
      setTimeout(() => setOpen(true), 400);
    };
    return () => clearTimeout(fallback);
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-[85vw] sm:w-[75vw] md:w-full max-w-lg flex flex-col items-center gap-5 sm:gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute -top-10 right-0 sm:-top-11 sm:-right-11 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            <div className="w-full rounded-2xl shadow-2xl overflow-hidden">
              <img
                src={imgSrc}
                alt="Celebrating 3 Years of Unending Praise"
                className="w-full h-[60vh] sm:h-[65vh] object-cover object-bottom"
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
