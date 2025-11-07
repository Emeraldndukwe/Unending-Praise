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

  useEffect(() => {
    fetch('/api/crusades')
      .then(res => res.json())
      .then((data: any[]) => {
        // Convert snake_case to camelCase and show first 5
        const converted = data.map((c: any) => ({
          ...c,
          previewImage: c.previewImage || c.preview_image,
        }));
        setCrusades(converted.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  const getImageUrl = (idx: number) => {
    // Use placeholder images for now
    if (crusades[idx]?.previewImage) return crusades[idx].previewImage;
    // Placeholder images - user will replace these with actual images later
    return `https://images.unsplash.com/photo-${idx === 0 ? '1497435332909-251e61e4e502' : idx === 1 ? '1548554448-087ebf1e11e3' : idx === 2 ? '1511795409834-ef04bbd61622' : idx === 3 ? '1505373877841-8d25f7d46678' : '1568808163202-efd7e7d63d77'}?w=300&h=200&fit=crop`;
  };

  return (
    <>
      <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-8 md:px-16 flex flex-col md:flex-row justify-between items-center gap-8 sm:gap-12 relative overflow-hidden">
        {/* LEFT: TEXT - Hidden on mobile, shown on desktop */}
        <div className="hidden md:block w-full md:w-auto md:max-w-lg text-center md:text-left space-y-4 sm:space-y-6 relative z-60 bg-white p-4 sm:p-6 rounded-2xl sm:rounded-full backdrop-blur-sm">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            CRUSADES
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-black leading-relaxed">
            At the beginning of 2025 — the Year of Completeness, our Man of God, Rev. Dr. Chris Oyakhilome DSc., DSc., D.D., gave us a divine mandate to complete the full preaching of the Gospel to every nation, tribe, and tongue. Riding on this heavenly instruction, the Pastor Chris Live Unending Praise Crusades was birthed — a movement dedicated to soul winning and soul development through ceaseless worship. From prisons to orphanages, hospitals to communities, every gathering becomes an opportunity to share the love of Jesus Christ. This is the heartbeat of the Pastor Chris Live Unending Praise — taking the Gospel through worship to the ends of the earth.
          </p>
          <Link to="/crusades">
            <button className="mt-3 sm:mt-5 flex items-center justify-center md:justify-start gap-2 bg-purple-400 hover:bg-purple-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-medium text-sm sm:text-base transition">
            SEE MORE →
          </button>
          </Link>
        </div>

        {/* DESKTOP IMAGE COLLAGE */}
        <div className="hidden md:flex relative w-full md:w-[700px] h-[480px] justify-center items-center">
          {crusades.length > 0 ? (
            <>
              {crusades.slice(0, 5).map((crusade, idx) => (
                <Link
                  key={crusade.id}
                  to={`/crusades/details/${crusade.id}`}
                  className={`absolute object-cover rounded-3xl shadow-lg z-${40 - idx * 10} cursor-pointer hover:scale-105 transition-transform duration-300 ${
                    idx === 0 ? 'top-0 right-100 w-70 h-52 rotate-[-2deg]' :
                    idx === 1 ? 'top-6 right-1 w-72 h-48 rotate-[4deg]' :
                    idx === 2 ? 'top-28 right-50 w-64 h-44 rotate-[2deg]' :
                    idx === 3 ? 'bottom-0 right-100 w-70 h-52 rotate-[-3deg]' :
                    'bottom-6 right-10 w-72 h-48 rotate-[5deg]'
                  }`}
                >
          <img
                    src={getImageUrl(idx)}
                    alt={crusade.title || `Crusade ${idx + 1}`}
                    className="w-full h-full object-cover rounded-3xl"
          />
                </Link>
              ))}
            </>
          ) : (
            <>
              {[0, 1, 2, 3, 4].map((idx) => (
                <img
                  key={idx}
                  src={getImageUrl(idx)}
                  alt={`Crusade ${idx + 1}`}
                  className={`absolute object-cover rounded-3xl shadow-lg z-${40 - idx * 10} ${
                    idx === 0 ? 'top-0 right-100 w-70 h-52 rotate-[-2deg]' :
                    idx === 1 ? 'top-6 right-1 w-72 h-48 rotate-[4deg]' :
                    idx === 2 ? 'top-28 right-50 w-64 h-44 rotate-[2deg]' :
                    idx === 3 ? 'bottom-0 right-100 w-70 h-52 rotate-[-3deg]' :
                    'bottom-6 right-10 w-72 h-48 rotate-[5deg]'
                  }`}
                />
              ))}
            </>
          )}
        </div>

        {/* MOBILE/TABLET LAYOUT */}
        <div className="md:hidden relative w-full mt-4 sm:mt-8 flex justify-center items-center">
          <div className="relative w-full max-w-md h-[480px] sm:h-[540px] mx-auto">
            {crusades.length > 0 ? (
              <>
                {crusades.slice(0, 5).map((crusade, idx) => (
                  <Link
                    key={crusade.id}
                    to={`/crusades/details/${crusade.id}`}
                    className={`absolute shadow-md cursor-pointer hover:scale-110 transition-transform duration-300 ${
                      idx === 0 ? 'top-0 left-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[-8deg]' :
                      idx === 1 ? 'top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[10deg]' :
                      idx === 2 ? 'bottom-10 left-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[5deg]' :
                      idx === 3 ? 'bottom-10 right-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[-6deg]' :
                      'bottom-20 left-1/2 transform -translate-x-1/2 w-24 h-24 sm:w-28 sm:h-28 rotate-[4deg] shadow-lg'
                    }`}
                  >
            <img
                      src={getImageUrl(idx)}
                      alt={crusade.title || `Crusade ${idx + 1}`}
                      className="w-full h-full object-cover rounded-2xl"
                    />
                  </Link>
                ))}
              </>
            ) : (
              <>
                {[0, 1, 2, 3, 4].map((idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(idx)}
                    alt={`Crusade ${idx + 1}`}
                    className={`absolute object-cover shadow-md rounded-2xl ${
                      idx === 0 ? 'top-0 left-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[-8deg]' :
                      idx === 1 ? 'top-0 right-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[10deg]' :
                      idx === 2 ? 'bottom-10 left-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[5deg]' :
                      idx === 3 ? 'bottom-10 right-0 w-24 h-24 sm:w-28 sm:h-28 rotate-[-6deg]' :
                      'bottom-20 left-1/2 transform -translate-x-1/2 w-24 h-24 sm:w-28 sm:h-28 rotate-[4deg] shadow-lg'
                    }`}
                  />
                ))}
              </>
            )}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center bg-white backdrop-blur-sm px-4 sm:px-5 py-4 sm:py-6 rounded-4xl">
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
                CRUSADES
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed mt-2">
                At the beginning of 2025 — the Year of Completeness, our Man of God, Rev. Dr. Chris Oyakhilome DSc., DSc., D.D., gave us a divine mandate to complete the full preaching of the Gospel to every nation, tribe, and tongue. Riding on this heavenly instruction, the Pastor Chris Live Unending Praise Crusades was birthed — a movement dedicated to soul winning and soul development through ceaseless worship.
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
