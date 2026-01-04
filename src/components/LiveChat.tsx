import { useEffect, useRef, useState, type FormEvent } from "react";
import { User, Send } from "lucide-react";

interface Message {
  id?: string;
  text: string;
  fromMe?: boolean;
  createdAt?: string;
}

interface LiveChatProps {
  eventId?: string;
}

export default function LiveChat({ eventId }: LiveChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  // Connect via WebSocket; fallback to polling if WS fails
  useEffect(() => {
    const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
    const host = location.hostname;
    const port = location.port || (location.protocol === 'https:' ? '' : '5000');
    const base = port ? `${host}:${port}` : host;
    const wsPath = eventId ? `/ws/livechat/${eventId}` : '/ws/livechat';
    const wsUrl = `${protocol}://${base}${wsPath}`;

    let pollInterval: number | null = null;

    const startPolling = () => {
      const loadMessages = async () => {
        try {
          const url = eventId ? `/api/livechat/${eventId}` : '/api/livechat';
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setMessages(data || []);
          }
        } catch {}
      };
      loadMessages();
      pollInterval = window.setInterval(loadMessages, 3000);
    };

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => setConnected(true);
      ws.onclose = () => setConnected(false);
      ws.onerror = () => {
        setConnected(false);
      };
      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          if (data?.type === 'init' && Array.isArray(data.messages)) {
            setMessages(data.messages);
          } else if (data?.type === 'new_message' && data.message) {
            setMessages((prev) => [...prev, data.message]);
          }
        } catch {}
      };
      // Fallback to polling if WS doesn't open within 2s
      const t = window.setTimeout(() => {
        if (ws.readyState !== WebSocket.OPEN) {
          try { ws.close(); } catch {}
          startPolling();
        }
      }, 2000);
      return () => {
        window.clearTimeout(t);
        if (pollInterval) window.clearInterval(pollInterval);
        try { ws.close(); } catch {}
      };
    } catch {
      startPolling();
      return () => { if (pollInterval) window.clearInterval(pollInterval); };
    }
  }, [eventId]);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageText = input.trim();
    setInput("");
    setLoading(true);

    try {
      // Prefer WebSocket if connected
      if (connected && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text: messageText, fromMe: true, eventId }));
      } else {
        const url = eventId ? `/api/livechat/${eventId}` : '/api/livechat';
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: messageText, fromMe: true }),
        });
        if (res.ok) {
          const newMessage = await res.json();
          setMessages((prev) => [...prev, newMessage]);
        }
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Re-add input on error
      setInput(messageText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border border-[#E2B6FF] rounded-3xl p-4 bg-white">
      <h2 className="font-bold text-sm text-black/70 mb-2">Live Comment</h2>

      {/* ✅ CHAT LIST */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-2 bg-[#54037C]/5 rounded-2xl p-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            No comments yet. Be the first to comment!
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id || Math.random()}
              className={`flex items-start gap-2 w-full ${
                m.fromMe ? "justify-end" : "justify-start"
              }`}
            >
              <div className={`flex items-start gap-2 ${m.fromMe ? "flex-row-reverse" : ""}`}>
                {/* ✅ Icon stays visible, never shrinks */}
                <User size={18} className="text-purple-900 flex-shrink-0" />

                {/* ✅ Text wraps properly */}
                <p className="text-sm leading-tight max-w-[80%] break-words">
                  {m.text}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ✅ INPUT BAR */}
      <form
        onSubmit={sendMessage}
        className="mt-2 flex items-center bg-gray-200 rounded-full px-3 py-2"
      >
        <input
          className="flex-1 bg-transparent outline-none text-sm text-black"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <button type="submit" className="text-purple-800 hover:text-purple-600">
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
