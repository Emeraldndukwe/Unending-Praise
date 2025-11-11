import { useRef, useState, useEffect } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import ImageCarousel, { type ImageCarouselRef, type MediaItem } from "../components/shared/ImageCarousel";
import CommentSection from "../components/shared/CommentSection";
import { motion } from "framer-motion";

type RawMediaItem = {
  type?: string;
  url?: string;
};

type Testimony = {
  id: string;
  name?: string;
  title?: string;
  content?: string;
  summary?: string;
  images?: string[];
  videos?: string[];
  media?: RawMediaItem[];
  previewImage?: string;
  previewVideo?: string;
  approved?: boolean;
};

export default function TestimonyDetails() {
  const { id } = useParams();
  const carouselRef = useRef<ImageCarouselRef>(null);
  const [testimony, setTestimony] = useState<Testimony | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch('/api/testimonies')
      .then(res => res.json())
      .then((data: any[]) => {
        // Convert snake_case to camelCase
        const converted = data.map((t: any) => {
          const mediaArray: RawMediaItem[] = Array.isArray(t.media) ? t.media : [];
          const imageItems = mediaArray.filter(
            (item): item is RawMediaItem & { url: string } =>
              item?.type === "image" && typeof item.url === "string"
          );
          const videoItems = mediaArray.filter(
            (item): item is RawMediaItem & { url: string } =>
              item?.type === "video" && typeof item.url === "string"
          );
          const imagesArray: string[] = Array.isArray(t.images)
            ? t.images
            : imageItems.map((item) => item.url);
          const videosArray: string[] = Array.isArray(t.videos)
            ? t.videos
            : videoItems.map((item) => item.url);

          const fallbackImage =
            t.previewImage ||
            t.preview_image ||
            t.image ||
            imagesArray[0] ||
            imageItems[0]?.url ||
            null;

          const fallbackVideo =
            t.previewVideo ||
            t.preview_video ||
            videosArray[0] ||
            videoItems[0]?.url ||
            null;

          return {
            id: t.id,
            name: t.name,
            title: t.title,
            content: t.content,
            summary: t.summary,
            images: imagesArray,
            videos: videosArray,
            media: mediaArray,
            previewImage: fallbackImage ?? undefined,
            previewVideo: fallbackVideo ?? undefined,
            approved: t.approved,
          };
        });
        const found = converted.find(t => t.id === id && t.approved);
        if (found) {
          setTestimony(found);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="max-w-5xl mx-auto px-4 pt-24 pb-10 text-center">Loading...</div>;
  }

  if (!testimony) {
    return <Navigate to="/testimonies" replace />;
  }

  // Build media array from images and videos
  const media: MediaItem[] = [];
  if (testimony.images) {
    testimony.images.forEach(img => media.push({ type: "image", url: img }));
  }
  if (testimony.videos) {
    testimony.videos.forEach(vid => media.push({ type: "video", url: vid }));
  }

  const heroMedia = testimony.previewVideo
    ? { type: "video" as const, url: testimony.previewVideo }
    : testimony.previewImage
    ? { type: "image" as const, url: testimony.previewImage }
    : media.length > 0
    ? media[0]
    : null;

  return (
    // ✅ Added pt-24 so content sits below navbar
    <div className="max-w-5xl mx-auto px-4 pt-24 pb-10">

      {/* ✅ Back button */}
      <div className="pb-4">
        <Link
          to="/testimonies"
          className="text-sm text-gray-700 hover:underline"
        >
          ← Back to Testimonies
        </Link>
      </div>

      {/* ✅ HERO MEDIA (IMAGE OR VIDEO) WITH DARK OVERLAY AND TITLE */}
      <div className="relative w-full h-[330px] md:h-[400px] rounded-2xl overflow-hidden">
        {heroMedia ? (
          heroMedia.type === "video" ? (
            <video
              src={heroMedia.url}
              className="w-full h-full object-cover"
              autoPlay
              loop
              muted
              playsInline
            />
          ) : (
            <img
              src={heroMedia.url}
              alt={testimony.title || "Testimony"}
              className="w-full h-full object-cover object-center"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          )
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Title inside media */}
        <div className="absolute bottom-6 left-6 text-white">
          <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
            {testimony.title || "Testimony"}
          </h1>
        </div>
      </div>

      {/* ✅ AUTHOR RIGHT ALIGNED */}
      <p className="text-right text-gray-700 mt-2 text-sm md:text-base">
        {testimony.name || "Anonymous"}
      </p>

      {/* ✅ DIVIDER */}
      <div className="border-t my-10 w-full" />

      {/* ✅ LONG JUSTIFIED DESCRIPTION */}
      {testimony.content && (
        <div className="text-gray-800 leading-relaxed text-sm md:text-base text-justify whitespace-pre-wrap">
          {testimony.content.trim()}
        </div>
      )}

        
        {/* Media - Only show if there's more than one media item */}
        {media.length > 1 && (
          <>
            {/* Media header with underline style */}
            <div className="relative w-full flex flex-col items-start mt-8">
              {/* Media header */}
              <h2 className="text-2xl font-semibold mb-2 px-4 md:px-12">
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
            <div className="mt-4 mb-5 flex justify-end px-4 md:px-12">
              <button
                onClick={() => carouselRef.current?.openGallery()}
                className="text-sm text-gray-700 hover:text-black flex items-center gap-1"
              >
                VIEW ALL →
              </button>
            </div>

            <ImageCarousel ref={carouselRef} media={media} />
          </>
        )}

      {/* ✅ COMMENTS */}
      {id && <CommentSection entityType="testimony" entityId={id} />}
    </div>
  );
}
