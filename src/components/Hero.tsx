import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SongList from "./SongList";
import LiveChat from "./LiveChat";

const NAV_HEIGHT = 72;

export default function HeroSection() {
  const [showLiveVideo, setShowLiveVideo] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"songs" | "livechat">("songs");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoError, setVideoError] = useState<string | null>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize HLS playback when the live video is shown
  useEffect(() => {
    if (!showLiveVideo) {
      const video = videoRef.current;
      if (video) {
        try {
          video.pause();
          video.removeAttribute("src");
          video.load();
        } catch {}
      }
      setVideoError(null);
      return;
    }

    const src = "https://vcpout-ams01.internetmultimediaonline.org/lmampraise/stream1/playlist.m3u8";
    const video = videoRef.current;
    if (!video) return;

    const log = (label: string, ...args: any[]) => {
      // eslint-disable-next-line no-console
      console.log(`[HLS] ${label}`, ...args);
    };

    // Attach common video element event logs
    const onVideoError = () => {
      const mediaError = video.error;
      if (mediaError) {
        const codeMap: Record<number, string> = {
          1: "MEDIA_ERR_ABORTED",
          2: "MEDIA_ERR_NETWORK",
          3: "MEDIA_ERR_DECODE",
          4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
        };
        log("video.error", { code: mediaError.code, name: codeMap[mediaError.code] || "UNKNOWN" });
        if (mediaError.code === 2) setVideoError("Network error fetching video — possible CORS issue.");
        if (mediaError.code === 4) setVideoError("Source not supported — check stream format.");
      } else {
        log("video.error", "Unknown error");
      }
    };
    const videoEventHandlers: Array<[keyof HTMLMediaElementEventMap, EventListener]> = [
      ["loadedmetadata", () => log("video.loadedmetadata")],
      ["loadeddata", () => log("video.loadeddata")],
      ["canplay", () => log("video.canplay")],
      ["playing", () => log("video.playing")],
      ["pause", () => log("video.pause")],
      ["stalled", () => log("video.stalled")],
      ["waiting", () => log("video.waiting")],
      ["progress", () => log("video.progress", video.buffered?.length ? video.buffered.end(0) : 0)],
      ["error", onVideoError],
    ];
    videoEventHandlers.forEach(([evt, handler]) => video.addEventListener(evt, handler));
    log("init", { src });

    // Native HLS on Safari/iOS
    if (video.canPlayType("application/vnd.apple.mpegURL")) {
      log("native-hls: supported");
      video.src = src;
      video.play().catch(() => {
        setVideoError("Autoplay blocked — press play to start.");
        log("native-hls: autoplay blocked");
      });
      return;
    }

    let hlsInstance: any;
    let cancelled = false;

    import("hls.js")
      .then(({ default: Hls }) => {
        if (cancelled) return;
        if (Hls.isSupported()) {
          log("hls.js: supported");
          hlsInstance = new Hls({ enableWorker: true });
          hlsInstance.attachMedia(video);
          hlsInstance.loadSource(src);
          const tryPlay = () => {
            video.play().catch(() => {
              setVideoError("Autoplay blocked — press play to start.");
              log("hls.js: autoplay blocked");
            });
          };
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, (_e: any, data: any) => {
            log("hls.js: manifest parsed", data?.levels?.map((l: any) => l?.height));
            tryPlay();
          });
          hlsInstance.on(Hls.Events.LEVEL_LOADED, (_e: any, data: any) => {
            log("hls.js: level loaded", { details: data?.details?.fragments?.length });
            tryPlay();
          });
          hlsInstance.on(Hls.Events.ERROR, (_e: any, data: any) => {
            log("hls.js: error", data);
            // Surface meaningful network/cors/media errors to the UI
            if (data?.fatal) {
              if (data.type === "networkError") {
                setVideoError("Network/CORS error loading stream.");
              } else if (data.type === "mediaError") {
                setVideoError("Media error — stream format not supported.");
              } else {
                setVideoError("Fatal error occurred in video playback.");
              }
            }
          });
        } else {
          log("hls.js: not supported in this browser");
        }
      })
      .catch(() => {
        // no-op; fallback already attempted
        log("hls.js: dynamic import failed");
      });

    return () => {
      cancelled = true;
      try {
        if (hlsInstance) hlsInstance.destroy();
        videoEventHandlers.forEach(([evt, handler]) => video.removeEventListener(evt, handler));
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
                  key="iframe"
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
                    muted
                    playsInline
                    crossOrigin="anonymous"
                    poster="/images/hero-bg.jpg"
                  />
                  {videoError && (
                    <div className="absolute inset-x-0 bottom-0 m-4 p-3 rounded-lg bg-black/70 text-white text-sm">
                      <p>{videoError}</p>
                      <a
                        href="https://vcpout-ams01.internetmultimediaonline.org/lmampraise/stream1/playlist.m3u8"
                        target="_blank"
                        rel="noreferrer"
                        className="underline"
                      >
                        Open stream in new tab
                      </a>
                    </div>
                  )}
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
            {/* ✅ Centered Tabs */}
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

            {/* ✅ Scrollable Content */}
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
