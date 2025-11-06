import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import CrusadeListCard from "../components/CrusadeListCard";

type Crusade = {
  id: string;
  title?: string;
  location?: string;
  date?: string;
  previewImage?: string;
  summary?: string;
  description?: string;
  type?: string;
  images?: string[];
  videos?: string[];
};

export default function CrusadeListPage() {
  const { type } = useParams(); // "prison" or "online"
  const [crusades, setCrusades] = useState<Crusade[]>([]);
  const [loading, setLoading] = useState(true);
  
  const pageTitle =
    type === "prison" ? "PRISON CRUSADES" : "ONLINE CRUSADES";

  useEffect(() => {
    fetch('/api/crusades')
      .then(res => res.json())
      .then((data: Crusade[]) => {
        const filtered = data.filter((c) => 
          type === "prison" ? (!c.type || c.type === "prison") : c.type === "online"
        );
        setCrusades(filtered);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [type]);

  return (
    <div className="w-full">
      {/* Banner */}
      <div className="relative h-60 md:h-72 w-full">
        <img
          src="https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=1200&h=400&fit=crop&auto=format"
          alt="Crusades Banner"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-white text-3xl md:text-4xl font-bold">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        <Link
          to="/crusades"
          className="text-purple-700 font-semibold mb-4 inline-block hover:underline"
        >
          &larr; Back to Crusades
        </Link>

        {loading ? (
          <div className="text-center py-8 text-gray-600">Loading crusades...</div>
        ) : crusades.length === 0 ? (
          <div className="text-center py-8 text-gray-600">No crusades found.</div>
        ) : (
          crusades.map((c) => {
            const imageCount = c.images?.length || 0;
            const videoCount = c.videos?.length || 0;
            const totalMedia = imageCount + videoCount;
            return (
          <CrusadeListCard 
            key={c.id} 
            id={c.id}
                title={c.title || "Crusade"}
                description={c.summary || c.description || "Join us for this amazing crusade!"}
                date={c.date || "Date TBD"}
                mediaCount={totalMedia > 0 ? `${totalMedia} image${totalMedia !== 1 ? 's' : ''} and video${totalMedia !== 1 ? 's' : ''}` : "No media"}
                location={c.location || "Location TBD"}
                image={c.previewImage || "https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=400&h=300&fit=crop"}
          />
            );
          })
        )}
      </div>
    </div>
  );
}