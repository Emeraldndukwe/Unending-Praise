import { useRef, useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { CalendarDays, Users, Camera, Globe } from "lucide-react";
import ImageCarousel, { type ImageCarouselRef, type MediaItem } from "../components/shared/ImageCarousel";
import CommentSection from "../components/shared/CommentSection";
import { motion } from "framer-motion";

type Crusade = {
  id: string;
  title?: string;
  subtitle?: string;
  attendance?: number;
  zone?: string;
  date?: string;
  description?: string;
  images?: string[];
  videos?: string[];
  previewImage?: string;
  previewVideo?: string;
};

export default function CrusadeDetails() {
  const { id } = useParams();
  const carouselRef = useRef<ImageCarouselRef>(null);
  const [crusade, setCrusade] = useState<Crusade | null>(null);
  const [loading, setLoading] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch('/api/crusades')
      .then(res => res.json())
      .then((data: Crusade[]) => {
        const found = data.find(c => c.id === id);
        if (found) {
          setCrusade(found);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const section = document.getElementById("crusade-details");
      if (!section) return;
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight - 100) setInView(true);
    };
    window.addEventListener("scroll", onScroll);
    onScroll(); // initial check
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (loading) {
    return <div className="max-w-6xl mx-auto px-4 pt-24 pb-10 text-center">Loading...</div>;
  }

  if (!crusade) return <Navigate to="/crusades" replace />;

  // Build media array from images and videos
  const media: MediaItem[] = [];
  if (crusade.images) {
    crusade.images.forEach(img => media.push({ type: "image", url: img }));
  }
  if (crusade.videos) {
    crusade.videos.forEach(vid => media.push({ type: "video", url: vid }));
  }

  const heroMedia = crusade.previewVideo 
    ? { type: "video" as const, url: crusade.previewVideo }
    : crusade.previewImage
    ? { type: "image" as const, url: crusade.previewImage }
    : media.length > 0
    ? media[0]
    : null;

  return (
    <div id="crusade-details" className="max-w-6xl mx-auto px-4 pt-24 pb-10">

      {/* Back button */}
      <div className="pt-6 pb-4">
        <Link
          to="/crusades"
          className="text-sm text-gray-700 hover:underline"
        >
          ← Back to Crusades
        </Link>
      </div>

      {/* HERO SECTION */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full overflow-hidden rounded-xl shadow-md"
      >
        {heroMedia ? (
          heroMedia.type === "video" ? (
            <video
              src={heroMedia.url}
              className="w-full h-[350px] md:h-[420px] object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
        <img
              src={heroMedia.url}
          className="w-full h-[350px] md:h-[420px] object-cover"
              alt={crusade.title || "Crusade"}
        />
          )
        ) : (
          <div className="w-full h-[350px] md:h-[420px] bg-gray-200" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold">{crusade.title || "Crusade"}</h1>
          {crusade.subtitle && <p className="text-sm text-gray-200">{crusade.subtitle}</p>}

          <div className="flex flex-wrap gap-6 mt-4 text-sm">
            {crusade.date && (
            <div className="flex items-center gap-2">
              <CalendarDays size={16} /> {crusade.date}
            </div>
            )}
            {crusade.attendance && (
            <div className="flex items-center gap-2">
              <Users size={16} /> {crusade.attendance.toLocaleString()} attendees
            </div>
            )}
            {crusade.zone && (
            <div className="flex items-center gap-2">
              <Globe size={16} /> Zone: {crusade.zone}
            </div>
            )}
            <div className="flex items-center gap-2">
              <Camera size={16} /> {media.length} {media.length === 1 ? 'Media' : 'Photos / Videos'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ABOUT */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
        className="mt-10"
      >
        <h2 className="text-xl font-semibold mb-3">About this crusade</h2>
        <p className="text-gray-700 leading-relaxed text-sm md:text-base">
          {crusade.description}
        </p>
      </motion.div>

      {/* MEDIA */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.4 }}
        className="mt-14"
      >
        {/* Media header with underline style */}
        <div className="relative w-full flex flex-col items-start">
          {/* Media header */}
          <h2 className="text-3xl font-semibold mb-2 px-4 md:px-12">
            Media
          </h2>

          {/* Divider line as underline */}
          <motion.div
            className="h-[2px] bg-black/30 rounded-full w-full"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ transformOrigin: "left" }}
          />
        </div>

        {/* View all button */}
        <div className="mt-4 flex justify-end px-4 md:px-12">
          <button
            onClick={() => carouselRef.current?.openGallery()}
            className="text-sm text-gray-700 hover:text-black flex items-center gap-1"
          >
            VIEW ALL →
          </button>
        </div>

        {/* Image carousel */}
        {media.length > 0 && (
        <div className="mt-6">
            <ImageCarousel ref={carouselRef} media={media} />
        </div>
        )}
      </motion.div>

      {/* COMMENTS */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
        className="mt-12"
      >
        <CommentSection entityType="crusade" entityId={crusade.id} />
      </motion.div>

    </div>
  );
}
