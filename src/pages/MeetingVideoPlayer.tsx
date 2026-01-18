import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Play, Pause, Volume2, VolumeX, Maximize, Minimize, Send, MessageCircle } from "lucide-react";

// Helper function to check if URL is a direct video file or needs embedding
function isDirectVideoUrl(url: string): boolean {
  if (!url) return false;
  const directVideoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv', '.m4v', '.3gp'];
  const lowerUrl = url.toLowerCase();
  return directVideoExtensions.some(ext => lowerUrl.includes(ext)) || 
         lowerUrl.startsWith('blob:') || 
         lowerUrl.startsWith('data:video/');
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
  
  // For other URLs (like KingsCloud), try to use as iframe src if it's not a direct video
  // Return null to indicate it should be handled differently
  return null;
}

interface Meeting {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  created_at?: string;
}

interface Comment {
  id: string;
  name: string;
  comment: string;
  createdAt?: string;
}

export default function MeetingVideoPlayer() {
  const { token, id } = useParams<{ token: string; id: string }>();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [allMeetings, setAllMeetings] = useState<Meeting[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState("");
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const volume = 1;
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [useIframe, setUseIframe] = useState(false);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  // Store token in state to persist across video changes
  const [storedToken, setStoredToken] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid link");
      setLoading(false);
      return;
    }

    // If token is in URL (meetings route), use it
    // Otherwise (trainings route), fetch token from API or use stored token
    if (token) {
      const authKey = `meetings_auth_${token}`;
      const authData = sessionStorage.getItem(authKey);
      // Check if auth data exists (could be "true" for old format or JSON for new format)
      let isAuth = authData === "true";
      if (!isAuth && authData) {
        try {
          const parsed = JSON.parse(authData);
          isAuth = parsed.authenticated === true;
        } catch (e) {
          // If parsing fails, treat as not authenticated
          isAuth = false;
        }
      }
      if (!isAuth) {
        navigate(`/meetings/${token}`);
        return;
      }
      setStoredToken(token);
      loadData(token);
    } else {
      // For trainings route, check if we already have a stored token
      if (storedToken) {
        const authKey = `meetings_auth_${storedToken}`;
        const authData = sessionStorage.getItem(authKey);
        let isAuth = authData === "true";
        if (!isAuth && authData) {
          try {
            const parsed = JSON.parse(authData);
            isAuth = parsed.authenticated === true;
          } catch (e) {
            isAuth = false;
          }
        }
        if (isAuth) {
          loadData(storedToken);
          return;
        }
      }
      
      // Fetch token from API for trainings route
      fetch('/api/trainings/token')
        .then(res => res.json())
        .then(data => {
          if (data.token) {
            const authKey = `meetings_auth_${data.token}`;
            const authData = sessionStorage.getItem(authKey);
            // Check if auth data exists (could be "true" for old format or JSON for new format)
            let isAuth = authData === "true";
            if (!isAuth && authData) {
              try {
                const parsed = JSON.parse(authData);
                isAuth = parsed.authenticated === true;
              } catch (e) {
                // If parsing fails, treat as not authenticated
                isAuth = false;
              }
            }
            if (!isAuth) {
              navigate('/trainings');
              return;
            }
            setStoredToken(data.token);
            loadData(data.token);
          } else {
            navigate('/trainings');
          }
        })
        .catch(() => navigate('/trainings'));
    }
  }, [id, navigate]); // Removed token from dependencies to prevent re-checking on video change

  // Reload data when id changes (user clicked another video)
  useEffect(() => {
    if (!id) return;
    
    // Reset iframe state when video changes
    setUseIframe(false);
    setEmbedUrl(null);
    
    // If we have a stored token, use it directly
    if (storedToken) {
      loadData(storedToken);
      return;
    }
    
    // For trainings route without token in URL, check sessionStorage for existing auth
    if (!token) {
      // Try to find any existing auth token in sessionStorage
      let foundToken: string | null = null;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('meetings_auth_')) {
          const authData = sessionStorage.getItem(key);
          let isAuth = authData === "true";
          if (!isAuth && authData) {
            try {
              const parsed = JSON.parse(authData);
              isAuth = parsed.authenticated === true;
            } catch (e) {
              isAuth = false;
            }
          }
          if (isAuth) {
            foundToken = key.replace('meetings_auth_', '');
            break;
          }
        }
      }
      
      if (foundToken) {
        setStoredToken(foundToken);
        loadData(foundToken);
      } else {
        // If no auth found, fetch token and check auth
        fetch('/api/trainings/token')
          .then(res => res.json())
          .then(data => {
            if (data.token) {
              const authKey = `meetings_auth_${data.token}`;
              const authData = sessionStorage.getItem(authKey);
              let isAuth = authData === "true";
              if (!isAuth && authData) {
                try {
                  const parsed = JSON.parse(authData);
                  isAuth = parsed.authenticated === true;
                } catch (e) {
                  isAuth = false;
                }
              }
              if (isAuth) {
                setStoredToken(data.token);
                loadData(data.token);
              } else {
                navigate('/trainings');
              }
            } else {
              navigate('/trainings');
            }
          })
          .catch(() => navigate('/trainings'));
      }
    }
  }, [id]); // Only depend on id to reload when video changes

  const loadData = async (tokenValue: string) => {
    if (!tokenValue) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trainings/public/${tokenValue}`);
      if (!res.ok) {
        throw new Error("Failed to load meetings");
      }
      const data = await res.json();
      setAllMeetings(data.videos || []);
      const found = data.videos?.find((m: Meeting) => m.id === id);
      if (!found) {
        throw new Error("Meeting not found");
      }
      setMeeting(found);
      
      // Check if video URL needs iframe embedding
      if (found.video_url) {
        const isDirect = isDirectVideoUrl(found.video_url);
        if (!isDirect) {
          const embed = getEmbedUrl(found.video_url);
          if (embed) {
            setEmbedUrl(embed);
            setUseIframe(true);
          } else {
            // For other URLs (like KingsCloud), try using as iframe src directly
            setEmbedUrl(found.video_url);
            setUseIframe(true);
          }
        } else {
          setUseIframe(false);
          setEmbedUrl(null);
        }
      }
      
      loadComments();
    } catch (e: any) {
      setError(e?.message || "Failed to load meeting");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/comments/meeting/${id}`);
      if (res.ok) {
        const data = await res.json();
        setComments(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      // Comments are optional, fail silently
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !commentName.trim() || !commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/comments/meeting/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: commentName.trim(), comment: commentText.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit comment");
      const created: Comment = await res.json();
      setComments((prev) => [created, ...prev]);
      setCommentName("");
      setCommentText("");
    } catch (err) {
      // Handle error silently or show a message
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const handlePlay = () => {
      setIsPlaying(true);
      // Ensure video is unmuted when playing
      if (video.muted && !isMuted) {
        video.muted = false;
      }
      // Ensure volume is set
      if (video.volume === 0) {
        video.volume = 1;
      }
    };
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      // Set volume and unmute when metadata loads
      video.volume = 1;
      // Force unmute if not explicitly muted by user
      if (!isMuted) {
        video.muted = false;
      } else {
        video.muted = true;
      }
    };

    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [meeting, isMuted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      // Ensure video is unmuted before playing
      if (video.muted && !isMuted) {
        video.muted = false;
      }
      // Ensure volume is set
      if (video.volume === 0) {
        video.volume = 1;
      }
      video.play().catch((err) => {
        console.error("Play failed:", err);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const otherVideos = allMeetings.filter((m) => m.id !== id).slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-[#54037C] text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-red-600 text-xl">{error || "Meeting not found"}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      {/* Top Navigation with Back Button - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#54037C]/70 backdrop-blur-sm border-b border-[#54037C]/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <button
            onClick={() => {
              // Always go back to trainings page
              navigate('/trainings');
            }}
            className="flex items-center gap-2 text-white hover:text-purple-200 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Player */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <div
              className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-lg"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => {
                if (isPlaying) {
                  setTimeout(() => setShowControls(false), 1000);
                }
              }}
            >
              {useIframe && embedUrl ? (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ border: 'none' }}
                />
              ) : (
                <video
                  ref={videoRef}
                  src={meeting.video_url}
                  className="w-full h-full object-contain"
                  poster={meeting.thumbnail_url}
                  onClick={togglePlay}
                  controls={false}
                  preload="metadata"
                />
              )}

              {/* Controls Overlay - Only show for direct video, not iframe */}
              {!useIframe && (
                <div
                  className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
                    showControls ? "opacity-100" : "opacity-0"
                  }`}
                >
                {/* Bottom Controls */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  {/* Progress Bar */}
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={togglePlay}
                      className="text-white hover:text-purple-300 transition"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, white 0%, white ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`,
                        }}
                      />
                      <style>{`
                        input[type="range"]::-webkit-slider-thumb {
                          appearance: none;
                          width: 12px;
                          height: 12px;
                          background: white;
                          border-radius: 50%;
                          cursor: pointer;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        }
                        input[type="range"]::-moz-range-thumb {
                          width: 12px;
                          height: 12px;
                          background: white;
                          border-radius: 50%;
                          cursor: pointer;
                          border: none;
                          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                        }
                      `}</style>
                    </div>
                    <span className="text-white text-xs font-mono min-w-[80px] text-right">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="text-white hover:text-purple-300 transition"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5" />
                      ) : (
                        <Volume2 className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={toggleFullscreen}
                      className="text-white hover:text-purple-300 transition"
                    >
                      {isFullscreen ? (
                        <Minimize className="w-5 h-5" />
                      ) : (
                        <Maximize className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* Video Title and Uploader Info */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
              {/* Uploader Info */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/logo.png"
                  alt="Pastor Chris Live Unending Praise"
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#54037C]"
                />
                <div>
                  <h3 className="text-sm font-semibold text-[#54037C]">Pastor Chris Live Unending Praise</h3>
                </div>
              </div>

              {/* Video Title */}
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">{meeting.title}</h1>
            </div>
          </div>

          {/* Right Column - Comments and Other Videos */}
          <div className="space-y-6">
            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                <MessageCircle className="w-5 h-5 text-[#54037C]" />
                <h2 className="text-lg font-semibold text-[#54037C]">Comments</h2>
                <span className="text-gray-600 text-sm">({comments.length})</span>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto mb-4 pr-2">
                {comments.length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first to comment!</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#54037C] flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {comment.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-800">{comment.comment}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <input
                  type="text"
                  value={commentName}
                  onChange={(e) => setCommentName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#54037C]"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="flex-1 px-3 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#54037C]"
                  />
                  <button
                    type="submit"
                    disabled={submittingComment || !commentName.trim() || !commentText.trim()}
                    className="p-2 bg-[#54037C] hover:bg-[#8A4EBF] text-white rounded-full transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Other Videos Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-purple-200">
              <h2 className="text-lg font-semibold text-[#54037C] mb-4">Other videos</h2>
              <div className="space-y-4">
                {otherVideos.length === 0 ? (
                  <p className="text-sm text-gray-500">No other videos available</p>
                ) : (
                  otherVideos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => {
                        if (token) {
                          navigate(`/meetings/${token}/video/${video.id}`);
                        } else if (storedToken) {
                          navigate(`/trainings/video/${video.id}`);
                        }
                      }}
                      className="flex gap-3 cursor-pointer hover:bg-purple-50 p-2 rounded-lg transition"
                    >
                      <div className="relative w-32 h-20 bg-black rounded-lg overflow-hidden flex-shrink-0">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100">
                            <Play className="w-6 h-6 text-[#54037C]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-800 line-clamp-2">
                          {video.title}
                        </h3>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
