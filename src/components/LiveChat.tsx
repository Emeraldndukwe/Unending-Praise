import { useEffect, useState, type FormEvent } from "react";
import { User, Send } from "lucide-react";

interface Message {
  id?: string;
  text: string;
  fromMe?: boolean;
  createdAt?: string;
}

export default function LiveChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Load messages from backend
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const res = await fetch('/api/livechat');
        if (res.ok) {
          const data = await res.json();
          setMessages(data || []);
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
      }
    };
    loadMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const messageText = input.trim();
    setInput("");
    setLoading(true);

    try {
      const res = await fetch('/api/livechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: messageText, fromMe: true }),
      });
      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
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
      <h2 className="font-bold text-sm text-black/70 mb-2">Live Chat</h2>

      {/* ✅ CHAT LIST */}
      <div className="flex-1 overflow-y-auto space-y-2 pb-2  bg-[#54037C]/5 rounded-2xl p-3">
        {messages.map((m) => (
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
        ))}
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
