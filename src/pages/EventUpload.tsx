import { useState, useEffect, useMemo, useCallback } from "react";
import { compressImage } from "../utils/mediaOptimizer";

type StreamEvent = {
  id: string;
  name: string;
  streamUrl?: string;
  imageUrl?: string;
  date?: string;
  startTime?: string;
  description?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

function useAuthToken() {
  const [token, setToken] = useState<string>(() => localStorage.getItem("authToken") || "");
  const save = (t: string) => {
    setToken(t);
    if (t) localStorage.setItem("authToken", t);
    else localStorage.removeItem("authToken");
  };
  const headers = useMemo<Record<string, string>>(
    () => (token ? { Authorization: `Bearer ${token}` } : ({} as Record<string, string>)),
    [token]
  );
  return { token, setToken: save, headers: headers as HeadersInit };
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return undefined as T;
  return res.json();
}

export default function EventUpload() {
  const { token, setToken, headers } = useAuthToken();
  const [events, setEvents] = useState<StreamEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    streamUrl: "",
    imageUrl: "",
    date: "",
    startTime: "",
    description: "",
    displayOrder: 0,
  });

  const uploadMedia = useCallback(
    async (dataUrl: string) => {
      if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
      const authHeaders: Record<string, string> = {};
      const headerSource = headers as HeadersInit;
      if (headerSource instanceof Headers) {
        headerSource.forEach((value, key) => {
          authHeaders[key] = value;
        });
      } else if (Array.isArray(headerSource)) {
        headerSource.forEach(([key, value]) => {
          authHeaders[key] = value;
        });
      } else if (headerSource && typeof headerSource === 'object') {
        Object.assign(authHeaders, headerSource as Record<string, string>);
      }

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { ...authHeaders, 'content-type': 'application/json' },
        body: JSON.stringify({ dataUrl, folder: 'unendingpraise/events' }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Upload failed');
      }

      const payload = await res.json();
      return (payload?.url as string) || dataUrl;
    },
    [headers]
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    try {
      setLoading(true);
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      const uploaded = await uploadMedia(compressed);
      setFormData({ ...formData, imageUrl: uploaded });
      setImagePreview(uploaded);
    } catch (err: any) {
      console.error('Image upload failed', err);
      alert(`Error uploading image: ${err?.message || 'Upload failed'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) {
      const email = prompt("Email:");
      const password = prompt("Password:");
      if (email && password) {
        login(email, password);
      }
    } else {
      refresh();
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error("Login failed");
      const { token: t } = await res.json();
      setToken(t);
    } catch (e: any) {
      alert("Login failed: " + (e?.message || "Unknown error"));
    }
  };

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<StreamEvent[]>("/api/stream-events", { headers });
      setEvents(data);
    } catch (e: any) {
      setError(e?.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setImagePreview("");
    setFormData({
      name: "",
      streamUrl: "",
      imageUrl: "",
      date: "",
      startTime: "",
      description: "",
      displayOrder: 0,
    });
  };

  const handleEdit = (event: StreamEvent) => {
    setEditingId(event.id);
    setImagePreview(event.imageUrl || "");
    setFormData({
      name: event.name || "",
      streamUrl: event.streamUrl || "",
      imageUrl: event.imageUrl || "",
      date: event.date || "",
      startTime: event.startTime || "",
      description: event.description || "",
      displayOrder: event.displayOrder || 0,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (editingId) {
        await api(`/api/stream-events/${editingId}`, {
          method: "PUT",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            streamUrl: formData.streamUrl || null,
            imageUrl: formData.imageUrl || null,
            date: formData.date || null,
            description: formData.description || null,
            displayOrder: formData.displayOrder,
          }),
        });
        setSuccess("Event updated successfully!");
      } else {
        await api("/api/stream-events", {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            streamUrl: formData.streamUrl || null,
            imageUrl: formData.imageUrl || null,
            date: formData.date || null,
            description: formData.description || null,
            displayOrder: formData.displayOrder,
          }),
        });
        setSuccess("Event created successfully!");
      }
      resetForm();
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to save event");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    setLoading(true);
    setError(null);
    try {
      await api(`/api/stream-events/${id}`, {
        method: "DELETE",
        headers,
      });
      setSuccess("Event deleted successfully!");
      await refresh();
    } catch (e: any) {
      setError(e?.message || "Failed to delete event");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] to-white flex items-center justify-center px-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-8 max-w-md w-full border border-[#54037C]/10">
          <h2 className="text-2xl font-bold text-[#54037C] mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the Event Upload page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAF9F6] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-[#54037C]/10">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#54037C] mb-2">Event Upload</h1>
              <p className="text-gray-600 text-sm">Manage upcoming streams and events</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium transition text-sm" 
                onClick={() => { setToken(""); }}
              >
                Logout
              </button>
              <button 
                className="px-4 py-2 rounded-xl bg-[#54037C] hover:bg-[#54037C]/90 text-white font-medium transition text-sm shadow-md" 
                onClick={refresh}
                disabled={loading}
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4">
            {success}
          </div>
        )}

        {/* Form */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8 mb-6 border border-[#54037C]/10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {editingId ? "Edit Event" : "Create New Event"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                placeholder="e.g., PASTOR CHRIS LIVE UNENDING PRAISE ONLINE CRUSADE"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Background Image / Thumbnail
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent text-sm"
              />
              {imagePreview && (
                <div className="mt-2">
                  <img src={imagePreview} alt="Preview" className="max-w-xs h-32 object-cover rounded-lg border border-gray-300" />
                </div>
              )}
              <p className="mt-1 text-sm text-gray-500">Upload image for banner background and video thumbnail</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stream/Video URL
              </label>
              <input
                type="url"
                value={formData.streamUrl}
                onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
              />
              <p className="mt-1 text-sm text-gray-500">YouTube, Vimeo, or other video URL (will auto-embed)</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">Time when the stream starts</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                rows={3}
                placeholder="Event description"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                placeholder="0"
              />
              <p className="mt-1 text-sm text-gray-500">Lower numbers appear first. Events are automatically active until deleted or after the date has passed.</p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#54037C] hover:bg-[#54037C]/90 text-white rounded-xl font-semibold transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : editingId ? "Update Event" : "Create Event"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Events List */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 md:p-8 border border-[#54037C]/10">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">All Events</h2>

          {loading && events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No events found. Create one above.</div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`border rounded-xl p-4 ${(!event.date || new Date(event.date) >= new Date()) ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-800">{event.name}</h3>
                        {(!event.date || new Date(event.date) >= new Date()) && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                            ACTIVE
                          </span>
                        )}
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded">
                          Order: {event.displayOrder}
                        </span>
                      </div>
                      {event.date && (
                        <p className="text-sm text-gray-600 mb-1">
                          Date: {new Date(event.date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      )}
                      {event.description && (
                        <p className="text-gray-700 mb-2">{event.description}</p>
                      )}
                      {event.streamUrl && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-semibold">Stream URL:</span>{" "}
                          <a href={event.streamUrl} target="_blank" rel="noopener noreferrer" className="text-[#54037C] hover:underline">
                            {event.streamUrl}
                          </a>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleEdit(event)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(event.id)}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
