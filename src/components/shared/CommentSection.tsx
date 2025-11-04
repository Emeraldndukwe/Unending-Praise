import { useEffect, useState, FormEvent } from "react";

interface Comment {
  id: string;
  name: string;
  comment: string;
  createdAt?: string;
}

interface CommentSectionProps {
  entityType: "testimony" | "crusade";
  entityId: string;
}

export default function CommentSection({ entityType, entityId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch(`/api/comments/${entityType}/${entityId}`)
      .then((res) => res.json())
      .then((data: Comment[]) => {
        if (!isMounted) return;
        setComments(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [entityType, entityId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${entityType}/${entityId}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: name.trim(), comment: text.trim() }),
      });
      if (!res.ok) throw new Error("Failed to submit comment");
      const created: Comment = await res.json();
      setComments((prev) => [created, ...prev]);
      setName("");
      setText("");
    } catch (err) {
      setError("Could not post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 border-t pt-6">
      <h2 className="text-lg md:text-xl font-semibold tracking-wide mb-6">
        COMMENTS <span className="text-gray-600">({comments.length})</span>
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-6 pr-4">
          {loading ? (
            <div className="text-gray-600 text-sm">Loading comments…</div>
          ) : comments.length === 0 ? (
            <div className="text-gray-600 text-sm">Be the first to comment.</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="text-gray-900 text-sm md:text-base">
                <p className="font-medium">{c.name}</p>
                <p className="text-gray-700 leading-relaxed">{c.comment}</p>
                <hr className="mt-3" />
              </div>
            ))
          )}
        </div>

        <div>
          <h3 className="font-semibold text-center md:text-left mb-4 uppercase text-sm tracking-wide">
            POST A COMMENT
          </h3>

          {error && (
            <div className="mb-3 text-sm text-red-600">{error}</div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold mb-1">NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl bg-purple-100 p-3 focus:ring-2 focus:ring-black focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">COMMENT</label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full h-40 rounded-xl bg-purple-100 p-3 resize-none focus:ring-2 focus:ring-black focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="bg-black text-white w-full py-3 rounded-xl text-sm hover:bg-gray-900 transition disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
