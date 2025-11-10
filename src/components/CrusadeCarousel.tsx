import { useEffect, useState, useRef, useLayoutEffect } from "react";
import CrusadeCard from "./CrusadeCard";

interface Crusade {
  id: string | number;
  title?: string;
  attendance?: number;
  date?: string;
  image?: string;
  previewImage?: string;
}

interface CrusadeCarouselProps {
  data?: Crusade[];
}

const placeholderData: Crusade[] = [
  { id: "1", title: "A Day of Blessings", attendance: 5000, date: "23 Oct, 2025", image: "https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=400&h=300&fit=crop" },
  { id: "2", title: "Night of Miracles", attendance: 3500, date: "14 Nov, 2025", image: "https://images.unsplash.com/photo-1548554448-087ebf1e11e3?w=400&h=300&fit=crop" },
  { id: "3", title: "Healing Crusade", attendance: 8000, date: "30 Dec, 2025", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=300&fit=crop" },
  { id: "4", title: "Faith Revival", attendance: 6000, date: "10 Jan, 2026", image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=400&h=300&fit=crop" },
];

export default function CrusadeCarousel({ data }: CrusadeCarouselProps) {
  const list = data && data.length > 0 ? data : placeholderData;
  // Center the first card if there's only one, otherwise start at index 1
  const [active, setActive] = useState(list.length === 1 ? 0 : Math.min(1, list.length - 1));
  const [isMobile, setIsMobile] = useState(false);
  const [dynamicHeight, setDynamicHeight] = useState<number>(0);
  const touchStartX = useRef<number | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    // Only auto-rotate if there's more than one card
    if (list.length <= 1) return;
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % list.length);
    }, 7000);
    return () => clearInterval(interval);
  }, [list.length]);
  
  // Update active when list changes (e.g., if it becomes single card)
  useEffect(() => {
    if (list.length === 1) {
      setActive(0);
    } else {
      setActive(Math.min(1, list.length - 1));
    }
  }, [list.length]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const delta = touchStartX.current - touchEndX;
    if (Math.abs(delta) > 50) {
      if (delta > 0) {
        setActive((prev) => (prev + 1) % list.length);
      } else {
        setActive((prev) => (prev - 1 + list.length) % list.length);
      }
    }
    touchStartX.current = null;
  };

  useLayoutEffect(() => {
    const currentItem = list[active];
    if (!currentItem) return;
    const node = cardRefs.current[String(currentItem.id)];
    if (!node) return;

    const topPadding = isMobile ? 20 : 32;
    const bottomPadding = isMobile ? 36 : 48;
    setDynamicHeight(node.offsetHeight + topPadding + bottomPadding);
  }, [active, list, isMobile]);

  const topPadding = isMobile ? 20 : 32;
  const bottomPadding = isMobile ? 36 : 48;
  const computedMinHeight = dynamicHeight || (isMobile ? 420 : 540);

  return (
    <div className="w-full flex flex-col items-center">
      {/* CARDS */}
      <div 
        className="relative w-full flex justify-center overflow-visible mt-6 px-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ 
          minHeight: computedMinHeight,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          touchAction: "pan-y",
          overscrollBehaviorX: "contain",
        }}
      >
        {list.map((item, index) => {
          // For single card, center it
          if (list.length === 1) {
            return (
              <div
                key={item.id}
                className="absolute transition-all duration-500 ease-in-out"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  opacity: 1,
                  zIndex: 10,
                  transformOrigin: 'center',
                }}
                ref={(el) => {
                  cardRefs.current[String(item.id)] = el;
                }}
              >
                <CrusadeCard 
                  id={item.id}
                  title={item.title || "Crusade"}
                  attendance={item.attendance}
                  date={item.date || "Date TBD"}
                  image={item.previewImage || item.image || "https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=400&h=300&fit=crop"}
                />
              </div>
            );
          }

          const offset = index - active;

          const realOffset =
            offset === list.length - 1 ? -1 :
            offset === -(list.length - 1) ? 1 :
            offset;

          // Mobile: simpler transform with less offset
          const translateOffset = isMobile ? realOffset * 120 : realOffset * 360;

          return (
            <div
              key={item.id}
              className="absolute transition-all duration-500 ease-in-out"
              style={{
                top: '50%',
                transform: `translateX(${translateOffset}px) translateY(-50%) scale(${index === active ? 1.08 : 0.9})`,
                opacity: Math.abs(realOffset) <= 2 ? 1 : 0,
                zIndex: index === active ? 50 : 10,
                transformOrigin: 'center',
              }}
              ref={(el) => {
                cardRefs.current[String(item.id)] = el;
              }}
            >
              <CrusadeCard 
                id={item.id}
                title={item.title || "Crusade"}
                attendance={item.attendance}
                date={item.date || "Date TBD"}
                image={item.previewImage || item.image || "https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=400&h=300&fit=crop"}
              />
            </div>
          );
        })}
      </div>

      {/* DOTS */}
      <div className="flex gap-2 mt-3 md:mt-4 mb-4 relative z-10">
        {list.map((_, i) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`h-2 rounded-full transition-all
            ${i === active ? "bg-[#6a4f4f] w-5" : "bg-gray-400 w-2"}`}
          />
        ))}
      </div>
    </div>
  );
}
