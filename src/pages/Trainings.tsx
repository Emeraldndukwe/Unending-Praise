import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Video, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Meeting {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  section?: string;
  created_at?: string;
}

interface Document {
  id: string;
  title: string;
  document_url: string;
  document_type?: string;
  section?: string;
  created_at?: string;
}

interface SectionData {
  name: string;
  videos: Meeting[];
  documents: Document[];
}

export default function Trainings() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  // Check sessionStorage immediately for existing auth
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // Try to find any auth key in sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('meetings_auth_')) {
        const authData = sessionStorage.getItem(key);
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            if (parsed.authenticated === true) {
              return true;
            }
          } catch (e) {
            if (authData === "true") {
              return true;
            }
          }
        }
      }
    }
    return false;
  });
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTabs, setActiveTabs] = useState<Record<string, "video" | "document">>({});

  useEffect(() => {
    // Get the access token
    const loadToken = async () => {
      try {
        const res = await fetch("/api/trainings/token");
        if (!res.ok) {
          throw new Error("Failed to load access token");
        }
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
          // Check if already authenticated (stored in sessionStorage)
          const authKey = `meetings_auth_${data.token}`;
          const storedAuth = sessionStorage.getItem(authKey);
          
          if (storedAuth) {
            // Verify password hasn't changed since authentication
            try {
              const timestampRes = await fetch("/api/trainings/password-timestamp");
              if (timestampRes.ok) {
                const timestampData = await timestampRes.json();
                const storedTimestamp = JSON.parse(storedAuth).passwordUpdatedAt;
                
                // If password was updated after authentication, clear session
                if (timestampData.passwordUpdatedAt !== storedTimestamp) {
                  sessionStorage.removeItem(authKey);
                  setIsAuthenticated(false);
                  return;
                }
              }
            } catch (e) {
              // If we can't verify, clear session to be safe
              sessionStorage.removeItem(authKey);
              setIsAuthenticated(false);
              return;
            }
            
            setIsAuthenticated(true);
            loadData(data.token);
          }
        } else {
          setError("No access token found");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      }
    };

    loadToken();
  }, []);

  useEffect(() => {
    if (meetings.length > 0 || documents.length > 0) {
      organizeSections();
    }
  }, [meetings, documents]);

  const organizeSections = () => {
    // Get all unique sections
    const sectionNames = new Set<string>();
    meetings.forEach((m) => {
      if (m.section) sectionNames.add(m.section);
    });
    documents.forEach((d) => {
      if (d.section) sectionNames.add(d.section);
    });

    // If no sections, create a default one
    if (sectionNames.size === 0) {
      sectionNames.add("All Content");
    }

    const sectionsData: SectionData[] = Array.from(sectionNames).map((sectionName) => {
      const sectionVideos = meetings.filter((m) => (m.section || "All Content") === sectionName);
      const sectionDocs = documents.filter((d) => (d.section || "All Content") === sectionName);

      // Set default tab for this section
      if (!activeTabs[sectionName]) {
        setActiveTabs((prev) => ({
          ...prev,
          [sectionName]: sectionVideos.length > 0 ? "video" : "document",
        }));
      }

      return {
        name: sectionName,
        videos: sectionVideos,
        documents: sectionDocs,
      };
    });

    setSections(sectionsData);
  };

  const loadData = async (tokenValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/trainings/public/${tokenValue}`);
      if (!res.ok) {
        throw new Error("Failed to load content");
      }
      const data = await res.json();
      setMeetings(data.videos || []);
      setDocuments(data.documents || []);
    } catch (e: any) {
      setError(e?.message || "Failed to load content");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/trainings/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid password");
      }

      // Store authentication in sessionStorage with password timestamp
      const authData = await res.json();
      const authKey = `meetings_auth_${token}`;
      sessionStorage.setItem(authKey, JSON.stringify({ 
        authenticated: true, 
        passwordUpdatedAt: authData.passwordUpdatedAt 
      }));
      setIsAuthenticated(true);
      await loadData(token);
    } catch (e: any) {
      setError(e?.message || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  const filterBySearch = <T extends Meeting | Document>(items: T[]): T[] => {
    if (!searchQuery) return items;
    return items.filter((item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  // Loading or no token state
  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-purple-200">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Unending praise" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#54037C] mb-2">Trainings & Resources</h1>
            <p className="text-gray-600 text-sm">
              {error ? error : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Password prompt
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-purple-200">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Unending praise" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#54037C] mb-2">Trainings & Resources</h1>
            <p className="text-gray-600 text-sm">Enter password to access</p>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#54037C]"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-lg font-semibold transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Access Content"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main trainings page - same layout as Meetings
  return (
    <div className="min-h-screen bg-white">
      {/* Header Section - Below Navbar, centered */}
      <div className="pt-32 pb-8">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="flex items-center justify-center gap-6 relative">
            {/* Title - Centered */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 uppercase tracking-wide text-center">
              TRAINING & RESOURCES
            </h1>

            {/* Search Icon/Bar - Same line, positioned to the right */}
            <div className="absolute right-0">
              <AnimatePresence mode="wait">
                {!isSearchOpen ? (
                  <motion.button
                    key="search-icon"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setIsSearchOpen(true)}
                    className="p-3 bg-white rounded-full shadow-md hover:shadow-lg transition-all hover:scale-110"
                    aria-label="Open search"
                  >
                    <Search className="w-6 h-6 text-[#54037C]" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="search-bar"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 400, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="relative overflow-hidden"
                  >
                    <div className="relative w-[400px]">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 w-5 h-5 pointer-events-none z-10" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => {
                          // Keep search open if there's a query, close if empty
                          if (!searchQuery) {
                            setIsSearchOpen(false);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            setSearchQuery('');
                            setIsSearchOpen(false);
                          }
                        }}
                        placeholder="Search training videos and resources..."
                        className="w-full pl-12 pr-4 py-3 bg-white rounded-full border-2 border-[#54037C]/20 focus:outline-none focus:ring-2 focus:ring-[#54037C]/50 focus:border-[#54037C] text-gray-800 placeholder-gray-500 shadow-lg"
                        autoFocus
                      />
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                        aria-label="Close search"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 pb-16">
        {loading && meetings.length === 0 && documents.length === 0 ? (
          <div className="text-center py-16 text-gray-500">Loading content...</div>
        ) : error ? (
          <div className="text-center py-16 text-red-500">{error}</div>
        ) : sections.length === 0 ? (
          <div className="text-center py-16 text-gray-500">No content available.</div>
        ) : (
          <div className="space-y-12">
            {sections.map((section) => {
              const activeTab = activeTabs[section.name] || "video";
              const filteredVideos: Meeting[] = filterBySearch(section.videos);
              const filteredDocs: Document[] = filterBySearch(section.documents);

              return (
                <div key={section.name} className="space-y-4">
                  {/* Section Header */}
                  <div className="flex items-center justify-between border-b-2 border-gray-300 pb-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">{section.name}</h2>
                    <button className="text-[#54037C] hover:text-[#8A4EBF] font-semibold text-sm">
                      VIEW ALL →
                    </button>
                  </div>

                  {/* Tabs - Like Songs of the Day */}
                  <div className="flex justify-center">
                    <div className="px-1 py-1 rounded-full bg-black/5">
                      <button
                        onClick={() =>
                          setActiveTabs((prev) => ({ ...prev, [section.name]: "video" }))
                        }
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                          activeTab === "video"
                            ? "bg-[#54037C]/70 text-white"
                            : "text-black/60"
                        }`}
                      >
                        VIDEO
                      </button>
                      <button
                        onClick={() =>
                          setActiveTabs((prev) => ({ ...prev, [section.name]: "document" }))
                        }
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                          activeTab === "document"
                            ? "bg-[#54037C]/70 text-white"
                            : "text-black/60"
                        }`}
                      >
                        DOCUMENT
                      </button>
                    </div>
                  </div>

                  {/* Content Grid */}
                  {activeTab === "video" ? (
                    filteredVideos.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No videos in this section.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVideos.map((meeting) => (
                          <div
                            key={meeting.id}
                            onClick={() => navigate(`/trainings/video/${meeting.id}`)}
                            className="rounded-xl overflow-hidden transition-all cursor-pointer transform hover:scale-105"
                          >
                            {/* Thumbnail */}
                            <div className="relative w-full aspect-video bg-gray-200 overflow-hidden rounded-xl">
                              {meeting.thumbnail_url ? (
                                <img
                                  src={meeting.thumbnail_url}
                                  alt={meeting.title}
                                  className="w-full h-full object-cover rounded-xl"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                                  <Video className="w-16 h-16 text-purple-400" />
                                </div>
                              )}
                              {/* Play overlay */}
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-xl">
                                <div className="bg-white/90 rounded-full p-4">
                                  <svg
                                    className="w-12 h-12 text-[#54037C]"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M8 5v14l11-7z" />
                                  </svg>
                                </div>
                              </div>
                            </div>

                            {/* Title */}
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-800 line-clamp-2">{meeting.title}</h3>
                              {meeting.created_at && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(meeting.created_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    filteredDocs.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">No documents in this section.</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocs.map((doc) => (
                          <div
                            key={doc.id}
                            onClick={() => navigate(`/trainings/document/${doc.id}`)}
                            className="rounded-xl overflow-hidden transition-all cursor-pointer transform hover:scale-105"
                          >
                            {/* Document Icon */}
                            <div className="relative w-full aspect-video bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center rounded-xl">
                              <FileText className="w-20 h-20 text-purple-400" />
                              <div className="absolute bottom-2 right-2 bg-[#54037C] text-white px-2 py-1 rounded text-xs">
                                {doc.document_type?.toUpperCase() || "DOC"}
                              </div>
                            </div>

                            {/* Title */}
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-800 line-clamp-2">{doc.title}</h3>
                              {doc.created_at && (
                                <p className="text-xs text-gray-500 mt-2">
                                  {new Date(doc.created_at).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
