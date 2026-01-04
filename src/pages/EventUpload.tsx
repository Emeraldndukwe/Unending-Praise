import { useState, useEffect, useMemo } from "react";

type StreamEvent = {
  id: string;
  name: string;
  streamUrl?: string;
  embedLink?: string;
  date?: string;
  description?: string;
  isActive: boolean;
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
  const [formData, setFormData] = useState({
    name: "",
    streamUrl: "",
    embedLink: "",
    date: "",
    description: "",
    isActive: true,
  });

  useEffect(() => {
    if (!token) {
      // Prompt for login if not authenticated
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
    setFormData({
      name: "",
      streamUrl: "",
      embedLink: "",
      date: "",
      description: "",
      isActive: true,
    });
  };

  const handleEdit = (event: StreamEvent) => {
    setEditingId(event.id);
    setFormData({
      name: event.name || "",
      streamUrl: event.streamUrl || "",
      embedLink: event.embedLink || "",
      date: event.date || "",
      description: event.description || "",
      isActive: event.isActive,
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
            embedLink: formData.embedLink || null,
            date: formData.date || null,
            description: formData.description || null,
            isActive: formData.isActive,
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
            embedLink: formData.embedLink || null,
            date: formData.date || null,
            description: formData.description || null,
            isActive: formData.isActive,
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
      <div className="min-h-screen bg-[#FFF5E6] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access the Event Upload page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF5E6] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Event Upload</h1>
          <p className="text-gray-600">Manage upcoming streams and embed links</p>
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
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                placeholder="e.g., PASTOR CHRIS LIVE UNENDING PRAISE ONLINE CRUSADE"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Stream URL
              </label>
              <input
                type="url"
                value={formData.streamUrl}
                onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                placeholder="https://example.com/stream"
              />
              <p className="mt-1 text-sm text-gray-500">URL to redirect to when "Watch Live" is clicked</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Embed Link
              </label>
              <textarea
                value={formData.embedLink}
                onChange={(e) => setFormData({ ...formData, embedLink: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                rows={4}
                placeholder="Paste embed code (iframe) here"
              />
              <p className="mt-1 text-sm text-gray-500">Embed code for the stream (iframe)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#54037C] focus:border-transparent"
                rows={3}
                placeholder="Event description"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-[#54037C] border-gray-300 rounded focus:ring-[#54037C]"
              />
              <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                Active (only one active event will be shown on the Event page)
              </label>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#54037C] text-white rounded-lg font-semibold hover:bg-[#43025f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Saving..." : editingId ? "Update Event" : "Create Event"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Events List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">All Events</h2>
            <button
              onClick={refresh}
              disabled={loading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {loading && events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No events found. Create one above.</div>
          ) : (
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`border rounded-xl p-4 ${event.isActive ? "border-green-300 bg-green-50" : "border-gray-200"}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold text-gray-800">{event.name}</h3>
                        {event.isActive && (
                          <span className="px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded">
                            ACTIVE
                          </span>
                        )}
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
                      {event.embedLink && (
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Embed Link:</span>{" "}
                          <span className="font-mono text-xs">{event.embedLink.substring(0, 50)}...</span>
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

