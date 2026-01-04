import { useState, useEffect } from "react";
import { ArrowUpRight } from "lucide-react";

type StreamEvent = {
  id: string;
  name: string;
  streamUrl?: string;
  imageUrl?: string;
  date?: string;
  description?: string;
};

// Helper function to format date as "12TH JANUARY"
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  
  // Add ordinal suffix
  const getOrdinal = (n: number): string => {
    const s = ["TH", "ST", "ND", "RD"];
    const v = n % 100;
    return n.toString() + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  
  return `${getOrdinal(day)} ${month}`;
}

export default function Event() {
  const [streamEvent, setStreamEvent] = useState<StreamEvent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await fetch("/api/stream-events/active");
        if (response.ok) {
          const data = await response.json();
          setStreamEvent(data);
        } else {
          setStreamEvent(null);
        }
      } catch (error) {
        console.error("Failed to fetch stream event:", error);
        setStreamEvent(null);
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
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
      {/* Banner Section with Background Image */}
      <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        {/* Background Image */}
        {streamEvent?.imageUrl ? (
          <img
            src={streamEvent.imageUrl}
            alt={streamEvent.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#54037C] via-[#6f3aa6] to-[#8A4EBF]" />
        )}
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content at Bottom Left */}
        <div className="absolute bottom-0 left-0 p-6 md:p-8 lg:p-12 text-white">
          {/* UPCOMING STREAM with Date */}
          <div className="mb-4">
            <p className="text-sm md:text-base font-medium uppercase tracking-wider">
              {loading ? "UPCOMING STREAM" : streamEvent?.date 
                ? `UPCOMING STREAM ${formatDate(streamEvent.date)}`
                : "UPCOMING STREAM"}
            </p>
          </div>

          {/* Main Stream Name - Smaller Text */}
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight max-w-3xl">
              {loading ? "Loading..." : (streamEvent?.name || "No upcoming stream")}
            </h1>
          </div>

          {/* Watch Live Button */}
          <button
            onClick={handleWatchLive}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 md:px-8 md:py-4 rounded-full font-semibold text-sm md:text-base transition-all duration-300 shadow-md hover:shadow-lg"
          >
            WATCH LIVE
            <ArrowUpRight size={18} className="inline" strokeWidth={2.5} />
          </button>
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

