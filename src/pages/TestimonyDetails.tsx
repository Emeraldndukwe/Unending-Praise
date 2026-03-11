import { useRef, useState, useEffect, useCallback } from "react";
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [testimony, setTestimony] = useState<Testimony | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch('/api/testimonies')
      .then(res => res.json())
      .then((data: any[]) => {
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

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-10 text-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-full h-[350px] bg-gray-200 rounded-2xl" />
          <div className="h-6 w-2/3 bg-gray-200 rounded" />
          <div className="h-4 w-1/3 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!testimony) {
    return <Navigate to="/testimonies" replace />;
  }

  // Determine if this testimony has video content
  const videoUrl = testimony.previewVideo || testimony.videos?.[0];
  const hasVideo = !!videoUrl;

  // Build extra media array (for gallery, excluding the primary video)
  const extraMedia: MediaItem[] = [];
  if (testimony.images) {
    testimony.images.forEach(img => extraMedia.push({ type: "image", url: img }));
  }
  if (testimony.videos) {
    testimony.videos
      .filter(vid => vid !== videoUrl)
      .forEach(vid => extraMedia.push({ type: "video", url: vid }));
  }

  // Non-video fallback: use the old layout
  if (!hasVideo) {
    const heroMedia = testimony.previewImage
      ? { type: "image" as const, url: testimony.previewImage }
      : extraMedia.length > 0
      ? extraMedia[0]
      : null;

    const allMedia: MediaItem[] = [];
    if (testimony.images) testimony.images.forEach(img => allMedia.push({ type: "image", url: img }));
    if (testimony.videos) testimony.videos.forEach(vid => allMedia.push({ type: "video", url: vid }));

    return (
      <div className="max-w-5xl mx-auto px-4 pt-24 pb-10">
        <div className="pb-4">
          <Link to="/testimonies" className="text-sm text-gray-700 hover:underline">
            ← Back to Testimonies
          </Link>
        </div>

        <div className="relative w-full h-[330px] md:h-[400px] rounded-2xl overflow-hidden">
          {heroMedia ? (
            <img
              src={heroMedia.url}
              alt={testimony.title || "Testimony"}
              className="w-full h-full object-cover object-center"
              loading="eager"
              fetchPriority="high"
              decoding="async"
            />
          ) : (
            <div className="w-full h-full bg-gray-200" />
          )}
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-6 left-6 text-white">
            <h1 className="text-2xl md:text-3xl font-bold drop-shadow-lg">
              {testimony.title || "Testimony"}
            </h1>
          </div>
        </div>

        <p className="text-right text-gray-700 mt-2 text-sm md:text-base">
          {testimony.name || "Anonymous"}
        </p>

        <div className="border-t my-10 w-full" />

        {testimony.content && (
          <div className="text-gray-800 leading-relaxed text-sm md:text-base text-justify whitespace-pre-wrap">
            {testimony.content.trim()}
          </div>
        )}

        {allMedia.length > 1 && (
          <>
            <div className="relative w-full flex flex-col items-start mt-8">
              <h2 className="text-2xl font-semibold mb-2 px-4 md:px-12">Media</h2>
              <motion.div
                className="h-[2px] bg-black/30 rounded-full w-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
              />
            </div>
            <div className="mt-4 mb-5 flex justify-end px-4 md:px-12">
              <button
                onClick={() => carouselRef.current?.openGallery()}
                className="text-sm text-gray-700 hover:text-black flex items-center gap-1"
              >
                VIEW ALL →
              </button>
            </div>
            <ImageCarousel ref={carouselRef} media={allMedia} />
          </>
        )}

        {id && <CommentSection entityType="testimony" entityId={id} />}
      </div>
    );
  }

  // ──────────────────────────────────────────────────
  // VIDEO TESTIMONY LAYOUT
  // ──────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-16">

        {/* Back Navigation */}
        <motion.div
          className="pb-5"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Link
            to="/testimonies"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-[#54037C] transition-colors group"
          >
            <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Testimonies
          </Link>
        </motion.div>

        {/* ─── VIDEO PLAYER ─── */}
        <motion.div
          className="relative w-full rounded-2xl overflow-hidden shadow-2xl bg-black"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain bg-black"
              controls
              controlsList="nodownload"
              playsInline
              preload="metadata"
              poster={testimony.previewImage || undefined}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
            />

            {/* Custom play overlay (only visible before first play) */}
            {!isPlaying && (
              <button
                onClick={handlePlayPause}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors cursor-pointer group"
                aria-label="Play video"
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/90 group-hover:bg-white rounded-full flex items-center justify-center shadow-2xl transition-all group-hover:scale-110">
                  <svg className="w-7 h-7 md:w-9 md:h-9 text-[#54037C] ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </button>
            )}
          </div>
        </motion.div>

        {/* ─── TITLE & AUTHOR ─── */}
        <motion.div
          className="mt-6 md:mt-8"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
            {testimony.title || "Testimony"}
          </h1>
          <div className="mt-3 flex items-center gap-3">
            {/* Author avatar placeholder */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#54037C] to-[#8A4EBF] flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {(testimony.name || "A").charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800 text-sm md:text-base">
                {testimony.name || "Anonymous"}
              </p>
              <p className="text-xs text-gray-500">Testimony</p>
            </div>
          </div>
        </motion.div>

        {/* ─── DIVIDER ─── */}
        <motion.div
          className="my-6 md:my-8"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeInOut" }}
          style={{ transformOrigin: "left" }}
        >
          <div className="h-px bg-gradient-to-r from-[#54037C]/20 via-gray-200 to-transparent" />
        </motion.div>

        {/* ─── CONTENT / WRITTEN TESTIMONY ─── */}
        {testimony.content && (
          <motion.div
            className="prose prose-gray max-w-none"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            <div className="text-gray-700 leading-relaxed text-[15px] md:text-base text-justify whitespace-pre-wrap">
              {testimony.content.trim()}
            </div>
          </motion.div>
        )}

        {/* ─── EXTRA MEDIA GALLERY (if more than the primary video) ─── */}
        {extraMedia.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div className="relative w-full flex flex-col items-start mt-10">
              <h2 className="text-xl font-semibold mb-2">More Media</h2>
              <motion.div
                className="h-[2px] bg-black/20 rounded-full w-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
              />
            </div>
            <div className="mt-4 mb-5 flex justify-end">
              <button
                onClick={() => carouselRef.current?.openGallery()}
                className="text-sm text-gray-700 hover:text-black flex items-center gap-1"
              >
                VIEW ALL →
              </button>
            </div>
            <ImageCarousel ref={carouselRef} media={extraMedia} />
          </motion.div>
        )}

        {/* ─── COMMENTS SECTION ─── */}
        <motion.div
          className="mt-10 md:mt-12"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {id && <CommentSection entityType="testimony" entityId={id} />}
        </motion.div>
      </div>
    </div>
  );
}
