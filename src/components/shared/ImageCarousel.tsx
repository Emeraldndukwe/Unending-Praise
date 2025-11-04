import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface MediaItem {
  type: "image" | "video";
  url: string;
  caption?: string;
}

export interface ImageCarouselRef {
  openGallery: () => void;
}

interface ImageCarouselProps {
  media: MediaItem[];
  autoPlay?: boolean;
  interval?: number;
}

const ImageCarousel = forwardRef<ImageCarouselRef, ImageCarouselProps>(
  ({ media, autoPlay = true, interval = 4500 }, ref) => {
    const [active, setActive] = useState(0);
    const [showGallery, setShowGallery] = useState(false);
    const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);

    useImperativeHandle(ref, () => ({
      openGallery: () => setShowGallery(true),
    }));

    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Main autoplay
    useEffect(() => {
      if (!autoPlay || media.length <= 1 || fullscreenIndex !== null) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setActive((prev) => (prev + 1) % media.length);
      }, interval);
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
      };
    }, [active, autoPlay, interval, media.length, fullscreenIndex]);

    const next = useCallback(() => setActive((s) => (s + 1) % media.length), [media.length]);
    const prev = useCallback(() => setActive((s) => (s - 1 + media.length) % media.length), [media.length]);

    const fullscreenNext = useCallback(() => {
      setFullscreenIndex((prev) => (prev === null ? 0 : (prev + 1) % media.length));
    }, [media.length]);

    const fullscreenPrev = useCallback(() => {
      setFullscreenIndex((prev) => (prev === null ? 0 : (prev - 1 + media.length) % media.length));
    }, [media.length]);

    // Keyboard nav for fullscreen
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (fullscreenIndex === null) return;
        if (e.key === "ArrowRight") fullscreenNext();
        else if (e.key === "ArrowLeft") fullscreenPrev();
        else if (e.key === "Escape") setFullscreenIndex(null);
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }, [fullscreenIndex, fullscreenNext, fullscreenPrev]);

    // Main carousel swipe
    const startX = useRef<number | null>(null);
    const handleTouchStart = (e: React.TouchEvent) => (startX.current = e.touches[0].clientX);
    const handleTouchEnd = (e: React.TouchEvent) => {
      if (startX.current === null) return;
      const delta = e.changedTouches[0].clientX - startX.current;
      if (delta > 50) prev();
      else if (delta < -50) next();
      startX.current = null;
    };

    // Fullscreen swipe
    const fsStartX = useRef<number | null>(null);
    const handleFsTouchStart = (e: React.TouchEvent) => (fsStartX.current = e.touches[0].clientX);
    const handleFsTouchEnd = (e: React.TouchEvent) => {
      if (fsStartX.current === null) return;
      const delta = e.changedTouches[0].clientX - fsStartX.current;
      if (delta > 50) fullscreenPrev();
      else if (delta < -50) fullscreenNext();
      fsStartX.current = null;
    };

    return (
      <>
        <div
          className="relative w-full flex flex-col items-center select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Card container */}
          <div className="relative w-full flex justify-center h-[400px] overflow-visible">
            {media.map((item, index) => {
              const total = media.length;

              // Determine max visible cards
              let maxVisible = 5;
              if (total === 4) maxVisible = 3;
              else if (total === 2) maxVisible = 2;
              else if (total === 1) maxVisible = 1;

              let offset = index - active;
              if (offset > total / 2) offset -= total;
              if (offset < -total / 2) offset += total;

              const isActive = offset === 0;

              // Only render cards within visible range
              if (Math.abs(offset) > Math.floor(maxVisible / 2)) return null;

              // Scale based on offset
              let scale = 1;
              if (Math.abs(offset) === 1) scale = 0.92;
              else if (Math.abs(offset) === 2) scale = 0.78;
              else if (Math.abs(offset) >= 3) scale = 0.62;

              return (
                <motion.div
                  key={item.url + index}
                  initial={false}
                  animate={{
                    x: offset * 240,
                    scale,
                    opacity: 1,
                    zIndex: isActive ? 30 : 20 - Math.abs(offset),
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute rounded-xl overflow-hidden shadow-2xl bg-black cursor-pointer"
                  style={{ width: 300, height: 300 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setFullscreenIndex(index);
                  }}
                >
                  {item.type === "image" ? (
                    <img src={item.url} alt={item.caption ?? `media-${index}`} className="w-full h-full object-cover" />
                  ) : (
                    <video src={item.url} className="w-full h-full object-cover" controls playsInline />
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-3">
            <button onClick={prev} className="p-2 rounded-full hover:bg-gray-200 bg-white/80">
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              {media.map((_, i) => {
                const isActive = i === active;
                return (
                  <motion.div
                    key={i}
                    onClick={() => setActive(i)}
                    className="cursor-pointer bg-gray-400 rounded-full"
                    animate={{
                      width: isActive ? 24 : 8,
                      height: 8,
                      borderRadius: isActive ? 6 : 50,
                      backgroundColor: isActive ? "#000" : "rgb(156,163,175)",
                    }}
                    transition={{ duration: 0.2 }}
                  />
                );
              })}
            </div>

            <button onClick={next} className="p-2 rounded-full hover:bg-gray-200 bg-white/80">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Gallery modal */}
        <AnimatePresence>
          {showGallery && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-6"
            >
              <div className="w-full max-w-6xl">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => setShowGallery(false)}
                    className="text-white p-2 rounded-md bg-white/10 hover:bg-white/20 flex items-center gap-2"
                  >
                    <X size={18} /> Close
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[70vh] overflow-y-auto">
                  {media.map((m, idx) => (
                    <div
                      key={m.url + idx}
                      className="cursor-pointer overflow-hidden rounded relative"
                      onClick={() => {
                        setFullscreenIndex(idx);
                        setShowGallery(false);
                      }}
                    >
                      {m.type === "image" ? (
                        <img src={m.url} alt={m.caption} className="w-full h-36 object-cover rounded" />
                      ) : (
                        <>
                          <video src={m.url} className="w-full h-36 object-cover rounded" muted />
                          <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">VIDEO</div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fullscreen viewer */}
        <AnimatePresence>
          {fullscreenIndex !== null && (
            <motion.div
              className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onTouchStart={handleFsTouchStart}
              onTouchEnd={handleFsTouchEnd}
              onClick={() => setFullscreenIndex(null)}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreenIndex(null);
                }}
                className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <X size={24} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fullscreenPrev();
                }}
                className="absolute left-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronLeft size={34} />
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  fullscreenNext();
                }}
                className="absolute right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
              >
                <ChevronRight size={34} />
              </button>

              <motion.div
                key={fullscreenIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="max-w-[90%] max-h-[85%] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {media[fullscreenIndex].type === "image" ? (
                  <img src={media[fullscreenIndex].url} alt={media[fullscreenIndex].caption} className="w-full h-full object-contain" />
                ) : (
                  <video src={media[fullscreenIndex].url} controls autoPlay playsInline className="w-full h-full object-contain" />
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
);

export default ImageCarousel;
