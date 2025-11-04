import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Song = { id: string; title?: string; artist?: string; lyrics?: string; date?: string; createdAt: string };

export default function SongList() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/songs');
        if (!res.ok) return;
        const data: Song[] = await res.json();
        // Compute today's local date as YYYY-MM-DD
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const today = `${yyyy}-${mm}-${dd}`;
        const todaysSongs = data.filter(s => (s.date || '').slice(0, 10) === today);
        if (!cancelled) setSongs(todaysSongs);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  const toggleSong = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="rounded-2xl p-4 md:p-5 backdrop-blur-sm bg-white/70 h-full">
      <h2 className="text-center text-lg md:text-xl font-bold mb-4 text-gray-900">
        Song of the Day
      </h2>

      <div className="space-y-2">
        {songs.length === 0 && (
          <div className="text-sm text-gray-600">No songs set for today.</div>
        )}
        {songs.map((song, index) => (
          <div key={index} className="border-b border-black/10 pb-3">
            <div
              className="flex justify-between items-start cursor-pointer gap-4"
              onClick={() => toggleSong(index)}
            >
              <div className="min-w-0">
                <div className="font-semibold text-gray-900 truncate">{song.title}</div>
                <div className="text-sm text-gray-600">{song.artist}</div>
              </div>

              <motion.span
                animate={{ rotate: openIndex === index ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-gray-700 ml-3"
              >
                ▼
              </motion.span>
            </div>

            <AnimatePresence initial={false}>
              {openIndex === index && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden mt-2"
                >
                  <p className="text-sm text-gray-700 leading-relaxed border-t pt-2">{song.lyrics}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
