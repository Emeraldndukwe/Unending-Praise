import { useState, useEffect, useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";

const SongList = lazy(() => import("../components/SongList"));
const LiveChat = lazy(() => import("../components/LiveChat"));

type StreamEvent = {
  id: string;
  name: string;
  streamUrl?: string;
  imageUrl?: string;
  date?: string;
  description?: string;
};

// Helper function to format date as "12TH JANUARY"
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  
  // Add ordinal suffix
  const getOrdinal = (n: number): string => {
    const s = ["TH", "ST", "ND", "RD"];
    const v = n % 100;
    return n.toString() + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${getOrdinal(day)} ${month}`;
}

// Helper function to convert YouTube/Vimeo URLs to embed URLs
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Vimeo
  const vimeoRegex = /(?:vimeo\.com\/)(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  // Return original URL if not YouTube/Vimeo (could be HLS or other)
  return url;
}

export default function Event() {
  const [streamEvents, setStreamEvents] = useState<StreamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEventVideo, setShowEventVideo] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<StreamEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"songs" | "livechat">("songs");
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/stream-events/active");
        if (response.ok) {
          const data = await response.json();
          setStreamEvents(Array.isArray(data) ? data : [data].filter(Boolean));
        } else {
          setStreamEvents([]);
        }
      } catch (error) {
        console.error("Failed to fetch stream events:", error);
        setStreamEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleWatchLive = (event: StreamEvent) => {
    if (event.streamUrl) {
      setSelectedEvent(event);
      setShowEventVideo(true);
    } else {
      // Default to home page where livestream is
      window.location.href = "/";
    }
  };

  const embedUrl = selectedEvent?.streamUrl ? getEmbedUrl(selectedEvent.streamUrl) : null;

  return (
    <div className="w-full min-h-screen bg-[#FFF5E6]">
      {/* Banner Section with Multiple Events */}
      {streamEvents.length > 0 && (
        <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
          {/* Show first active event as banner */}
          <div className="relative w-full h-full">
            {streamEvents[0].imageUrl ? (
              <img
                src={streamEvents[0].imageUrl}
                alt={streamEvents[0].name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#54037C] via-[#6f3aa6] to-[#8A4EBF]" />
            )}
            
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40"></div>

            {/* Content at Bottom Left */}
            <div className="absolute bottom-0 left-0 p-6 md:p-8 lg:p-12 text-white">
              {/* UPCOMING STREAM with Date */}
              <div className="mb-4">
                <p className="text-sm md:text-base font-medium uppercase tracking-wider">
                  {streamEvents[0].date 
                    ? `UPCOMING STREAM ${formatDate(streamEvents[0].date)}`
                    : "UPCOMING STREAM"}
                </p>
              </div>

              {/* Main Stream Name - Smaller Text */}
              <div className="mb-6">
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight max-w-3xl">
                  {streamEvents[0].name}
                </h1>
              </div>

              {/* Watch Live Button */}
              <button
                onClick={() => handleWatchLive(streamEvents[0])}
                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-sm md:text-base transition-all duration-300 shadow-md hover:shadow-lg"
              >
                WATCH LIVE
                <ArrowUpRight size={18} className="inline" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Event Section with Video Player */}
      {streamEvents.length > 0 && (
        <section className="relative w-full min-h-[90vh] px-4 md:px-10 pt-10 pb-10 bg-white flex flex-col lg:flex-row lg:items-start gap-6">
          {/* LEFT SIDE - Video Player */}
          <div
            className={`flex-1 relative flex justify-center bg-transparent rounded-3xl z-20 ${
              isMobile && showEventVideo ? "sticky top-[88px]" : "static"
            }`}
          >
            <div
              className={`w-full rounded-3xl shadow-lg overflow-hidden relative ${
                showEventVideo
                  ? isMobile
                    ? "h-[240px]"
                    : "aspect-video"
                  : isMobile
                  ? "h-[18rem]"
                  : "h-[34rem]"
              }`}
            >
              <AnimatePresence mode="wait">
                {!showEventVideo ? (
                  <motion.div
                    key="poster"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0"
                  >
                    {selectedEvent?.imageUrl || streamEvents[0]?.imageUrl ? (
                      <img
                        src={selectedEvent?.imageUrl || streamEvents[0]?.imageUrl}
                        alt={selectedEvent?.name || streamEvents[0]?.name}
                        className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                      />
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#54037C] via-[#6f3aa6] to-[#8A4EBF] rounded-3xl" />
                    )}
                    <div className="absolute inset-0 bg-black/45 rounded-3xl" />

                    <div className="absolute bottom-6 left-6 text-white z-10 max-w-md">
                      <h1
                        className={`${
                          isMobile ? "text-2xl sm:text-3xl" : "text-4xl md:text-5xl"
                        } font-bold leading-tight mb-2 sm:mb-3`}
                      >
                        {selectedEvent?.name || streamEvents[0]?.name || "EVENT"}
                      </h1>

                      <p
                        className={`${
                          isMobile ? "text-xs sm:text-sm" : "text-base md:text-lg"
                        } opacity-90 mb-3 sm:mb-4`}
                      >
                        {selectedEvent?.description || streamEvents[0]?.description || "Click to watch the event"}
                      </p>

                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (!selectedEvent && streamEvents[0]) {
                            setSelectedEvent(streamEvents[0]);
                          }
                          setShowEventVideo(true);
                        }}
                        className="bg-[#54037C]/70 hover:bg-purple-800 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
                      >
                        Watch Event →
                      </motion.button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="video-player"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0 rounded-3xl overflow-hidden bg-black"
                  >
                    {embedUrl ? (
                      <iframe
                        ref={iframeRef}
                        src={embedUrl}
                        className="w-full h-full rounded-3xl"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title={selectedEvent?.name || "Event Video"}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <p>Video URL not available</p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setShowEventVideo(false);
                      }}
                      className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 z-10"
                    >
                      Close
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {/* Event Title Below Video Player */}
            {selectedEvent && (
              <div className="mt-4 text-center">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                  {selectedEvent.name}
                </h2>
              </div>
            )}
          </div>

          {/* RIGHT SIDE (TABS + CONTENT) */}
          <div className="w-full lg:w-[35%] flex justify-center">
            <div
              className="w-full max-w-sm rounded-xl overflow-hidden flex flex-col"
              style={{
                height: isMobile
                  ? `calc(100vh - ${72 + 24}px)`
                  : "34rem",
              }}
            >
              {/* Tabs */}
              <div className="flex justify-center gap-3 py-3">
                <div className="px-1 py-1 rounded-full bg-black/5">
                  <button
                    onClick={() => setActiveTab("songs")}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      activeTab === "songs"
                        ? "bg-[#54037C]/70 text-white"
                        : "text-black/60"
                    }`}
                  >
                    SONGS
                  </button>

                  <button
                    onClick={() => setActiveTab("livechat")}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                      activeTab === "livechat"
                        ? "bg-[#54037C]/70 text-white"
                        : "text-black/60"
                    }`}
                  >
                    LIVECHAT
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <Suspense
                  fallback={
                    <div className="h-full flex items-center justify-center text-sm text-black/60">
                      Loading {activeTab === "songs" ? "songs" : "live chat"}…
                    </div>
                  }
                >
                  {activeTab === "songs" ? <SongList /> : <LiveChat />}
                </Suspense>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Additional Content Section */}
      {streamEvents.length > 0 && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          {streamEvents.map((event) => (
            <div key={event.id} className="mb-8">
              {event.description && (
                <div className="text-center text-gray-700 text-lg mb-4">
                  <p>{event.description}</p>
                </div>
              )}
              {event.date && (
                <div className="text-center text-gray-600">
                  <p>Date: {new Date(event.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && streamEvents.length === 0 && (
        <div className="w-full min-h-screen bg-[#FFF5E6] flex items-center justify-center">
          <p className="text-gray-600">Loading events...</p>
        </div>
      )}

      {!loading && streamEvents.length === 0 && (
        <div className="w-full min-h-screen bg-[#FFF5E6] flex items-center justify-center">
          <p className="text-gray-600">No upcoming events</p>
        </div>
      )}
    </div>
  );
}
