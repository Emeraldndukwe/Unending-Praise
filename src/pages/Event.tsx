import { useState, useEffect, useRef } from "react";
import { ArrowUpRight, Play, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { lazy, Suspense } from "react";

const LiveChat = lazy(() => import("../components/LiveChat"));

type StreamEvent = {
  id: string;
  name: string;
  streamUrl?: string;
  imageUrl?: string;
  date?: string;
  startTime?: string;
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
  const [isMobile, setIsMobile] = useState(false);
  const [showNoStreamModal, setShowNoStreamModal] = useState(false);
  const [showCountdownModal, setShowCountdownModal] = useState(false);
  const [countdownEvent, setCountdownEvent] = useState<StreamEvent | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const tvSectionRef = useRef<HTMLDivElement>(null);
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

  // Auto-rotate banner
  useEffect(() => {
    if (streamEvents.length <= 1) return;
    const interval = setInterval(() => {
      setActiveBannerIndex((prev) => (prev + 1) % streamEvents.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [streamEvents.length]);

  // Countdown timer for stream start
  useEffect(() => {
    if (!showCountdownModal || !countdownEvent) return;

    const updateCountdown = () => {
      if (!countdownEvent.date || !countdownEvent.startTime) {
        setTimeRemaining("");
        return;
      }

      const now = new Date();
      const eventDate = new Date(countdownEvent.date);
      const [hours, minutes] = countdownEvent.startTime.split(':').map(Number);
      eventDate.setHours(hours, minutes, 0, 0);

      const diff = eventDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining("");
        setShowCountdownModal(false);
        // Auto-start if time has passed
        if (countdownEvent.streamUrl) {
          setSelectedEvent(countdownEvent);
          setShowEventVideo(true);
          tvSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      let timeStr = "";
      if (days > 0) timeStr += `${days}d `;
      if (hrs > 0 || days > 0) timeStr += `${hrs}h `;
      if (mins > 0 || hrs > 0 || days > 0) timeStr += `${mins}m `;
      timeStr += `${secs}s`;

      setTimeRemaining(timeStr);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [showCountdownModal, countdownEvent]);

  // Get the current/next scheduled event (one that has a streamUrl)
  const getCurrentScheduledEvent = (): StreamEvent | null => {
    if (streamEvents.length === 0) return null;
    
    // Find the first event with a streamUrl
    const eventWithStream = streamEvents.find(event => event.streamUrl);
    return eventWithStream || null;
  };

  const handlePlayClick = () => {
    const currentEvent = getCurrentScheduledEvent();
    
    if (!currentEvent || !currentEvent.streamUrl) {
      setShowNoStreamModal(true);
      return;
    }
    
    setSelectedEvent(currentEvent);
    setShowEventVideo(true);
  };

  const handleWatchLive = (event: StreamEvent) => {
    if (!event.streamUrl) {
      setShowNoStreamModal(true);
      return;
    }

    // Check if it's the event date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (event.date) {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      
      // If it's the event date
      if (eventDate.getTime() === today.getTime()) {
        // Check if startTime is set and if current time is before start time
        if (event.startTime) {
          const [hours, minutes] = event.startTime.split(':').map(Number);
          const startDateTime = new Date(eventDate);
          startDateTime.setHours(hours, minutes, 0, 0);
          
          const now = new Date();
          
          if (now.getTime() < startDateTime.getTime()) {
            // Show countdown modal
            setCountdownEvent(event);
            setShowCountdownModal(true);
            return;
          }
        }
        
        // Time has passed or no startTime, scroll to TV section and start
        setSelectedEvent(event);
        setShowEventVideo(true);
        setTimeout(() => {
          tvSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        return;
      }
    }
    
    // Not the event date or no date, just start normally
    setSelectedEvent(event);
    setShowEventVideo(true);
    setTimeout(() => {
      tvSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const embedUrl = selectedEvent?.streamUrl ? getEmbedUrl(selectedEvent.streamUrl) : null;
  const currentScheduledEvent = getCurrentScheduledEvent();

  return (
    <div className="w-full min-h-screen bg-[#FFF5E6]">
      {/* Banner Section with Multiple Events Carousel */}
      {streamEvents.length > 0 && (
        <div className="relative w-full h-[500px] md:h-[600px] overflow-hidden">
          <AnimatePresence mode="wait">
            {streamEvents.map((event, index) => {
              if (index !== activeBannerIndex) return null;
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 w-full h-full"
                >
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#54037C] via-[#6f3aa6] to-[#8A4EBF]" />
                  )}
                  
                  {/* Dark Overlay */}
                  <div className="absolute inset-0 bg-black/40"></div>

                  {/* Content at Bottom Left */}
                  <div className="absolute bottom-0 left-0 p-6 md:p-8 lg:p-12 text-white">
                    {/* UPCOMING STREAM with Date - Smaller Text */}
                    <div className="mb-3">
                      <p className="text-xs md:text-sm font-medium uppercase tracking-wider">
                        {event.date 
                          ? `UPCOMING STREAM ${formatDate(event.date)}`
                          : "UPCOMING STREAM"}
                      </p>
                    </div>

                    {/* Main Stream Name - Larger Text */}
                    <div className="mb-6">
                      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight max-w-3xl">
                        {event.name}
                      </h1>
                    </div>

                    {/* Watch Live Button */}
                    <button
                      onClick={() => handleWatchLive(event)}
                      className="inline-flex items-center gap-2 bg-[#54037C]/70 hover:bg-[#54037C]/90 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-sm md:text-base transition-all duration-300 shadow-md hover:shadow-lg"
                    >
                      WATCH LIVE
                      <ArrowUpRight size={18} className="inline" strokeWidth={2.5} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Pagination Dots */}
          {streamEvents.length > 1 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
              {streamEvents.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveBannerIndex(index)}
                  className={`transition-all duration-300 rounded-full ${
                    index === activeBannerIndex
                      ? "bg-white w-8 h-2"
                      : "bg-white/50 w-2 h-2 hover:bg-white/75"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TV Section with Video Player */}
      <section ref={tvSectionRef} className="relative w-full px-4 md:px-10 pt-10 pb-10 bg-white">
        {/* TV Header - Centered */}
        <div className="max-w-7xl mx-auto mb-6">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">TV</h2>
        </div>

        <div className="max-w-7xl mx-auto">
          {!showEventVideo ? (
            // Initial State: Full Video Player with Play Button
            <div className="w-full">
              <div className="relative w-full aspect-video rounded-3xl shadow-lg overflow-hidden bg-black">
                {currentScheduledEvent?.imageUrl ? (
                  <img
                    src={currentScheduledEvent.imageUrl}
                    alt={currentScheduledEvent.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#54037C] via-[#6f3aa6] to-[#8A4EBF]" />
                )}
                <div className="absolute inset-0 bg-black/45"></div>
                
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePlayClick}
                    className="bg-[#54037C]/80 hover:bg-purple-800 text-white p-6 rounded-full font-semibold shadow-lg transition-all flex items-center justify-center gap-3"
                  >
                    <Play size={32} fill="white" className="ml-1" />
                    <span className="text-xl">Play</span>
                  </motion.button>
                </div>
              </div>
              
              {/* Event Title Below Video Player */}
              {currentScheduledEvent && (
                <div className="mt-6 text-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-800">
                    {currentScheduledEvent.name}
                  </h3>
                </div>
              )}
            </div>
          ) : (
            // Expanded State: Layout matching screenshot - video player (2/3) and live chat (1/3)
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* LEFT SIDE - Video Player (2/3 width) */}
              <div className="w-full lg:flex-[2] relative flex flex-col">
                <div className="w-full aspect-video rounded-3xl shadow-lg overflow-hidden relative bg-black">
                  <AnimatePresence mode="wait">
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
                  </AnimatePresence>
                </div>
                
                {/* Event Title Below Video Player */}
                {selectedEvent && (
                  <div className="mt-4">
                    <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                      {selectedEvent.name}
                    </h3>
                  </div>
                )}
              </div>

              {/* RIGHT SIDE - Live Comment (1/3 width) */}
              <div className="w-full lg:flex-1 flex justify-center">
                <div
                  className="w-full rounded-xl overflow-hidden flex flex-col bg-white"
                  style={{
                    height: isMobile
                      ? `calc(100vh - ${72 + 24}px)`
                      : "34rem",
                  }}
                >
                  {/* Scrollable Content - Full height for chat */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    <Suspense
                      fallback={
                        <div className="h-full flex items-center justify-center text-sm text-black/60">
                          Loading live comment…
                        </div>
                      }
                    >
                      <LiveChat eventId={selectedEvent?.id} />
                    </Suspense>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* No Stream Scheduled Modal */}
      <AnimatePresence>
        {showNoStreamModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowNoStreamModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">No Stream Scheduled</h3>
                <button
                  onClick={() => setShowNoStreamModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                There is no stream scheduled yet. Please check back later.
              </p>
              <button
                onClick={() => setShowNoStreamModal(false)}
                className="w-full bg-[#54037C] hover:bg-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Countdown Modal */}
      <AnimatePresence>
        {showCountdownModal && countdownEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={() => setShowCountdownModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-gray-800">Stream Starting Soon</h3>
                <button
                  onClick={() => setShowCountdownModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X size={24} />
                </button>
              </div>
              <p className="text-gray-600 mb-4">
                The stream "{countdownEvent.name}" will start in:
              </p>
              <div className="text-4xl font-bold text-[#54037C] mb-6 text-center">
                {timeRemaining || "Starting now..."}
              </div>
              {countdownEvent.date && countdownEvent.startTime && (
                <p className="text-sm text-gray-500 text-center mb-6">
                  {new Date(countdownEvent.date).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })} at {countdownEvent.startTime}
                </p>
              )}
              <button
                onClick={() => setShowCountdownModal(false)}
                className="w-full bg-[#54037C] hover:bg-purple-800 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
