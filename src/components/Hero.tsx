import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SongList from "./SongList";
import LiveChat from "./LiveChat";

const NAV_HEIGHT = 72;

export default function HeroSection() {
  const [showLiveVideo, setShowLiveVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("songs");
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const videoJsModuleRef = useRef<any>(null);

  const loadVideoJs = useCallback(async () => {
    if (!videoJsModuleRef.current) {
      const module = await import("video.js");
      await import("video.js/dist/video-js.css");
      videoJsModuleRef.current = module.default ?? module;
    }
    return videoJsModuleRef.current;
  }, []);

  // ✅ Resize listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Initialize Video.js player lazily
  const initializePlayer = useCallback(async (element: HTMLVideoElement) => {
    if (playerRef.current) {
      console.log("[HeroSection] Player already exists, skipping initialization");
      return;
    }

    console.log("[HeroSection] Initializing Video.js player");

    try {
      const streamSrc = "https://vcpout-ams01.internetmultimediaonline.org/lmampraise/stream1/playlist.m3u8";

      console.log("[HeroSection] Creating Video.js player with source:", streamSrc);

      const videojs = await loadVideoJs();

      playerRef.current = videojs(element, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        preload: "auto",
        muted: isMuted,
        liveui: true,
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
      }, () => {
        console.log("[HeroSection] Video.js player ready");

        // Ensure player fills container
        const playerEl = playerRef.current?.el();
        if (playerEl) {
          playerEl.style.width = "100%";
          playerEl.style.height = "100%";
          playerEl.classList.add("vjs-fill");
        }

        // Try to play
        playerRef.current.play().catch((err: Error) => {
          console.error("[HeroSection] Autoplay failed (user interaction may be required):", err);
          setAutoplayBlocked(true);
        });
      });

      // Error handling
      playerRef.current.on("error", () => {
        const error = playerRef.current?.error();
        console.error("[HeroSection] Video.js error:", error);
        if (error) {
          console.error("[HeroSection] Error code:", error.code);
          console.error("[HeroSection] Error message:", error.message);
        }
      });

      playerRef.current.on("loadstart", () => {
        console.log("[HeroSection] Load started");
      });

      playerRef.current.on("loadedmetadata", () => {
        console.log("[HeroSection] Metadata loaded");
      });

      playerRef.current.on("canplay", () => {
        console.log("[HeroSection] Can play");
      });

      playerRef.current.on("playing", () => {
        console.log("[HeroSection] Playing");
        setAutoplayBlocked(false);
      });

      playerRef.current.on("waiting", () => {
        console.log("[HeroSection] Waiting for data");
      });
    } catch (err) {
      console.error("[HeroSection] Failed to initialize Video.js:", err);
    }
  }, [loadVideoJs, isMuted]);

  // ✅ Callback ref for video element - ensures it's ready when mounted
  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    console.log("[HeroSection] Video element ref:", element ? "mounted" : "unmounted");
    
    // If element is being unmounted, dispose player
    if (!element) {
      if (playerRef.current) {
        try {
          console.log("[HeroSection] Disposing player on unmount");
          playerRef.current.dispose();
          playerRef.current = null;
        } catch (err) {
          console.error("[HeroSection] Error disposing player:", err);
        }
      }
      videoRef.current = null;
      return;
    }

    videoRef.current = element;

    // Initialize if showLiveVideo is true
    if (showLiveVideo && !playerRef.current) {
      // Small delay to ensure element is fully ready
      setTimeout(() => {
        if (videoRef.current && !playerRef.current && showLiveVideo) {
          initializePlayer(element).catch((err) =>
            console.error("[HeroSection] Error initializing player in ref callback:", err)
          );
        }
      }, 150);
    }
  }, [showLiveVideo, initializePlayer]);

  // ✅ Initialize player if video element is already mounted when showLiveVideo becomes true
  useEffect(() => {
    if (!showLiveVideo) return;

    // Retry mechanism in case element isn't ready yet
    let retries = 0;
    const maxRetries = 10;
    
    const tryInitialize = () => {
      if (videoRef.current && !playerRef.current) {
        console.log("[HeroSection] Video element found, initializing player via useEffect");
        initializePlayer(videoRef.current).catch((err) =>
          console.error("[HeroSection] Error initializing player in effect:", err)
        );
      } else if (retries < maxRetries) {
        retries++;
        setTimeout(tryInitialize, 100);
      }
    };

    // Start trying after a small delay
    const timer = setTimeout(tryInitialize, 200);
    
    return () => clearTimeout(timer);
  }, [showLiveVideo, initializePlayer]);

  // ✅ Cleanup when hiding video
  useEffect(() => {
    if (!showLiveVideo && playerRef.current) {
      console.log("[HeroSection] Cleaning up player (video hidden)");
      try {
        playerRef.current.dispose();
        playerRef.current = null;
      } catch (err) {
        console.error("[HeroSection] Error disposing player:", err);
      }
    }
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
          <div
            className={`w-full rounded-3xl shadow-lg overflow-hidden relative ${
              showLiveVideo
                ? isMobile
                  ? "h-[240px]"
                  : "aspect-video"
                : isMobile
                ? "h-[18rem]"
                : "h-[34rem]"
            }`}
          >
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
                    src="https://loveworldmusic.org/wp-content/uploads/2024/06/1000097946-1536x836.jpg"
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
                      onClick={() => {
                        setIsMuted(false);
                        setAutoplayBlocked(false);
                        setShowLiveVideo(true);
                      }}
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
                    ref={setVideoRef}
                    className={`video-js vjs-default-skin w-full h-full rounded-3xl ${
                      isMobile ? "object-cover" : ""
                    }`}
                    playsInline
                  ></video>
                  {playerRef.current && (
                    <button
                      onClick={() => {
                        const player = playerRef.current;
                        if (!player) return;
                        const nextMuted = !player.muted();
                        player.muted(nextMuted);
                        setIsMuted(nextMuted);
                      }}
                      className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg hover:bg-black/80 z-10 text-sm"
                    >
                      {isMuted ? "Unmute" : "Mute"}
                    </button>
                  )}
                  {autoplayBlocked && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 text-white z-20 px-6 text-center">
                      <p className="text-lg font-semibold">Tap to start the livestream with sound</p>
                      <button
                        onClick={() => {
                          const player = playerRef.current;
                          if (!player) return;
                          try {
                            player.muted(false);
                            setIsMuted(false);
                            player.play().then(() => setAutoplayBlocked(false)).catch((err: Error) => {
                              console.error("[HeroSection] Manual play failed:", err);
                            });
                          } catch (err) {
                            console.error("[HeroSection] Error handling manual play:", err);
                          }
                        }}
                        className="px-4 py-2 bg-[#54037C] hover:bg-[#54037C]/90 rounded-xl font-semibold shadow-lg"
                      >
                        Play with Sound
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setShowLiveVideo(false);
                      setAutoplayBlocked(false);
                    }}
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
            className="w-full max-w-sm rounded-xl overflow-hidden flex flex-col"
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