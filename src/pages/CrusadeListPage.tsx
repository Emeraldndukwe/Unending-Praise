import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import CrusadeListCard from "../components/CrusadeListCard";

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
  images?: string[];
  videos?: string[];
};

type CrusadeType = {
  id: string;
  name: string;
  description?: string;
};

export default function CrusadeListPage() {
  const { type: typeSlug } = useParams(); // e.g., "prison", "online", "prison-crusades", etc.
  const [crusades, setCrusades] = useState<Crusade[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeName, setTypeName] = useState<string>("");

  useEffect(() => {
    Promise.all([
      fetch('/api/crusades').then(res => res.json()),
      fetch('/api/crusade-types').then(res => res.json()).catch(() => [])
    ])
      .then(([crusadesData, typesData]: [any[], CrusadeType[]]) => {
        // Convert snake_case to camelCase
        const convertedCrusades = crusadesData.map((c: any) => ({
          ...c,
          previewImage: c.previewImage || c.preview_image,
        }));
        
        if (!typeSlug) {
          setCrusades([]);
          setLoading(false);
          return;
        }
        
        // Find the crusade type that matches the slug
        // Convert slug back to type name by comparing with actual type names
        const matchedType = typesData.find((t) => {
          const typeSlugFromName = t.name.toLowerCase().replace(/\s+/g, '-');
          return typeSlugFromName === typeSlug.toLowerCase();
        });
        
        if (matchedType) {
          setTypeName(matchedType.name);
          // Filter crusades by matching type name (case-insensitive)
          const filtered = convertedCrusades.filter((c) => {
            if (!c.type) return false;
            return c.type.toLowerCase() === matchedType.name.toLowerCase();
          });
          setCrusades(filtered);
        } else {
          // Fallback: try to match directly with slug (for backward compatibility)
          const filtered = convertedCrusades.filter((c) => {
            if (!c.type) return false;
            const typeSlugFromCrusade = c.type.toLowerCase().replace(/\s+/g, '-');
            return typeSlugFromCrusade === typeSlug.toLowerCase();
          });
          setCrusades(filtered);
          setTypeName(typeSlug.charAt(0).toUpperCase() + typeSlug.slice(1).replace(/-/g, ' '));
        }
        
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [typeSlug]);
  
  const pageTitle = typeName ? `${typeName.toUpperCase()} CRUSADES` : "CRUSADES";

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
                attendance={c.attendance}
                zone={c.zone}
                image={c.previewImage || "https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=400&h=300&fit=crop"}
          />
            );
          })
        )}
      </div>
    </div>
  );
}