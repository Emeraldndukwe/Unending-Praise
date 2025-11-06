import { useState, useEffect, useRef } from "react";
import { motion, animate } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

type Testimony = {
  id: string;
  name?: string;
  title?: string;
  summary?: string;
  content?: string;
  previewImage?: string;
  approved?: boolean;
};

const defaultTestimonies = [
  { id: "1", name: "JOHN THOMAS", text: "We have gone round the world for crusades, sharing the word of God with our Man Of God Rev. Chris Oyakhilome.", image: "https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=400&h=300&fit=crop", color: "rgb(155, 89, 214)" },
  { id: "2", name: "SARAH KINGS", text: "The experience has been amazing and life-changing. Lives are touched everywhere.", image: "https://images.unsplash.com/photo-1548554448-087ebf1e11e3?w=400&h=300&fit=crop", color: "rgb(179, 123, 233)" },
  { id: "3", name: "PETER JOHN", text: "God's word keeps spreading through our crusades — nations are transformed.", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop", color: "rgb(125, 43, 207)" },
];

function lightenColor(rgbString: string, percent: number) {
  const match = rgbString.match(/\d+/g);
  if (!match) return rgbString;
  const [r, g, b] = match.map(Number);
  const lighten = (v: number) => Math.round(v + (255 - v) * percent);
  return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
}

export default function TestimoniesCarousel() {
  const [testimonies, setTestimonies] = useState<Array<{ id: string; name: string; text: string; image: string; color: string }>>(defaultTestimonies);
  const [active, setActive] = useState(1);
  const [baseColor, setBaseColor] = useState(testimonies[1]?.color || "rgb(155, 89, 214)");
  const [isMobile, setIsMobile] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    fetch('/api/testimonies')
      .then(res => res.json())
      .then((data: any[]) => {
        // Convert snake_case to camelCase
        const converted = data.map((t: any) => ({
          ...t,
          previewImage: t.previewImage || t.preview_image,
          previewVideo: t.previewVideo || t.preview_video,
        }));
        const approved = converted.filter(t => t.approved).slice(0, 5);
        if (approved.length > 0) {
          const colors = ["rgb(155, 89, 214)", "rgb(179, 123, 233)", "rgb(125, 43, 207)", "rgb(179, 123, 233)", "rgb(155, 89, 214)"];
          const mapped = approved.map((t, i) => ({
            id: t.id,
            name: (t.name || "Anonymous").toUpperCase(),
            text: t.summary || t.content?.substring(0, 150) || "Testimony of God's faithfulness.",
            image: t.previewImage || "https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=400&h=300&fit=crop",
            color: colors[i % colors.length]
          }));
          setTestimonies(mapped.length > 0 ? mapped : defaultTestimonies);
          setBaseColor(mapped[0]?.color || "rgb(155, 89, 214)");
          setActive(Math.min(1, mapped.length - 1));
        }
      })
      .catch(() => {
        // Keep default testimonies on error
      });
  }, []);

  // Detect mobile
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animate color transition on active change
  useEffect(() => {
    if (!testimonies.length || !testimonies[active]) return;
    const currentColor = testimonies[active]?.color || "rgb(155, 89, 214)";
    // Only animate if the color actually changed
    if (baseColor === currentColor) return;
    
    const from = baseColor;
    const to = currentColor;
    const controls = animate(0, 1, {
      duration: 0.8,
      ease: "easeInOut",
      onUpdate: (latest) => {
        const fromMatch = from.match(/\d+/g);
        const toMatch = to.match(/\d+/g);
        if (!fromMatch || !toMatch) return;
        const [r1, g1, b1] = fromMatch.map(Number);
        const [r2, g2, b2] = toMatch.map(Number);
        const r = Math.round(r1 + (r2 - r1) * latest);
        const g = Math.round(g1 + (g2 - g1) * latest);
        const b = Math.round(b1 + (b2 - b1) * latest);
        setBaseColor(`rgb(${r}, ${g}, ${b})`);
      },
    });
    return () => controls.stop();
  }, [active, testimonies.length]);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setAnimateIn(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Auto-slide every 6 seconds
  useEffect(() => {
    if (testimonies.length === 0) return;
    const interval = setInterval(() => setActive((prev) => (prev + 1) % testimonies.length), 6000);
    return () => clearInterval(interval);
  }, [testimonies.length]);

  const next = () => {
    if (testimonies.length === 0) return;
    setActive((active + 1) % testimonies.length);
  };
  const prev = () => {
    if (testimonies.length === 0) return;
    setActive((active - 1 + testimonies.length) % testimonies.length);
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const delta = touchStartX.current - touchEndX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) next();
      else prev();
    }
    touchStartX.current = null;
  };
  const shorten = (text: string) => (text.length > 50 ? text.slice(0, 50) + "..." : text);

  const visibleCards = isMobile ? 3 : testimonies.length;
  const cardWidth = isMobile ? 220 : 320;
  const cardHeight = isMobile ? 300 : 400;
  const offsetDistance = isMobile ? 180 : 220;

  if (testimonies.length === 0) {
    return (
      <section className="w-full py-16 text-center select-none overflow-hidden">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-12">TESTIMONIES</h1>
        <div className="text-gray-600 py-8">Loading testimonies...</div>
      </section>
    );
  }

  return (
    <section className="w-full py-16 text-center select-none overflow-hidden">
      <h1 className="text-3xl md:text-4xl font-extrabold mb-12">TESTIMONIES</h1>

      <div 
        className="relative w-full flex justify-center h-[460px] overflow-visible"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={`relative flex justify-center items-center ${isMobile ? "w-[700px]" : "w-[1000px]"}`}>
          {testimonies.map((item, index) => {
            const total = visibleCards;
            let offset = index - active;
            if (offset > Math.floor(total / 2)) offset -= total;
            if (offset < -Math.floor(total / 2)) offset += total;
            const isActive = offset === 0;

            let scale = 1;
            let bgColor = baseColor;
            if (Math.abs(offset) === 1) {
              scale = isActive ? 1.05 : 0.85;
              bgColor = lightenColor(baseColor, 0.18);
            } else if (Math.abs(offset) === 2) {
              scale = 0.7;
              bgColor = lightenColor(baseColor, 0.35);
            } else {
              scale = 0.6;
              bgColor = lightenColor(baseColor, 0.5);
            }

            return (
              <motion.div
                key={item.id}
                onClick={() => setActive(index)}
                initial={{ y: 200, opacity: 0 }}
                animate={{
                  x: offset * offsetDistance,
                  scale: isActive ? 1.1 : scale,
                  backgroundColor: bgColor,
                  zIndex: isActive ? 50 : 40 - Math.abs(offset),
                  y: animateIn ? 0 : 200,
                  opacity: animateIn ? 1 : 0,
                }}
                transition={{
                  type: "spring",
                  stiffness: 180,
                  damping: 22,
                  backgroundColor: { duration: 0.6, ease: "easeInOut" },
                }}
                className="absolute rounded-3xl cursor-pointer text-white shadow-2xl overflow-hidden"
                style={{ width: cardWidth, height: cardHeight }}
              >
                <div className="w-full flex justify-center mt-5">
                  <img src={item.image} className={`w-[85%] ${isMobile ? "h-[120px]" : "h-[160px]"} object-cover rounded-xl`} />
                </div>
                <p className="px-5 mt-4 text-sm leading-relaxed">{isActive ? item.text : shorten(item.text)}</p>
                <p className="font-bold text-xs mt-4">{item.name}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Pagination & Arrows */}
      <div className="flex justify-center items-center gap-3 mt-12">
        <button onClick={prev} className="p-2 rounded-full hover:bg-gray-200"><ChevronLeft size={18} /></button>
        <div className="flex items-center gap-2">
          {testimonies.map((_, i) => (
            <div
              key={i}
              onClick={() => {
                setActive(i);
              }}
              className={`cursor-pointer transition-all ${
                i === active ? "w-6 h-2 rounded-md bg-black" : "w-2 h-2 rounded-full bg-gray-400"
              }`}
            />
          ))}
        </div>
        <button onClick={next} className="p-2 rounded-full hover:bg-gray-200"><ChevronRight size={18} /></button>
      </div>

      <Link to="/testimonies">
        <button className="mt-6 px-6 sm:px-10 py-3 sm:py-4 bg-gray-700 rounded-2xl text-xs sm:text-sm font-semibold hover:bg-gray-600 flex items-center gap-2 mx-auto text-white transition">
          READ MORE <ArrowUpRight size={16} />
        </button>
      </Link>
    </section>
  );
}
