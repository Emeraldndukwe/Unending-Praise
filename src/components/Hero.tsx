import { useState, useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { motion, AnimatePresence } from "framer-motion";
import SongList from "./SongList";
import LiveChat from "./LiveChat";

const NAV_HEIGHT = 72;

export default function HeroSection() {
  const [showLiveVideo, setShowLiveVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("songs");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  // ✅ Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Initialize and clean up Video.js player
  useEffect(() => {
    if (!showLiveVideo) {
      // Cleanup when hiding video
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (err) {
          console.error("[HeroSection] Error disposing player:", err);
        }
      }
      return;
    }

    // Small delay to ensure element is fully mounted by AnimatePresence
    const timer = setTimeout(() => {
      if (videoRef.current && !playerRef.current) {
        try {
          playerRef.current = videojs(videoRef.current, {
            autoplay: true,
            controls: true,
            responsive: true,
            fluid: true,
            preload: "auto",
            muted: true,
            html5: {
              vhs: {
                withCredentials: false,
                overrideNative: true,
              },
            },
            sources: [
              {
                src: "https://vcpout-ams01.internetmultimediaonline.org/lmampraise/stream1/playlist.m3u8",
                type: "application/x-mpegURL",
              },
            ],
          });

          playerRef.current.ready(() => {
            // Ensure player fills container
            const playerEl = playerRef.current?.el();
            if (playerEl) {
              playerEl.style.width = "100%";
              playerEl.style.height = "100%";
            }
          });

          playerRef.current.on("error", () => {
            console.error("[HeroSection] Video.js error:", playerRef.current?.error());
          });
        } catch (err) {
          console.error("[HeroSection] Failed to initialize Video.js:", err);
        }
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (err) {
          console.error("[HeroSection] Error disposing player:", err);
        }
      }
    };
  }, [showLiveVideo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (err) {
          console.error("[HeroSection] Error disposing player on unmount:", err);
        }
      }
    };
  }, []);

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
                  key="videojs-player"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 rounded-3xl overflow-hidden bg-black"
                >
                  <video
                    ref={videoRef}
                    className="video-js vjs-default-skin w-full h-full rounded-3xl"
                    playsInline
                    data-setup="{}"
                  ></video>

                  <button
                    onClick={() => setShowLiveVideo(false)}
                    className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 z-10"
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
            {/* Tabs */}
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