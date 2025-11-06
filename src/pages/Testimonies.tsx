import { useState, useEffect } from "react";
import TestimonyCard from "../components/TestimonyCard";
import TestimonyForm from "../components/TestimonyForm";

type Testimony = {
  id: string;
  title?: string;
  name?: string;
  summary?: string;
  content?: string;
  previewImage?: string;
  previewVideo?: string;
  approved?: boolean;
};

export default function Testimonies() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonies')
      .then(res => res.json())
      .then((data: any[]) => {
        // Convert snake_case to camelCase and filter approved testimonies
        const converted = data
          .filter((t: any) => t.approved)
          .map((t: any) => ({
            id: t.id,
            title: t.title,
            name: t.name,
            summary: t.summary,
            content: t.content,
            previewImage: t.previewImage || t.preview_image,
            previewVideo: t.previewVideo || t.preview_video,
            approved: t.approved,
          }));
        setTestimonies(converted);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="relative h-48 sm:h-60 md:h-72 w-full">
        <img
          src="https://images.unsplash.com/photo-1497435332909-251e61e4e502?w=1200&h=400&fit=crop&auto=format"
          alt="Banner"
          className="object-cover w-full h-full"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold">TESTIMONIES</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10">
        {/* Testimonies List */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          {loading ? (
            <div className="text-center py-8 text-gray-600">Loading testimonies...</div>
          ) : testimonies.length === 0 ? (
            <div className="text-center py-8 text-gray-600">No approved testimonies yet. Be the first to share!</div>
          ) : (
            testimonies.map((t) => (
            <TestimonyCard key={t.id} {...t} />
            ))
          )}
        </div>

        {/* Form */}
        <div className="w-full order-1 lg:order-2">
          <TestimonyForm />
        </div>
      </div>
    </div>
  );
}