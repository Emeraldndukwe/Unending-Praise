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
  preview_image?: string;
  preview_video?: string;
  media?: { type?: string; url?: string }[];
};

export default function Testimonies() {
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/testimonies')
      .then(res => res.json())
      .then((data: Testimony[]) => {
        const normalized = data
          .filter((t) => t.approved)
          .map((t) => {
            const mediaFallbackImage = t.media?.find(
              (item) => item.type === "image" && item.url
            )?.url;
            const mediaFallbackVideo = t.media?.find(
              (item) => item.type === "video" && item.url
            )?.url;

            return {
              ...t,
              previewImage: t.previewImage || t.preview_image || mediaFallbackImage,
              previewVideo: t.previewVideo || t.preview_video || mediaFallbackVideo,
            };
          });
        setTestimonies(normalized);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="relative h-48 sm:h-60 md:h-72 w-full bg-gradient-to-r from-[#54037C] via-[#6f3aa6] to-[#8A4EBF] rounded-b-3xl flex items-center justify-center shadow-md">
        <h1 className="text-white text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide">
          TESTIMONIES
        </h1>
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