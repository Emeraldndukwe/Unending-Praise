import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";

const STREAM_URL =
  "https://vcpout-ams01.internetmultimediaonline.org/lmampraise/stream1/playlist.m3u8";
const getShareUrl = () => `${window.location.origin}/api/hls/playlist.m3u8`;

const SongList = lazy(() => import("./SongList"));
const LiveChat = lazy(() => import("./LiveChat"));

const NAV_HEIGHT = 72;

function isSafariBrowser() {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export default function HeroSection() {
  const [showLiveVideo, setShowLiveVideo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState("songs");
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerRef = useRef<any>(null);
  const videoJsModuleRef = useRef<any>(null);
  const wantsSoundRef = useRef(false);

  const enableSound = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;
    player.muted(false);
    player.volume(1);
    setIsMuted(false);
    setAutoplayBlocked(false);
    wantsSoundRef.current = false;
    player.play()?.catch((err: Error) => {
      console.error("[HeroSection] Enable sound failed:", err);
    });
  }, []);

  const loadVideoJs = useCallback(async () => {
    if (!videoJsModuleRef.current) {
      const module = await import("video.js");
      await import("video.js/dist/video-js.css");
      videoJsModuleRef.current = module.default ?? module;
    }
    return videoJsModuleRef.current;
  }, []);

  useEffect(() => {
    loadVideoJs().catch(() => undefined);
  }, [loadVideoJs]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const disposePlayer = useCallback(() => {
    setPlayerReady(false);
    if (playerRef.current) {
      try {
        if (!playerRef.current.isDisposed()) {
          playerRef.current.dispose();
        }
      } catch (err) {
        console.error("[HeroSection] Error disposing player:", err);
      }
      playerRef.current = null;
    }
    const element = videoRef.current;
    if (element && videoJsModuleRef.current) {
      try {
        const existing = videoJsModuleRef.current.getPlayer(element);
        if (existing && !existing.isDisposed()) {
          existing.dispose();
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const initializePlayer = useCallback(async (element: HTMLVideoElement) => {
    if (playerRef.current) return;

    try {
      const videojs = await loadVideoJs();
      const existing = videojs.getPlayer(element);
      if (existing && !existing.isDisposed()) {
        existing.dispose();
      }

      const isSafari = isSafariBrowser();
      const tryWithSound = wantsSoundRef.current;

      const player = videojs(
        element,
        {
          autoplay: true,
          controls: true,
          responsive: true,
          fluid: true,
          preload: "auto",
          // Start muted so autoplay always works; unmute after or via user tap
          muted: true,
          liveui: true,
          html5: {
            vhs: {
              withCredentials: false,
              // Chrome/Firefox need VHS; Safari can use native HLS
              overrideNative: !isSafari,
            },
          },
          sources: [
            {
              src: STREAM_URL,
              type: "application/x-mpegURL",
            },
          ],
        },
        () => {
          setPlayerReady(true);
          const playerEl = player.el() as HTMLElement;
          playerEl.style.width = "100%";
          playerEl.style.height = "100%";

          const startPlayback = () => {
            if (tryWithSound) {
              player.muted(false);
              player.volume(1);
            }
            player
              .play()
              .then(() => {
                if (player.muted()) {
                  setIsMuted(true);
                } else {
                  setIsMuted(false);
                  wantsSoundRef.current = false;
                }
                setAutoplayBlocked(false);
              })
              .catch(() => {
                player.muted(true);
                setIsMuted(true);
                player
                  .play()
                  .then(() => setAutoplayBlocked(false))
                  .catch(() => setAutoplayBlocked(true));
              });
          };

          startPlayback();
        }
      );

      player.on("error", () => {
        console.error("[HeroSection] Video.js error:", player.error());
      });

      player.on("volumechange", () => {
        setIsMuted(player.muted());
      });

      player.on("playing", () => {
        setAutoplayBlocked(false);
        if (player.muted()) {
          setIsMuted(true);
        }
      });

      playerRef.current = player;
    } catch (err) {
      console.error("[HeroSection] Failed to initialize Video.js:", err);
    }
  }, [loadVideoJs]);

  const setVideoRef = useCallback((element: HTMLVideoElement | null) => {
    videoRef.current = element;
  }, []);

  useEffect(() => {
    if (!showLiveVideo) {
      disposePlayer();
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const tryInit = () => {
      if (cancelled) return;
      const el = videoRef.current;
      if (el && !playerRef.current) {
        void initializePlayer(el);
        return;
      }
      if (attempts < 20) {
        attempts += 1;
        window.setTimeout(tryInit, 100);
      }
    };

    tryInit();

    return () => {
      cancelled = true;
    };
  }, [showLiveVideo, initializePlayer, disposePlayer]);

  useEffect(() => () => disposePlayer(), [disposePlayer]);

  return (
    <>
      <section
        id="home"
        className="relative w-full min-h-[90vh] px-4 md:px-10 pt-27 pb-10 bg-white
                   flex flex-col lg:flex-row lg:items-start gap-6"
      >
        <div className="flex-1 relative flex justify-center bg-transparent rounded-3xl z-10">
          <div
            className={`w-full rounded-3xl shadow-lg overflow-hidden relative ${
              showLiveVideo
                ? isMobile
                  ? "h-[240px]"
                  : "h-[34rem]"
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
                    srcSet="
                      https://loveworldmusic.org/wp-content/uploads/2024/06/1000097946-768x418.jpg 768w,
                      https://loveworldmusic.org/wp-content/uploads/2024/06/1000097946-1024x558.jpg 1024w,
                      https://loveworldmusic.org/wp-content/uploads/2024/06/1000097946-1536x836.jpg 1536w
                    "
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 75vw, 50vw"
                    width={1536}
                    height={836}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    alt="Unending Praise livestream poster featuring worshippers"
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
                      onMouseEnter={() => {
                        loadVideoJs().catch(() => undefined);
                      }}
                      onFocus={() => {
                        loadVideoJs().catch(() => undefined);
                      }}
                      onClick={() => {
                        wantsSoundRef.current = true;
                        setIsMuted(false);
                        setAutoplayBlocked(false);
                        loadVideoJs().catch(() => undefined);
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
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0 rounded-3xl overflow-hidden bg-black"
                >
                  <div className="relative w-full h-full">
                    <video
                      ref={setVideoRef}
                      className="video-js vjs-default-skin vjs-fill w-full h-full rounded-3xl"
                      playsInline
                    />

                    <div className="absolute inset-0 z-30 pointer-events-none">
                      {playerReady && (
                        <button
                          type="button"
                          onClick={() => {
                            const player = playerRef.current;
                            if (!player) return;
                            const nextMuted = !player.muted();
                            player.muted(nextMuted);
                            setIsMuted(nextMuted);
                          }}
                          className="pointer-events-auto absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-lg hover:bg-black/80 text-sm"
                        >
                          {isMuted ? "Unmute" : "Mute"}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowLiveVideo(false);
                          setAutoplayBlocked(false);
                        }}
                        className="pointer-events-auto absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700"
                      >
                        Close
                      </button>

                      {autoplayBlocked && (
                        <div className="pointer-events-auto absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 text-white px-6 text-center">
                          <p className="text-lg font-semibold">Tap to start the livestream</p>
                          <button
                            type="button"
                            onClick={enableSound}
                            className="px-4 py-2 bg-[#54037C] hover:bg-[#54037C]/90 rounded-xl font-semibold shadow-lg"
                          >
                            Play with Sound
                          </button>
                        </div>
                      )}

                      {playerReady && isMuted && !autoplayBlocked && (
                        <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
                          <button
                            type="button"
                            onClick={enableSound}
                            className="flex items-center gap-2 rounded-full bg-[#54037C] px-5 py-2.5 text-sm font-semibold text-white shadow-lg ring-2 ring-white/30 hover:bg-[#54037C]/90 animate-pulse"
                          >
                            <span aria-hidden>🔊</span>
                            Turn on sound
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {showLiveVideo && (
            <div className="flex justify-center mt-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getShareUrl());
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition ${
                  copied
                    ? "bg-green-600 text-white"
                    : "bg-black/5 text-black/60 hover:bg-black/10"
                }`}
              >
                {copied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                )}
                {copied ? "Link Copied!" : "Copy Link"}
              </button>
            </div>
          )}
        </div>

        <div className="w-full lg:w-[35%] flex justify-center">
          <div
            className="w-full max-w-sm rounded-xl overflow-hidden flex flex-col"
            style={{
              height: isMobile
                ? `calc(100vh - ${NAV_HEIGHT + 24}px)`
                : "34rem",
            }}
          >
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
