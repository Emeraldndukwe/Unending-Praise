import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import CrusadeForm from "../components/CrusadeForm";
import CrusadeCarousel from "../components/CrusadeCarousel";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type Crusade = {
  id: string;
  title?: string;
  attendance?: number;
  zone?: string;
  date?: string;
  previewImage?: string;
  summary?: string;
  description?: string;
  type?: string;
};

type CrusadeType = {
  id: string;
  name: string;
  description?: string;
};

export default function Crusades() {
  const [allCrusades, setAllCrusades] = useState<Crusade[]>([]);
  const [crusadeTypes, setCrusadeTypes] = useState<CrusadeType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/crusades').then(res => res.json()),
      fetch('/api/crusade-types').then(res => res.json()).catch(() => [])
    ])
      .then(([crusades, types]: [any[], CrusadeType[]]) => {
        // Convert snake_case to camelCase for previewImage
        const convertedCrusades = crusades.map((c: any) => ({
          ...c,
          previewImage: c.previewImage || c.preview_image,
        }));
        setAllCrusades(convertedCrusades);
        setCrusadeTypes(types);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Dynamically generate sections based on crusade types
  const getCrusadesByType = (typeName: string) => {
    if (!typeName || typeName.toLowerCase() === 'prison') {
      // For prison or undefined, show crusades without type or with prison type
      return allCrusades.filter((c) => !c.type || c.type.toLowerCase() === "prison").slice(0, 3);
    }
    return allCrusades.filter((c) => c.type && c.type.toLowerCase() === typeName.toLowerCase()).slice(0, 3);
  };

  // Get all unique types from crusades - only show types that exist in admin
  const activeTypes = crusadeTypes.length > 0 ? crusadeTypes : [];

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading crusades…</div>;
  }

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative h-60 md:h-72 w-full">
        <img
          src="https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=1200&h=400&fit=crop&auto=format"
          alt="Crusades Banner"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-4xl font-bold">CRUSADES</h1>
        </div>
      </div>

      {/* About + Form */}
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 text-gray-700 leading-relaxed">
          <h2 className="font-bold text-2xl mb-4">What Is the Pastor Chris Live Unending Praise Crusade All About?</h2>
          <p className="mb-4">
            At the beginning of the Year 2025 — the Year of Completeness — our Man of God, Rev. Dr. Chris Oyakhilome DSc. DSc. D.D., gave us a divine mandate: to complete the full preaching of the Gospel to every nation, tribe, and tongue. He charged each one of us to go out and win souls, and make disciples of men — as though we were the only ones entrusted with this sacred responsibility.
          </p>
          <p className="mb-4">
            Riding on this divine mandate, the Pastor Chris Live Unending Praise Crusade was born. These crusades are all about soul winning and soul development — this is what we live for. It is our primary responsibility on earth, and everything we do is channeled towards fulfilling this divine mandate.
          </p>
          <p className="mb-4 italic">
            Matthew 28:19–20 - "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost. Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you always, even unto the end of the world. Amen."
          </p>
          <p className="mb-4">
            While The Pastor Chris Live Unending Praise is a platform of continuous worship — where endless praise is offered to our Lord and Savior, Jesus Christ — it is also a powerful discipleship platform. Through it, we carry the message of Christ and the beauty of worship to every place: orphanages, prisons, hospitals, schools, communities etc.
          </p>
          <p>
            Every opportunity becomes a moment for evangelism — even birthday celebrations are turned into soul-winning crusades. This is the heartbeat of the Pastor Chris Live Unending Praise Crusades — taking the Gospel of our Lord and Saviour Jesus Christ through worship across the globe.
          </p>
        </div>

        <CrusadeForm />
      </div>

      {/* Crusade Sections */}
      <div className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <h3 className="text-center font-bold text-xl md:text-2xl mb-14">
          THE CRUSADES
        </h3>

        {/* Show message if no crusade types exist */}
        {activeTypes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No crusade types have been set up yet. Check back soon!</p>
          </div>
        ) : (
          /* Dynamically generate sections for each crusade type */
          activeTypes.map((crusadeType, index) => {
          const typeCrusades = getCrusadesByType(crusadeType.name);
          const typeSlug = crusadeType.name.toLowerCase().replace(/\s+/g, '-');
          
          return (
            <div key={crusadeType.id} className={index < activeTypes.length - 1 ? "mb-20" : ""}>
              <h2 className="text-3xl font-semibold mb-3">{crusadeType.name} Crusades</h2>
              <motion.div
                className="h-[2px] bg-black/30 rounded-full w-full mb-8"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut", delay: index * 0.1 }}
                style={{ transformOrigin: "left" }}
              />

              {crusadeType.description && crusadeType.description.trim() ? (
                <p className="text-justify leading-8 text-gray-700 indent-8 max-w-5xl mt-10 mx-auto">
                  {crusadeType.description}
                </p>
              ) : null}

              {typeCrusades.length > 0 ? (
                <>
                  <CrusadeCarousel data={typeCrusades} />
                  <div className="flex justify-center mt-6">
                    <Link
                      to={`/crusades/${typeSlug}`}
                      className="mt-1 px-10 py-4 bg-gray-700 rounded-2xl text-xs font-semibold hover:bg-gray-600 flex items-center gap-2 mx-auto text-white"
                    >
                      SEE ALL <ArrowUpRight size={16} />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No {crusadeType.name.toLowerCase()} crusades yet. Check back soon!</p>
                </div>
              )}
            </div>
          );
        }))}
      </div>
    </div>
  );
}
