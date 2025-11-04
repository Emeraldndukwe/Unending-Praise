import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import CrusadeForm from "../components/CrusadeForm";
import CrusadeCarousel from "../components/CrusadeCarousel";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

type Crusade = {
  id: string;
  title?: string;
  location?: string;
  date?: string;
  previewImage?: string;
  summary?: string;
  description?: string;
  type?: string;
};

export default function Crusades() {
  const [allCrusades, setAllCrusades] = useState<Crusade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/crusades')
      .then(res => res.json())
      .then((data: Crusade[]) => {
        setAllCrusades(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Filter crusades by type (if type exists, otherwise use all for prison)
  const prisonCrusades = allCrusades.filter((c) => !c.type || c.type === "prison").slice(0, 3);
  const onlineCrusades = allCrusades.filter((c) => c.type === "online").slice(0, 3);

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
          <h2 className="font-bold text-2xl mb-4">What Our Crusades Are About</h2>
          <p className="mb-3">
            We have gone round the world for crusades, sharing the word of God...
          </p>
          <p>Join us and look at our journey so far!</p>
        </div>

        <CrusadeForm />
      </div>

      {/* Crusade Sections */}
      <div className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <h3 className="text-center font-bold text-xl md:text-2xl mb-14">
          THE CRUSADES
        </h3>

        {/* Prison Crusades */}
        <div className="mb-20">
          <h2 className="text-3xl font-semibold">Prison Crusades</h2>
          <motion.div
            className="h-[2px] bg-black/30 rounded-full w-full mt-3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />

          <p className="text-justify leading-8 text-gray-700 indent-8 max-w-5xl mt-10 mx-auto">
            We have gone round the world for crusades, sharing the word of God
            with our Man of God Rev. Chris Oyakhilome. Join us and look at our
            journey so far...
          </p>

          <CrusadeCarousel data={prisonCrusades} />

          <div className="flex justify-center mt-6">
            <Link
              to="/crusades/prison"
              className="mt-1 px-10 py-4 bg-gray-700 rounded-2xl text-xs font-semibold hover:bg-gray-600 flex items-center gap-2 mx-auto text-white"
            >
              SEE ALL <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Online Crusades */}
        <div>
          <h2 className="text-3xl font-semibold">Online Crusades</h2>
          <motion.div
            className="h-[2px] bg-black/30 rounded-full w-full mt-3"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />

          <p className="text-justify leading-8 text-gray-700 indent-8 max-w-5xl mt-10 mx-auto">
            We have gone round the world for crusades, sharing the word of God
            with our Man of God Rev. Chris Oyakhilome...
          </p>

          <CrusadeCarousel data={onlineCrusades} />

          <div className="flex justify-center mt-6">
            <Link
              to="/crusades/online"
              className="mt-1 px-10 py-4 bg-gray-700 rounded-2xl text-xs font-semibold hover:bg-gray-600 flex items-center gap-2 mx-auto text-white"
            >
              SEE ALL <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
