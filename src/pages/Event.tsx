import { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";

type StreamEvent = {
  id: string;
  name: string;
  streamUrl?: string;
  date?: string;
  description?: string;
};

export default function Event() {
  const [streamEvent, setStreamEvent] = useState<StreamEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Fetch stream event from API
    // For now, using mock data
    setTimeout(() => {
      setStreamEvent({
        id: "1",
        name: "PASTOR CHRIS LIVE UNENDING PRAISE ONLINE CRUSADE",
        streamUrl: "/",
        date: "2025-01-15",
        description: "Join us for an amazing time of worship and praise"
      });
      setLoading(false);
    }, 100);
  }, []);

  const handleWatchLive = () => {
    if (streamEvent?.streamUrl) {
      window.location.href = streamEvent.streamUrl;
    } else {
      // Default to home page where livestream is
      window.location.href = "/";
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FFF5E6]">
      {/* Banner Section */}
      <div className="relative w-full bg-[#FFF5E6] py-16 md:py-24 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Top Text - UPCOMING STREAM */}
          <div className="text-left mb-6">
            <p className="text-xs md:text-sm font-medium text-black uppercase tracking-wider">
              UPCOMING STREAM
            </p>
          </div>

          {/* Main Stream Name */}
          <div className="text-left mb-10">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-black leading-tight">
              {loading ? "Loading..." : (streamEvent?.name || "No upcoming stream")}
            </h1>
          </div>

          {/* Watch Live Button */}
          <div className="text-left">
            <button
              onClick={handleWatchLive}
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-sm md:text-base transition-all duration-300 shadow-md hover:shadow-lg"
            >
              WATCH LIVE
              <ArrowUpRight size={18} className="inline" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Additional Content Section - can be expanded later */}
      {streamEvent && (
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-12">
          {streamEvent.description && (
            <div className="text-center text-gray-700 text-lg">
              <p>{streamEvent.description}</p>
            </div>
          )}
          {streamEvent.date && (
            <div className="text-center text-gray-600 mt-4">
              <p>Date: {new Date(streamEvent.date).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

