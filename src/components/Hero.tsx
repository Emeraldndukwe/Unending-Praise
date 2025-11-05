import { useState, useEffect, useRef, useCallback } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import { motion, AnimatePresence } from "framer-motion";
import SongList from "./SongList";
import LiveChat from "./LiveChat";

const NAV_HEIGHT = 72;

export default function HeroSection() {
  const [showLiveVideo, setShowLiveVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"songs" | "livechat">("songs");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);

  // Callback ref that gets called when video element is mounted/unmounted
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
    
    // If element is unmounted, dispose player
    if (!element && playerRef.current) {
      console.log("[HeroSection] Video element unmounted, disposing player");
      try {
        playerRef.current.dispose();
        playerRef.current = null;
      } catch (err) {
        console.error("[HeroSection] Error disposing player on unmount:", err);
      }
      return;
    }
    
    // If element is mounted and we want to show video, initialize player
    if (element && showLiveVideo && !playerRef.current) {
      console.log("[HeroSection] Video element mounted, initializing player");
      setIsLoading(true);
      setPlayerError(null);
      
      const streamSrc = "https://vcpout-ams01.internetmultimediaonline.org/lmampraise/stream1/playlist.m3u8";

      const playerOptions = {
        controls: true,
        autoplay: true,
        muted: true,
        preload: "auto" as const,
        // Force the player to fill its container instead of keeping aspect via fluid
        fluid: false,
        width: "100%",
        height: "100%",
        html5: {
          vhs: {
            withCredentials: false,
            overrideNative: true,
          },
        },
        sources: [
          {
            src: streamSrc,
            type: "application/x-mpegURL",
          },
        ],
      } as const;

      try {
        playerRef.current = videojs(element, playerOptions, () => {
          console.log("[HeroSection] Video.js player ready");
          setIsLoading(false);
          // Ensure wrapper fills container
          try { playerRef.current.addClass('vjs-fill'); } catch {}
          try {
            const tech = (playerRef.current.el()?.getElementsByClassName('vjs-tech')?.[0] as HTMLVideoElement | undefined);
            if (tech) {
              tech.style.width = '100%';
              tech.style.height = '100%';
              tech.style.objectFit = 'cover';
              tech.style.backgroundColor = 'black';
            }
          } catch {}

          playerRef.current.play().catch((err: Error) => {
            console.error("[HeroSection] Autoplay failed:", err);
          });

          playerRef.current.on("loadstart", () => {
            console.log("[HeroSection] Stream loadstart");
            setIsLoading(true);
            setPlayerError(null);
          });

          playerRef.current.on("waiting", () => {
            console.log("[HeroSection] Stream buffering");
            setIsLoading(true);
          });

          playerRef.current.on("canplay", () => {
            console.log("[HeroSection] Stream can play");
            setIsLoading(false);
          });

          playerRef.current.on("playing", () => {
            console.log("[HeroSection] Stream playing");
            setIsLoading(false);
            setPlayerError(null);
          });

          playerRef.current.on("error", (e: any) => {
            console.error("[HeroSection] Player error:", e);
            const errorMsg = playerRef.current.error();
            console.error("[HeroSection] Error details:", errorMsg);
            setPlayerError(
              errorMsg?.message || "Failed to load the live stream. Please check your connection or try refreshing."
            );
            setIsLoading(false);
          });

          playerRef.current.on("ended", () => {
            console.log("[HeroSection] Stream ended");
          });
        });
      } catch (err) {
        console.error("[HeroSection] Failed to initialize Video.js:", err);
        setPlayerError("Failed to initialize video player. Please refresh the page.");
        setIsLoading(false);
      }
    }
  }, [showLiveVideo]);

  // Track screen size
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup player on unmount or when hiding video
  useEffect(() => {
    return () => {
      console.log("[HeroSection] Cleaning up player on unmount");
      if (playerRef.current) {
        try {
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (err) {
          console.error("[HeroSection] Error disposing player:", err);
        }
      }
    };
  }, []);

  // Dispose player when hiding video
  useEffect(() => {
    if (!showLiveVideo && playerRef.current) {
      console.log("[HeroSection] Disposing player");
      try {
        playerRef.current.dispose();
        playerRef.current = null;
      } catch (err) {
        console.error("[HeroSection] Error disposing player:", err);
      }
      setPlayerError(null);
      setIsLoading(false);
    }
  }, [showLiveVideo]);

  const handleCloseVideo = useCallback(() => {
    console.log("[HeroSection] Closing live video");
    setShowLiveVideo(false);
  }, []);

  const handleWatchLive = useCallback(() => {
    console.log("[HeroSection] Watch Live clicked");
    setShowLiveVideo(true);
  }, []);

  return (
    <>
      <section
        id="home"
        className="relative w-full min-h-[90vh] px-4 md:px-10 pt-27 pb-10 bg-white flex flex-col lg:flex-row lg:items-start gap-6"
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
                      onClick={handleWatchLive}
                      className="bg-[#54037C]/70 hover:bg-purple-800 text-white px-6 py-3 rounded-xl font-semibold shadow-md"
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
                  className="absolute inset-0 rounded-3xl overflow-hidden relative bg-black"
                >
                  {/* Solid black background to avoid white flash */}
                  <div className="absolute inset-0 bg-black" />
                  <video
                    ref={setVideoRef}
                    className="video-js vjs-default-skin w-full h-full rounded-3xl bg-black"
                    playsInline
                    data-setup="{}"
                  />

                  {/* Loading overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="text-sm">Loading live stream...</p>
                      </div>
                    </div>
                  )}

                  {/* Error overlay */}
                  {playerError && (
                    <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
                      <div className="text-white text-center p-4 max-w-sm">
                        <h3 className="text-lg font-semibold mb-2">Stream Error</h3>
                        <p className="text-sm mb-4">{playerError}</p>
                        <button
                          onClick={() => {
                            console.log("[HeroSection] Retry stream clicked");
                            setPlayerError(null);
                            setIsLoading(true);
                            if (playerRef.current) {
                              playerRef.current.load();
                              playerRef.current.play().catch(() => {});
                            }
                          }}
                          className="bg-[#54037C]/70 hover:bg-purple-800 text-white px-4 py-2 rounded-lg font-semibold"
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Close button */}
                  <button
                    onClick={handleCloseVideo}
                    className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 z-20 transition-colors"
                    aria-label="Close live stream"
                  >
                    Close
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT SIDE */}
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

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {activeTab === "songs" ? <SongList /> : <LiveChat />}
            </div>
          </div>
        </div>
      </section>

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