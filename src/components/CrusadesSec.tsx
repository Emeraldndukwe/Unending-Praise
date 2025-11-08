import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

type Crusade = {
  id: string;
  title?: string;
  attendance?: number;
  date?: string;
  previewImage?: string;
  summary?: string;
};

function CrusadesSection() {
  const [crusades, setCrusades] = useState<Crusade[]>([]);
  const [loading, setLoading] = useState(true);

  const CRUSADES_CACHE_KEY = "crusades-cache-v1";
  const CACHE_TTL = 5 * 60 * 1000;

  const loadFromCache = (): Crusade[] | null => {
    if (typeof window === "undefined") return null;
    try {
      const raw = sessionStorage.getItem(CRUSADES_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.timestamp || Date.now() - parsed.timestamp > CACHE_TTL) {
        sessionStorage.removeItem(CRUSADES_CACHE_KEY);
        return null;
      }
      return parsed.data as Crusade[];
    } catch (error) {
      console.warn("[CrusadesSection] Failed to read cached crusades", error);
      return null;
    }
  };

  const saveToCache = (data: Crusade[]) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(
        CRUSADES_CACHE_KEY,
        JSON.stringify({ timestamp: Date.now(), data })
      );
    } catch (error) {
      console.warn("[CrusadesSection] Failed to cache crusades", error);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const loadCrusades = async () => {
      try {
        const cached = loadFromCache();
        if (isMounted && cached && cached.length > 0) {
          setCrusades(cached);
        }
        if (isMounted) {
          setLoading(!(cached && cached.length > 0));
        }
        const response = await fetch('/api/crusades', { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load crusades: ${response.status}`);
        }
        const data: any[] = await response.json();
        const converted = data
          .map((c: any) => ({
            ...c,
            previewImage: c.previewImage || c.preview_image,
          }))
          .sort((a, b) => (b.attendance ?? 0) - (a.attendance ?? 0));
        const topFive = converted.slice(0, 5);
        if (isMounted) {
          setCrusades(topFive);
          setLoading(false);
          saveToCache(converted);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('[CrusadesSection] Failed to fetch crusades', err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCrusades();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const fallbackImages = [
    'https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1548554448-087ebf1e11e3?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300&h=200&fit=crop',
    'https://images.unsplash.com/photo-1568808163202-efd7e7d63d77?w=300&h=200&fit=crop',
  ];

  const getImageUrl = (idx: number) => {
    if (crusades[idx]?.previewImage) return crusades[idx].previewImage;
    return fallbackImages[idx % fallbackImages.length];
  };

  const desktopPositions = [
    'top-0 right-100 w-70 h-52 rotate-[-2deg]',
    'top-6 right-1 w-72 h-48 rotate-[4deg]',
    'top-28 right-50 w-64 h-44 rotate-[2deg]',
    'bottom-0 right-100 w-70 h-52 rotate-[-3deg]',
    'bottom-6 right-10 w-72 h-48 rotate-[5deg]',
  ];

  const mobilePositions = [
    'top-0 left-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[-8deg]',
    'top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[10deg]',
    'bottom-10 left-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[5deg]',
    'bottom-10 right-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[-6deg]',
    'bottom-20 left-1/2 transform -translate-x-1/2 w-24 h-24 sm:w-28 sm:h-28 rotate-[4deg] shadow-lg',
  ];

  const topCrusades = crusades.slice(0, 5);
  const hasCrusades = topCrusades.length > 0;

  return (
    <>
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8 sm:gap-12 relative overflow-hidden">
        {/* LEFT: TEXT - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block w-full md:w-auto md:max-w-lg text-center md:text-left space-y-4 sm:space-y-6 relative z-60 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-full backdrop-blur-sm">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            CRUSADES
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-black leading-relaxed">
            At the beginning of the Year 2025 — the Year of Completeness — our Man of God, Rev. Dr. Chris Oyakhilome DSc. DSc. D.D., gave us a divine mandate: to complete the full preaching of the Gospel to every nation, tribe, and tongue. Riding on this divine mandate, the Pastor Chris Live Unending Praise Crusade was born. These crusades are all about soul winning and soul development — this is what we live for. It is our primary responsibility on earth, and everything we do is channeled towards fulfilling this divine mandate.
          </p>
          <Link to="/crusades">
            <button className="mt-3 sm:mt-5 flex items-center justify-center md:justify-start gap-2 bg-purple-400 hover:bg-purple-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base transition">
            SEE MORE →
          </button>
          </Link>
        </div>

        {/* DESKTOP IMAGE COLLAGE */}
        <div className="hidden md:flex relative w-full md:w-[700px] h-[480px] justify-center items-center">
          {loading ? (
            <>
              {desktopPositions.map((position, idx) => (
                <div
                  key={`desktop-skeleton-${idx}`}
                  className={`absolute rounded-3xl bg-gray-200/70 animate-pulse ${position}`}
                />
              ))}
            </>
          ) : hasCrusades ? (
            <>
              {topCrusades.map((crusade, idx) => (
                <Link
                  key={crusade.id}
                  to={`/crusades/details/${crusade.id}`}
                  className={`absolute object-cover rounded-3xl shadow-lg z-${40 - idx * 10} cursor-pointer hover:scale-105 transition-transform duration-300 ${desktopPositions[idx]}`}
                >
                  <img
                    src={getImageUrl(idx)}
                    alt={crusade.title || `Crusade ${idx + 1}`}
                    className="w-full h-full object-cover rounded-3xl"
                    loading="lazy"
                    decoding="async"
                  />
                </Link>
              ))}
            </>
          ) : (
            <div className="text-center text-gray-500">No crusades available yet. Check back soon!</div>
          )}
        </div>

        {/* MOBILE/TABLET LAYOUT */}
        <div className="md:hidden relative w-full mt-4 sm:mt-8 flex justify-center items-center">
          <div className="relative w-full max-w-md h-[480px] sm:h-[540px] mx-auto">
            {loading ? (
              <>
                {mobilePositions.map((position, idx) => (
                  <div
                    key={`mobile-skeleton-${idx}`}
                    className={`absolute rounded-2xl bg-gray-200/70 animate-pulse ${position}`}
                  />
                ))}
              </>
            ) : hasCrusades ? (
              <>
                {topCrusades.map((crusade, idx) => (
                  <Link
                    key={crusade.id}
                    to={`/crusades/details/${crusade.id}`}
                    className={`absolute shadow-md cursor-pointer hover:scale-110 transition-transform duration-300 ${mobilePositions[idx]}`}
                  >
                    <img
                      src={getImageUrl(idx)}
                      alt={crusade.title || `Crusade ${idx + 1}`}
                      className="w-full h-full object-cover rounded-2xl"
                      loading="lazy"
                      decoding="async"
                    />
                  </Link>
                ))}
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                No crusades available yet. Check back soon!
              </div>
            )}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-white backdrop-blur-sm px-4 sm:px-5 py-4 sm:py-6 rounded-4xl">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                CRUSADES
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed mt-2">
                At the beginning of the Year 2025 — the Year of Completeness — our Man of God, Rev. Dr. Chris Oyakhilome DSc. DSc. D.D., gave us a divine mandate: to complete the full preaching of the Gospel to every nation, tribe, and tongue. Riding on this divine mandate, the Pastor Chris Live Unending Praise Crusade was born. These crusades are all about soul winning and soul development — this is what we live for.
              </p>
              <Link to="/crusades">
                <button className="mt-3 sm:mt-4 bg-purple-400 hover:bg-purple-500 text-white px-5 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-xs sm:text-sm md:text-base transition">
                SEE MORE →
              </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Animated Divider Line */}
      <motion.div
        className="h-[2px] bg-black/30 rounded-full w-[88%] mx-auto mt-6"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        viewport={{ once: true }}
        style={{ transformOrigin: "center" }}
      />
    </>
  );
}

export default CrusadesSection;
