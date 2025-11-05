import { useState, useEffect, useRef } from "react";
import Hls from "hls.js";
import { motion, AnimatePresence } from "framer-motion";
import SongList from "./SongList";
import LiveChat from "./LiveChat";

const NAV_HEIGHT = 72;

export default function HeroSection() {
  const [showLiveVideo, setShowLiveVideo] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"songs" | "livechat">("songs");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ HLS Playback Handler
  useEffect(() => {
    const video = videoRef.current;
    const stream = "https://vcpout-ams01.internetmultimediaonline.org/lmampraise/stream1/playlist.m3u8";

    if (!showLiveVideo) {
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      return;
    }

    if (!video) return () => {};

    // ✅ Native support (Safari / iOS)
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = stream;
      video.play().catch(() => {});
      return;
    }

    // ✅ Hls.js fallback for Chrome, Android & desktop browsers
    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });

      hls.loadSource(stream);
      hls.attachMedia(video);
      hlsRef.current = hls;

      hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
        console.error("HLS Error:", data);
      });

      return () => {
        try {
          hls.destroy();
        } catch {}
        if (video) {
          try {
            video.pause();
            video.removeAttribute("src");
            video.load();
          } catch {}
        }
      };
    }

    // ✅ Very old browser fallback
    video.src = stream;
    return () => {
      try {
        if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
        }
      } catch {}
    };
  }, [showLiveVideo]);

  return (
    <>
      <section
        id="home"
        className="relative w-full min-h-[90vh] px-4 md:px-10 pt-27 pb-10 bg-white
                 flex flex-col lg:flex-row lg:items-start gap-6"
      >
        {/* LEFT SIDE */}
        <div
          className={`flex-1 relative flex justify-center bg-transparent rounded-3xl z-20 ${
            isMobile && showLiveVideo ? "sticky top-[88px]" : "static"
          }`}
        >
          <div className="w-full h-[18rem] md:h-[34rem] rounded-3xl shadow-lg overflow-hidden relative">
            <AnimatePresence mode="wait">
              {!showLiveVideo ? (
                <motion.div
                  key="poster"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  <img
                    src="/images/hero-bg.jpg"
                    alt="Unending Praise"
                    className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                  />
                  <div className="absolute inset-0 bg-black/45 rounded-3xl" />

                  <div className="absolute bottom-6 left-6 text-white z-10 max-w-md">
                    <h1
                      className={`${
                        isMobile ? "text-2xl sm:text-3xl" : "text-4xl md:text-5xl"
                      } font-bold leading-tight mb-2 sm:mb-3`}
                    >
                      UNENDING PRAISE
                    </h1>

                    <p
                      className={`${
                        isMobile ? "text-xs sm:text-sm" : "text-base md:text-lg"
                      } opacity-90 mb-3 sm:mb-4`}
                    >
                      Join the 24-hour live stream, everyday till the coming of our Lord.
                    </p>

                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowLiveVideo(true)}
                      className=" bg-[#54037C]/70 hover:bg-purple-800 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
                    >
                      Watch Live →
                    </motion.button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="hls"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 rounded-3xl overflow-hidden"
                >
                  <video
                    ref={videoRef}
                    className="w-full h-full rounded-3xl bg-black"
                    controls
                    autoPlay
                    playsInline
                    muted
                  />

                  <button
                    onClick={() => setShowLiveVideo(false)}
                    className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT SIDE (TABS + CONTENT) */}
        <div className="w-full lg:w-[35%] flex justify-center">
          <div
            className="w-full max-w-sm rounded-xl overflow-hidden bg-white shadow-md flex flex-col"
            style={{
              height: isMobile
                ? `calc(100vh - ${NAV_HEIGHT + 24}px)`
                : "34rem",
            }}
          >
            {/* Centered Tabs */}
            <div className="flex justify-center gap-3 py-3 ">
              <div className="px-1 py-1 rounded-full bg-black/5">
                <button
                  onClick={() => setActiveTab("songs")}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    activeTab === "songs"
                      ? " bg-[#54037C]/70 text-white"
                      : "text-black/60"
                  }`}
                >
                  SONGS
                </button>

                <button
                  onClick={() => setActiveTab("livechat")}
                  className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                    activeTab === "livechat"
                      ? " bg-[#54037C]/70 text-white"
                      : "text-black/60"
                  }`}
                >
                  LIVECHAT
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {activeTab === "songs" ? <SongList /> : <LiveChat />}
            </div>
          </div>
        </div>
      </section>

      {/* Divider Animation */}
      <motion.div
        className="h-[2px] bg-black/30 rounded-full w-[88%] mx-auto mt-6"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.2, ease: "easeInOut" }}
        style={{ transformOrigin: "center" }}
      />
    </>
  );
}
