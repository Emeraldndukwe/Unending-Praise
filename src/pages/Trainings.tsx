import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Trainings() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the access token
    const loadToken = async () => {
      try {
        const res = await fetch("/api/meetings/token");
        if (!res.ok) {
          throw new Error("Failed to load access token");
        }
        const data = await res.json();
        if (data.token) {
          setToken(data.token);
        } else {
          setError("No access token found");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      }
    };

    loadToken();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/meetings/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, token }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Invalid password");
      }

      // Store authentication in sessionStorage
      const authKey = `meetings_auth_${token}`;
      sessionStorage.setItem(authKey, "true");
      navigate(`/meetings/${token}`);
    } catch (e: any) {
      setError(e?.message || "Invalid password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-purple-200">
          <div className="text-center mb-8">
            <img src="/logo.png" alt="Unending praise" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-[#54037C] mb-2">Trainings and Recordings</h1>
            <p className="text-gray-600 text-sm">
              {error ? error : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-purple-200">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Unending praise" className="h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#54037C] mb-2">Trainings and Recordings</h1>
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
