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

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="relative w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl bg-[#f5f0f8]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={close}
              className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* Image */}
            <div className="w-full">
              <img
                src={imgSrc}
                alt="Celebrating 3 Years of Unending Praise"
                className="w-full h-auto object-cover"
                loading="eager"
              />
            </div>

            {/* CTA */}
            <div className="px-6 py-5 flex justify-center">
              <a
                href={AVATAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 rounded-full bg-[#54037C]/15 hover:bg-[#54037C]/25 text-[#54037C] font-semibold text-base transition shadow-sm"
              >
                Create your avatar today
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
