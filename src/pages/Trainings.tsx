import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Trainings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get the access token and redirect to meetings page
    const loadToken = async () => {
      try {
        const res = await fetch("/api/meetings/token");
        if (!res.ok) {
          throw new Error("Failed to load access token");
        }
        const data = await res.json();
        if (data.token) {
          navigate(`/meetings/${data.token}`);
        } else {
          setError("No access token found");
          setLoading(false);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load");
        setLoading(false);
      }
    };

    loadToken();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#54037C] text-xl">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl">{error}</div>
        </div>
      </div>
    );
  }

  return null;
}

